import { useMemo, useState } from 'react';
import clsx from 'clsx';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, ClipboardPlus, Clock, Download, FileInput, Inbox, Wallet } from 'lucide-react';
import { Badge, Card, DataTable, PageHeader, StatCard, Tabs, useToast } from '@/components/ui';
import { useStore } from '@/context/StoreContext';
import { formatMMK } from '@/lib/format';
import { useTenant } from '../../components/MfiState';
import { PermButton, ViewOnlyBanner } from '../../components/access';
import { downloadFile, toCsv } from '../../components/download';
import CaptureApplicationModal from '../../components/applications/CaptureApplicationModal';
import AppSlaBadge from '../../components/applications/AppSlaBadge';
import { APP_STATUSES, DECISION_SLA_DAYS, OPEN_STATUSES, consentState, decisionSla, isoDate, statusTone } from '../../components/applications/appUtils';

const TABS = ['Open', ...APP_STATUSES, 'All'];

/** Urgency against the decision service standard; decided applications have none. */
const URGENCY = [
  { id: 'all', label: 'Any deadline' },
  { id: 'overdue', label: 'Overdue', tone: 'bg-red-600' },
  { id: 'soon', label: 'Due within 1 working day', tone: 'bg-amber-500' },
  { id: 'ontrack', label: 'On track', tone: 'bg-emerald-600' },
];
const urgencyOf = (a) => {
  if (!OPEN_STATUSES.includes(a.status)) return 'decided';
  const { left } = decisionSla(a);
  return left < 0 ? 'overdue' : left <= 1 ? 'soon' : 'ontrack';
};

/** Open applications first, overdue first, then due soonest; decided ones after, newest first. */
function byUrgency(a, b) {
  const oa = OPEN_STATUSES.includes(a.status); const ob = OPEN_STATUSES.includes(b.status);
  if (oa !== ob) return oa ? -1 : 1;
  if (oa) return (decisionSla(a).left - decisionSla(b).left) || a.submittedAt.localeCompare(b.submittedAt);
  return b.submittedAt.localeCompare(a.submittedAt);
}

/** Inbox of online and branch-captured loan applications addressed to this institution. */
export default function ApplicationInbox() {
  const { user, tenant } = useTenant();
  const { loanApplications, logAudit } = useStore();
  const navigate = useNavigate();
  const toast = useToast();
  const [tab, setTab] = useState('Open');
  const [urgency, setUrgency] = useState('all');
  const [capturing, setCapturing] = useState(false);

  // Tenant filter comes from the session, never from the URL.
  const own = useMemo(() => loanApplications.filter((a) => a.mfiId === tenant).sort(byUrgency), [loanApplications, tenant]);
  const countOf = (t) => (t === 'All' ? own.length : t === 'Open' ? own.filter((a) => OPEN_STATUSES.includes(a.status)).length : own.filter((a) => a.status === t).length);
  const inTab = tab === 'All' ? own : tab === 'Open' ? own.filter((a) => OPEN_STATUSES.includes(a.status)) : own.filter((a) => a.status === tab);
  const urgencyCount = (u) => inTab.filter((a) => urgencyOf(a) === u).length;
  const rows = urgency === 'all' ? inTab : inTab.filter((a) => urgencyOf(a) === urgency);

  const today = isoDate();
  const month = today.slice(0, 7);
  const decided = own.filter((a) => a.decision?.at?.startsWith(month) && ['Approved', 'Rejected'].includes(a.decision.outcome));
  const approved = decided.filter((a) => a.decision.outcome === 'Approved').length;
  const disbursedAmt = own.filter((a) => a.status === 'Disbursed').reduce((s, a) => s + (a.decision?.approvedAmount ?? a.amount), 0);

  const exportCsv = () => {
    downloadFile(`loan-applications-${tenant}-${today}.csv`, toCsv(rows.map((a) => ({ ...a, name: a.applicant.name, township: a.applicant.township, consentState: consentState(a).label })), [
      { key: 'id', header: 'Application' }, { key: 'submittedAt', header: 'Submitted' }, { key: 'name', header: 'Applicant' }, { key: 'township', header: 'Township' },
      { key: 'product', header: 'Product' }, { key: 'amount', header: 'Amount (MMK)' }, { key: 'tenor', header: 'Tenor' }, { key: 'channel', header: 'Channel' },
      { key: 'consentState', header: 'Consent' }, { key: 'status', header: 'Status' },
    ]));
    logAudit({ actor: user.name, role: user.role, tenant, action: 'APPLICATIONS_EXPORT', module: 'Loan applications', target: `${rows.length} applications`, outcome: 'Success' });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Loan applications"
        subtitle={`Applications submitted to your institution through the CIC borrower portal or captured at your branches. Each carries the applicant's digital consent for one credit check. Decide within ${DECISION_SLA_DAYS} working days — the most urgent are listed first.`}
        actions={(
          <>
            <PermButton feature="mfi.applications" action="export" what="export applications" variant="outline" icon={Download} onClick={exportCsv} disabled={!rows.length}>Export CSV</PermButton>
            <PermButton feature="mfi.applications" action="create" what="capture applications" icon={ClipboardPlus} onClick={() => setCapturing(true)}>Capture application</PermButton>
          </>
        )}
      />
      <ViewOnlyBanner feature="mfi.applications" />

      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <StatCard label="New today" value={own.filter((a) => a.submittedAt.startsWith(today)).length} icon={FileInput} tone="navy" definition="Applications received since 00:00 today, all channels." asOf={today} />
        <StatCard label="Awaiting decision" value={countOf('Open')} icon={Clock} tone="warm" definition={`Submitted or in credit check. Service standard: decision within ${DECISION_SLA_DAYS} working days of submission.`} asOf={today} />
        <StatCard label="Approval rate this month" value={decided.length ? `${Math.round((approved / decided.length) * 100)}%` : '—'} icon={CheckCircle2} tone="teal" definition="Approved ÷ (approved + declined) for decisions made this calendar month." asOf={today} />
        <StatCard label="Disbursed via applications" value={formatMMK(disbursedAmt, { compact: true })} icon={Wallet} tone="green" definition="Total principal disbursed on loans that originated as an application in this inbox." asOf={today} />
      </div>

      <Card>
        <Tabs className="px-3 pt-2" tabs={TABS.map((t) => ({ id: t, label: t, count: countOf(t) }))} value={tab} onChange={setTab} />
        <DataTable
          rows={rows}
          searchKeys={['id', 'product', 'purpose', 'channel']}
          onRowClick={(a) => navigate(`/mfi/applications/${a.id}`)}
          emptyTitle={urgency !== 'all' ? `No ${URGENCY.find((u) => u.id === urgency).label.toLowerCase()} applications in this view` : `No ${tab === 'All' ? '' : tab.toLowerCase()} applications`}
          toolbar={(
            <div role="group" aria-label="Filter by decision deadline" className="flex flex-wrap gap-1.5">
              {URGENCY.map((u) => {
                const n = u.id === 'all' ? null : urgencyCount(u.id);
                const on = urgency === u.id;
                return (
                  <button
                    key={u.id}
                    type="button"
                    aria-pressed={on}
                    onClick={() => setUrgency(u.id)}
                    className={clsx('inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-warm',
                      on ? 'border-primary bg-primary text-white' : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300')}
                  >
                    {u.tone && <span className={clsx('h-2 w-2 rounded-full', u.tone)} aria-hidden="true" />}
                    {u.label}{n !== null && <span className={clsx('rounded-full px-1.5 text-[11px]', on ? 'bg-white/20' : 'bg-slate-100 text-slate-700')}>{n}</span>}
                  </button>
                );
              })}
            </div>
          )}
          columns={[
            { key: 'id', header: 'Application', sortable: true, render: (a) => <><span className="font-mono text-xs font-semibold text-primary">{a.id}</span><span className="block text-[11px] text-slate-500">{a.submittedAt}</span></> },
            { key: 'applicant', header: 'Applicant', render: (a) => <>{a.applicant.name}<span className="block text-[11px] text-slate-500">{a.applicant.township} · {a.applicant.occupation}</span></> },
            { key: 'amount', header: 'Requested', sortable: true, render: (a) => <>{formatMMK(a.amount)}<span className="block text-[11px] text-slate-500">{a.product} · {a.tenor} months</span></> },
            { key: 'channel', header: 'Channel', render: (a) => <Badge tone={a.channel.startsWith('Borrower') ? 'teal' : 'navy'}>{a.channel}</Badge> },
            { key: 'consent', header: 'Consent', render: (a) => { const c = consentState(a); return <Badge tone={c.tone}>{c.label}</Badge>; } },
            { key: 'status', header: 'Status', render: (a) => <Badge tone={statusTone(a.status)}>{a.pendingApproval ? 'Awaiting 2nd approver' : a.status}</Badge> },
            { key: 'sla', header: 'Decision due', render: (a) => <AppSlaBadge app={a} /> },
          ]}
        />
      </Card>
      <CaptureApplicationModal
        open={capturing}
        onClose={() => setCapturing(false)}
        onCaptured={(app) => { setCapturing(false); toast(`Application ${app.id} captured for ${app.applicant.name}`, 'success'); navigate(`/mfi/applications/${app.id}`); }}
      />
      {own.length === 0 && <p className="flex items-center gap-2 text-xs text-slate-500"><Inbox className="h-4 w-4" aria-hidden="true" /> New applications appear here as soon as they are submitted.</p>}
    </div>
  );
}
