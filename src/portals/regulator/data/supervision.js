import { INSTITUTIONS } from '@/data/institutions';
import { seeded, round } from '../lib/util';

/** Information requests to MFIs (GOV-07). Status Overdue is derived when dueAt < today and not answered. */
export const INFO_REQUESTS = [
  { id: 'IR-2026-114', mfiId: 'MFI-006', caseId: 'CASE-2026-038', subject: 'PAR30 breakdown by branch and collection practices', sentAt: '2026-09-02', dueAt: '2026-09-16', status: 'Sent', sentBy: 'U Min Htet', answeredAt: null },
  { id: 'IR-2026-117', mfiId: 'MFI-007', caseId: 'CASE-2026-041', subject: 'Signed shareholder commitment for recapitalisation', sentAt: '2026-09-12', dueAt: '2026-09-26', status: 'Sent', sentBy: 'U Min Htet', answeredAt: null },
  { id: 'IR-2026-109', mfiId: 'MFI-009', caseId: 'CASE-2026-027', subject: 'Monthly DQ remediation report — August', sentAt: '2026-08-20', dueAt: '2026-09-05', status: 'Answered', sentBy: 'Ko Zaw Lin', answeredAt: '2026-09-04' },
  { id: 'IR-2026-104', mfiId: 'MFI-004', caseId: null, subject: 'Agriculture loan restructuring policy after 2026 monsoon', sentAt: '2026-08-12', dueAt: '2026-08-26', status: 'Answered', sentBy: 'U Min Htet', answeredAt: '2026-08-29' },
  { id: 'IR-2026-120', mfiId: 'MFI-003', caseId: null, subject: 'Hinthada multiple-borrowing exposure and mitigation', sentAt: '2026-09-15', dueAt: '2026-09-29', status: 'Sent', sentBy: 'U Min Htet', answeredAt: null },
];

export const MONTHS_6 = ['Mar 26', 'Apr 26', 'May 26', 'Jun 26', 'Jul 26', 'Aug 26'];
export const MONTHS_12 = ['Sep 25', 'Oct 25', 'Nov 25', 'Dec 25', 'Jan 26', 'Feb 26', ...MONTHS_6];

/**
 * Reporting compliance (GOV-04): per MFI, last 6 cut-offs with days late (0 = on time, null = missing),
 * DQ score and rejected-row rate. Derived deterministically from the Institution Master figures.
 */
export const COMPLIANCE = INSTITUTIONS.filter((i) => i.status !== 'Revoked').map((inst) => {
  const rnd = seeded(inst.id);
  const lateProb = 1 - inst.onTime / 100;
  const months = MONTHS_6.map((m) => {
    const r = rnd();
    if (r < lateProb * 0.35) return { month: m, daysLate: null };
    if (r < lateProb) return { month: m, daysLate: 1 + Math.floor(rnd() * 14) };
    return { month: m, daysLate: 0 };
  });
  const rejectedRate = round(Math.max(0.2, (100 - inst.dqScore) * 0.55 + rnd() * 0.6), 1);
  return {
    mfiId: inst.id, name: inst.name, short: inst.short, tier: inst.tier,
    onTime: Math.round((months.filter((x) => x.daysLate === 0).length / 6) * 100),
    dqScore: inst.dqScore, rejectedRate, late: months.filter((x) => x.daysLate !== 0).length, months,
  };
});

/** Prudential 12-month series per MFI (GOV-05). Ends at the Institution Master value. */
export const PRUDENTIAL = Object.fromEntries(INSTITUTIONS.filter((i) => i.portfolio > 0).map((inst) => {
  const rnd = seeded(`${inst.id}-pru`);
  const ldrEnd = 70 + rnd() * 45;
  const concEnd = 8 + rnd() * 22;
  const drift = inst.par30 > 6 ? 0.55 : -0.12;
  const series = MONTHS_12.map((month, idx) => {
    const back = 11 - idx;
    return {
      month,
      par30: round(Math.max(0.5, inst.par30 - drift * back + (rnd() - 0.5) * 0.4)),
      npl: round(Math.max(0.3, inst.npl - drift * 0.7 * back + (rnd() - 0.5) * 0.3)),
      ldr: round(ldrEnd - back * 0.6 + (rnd() - 0.5) * 3),
      concentration: round(concEnd + (rnd() - 0.5) * 2),
    };
  });
  return [inst.id, series];
}));

/** Statutory and scheduled reports (GOV-16), catalogue codes per BRD §9. */
export const REPORTS_CATALOGUE = [
  { code: 'R02', name: 'Monthly submission compliance', frequency: 'Monthly', lastRun: '2026-09-08 06:00', nextRun: '2026-10-08 06:00', recipients: 'FRD Supervisors, Director FRD', format: 'PDF + XLSX', classification: 'Regulator-only' },
  { code: 'R03', name: 'Sector credit bulletin', frequency: 'Monthly', lastRun: '2026-09-05 08:00', nextRun: '2026-10-05 08:00', recipients: 'Publication approval → Public Portal', format: 'PDF', classification: 'Public' },
  { code: 'R04', name: 'MFI health scorecard (quarterly ranking)', frequency: 'Quarterly', lastRun: '2026-07-15 08:00', nextRun: '2026-10-15 08:00', recipients: 'Governor, Director FRD, Supervisors', format: 'PDF', classification: 'Regulator-only' },
  { code: 'R05', name: 'Over-indebtedness by township', frequency: 'Monthly', lastRun: '2026-09-10 07:00', nextRun: '2026-10-10 07:00', recipients: 'Policy / Research, Consumer Protection', format: 'XLSX', classification: 'Regulator-only' },
  { code: 'R06', name: 'Dispute & complaint statistics', frequency: 'Monthly', lastRun: '2026-09-03 07:00', nextRun: '2026-10-03 07:00', recipients: 'Consumer Protection, Director FRD', format: 'PDF + XLSX', classification: 'Regulator-only' },
  { code: 'R11', name: 'System availability & incidents', frequency: 'Monthly', lastRun: '2026-09-02 06:00', nextRun: '2026-10-02 06:00', recipients: 'Director FRD, CIC Operations', format: 'PDF', classification: 'Internal' },
  { code: 'R03-A', name: 'Annual sector data pack', frequency: 'Annual', lastRun: '2026-03-31 09:00', nextRun: '2027-03-31 09:00', recipients: 'Publication approval → Public Portal', format: 'XLSX + PDF', classification: 'Public' },
];

/** Statistics releases queued for public release (GOV-18), alongside 'In review' notices. */
export const STAT_RELEASES = [
  { id: 'STR-2026-09', title: 'Sector credit bulletin — September 2026 (preliminary)', type: 'Statistics', preparedBy: 'Ko Zaw Lin', preparedAt: '2026-09-23', status: 'In review', items: 'Portfolio, PAR30, NPL, borrowers by region', embargo: '2026-10-05' },
  { id: 'STR-2026-Q3', title: 'Quarterly MFI ranking Q3 2026 — public extract', type: 'Statistics', preparedBy: 'Ko Zaw Lin', preparedAt: '2026-09-22', status: 'In review', items: 'Top 10 MFIs by outreach (no prudential data)', embargo: '2026-10-15' },
  { id: 'STR-2026-08', title: 'Sector credit bulletin — August 2026', type: 'Statistics', preparedBy: 'Ko Zaw Lin', preparedAt: '2026-09-01', status: 'Published', items: 'Portfolio, PAR30, NPL, borrowers by region', embargo: '2026-09-05', approver: 'Dr. Than Than Nwe', publishedAt: '2026-09-05' },
];
