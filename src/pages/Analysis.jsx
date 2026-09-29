import { useState, useMemo } from 'react';
import FilterBar from '../components/FilterBar';
import ChartCard from '../components/ChartCard';
import DataTable from '../components/DataTable';
import {
  ScatterChart, Scatter, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';

const VESSEL_TYPE_COLORS = {
  'Container': '#0a2342',
  'Bulk Carrier': '#18a0a0',
  'Tanker': '#4a7ba8',
  'General Cargo': '#2d5f8a',
  'Ro-Ro': '#8aafd1',
};

const tooltipStyle = {
  backgroundColor: '#0a2342',
  border: '1px solid #1f5a99',
  borderRadius: '0',
  color: '#fff',
  fontSize: '12px',
  padding: '8px 12px',
};
const axisTick = { fontSize: 11, fill: '#64748b', fontFamily: 'IBM Plex Sans' };
const gridStroke = '#e2e8ef';

function Analysis({ data }) {
  const [filters, setFilters] = useState({ startDate: '', endDate: '', vesselType: '', berth: '' });

  const filtered = useMemo(() => {
    return data.filter((r) => {
      if (filters.vesselType && r.vesselType !== filters.vesselType) return false;
      if (filters.berth && r.berth !== filters.berth) return false;
      if (filters.startDate || filters.endDate) {
        const d = new Date(r.arrivalTime);
        if (isNaN(d)) return false;
        if (filters.startDate && d < new Date(filters.startDate)) return false;
        if (filters.endDate && d > new Date(filters.endDate + 'T23:59:59')) return false;
      }
      return true;
    });
  }, [data, filters]);

  const scatterCargoData = useMemo(() =>
    filtered.map((r) => ({ cargo: r.cargoTonnes, turnaround: r.turnaroundHours, type: r.vesselType, name: r.vesselName })), [filtered]);

  const queueData = useMemo(() => {
    const buckets = {};
    filtered.forEach((r) => {
      const q = r.queueLengthAtArrival;
      if (!buckets[q]) buckets[q] = { queue: q, total: 0, count: 0 };
      buckets[q].total += r.waitHours;
      buckets[q].count += 1;
    });
    return Object.values(buckets)
      .sort((a, b) => a.queue - b.queue)
      .map((b) => ({ queue: b.queue, avgWait: Math.round((b.total / b.count) * 10) / 10 }));
  }, [filtered]);

  const berthData = useMemo(() => {
    const buckets = {};
    filtered.forEach((r) => {
      if (!buckets[r.berth]) buckets[r.berth] = { berth: r.berth, total: 0, count: 0 };
      buckets[r.berth].total += r.turnaroundHours;
      buckets[r.berth].count += 1;
    });
    return Object.values(buckets)
      .sort((a, b) => a.berth.localeCompare(b.berth))
      .map((b) => ({ berth: b.berth, avgTurnaround: Math.round((b.total / b.count) * 10) / 10 }));
  }, [filtered]);

  const histogramData = useMemo(() => {
    if (filtered.length === 0) return [];
    const values = filtered.map((r) => r.turnaroundHours);
    const min = Math.floor(Math.min(...values));
    const max = Math.ceil(Math.max(...values));
    const binSize = Math.max(1, Math.ceil((max - min) / 15));
    const bins = [];
    for (let lo = min; lo < max; lo += binSize) {
      bins.push({ range: `${lo}-${lo + binSize}`, count: 0, lo });
    }
    values.forEach((v) => {
      const idx = Math.min(Math.floor((v - min) / binSize), bins.length - 1);
      if (idx >= 0) bins[idx].count += 1;
    });
    return bins;
  }, [filtered]);

  function resetFilters() {
    setFilters({ startDate: '', endDate: '', vesselType: '', berth: '' });
  }

  const emptyState = (
    <div className="flex flex-col items-center justify-center h-full text-slate-300 text-sm gap-2">
      <span>No data matches the current filters.</span>
    </div>
  );

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-navy-900 font-semibold text-lg">Analysis</h2>
      </div>

      <FilterBar filters={filters} onChange={setFilters} onReset={resetFilters} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard title="Turnaround vs Cargo Tonnes" subtitle="Each point is a port call; colour = vessel type" height={320}>
          {filtered.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 10, right: 16, bottom: 28, left: -12 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
                <XAxis type="number" dataKey="cargo" name="Cargo (t)" tick={axisTick} tickLine={false} axisLine={{ stroke: gridStroke }} label={{ value: 'Cargo (tonnes)', position: 'insideBottom', offset: -14, style: { fill: '#64748b', fontSize: 11 } }} />
                <YAxis type="number" dataKey="turnaround" name="Turnaround" tick={axisTick} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={tooltipStyle} cursor={{ strokeDasharray: '3 3' }} />
                <Legend wrapperStyle={{ fontSize: 11, paddingTop: 4 }} />
                {Object.keys(VESSEL_TYPE_COLORS).map((type) => (
                  <Scatter key={type} name={type} data={scatterCargoData.filter((d) => d.type === type)} fill={VESSEL_TYPE_COLORS[type]} fillOpacity={0.65} />
                ))}
              </ScatterChart>
            </ResponsiveContainer>
          ) : emptyState}
        </ChartCard>

        <ChartCard title="Wait Time by Queue Length" subtitle="Average wait hours grouped by number of vessels waiting" height={320}>
          {queueData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={queueData} margin={{ top: 10, right: 16, bottom: 28, left: -12 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} vertical={false} />
                <XAxis dataKey="queue" tick={axisTick} tickLine={false} axisLine={{ stroke: gridStroke }} label={{ value: 'Queue length at arrival', position: 'insideBottom', offset: -14, style: { fill: '#64748b', fontSize: 11 } }} />
                <YAxis tick={axisTick} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={tooltipStyle} cursor={{ fill: 'rgba(18,138,138,0.06)' }} />
                <Bar dataKey="avgWait" fill="#18a0a0" radius={[0, 0, 0, 0]} barSize={28} />
              </BarChart>
            </ResponsiveContainer>
          ) : emptyState}
        </ChartCard>

        <ChartCard title="Berth Performance" subtitle="Average turnaround hours per berth" height={320}>
          {berthData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={berthData} margin={{ top: 10, right: 16, bottom: 28, left: -12 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} vertical={false} />
                <XAxis dataKey="berth" tick={axisTick} tickLine={false} axisLine={{ stroke: gridStroke }} label={{ value: 'Berth', position: 'insideBottom', offset: -14, style: { fill: '#64748b', fontSize: 11 } }} />
                <YAxis tick={axisTick} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={tooltipStyle} cursor={{ fill: 'rgba(18,138,138,0.06)' }} />
                <Bar dataKey="avgTurnaround" fill="#0a2342" radius={[0, 0, 0, 0]} barSize={32} />
              </BarChart>
            </ResponsiveContainer>
          ) : emptyState}
        </ChartCard>

        <ChartCard title="Distribution of Turnaround Times" subtitle="Histogram of turnaround hours across filtered port calls" height={320}>
          {histogramData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={histogramData} margin={{ top: 10, right: 16, bottom: 28, left: -12 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} vertical={false} />
                <XAxis dataKey="range" tick={axisTick} tickLine={false} axisLine={{ stroke: gridStroke }} interval={0} angle={-30} textAnchor="end" height={50} />
                <YAxis tick={axisTick} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={tooltipStyle} cursor={{ fill: 'rgba(18,138,138,0.06)' }} />
                <Bar dataKey="count" fill="#4a7ba8" radius={[0, 0, 0, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          ) : emptyState}
        </ChartCard>
      </div>

      <div>
        <h3 className="text-navy-800 font-semibold text-sm mb-3">Port Call Records</h3>
        <DataTable data={filtered} />
      </div>
    </div>
  );
}

export default Analysis;
