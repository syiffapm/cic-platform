import { useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertOctagon, Banknote, Building2, Percent, Scale, TrendingDown, Users, UsersRound } from 'lucide-react';
import { AS_OF, kpi } from '@/data/kpis';
import { useSession } from '@/context/AuthContext';
import { useStore } from '@/context/StoreContext';
import { formatMMK, formatNumber } from '@/lib/format';
import { Card, CardBody, CardHeader, PageHeader, StatCard } from '@/components/ui';
import FilterBar from '../../components/overview/FilterBar';
import useExecutiveData, { DEFAULT_FILTERS } from '../../components/overview/useExecutiveData';
import { AlertSummary, DisputeSla, Par30Chart, TopRiskList, TrendChart } from '../../components/overview/DashboardCharts';
import RegionMap from '../../components/RegionMap';
import RegionalPanel from '../../components/overview/RegionalPanel';
import { TOWNSHIP_REGIONS, TOWNSHIP_STATS } from '../../data/townships';
import { ExportButtons } from '../../components/common';
import { par30Tone } from '../../lib/chart';
import { downloadCsv } from '../../lib/util';

const def = (id, extra = '') => `${kpi(id).definition}. Source: ${kpi(id).source}.${extra}`;

export default function ExecutiveDashboard() {
  const user = useSession('gov');
  const { logAudit } = useStore();
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [selected, setSelected] = useState(null);
  const d = useExecutiveData(filters);
  const k = d.kpis;

  const tiles = [
    { label: 'MFIs reporting', value: `${k.reporting} / ${k.licensed}`, icon: Building2, tone: 'navy', definition: def('coverage', ' Denominator: supervised MFIs in scope.') },
    { label: 'Borrowers covered', value: formatNumber(k.borrowers), icon: Users, tone: 'teal', definition: def('borrowers') },
    { label: 'Gross portfolio', value: formatMMK(k.portfolio, { compact: true }), icon: Banknote, tone: 'navy', definition: def('portfolio') },
    { label: 'PAR30', value: `${k.par30}%`, icon: Percent, tone: k.par30 > 5 ? 'red' : 'warm', definition: def('par30') },
    { label: 'NPL ratio', value: `${k.npl}%`, icon: TrendingDown, tone: 'warm', definition: def('npl') },
    { label: 'Over-indebted borrowers', value: formatNumber(k.overIndebted), icon: UsersRound, tone: 'violet', definition: `Borrowers with ≥ 3 active loans across MFIs or debt-to-income above 50%. Source: ${kpi('multi').source}.` },
    { label: 'Disputes open', value: k.disputesOpen, icon: Scale, tone: 'red', definition: 'Disputes filed and not yet resolved or rejected, across all channels. Source: dispute & correction register.' },
    { label: 'Dispute SLA compliance', value: `${kpi('disputeSla').value}%`, icon: AlertOctagon, tone: 'teal', definition: def('disputeSla') },
  ];

  const exportCsv = () => {
    const rows = [
      ...tiles.map((t) => ({ section: 'KPI', item: t.label, value: t.value, asOf: AS_OF })),
      ...d.trend.map((m) => ({ section: 'Trend', item: m.month, value: `portfolio ${m.portfolio} bn; PAR30 ${m.par30}%`, asOf: AS_OF })),
      ...d.byArea.map((r) => ({ section: 'By area', item: r.name, value: `${r.portfolio} bn; PAR30 ${r.par30}%`, asOf: AS_OF })),
    ];
    downloadCsv(`executive-dashboard-${AS_OF.replace(/ /g, '')}.csv`, rows);
    logAudit({ actor: user.name, role: user.role, tenant: 'CBM', action: 'REPORT_EXPORT', module: 'Executive dashboard', target: JSON.stringify(filters), outcome: 'Success' });
  };

  const sel = TOWNSHIP_STATS.find((t) => t.code === selected);

  return (
    <div>
      <PageHeader
        title="Executive dashboard"
        subtitle={`Sector-wide microfinance credit indicators for supervisors and the Governor's office. Aggregated data only — as of ${AS_OF}.`}
        actions={<ExportButtons onCsv={exportCsv} />}
      />
      <FilterBar value={filters} onChange={setFilters} share={d.share} />

      <section aria-label="Key indicators" className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        {tiles.map((t) => <StatCard key={t.label} {...t} asOf={AS_OF} />)}
      </section>

      <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-2">
        <TrendChart data={d.trend} />
        <Par30Chart data={d.trend} />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader
            title="Regional heat-map — PAR30"
            subtitle="States and regions shaded by PAR30. Select a region on the map or in the list to see its townships."
          />
          <CardBody>
            <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_280px]">
              <div>
                <RegionMap
                  townships={TOWNSHIP_STATS}
                  dimmed={(t) => !!filters.region && t.region !== filters.region}
                  regionTone={(r) => par30Tone(r.par30)}
                  regionMetric={(r) => `PAR30 ${r.par30}% · portfolio ${r.portfolio} bn MMK`}
                  onRegionSelect={(region) => { const r = region === 'Mandalay' && filters.region === 'Nay Pyi Taw' ? 'Nay Pyi Taw' : region; if (!TOWNSHIP_REGIONS.includes(r)) return; setFilters((f) => ({ ...f, region: f.region === r ? '' : r })); setSelected(null); }}
                  selectedRegion={filters.region}
                />
                {sel && (
                  <div className="mt-3 rounded-lg border border-slate-200 bg-white p-3 text-xs">
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <p className="text-sm font-semibold text-slate-900">{sel.name} <span className="font-normal text-slate-500">· {sel.region}</span></p>
                      <button type="button" onClick={() => setSelected(null)} className="text-[11px] text-slate-500 hover:text-primary">Clear</button>
                    </div>
                    <dl className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1.5 sm:grid-cols-5">
                      {[['PAR30', `${sel.par30}% · ${par30Tone(sel.par30).label}`], ['Borrowers', formatNumber(sel.borrowers)], ['Portfolio', `${sel.portfolio} bn MMK`], ['≥ 3 active loans', formatNumber(sel.multi)], ['Women borrowers', `${sel.womenPct}%`]].map(([a, b]) => (
                        <div key={a}><dt className="text-slate-500">{a}</dt><dd className="font-medium text-slate-800">{b}</dd></div>
                      ))}
                    </dl>
                    <Link to="/gov/over-indebtedness" className="mt-2 inline-block text-[11px] font-medium text-primary hover:underline">Over-indebtedness monitor →</Link>
                  </div>
                )}
              </div>
              <div className="rounded-lg bg-slate-50 p-4">
                <RegionalPanel
                  rows={d.byArea}
                  byTownship={!!filters.region}
                  activeRegion={filters.region}
                  onPickRegion={(region) => { if (region && !TOWNSHIP_REGIONS.includes(region)) return; setFilters((f) => ({ ...f, region })); setSelected(null); }}
                  onPickTownship={(name) => setSelected(TOWNSHIP_STATS.find((t) => t.name === name)?.code ?? null)}
                  selected={filters.region ? sel?.name : null}
                />
              </div>
            </div>
          </CardBody>
        </Card>
        <TopRiskList rows={d.topRisk} />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-2">
        <AlertSummary rows={d.alertSummary} />
        <DisputeSla sla={d.sla} compliance={kpi('disputeSla').value} />
      </div>
    </div>
  );
}
