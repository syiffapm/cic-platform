import { Link } from 'react-router-dom';
import {
  Area, Bar, BarChart, CartesianGrid, ComposedChart, Legend, Line, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';
import { ArrowRight } from 'lucide-react';
import { AS_OF } from '@/data/kpis';
import { Badge, Card, CardBody, CardHeader, ChartCard } from '@/components/ui';
import { C, axis, axisLabel, legend, par30Tone, tooltip } from '../../lib/chart';

export function TrendChart({ data }) {
  return (
    <ChartCard title="Gross portfolio trend" subtitle="Outstanding principal of active loans, MMK billions" asOf={AS_OF} height={280}>
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 8, right: 8, left: 8, bottom: 16 }}>
          <CartesianGrid stroke={C.grid} vertical={false} />
          <XAxis dataKey="month" {...axis} label={axisLabel('Month')} />
          <YAxis yAxisId="p" {...axis} width={56} label={axisLabel('MMK bn', true)} />
          <Tooltip {...tooltip} formatter={(v) => [`${v.toLocaleString()} bn MMK`, 'Portfolio']} />
          <Bar yAxisId="p" dataKey="portfolio" name="Portfolio (MMK bn)" fill={C.navy} radius={[4, 4, 0, 0]} maxBarSize={28} />
        </ComposedChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

export function Par30Chart({ data }) {
  return (
    <ChartCard title="PAR30 trend" subtitle="Share of portfolio ≥ 30 days past due; dashed line = EWS-R01 threshold 5%" asOf={AS_OF} height={280}>
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 8, right: 8, left: 8, bottom: 16 }}>
          <CartesianGrid stroke={C.grid} vertical={false} />
          <XAxis dataKey="month" {...axis} label={axisLabel('Month')} />
          <YAxis {...axis} width={44} domain={[0, (max) => Math.max(6, Math.ceil(max + 1))]} label={axisLabel('PAR30 %', true)} />
          <Tooltip {...tooltip} formatter={(v) => [`${v}%`, 'PAR30']} />
          <Area dataKey="par30" stroke="none" fill={C.amber} fillOpacity={0.12} tooltipType="none" />
          <ReferenceLine y={5} stroke={C.slate} strokeDasharray="4 4" label={{ value: 'EWS 5%', position: 'insideTopRight', fontSize: 11, fill: C.slate }} />
          <Line dataKey="par30" stroke={C.amber} strokeWidth={2} dot={{ r: 3, fill: C.amber, stroke: '#fff', strokeWidth: 2 }} name="PAR30" />
        </ComposedChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

export function AreaChartCard({ data, byTownship }) {
  return (
    <ChartCard title={byTownship ? 'Portfolio by township' : 'Portfolio by region'} subtitle="Gross portfolio, MMK billions" asOf={AS_OF} height={Math.max(240, data.length * 26)}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 0, right: 16, left: 8, bottom: 16 }}>
          <CartesianGrid stroke={C.grid} horizontal={false} />
          <XAxis type="number" {...axis} label={axisLabel('MMK bn')} />
          <YAxis type="category" dataKey="name" {...axis} width={96} />
          <Tooltip {...tooltip} formatter={(v, n, p) => [`${v} bn MMK · PAR30 ${p.payload.par30}%`, 'Portfolio']} />
          <Bar dataKey="portfolio" fill={C.teal} radius={[0, 4, 4, 0]} maxBarSize={16} />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

export function TopRiskList({ rows }) {
  const max = Math.max(10, ...rows.map((r) => r.par30));
  return (
    <Card>
      <CardHeader title="Top-risk MFIs" subtitle="Ranked by PAR30 within current filters" action={<Link to="/gov/prudential" className="text-xs font-medium text-primary hover:underline">Prudential view</Link>} />
      <CardBody className="space-y-3">
        {rows.length === 0 && <p className="text-sm text-slate-500">No institutions match the filters.</p>}
        {rows.map((r) => (
          <Link key={r.id} to={`/gov/mfi/${r.id}`} className="block rounded-lg p-1 hover:bg-slate-50">
            <div className="flex items-center justify-between gap-2 text-sm">
              <span className="min-w-0 font-medium text-slate-800">{r.name} <span className="font-normal text-slate-500">· {r.tier}</span></span>
              <span className="flex items-center gap-2">
                <Badge status={r.status}>{r.status}</Badge>
                <span className="w-12 text-right font-semibold tabular-nums text-slate-900">{r.par30}%</span>
              </span>
            </div>
            <div className="mt-1.5 h-1.5 rounded-full bg-slate-100" aria-hidden="true">
              <div className="h-1.5 rounded-full" style={{ width: `${(r.par30 / max) * 100}%`, background: par30Tone(r.par30).bg }} />
            </div>
          </Link>
        ))}
      </CardBody>
    </Card>
  );
}

export function AlertSummary({ rows }) {
  const total = rows.reduce((s, r) => s + r.open + r.inCase, 0);
  return (
    <ChartCard
      title="EWS alert summary"
      subtitle={`${total} active alerts by severity — awaiting triage vs already in a case`}
      action={<Link to="/gov/ews" className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline">Queue <ArrowRight className="h-3 w-3" /></Link>}
      height={220}
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={rows} margin={{ top: 8, right: 8, left: 0, bottom: 16 }}>
          <CartesianGrid stroke={C.grid} vertical={false} />
          <XAxis dataKey="severity" {...axis} label={axisLabel('Severity')} />
          <YAxis {...axis} allowDecimals={false} width={36} label={axisLabel('Alerts', true)} />
          <Tooltip {...tooltip} />
          <Legend {...legend} />
          <Bar dataKey="open" name="Awaiting triage" stackId="a" fill={C.amber} maxBarSize={36} />
          <Bar dataKey="inCase" name="In a case" stackId="a" fill={C.navy} radius={[4, 4, 0, 0]} maxBarSize={36} />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

export function DisputeSla({ sla, compliance }) {
  const total = sla.ok + sla.risk + sla.breached || 1;
  const segs = [
    { key: 'ok', label: 'Within SLA', color: C.teal, n: sla.ok },
    { key: 'risk', label: 'At risk (≤ 3 days)', color: C.amber, n: sla.risk },
    { key: 'breached', label: 'Breached / escalated', color: C.red, n: sla.breached },
  ];
  return (
    <Card>
      <CardHeader title="Dispute SLA" subtitle="Open disputes by SLA state; gauge = closed within SLA (KPI)" action={<Link to="/gov/disputes" className="text-xs font-medium text-primary hover:underline">Oversight</Link>} />
      <CardBody>
        <div className="flex items-end gap-3">
          <p className="text-3xl font-bold text-slate-900">{compliance}%</p>
          <p className="pb-1 text-xs text-slate-500">closed within SLA · target 95%</p>
        </div>
        <div className="mt-2 h-2 rounded-full bg-slate-100" role="meter" aria-valuenow={compliance} aria-valuemin={0} aria-valuemax={100} aria-label="Dispute SLA compliance">
          <div className="relative h-2 rounded-full bg-primary" style={{ width: `${compliance}%` }} />
        </div>
        <div className="mt-5 flex h-3 gap-0.5 overflow-hidden rounded-full" aria-hidden="true">
          {segs.map((s) => s.n > 0 && <div key={s.key} style={{ width: `${(s.n / total) * 100}%`, background: s.color }} />)}
        </div>
        <ul className="mt-3 space-y-1.5 text-xs">
          {segs.map((s) => (
            <li key={s.key} className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-slate-600"><span className="h-2.5 w-2.5 rounded-full" style={{ background: s.color }} />{s.label}</span>
              <span className="font-semibold tabular-nums text-slate-800">{s.n}</span>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-[11px] text-slate-500">As of {AS_OF}</p>
      </CardBody>
    </Card>
  );
}
