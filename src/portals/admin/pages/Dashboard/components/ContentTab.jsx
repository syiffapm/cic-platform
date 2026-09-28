import { Link } from 'react-router-dom';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { CheckCircle2, Clock, Eye, Languages, SearchX } from 'lucide-react';
import { Badge, Card, CardHeader, ChartCard, StatCard } from '@/components/ui';
import { formatNumber } from '@/lib/format';
import { DASH_AS_OF, NO_RESULT_SEARCHES, TOP_PAGES } from '../../../data/ops';
import { C, axis } from './chartTheme';

const missingMm = (a) => !a.title?.mm || !a.body?.mm;

/** Content dashboard (§9, CMS-16): published/pending, translation gaps, top pages, no-result searches. */
export default function ContentTab({ announcements }) {
  const published = announcements.filter((a) => a.status === 'Published');
  const pending = announcements.filter((a) => ['In review', 'Draft', 'Approved', 'Scheduled'].includes(a.status));
  const gaps = announcements.filter(missingMm);
  const totalViews = TOP_PAGES.reduce((s, p) => s + p.views, 0);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <StatCard label="Published items" value={published.length} icon={CheckCircle2} tone="green"
          definition="Announcements with workflow status Published (all classifications)" asOf={DASH_AS_OF} />
        <StatCard label="Pending in workflow" value={pending.length} icon={Clock} tone="warm"
          definition="Items in Draft, In review, Approved or Scheduled — not yet live" asOf={DASH_AS_OF} />
        <StatCard label="Translation gaps (MM missing)" value={gaps.length} icon={Languages} tone="red"
          definition="Items whose Myanmar title or body is empty; publishing is blocked when the MM-required setting is on" asOf={DASH_AS_OF} />
        <StatCard label="Page views (30 days)" value={formatNumber(totalViews)} icon={Eye} tone="navy"
          definition="Views of the six most-visited public pages in the last 30 days (privacy-preserving analytics)" asOf={DASH_AS_OF} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <ChartCard className="lg:col-span-2" title="Top pages" subtitle="Views, last 30 days" asOf={DASH_AS_OF}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={TOP_PAGES} layout="vertical" margin={{ top: 4, right: 16, left: 24, bottom: 0 }}>
              <CartesianGrid horizontal={false} stroke="#e2e8f0" />
              <XAxis type="number" {...axis} tickFormatter={(v) => `${Math.round(v / 1000)}k`} />
              <YAxis type="category" dataKey="page" width={150} {...axis} />
              <Tooltip itemStyle={{ color: '#334155' }} formatter={(v) => [formatNumber(v), 'Views']} />
              <Bar dataKey="views" fill={C.teal} radius={[0, 4, 4, 0]} barSize={18} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
        <Card>
          <CardHeader icon={SearchX} title="Searches with no result" subtitle="Last 30 days · content gap signal" />
          <ul className="divide-y divide-slate-100">
            {NO_RESULT_SEARCHES.map((s) => (
              <li key={s.term} className="flex items-center justify-between gap-2 px-5 py-2.5">
                <span className="text-sm text-slate-800" lang={s.lang === 'MM' ? 'my' : 'en'}>{s.term}</span>
                <span className="flex items-center gap-2"><Badge tone="slate">{s.lang}</Badge><span className="text-sm font-semibold text-slate-700">{s.count}</span></span>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <Card>
        <CardHeader icon={Languages} title="Translation gaps" subtitle="Items missing Myanmar title or body"
          action={<Link to="/gov/admin/cms/translations" className="text-xs font-medium text-primary hover:underline">Translation manager</Link>} />
        {gaps.length === 0 ? <p className="px-5 py-6 text-center text-xs text-slate-500">All items are fully bilingual.</p> : (
          <ul className="divide-y divide-slate-100">
            {gaps.map((a) => (
              <li key={a.id} className="flex flex-col gap-1 px-5 py-2.5 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="truncate text-sm text-slate-800">{a.title?.en}</p>
                  <p className="text-[11px] text-slate-500">{a.id} · {a.classification} · missing {[!a.title?.mm && 'title', !a.body?.mm && 'body'].filter(Boolean).join(' + ')}</p>
                </div>
                <Badge status={a.status} />
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
