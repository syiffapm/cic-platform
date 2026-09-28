import clsx from 'clsx';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CheckCircle2, ClipboardCheck, Timer, XCircle } from 'lucide-react';
import { Alert, Badge, Card, DataTable, PageHeader, StatCard, Tabs } from '@/components/ui';
import { formatMMK } from '@/lib/format';
import { useAdmin } from '../../lib/useAdmin';
import { STATUS_TONE, counts, formatHours, requestStats, slaState } from './components/requestUtils';

const TABS = [
  { id: 'Pending review', label: 'Pending review', match: (r) => r.status === 'Pending review' },
  { id: 'Validating', label: 'Validating', match: (r) => ['Submitted', 'Validating'].includes(r.status) },
  { id: 'Ready', label: 'Issued', match: (r) => r.status === 'Ready' },
  { id: 'Rejected', label: 'Rejected', match: (r) => r.status === 'Rejected' },
  { id: 'all', label: 'All', match: () => true },
];

export default function ReportRequests() {
  const { store, nrc, piiUnmasked, can } = useAdmin('adm.reportRequests');
  const navigate = useNavigate();
  const [tab, setTab] = useState('Pending review');
  const requests = store.reportRequests ?? [];
  const now = new Date();
  const stats = requestStats(requests, now);
  const asOf = now.toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

  const current = TABS.find((t) => t.id === tab);
  const rows = requests.filter(current.match)
    .map((r) => ({ ...r, sla: slaState(r, now), issues: counts(r.checks) }))
    .sort((a, b) => (a.sla?.hoursLeft ?? 1e9) - (b.sla?.hoursLeft ?? 1e9) || b.submittedAt.localeCompare(a.submittedAt));

  const columns = [
    { key: 'id', header: 'Request', render: (r) => (
      <div className="whitespace-nowrap">
        <Link to={`/gov/admin/report-requests/${r.id}`} className="font-mono text-xs font-semibold text-primary hover:underline" onClick={(e) => e.stopPropagation()}>{r.id}</Link>
        <span className="block text-[11px] text-slate-500">{r.submittedAt}</span>
      </div>
    ) },
    { key: 'name', header: 'Citizen', sortable: true, render: (r) => (
      <div className="whitespace-nowrap text-xs">
        <span className="font-medium text-slate-800">{r.name}</span>
        <span className="block font-mono text-[11px] text-slate-500">{nrc(r.nrc)}</span>
      </div>
    ) },
    { key: 'purpose', header: 'Purpose', render: (r) => <span className="text-xs text-slate-700">{r.purpose}</span> },
    { key: 'fee', header: 'Fee', render: (r) => <span className="whitespace-nowrap text-xs">{r.fee ? formatMMK(r.fee) : 'Free'}</span> },
    { key: 'checks', header: 'Checks', render: (r) => (
      <span className="whitespace-nowrap text-xs">
        {r.issues.fail > 0 && <Badge tone="red" className="mr-1">{r.issues.fail} failed</Badge>}
        {r.issues.warn > 0 ? <Badge tone="amber">{r.issues.warn} warning{r.issues.warn > 1 ? 's' : ''}</Badge> : !r.issues.fail && <Badge tone="green">All passed</Badge>}
      </span>
    ) },
    { key: 'status', header: 'Status', sortable: true, render: (r) => <Badge tone={STATUS_TONE[r.status]}>{r.status === 'Ready' ? 'Issued' : r.status}</Badge> },
    { key: 'sla', header: 'Decision due', render: (r) => (r.sla
      ? <span className={clsx('whitespace-nowrap text-xs font-medium', r.sla.breached ? 'text-red-700' : r.sla.hoursLeft <= 4 ? 'text-amber-700' : 'text-slate-700')} title={`Due ${r.sla.due}`}>{r.sla.label}</span>
      : <span className="whitespace-nowrap text-xs text-slate-500">{r.reviewedBy ? `${r.reviewedBy} · ${r.reviewedAt}` : '—'}</span>) },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Credit report requests"
        subtitle="Citizens request their personal credit report online. CIC validates the file, an officer approves, and the report is issued and the citizen notified by SMS or email. Decide every request within 1 working day."
        breadcrumbs={[{ label: 'Service desk' }, { label: 'Credit report requests' }]}
      />

      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <StatCard label={`Pending review (${stats.overdue} overdue)`} value={stats.pendingReview} icon={ClipboardCheck} tone="warm" definition="Requests that passed automated validation and wait for an officer decision" asOf={asOf} />
        <StatCard label={`Issued today (${stats.issuedWeek} this week)`} value={stats.issuedToday} icon={CheckCircle2} tone="green" definition="Reports approved and issued to the citizen, by decision date (week starts Monday)" asOf={asOf} />
        <StatCard label="Average time to issue" value={formatHours(stats.avgHours)} icon={Timer} tone="teal" definition="Mean elapsed time from submission to approval for issued reports. Target: 1 working day" asOf={asOf} />
        <StatCard label="Rejected" value={stats.rejected} icon={XCircle} tone="red" definition="Requests declined with a stated reason; the citizen is notified and may request again" asOf={asOf} />
      </div>

      {stats.overdue > 0 && (
        <Alert tone="danger" title={`${stats.overdue} request${stats.overdue > 1 ? 's are' : ' is'} past the 1-working-day decision target`}>
          Open the oldest request first. Overdue requests are reported in the monthly service-level report to the Central Bank.
        </Alert>
      )}
      {!piiUnmasked && can('approve') && (
        <Alert tone="info" title="NRC numbers are partially hidden for your role">Open a request to review the file. Approval and rejection are recorded in the audit log under your name.</Alert>
      )}

      <Card>
        <Tabs className="px-4" value={tab} onChange={setTab} tabs={TABS.map((t) => ({ id: t.id, label: t.label, count: requests.filter(t.match).length }))} />
        <DataTable columns={columns} rows={rows} searchKeys={['id', 'name', 'purpose', 'borrowerId']} pageSize={10}
          onRowClick={(r) => navigate(`/gov/admin/report-requests/${r.id}`)} emptyTitle="No requests in this queue" />
      </Card>
    </div>
  );
}
