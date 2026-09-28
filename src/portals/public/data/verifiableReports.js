import { TODAY } from '@/lib/reportRequests';

/**
 * Report verification registry stub (PUB-09). Holds ONLY the fields the public check may return:
 * status, issue date and issuing institution. Never report content.
 */
export const VERIFIABLE_REPORTS = [
  { id: 'CIC-R-2026-0918-7731', code: '482913', status: 'Valid', issuedAt: '2026-09-18', issuer: 'Pact Global Microfinance Fund' },
  { id: 'CIC-R-2026-0514-0921', code: '118204', status: 'Revoked', issuedAt: '2026-05-14', issuer: 'Golden Delta Finance', revokedAt: '2026-05-20' },
  { id: 'CIC-R-2026-0902-4410', code: '730255', status: 'Valid', issuedAt: '2026-09-02', issuer: 'Alliance Myanmar Microfinance' },
  { id: 'CIC-R-2026-0821-1187', code: '905617', status: 'Valid', issuedAt: '2026-08-21', issuer: 'CIC Borrower Self-Service (personal copy)' },
];

/** Personal copies issued from the Borrower Self-Service portal (ID, code and issue date only). */
function personalCopies() {
  const out = [];
  try {
    for (let i = 0; i < localStorage.length; i += 1) {
      const key = localStorage.key(i);
      if (!key?.startsWith('cic.borrower.reportDownloads.')) continue;
      (JSON.parse(localStorage.getItem(key)) ?? []).forEach((d) => {
        if (d.reportId && d.code) out.push({ id: d.reportId, code: d.code, status: 'Valid', issuedAt: d.at.slice(0, 10), issuer: 'CIC Borrower Self-Service (personal copy)' });
      });
    }
  } catch { /* storage unavailable */ }
  return out;
}

/** Personal reports issued by CIC on a citizen's request (report ID, code, issue and expiry dates only). */
function issuedPersonalReports(reportRequests = [], today = TODAY) {
  return reportRequests.filter((r) => r.status === 'Ready' && r.result?.reportId).map(({ result }) => ({
    id: result.reportId, code: result.verificationCode, status: result.validUntil < today ? 'Expired' : 'Valid',
    issuedAt: result.generatedAt.slice(0, 10), validUntil: result.validUntil, issuer: 'CIC Borrower Self-Service (personal report)',
  }));
}

/**
 * Returns { result: 'valid'|'expired'|'revoked'|'not_found', issuedAt?, issuer?, validUntil? } — both ID and code must match.
 * `reportRequests` is the shared request register, so reports issued by a CIC officer verify at once.
 */
export function verifyReport(id, code, reportRequests = []) {
  const r = [...VERIFIABLE_REPORTS, ...issuedPersonalReports(reportRequests), ...personalCopies()].find((x) => x.id === id.trim().toUpperCase() && x.code === code.trim());
  if (!r) return { result: 'not_found' };
  const result = { Valid: 'valid', Expired: 'expired' }[r.status] ?? 'revoked';
  return { result, issuedAt: r.issuedAt, issuer: r.issuer, revokedAt: r.revokedAt, validUntil: r.validUntil };
}
