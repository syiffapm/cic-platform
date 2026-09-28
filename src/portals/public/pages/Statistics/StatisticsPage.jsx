import { Area, AreaChart, Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Download, Info } from 'lucide-react';
import { Button, ChartCard, useToast } from '@/components/ui';
import { AS_OF, kpi, PORTFOLIO_BY_REGION, SECTOR_TREND } from '@/data/kpis';
import { useI18n } from '@/i18n/I18nContext';
import { formatNumber } from '@/lib/format';
import PageHero, { PageBody } from '../../components/PageHero';
import { downloadCsv } from '../../lib/csv';
import DataTableToggle from './DataTableToggle';

const NAVY = 'hsl(214 45% 22%)';
const TEAL = 'hsl(173 58% 39%)';
const AXIS = { fontSize: 11, fill: '#64748b' };
const GRID = <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" vertical={false} />;
const TIP = { contentStyle: { borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12 }, cursor: { stroke: '#94a3b8', strokeWidth: 1 } };

const TREND_COLS = [
  { key: 'month', header: 'Month' },
  { key: 'portfolio', header: 'Gross portfolio (bn MMK)' },
  { key: 'par30', header: 'PAR30 (%)' },
  { key: 'npl', header: 'NPL ratio (%)' },
  { key: 'borrowers', header: 'Borrowers covered (thousands)' },
  { key: 'inquiries', header: 'Inquiries (thousands)' },
];
const REGION_COLS = [
  { key: 'region', header: 'Region / State' },
  { key: 'portfolio', header: 'Gross portfolio (bn MMK)' },
  { key: 'borrowers', header: 'Borrowers (thousands)' },
  { key: 'par30', header: 'PAR30 (%)' },
];

/** Public statistics: published aggregates only, "as of" label, CSV download. */
export default function StatisticsPage() {
  const { t } = useI18n();
  const toast = useToast();
  const stamp = AS_OF.replace(/\s/g, '-');

  const dl = (name, cols, rows) => {
    downloadCsv(`cic-${name}-${stamp}.csv`, cols, rows);
    toast(`Downloaded ${name}.csv`, 'success');
  };
  const csvButton = (name, cols, rows) => (
    <Button variant="outline" size="sm" icon={Download} onClick={() => dl(name, cols, rows)} aria-label={`Download ${name} as CSV`}>CSV</Button>
  );

  const tiles = ['portfolio', 'borrowers', 'par30', 'npl'].map(kpi);
  const tileValue = (k) => (k.id === 'portfolio' ? `${(k.value / 1e12).toFixed(2)} tn MMK` : k.unit === '%' ? `${k.value}%` : formatNumber(k.value));

  return (
    <>
      <PageHero title={t('public.nav.statistics')} subtitle="Anonymised aggregates of the microfinance sector, approved for publication by the Central Bank. No individual data is shown." breadcrumbs={[{ label: t('public.nav.statistics') }]}>
        <div className="flex flex-wrap items-center gap-3">
          <span className="rounded-lg bg-white/10 px-3 py-1.5 text-xs">As of {AS_OF} · updated monthly</span>
          <Button variant="warm" size="sm" icon={Download} onClick={() => dl('sector-trend', TREND_COLS, SECTOR_TREND)}>Download full dataset (CSV)</Button>
        </div>
      </PageHero>
      <PageBody className="space-y-6">
        <dl className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {tiles.map((k) => (
            <div key={k.id} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <dt className="text-xs font-medium text-slate-600">{k.name}</dt>
              <dd className="mt-2 text-2xl font-bold tracking-tight text-primary">{tileValue(k)}</dd>
              <dd className="mt-1 text-[11px] leading-snug text-slate-500">{k.definition}</dd>
              <dd className="mt-2 text-[11px] text-slate-500">As of {AS_OF}</dd>
            </div>
          ))}
        </dl>

        <div className="grid gap-6 lg:grid-cols-2">
          <ChartCard title="Gross portfolio, last 12 months" subtitle="Billion MMK, outstanding principal of active loans" asOf={AS_OF} action={csvButton('portfolio-trend', TREND_COLS.slice(0, 2), SECTOR_TREND)}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={SECTOR_TREND} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
                <defs>
                  <linearGradient id="pfFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={NAVY} stopOpacity={0.22} />
                    <stop offset="100%" stopColor={NAVY} stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                {GRID}
                <XAxis dataKey="month" tick={AXIS} tickLine={false} axisLine={false} />
                <YAxis tick={AXIS} tickLine={false} axisLine={false} domain={['dataMin - 40', 'dataMax + 20']} tickFormatter={(v) => formatNumber(Math.round(v))} />
                <Tooltip {...TIP} formatter={(v) => [`${formatNumber(v)} bn MMK`, 'Gross portfolio']} />
                <Area type="monotone" dataKey="portfolio" stroke={NAVY} strokeWidth={2} fill="url(#pfFill)" activeDot={{ r: 4, strokeWidth: 2, stroke: '#fff' }} />
              </AreaChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Portfolio at risk > 30 days (PAR30)" subtitle={kpi('par30').definition} asOf={AS_OF} action={csvButton('par30-trend', [TREND_COLS[0], TREND_COLS[2]], SECTOR_TREND)}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={SECTOR_TREND} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                {GRID}
                <XAxis dataKey="month" tick={AXIS} tickLine={false} axisLine={false} />
                <YAxis tick={AXIS} tickLine={false} axisLine={false} domain={[2.5, 4.5]} tickFormatter={(v) => `${v}%`} />
                <Tooltip {...TIP} formatter={(v) => [`${v}%`, 'PAR30']} />
                <Line type="monotone" dataKey="par30" stroke={TEAL} strokeWidth={2} dot={false} activeDot={{ r: 4, strokeWidth: 2, stroke: '#fff' }} />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

        <ChartCard title="Gross portfolio by region / state" subtitle="Billion MMK" asOf={AS_OF} height={340} action={csvButton('portfolio-by-region', REGION_COLS, PORTFOLIO_BY_REGION)}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={PORTFOLIO_BY_REGION} layout="vertical" margin={{ top: 0, right: 16, left: 8, bottom: 0 }} barCategoryGap={4}>
              <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" horizontal={false} />
              <XAxis type="number" tick={AXIS} tickLine={false} axisLine={false} />
              <YAxis type="category" dataKey="region" tick={AXIS} tickLine={false} axisLine={false} width={84} />
              <Tooltip {...TIP} cursor={{ fill: '#f1f5f9' }} formatter={(v) => [`${formatNumber(v)} bn MMK`, 'Gross portfolio']} />
              <Bar dataKey="portfolio" fill={NAVY} radius={[0, 4, 4, 0]} maxBarSize={22} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <DataTableToggle title="Monthly sector trend — data table" columns={TREND_COLS} rows={SECTOR_TREND} />
        <DataTableToggle title="Portfolio by region — data table" columns={REGION_COLS} rows={PORTFOLIO_BY_REGION} />

        <p className="flex items-start gap-2 rounded-lg bg-slate-100 p-4 text-xs text-slate-600">
          <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          Source: CIC data warehouse, published aggregates approved by the Director. Figures cover all reporting institutions and may be revised when late submissions are received. Methodology is described in the Statistical Bulletin.
        </p>
      </PageBody>
    </>
  );
}
