import { OTHER_INQUIRIES } from '@/data/registry';

export const RULE_VERSION = 'GR-2026.2';
export const DATA_AS_OF = '2026-08-31';

/**
 * Rule-based grade (not a statistical score). Each reason code deducts points from 100;
 * dispute flags are informational and never scored. Rule set GR-2026.2, approved by CIC Data Steward.
 */
const GRADE_BANDS = [
  { grade: 'A', min: 85, label: 'Very low observed risk' },
  { grade: 'B', min: 70, label: 'Low observed risk' },
  { grade: 'C', min: 55, label: 'Moderate observed risk' },
  { grade: 'D', min: 40, label: 'Elevated observed risk' },
  { grade: 'E', min: 0, label: 'High observed risk' },
];

/**
 * CIC credit score (0–100) and grade A–E. The same function serves the borrower's own view and the
 * MFI report, so both always show the same result. A no-hit file returns grade null — never a low score.
 */
export function buildReport(borrower, storeInquiries = [], disputes = []) {
  const active = borrower.loans.filter((l) => l.status === 'Active');
  const closed = borrower.loans.filter((l) => l.status !== 'Active');
  const exposure = active.reduce((s, l) => s + l.outstanding, 0);
  const guaranteeExposure = borrower.guarantees.filter((g) => g.status === 'Active').reduce((s, g) => s + g.amount, 0);
  const worstDpd = Math.max(0, ...active.map((l) => l.dpd));
  const maxDpd12 = Math.max(0, ...borrower.loans.map((l) => l.maxDpd12));
  const institutions = [...new Set(active.map((l) => l.mfiId))];

  const inquiries = [
    ...storeInquiries.filter((q) => q.borrowerId === borrower.borrowerId).map((q) => ({ at: q.at.slice(0, 10), mfiId: q.mfiId, purpose: q.purpose })),
    ...OTHER_INQUIRIES.filter((q) => q.borrowerId === borrower.borrowerId),
  ].filter((q) => q.at >= '2025-09-25').sort((a, b) => b.at.localeCompare(a.at));
  const recentInquiries = inquiries.filter((q) => q.at >= '2026-03-25').length;

  const disputeFlags = disputes.filter((d) => d.borrowerId === borrower.borrowerId && !['Resolved', 'Closed', 'Rejected'].includes(d.status));

  const reasons = [];
  if (worstDpd > 30) reasons.push({ code: 'R01', text: `Current arrears of ${worstDpd} days on at least one loan`, points: 25 });
  else if (maxDpd12 > 0) reasons.push({ code: 'R02', text: `Late payment up to ${maxDpd12} days in the last 12 months`, points: 8 });
  if (active.length >= 3) reasons.push({ code: 'R03', text: `${active.length} active loans across ${institutions.length} institutions`, points: 15 });
  if (exposure > 5_000_000) reasons.push({ code: 'R04', text: 'Total outstanding exposure above 5,000,000 MMK', points: 10 });
  if (recentInquiries >= 3) reasons.push({ code: 'R05', text: `${recentInquiries} credit inquiries in the last 6 months`, points: 5 });
  if (borrower.loans.some((l) => l.classification === 'Loss')) reasons.push({ code: 'R07', text: 'Write-off reported in the last 5 years', points: 30 });
  if (reasons.length === 0) reasons.push({ code: 'R00', text: 'No adverse factors observed', points: 0 });
  if (disputeFlags.length) reasons.push({ code: 'R06', text: `${disputeFlags.length} record(s) under dispute — informational, not scored`, points: 0 });

  const score = Math.max(0, 100 - reasons.reduce((s, r) => s + r.points, 0));
  const band = GRADE_BANDS.find((b) => score >= b.min);
  const noHit = borrower.loans.length === 0 && borrower.guarantees.length === 0;

  return { active, closed, exposure, guaranteeExposure, worstDpd, institutions, inquiries, disputeFlags, reasons, noHit, score: noHit ? null : score, grade: noHit ? null : band.grade, gradeLabel: noHit ? 'No credit history yet' : band.label };
}

export const GRADE_TONES = { A: 'bg-emerald-600', B: 'bg-teal', C: 'bg-amber-500', D: 'bg-orange-600', E: 'bg-red-600' };

export { GRADE_BANDS };

/** Plain-language tips shown to citizens for each reason code. */
export const REASON_TIPS = {
  R00: 'Keep paying on time — this keeps your grade high.',
  R01: 'Bring overdue loans up to date; arrears over 30 days weigh most on your grade.',
  R02: 'Late payments in the last 12 months lower your grade. On-time payments restore it over time.',
  R03: 'Having 3 or more active loans at the same time lowers your grade. Close one before taking another.',
  R04: 'Your total outstanding balance is high compared with typical borrowers.',
  R05: 'Many lenders checked your report recently. Apply only where you really intend to borrow.',
  R06: 'A record is under dispute. It does not affect your grade while the dispute is open.',
  R07: 'A written-off loan stays on your record for 5 years.',
};
