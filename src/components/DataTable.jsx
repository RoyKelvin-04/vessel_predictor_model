import { useState, useMemo } from 'react';

const COLUMNS = [
  { key: 'id', label: 'ID' },
  { key: 'vesselName', label: 'Vessel' },
  { key: 'vesselType', label: 'Type' },
  { key: 'lengthM', label: 'Length (m)', numeric: true },
  { key: 'cargoTonnes', label: 'Cargo (t)', numeric: true },
  { key: 'berth', label: 'Berth' },
  { key: 'arrivalTime', label: 'Arrival', date: true },
  { key: 'waitHours', label: 'Wait (h)', numeric: true },
  { key: 'serviceHours', label: 'Service (h)', numeric: true },
  { key: 'turnaroundHours', label: 'Turn. (h)', numeric: true },
  { key: 'queueLengthAtArrival', label: 'Queue', numeric: true },
  { key: 'weatherDelay', label: 'Weather', boolean: true },
];

const PAGE_SIZE = 12;

function DataTable({ data }) {
  const [sortKey, setSortKey] = useState('arrivalTime');
  const [sortDir, setSortDir] = useState('desc');
  const [page, setPage] = useState(0);

  const sorted = useMemo(() => {
    const arr = [...data];
    arr.sort((a, b) => {
      const av = a[sortKey];
      const bv = b[sortKey];
      let cmp;
      if (typeof av === 'number' && typeof bv === 'number') cmp = av - bv;
      else cmp = String(av).localeCompare(String(bv));
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return arr;
  }, [data, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages - 1);
  const pageRows = sorted.slice(safePage * PAGE_SIZE, safePage * PAGE_SIZE + PAGE_SIZE);

  function handleSort(key) {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
    setPage(0);
  }

  function fmtDate(iso) {
    if (!iso) return '';
    const d = new Date(iso);
    if (isNaN(d)) return String(iso);
    return d.toLocaleDateString('en-GB', { year: 'numeric', month: 'short', day: '2-digit' });
  }

  return (
    <div className="bg-white border border-slate-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/60">
              {COLUMNS.map((col) => (
                <th
                  key={col.key}
                  onClick={() => handleSort(col.key)}
                  className={`px-3 py-2 text-xs font-semibold text-slate-500 cursor-pointer select-none hover:text-teal-600 transition-colors whitespace-nowrap ${col.numeric ? 'text-right' : 'text-left'}`}
                >
                  {col.label}
                  {sortKey === col.key && (
                    <span className="ml-1 text-teal-500">{sortDir === 'asc' ? '↑' : '↓'}</span>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pageRows.length === 0 ? (
              <tr>
                <td colSpan={COLUMNS.length} className="px-3 py-10 text-center text-slate-400 text-sm">
                  No records match the current filters.
                </td>
              </tr>
            ) : (
              pageRows.map((row) => (
                <tr key={row.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/50 transition-colors">
                  {COLUMNS.map((col) => {
                    let val = row[col.key];
                    if (col.date) val = fmtDate(val);
                    if (col.boolean) val = val ? 'Yes' : 'No';
                    if (col.numeric && typeof val === 'number') {
                      val = col.key === 'cargoTonnes' ? val.toLocaleString() : val;
                    }
                    return (
                      <td key={col.key} className={`px-3 py-2 text-slate-600 whitespace-nowrap ${col.numeric ? 'text-right tabular-nums' : ''} ${col.key === 'vesselName' ? 'font-medium text-navy-800' : ''}`}>
                        {col.boolean && val === 'Yes' ? (
                          <span className="inline-flex items-center gap-1.5 text-signal-600 font-medium">
                            <span className="w-1.5 h-1.5 bg-signal-500" />
                            Yes
                          </span>
                        ) : col.boolean ? (
                          <span className="text-slate-400">No</span>
                        ) : val}
                      </td>
                    );
                  })}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <div className="flex items-center justify-between px-4 py-2.5 border-t border-slate-200 text-sm text-slate-500">
        <span className="text-xs">
          {sorted.length === 0
            ? '0 records'
            : `${safePage * PAGE_SIZE + 1}–${Math.min((safePage + 1) * PAGE_SIZE, sorted.length)} of ${sorted.length}`}
        </span>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={safePage === 0}
            className="px-3 py-1 border border-slate-300 text-slate-600 disabled:opacity-40 enabled:hover:bg-slate-100 transition-colors text-xs font-medium"
          >
            Prev
          </button>
          <span className="text-slate-500 text-xs tabular-nums px-1">
            {safePage + 1} / {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            disabled={safePage >= totalPages - 1}
            className="px-3 py-1 border border-slate-300 text-slate-600 disabled:opacity-40 enabled:hover:bg-slate-100 transition-colors text-xs font-medium"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}

export default DataTable;
