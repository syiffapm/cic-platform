import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { AS_OF } from '@/data/kpis';
import { useStore } from '@/context/StoreContext';
import { ScopeChip } from '@/portals/government/components/FeatureGuard';
import { useRegionScope } from '@/portals/government/lib/access';
import { Card, CardBody, CardHeader, ChartCard, DataTable, PageHeader, Select, Tabs } from '@/components/ui';
import { PRUDENTIAL, MONTHS_12 } from '../../data/supervision';
import { C, axis, axisLabel, legend, tooltip } from '../../lib/chart';
import { median, round } from '../../lib/util';

const METRICS = [
  { id: 'npl', label: 'NPL ratio', unit: '%', higherIsWorse: true, def: 'Non-performing loans ÷ gross portfolio' },
  { id: 'par30', label: 'PAR30', unit: '%', higherIsWorse: true, def: 'Loans ≥ 30 DPD ÷ gross portfolio' },
  { id: 'ldr', label: 'Loan-to-deposit', unit: '%', higherIsWorse: true, def: 'Gross loans ÷ client savings' },
  { id: 'concentration', label: 'Concentration', unit: '%', higherIsWorse: true, def: 'Top-20 borrower exposure ÷ portfolio' },
];

export default function PrudentialMetrics() {
  const { institutions } = useStore();
  const navigate = useNavigate();
  const { filterByRegion } = useRegionScope();
  const insts = filterByRegion(institutions).filter((i) => PRUDENTIAL[i.id]);
  const [mfiId, setMfiId] = useState('MFI-006');
  const [metric, setMetric] = useState('par30');
  const inst = insts.find((i) => i.id === mfiId) ?? insts[0];
  const m = METRICS.find((x) => x.id === metric);
  const peers = insts.filter((i) => i.tier === inst.tier);

  const series = useMemo(() => MONTHS_12.map((month, idx) => ({
    month,
    mfi: PRUDENTIAL[inst.id][idx][metric],
    tier: round(median(peers.map((p) => PRUDENTIAL[p.id][idx][metric]))),
    sector: round(median(insts.map((p) => PRUDENTIAL[p.id][idx][metric]))),
  })), [inst, metric, peers, insts]);

  const latest = (id) => PRUDENTIAL[id].at(-1);
  const benchmark = METRICS.map((x) => {
    const v = latest(inst.id)[x.id];
    const tm = round(median(peers.map((p) => latest(p.id)[x.id])));
    return { ...x, value: v, tierMedian: tm, sectorMedian: round(median(insts.map((p) => latest(p.id)[x.id]))), gap: round(v - tm) };
  });

  const tableRows = insts.map((i) => ({ id: i.id, short: i.short, name: i.name, tier: i.tier, status: i.status, ...latest(i.id) }));
  const cols = [
    { key: 'short', header: 'MFI', sortable: true, render: (r) => <span className="font-semibold text-slate-900">{r.short}</span> },
    { key: 'tier', header: 'Tier', sortable: true },
    ...METRICS.map((x) => ({ key: x.id, header: x.label, sortable: true, className: 'text-right', render: (r) => <span className="tabular-nums">{r[x.id]}%</span> })),
  ];

  return (
    <div>
      <PageHeader
        title="Prudential metrics"
        subtitle={`Per-MFI health from monthly prudential returns and registry data, with peer benchmark against the tier median. As of ${AS_OF}.`}
        actions={<ScopeChip />}
      />
      <Card className="mb-6">
        <CardBody className="grid grid-cols-1 gap-4 sm:grid-cols-[minmax(0,320px)_minmax(0,1fr)] sm:items-end">
          <Select label="Institution" value={inst.id} onChange={(e) => setMfiId(e.target.value)} options={insts.map((i) => ({ value: i.id, label: `${i.short} — ${i.name} (${i.tier})` }))} />
          <Tabs value={metric} onChange={setMetric} tabs={METRICS.map((x) => ({ id: x.id, label: x.label }))} />
        </CardBody>
      </Card>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <ChartCard className="xl:col-span-2" title={`${m.label} — ${inst.short} vs peers`} subtitle={`${m.def}. Peer = ${inst.tier} median (${peers.length} MFIs).`} asOf={AS_OF} height={300}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={series} margin={{ top: 8, right: 16, left: 4, bottom: 16 }}>
              <CartesianGrid stroke={C.grid} vertical={false} />
              <XAxis dataKey="month" {...axis} label={axisLabel('Month')} />
              <YAxis {...axis} width={44} label={axisLabel(`${m.label} %`, true)} />
              <Tooltip {...tooltip} formatter={(v, n) => [`${v}%`, n]} />
              <Legend {...legend} verticalAlign="top" height={28} />
              <Line dataKey="mfi" name={inst.short} stroke={C.navy} strokeWidth={2} dot={{ r: 3, fill: C.navy, stroke: '#fff', strokeWidth: 2 }} />
              <Line dataKey="tier" name={`${inst.tier} median`} stroke={C.amber} strokeWidth={2} strokeDasharray="5 3" dot={false} />
              <Line dataKey="sector" name="Sector median" stroke={C.teal} strokeWidth={2} strokeDasharray="2 3" dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
        <Card>
          <CardHeader title="Peer benchmark" subtitle={`${inst.short} vs ${inst.tier} and sector medians`} />
          <CardBody className="space-y-4">
            {benchmark.map((b) => {
              const worse = b.gap > 0;
              return (
                <div key={b.id}>
                  <div className="flex items-baseline justify-between text-sm">
                    <span className="font-medium text-slate-700">{b.label}</span>
                    <span className="font-semibold tabular-nums text-slate-900">{b.value}%</span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Tier median {b.tierMedian}% · sector {b.sectorMedian}% ·{' '}
                    <span className={worse ? 'font-semibold text-red-600' : 'font-semibold text-emerald-700'}>{worse ? '▲' : '▼'} {Math.abs(b.gap)} pp {worse ? 'worse' : 'better'} than peers</span>
                  </p>
                </div>
              );
            })}
          </CardBody>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader title="All MFIs — latest month" subtitle="Click a row to benchmark that institution" />
        <DataTable columns={cols} rows={tableRows} onRowClick={(r) => { setMfiId(r.id); window.scrollTo({ top: 0, behavior: 'smooth' }); }} dense pageSize={12} />
        <div className="border-t border-slate-100 px-4 py-2 text-right">
          <button type="button" onClick={() => navigate(`/gov/mfi/${inst.id}`)} className="text-xs font-medium text-primary hover:underline">Open {inst.short} institution record →</button>
        </div>
      </Card>
    </div>
  );
}
