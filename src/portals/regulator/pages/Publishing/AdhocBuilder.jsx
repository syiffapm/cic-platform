import { useMemo, useState } from 'react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useStore } from '@/context/StoreContext';
import { AS_OF } from '@/data/kpis';
import { formatNumber } from '@/lib/format';
import { Alert, Card, CardBody, ChartCard, DataTable, PageHeader, Select, Tabs } from '@/components/ui';
import { ExportButtons } from '../../components/common';
import { TOWNSHIP_STATS } from '../../data/townships';
import { C, axis, axisLabel, tooltip } from '../../lib/chart';
import { downloadCsv, round } from '../../lib/util';

const DIMENSIONS = { region: 'Region / State', township: 'Township', tier: 'MFI tier', type: 'MFI legal type' };
const METRICS = {
  borrowers: { label: 'Borrowers', fmt: formatNumber, agg: 'sum' },
  portfolio: { label: 'Portfolio (MMK bn)', fmt: (v) => round(v, 1).toLocaleString(), agg: 'sum' },
  par30: { label: 'PAR30 % (portfolio-weighted)', fmt: (v) => `${round(v)}%`, agg: 'wavg' },
  multi: { label: 'Borrowers ≥ 3 loans', fmt: formatNumber, agg: 'sum', townOnly: true },
};

function aggregate(rows, key, metric) {
  const groups = {};
  rows.forEach((r) => {
    const g = (groups[r[key]] ??= { name: r[key], sum: 0, w: 0 });
    if (METRICS[metric].agg === 'sum') g.sum += r[metric];
    else { g.sum += r[metric] * r.portfolio; g.w += r.portfolio; }
  });
  return Object.values(groups).map((g) => ({ name: g.name, value: METRICS[metric].agg === 'sum' ? g.sum : g.sum / (g.w || 1) })).sort((a, b) => b.value - a.value);
}

/** Ad-hoc report builder on anonymised DWH aggregates (GOV-17, P2). */
export default function AdhocBuilder() {
  const { institutions } = useStore();
  const [dim, setDim] = useState('region');
  const [metric, setMetric] = useState('portfolio');
  const [filter, setFilter] = useState('');
  const [view, setView] = useState('chart');

  const instRows = useMemo(() => institutions.filter((i) => i.portfolio > 0).map((i) => ({ ...i, portfolio: i.portfolio / 1e9, multi: 0 })), [institutions]);
  const byInst = dim === 'tier' || dim === 'type';
  const dimOk = byInst && METRICS[metric].townOnly ? false : true;
  const base = byInst ? instRows : TOWNSHIP_STATS.map((t) => ({ ...t, township: t.name }));
  const filterOptions = byInst ? ['Tier 1', 'Tier 2', 'Tier 3'] : [...new Set(TOWNSHIP_STATS.map((t) => t.region))];
  const filtered = base.filter((r) => !filter || (byInst ? r.tier === filter : r.region === filter));
  const data = dimOk ? aggregate(filtered, dim, metric) : [];
  const m = METRICS[metric];

  return (
    <div>
      <PageHeader
        title="Ad-hoc report builder"
        subtitle="Pick a dimension, metric and filter; results come from anonymised DWH aggregates with small-cell suppression (cells < 10 borrowers hidden)."
        actions={<ExportButtons onCsv={() => downloadCsv(`adhoc-${dim}-${metric}.csv`, data.map((d) => ({ [DIMENSIONS[dim]]: d.name, [m.label]: round(d.value, 2) })))} />}
      />
      <Alert tone="info" className="mb-6" title="Anonymised warehouse only">Queries run only on the anonymised warehouse; no borrower-level rows are reachable from this builder.</Alert>
      <Card className="mb-6">
        <CardBody className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Select label="Dimension (group by)" value={dim} onChange={(e) => { setDim(e.target.value); setFilter(''); }} options={Object.entries(DIMENSIONS).map(([value, label]) => ({ value, label }))} />
          <Select label="Metric" value={metric} onChange={(e) => setMetric(e.target.value)} options={Object.entries(METRICS).map(([value, x]) => ({ value, label: x.label }))} />
          <Select label={byInst ? 'Filter: tier' : 'Filter: region'} value={filter} onChange={(e) => setFilter(e.target.value)} placeholder="No filter" options={filterOptions} />
        </CardBody>
      </Card>
      {!dimOk ? (
        <Alert tone="warning" title="Combination not available">“{m.label}” is computed at township level only. Choose Region or Township as the dimension.</Alert>
      ) : (
        <>
          <Tabs className="mb-4" value={view} onChange={setView} tabs={[{ id: 'chart', label: 'Chart' }, { id: 'table', label: 'Table', count: data.length }]} />
          {view === 'chart' ? (
            <ChartCard title={`${m.label} by ${DIMENSIONS[dim].toLowerCase()}`} subtitle={filter ? `Filter: ${filter}` : 'All records'} asOf={AS_OF} height={Math.max(260, data.length * 26)}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data} layout="vertical" margin={{ top: 0, right: 24, left: 8, bottom: 16 }}>
                  <CartesianGrid stroke={C.grid} horizontal={false} />
                  <XAxis type="number" {...axis} label={axisLabel(m.label)} />
                  <YAxis type="category" dataKey="name" {...axis} width={110} />
                  <Tooltip {...tooltip} formatter={(v) => [m.fmt(v), m.label]} />
                  <Bar dataKey="value" fill={C.navy} radius={[0, 4, 4, 0]} maxBarSize={16} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
          ) : (
            <Card>
              <DataTable rowKey="name" rows={data} columns={[
                { key: 'name', header: DIMENSIONS[dim], sortable: true },
                { key: 'value', header: m.label, sortable: true, className: 'text-right', render: (r) => <span className="tabular-nums">{m.fmt(r.value)}</span> },
              ]} pageSize={15} />
            </Card>
          )}
        </>
      )}
    </div>
  );
}
