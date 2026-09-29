import { useState } from 'react';

function PredictorForm({ onPredict, modelMetrics }) {
  const [form, setForm] = useState({
    vesselType: 'Container',
    lengthM: 200,
    cargoTonnes: 20000,
    berth: 'B1',
    queueLengthAtArrival: 3,
    weatherDelay: false,
  });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      const res = onPredict(form);
      setResult(res);
      setLoading(false);
    }, 200);
  }

  const inputClass = 'w-full border border-slate-300 px-3 py-2 text-sm text-navy-900 focus:outline-none focus:border-teal-500 bg-white transition-colors';
  const labelClass = 'text-xs font-medium text-slate-500 mb-1 block';

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="bg-white border border-slate-200 p-6">
        <h3 className="text-navy-900 font-semibold text-base mb-1">Input parameters</h3>
        <p className="text-slate-400 text-sm mb-5">Enter the vessel and port-call conditions to predict turnaround time.</p>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex flex-col">
            <label className={labelClass}>Vessel type</label>
            <select value={form.vesselType} onChange={(e) => update('vesselType', e.target.value)} className={inputClass}>
              <option value="Container">Container</option>
              <option value="Bulk Carrier">Bulk Carrier</option>
              <option value="Tanker">Tanker</option>
              <option value="General Cargo">General Cargo</option>
              <option value="Ro-Ro">Ro-Ro</option>
            </select>
          </div>
          <div className="flex flex-col">
            <label className={labelClass}>Berth</label>
            <select value={form.berth} onChange={(e) => update('berth', e.target.value)} className={inputClass}>
              <option value="B1">B1</option>
              <option value="B2">B2</option>
              <option value="B3">B3</option>
              <option value="B4">B4</option>
              <option value="B5">B5</option>
              <option value="B6">B6</option>
            </select>
          </div>
          <div className="flex flex-col">
            <label className={labelClass}>Vessel length (m)</label>
            <input type="number" min="40" max="400" value={form.lengthM} onChange={(e) => update('lengthM', Number(e.target.value))} className={inputClass} />
          </div>
          <div className="flex flex-col">
            <label className={labelClass}>Cargo (tonnes)</label>
            <input type="number" min="0" value={form.cargoTonnes} onChange={(e) => update('cargoTonnes', Number(e.target.value))} className={inputClass} />
          </div>
          <div className="flex flex-col">
            <label className={labelClass}>Queue length at arrival</label>
            <input type="number" min="0" max="20" value={form.queueLengthAtArrival} onChange={(e) => update('queueLengthAtArrival', Number(e.target.value))} className={inputClass} />
          </div>
          <div className="flex flex-col">
            <label className={labelClass}>Weather delay</label>
            <select value={form.weatherDelay ? 'yes' : 'no'} onChange={(e) => update('weatherDelay', e.target.value === 'yes')} className={inputClass}>
              <option value="no">No</option>
              <option value="yes">Yes</option>
            </select>
          </div>
          <div className="sm:col-span-2 mt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-teal-500 hover:bg-teal-600 disabled:opacity-50 text-white font-semibold px-4 py-2.5 transition-colors"
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Calculating…
                </>
              ) : (
                'Predict turnaround time'
              )}
            </button>
          </div>
        </form>
      </div>

      <div className="bg-white border border-slate-200 p-6">
        <h3 className="text-navy-900 font-semibold text-base mb-1">Prediction</h3>
        <p className="text-slate-400 text-sm mb-5">Linear regression model trained on the loaded dataset.</p>

        {modelMetrics && (
          <div className="mb-5 grid grid-cols-3 border border-slate-200 divide-x divide-slate-200">
            <div className="px-3 py-2.5 text-center">
              <div className="text-xs text-slate-400">MAE</div>
              <div className="text-lg font-semibold text-navy-900 tabular-nums">{modelMetrics.maeTotal}<span className="text-xs font-normal text-slate-400 ml-0.5">h</span></div>
            </div>
            <div className="px-3 py-2.5 text-center">
              <div className="text-xs text-slate-400">R²</div>
              <div className="text-lg font-semibold text-navy-900 tabular-nums">{modelMetrics.r2Total}</div>
            </div>
            <div className="px-3 py-2.5 text-center">
              <div className="text-xs text-slate-400">Test size</div>
              <div className="text-lg font-semibold text-navy-900 tabular-nums">{modelMetrics.testSize}</div>
            </div>
          </div>
        )}

        {!result && !loading && (
          <div className="flex flex-col items-center justify-center h-40 text-slate-300 text-sm gap-2 border border-dashed border-slate-200">
            <span>Enter vessel details and submit to see the prediction.</span>
          </div>
        )}

        {loading && (
          <div className="flex items-center justify-center h-40 text-slate-400 text-sm gap-3 border border-dashed border-slate-200">
            <span className="w-5 h-5 border-2 border-slate-200 border-t-teal-500 rounded-full animate-spin" />
            Calculating prediction…
          </div>
        )}

        {result && !loading && (
          <div className="flex flex-col gap-4 animate-result-in">
            <div className="bg-navy-900 text-white p-5">
              <div className="text-teal-400 text-xs font-medium">Predicted turnaround</div>
              <div className="text-4xl font-semibold tabular-nums mt-1.5">{result.predictedTurnaroundHours}<span className="text-lg font-normal text-slate-400 ml-2">hours</span></div>
              <div className="flex gap-8 mt-4 pt-3.5 border-t border-white/10">
                <div>
                  <div className="text-slate-400 text-xs">Wait time</div>
                  <div className="text-xl font-semibold tabular-nums">{result.predictedWaitHours}<span className="text-sm font-normal text-slate-400 ml-1">h</span></div>
                </div>
                <div>
                  <div className="text-slate-400 text-xs">Service time</div>
                  <div className="text-xl font-semibold tabular-nums">{result.predictedServiceHours}<span className="text-sm font-normal text-slate-400 ml-1">h</span></div>
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-navy-800 font-semibold text-sm mb-2.5">Contributing factors</h4>
              <div className="flex flex-col gap-px border border-slate-200">
                {result.explanation.map((line, i) => (
                  <div key={i} className="text-sm text-slate-600 flex items-start gap-2.5 bg-white px-3 py-2.5">
                    <span className="text-teal-500 mt-0.5 text-xs">•</span>
                    <span>{line}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default PredictorForm;
