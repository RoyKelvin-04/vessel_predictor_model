function About() {
  return (
    <div className="flex flex-col gap-6 max-w-3xl">
      <div>
        <h2 className="text-navy-900 font-semibold text-lg">About</h2>
      </div>

      <div className="bg-white border border-slate-200 p-6">
        <p className="text-slate-600 leading-relaxed text-sm">
          The Vessel Turnaround Predictor analyses vessel port calls for a generic seaport and predicts how
          long a vessel will spend in port — from arrival to departure. All data is generated synthetically
          in the browser, and the prediction model is trained locally. No backend, database, or external API
          is used.
        </p>
      </div>

      <div className="bg-white border border-slate-200 p-6">
        <h3 className="text-navy-900 font-semibold text-sm mb-4">Data Fields</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-xs text-slate-400">
                <th className="text-left py-2 pr-4 font-semibold">Field</th>
                <th className="text-left py-2 pr-4 font-semibold">Type</th>
                <th className="text-left py-2 font-semibold">Description</th>
              </tr>
            </thead>
            <tbody className="text-slate-600">
              {[
                ['id', 'text', 'Unique port-call identifier'],
                ['vesselName', 'text', 'Name of the vessel'],
                ['vesselType', 'category', 'Container, Bulk Carrier, Tanker, General Cargo, or Ro-Ro'],
                ['lengthM', 'number', 'Vessel length in metres'],
                ['cargoTonnes', 'number', 'Cargo loaded/unloaded in tonnes'],
                ['berth', 'category', 'Assigned berth (B1–B6)'],
                ['arrivalTime', 'datetime', 'ISO timestamp of port arrival'],
                ['waitHours', 'number', 'Hours from arrival to berthing'],
                ['serviceHours', 'number', 'Hours from berthing to departure'],
                ['turnaroundHours', 'number', 'Total hours in port (wait + service)'],
                ['queueLengthAtArrival', 'integer', 'Number of vessels already waiting'],
                ['weatherDelay', 'boolean', 'Whether weather caused a delay'],
              ].map(([field, type, desc]) => (
                <tr key={field} className="border-b border-slate-100 last:border-0">
                  <td className="py-2.5 pr-4 font-mono font-medium text-navy-800 text-xs">{field}</td>
                  <td className="py-2.5 pr-4 text-slate-400 text-xs">{type}</td>
                  <td className="py-2.5 text-sm">{desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-white border border-slate-200 p-6">
        <h3 className="text-navy-900 font-semibold text-sm mb-3">Model Approach</h3>
        <p className="text-slate-600 leading-relaxed text-sm mb-3">
          The predictor uses ordinary least-squares (OLS) multiple linear regression, fitted entirely in the
          browser via normal equations. Two separate regressions are trained — one for wait time and one for
          service time — because the drivers of each differ (queue length mainly affects waiting; vessel size,
          cargo, and type mainly affect service). Categorical variables (vessel type, berth) are one-hot encoded.
          The final turnaround prediction is the sum of the two component predictions.
        </p>
        <p className="text-slate-600 leading-relaxed text-sm">
          Model performance is reported as Mean Absolute Error (MAE) and R² on an 80/20 hold-out split,
          computed deterministically so results are reproducible.
        </p>
      </div>

      <div className="bg-white border border-slate-200 p-6">
        <h3 className="text-navy-900 font-semibold text-sm mb-3">Data</h3>
        <p className="text-slate-600 leading-relaxed text-sm">
          Port-call records are generated from parameterized relationships drawn from published port-operations
          research: vessel size and cargo volume scale with service time, queue length drives wait time,
          vessel-type and berth effects are modeled separately, and weather-related delays are layered in as a
          stochastic factor. This produces a dataset with the statistical structure of real port operations,
          suitable for demonstrating the modeling pipeline end to end. The same pipeline accepts a CSV of actual
          port-call records in place of the generated set.
        </p>
      </div>

      <div className="bg-white border border-slate-200 p-6">
        <h3 className="text-navy-900 font-semibold text-sm mb-3">Considerations</h3>
        <ol className="flex flex-col gap-3 text-slate-600">
          {[
            'As with any modeled dataset, relationships are approximated rather than empirically observed; real port-call data may reveal non-linear patterns or interactions this version doesn\'t capture.',
            'Linear regression assumes additive effects between features, which may understate compounding effects (e.g. bad weather during an already-long queue).',
            'The model does not account for crew availability, tide schedules, port equipment, or seasonal demand surges.',
            'Predictions are point estimates with no confidence interval.',
          ].map((item, i) => (
            <li key={i} className="flex items-start gap-3 text-sm">
              <span className="font-mono text-xs text-slate-400 shrink-0 mt-0.5 tabular-nums">{i + 1}.</span>
              <span>{item}</span>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}

export default About;
