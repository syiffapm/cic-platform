import { useState } from 'react';
import { Bar, BarChart, CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { ChartCard } from '@/components/ui';
import { formatNumber } from '@/lib/format';
import { LENDING_AS_OF } from '../../data/lending';
import { C, axis, axisLabel, legend, tooltip } from '../../lib/chart';

const k = (v) => (v >= 1000 ? `${Math.round(v / 100) / 10}k` : v);
const margin = { top: 8, right: 8, left: 8, bottom: 16 };

function Toggle({ value, onChange, options, label }) {
  return (
    <div role="group" aria-label={label} className="flex rounded-lg border border-slate-200 p-0.5 text-xs">
      {options.map(([id, text]) => (
        <button key={id} type="button" aria-pressed={value === id} onClick={() => onChange(id)}
          className={`rounded-md px-2.5 py-1 font-medium ${value === id ? 'bg-primary text-white' : 'text-slate-600 hover:bg-slate-100'}`}>{text}</button>
      ))}
    </div>
  );
}

export function ChannelChart({ data }) {
  return (
    <ChartCard title="Applications by channel" subtitle="Loan applications received per month — online (Borrower portal) and at MFI branches" asOf={LENDING_AS_OF} height={280}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={margin}>
          <CartesianGrid stroke={C.grid} vertical={false} />
          <XAxis dataKey="month" {...axis} label={axisLabel('Month')} />
          <YAxis {...axis} width={52} tickFormatter={k} label={axisLabel('Applications', true)} />
          <Tooltip {...tooltip} formatter={(v, n) => [formatNumber(v), n]} />
          <Legend {...legend} verticalAlign="top" height={28} />
          <Bar dataKey="branch" name="Branch" stackId="a" fill={C.navy} maxBarSize={28} stroke="#fff" strokeWidth={1} />
          <Bar dataKey="online" name="Online" stackId="a" fill={C.teal} radius={[4, 4, 0, 0]} maxBarSize={28} stroke="#fff" strokeWidth={1} />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

export function ApprovalChart({ data }) {
  return (
    <ChartCard title="Approval rate" subtitle="Approved ÷ decided applications — all applicants vs applicants already holding ≥ 3 active loans" asOf={LENDING_AS_OF} height={280}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={margin}>
          <CartesianGrid stroke={C.grid} vertical={false} />
          <XAxis dataKey="month" {...axis} label={axisLabel('Month')} />
          <YAxis {...axis} width={44} domain={[0, 100]} label={axisLabel('Approved %', true)} />
          <Tooltip {...tooltip} formatter={(v, n) => [`${v}%`, n]} />
          <Legend {...legend} verticalAlign="top" height={28} />
          <Line dataKey="approvalRate" name="All applicants" stroke={C.navy} strokeWidth={2} dot={{ r: 3, fill: C.navy, stroke: '#fff', strokeWidth: 2 }} />
          <Line dataKey="multiApproval" name="≥ 3 active loans" stroke={C.amber} strokeWidth={2} dot={{ r: 3, fill: C.amber, stroke: '#fff', strokeWidth: 2 }} />
        </LineChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

export function DecisionTimeChart({ data }) {
  return (
    <ChartCard title="Time to decision" subtitle="Median days from application to the MFI's decision" asOf={LENDING_AS_OF} height={260}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={margin}>
          <CartesianGrid stroke={C.grid} vertical={false} />
          <XAxis dataKey="month" {...axis} label={axisLabel('Month')} />
          <YAxis {...axis} width={44} domain={[0, 8]} label={axisLabel('Days', true)} />
          <Tooltip {...tooltip} formatter={(v, n) => [`${v} days`, n]} />
          <Legend {...legend} verticalAlign="top" height={28} />
          <Line dataKey="daysBranch" name="Branch" stroke={C.navy} strokeWidth={2} dot={{ r: 3, fill: C.navy, stroke: '#fff', strokeWidth: 2 }} />
          <Line dataKey="daysOnline" name="Online" stroke={C.teal} strokeWidth={2} dot={{ r: 3, fill: C.teal, stroke: '#fff', strokeWidth: 2 }} />
        </LineChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

export function DeclineReasonsChart({ data }) {
  return (
    <ChartCard title="Why applications are declined" subtitle="Reason given by the MFI (anonymised counts)" asOf={LENDING_AS_OF} height={260}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 0, right: 24, left: 8, bottom: 16 }}>
          <CartesianGrid stroke={C.grid} horizontal={false} />
          <XAxis type="number" {...axis} tickFormatter={k} label={axisLabel('Declined applications')} />
          <YAxis type="category" dataKey="label" {...axis} width={170} tick={{ fontSize: 10, fill: '#64748b' }} />
          <Tooltip {...tooltip} formatter={(v, n, p) => [`${formatNumber(v)} · ${p.payload.pct}%`, 'Declined']} />
          <Bar dataKey="count" fill={C.amber} radius={[0, 4, 4, 0]} maxBarSize={16} />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

export function DisbursedChart({ byRegion, byMfi }) {
  const [view, setView] = useState('region');
  const data = view === 'region' ? byRegion : byMfi;
  return (
    <ChartCard title="Disbursed amount" subtitle={`New loans disbursed by ${view === 'region' ? 'region' : 'institution'}, MMK billions`} asOf={LENDING_AS_OF}
      height={Math.max(260, data.length * 26)} action={<Toggle label="Group disbursed amount by" value={view} onChange={setView} options={[['region', 'Region'], ['mfi', 'MFI']]} />}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 0, right: 24, left: 8, bottom: 16 }}>
          <CartesianGrid stroke={C.grid} horizontal={false} />
          <XAxis type="number" {...axis} label={axisLabel('MMK bn')} />
          <YAxis type="category" dataKey="name" {...axis} width={84} />
          <Tooltip {...tooltip} formatter={(v) => [`${v} bn MMK`, 'Disbursed']} />
          <Bar dataKey="bn" fill={C.teal} radius={[0, 4, 4, 0]} maxBarSize={16} />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

const ADOPTION = {
  accounts: { label: 'Registered citizen accounts', key: 'accounts', unit: 'accounts (cumulative)' },
  reportViews: { label: 'Own credit report views', key: 'reportViews', unit: 'views per month' },
  disputesFiled: { label: 'Disputes filed online', key: 'disputesFiled', unit: 'disputes per month' },
};

export function AdoptionChart({ data }) {
  const [metric, setMetric] = useState('accounts');
  const m = ADOPTION[metric];
  return (
    <ChartCard title="Citizen self-service adoption" subtitle={`${m.label} — ${m.unit}`} asOf={LENDING_AS_OF} height={260}
      action={<Toggle label="Adoption metric" value={metric} onChange={setMetric} options={[['accounts', 'Accounts'], ['reportViews', 'Report views'], ['disputesFiled', 'Disputes']]} />}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={margin}>
          <CartesianGrid stroke={C.grid} vertical={false} />
          <XAxis dataKey="month" {...axis} label={axisLabel('Month')} />
          <YAxis {...axis} width={52} tickFormatter={k} />
          <Tooltip {...tooltip} formatter={(v) => [formatNumber(v), m.label]} />
          <Bar dataKey={m.key} fill={C.violet} radius={[4, 4, 0, 0]} maxBarSize={28} />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}
