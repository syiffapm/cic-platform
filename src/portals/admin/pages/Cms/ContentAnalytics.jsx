import { useMemo } from 'react';
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { BarChart3, Clock, Download, SearchX, ThumbsUp, Users } from 'lucide-react';
import { Badge, Button, Card, CardHeader, ChartCard, DataTable, PageHeader, StatCard, useToast } from '@/components/ui';
import { useStore } from '@/context/StoreContext';
import { AS_OF } from '@/data/kpis';
import { formatNumber } from '@/lib/format';
import { useAdmin } from '../../lib/useAdmin';
import { downloadCsv } from '../../lib/csv';
import { FAQ_NOT_HELPFUL, NO_RESULT_SEARCHES, TOP_PAGES, VIEWS_TREND } from '../../data/cmsExtras';

const C = { navy: '#264063', amber: '#f59e0b', teal: '#0d9488', slate: '#94a3b8', red: '#dc2626', emerald: '#059669' };
const axis = { fontSize: 11, fill: '#64748b' };
const mmss = (s) => `${Math.floor(s / 60)}m ${String(s % 60).padStart(2, '0')}s`;
const short = (s, n = 34) => (s.length > n ? `${s.slice(0, n - 1)}…` : s);

export default function ContentAnalytics() {
  const { can, audit } = useAdmin('cms.analytics');
  const readOnly = !can('update', 'cms.content');
  const { faqs } = useStore();
  const toast = useToast();

  const last4 = VIEWS_TREND.slice(-4);
  const views30 = last4.reduce((s, w) => s + w.en + w.mm, 0);
  const enTotal = last4.reduce((s, w) => s + w.en, 0);
  const mmTotal = views30 - enTotal;

  const faqVotes = useMemo(() => faqs.map((f) => {
    const notHelpful = FAQ_NOT_HELPFUL[f.id] ?? Math.round((f.helpful ?? 0) * 0.12);
    const helpful = f.helpful ?? 0;
    return { id: f.id, q: f.q.en, label: short(f.q.en), helpful, notHelpful, rate: helpful + notHelpful ? Math.round((helpful / (helpful + notHelpful)) * 100) : 0 };
  }).sort((a, b) => b.helpful + b.notHelpful - (a.helpful + a.notHelpful)), [faqs]);

  const helpfulTotal = faqVotes.reduce((s, f) => s + f.helpful, 0);
  const votesTotal = faqVotes.reduce((s, f) => s + f.helpful + f.notHelpful, 0);
  const helpfulPct = votesTotal ? Math.round((helpfulTotal / votesTotal) * 100) : 0;
  const langSplit = [{ name: 'Myanmar', value: mmTotal, color: C.navy }, { name: 'English', value: enTotal, color: C.amber }];

  const act = (row) => {
    audit('CONTENT_GAP_ACTION', `"${row.term}" → ${row.action}`);
    toast(`Task created: ${row.action} for "${row.term}" (assigned to CMS editors)`, 'success');
  };

  const exportCsv = () => {
    downloadCsv('cms-top-pages-30d.csv', TOP_PAGES, [{ key: 'path', header: 'Path' }, { key: 'title', header: 'Title' }, { key: 'views', header: 'Views (30d)' }, { key: 'avgSec', header: 'Avg time (s)' }, { key: 'bounce', header: 'Bounce %' }]);
    audit('CONTENT_ANALYTICS_EXPORT', 'cms-top-pages-30d.csv');
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Content analytics"
        subtitle="Public portal usage: page views, searches with no result and FAQ helpfulness. Consent-based, cookieless, no personal data."
        actions={<Button variant="outline" icon={Download} disabled={!can('export')} onClick={exportCsv}>Export CSV</Button>}
      />

      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <StatCard label="Page views (30 days)" value={formatNumber(views30)} icon={BarChart3} delta={6.8} deltaLabel="vs prior 30d" definition="Public portal page loads in the last 4 weekly buckets, EN + MM, bots excluded." asOf={AS_OF} />
        <StatCard label="Unique visitors" value={formatNumber(Math.round(views30 * 0.31))} icon={Users} tone="teal" delta={4.2} deltaLabel="vs prior 30d" definition="Distinct anonymous sessions (daily-rotating hash, no cookies without consent)." asOf={AS_OF} />
        <StatCard label="Avg. time on page" value={mmss(98)} icon={Clock} tone="warm" delta={-3.1} deltaLabel="vs prior 30d" definition="Mean engaged time per page view, excluding bounces under 5 seconds." asOf={AS_OF} />
        <StatCard label="FAQ helpfulness" value={`${helpfulPct}%`} icon={ThumbsUp} tone="green" definition="“Yes, helpful” votes ÷ all votes on FAQ answers (all time)." asOf={AS_OF} />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <ChartCard className="xl:col-span-2" title="Page views over time" subtitle="Weekly, by interface language" asOf={AS_OF} height={280}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={VIEWS_TREND} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
              <XAxis dataKey="week" tick={axis} tickLine={false} axisLine={false} />
              <YAxis tick={axis} tickLine={false} axisLine={false} tickFormatter={(v) => `${Math.round(v / 1000)}k`} width={40} />
              <Tooltip itemStyle={{ color: '#334155' }} formatter={(v) => formatNumber(v)} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Area type="monotone" dataKey="mm" name="Myanmar" stackId="1" stroke={C.navy} fill={C.navy} fillOpacity={0.75} />
              <Area type="monotone" dataKey="en" name="English" stackId="1" stroke={C.amber} fill={C.amber} fillOpacity={0.65} />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Language split" subtitle="Page views, last 30 days" asOf={AS_OF} height={280}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={langSplit} dataKey="value" nameKey="name" innerRadius="55%" outerRadius="80%" paddingAngle={2} label={({ percent }) => `${Math.round(percent * 100)}%`}>
                {langSplit.map((d) => <Cell key={d.name} fill={d.color} />)}
              </Pie>
              <Tooltip itemStyle={{ color: '#334155' }} formatter={(v) => formatNumber(v)} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <ChartCard title="FAQ helpfulness votes" subtitle="“Was this answer helpful?” — Yes vs No per FAQ (from the Public FAQ)" asOf={AS_OF} height={Math.max(240, faqVotes.length * 34)}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={faqVotes} layout="vertical" margin={{ top: 4, right: 16, left: 8, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
            <XAxis type="number" tick={axis} tickLine={false} axisLine={false} />
            <YAxis type="category" dataKey="label" tick={axis} tickLine={false} axisLine={false} width={220} />
            <Tooltip itemStyle={{ color: '#334155' }} formatter={(v, n) => [formatNumber(v), n]} labelFormatter={(_, p) => p?.[0]?.payload?.q ?? ''} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Bar dataKey="helpful" name="Helpful" stackId="v" fill={C.teal} radius={[0, 0, 0, 0]} />
            <Bar dataKey="notHelpful" name="Not helpful" stackId="v" fill={C.red} radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader icon={BarChart3} title="Top pages" subtitle="Last 30 days" />
          <DataTable
            dense
            rows={TOP_PAGES}
            columns={[
              { key: 'title', header: 'Page', render: (r) => <div><p className="font-medium text-slate-900">{r.title}</p><p className="font-mono text-[11px] text-slate-500">{r.path}</p></div> },
              { key: 'views', header: 'Views', sortable: true, className: 'text-right', render: (r) => formatNumber(r.views) },
              { key: 'avgSec', header: 'Avg time', sortable: true, render: (r) => mmss(r.avgSec) },
              { key: 'bounce', header: 'Bounce', sortable: true, render: (r) => `${r.bounce}%` },
            ]}
          />
        </Card>

        <Card>
          <CardHeader icon={SearchX} title="Searches with no result" subtitle="Site search terms returning zero hits — content gaps" />
          <DataTable
            dense
            rows={NO_RESULT_SEARCHES}
            columns={[
              { key: 'term', header: 'Search term', render: (r) => <span className="font-medium text-slate-900" lang={/[က-႟]/.test(r.term) ? 'my' : 'en'}>{r.term}</span> },
              { key: 'count', header: 'Searches', sortable: true, render: (r) => <Badge tone={r.count > 200 ? 'red' : r.count > 100 ? 'amber' : 'slate'}>{formatNumber(r.count)}</Badge> },
              { key: 'action', header: 'Suggested action', render: (r) => <Button size="sm" variant="outline" disabled={readOnly} onClick={() => act(r)}>{r.action}</Button> },
            ]}
          />
        </Card>
      </div>
    </div>
  );
}
