import { useMemo } from 'react';
import KpiCard from '../components/KpiCard';
import ChartCard from '../components/ChartCard';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from 'recharts';

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

function Overview({ data }) {
  const kpis = useMemo(() => {
    if (data.length === 0) return { avgTurnaround: 0, avgWait: 0, avgService: 0, total: 0 };
    const sum = data.reduce(
      (acc, r) => ({ t: acc.t + r.turnaroundHours, w: acc.w + r.waitHours, s: acc.s + r.serviceHours }),
      { t: 0, w: 0, s: 0 }
    );
    return {
      avgTurnaround: Math.round((sum.t / data.length) * 10) / 10,
      avgWait: Math.round((sum.w / data.length) * 10) / 10,
      avgService: Math.round((sum.s / data.length) * 10) / 10,
      total: data.length,
    };
  }, [data]);

  const monthlyData = useMemo(() => {
    const buckets = {};
    data.forEach((r) => {
      const d = new Date(r.arrivalTime);
      if (isNaN(d)) return;
      const key = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
      if (!buckets[key]) buckets[key] = { key, total: 0, count: 0 };
      buckets[key].total += r.turnaroundHours;
      buckets[key].count += 1;
    });
    return Object.values(buckets)
      .sort((a, b) => a.key.localeCompare(b.key))
      .map((b) => ({ month: b.key, avgTurnaround: Math.round((b.total / b.count) * 10) / 10 }));
  }, [data]);

  const typeData = useMemo(() => {
    const buckets = {};
    data.forEach((r) => {
      if (!buckets[r.vesselType]) buckets[r.vesselType] = { type: r.vesselType, total: 0, count: 0 };
      buckets[r.vesselType].total += r.turnaroundHours;
      buckets[r.vesselType].count += 1;
    });
    return Object.values(buckets).map((b) => ({
      type: b.type,
      avgTurnaround: Math.round((b.total / b.count) * 10) / 10,
    }));
  }, [data]);

  if (data.length === 0) {
    return (
      <div className="bg-white border border-slate-200 p-12 text-center text-slate-400 text-sm">
        No data available. Upload a CSV or reset to generated data.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-navy-900 font-semibold text-lg">Overview</h2>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-slate-200 border border-slate-200">
        <KpiCard label="Avg turnaround" value={kpis.avgTurnaround} unit="h" accent="teal" />
        <KpiCard label="Avg wait time" value={kpis.avgWait} unit="h" accent="steel" />
        <KpiCard label="Avg service time" value={kpis.avgService} unit="h" accent="navy" />
        <KpiCard label="Total port calls" value={kpis.total} accent="signal" />
      </div>

      <ChartCard title="Average Turnaround by Month" subtitle="Hours from arrival to departure, averaged per month" height={320}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={monthlyData} margin={{ top: 10, right: 16, bottom: 10, left: -12 }}>
            <defs>
              <linearGradient id="turnaroundGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#18a0a0" stopOpacity={0.2} />
                <stop offset="100%" stopColor="#18a0a0" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} vertical={false} />
            <XAxis dataKey="month" tick={axisTick} tickLine={false} axisLine={{ stroke: gridStroke }} />
            <YAxis tick={axisTick} tickLine={false} axisLine={false} />
            <Tooltip contentStyle={tooltipStyle} />
            <Area type="monotone" dataKey="avgTurnaround" stroke="#18a0a0" strokeWidth={2} fill="url(#turnaroundGrad)" dot={{ fill: '#18a0a0', r: 3 }} activeDot={{ r: 5, fill: '#18a0a0' }} />
          </AreaChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="Average Turnaround by Vessel Type" subtitle="Comparing turnaround times across vessel categories" height={300}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={typeData} margin={{ top: 10, right: 16, bottom: 10, left: -12 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} vertical={false} />
            <XAxis dataKey="type" tick={axisTick} tickLine={false} axisLine={{ stroke: gridStroke }} />
            <YAxis tick={axisTick} tickLine={false} axisLine={false} />
            <Tooltip contentStyle={tooltipStyle} cursor={{ fill: 'rgba(18,138,138,0.06)' }} />
            <Bar dataKey="avgTurnaround" fill="#0a2342" radius={[0, 0, 0, 0]} barSize={44} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>
    </div>
  );
}

export default Overview;
