import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { AlertTriangle, Building2, DatabaseBackup, FileText, HeartPulse, Search, Wallet } from 'lucide-react';
import { Badge, Card, CardBody, CardHeader, ChartCard, StatCard } from '@/components/ui';
import { formatMMK, formatNumber } from '@/lib/format';
import { BACKUP_SUMMARY, DAILY_REPORTS, DASH_AS_OF, INCIDENTS, MONTHLY_REPORTS, OPS_KPIS, SYSTEM_HEALTH } from '../../../data/ops';
import AuditFeed from './AuditFeed';
import CitizenJourneyCard from './CitizenJourneyCard';
import ReportRequestsCard from './ReportRequestsCard';
import { C, STATUS_COLORS, axis } from './chartTheme';

export default function OperationsTab({ store, maskBorrower, links }) {
  const [range, setRange] = useState('30d');
  const { institutions, auditLog, reportRequests = [] } = store;

  const statusData = useMemo(() => {
    const counts = {};
    institutions.forEach((i) => { counts[i.status] = (counts[i.status] ?? 0) + 1; });
    return Object.entries(counts).map(([status, count]) => ({ status, count }));
  }, [institutions]);
  const licensed = institutions.filter((i) => i.status === 'Licensed').length;
  const collectedPct = Math.round((OPS_KPIS.collectedMonth / OPS_KPIS.billedMonth) * 1000) / 10;
  const volume = range === '30d' ? DAILY_REPORTS : MONTHLY_REPORTS;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <StatCard label="Reports issued today" value={formatNumber(OPS_KPIS.reportsToday)} icon={FileText} tone="navy"
          delta={Math.round(((OPS_KPIS.reportsToday - OPS_KPIS.reportsYesterday) / OPS_KPIS.reportsYesterday) * 1000) / 10} deltaLabel="vs same time yesterday"
          definition="Credit reports (basic + full) successfully generated since 00:00 MMT today" asOf={DASH_AS_OF} />
        <StatCard label="Active institutions" value={`${licensed} / ${institutions.length}`} icon={Building2} tone="teal"
          definition="Institutions in the Institution Master with licence status Licensed ÷ all institutions" asOf={DASH_AS_OF} />
        <StatCard label="Inquiry volume (month to date)" value={formatNumber(OPS_KPIS.inquiryVolumeMonth)} icon={Search} tone="warm"
          delta={4.8} deltaLabel="vs last month" definition="Billable inquiries by purpose and MFI (inquiry log, metering); retries excluded" asOf={DASH_AS_OF} />
        <StatCard label="Revenue billed vs collected" value={formatMMK(OPS_KPIS.billedMonth, { compact: true })} icon={Wallet} tone="green"
          delta={`${collectedPct}% collected`} deltaLabel={formatMMK(OPS_KPIS.collectedMonth, { compact: true })}
          definition="Invoiced inquiry fees for the current billing month; collected = payments reconciled against those invoices" asOf={DASH_AS_OF} />
      </div>

      <CitizenJourneyCard store={store} links={links} />
      <ReportRequestsCard requests={reportRequests} canOpen={links.reportRequests} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <ChartCard className="lg:col-span-2" title="Report volume" subtitle={range === '30d' ? 'Reports issued per day, last 30 days' : 'Reports issued per month, last 12 months'} asOf={DASH_AS_OF}
          action={(
            <div role="group" aria-label="Chart range" className="flex rounded-lg border border-slate-200 p-0.5 text-xs">
              {[['30d', '30 days'], ['12m', '12 months']].map(([id, label]) => (
                <button key={id} type="button" aria-pressed={range === id} onClick={() => setRange(id)}
                  className={`rounded-md px-2.5 py-1 font-medium ${range === id ? 'bg-primary text-white' : 'text-slate-600 hover:bg-slate-100'}`}>{label}</button>
              ))}
            </div>
          )}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={volume} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
              <defs>
                <linearGradient id="volFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={C.navy} stopOpacity={0.25} /><stop offset="100%" stopColor={C.navy} stopOpacity={0} /></linearGradient>
              </defs>
              <CartesianGrid vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="label" {...axis} interval={range === '30d' ? 4 : 0} />
              <YAxis {...axis} tickFormatter={(v) => (v >= 1000 ? `${Math.round(v / 1000)}k` : v)} />
              <Tooltip itemStyle={{ color: '#334155' }} formatter={(v, n) => [formatNumber(v), n === 'reports' ? 'Reports' : 'Failed']} />
              <Area type="monotone" dataKey="reports" stroke={C.navy} strokeWidth={2} fill="url(#volFill)" />
              <Area type="monotone" dataKey="failed" stroke={C.red} strokeWidth={1.5} fill="transparent" />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>
        <ChartCard title="Institution status" subtitle="From Institution Master" asOf={DASH_AS_OF}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={statusData} layout="vertical" margin={{ top: 4, right: 16, left: 16, bottom: 0 }}>
              <CartesianGrid horizontal={false} stroke="#e2e8f0" />
              <XAxis type="number" allowDecimals={false} {...axis} />
              <YAxis type="category" dataKey="status" width={90} {...axis} />
              <Tooltip itemStyle={{ color: '#334155' }} formatter={(v) => [v, 'Institutions']} />
              <Bar dataKey="count" radius={[0, 4, 4, 0]} barSize={22}>
                {statusData.map((d) => <Cell key={d.status} fill={STATUS_COLORS[d.status] ?? C.slate} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader icon={HeartPulse} title="System health" subtitle="Platform SLOs · last refreshed 09:00 MMT" />
          <CardBody className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {SYSTEM_HEALTH.map((h) => (
              <div key={h.id} className={`rounded-lg border p-3 ${h.ok ? 'border-emerald-200 bg-emerald-50/50' : 'border-amber-200 bg-amber-50/60'}`} title={h.definition}>
                <p className="text-[11px] font-medium text-slate-500">{h.label}</p>
                <p className="mt-1 text-xl font-bold text-slate-900">{h.value}</p>
                <p className="mt-1 text-[11px] text-slate-500">Target {h.target} · <Badge tone={h.ok ? 'green' : 'amber'}>{h.ok ? 'OK' : 'Attention'}</Badge></p>
                <p className="mt-1 text-[11px] leading-snug text-slate-500">{h.definition}</p>
              </div>
            ))}
          </CardBody>
        </Card>
        <div className="space-y-6">
          <Card>
            <CardHeader icon={DatabaseBackup} title="Backup status" subtitle={`${BACKUP_SUMMARY.frequency} incremental`} action={<Link to="/gov/admin/system" className="text-xs font-medium text-primary hover:underline">Details</Link>} />
            <CardBody className="grid grid-cols-2 gap-3 text-sm">
              <div><p className="text-[11px] text-slate-500">Last backup</p><p className="font-medium">{BACKUP_SUMMARY.last}</p></div>
              <div><p className="text-[11px] text-slate-500">RPO achieved</p><p className="font-medium text-emerald-700">{BACKUP_SUMMARY.rpoAchieved} <span className="text-xs text-slate-500">/ {BACKUP_SUMMARY.rpoTarget}</span></p></div>
              <div><p className="text-[11px] text-slate-500">Last restore test</p><p className="font-medium">{BACKUP_SUMMARY.lastRestoreTest}</p></div>
              <div><p className="text-[11px] text-slate-500">RTO achieved</p><p className="font-medium text-emerald-700">{BACKUP_SUMMARY.rtoAchieved} <span className="text-xs text-slate-500">/ 4 h</span></p></div>
            </CardBody>
          </Card>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2"><AuditFeed entries={auditLog} maskBorrower={maskBorrower} /></div>
        <Card>
          <CardHeader icon={AlertTriangle} title="Open incidents" subtitle={`${INCIDENTS.length} open`} />
          <ul className="divide-y divide-slate-100">
            {INCIDENTS.map((i) => (
              <li key={i.id} className="px-5 py-3">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-medium text-slate-800">{i.title}</p>
                  <Badge status={i.severity} />
                </div>
                <p className="mt-1 text-[11px] text-slate-500">{i.id} · {i.opened} · {i.owner} · <Badge status={i.status} /></p>
              </li>
            ))}
          </ul>
        </Card>
      </div>

    </div>
  );
}
