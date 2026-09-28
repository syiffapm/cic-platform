import { useMemo, useState } from 'react';
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { CalendarClock } from 'lucide-react';
import { AS_OF } from '@/data/kpis';
import { formatMMK, formatNumber } from '@/lib/format';
import { Badge, Card, CardBody, CardHeader, ChartCard, DataTable, PageHeader, Tabs } from '@/components/ui';
import { ScopeChip } from '@/portals/government/components/FeatureGuard';
import { useRegionScope } from '@/portals/government/lib/access';
import TownshipMap, { useGeo } from '../../components/TownshipMap';
import { CENSUS_SCHEDULE, TOWNSHIP_STATS } from '../../data/townships';
import { C, axis, axisLabel, legend, tooltip } from '../../lib/chart';
import { round } from '../../lib/util';

/** Single-hue teal ramp, light → dark (sequential magnitude). */
const RAMP = ['#e6f5f2', '#b3e0d8', '#6fc2b4', '#2a9d8f', '#16736a', '#0f4f49'];
const FG = ['#0f172a', '#0f172a', '#0f172a', '#fff', '#fff', '#fff'];

const METRICS = {
  borrowers: { label: 'Outreach (borrowers)', get: (t) => t.borrowers, fmt: (v) => (v >= 1000 ? `${round(v / 1000, 1)}k` : `${v}`), full: (v) => `${formatNumber(v)} borrowers` },
  women: { label: 'Women borrowers', get: (t) => t.womenPct, fmt: (v) => `${v}%`, full: (v) => `${v}% of borrowers are women` },
  avgLoan: { label: 'Average loan size', get: (t) => t.avgLoan, fmt: (v) => `${round(v / 1e6, 2)}M`, full: (v) => `average loan ${formatMMK(v)}` },
};

/** Quantile class breaks so every shade is used across the townships in view. */
function quantileBreaks(values, classes) {
  const sorted = [...values].sort((a, b) => a - b);
  return Array.from({ length: classes - 1 }, (_, i) => sorted[Math.floor(((i + 1) / classes) * (sorted.length - 1))]);
}

export default function Census() {
  const { regions: scopeRegions, filterByRegion } = useRegionScope();
  const geo = useGeo('myanmar-townships.json');
  const [metric, setMetric] = useState('borrowers');
  const [selName, setSelName] = useState('Hlaingtharya');
  const m = METRICS[metric];

  const inScope = (p) => !scopeRegions || scopeRegions.includes(p.region);
  const all = useMemo(() => (geo?.features ?? []).map((f) => f.properties), [geo]);
  const visible = useMemo(() => all.filter((p) => !scopeRegions || scopeRegions.includes(p.region)), [all, scopeRegions]);
  const breaks = useMemo(() => quantileBreaks(visible.map(m.get), RAMP.length), [visible, m]);
  const classOf = (v) => breaks.filter((b) => v > b).length;
  const colorFor = (p) => RAMP[classOf(m.get(p))];
  colorFor.key = metric;

  const sel = visible.find((p) => p.name === selName) ?? visible[0];
  const known = sel && TOWNSHIP_STATS.find((x) => x.code === sel.code);

  const byRegion = useMemo(() => {
    const map = {};
    visible.forEach((x) => {
      map[x.region] ??= { region: x.region, women: 0, men: 0 };
      map[x.region].women += Math.round((x.borrowers * x.womenPct) / 100);
      map[x.region].men += Math.round((x.borrowers * (100 - x.womenPct)) / 100);
    });
    return Object.values(map).sort((a, c) => c.women + c.men - (a.women + a.men));
  }, [visible]);

  const legendItems = RAMP.map((bg, i) => ({ bg, label: i === 0 ? `≤ ${m.fmt(breaks[0] ?? 0)}` : i === RAMP.length - 1 ? `> ${m.fmt(breaks[i - 1] ?? 0)}` : `${m.fmt(breaks[i - 1] ?? 0)}–${m.fmt(breaks[i] ?? 0)}` }));
  const grouped = useMemo(() => {
    const g = {};
    visible.forEach((p) => { (g[p.region] ??= []).push(p); });
    return Object.entries(g).sort(([a], [c]) => a.localeCompare(c)).map(([r, list]) => [r, list.sort((a, c) => a.name.localeCompare(c.name))]);
  }, [visible]);
  void filterByRegion;

  return (
    <div>
      <PageHeader
        title="Census & township map"
        subtitle="Outreach, gender and loan size by township from anonymised registry aggregates."
        actions={<><ScopeChip /><Badge tone="navy">Data as of {AS_OF}</Badge></>}
      />
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader title={m.label} subtitle="Every township shaded by the selected measure — darker = higher, so busier townships stand out within the same state or region. Select a township on the map or in the list." />
          <CardBody>
            <Tabs className="mb-4" value={metric} onChange={setMetric} tabs={Object.entries(METRICS).map(([id, x]) => ({ id, label: x.label }))} />
            <TownshipMap
              features={geo?.features ?? null}
              colorFor={colorFor}
              label={(p) => m.full(m.get(p))}
              onSelect={(p) => setSelName(p.name)}
              selected={sel?.name}
              inScope={inScope}
            />
            <div className="mt-3 flex flex-wrap items-center gap-3 text-[11px] text-slate-600">
              {legendItems.map((l) => (
                <span key={l.bg} className="inline-flex items-center gap-1.5"><span className="h-3 w-5 rounded-sm" style={{ background: l.bg }} aria-hidden="true" />{l.label}</span>
              ))}
              <label className="ml-auto flex items-center gap-2">
                <span className="text-slate-500">Township</span>
                <select value={sel?.name ?? ''} onChange={(e) => setSelName(e.target.value)} className="h-8 max-w-[220px] rounded-md border border-slate-300 bg-white px-2 text-xs">
                  {grouped.map(([r, list]) => (
                    <optgroup key={r} label={r}>{list.map((x) => <option key={x.name} value={x.name}>{x.name}</option>)}</optgroup>
                  ))}
                </select>
              </label>
            </div>
            <p className="mt-2 text-[11px] text-slate-500">Source: credit registry → DWH township aggregates · As of {AS_OF}</p>
          </CardBody>
        </Card>
        <Card>
          {!sel ? (
            <CardBody><p className="text-sm text-slate-500">{geo ? 'No township in your scope.' : 'Loading township map…'}</p></CardBody>
          ) : (
            <>
              <CardHeader title={sel.name} subtitle={`${sel.region} · township profile`} />
              <CardBody>
                <dl className="space-y-3 text-sm">
                  {[
                    ['Borrowers', formatNumber(sel.borrowers)],
                    ['Gross portfolio', `${known ? known.portfolio : round((sel.borrowers * sel.avgLoan * 0.55) / 1e9, 1)} bn MMK`],
                    ['Women borrowers', `${sel.womenPct}%`],
                    ['Average loan size', formatMMK(sel.avgLoan)],
                    ['PAR30', `${sel.par30}%`],
                    ['≥ 3 active loans', formatNumber(known ? known.multi : Math.round(sel.borrowers * 0.07))],
                  ].map(([a2, b2]) => (
                    <div key={a2} className="flex justify-between gap-2 border-b border-slate-100 pb-2"><dt className="text-slate-500">{a2}</dt><dd className="font-semibold text-slate-900">{b2}</dd></div>
                  ))}
                </dl>
                <div className="mt-4">
                  <p className="mb-1 text-[11px] font-medium text-slate-500">Gender split</p>
                  <div className="flex h-3 gap-0.5 overflow-hidden rounded-full" aria-hidden="true">
                    <div style={{ width: `${sel.womenPct}%`, background: C.teal }} />
                    <div style={{ width: `${100 - sel.womenPct}%`, background: C.navy }} />
                  </div>
                  <p className="mt-1 flex justify-between text-[11px] text-slate-600"><span>Women {sel.womenPct}%</span><span>Men {100 - sel.womenPct}%</span></p>
                </div>
              </CardBody>
            </>
          )}
        </Card>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-2">
        <ChartCard title="Borrowers by gender and region" subtitle="Women and men borrowers, sum over all townships" asOf={AS_OF} height={300}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={byRegion} layout="vertical" margin={{ top: 0, right: 16, left: 8, bottom: 16 }}>
              <CartesianGrid stroke={C.grid} horizontal={false} />
              <XAxis type="number" {...axis} tickFormatter={(v) => `${v / 1000}k`} label={axisLabel('Borrowers')} />
              <YAxis type="category" dataKey="region" {...axis} width={90} />
              <Tooltip {...tooltip} formatter={(v, n) => [formatNumber(v), n]} />
              <Legend {...legend} verticalAlign="top" height={28} />
              <Bar dataKey="women" name="Women" stackId="g" fill={C.teal} maxBarSize={16} />
              <Bar dataKey="men" name="Men" stackId="g" fill={C.navy} radius={[0, 4, 4, 0]} maxBarSize={16} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
        <Card>
          <CardHeader title="Refresh schedule" subtitle="When each layer is rebuilt" icon={CalendarClock} />
          <DataTable dense rowKey="dataset" rows={CENSUS_SCHEDULE} columns={[
            { key: 'dataset', header: 'Dataset', render: (r) => <span className="font-medium text-slate-900">{r.dataset}</span> },
            { key: 'source', header: 'Source', render: (r) => <span className="text-xs">{r.source}</span> },
            { key: 'frequency', header: 'Frequency' },
            { key: 'lastRefresh', header: 'Last refresh', render: (r) => <span className="font-mono text-[11px]">{r.lastRefresh}</span> },
            { key: 'nextRefresh', header: 'Next', render: (r) => <span className="font-mono text-[11px]">{r.nextRefresh}</span> },
          ]} />
        </Card>
      </div>
    </div>
  );
}
