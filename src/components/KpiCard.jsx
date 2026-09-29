function KpiCard({ label, value, unit, accent = 'teal', delta }) {
  const colors = {
    teal: { bar: 'bg-teal-500', num: 'text-navy-900' },
    steel: { bar: 'bg-steel-500', num: 'text-navy-900' },
    signal: { bar: 'bg-signal-500', num: 'text-navy-900' },
    navy: { bar: 'bg-navy-700', num: 'text-navy-900' },
  };
  const c = colors[accent] || colors.teal;

  return (
    <div className="bg-white border border-slate-200 px-5 py-4 flex flex-col gap-2">
      <div className={`h-0.5 w-8 ${c.bar}`} />
      <div className="text-slate-500 text-xs font-medium">{label}</div>
      <div className="flex items-baseline gap-1.5">
        <span className={`text-3xl font-semibold tabular-nums ${c.num}`} style={{ fontVariantNumeric: 'tabular-nums' }}>{value}</span>
        {unit && <span className="text-sm font-normal text-slate-400">{unit}</span>}
      </div>
      {delta && (
        <div className={`text-xs font-medium ${delta.dir === 'up' ? 'text-signal-500' : 'text-teal-600'}`}>
          {delta.dir === 'up' ? '↑' : '↓'} {delta.text}
        </div>
      )}
    </div>
  );
}

export default KpiCard;
