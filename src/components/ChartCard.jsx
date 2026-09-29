function ChartCard({ title, subtitle, children, height = 300, action }) {
  return (
    <div className="bg-white border border-slate-200 flex flex-col">
      <div className="px-5 py-3.5 border-b border-slate-200">
        <h3 className="text-navy-900 font-semibold text-sm">{title}</h3>
        {subtitle && <p className="text-slate-400 text-xs mt-0.5">{subtitle}</p>}
      </div>
      <div className="p-4 flex-1">
        <div style={{ height }} className="w-full">
          {children}
        </div>
      </div>
    </div>
  );
}

export default ChartCard;
