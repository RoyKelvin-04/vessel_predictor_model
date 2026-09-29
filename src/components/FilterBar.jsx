function FilterBar({ filters, onChange, onReset }) {
  const { startDate, endDate, vesselType, berth } = filters;

  const inputClass = 'border border-slate-300 px-3 py-1.5 text-sm text-navy-900 focus:outline-none focus:border-teal-500 bg-white transition-colors';
  const labelClass = 'text-xs font-medium text-slate-500 mb-1 block';

  return (
    <div className="bg-white border border-slate-200 px-4 py-3 flex flex-wrap items-end gap-3">
      <div className="flex flex-col">
        <label className={labelClass}>Start date</label>
        <input type="date" value={startDate} onChange={(e) => onChange({ ...filters, startDate: e.target.value })} className={inputClass} />
      </div>
      <div className="flex flex-col">
        <label className={labelClass}>End date</label>
        <input type="date" value={endDate} onChange={(e) => onChange({ ...filters, endDate: e.target.value })} className={inputClass} />
      </div>
      <div className="flex flex-col">
        <label className={labelClass}>Vessel type</label>
        <select value={vesselType} onChange={(e) => onChange({ ...filters, vesselType: e.target.value })} className={inputClass}>
          <option value="">All types</option>
          <option value="Container">Container</option>
          <option value="Bulk Carrier">Bulk Carrier</option>
          <option value="Tanker">Tanker</option>
          <option value="General Cargo">General Cargo</option>
          <option value="Ro-Ro">Ro-Ro</option>
        </select>
      </div>
      <div className="flex flex-col">
        <label className={labelClass}>Berth</label>
        <select value={berth} onChange={(e) => onChange({ ...filters, berth: e.target.value })} className={inputClass}>
          <option value="">All berths</option>
          <option value="B1">B1</option>
          <option value="B2">B2</option>
          <option value="B3">B3</option>
          <option value="B4">B4</option>
          <option value="B5">B5</option>
          <option value="B6">B6</option>
        </select>
      </div>
      <button
        onClick={onReset}
        className="border border-slate-300 hover:bg-slate-100 text-slate-600 font-medium text-sm px-4 py-1.5 transition-colors"
      >
        Reset
      </button>
    </div>
  );
}

export default FilterBar;
