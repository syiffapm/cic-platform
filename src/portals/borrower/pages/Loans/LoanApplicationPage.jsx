import { useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { CheckCircle2, FileCheck2, FileText, Info, ShieldAlert, Undo2, XCircle } from 'lucide-react';
import { Alert, Badge, Button, Card, CardBody, CardHeader, EmptyState, PageHeader, Timeline, useToast } from '@/components/ui';
import ConfirmDialog from '../../components/ConfirmDialog';
import { useStore } from '@/context/StoreContext';
import { DECLINE_REASONS } from '@/data/seed';
import { formatDate, formatDateTime, formatMMK } from '@/lib/format';
import { AuditFootnote, ButtonLink, Fact } from '../../components/Common';
import { AppStatusBadge, AppTracker, consentStatus } from '../../components/LoanApp';
import { mfiName, stamp, useBorrower, useBorrowerAudit, useOwnApplications } from '../../lib/borrower';

const NEXT = {
  Submitted: 'The lender has received your application. A loan officer will check your CIC credit report (using your consent) and may call you to verify details — usually within 2 working days.',
  'Credit check': 'The lender has checked your credit report and is making a decision. Some lenders visit your home or business before deciding.',
  Approved: 'Your loan is approved. Visit the branch with your NRC to sign the loan agreement. The money is paid out after signing.',
  Disbursed: 'Your loan has been paid out. The lender reports it to CIC every month, so it is now part of your credit report.',
  Rejected: 'The lender declined this application. The reason is shown below. You can apply again later or to another licensed lender.',
  Withdrawn: 'You withdrew this application. The lender will not check your report for it.',
};

/** One online application: progress tracker, decision, consent status, timeline, withdraw. */
export default function LoanApplicationPage() {
  const { id } = useParams();
  const [params] = useSearchParams();
  const user = useBorrower();
  const audit = useBorrowerAudit();
  const toast = useToast();
  const { patch } = useStore();
  const app = useOwnApplications().find((a) => a.id === id);
  const [confirm, setConfirm] = useState(false);

  if (!app) {
    return (
      <div>
        <PageHeader title="Application not found" breadcrumbs={[{ label: 'My loans', to: '/borrower/loans' }, { label: id }]} />
        <Card><EmptyState icon={ShieldAlert} title="We couldn't find this application in your account" description="You can only see applications you made yourself. Check the reference, or contact the CIC helpdesk if you think this is a mistake." action={<ButtonLink to="/borrower/loans" variant="outline">Back to my loans</ButtonLink>} /></Card>
      </div>
    );
  }

  const d = app.decision;
  const declineReason = d?.reasonCode ? DECLINE_REASONS.find((r) => r.code === d.reasonCode)?.label : null;
  const cStatus = consentStatus(app);

  const withdraw = () => {
    const at = stamp();
    patch('loanApplications', app.id, (a) => ({ status: 'Withdrawn', history: [...a.history, { at, by: user.name, action: 'Application withdrawn by the applicant; consent cancelled' }] }));
    audit('LOAN_APPLICATION_WITHDRAW', app.id, { purpose: `Consent ${app.consent.ref} cancelled` });
    toast(`Application ${app.id} withdrawn. ${mfiName(app.mfiId)} has been told.`, 'success');
    setConfirm(false);
  };

  return (
    <div>
      <PageHeader
        title={`${app.product} · ${formatMMK(app.amount)}`}
        subtitle={`Application ${app.id} to ${mfiName(app.mfiId)} · submitted ${formatDateTime(app.submittedAt)}`}
        breadcrumbs={[{ label: 'My loans', to: '/borrower/loans' }, { label: app.id }]}
        actions={<AppStatusBadge status={app.status} />}
      />

      {params.get('new') === '1' && app.status === 'Submitted' && (
        <Alert tone="success" title="Your application has been sent" className="mb-5">
          {mfiName(app.mfiId)} received it at {formatDateTime(app.submittedAt)}. Keep your reference <strong className="font-mono">{app.id}</strong>. We will send you an SMS at each step.
        </Alert>
      )}

      <Card>
        <CardBody className="space-y-4">
          <AppTracker app={app} />
          <p className="flex items-start gap-2 rounded-lg bg-slate-50 p-3 text-sm text-slate-700"><Info className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />{NEXT[app.status]}</p>
        </CardBody>
      </Card>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          {d && (
            <Card>
              <CardHeader title="Lender's decision" icon={d.outcome === 'Approved' ? CheckCircle2 : XCircle} subtitle={`${d.by ? `${d.by}, ` : ''}${mfiName(app.mfiId)} · ${formatDateTime(d.at)}`} />
              <CardBody>
                {d.outcome === 'Approved' ? (
                  <dl className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                    <Fact label="Approved amount" value={formatMMK(d.approvedAmount ?? app.amount)} />
                    <Fact label="Interest rate" value={`${d.rate}% a year`} />
                    <Fact label="Period" value={`${d.tenor} months`} />
                    <Fact label="Outcome" value={<Badge tone="green">Approved</Badge>} />
                  </dl>
                ) : (
                  <div className="space-y-2 text-sm">
                    <p className="font-semibold text-red-800">Reason: {declineReason ?? 'Not given'}</p>
                    <p className="text-slate-600">A decline is the lender's own decision and is not recorded as a bad mark on your credit report. Only the credit check itself appears in “Who viewed my report”.</p>
                    {d.reasonCode === 'L01' && <p className="text-slate-600">Tip: a smaller amount or longer period lowers your monthly repayment.</p>}
                    {(d.reasonCode === 'L02' || d.reasonCode === 'L03') && <p className="text-slate-600">Tip: see <Link to="/borrower/report" className="font-semibold text-primary underline">what affects your CIC score</Link> and how to improve it.</p>}
                  </div>
                )}
                {d.note && <p className="mt-3 text-xs italic text-slate-500">Note from the lender: “{d.note}”</p>}
              </CardBody>
            </Card>
          )}

          {app.status === 'Disbursed' && app.loanId && (
            <Alert tone="success" title={`Loan number ${app.loanId}`}>
              This loan is now on your CIC file under {mfiName(app.mfiId)} and will be included in the next credit report issued to you — <Link to="/borrower/requests" className="font-semibold underline">request an updated report</Link> to see it. Paying every instalment on time builds your credit history.
            </Alert>
          )}

          <Card>
            <CardHeader title="What you applied for" icon={FileText} />
            <CardBody>
              <dl className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                <Fact label="Product" value={app.product} />
                <Fact label="Amount" value={formatMMK(app.amount)} />
                <Fact label="Period" value={`${app.tenor} months`} />
                <Fact label="Monthly income" value={formatMMK(app.applicant.monthlyIncome)} />
                <Fact label="Occupation" value={app.applicant.occupation} />
                <Fact label="Township" value={app.applicant.township || '—'} />
                <Fact label="Purpose" value={app.purpose} className="col-span-2 sm:col-span-3" />
              </dl>
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Timeline" subtitle="Every step recorded on your application." />
            <CardBody>
              <Timeline items={[...app.history].reverse().map((h, i) => ({ title: h.action, time: formatDateTime(h.at), actor: h.by, tone: i === 0 ? 'current' : 'done' }))} />
            </CardBody>
          </Card>
        </div>

        <aside className="space-y-4">
          <Card>
            <CardHeader title="Your consent" icon={FileCheck2} />
            <CardBody className="space-y-2 text-sm">
              <p className="flex items-center justify-between"><span className="font-mono text-xs">{app.consent.ref}</span><Badge status={cStatus === 'Used' ? 'Closed' : cStatus} >{cStatus}</Badge></p>
              <p className="text-xs text-slate-600">{app.consent.scope}. Given {formatDateTime(app.consent.grantedAt)}, valid until {formatDate(app.consent.expiresAt)}.</p>
              {cStatus === 'Used' && <p className="text-xs text-slate-600">The lender has used this consent. See the check in <Link to="/borrower/who-viewed" className="font-semibold text-primary underline">Who viewed my report</Link>.</p>}
            </CardBody>
          </Card>
          {app.status === 'Submitted' && (
            <Card>
              <CardBody className="space-y-2">
                <p className="text-sm font-semibold text-slate-800">Changed your mind?</p>
                <p className="text-xs text-slate-600">You can withdraw until the lender starts the credit check. Your consent is cancelled at the same time.</p>
                <Button variant="outline" icon={Undo2} className="w-full" onClick={() => setConfirm(true)}>Withdraw application</Button>
              </CardBody>
            </Card>
          )}
          {['Rejected', 'Withdrawn'].includes(app.status) && <ButtonLink to="/borrower/loans/apply" className="w-full">Start a new application</ButtonLink>}
          <p className="text-xs text-slate-500">Questions about this application? Call {mfiName(app.mfiId)} and quote {app.id}.</p>
        </aside>
      </div>

      <ConfirmDialog
        open={confirm}
        onClose={() => setConfirm(false)}
        onConfirm={withdraw}
        title="Withdraw this application?"
        subtitle={`${app.id} · ${mfiName(app.mfiId)}`}
        confirmLabel="Withdraw application"
        cancelLabel="Keep my application"
        icon={Undo2}
        consequence="This cannot be undone. To borrow from this lender later you will need to start a new application."
      >
        <p>{mfiName(app.mfiId)} will stop processing your application and your consent {app.consent.ref} is cancelled, so they can no longer check your credit report for it.</p>
      </ConfirmDialog>

      <AuditFootnote action="Opening and changing your application" />
    </div>
  );
}
