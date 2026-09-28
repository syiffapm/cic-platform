import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bar, BarChart, CartesianGrid, Cell, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { AS_OF } from '@/data/kpis';
import { Card, ChartCard, DataTable, PageHeader, Select, StatCard } from '@/components/ui';
import { ScopeChip } from '@/portals/government/components/FeatureGuard';
import { useRegionScope } from '@/portals/government/lib/access';
import MonthGrid from '../../components/mfi/MonthGrid';
import { ExportButtons } from '../../components/common';
import { COMPLIANCE, MONTHS_6 } from '../../data/supervision';
import { C, axis, axisLabel, tooltip } from '../../lib/chart';
import { downloadCsv, round } from '../../lib/util';

const pctCell = (v, warnBelow, badBelow) => (
  <span className={`font-semibold tabular-nums ${v < badBelow ? 'text-red-600' : v < warnBelow ? 'text-amber-700' : 'text-slate-800'}`}>{v}%</span>
);

const columns = [
  { key: 'name', header: 'MFI', sortable: true, render: (r) => <><p className="font-semibold text-slate-900">{r.short}</p><p className="text-[11px] text-slate-500">{r.name}</p></> },
  { key: 'tier', header: 'Tier', sortable: true },
  { key: 'onTime', header: 'On-time %', sortable: true, className: 'text-right', render: (r) => pctCell(r.onTime, 90, 75) },
  { key: 'dqScore', header: 'DQ score', sortable: true, className: 'text-right', render: (r) => pctCell(r.dqScore, 90, 85) },
  { key: 'rejectedRate', header: 'Rejected rows', sortable: true, className: 'text-right', render: (r) => <span className={`tabular-nums ${r.rejectedRate > 5 ? 'font-semibold text-red-600' : ''}`}>{r.rejectedRate}%</span> },
  { key: 'late', header: 'Late / missing', sortable: true, className: 'text-right', render: (r) => <span className="tabular-nums">{r.late} of 6</span> },
  { key: 'months', header: `Last 6 cut-offs (${MONTHS_6[0]} – ${MONTHS_6.at(-1)})`, render: (r) => <MonthGrid months={r.months} compact /> },
];

export default function ReportingCompliance() {
  const navigate = useNavigate();
  const [tier, setTier] = useState('');
  const { filterByMfi } = useRegionScope();
  const rows = useMemo(() => filterByMfi(COMPLIANCE).filter((r) => !tier || r.tier === tier), [tier, filterByMfi]);
  const avg = (k) => round(rows.reduce((s, r) => s + r[k], 0) / (rows.length || 1));
  const chart = [...rows].sort((a, b) => a.dqScore - b.dqScore);

  return (
    <div>
      <PageHeader
        title="Reporting compliance"
        subtitle="Monthly submission discipline per MFI: cut-off is the 7th calendar day after month end. Late = accepted after cut-off; missing = no accepted batch."
        actions={<><ScopeChip /><ExportButtons onCsv={() => downloadCsv('reporting-compliance.csv', rows.map((r) => ({ ...r, months: r.months.map((m) => `${m.month}:${m.daysLate ?? 'missing'}`).join(' | ') })))} /></>}
      />
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Average on-time rate" value={`${avg('onTime')}%`} tone="navy" definition="Cut-offs met on time ÷ cut-offs due, last 6 months" asOf={AS_OF} />
        <StatCard label="Average DQ score" value={`${avg('dqScore')}%`} tone="teal" definition="Accepted rows ÷ received rows, weighted by critical-field completeness" asOf={AS_OF} />
        <StatCard label="Average rejected-row rate" value={`${avg('rejectedRate')}%`} tone="warm" definition="Rows rejected at validation ÷ rows received" asOf={AS_OF} />
        <StatCard label="MFIs with ≥ 2 late cut-offs" value={rows.filter((r) => r.late >= 2).length} tone="red" definition="Institutions late or missing on two or more of the last six cut-offs" asOf={AS_OF} />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <DataTable
            columns={columns}
            rows={rows}
            rowKey="mfiId"
            searchKeys={['name', 'short']}
            onRowClick={(r) => navigate(`/gov/mfi/${r.mfiId}`)}
            toolbar={<Select aria-label="Tier" value={tier} onChange={(e) => setTier(e.target.value)} placeholder="All tiers" options={['Tier 1', 'Tier 2', 'Tier 3']} />}
            pageSize={12}
          />
          <p className="border-t border-slate-100 px-4 py-2 text-[11px] text-slate-500">✓ on time · +Nd late by N days · ✕ missing. Click a row for the institution record. Column headers sort.</p>
        </Card>
        <ChartCard title="DQ score by MFI" subtitle="Dashed line = EWS-R04 threshold 85%" asOf={AS_OF} height={Math.max(280, chart.length * 28)}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chart} layout="vertical" margin={{ top: 0, right: 16, left: 0, bottom: 16 }}>
              <CartesianGrid stroke={C.grid} horizontal={false} />
              <XAxis type="number" domain={[50, 100]} {...axis} label={axisLabel('DQ score %')} />
              <YAxis type="category" dataKey="short" {...axis} width={64} />
              <Tooltip {...tooltip} formatter={(v) => [`${v}%`, 'DQ score']} />
              <ReferenceLine x={85} stroke={C.slate} strokeDasharray="4 4" />
              <Bar dataKey="dqScore" radius={[0, 4, 4, 0]} maxBarSize={14}>
                {chart.map((r) => <Cell key={r.mfiId} fill={r.dqScore < 85 ? C.amber : C.navy} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </div>
  );
}
