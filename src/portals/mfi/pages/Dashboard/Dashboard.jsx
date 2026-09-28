import { Link } from 'react-router-dom';
import { AlertTriangle, BellRing, ClipboardList, CalendarClock, FileStack, Gauge, Megaphone, MessageSquareWarning, Receipt, Search } from 'lucide-react';
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Badge, Card, CardBody, CardHeader, ChartCard, EmptyState, PageHeader, StatCard } from '@/components/ui';
import { useStore } from '@/context/StoreContext';
import { useI18n } from '@/i18n/I18nContext';
import { AS_OF, kpi } from '@/data/kpis';
import { formatDate, formatMMK, formatNumber, slaDaysLeft } from '@/lib/format';
import { DQ_TREND } from '../../data/monitoring';
import { INVOICES, TARIFF } from '../../data/institution';
import { useMfi, useTenant } from '../../components/MfiState';
import BatchStatus from '../../components/BatchStatus';
import PipelineStatus from '../../components/PipelineStatus';
import SlaBadge from '../../components/SlaBadge';
import ApplicationsWidget from '../../components/applications/ApplicationsWidget';
import AttentionPanel from '../../components/AttentionPanel';
import { AXIS, GRID, SERIES, TOOLTIP } from '../../components/chartTheme';
import { PermButton } from '../../components/access';
import { spendFor } from '@/lib/reportAccess';

const USED_BEFORE_TODAY = 16_842; // Sep 2026 month-to-date billable inquiries up to the last billing snapshot

export default function Dashboard() {
  const { user, tenant, institution, can } = useTenant();
  const { batches, alerts, reads } = useMfi();
  const { disputes, inquiries, announcementsFor, reportPurchases } = useStore();
  const spend = spendFor(reportPurchases, tenant, '2026-09');
  const { bi } = useI18n();

  const own = batches.filter((b) => b.tenant === tenant);
  const current = own.filter((b) => b.period === '2026-08').sort((a, b) => b.uploadedAt.localeCompare(a.uploadedAt))[0];
  const used = USED_BEFORE_TODAY + inquiries.filter((q) => q.mfiId === tenant && q.at >= '2026-09-24' && q.billable).length;
  const pct = Math.min(100, (used / TARIFF.quota) * 100);
  const openDisputes = disputes.filter((d) => d.mfiId === tenant && !['Resolved', 'Closed', 'Rejected'].includes(d.status));
  const dueInvoices = INVOICES.filter((i) => i.status === 'Unpaid');
  const newAlerts = alerts.filter((a) => a.tenant === tenant && a.status === 'New');
  const unreadMandatory = announcementsFor('mfi').filter((n) => n.mandatory && !reads[`${user.id}:${n.id}`]);

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Welcome, ${user.name}`}
        subtitle={`${institution?.name} · Licence ${institution?.licenceNo} · Lending, reporting and compliance for your institution.`}
        actions={(
          <>
            <PermButton hide feature="mfi.applications" action="read" what="open loan applications" to="/mfi/credit/applications" variant="outline" icon={ClipboardList}>Loan applications</PermButton>
            <PermButton hide feature="mfi.inquiry" action="create" what="make credit inquiries" to="/mfi/credit/inquiry" icon={Search}>New credit inquiry</PermButton>
            <PermButton hide feature="mfi.submissions" action="create" what="upload batches" to="/mfi/submissions" variant="warm" icon={FileStack}>Upload batch</PermButton>
          </>
        )}
      />

      <AttentionPanel />

      <h2 className="sr-only">Key figures</h2>
      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <StatCard label="Submission — Aug 2026 period" value={current ? current.status : 'Not submitted'} icon={FileStack} tone="navy" definition="Status of the latest batch for the current reporting period (month end 31 Aug 2026)." asOf="24 Sep 2026" />
        <StatCard label="Last cut-off" value="07 Sep 2026" icon={CalendarClock} tone="warm" definition="Monthly data must reach CIC by the 7th calendar day after month end. Next cut-off: 07 Oct 2026." asOf="24 Sep 2026 · next 07 Oct" />
        <StatCard label={kpi('dq').name} value={`${institution?.dqScore ?? 98.6}%`} icon={Gauge} tone="teal" definition={kpi('dq').definition} asOf={`${AS_OF} · up 0.1 pt vs Jul`} />
        <StatCard label="Open disputes" value={openDisputes.length} icon={MessageSquareWarning} tone={openDisputes.some((d) => slaDaysLeft(d.mfiDueAt) < 0) ? 'red' : 'violet'} definition="Disputes on your data not yet resolved. MFI response SLA: 10 working days." asOf="24 Sep 2026" />
      </div>

      {(can('mfi.inquiry', 'read') || can('mfi.billing', 'read')) && (
        <Card>
          <CardBody className="flex flex-col gap-2 py-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="flex items-center gap-2 text-sm text-slate-700">
              <Receipt className="h-4 w-4 text-primary" aria-hidden="true" />
              <span>Reports purchased this month — <b>USD {spend.amount.toFixed(2)}</b> · {spend.count} report(s): Basic {spend.basic}, Full {spend.full}</span>
            </p>
            <span className="flex gap-3 text-xs font-medium">
              {can('mfi.inquiry', 'read') && <Link to="/mfi/credit/unlocked" className="text-primary hover:underline">Unlocked reports</Link>}
              {can('mfi.billing', 'read') && <Link to="/mfi/institution/billing" className="text-primary hover:underline">Usage &amp; billing</Link>}
            </span>
          </CardBody>
        </Card>
      )}

      {can('mfi.applications', 'read') && <ApplicationsWidget tenant={tenant} />}

      {current && can('mfi.submissions', 'read') && (
        <Card>
          <CardHeader title={`Current batch ${current.id}`} subtitle={`${current.fileName} · schema ${current.schema} · uploaded ${current.uploadedAt} by ${current.uploadedByName}`} action={<BatchStatus status={current.status} />} />
          <CardBody className="space-y-3">
            <PipelineStatus status={current.status} />
            <p className="text-xs text-slate-500">
              {formatNumber(current.received)} received · {formatNumber(current.accepted)} accepted · <span className="text-red-600">{formatNumber(current.rejected)} rejected</span> · {formatNumber(current.warnings)} warnings.{' '}
              <Link to={`/mfi/submissions/${current.id}`} className="font-medium text-primary underline-offset-2 hover:underline">Open validation report</Link>
            </p>
          </CardBody>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-3 [&>*]:min-w-0">
        <ChartCard className="lg:col-span-2" title="Data quality score trend" subtitle={`${institution?.short} vs sector average, per monthly batch (%)`} asOf={AS_OF} height={260}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={DQ_TREND} margin={{ top: 8, right: 16, left: -12, bottom: 0 }}>
              <CartesianGrid stroke={GRID} vertical={false} />
              <XAxis dataKey="period" tick={AXIS} tickLine={false} axisLine={false} />
              <YAxis domain={[90, 100]} tick={AXIS} tickLine={false} axisLine={false} />
              <Tooltip {...TOOLTIP} formatter={(v) => `${v}%`} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Line type="monotone" dataKey="dq" name={institution?.short ?? 'PGMF'} stroke={SERIES[0]} strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
              <Line type="monotone" dataKey="sector" name="Sector average" stroke={SERIES[1]} strokeWidth={2} strokeDasharray="4 3" dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        {(can('mfi.inquiry', 'read') || can('mfi.billing', 'read')) && (
        <Card>
          <CardHeader title="Inquiries used vs quota" subtitle={`${TARIFF.tier} · September 2026`} icon={Search} />
          <CardBody className="space-y-4">
            <div>
              <div className="flex items-baseline justify-between">
                <span className="text-2xl font-bold text-slate-900">{formatNumber(used)}</span>
                <span className="text-xs text-slate-500">of {formatNumber(TARIFF.quota)}</span>
              </div>
              <div className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-slate-100" role="progressbar" aria-valuenow={Math.round(pct)} aria-valuemin={0} aria-valuemax={100} aria-label="Inquiry quota used">
                <div className={`h-full rounded-full ${pct > 90 ? 'bg-red-500' : pct > 75 ? 'bg-warm' : 'bg-teal'}`} style={{ width: `${pct}%` }} />
              </div>
              <p className="mt-1.5 text-[11px] text-slate-500">{pct.toFixed(1)}% used · resets 1 Oct 2026 · retries are never counted</p>
            </div>
            {can('mfi.billing', 'read') && (
            <div className="border-t border-slate-100 pt-4">
              <p className="flex items-center gap-2 text-xs font-semibold text-slate-700"><Receipt className="h-4 w-4 text-slate-500" /> Invoices due</p>
              {dueInvoices.map((i) => (
                <div key={i.id} className="mt-2 flex items-center justify-between rounded-lg bg-amber-50 px-3 py-2 text-xs">
                  <span><b>{i.period}</b> · due {formatDate(i.due)}</span>
                  <span className="font-semibold text-slate-800">{formatMMK(i.amount)}</span>
                </div>
              ))}
            </div>
            )}
          </CardBody>
        </Card>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-3 [&>*]:min-w-0">
        {can('mfi.disputes', 'read') && (
        <Card>
          <CardHeader title="Open disputes" subtitle="MFI response SLA" icon={MessageSquareWarning} action={<Link to="/mfi/disputes" className="text-xs font-medium text-primary hover:underline">Inbox</Link>} />
          <ul className="divide-y divide-slate-100">
            {openDisputes.length === 0 && <li><EmptyState compact title="No open disputes" /></li>}
            {openDisputes.map((d) => (
              <li key={d.id} className="flex items-center justify-between gap-3 px-5 py-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-slate-800">{d.id}</p>
                  <p className="truncate text-[11px] text-slate-500">{d.borrowerName} · {d.loanId} · <Badge status={d.status} /></p>
                </div>
                <SlaBadge due={d.mfiDueAt} done={d.status === 'Pending CIC approval'} />
              </li>
            ))}
          </ul>
        </Card>
        )}

        {can('mfi.monitoring', 'read') && (
        <Card>
          <CardHeader title="Portfolio alerts" subtitle={`${newAlerts.length} new on your borrowers`} icon={BellRing} action={<Link to="/mfi/monitoring" className="text-xs font-medium text-primary hover:underline">All alerts</Link>} />
          <ul className="divide-y divide-slate-100">
            {newAlerts.length === 0 && <li><EmptyState compact title="No new alerts on your borrowers" /></li>}
            {newAlerts.slice(0, 4).map((a) => (
              <li key={a.id} className="flex items-start gap-3 px-5 py-3">
                <AlertTriangle className={`mt-0.5 h-4 w-4 shrink-0 ${a.severity === 'High' ? 'text-red-500' : 'text-amber-500'}`} aria-hidden="true" />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-slate-800">{a.type} · {a.borrowerName}</p>
                  <p className="text-[11px] text-slate-500">{a.detail}</p>
                </div>
              </li>
            ))}
          </ul>
        </Card>
        )}

        {can('mfi.announcements', 'read') && (
        <Card>
          <CardHeader title="Mandatory notices" subtitle={`${unreadMandatory.length} awaiting your acknowledgement`} icon={Megaphone} action={<Link to="/mfi/resources/announcements" className="text-xs font-medium text-primary hover:underline">Inbox</Link>} />
          <ul className="divide-y divide-slate-100">
            {unreadMandatory.length === 0 && <li><EmptyState compact title="All mandatory notices acknowledged" /></li>}
            {unreadMandatory.map((n) => (
              <li key={n.id} className="px-5 py-3">
                <p className="text-sm font-medium text-slate-800">{bi(n.title)}</p>
                <p className="text-[11px] text-slate-500">{n.id} · published {formatDate(n.publishedAt)} · <Badge tone="red">Acknowledge required</Badge></p>
              </li>
            ))}
          </ul>
        </Card>
        )}
      </div>
    </div>
  );
}
