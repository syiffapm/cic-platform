import { useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { AlertTriangle, CheckCircle2, Clock, FileText, ListChecks, RefreshCcw, ShieldAlert, XCircle } from 'lucide-react';
import { Alert, Card, CardBody, CardHeader, EmptyState, PageHeader, Timeline } from '@/components/ui';
import { REJECT_REASONS } from '@/lib/reportRequests';
import { formatDate, formatDateTime, formatMMK } from '@/lib/format';
import { AuditFootnote, ButtonLink, Fact } from '../../components/Common';
import { RequestStatusBadge, RequestStepper, validityText } from '../../components/ReportRequestCards';
import { useBorrowerAudit } from '../../lib/borrower';
import { REJECT_HELP, STATUS_MESSAGES, isOpenRequest, useMarkRequestSeen, useReportRequests } from '../../lib/reports';

const CHECK_ICON = { pass: [CheckCircle2, 'text-emerald-600', 'OK'], warn: [AlertTriangle, 'text-amber-600', 'Noted'], fail: [XCircle, 'text-red-600', 'Problem'] };

/** Plain-language wording for the automated checks the citizen sees. */
const CHECK_TEXT = {
  identity: 'We confirmed this request comes from the owner of the CIC file.',
  freshness: 'We checked that every lender has sent its latest monthly data.',
  disputes: 'Records you are disputing are flagged on the report and not scored.',
  corrections: 'Corrections waiting for CIC approval are shown when approved.',
  quota: 'Your free annual report allowance.',
};

/** Report request tracker: stepper, automated checks, timeline, SLA and the result. */
export default function RequestDetail() {
  const { id } = useParams();
  const { requests, today } = useReportRequests();
  const audit = useBorrowerAudit();
  const markSeen = useMarkRequestSeen();
  const r = requests.find((x) => x.id === id);
  const logged = useRef(null);

  useEffect(() => {
    if (logged.current === `${id}:${r?.status}`) return;
    logged.current = `${id}:${r?.status}`;
    if (!r) audit('REPORT_REQUEST_VIEW_DENIED', id, { outcome: 'Denied', purpose: 'Not owned by session borrower' });
    else if (['Ready', 'Rejected'].includes(r.status)) markSeen(r.id);
  }, [audit, id, r, markSeen]);

  if (!r) {
    return (
      <div>
        <PageHeader title="Request not found" breadcrumbs={[{ label: 'My report requests', to: '/borrower/requests' }, { label: id }]} />
        <Card><EmptyState icon={ShieldAlert} title="We couldn't find this request in your account" description="You can only see report requests you made yourself." action={<ButtonLink to="/borrower/requests" variant="outline">Back to my requests</ButtonLink>} /></Card>
      </div>
    );
  }

  const open = isOpenRequest(r);
  const expired = r.status === 'Ready' && r.result?.validUntil < today;
  // The back office stores the reason as { code, label, note }; older records hold a code or label string.
  const rawReason = typeof r.rejectReason === 'object' && r.rejectReason ? r.rejectReason : { code: r.rejectReason, label: r.rejectReason };
  const reject = REJECT_REASONS.find((x) => x.code === rawReason.code || x.label === rawReason.label) ?? (rawReason.label ? { code: rawReason.code, label: rawReason.label } : null);
  const history = [...(r.history ?? [])].reverse().map((h, i) => ({ title: h.action, time: formatDateTime(h.at), actor: h.by, tone: i === 0 && open ? 'current' : 'done' }));
  if (open) history.unshift({ title: r.status === 'Pending review' ? 'Waiting for a CIC officer to approve' : 'Validation in progress', time: 'Decision within 1 working day', tone: 'pending' });

  return (
    <div>
      <PageHeader
        title={`Report request ${r.id}`}
        subtitle={`${r.purpose} · requested ${formatDateTime(r.submittedAt)}`}
        breadcrumbs={[{ label: 'My report requests', to: '/borrower/requests' }, { label: r.id }]}
        actions={<RequestStatusBadge status={expired ? 'Expired' : r.status} />}
      />

      <Card className="mb-6">
        <CardBody className="space-y-4">
          <RequestStepper request={r} />
          <p className="text-sm text-slate-700">{STATUS_MESSAGES[r.status]}</p>
          {open && <p className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-800"><Clock className="h-3.5 w-3.5" aria-hidden="true" />Decision within 1 working day · we will notify you by {r.notify}</p>}

          {r.status === 'Ready' && r.result && (
            <div className="flex flex-col gap-4 rounded-xl border border-emerald-200 bg-emerald-50 p-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-base font-bold text-emerald-900">{expired ? 'This report has expired' : 'Your credit report is ready'}</p>
                <p className="mt-0.5 text-xs text-emerald-900/80">
                  Report <span className="font-mono">{r.result.reportId}</span> · issued {formatDate(r.result.generatedAt)} · {expired ? `expired ${formatDate(r.result.validUntil)}` : validityText(r.result.validUntil)}
                  {r.reviewedBy && <> · approved by {r.reviewedBy}</>}
                </p>
              </div>
              {expired
                ? <ButtonLink to="/borrower/requests/new" size="lg" icon={RefreshCcw}>Request an updated report</ButtonLink>
                : <ButtonLink to="/borrower/report" size="lg" icon={FileText}>View my report</ButtonLink>}
            </div>
          )}

          {r.status === 'Rejected' && (
            <Alert tone="danger" title="Your report could not be issued">
              <p>{reject?.label ?? 'CIC could not confirm the details of this request.'}</p>
              <p className="mt-1"><strong>What to do:</strong> {REJECT_HELP[reject?.code] ?? 'Call the CIC helpdesk on 1800 242 242 with your request number.'}</p>
              <div className="mt-3"><ButtonLink to="/borrower/requests/new" size="sm" variant="outline" icon={RefreshCcw}>Make a new request</ButtonLink></div>
            </Alert>
          )}
        </CardBody>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title="Automated checks" subtitle="Run by CIC as soon as you sent the request." icon={ListChecks} />
          <CardBody>
            <ul className="space-y-3">
              {(r.checks ?? []).map((c) => {
                const [Icon, cls, label] = CHECK_ICON[c.result] ?? CHECK_ICON.pass;
                return (
                  <li key={c.id} className="flex gap-3">
                    <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${cls}`} aria-hidden="true" />
                    <div>
                      <p className="text-sm font-medium text-slate-800">{c.label} <span className="sr-only">— {label}</span></p>
                      <p className="text-xs text-slate-600">{CHECK_TEXT[c.id] ? `${CHECK_TEXT[c.id]} ` : ''}{c.detail}</p>
                    </div>
                  </li>
                );
              })}
            </ul>
            <p className="mt-4 text-[11px] text-slate-500">A warning does not stop your report. It is shown so you know what the officer will look at.</p>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Timeline" icon={Clock} />
          <CardBody className="space-y-5">
            <Timeline items={history} />
            <dl className="grid grid-cols-2 gap-4 border-t border-slate-100 pt-4">
              <Fact label="Fee" value={!r.fee ? 'Free' : `${formatMMK(r.fee)} (payable at approval)`} />
              <Fact label="Notify me by" value={r.notify} />
              {r.reviewedAt && <Fact label="Decided" value={formatDateTime(r.reviewedAt)} />}
              {r.reviewedBy && <Fact label="CIC officer" value={r.reviewedBy} />}
            </dl>
          </CardBody>
        </Card>
      </div>

      <AuditFootnote action="Opening this request" />
    </div>
  );
}
