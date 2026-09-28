import { Link, useSearchParams } from 'react-router-dom';
import { AlertTriangle, Bell, Eye, FileSearch, FileText, Gavel, HandCoins, Wallet } from 'lucide-react';
import { Card, CardBody, CardHeader, EmptyState, PageHeader, StatCard } from '@/components/ui';
import { formatDate, formatDateTime, formatMMK } from '@/lib/format';
import { PURPOSE_CODES } from '@/data/reference';
import { AuditFootnote, ButtonLink } from '../../components/Common';
import { DisputeBadge, SlaCountdown } from '../../components/DisputeStatus';
import { AppStatusBadge } from '../../components/LoanApp';
import NextSteps from '../../components/NextSteps';
import { GetReportCard, OpenRequestCard } from '../../components/ReportRequestCards';
import ScoreCard from '../../components/ScoreCard';
import WelcomeChecklist from '../../components/WelcomeChecklist';
import { isOpenDispute, mfiName, useBorrower, useOwnApplications, useOwnDisputes, useOwnInquiries } from '../../lib/borrower';
import { useAllAlerts, useReportRequests } from '../../lib/reports';

const purposeLabel = (code) => PURPOSE_CODES.find((p) => p.code === code)?.label ?? code;
const OPEN_APP = ['Submitted', 'Credit check', 'Approved'];

/** "My summary" dashboard: CIC score, loans, who checked me, applications, disputes, alerts. */
export default function DashboardPage() {
  const user = useBorrower();
  const [params] = useSearchParams();
  const disputes = useOwnDisputes();
  const inquiries = useOwnInquiries();
  const applications = useOwnApplications();
  const [alerts] = useAllAlerts();
  const state = useReportRequests();
  const snap = state.snapshot;
  const loans = snap?.loanViews ?? [];
  const asOf = snap ? formatDate(snap.dataAsOf) : undefined;
  const today = formatDate(new Date());

  const active = loans.filter((l) => l.status === 'Active');
  const outstanding = active.reduce((s, l) => s + l.balance, 0);
  const open = disputes.filter(isOpenDispute);
  const recent = [...inquiries].sort((a, b) => b.at.localeCompare(a.at)).slice(0, 3);
  const ninetyDaysAgo = new Date(Date.now() - 90 * 864e5);
  const inquiries90 = inquiries.filter((i) => new Date(i.at) >= ninetyDaysAgo).length;
  const late = active.filter((l) => l.dpd > 0);
  const openApps = applications.filter((a) => OPEN_APP.includes(a.status));

  const actions = (
    <>
      <ButtonLink to="/borrower/loans/apply" variant="outline" icon={HandCoins}>Apply for a loan</ButtonLink>
      {snap
        ? <ButtonLink to="/borrower/report" icon={FileText}>View my credit report</ButtonLink>
        : <ButtonLink to={state.open ? `/borrower/requests/${state.open.id}` : '/borrower/requests/new'} icon={FileSearch}>{state.open ? 'Track my report request' : 'Request my credit report'}</ButtonLink>}
    </>
  );

  return (
    <div>
      <PageHeader
        title={`Mingalaba, ${user?.name ?? ''}`}
        subtitle="Your credit file at a glance. Tap any box to see the details behind it."
        actions={actions}
      />

      <WelcomeChecklist firstVisit={params.get('welcome') === '1'} />

      {late.length > 0 && (
        <div className="mb-5 flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-3.5 text-sm text-amber-900" role="status">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <p>
            {(() => { const list = late.map((l) => `${l.id} — ${mfiName(l.mfiId)}, ${l.dpd} days late`).join('; '); return late.length === 1 ? `One loan is reported as late: ${list}.` : `${late.length} loans are reported as late: ${list}.`; })()}{' '}
            Contact your lender to agree a plan. If you have already paid, <Link to="/borrower/disputes/new" className="font-semibold underline">file a dispute</Link>.
          </p>
        </div>
      )}

      {snap ? (
        <div className="space-y-4">
          <ScoreCard report={snap} dataAsOf={snap.dataAsOf} />
          {state.open && <OpenRequestCard request={state.open} />}
          <NextSteps state={state} compact />
        </div>
      ) : <GetReportCard state={state} />}

      <div className="mt-6 grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-5">
        <StatCard label="Active loans" value={snap ? active.length : '—'} icon={FileText} tone="navy" definition={snap ? 'Loans you are still repaying, as shown in your issued report.' : 'Shown once your credit report is issued.'} asOf={asOf} />
        <StatCard label="Total outstanding" value={snap ? formatMMK(outstanding, { compact: true }) : '—'} icon={Wallet} tone="warm" definition={snap ? 'Sum of the balances you still owe on all active loans in your issued report (not including guarantees).' : 'Shown once your credit report is issued.'} asOf={asOf} />
        <StatCard label="Views in last 90 days" value={inquiries90} icon={Eye} tone="teal" definition="How many times a lender checked your report in the last 90 days." asOf={today} />
        <StatCard label="Applications in progress" value={openApps.length} icon={HandCoins} tone="navy" definition="Online loan applications waiting for a lender's decision or disbursement." asOf={today} />
        <StatCard className="col-span-2 xl:col-span-1" label="Open disputes" value={open.length} icon={Gavel} tone={open.length ? 'violet' : 'green'} definition="Complaints you filed about wrong information that are not closed yet." asOf={today} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader title="Who looked at my report recently" subtitle="Lenders must have your permission and a stated reason." icon={Eye} action={<Link to="/borrower/who-viewed" className="text-xs font-semibold text-primary hover:underline">See all</Link>} />
          <ul className="divide-y divide-slate-100">
            {recent.map((i) => (
              <li key={i.id} className="flex flex-wrap items-center justify-between gap-2 px-5 py-3 text-sm">
                <div>
                  <p className="font-medium text-slate-800">{mfiName(i.mfiId)}</p>
                  <p className="text-xs text-slate-500">{purposeLabel(i.purpose)}{i.applicationId ? ` · your application ${i.applicationId}` : ` · ${i.reportType} report`}</p>
                </div>
                <span className="text-xs text-slate-500">{formatDateTime(i.at)}</span>
              </li>
            ))}
            {recent.length === 0 && <li><EmptyState compact icon={Eye} title="Nobody has viewed your report" description="A lender can only check your report with your consent. Every check will appear here." /></li>}
          </ul>
        </Card>

        <Card>
          <CardHeader title="Alerts" icon={Bell} action={<Link to="/borrower/alerts" className="text-xs font-semibold text-primary hover:underline">All alerts</Link>} />
          <ul className="divide-y divide-slate-100">
            {alerts.slice(0, 4).map((a) => (
              <li key={a.id} className="px-5 py-3">
                <Link to={a.link} className="block text-sm font-medium text-slate-800 hover:text-primary">
                  {!a.read && <span className="mr-1.5 inline-block h-2 w-2 rounded-full bg-warm" aria-label="Unread" />}
                  {a.title}
                </Link>
                <p className="text-[11px] text-slate-500">{formatDateTime(a.at)}</p>
              </li>
            ))}
            {alerts.length === 0 && <li><EmptyState compact icon={Bell} title="No alerts yet" description="We will tell you here and by SMS when something changes on your file." /></li>}
          </ul>
        </Card>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title="My loan applications" subtitle="Applications you made online through CIC." icon={HandCoins} action={<Link to="/borrower/loans" className="text-xs font-semibold text-primary hover:underline">All applications</Link>} />
          <CardBody className="space-y-3">
            {applications.length === 0 && <EmptyState compact icon={HandCoins} title="No applications yet" description="Apply to a licensed MFI online — you decide who may check your report." action={<ButtonLink to="/borrower/loans/apply" size="sm" variant="outline">Apply for a loan</ButtonLink>} />}
            {applications.slice(0, 3).map((a) => (
              <Link key={a.id} to={`/borrower/loans/${a.id}`} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-200 p-3 hover:border-primary-200 hover:bg-primary-50/30">
                <div>
                  <p className="text-sm font-medium text-slate-800">{a.product} · {formatMMK(a.amount)}</p>
                  <p className="text-[11px] text-slate-500">{mfiName(a.mfiId)} · <span className="font-mono">{a.id}</span></p>
                </div>
                <AppStatusBadge status={a.status} />
              </Link>
            ))}
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="My disputes" subtitle="Lenders have 10 working days to reply; CIC closes every case within 30 days." icon={Gavel} action={<ButtonLink to="/borrower/disputes/new" size="sm" variant="warm">File a dispute</ButtonLink>} />
          <CardBody className="space-y-3">
            {disputes.length === 0 && <EmptyState compact icon={Gavel} title="No disputes" description="If something in your report is wrong, you can file a free dispute." />}
            {disputes.slice(0, 3).map((d) => (
              <Link key={d.id} to={`/borrower/disputes/${d.id}`} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-200 p-3 hover:border-primary-200 hover:bg-primary-50/30">
                <div>
                  <p className="text-sm font-medium text-slate-800">{d.id} · {mfiName(d.mfiId)}</p>
                  <p className="font-mono text-[11px] text-slate-500">{d.loanId}</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <DisputeBadge status={d.status} />
                  <SlaCountdown dueAt={d.dueAt} closed={!isOpenDispute(d)} />
                </div>
              </Link>
            ))}
          </CardBody>
        </Card>
      </div>

      <AuditFootnote action="Opening your summary" />
    </div>
  );
}
