import { buildReport, DATA_AS_OF, RULE_VERSION } from '@/lib/creditScore';
import { getInstitution } from '@/data/institutions';

/**
 * Personal credit report requests (citizen → CIC). A citizen never sees a score straight after
 * sign-in: they request a report, CIC validates and processes the data, an officer approves, and
 * the report is issued as a dated snapshot that stays valid for 30 days.
 *
 * Status: Submitted → Validating → Pending review → Ready | Rejected (Ready → Expired after 30 days).
 */
export const REQUEST_STEPS = ['Submitted', 'Validating', 'Pending review', 'Ready'];
export const OPEN_STATUSES = ['Submitted', 'Validating', 'Pending review'];
export const REQUEST_PURPOSES = ['Check my own record', 'Preparing to apply for a loan', 'After a dispute was corrected', 'Other personal reason'];
export const REJECT_REASONS = [
  { code: 'RJ01', label: 'We could not confirm that the request was made by the file owner' },
  { code: 'RJ02', label: 'A data correction on your file is still being processed — we will re-issue when it is complete' },
  { code: 'RJ03', label: 'Duplicate request — a report issued in the last 30 days is still valid' },
];
export const VALID_DAYS = 30;
export const TODAY = '2026-09-25';

const addDays = (iso, days) => { const d = new Date(iso); d.setDate(d.getDate() + days); return d.toISOString().slice(0, 10); };

/** Free-quota rule: 1 free report every 12 months; re-issue after a corrected dispute is always free. */
export function quotaFor(requests, borrowerId, today = TODAY) {
  const since = addDays(today, -365);
  const used = requests.filter((r) => r.borrowerId === borrowerId && r.status === 'Ready' && r.fee === 0 && r.purpose !== 'After a dispute was corrected' && (r.result?.generatedAt ?? '') >= since);
  return { freeLeft: Math.max(0, 1 - used.length), nextFreeOn: used.length ? addDays(used[0].result.generatedAt, 365) : null, paidFee: 3000 };
}

/**
 * Automated validation run when a request is submitted (C4/C5/C6): identity, data freshness per lender,
 * open disputes, pending corrections, quota. Returns [{ id, label, result: 'pass'|'warn'|'fail', detail }].
 */
export function runAutomatedChecks({ file, account, disputes = [], requests = [], today = TODAY }) {
  const checks = [];
  checks.push(file
    ? { id: 'identity', label: 'Identity matched to CIC file', result: 'pass', detail: `NRC ${account.nrc} → file ${file.borrowerId}, verified at registration (${account.verifiedVia ?? 'identity check'}).` }
    : { id: 'identity', label: 'Identity matched to CIC file', result: 'fail', detail: 'No CIC file could be linked to this account.' });
  if (file && !file.noHit) {
    const lenders = [...new Set(file.loans.filter((l) => l.status === 'Active').map((l) => l.mfiId))];
    const stale = file.loans.filter((l) => l.status === 'Active' && l.dataDate < addDays(DATA_AS_OF, -5));
    checks.push({
      id: 'freshness', label: 'Latest data received from every lender', result: stale.length ? 'warn' : 'pass',
      detail: stale.length
        ? `${stale.map((l) => `${getInstitution(l.mfiId)?.short ?? l.mfiId} last reported ${l.dataDate}`).join('; ')} — report will show the date of each record.`
        : `${lenders.length} lender(s) reported up to ${DATA_AS_OF}.`,
    });
  } else if (file) {
    checks.push({ id: 'freshness', label: 'Latest data received from every lender', result: 'pass', detail: 'No lender has reported a loan under this NRC (no-hit file).' });
  }
  const open = disputes.filter((d) => d.borrowerId === file?.borrowerId && !['Resolved', 'Rejected', 'Closed', 'Withdrawn'].includes(d.status));
  checks.push({ id: 'disputes', label: 'Records under dispute', result: open.length ? 'warn' : 'pass', detail: open.length ? `${open.map((d) => d.id).join(', ')} open — flagged on the report, not scored.` : 'None.' });
  const pendingCorrection = open.filter((d) => d.status === 'Pending CIC approval');
  checks.push({ id: 'corrections', label: 'Pending data corrections', result: pendingCorrection.length ? 'warn' : 'pass', detail: pendingCorrection.length ? `${pendingCorrection.map((d) => d.id).join(', ')} awaiting CIC approval.` : 'None.' });
  const q = quotaFor(requests, file?.borrowerId, today);
  checks.push({ id: 'quota', label: 'Free annual report available', result: q.freeLeft ? 'pass' : 'warn', detail: q.freeLeft ? '1 free report left for the last 12 months.' : `Free report already used — next free on ${q.nextFreeOn}; fee ${q.paidFee.toLocaleString()} MMK applies.` });
  return checks;
}

/** Report snapshot issued on approval — the citizen sees exactly this until it expires. */
export function generateReportSnapshot({ file, inquiries = [], disputes = [], requestId, generatedAt = new Date().toISOString() }) {
  const r = buildReport(file, inquiries, disputes);
  const day = generatedAt.slice(0, 10);
  const seq = String(Math.floor(1000 + Math.random() * 8999));
  return {
    reportId: `CIC-P-${day.replace(/-/g, '').slice(2)}-${seq}`,
    verificationCode: String(Math.floor(100000 + Math.random() * 899999)),
    requestId, generatedAt, validUntil: addDays(day, VALID_DAYS), dataAsOf: DATA_AS_OF, ruleVersion: RULE_VERSION,
    noHit: r.noHit, score: r.score, grade: r.grade, gradeLabel: r.gradeLabel, reasons: r.reasons,
    activeCount: r.active.length, closedCount: r.closed.length, exposure: r.exposure, worstDpd: r.worstDpd,
    lenders: r.institutions.length, inquiriesCount: r.inquiries.length, disputeFlags: r.disputeFlags.map((d) => d.id),
    loans: file.loans.map((l) => ({ ...l })), guarantees: file.guarantees.map((g) => ({ ...g })),
  };
}

/** Latest issued report still inside its 30-day validity, or null. */
export function currentReport(requests, borrowerId, today = TODAY) {
  return requests
    .filter((r) => r.borrowerId === borrowerId && r.status === 'Ready' && r.result && r.result.validUntil >= today)
    .sort((a, b) => b.result.generatedAt.localeCompare(a.result.generatedAt))[0] ?? null;
}
