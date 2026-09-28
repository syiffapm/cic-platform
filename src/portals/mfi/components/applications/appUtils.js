/** Shared rules for the online loan application workflow (inbox, detail, dashboard). */

export const APP_STATUSES = ['Submitted', 'Credit check', 'Approved', 'Rejected', 'Disbursed', 'Withdrawn'];
export const OPEN_STATUSES = ['Submitted', 'Credit check'];
export const DECISION_SLA_DAYS = 3;
/** Approvals above this amount need a second approver with the MFI Administrator role. */
export const SECOND_APPROVAL_LIMIT = 5_000_000;
export const DEFAULT_RATE = 28;

const pad = (n) => String(n).padStart(2, '0');
export const isoDate = (d = new Date()) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const stampNow = (d = new Date()) => `${isoDate(d)} ${pad(d.getHours())}:${pad(d.getMinutes())}`;

/** Adds working days (Mon–Fri) to a date string. */
export function addWorkingDays(dateStr, days) {
  const d = new Date(`${dateStr.slice(0, 10)}T00:00:00`);
  let left = days;
  while (left > 0) {
    d.setDate(d.getDate() + 1);
    if (d.getDay() !== 0 && d.getDay() !== 6) left -= 1;
  }
  return isoDate(d);
}

/** Decision deadline and working days remaining (negative = overdue). */
export function decisionSla(app, now = new Date()) {
  const due = addWorkingDays(app.submittedAt, DECISION_SLA_DAYS);
  const today = isoDate(now);
  if (today === due) return { due, left: 0 };
  const forward = today < due;
  let [a, b] = forward ? [today, due] : [due, today];
  let count = 0;
  while (a < b) { a = addWorkingDays(a, 1); count += 1; }
  return { due, left: forward ? count : -count };
}

/** Digital consent state: valid, expired or already used for this application's one permitted inquiry. */
export function consentState(app, now = new Date()) {
  if (app.inquiryId) return { key: 'used', label: 'Used', tone: 'slate', text: `Used for inquiry ${app.inquiryId}` };
  if (isoDate(now) > app.consent.expiresAt) return { key: 'expired', label: 'Expired', tone: 'red', text: `Expired on ${app.consent.expiresAt}` };
  return { key: 'valid', label: 'Valid', tone: 'green', text: `Valid until ${app.consent.expiresAt}` };
}

/** Equal monthly instalment (flat-to-declining equivalent) for a principal, annual rate and tenor in months. */
export function monthlyInstalment(amount, ratePct, months) {
  const r = ratePct / 100 / 12;
  if (!months) return 0;
  if (!r) return Math.round(amount / months);
  return Math.round((amount * r) / (1 - (1 + r) ** -months));
}

/** Instalment as a share of stated monthly income, with a policy band. */
export function affordability(amount, ratePct, months, income) {
  const instalment = monthlyInstalment(amount, ratePct, months);
  const ratio = income ? (instalment / income) * 100 : null;
  const band = ratio == null ? 'unknown' : ratio <= 30 ? 'ok' : ratio <= 45 ? 'watch' : 'high';
  return { instalment, ratio, band };
}

export const newLoanId = (short) => `${short}-LN-${Math.floor(100000 + Math.random() * 900000)}`;
export const newInquiryId = () => `INQ-${Math.floor(90000 + Math.random() * 9999)}`;
export function newReportId(d = new Date()) {
  return `CIC-R-${d.getFullYear()}-${pad(d.getMonth() + 1)}${pad(d.getDate())}-${Math.floor(1000 + Math.random() * 9000)}`;
}

/** Stepper index for the lifecycle: Received → Consent verified → Credit check → Decision → Disbursed. */
export function stageIndex(app) {
  if (app.status === 'Disbursed') return 5;
  if (app.status === 'Approved') return 4;
  if (app.status === 'Rejected' || (app.status === 'Credit check' && app.inquiryId)) return 3;
  return 2;
}

export const statusTone = (s) => ({ Submitted: 'blue', 'Credit check': 'amber', Approved: 'green', Rejected: 'red', Disbursed: 'teal', Withdrawn: 'slate' }[s] ?? 'slate');
