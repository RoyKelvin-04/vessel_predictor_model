// Multiple linear regression for vessel turnaround prediction.
// Fitted in the browser on the loaded dataset with one-hot encoded categorical
// variables (vesselType, berth). No external ML API.
//
// Structure:
//   buildFeatureVector(record) — turn a port call / form input into a numeric vector
//   trainModel(records)        — fit regression weights via normal equations
//   predict(input, model)      — return predicted wait & service hours + explanation
//   evaluateModel(records)     — 80/20 hold-out split → MAE and R²
//
// The model object returned by trainModel is self-contained (weights + feature
// schema), so it can later be replaced by a pre-trained model or API response
// with the same shape.

const VESSEL_TYPES = ['Container', 'Bulk Carrier', 'Tanker', 'General Cargo', 'Ro-Ro'];
const BERTHS = ['B1', 'B2', 'B3', 'B4', 'B5', 'B6'];

// Feature names in canonical order.  Order matters: index i in the weight
// vector must line up with index i in the feature vector.
const FEATURE_NAMES = [
  // continuous
  'lengthM',
  'cargoTonnes',
  'queueLengthAtArrival',
  'weatherDelay',
  // one-hot: vesselType (5 categories, 5 dummies — no drop, includes intercept)
  ...VESSEL_TYPES.map((t) => `type_${t}`),
  // one-hot: berth (6 dummies)
  ...BERTHS.map((b) => `berth_${b}`),
];

const NUM_FEATURES = FEATURE_NAMES.length;

// Convert a record or form input into a numeric feature vector.
function buildFeatureVector(rec) {
  const v = new Array(NUM_FEATURES).fill(0);
  v[0] = Number(rec.lengthM) || 0;
  v[1] = Number(rec.cargoTonnes) || 0;
  v[2] = Number(rec.queueLengthAtArrival) || 0;
  v[3] = rec.weatherDelay ? 1 : 0;
  VESSEL_TYPES.forEach((t, i) => {
    if (rec.vesselType === t) v[4 + i] = 1;
  });
  BERTHS.forEach((b, i) => {
    if (rec.berth === b) v[4 + VESSEL_TYPES.length + i] = 1;
  });
  return v;
}

// Solve OLS via normal equations: w = (XᵀX)⁻¹ Xᵀy
// Small matrix math utilities (no external dependency).
function matMul(A, B) {
  const aRows = A.length, aCols = A[0].length, bCols = B[0].length;
  const out = Array.from({ length: aRows }, () => new Array(bCols).fill(0));
  for (let i = 0; i < aRows; i++)
    for (let k = 0; k < aCols; k++) {
      const a = A[i][k];
      if (a === 0) continue;
      for (let j = 0; j < bCols; j++) out[i][j] += a * B[k][j];
    }
  return out;
}

function matVec(A, x) {
  return A.map((row) => row.reduce((s, v, i) => s + v * x[i], 0));
}

function transpose(A) {
  return A[0].map((_, i) => A.map((row) => row[i]));
}

// Gauss-Jordan inverse for a square matrix (ridge-regularized to stay stable)
function inverse(M, ridge = 1e-6) {
  const n = M.length;
  const aug = M.map((row, i) => [
    ...row.map((v) => v),
    ...Array.from({ length: n }, (_, j) => (i === j ? 1 : 0)),
  ]);
  // add ridge to diagonal for numerical stability
  for (let i = 0; i < n; i++) aug[i][i] += ridge;

  for (let col = 0; col < n; col++) {
    // pivot
    let pivot = col;
    for (let r = col + 1; r < n; r++)
      if (Math.abs(aug[r][col]) > Math.abs(aug[pivot][col])) pivot = r;
    [aug[col], aug[pivot]] = [aug[pivot], aug[col]];
    const pv = aug[col][col];
    if (Math.abs(pv) < 1e-12) throw new Error('Matrix is singular; cannot invert.');
    for (let j = 0; j < 2 * n; j++) aug[col][j] /= pv;
    for (let r = 0; r < n; r++) {
      if (r === col) continue;
      const factor = aug[r][col];
      for (let j = 0; j < 2 * n; j++) aug[r][j] -= factor * aug[col][j];
    }
  }
  return aug.map((row) => row.slice(n));
}

// Train two separate regressions: one for waitHours, one for serviceHours.
// turnaround = wait + service, so we predict each component independently
// (the factors that drive waiting are different from those that drive service).
function trainModel(records) {
  const X = records.map(buildFeatureVector);
  // Add bias column
  const Xb = X.map((row) => [1, ...row]);
  const Xt = transpose(Xb);
  const XtX = matMul(Xt, Xb);

  const yWait = records.map((r) => Number(r.waitHours) || 0);
  const yService = records.map((r) => Number(r.serviceHours) || 0);

  const XtXinv = inverse(XtX);
  const weightsWait = matVec(matMul(XtXinv, Xt), yWait);
  const weightsService = matVec(matMul(XtXinv, Xt), yService);

  return {
    featureNames: FEATURE_NAMES,
    weightsWait,
    weightsService,
    vesselTypes: VESSEL_TYPES,
    berths: BERTHS,
    trainedOn: records.length,
  };
}

function dotWithBias(features, weights) {
  let s = weights[0]; // intercept
  for (let i = 0; i < features.length; i++) s += features[i] * weights[i + 1];
  return s;
}

// Predict wait, service, and total turnaround for a single input.
// Also produces a plain-language explanation of which inputs pushed the
// estimate up or down, by looking at each feature's contribution.
function predict(input, model) {
  const features = buildFeatureVector(input);
  const predWait = Math.max(0, dotWithBias(features, model.weightsWait));
  const predService = Math.max(0, dotWithBias(features, model.weightsService));
  const predTotal = predWait + predService;

  // Explanation: rank feature contributions
  const contributions = [];
  contributions.push({
    label: `Vessel type: ${input.vesselType}`,
    wait: model.weightsWait[1 + FEATURE_NAMES.indexOf(`type_${input.vesselType}`)] || 0,
    service: model.weightsService[1 + FEATURE_NAMES.indexOf(`type_${input.vesselType}`)] || 0,
  });
  contributions.push({
    label: `Berth: ${input.berth}`,
    wait: model.weightsWait[1 + FEATURE_NAMES.indexOf(`berth_${input.berth}`)] || 0,
    service: model.weightsService[1 + FEATURE_NAMES.indexOf(`berth_${input.berth}`)] || 0,
  });
  contributions.push({
    label: `Vessel length (${input.lengthM} m)`,
    wait: (model.weightsWait[1 + 0] || 0) * (Number(input.lengthM) || 0),
    service: (model.weightsService[1 + 0] || 0) * (Number(input.lengthM) || 0),
  });
  contributions.push({
    label: `Cargo (${Number(input.cargoTonnes).toLocaleString()} t)`,
    wait: (model.weightsWait[1 + 1] || 0) * (Number(input.cargoTonnes) || 0),
    service: (model.weightsService[1 + 1] || 0) * (Number(input.cargoTonnes) || 0),
  });
  contributions.push({
    label: `Queue length at arrival (${input.queueLengthAtArrival})`,
    wait: (model.weightsWait[1 + 2] || 0) * (Number(input.queueLengthAtArrival) || 0),
    service: (model.weightsService[1 + 2] || 0) * (Number(input.queueLengthAtArrival) || 0),
  });
  contributions.push({
    label: `Weather delay: ${input.weatherDelay ? 'Yes' : 'No'}`,
    wait: (model.weightsWait[1 + 3] || 0) * (input.weatherDelay ? 1 : 0),
    service: (model.weightsService[1 + 3] || 0) * (input.weatherDelay ? 1 : 0),
  });

  // Build explanation sorted by absolute total contribution
  const explanation = contributions
    .map((c) => ({ ...c, total: c.wait + c.service }))
    .sort((a, b) => Math.abs(b.total) - Math.abs(a.total))
    .map((c) => {
      const dir = c.total > 0.5 ? 'increased' : c.total < -0.5 ? 'reduced' : 'had minimal effect on';
      return `${c.label} ${dir} the estimate by ${Math.abs(c.total).toFixed(1)} h.`;
    });

  return {
    predictedWaitHours: Math.round(predWait * 10) / 10,
    predictedServiceHours: Math.round(predService * 10) / 10,
    predictedTurnaroundHours: Math.round(predTotal * 10) / 10,
    explanation,
  };
}

// 80/20 hold-out split → MAE and R² for both wait and service predictions.
function evaluateModel(records) {
  // deterministic shuffle for reproducible splits
  const indexed = records.map((_, i) => i).sort(() => 0); // identity (stable)
  // simple hash-based split so it's deterministic per record id
  const train = [];
  const test = [];
  records.forEach((r, i) => {
    const h = hashStr(r.id || String(i));
    if (h % 5 === 0) test.push(r);
    else train.push(r);
  });

  const model = trainModel(train);

  let waitAbsErr = 0, serviceAbsErr = 0, totalAbsErr = 0;
  let waitSqErr = 0, serviceSqErr = 0, totalSqErr = 0;
  let waitSum = 0, serviceSum = 0, totalSum = 0;
  let waitSumSq = 0, serviceSumSq = 0, totalSumSq = 0;

  test.forEach((r) => {
    const f = buildFeatureVector(r);
    const pw = Math.max(0, dotWithBias(f, model.weightsWait));
    const ps = Math.max(0, dotWithBias(f, model.weightsService));
    const pt = pw + ps;
    const aw = Number(r.waitHours) || 0;
    const as = Number(r.serviceHours) || 0;
    const at = Number(r.turnaroundHours) || 0;

    waitAbsErr += Math.abs(pw - aw);
    serviceAbsErr += Math.abs(ps - as);
    totalAbsErr += Math.abs(pt - at);

    waitSqErr += (pw - aw) ** 2;
    serviceSqErr += (ps - as) ** 2;
    totalSqErr += (pt - at) ** 2;

    waitSum += aw;
    serviceSum += as;
    totalSum += at;
    waitSumSq += aw * aw;
    serviceSumSq += as * as;
    totalSumSq += at * at;
  });

  const n = test.length || 1;

  function r2(ssRes, sum, sumSq) {
    const ssTot = sumSq - (sum * sum) / n;
    return ssTot === 0 ? 0 : 1 - ssRes / ssTot;
  }

  return {
    maeWait: Math.round((waitAbsErr / n) * 10) / 10,
    maeService: Math.round((serviceAbsErr / n) * 10) / 10,
    maeTotal: Math.round((totalAbsErr / n) * 10) / 10,
    r2Wait: Math.round(r2(waitSqErr, waitSum, waitSumSq) * 1000) / 1000,
    r2Service: Math.round(r2(serviceSqErr, serviceSum, serviceSumSq) * 1000) / 1000,
    r2Total: Math.round(r2(totalSqErr, totalSum, totalSumSq) * 1000) / 1000,
    trainSize: train.length,
    testSize: test.length,
  };
}

function hashStr(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h * 31 + s.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

export { trainModel, predict, evaluateModel, buildFeatureVector, FEATURE_NAMES };
