import { Link } from 'react-router-dom';
import { AlertTriangle, Flag } from 'lucide-react';
import clsx from 'clsx';
import { Badge } from '@/components/ui';
import { formatDate, formatMMK } from '@/lib/format';
import { FIELD_HELP, RATING_LABEL, summariseHistory } from '../lib/myFile';
import { Explain, Fact } from './Common';
import RepaymentGrid from './RepaymentGrid';

function dpdTone(dpd) {
  if (dpd === 0) return 'green';
  if (dpd < 30) return 'amber';
  return 'red';
}

const SUMMARY_TONE = {
  green: 'bg-emerald-50 text-emerald-900',
  amber: 'bg-amber-50 text-amber-900',
  red: 'bg-red-50 text-red-900',
  slate: 'bg-slate-50 text-slate-700',
};

/**
 * Repayment history: a plain-language summary for everyone; the 24-month grid is shown in full on
 * larger screens and behind "Show month-by-month" on phones (it scrolls inside its own focusable region).
 */
function RepaymentHistory({ loan }) {
  const summary = summariseHistory(loan);
  return (
    <div className="mt-4 min-w-0">
      <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">Repayment history</p>
      <p className={clsx('mt-1.5 rounded-lg px-3 py-2 text-sm font-medium', SUMMARY_TONE[summary.tone])}>{summary.text}</p>
      <details className="group mt-2 sm:hidden">
        <summary className="inline-flex min-h-[32px] cursor-pointer items-center gap-1 text-xs font-semibold text-primary hover:underline">
          <span className="group-open:hidden">Show month-by-month</span><span className="hidden group-open:inline">Hide month-by-month</span>
        </summary>
        <div className="mt-2"><RepaymentGrid history={loan.history} label={`Loan ${loan.id}, repayments month by month, last 24 months`} /></div>
      </details>
      <div className="mt-2 hidden sm:block">
        <p className="mb-1 text-[11px] text-slate-500">Month by month, last 24 months</p>
        <RepaymentGrid history={loan.history} label={`Loan ${loan.id}, repayments month by month, last 24 months`} />
      </div>
      <Explain>{FIELD_HELP.history}</Explain>
    </div>
  );
}

/** One loan line in "My credit report": balance, how late, last update, source MFI, repayment history, dispute flag. */
export default function LoanCard({ loan, dispute, sourceName }) {
  const underDispute = dispute && !['Resolved', 'Rejected', 'Closed'].includes(dispute.status);
  return (
    <article className="min-w-0 rounded-lg border border-slate-200 bg-white p-4" aria-label={`Loan ${loan.id}`}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-sm font-semibold text-slate-900">{loan.product}</p>
          <p className="font-mono text-[11px] text-slate-500">{loan.id}</p>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <Badge status={loan.status} />
          <Badge tone={dpdTone(loan.dpd)}>{loan.dpd === 0 ? 'Up to date' : `${loan.dpd} days late`}</Badge>
          {underDispute && (
            <Badge tone="violet"><Flag className="h-3 w-3" aria-hidden="true" /> Under dispute</Badge>
          )}
        </div>
      </div>

      {underDispute && (
        <p className="mt-3 flex items-start gap-2 rounded-lg bg-violet-50 p-2.5 text-xs text-violet-900">
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          <span>
            You disputed this loan on {formatDate(dispute.filedAt)} ({dispute.status}). Lenders who view your report see a
            &quot;disputed&quot; flag on this line until the case is closed.{' '}
            <Link to={`/borrower/disputes/${dispute.id}`} className="font-semibold underline">Track {dispute.id}</Link>
          </span>
        </p>
      )}

      <dl className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Fact label="Balance owed" value={formatMMK(loan.balance)} help={FIELD_HELP.balance} />
        <Fact label="Original amount" value={formatMMK(loan.amount)} help="The amount the lender gave you when the loan started." />
        <Fact label="Days late now" value={loan.dpd === 0 ? 'None — up to date' : `${loan.dpd} days`} help={FIELD_HELP.dpd} />
        <Fact label="Last update from lender" value={formatDate(loan.dataDate)} help={FIELD_HELP.dataDate} />
        <Fact label="Started" value={formatDate(loan.disbursedAt)} />
        <Fact label={loan.status === 'Closed' ? 'Closed on' : 'Ends'} value={formatDate(loan.closedAt ?? loan.maturityAt)} />
        <Fact label="Your role" value={loan.role} />
        <Fact label="Repayment" value={`${loan.frequency} · ${loan.rate}% a year`} help={`Term ${loan.tenor} months.${loan.instalment ? ` About ${formatMMK(loan.instalment)} per ${loan.frequency === 'Fortnightly' ? 'fortnight' : 'month'}.` : ''}`} />
        <Fact label="Lender's rating" value={RATING_LABEL[loan.classification] ?? loan.classification} help={FIELD_HELP.rating} />
        <Fact label="Worst delay, last 12 months" value={loan.maxDpd12 ? `${loan.maxDpd12} days` : 'None'} />
        <Fact label="Reported by" value={sourceName} help={FIELD_HELP.source} />
      </dl>

      <RepaymentHistory loan={loan} />
      {loan.fromApplication && <p className="mt-3 text-xs text-teal-700">Opened through your online application {loan.fromApplication}. It will appear in the next monthly update from the lender with its first repayments.</p>}
      {!underDispute && (
        <p className="mt-3 text-right">
          <Link to={`/borrower/disputes/new?loan=${loan.id}`} className="inline-flex min-h-[24px] items-center text-xs font-semibold text-primary hover:underline">Something wrong with this loan? Dispute it</Link>
        </p>
      )}
    </article>
  );
}
