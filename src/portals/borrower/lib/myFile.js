import { useMemo } from 'react';
import { useStore } from '@/context/StoreContext';
import { getBorrowerFile } from '@/data/registry';
import { buildReport, DATA_AS_OF } from '@/lib/creditScore';
import { useBorrower } from './borrower';

/** Month grid used by the repayment history (Sep 2024 → Aug 2026, oldest first). */
export const HISTORY_MONTHS = Array.from({ length: 24 }, (_, i) => {
  const d = new Date(2024, 8 + i, 1);
  return { key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`, label: d.toLocaleDateString('en-GB', { month: 'short' }), year: d.getFullYear() };
});

const HATCH = 'bg-slate-100 text-slate-500 bg-[repeating-linear-gradient(45deg,transparent,transparent_3px,rgb(226_232_240)_3px,rgb(226_232_240)_5px)]';

/** Registry payment-history codes, in plain language. */
export const HISTORY_CODES = {
  0: { label: 'Paid on time', cell: '', cls: 'bg-emerald-500 text-white' },
  1: { label: '1–30 days late', cell: '1', cls: 'bg-amber-300 text-slate-900' },
  2: { label: '31–60 days late', cell: '30', cls: 'bg-orange-500 text-white' },
  3: { label: '61–90 days late', cell: '60', cls: 'bg-red-500 text-white' },
  4: { label: 'More than 90 days late', cell: '90', cls: 'bg-red-800 text-white' },
  C: { label: 'Loan closed', cell: 'C', cls: 'bg-primary-200 text-primary-900' },
  '.': { label: 'Not open / nothing reported', cell: '', cls: HATCH },
};

/** Plain-language explanations shown next to report fields. */
export const FIELD_HELP = {
  balance: 'How much you still owe on this loan, including any unpaid interest, on the day the lender last sent us an update.',
  dpd: 'How many days your oldest unpaid instalment is late. 0 means you are up to date.',
  dataDate: 'The day this lender last sent us information about this loan. Payments you made after this day are not shown yet.',
  status: 'Active = you are still repaying. Closed = fully repaid or settled.',
  source: 'The licensed microfinance institution (MFI) that sent us this loan. Only they can correct it, after you file a dispute.',
  history: 'Each square is one month. The colour shows whether that month\'s payment was on time or how late it was.',
  guarantee: 'You promised to repay if the main borrower cannot. These loans can affect you if they fall behind.',
  rating: 'Every lender must rate each loan under Central Bank rules. Most loans are “Normal”. The rating gets worse the longer a payment stays unpaid.',
};

/** Central Bank loan classification → plain words for citizens. */
export const RATING_LABEL = {
  Standard: 'Normal',
  Watch: 'Early warning — a payment is late',
  Substandard: 'Serious — payments over 30 days late',
  Doubtful: 'Very serious — payments over 90 days late',
  Loss: 'Written off by the lender',
  Closed: 'Closed',
};

const LATE_RANGE = { 1: 'up to 30 days', 2: '31–60 days', 3: '61–90 days', 4: 'more than 90 days' };
const monthName = (m) => `${m.label} ${m.year}`;

/**
 * Plain-language summary of the last 12 months of a loan's repayment history, e.g.
 * "Paid on time 9 of the last 12 months · 3 late payments, most recent Aug 2026 (12 days)".
 */
export function summariseHistory(loan) {
  const h = String(loan.history ?? '');
  const last = HISTORY_MONTHS.map((m, i) => ({ m, code: h[i] ?? '.' })).slice(-12);
  const due = last.filter((x) => !['.', 'C'].includes(x.code));
  const late = due.filter((x) => ['1', '2', '3', '4'].includes(x.code));
  const onTime = due.length - late.length;
  if (due.length === 0) {
    return { tone: 'slate', text: loan.status === 'Closed' ? 'Closed — no payments were due in the last 12 months' : 'No payments were due in the last 12 months' };
  }
  const head = due.length === 12 ? `Paid on time ${onTime} of the last 12 months` : `Paid on time ${onTime} of ${due.length} month${due.length === 1 ? '' : 's'} due in the last year`;
  if (!late.length) return { tone: 'green', text: `${head} · no late payments` };
  const recent = late[late.length - 1];
  const isLatest = recent === last[last.length - 1];
  const howLate = isLatest && loan.dpd > 0 ? `${loan.dpd} days` : LATE_RANGE[recent.code];
  return {
    tone: late.some((x) => Number(x.code) >= 2) ? 'red' : 'amber',
    text: `${head} · ${late.length} late payment${late.length === 1 ? '' : 's'}, most recent ${monthName(recent.m)} (${howLate})`,
  };
}

const addMonths = (iso, n) => {
  const d = new Date(iso);
  d.setMonth(d.getMonth() + n);
  return d.toISOString().slice(0, 10);
};

/** Registry loan → the shape the borrower screens use. */
export const toLoanView = (l) => ({
  ...l,
  id: l.loanId,
  balance: l.outstanding,
  disbursedAt: l.disbursed,
  closedAt: l.closedOn,
  maturityAt: addMonths(l.disbursed, l.tenor),
  instalment: l.status === 'Active' && l.frequency !== 'Bullet' ? estimateInstalment(l.amount, l.rate, l.tenor) * (l.frequency === 'Fortnightly' ? 0.5 : 1) : null,
});

/** Flat-rate monthly instalment estimate (how Myanmar MFIs usually quote). */
export function estimateInstalment(amount, ratePa, tenorMonths) {
  if (!amount || !tenorMonths) return 0;
  const interest = amount * (ratePa / 100) * (tenorMonths / 12);
  return Math.round((amount + interest) / tenorMonths / 100) * 100;
}

/**
 * The signed-in citizen's own credit file, from the shared Borrower & Loan Registry, and the
 * CIC score computed by the same rules the lenders use. Always keyed by the session borrowerId.
 */
export function useMyFile() {
  const user = useBorrower();
  const { reportedLoans, accounts, inquiries, disputes } = useStore();
  return useMemo(() => {
    const file = user?.borrowerId ? getBorrowerFile(user.borrowerId, { reportedLoans, accounts }) : null;
    if (!file) return { file: null, report: null, loans: [], guarantees: [], dataAsOf: DATA_AS_OF };
    const report = buildReport(file, inquiries, disputes);
    const loans = file.loans.map(toLoanView);
    const guarantees = file.guarantees.map((g, i) => ({ ...g, id: `${file.borrowerId}-G${i + 1}` }));
    return { file, report, loans, guarantees, dataAsOf: DATA_AS_OF };
  }, [user, reportedLoans, accounts, inquiries, disputes]);
}
