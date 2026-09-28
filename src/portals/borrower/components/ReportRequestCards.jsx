import { Link } from 'react-router-dom';
import { ArrowRight, BadgeCheck, CheckCircle2, Clock, FileSearch, RefreshCcw, ShieldCheck, UserCheck, XCircle } from 'lucide-react';
import { Badge, Card, CardBody, Stepper } from '@/components/ui';
import { REQUEST_STEPS, TODAY } from '@/lib/reportRequests';
import { formatDate, formatDateTime, formatMMK } from '@/lib/format';
import { STATUS_MESSAGES, stepIndex } from '../lib/reports';
import { ButtonLink } from './Common';

/** Stepper for a report request; a rejected request ends on "Not issued". */
export function RequestStepper({ request }) {
  const rejected = request.status === 'Rejected';
  const steps = rejected ? [...REQUEST_STEPS.slice(0, 3), 'Not issued'] : REQUEST_STEPS;
  const current = request.status === 'Ready' ? REQUEST_STEPS.length : rejected ? 3 : stepIndex(request.status);
  return <Stepper steps={steps} current={current} />;
}

export function RequestStatusBadge({ status }) {
  const tone = { Ready: 'green', Rejected: 'red', 'Pending review': 'amber', Validating: 'blue', Submitted: 'blue' }[status] ?? 'slate';
  return <Badge tone={tone}>{status === 'Ready' ? 'Report issued' : status}</Badge>;
}

/** Quota line: free annual report, or the fee payable when CIC approves. */
export function QuotaNote({ quota, freeReissue = false }) {
  if (freeReissue) return <p className="text-xs text-emerald-700"><BadgeCheck className="mr-1 inline h-3.5 w-3.5" aria-hidden="true" />Free — a report after a corrected dispute never costs anything.</p>;
  return quota.freeLeft
    ? <p className="text-xs text-emerald-700"><BadgeCheck className="mr-1 inline h-3.5 w-3.5" aria-hidden="true" />Your free report for this year is available.</p>
    : <p className="text-xs text-amber-800">{quota.nextFreeOn
      ? `Free report for this year already used (next free on ${formatDate(quota.nextFreeOn)}). Fee ${formatMMK(quota.paidFee)}, paid when CIC approves.`
      : `Free report for this year already used. Fee ${formatMMK(quota.paidFee)}, paid when CIC approves.`}</p>;
}

const HOW = [
  { icon: FileSearch, text: 'You request your report' },
  { icon: ShieldCheck, text: 'CIC validates the data from every lender' },
  { icon: UserCheck, text: 'A CIC officer approves it' },
  { icon: CheckCircle2, text: 'You are notified and can view it for 30 days' },
];

/**
 * Shown instead of the score when the citizen has no valid report: explains why a report must be
 * requested, shows the quota and links to the request form (or to the request already in progress).
 */
export function GetReportCard({ state, compact = false }) {
  const { open, expired, lastRejected, quota, correctedDispute } = state;
  if (open) return <OpenRequestCard request={open} />;
  const title = expired ? 'Your last report has expired' : 'Get your credit report';
  const lead = expired
    ? `Report ${expired.result.reportId} was valid until ${formatDate(expired.result.validUntil)}. Request an updated report to see your current score.`
    : 'Your CIC credit score and report are issued on request. Before anything is shown, CIC validates the data every lender has reported under your NRC and an officer approves the report — usually within 1 working day.';
  const to = correctedDispute ? '/borrower/requests/new?purpose=corrected' : '/borrower/requests/new';
  return (
    <Card className="overflow-hidden border-primary-200">
      <div className="grid lg:grid-cols-[1fr_320px]">
        <CardBody className="space-y-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-teal-700">My CIC credit score</p>
            <h2 className="mt-0.5 text-xl font-bold text-slate-900">{title}</h2>
            <p className="mt-1 text-sm text-slate-600">{lead}</p>
          </div>
          {lastRejected && !expired && (
            <p className="flex items-start gap-2 rounded-lg bg-red-50 p-2.5 text-xs text-red-800"><XCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />Your last request {lastRejected.id} was not approved. <Link to={`/borrower/requests/${lastRejected.id}`} className="font-semibold underline">See why</Link></p>
          )}
          {!compact && (
            <ol className="grid gap-2 sm:grid-cols-4">
              {HOW.map((h, i) => (
                <li key={h.text} className="flex items-start gap-2 rounded-lg bg-slate-50 p-2.5 text-xs text-slate-700">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary text-[11px] font-bold text-white">{i + 1}</span>
                  <span><h.icon className="mr-1 inline h-3.5 w-3.5 text-teal-700" aria-hidden="true" />{h.text}</span>
                </li>
              ))}
            </ol>
          )}
        </CardBody>
        <div className="flex flex-col justify-center gap-3 bg-primary-50/60 p-6">
          <QuotaNote quota={quota} freeReissue={!!correctedDispute} />
          <ButtonLink to={to} size="lg" icon={expired ? RefreshCcw : FileSearch}>{expired ? 'Request an updated report' : 'Request my credit report'}</ButtonLink>
          <p className="text-[11px] text-slate-500">Checking your own report never lowers your score. You will get an SMS or email when it is ready.</p>
        </div>
      </div>
    </Card>
  );
}

/** Compact tracker for a request that is still being processed. */
export function OpenRequestCard({ request }) {
  const last = request.history?.[request.history.length - 1];
  return (
    <Card className="border-amber-200">
      <CardBody className="space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-teal-700">My CIC credit report</p>
            <h2 className="mt-0.5 text-lg font-bold text-slate-900">Your report is being prepared</h2>
            <p className="mt-1 text-sm text-slate-600">{STATUS_MESSAGES[request.status]}</p>
          </div>
          <RequestStatusBadge status={request.status} />
        </div>
        <RequestStepper request={request} />
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-3">
          <p className="flex items-start gap-1.5 text-xs text-slate-500">
            <Clock className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            <span><span className="font-mono">{request.id}</span> · requested {formatDateTime(request.submittedAt)}{last && <> · latest: {last.action} ({formatDateTime(last.at)})</>}</span>
          </p>
          <Link to={`/borrower/requests/${request.id}`} className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline">Track my request <ArrowRight className="h-4 w-4" aria-hidden="true" /></Link>
        </div>
      </CardBody>
    </Card>
  );
}

const pad2 = (n) => String(n).padStart(2, '0');
const localToday = () => { const d = new Date(); return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`; };

/** Whole days from today until an ISO date; never negative. Today is never earlier than the registry's business date. */
export function daysLeft(iso, today = [TODAY, localToday()].sort()[1]) {
  return Math.max(0, Math.round((new Date(`${iso}T00:00:00`) - new Date(`${today}T00:00:00`)) / 864e5));
}

/** "Valid for 17 more days — until 13 Oct 2026". */
export function validityText(validUntil) {
  const n = daysLeft(validUntil);
  if (n === 0) return `Valid until the end of today — ${formatDate(validUntil)}`;
  return `Valid for ${n} more day${n === 1 ? '' : 's'} — until ${formatDate(validUntil)}`;
}

/** Countdown pill for an issued report; turns amber in the last 5 days. */
export function ValidityCountdown({ validUntil, light = false, className }) {
  const n = daysLeft(validUntil);
  const tone = light ? 'bg-white/15 text-white' : n <= 5 ? 'bg-amber-50 text-amber-900 ring-1 ring-amber-200' : 'bg-emerald-50 text-emerald-900 ring-1 ring-emerald-200';
  return (
    <p className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${tone} ${className ?? ''}`}>
      <Clock className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />{validityText(validUntil)}
    </p>
  );
}

/** "Report … · issued …" and the plain-language basis line for an issued report. */
export function IssuedLine({ result, className = 'text-xs text-slate-500' }) {
  return (
    <p className={className}>
      Report <span className="font-mono font-semibold">{result.reportId}</span> · issued {formatDate(result.generatedAt)}. Based on information your lenders sent up to {formatDate(result.dataAsOf)}.
    </p>
  );
}
