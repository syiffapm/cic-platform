/** Per-citizen records held by the Borrower Self-Service service (consents, requests, alerts, sessions, representatives). */

export const CONSENTS = [
  { id: 'CNS-PGMF-24410', mfiId: 'MFI-001', scope: 'Credit report', purpose: 'New loan application', givenAt: '2026-09-18', loanActive: true, status: 'Active', basis: 'Signed on loan application form' },
  { id: 'CNS-PGMF-24411', mfiId: 'MFI-001', scope: 'Alternative data', purpose: 'Mobile wallet and utility payment history', givenAt: '2026-09-18', loanActive: true, status: 'Active', basis: 'Optional tick-box on application' },
  { id: 'CNS-AMM-11904', mfiId: 'MFI-002', scope: 'Credit report', purpose: 'Review of existing loan', givenAt: '2024-11-28', loanActive: true, status: 'Active', basis: 'Loan agreement clause 14' },
  { id: 'CNS-AMM-11905', mfiId: 'MFI-002', scope: 'Alternative data', purpose: 'Mobile top-up history', givenAt: '2024-11-28', loanActive: true, status: 'Active', basis: 'Optional tick-box on application' },
  { id: 'CNS-SMF-3308', mfiId: 'MFI-005', scope: 'Credit report', purpose: 'Review of existing loan', givenAt: '2026-05-14', loanActive: true, status: 'Active', basis: 'Signed on loan application form' },
  { id: 'CNS-PGMF-19002', mfiId: 'MFI-001', scope: 'Credit report', purpose: 'Guarantor assessment', givenAt: '2026-01-10', loanActive: false, status: 'Expired', basis: 'Guarantor form', expiredAt: '2026-04-10' },
];

export const DATA_REQUESTS = [
  { id: 'DSR-2026-0217', type: 'Access', summary: 'Copy of all personal data CIC holds about me', submittedAt: '2026-06-02', status: 'Closed', dueAt: '2026-07-02', dpoNote: 'Data export sent by secure download link on 18 Jun 2026.' },
  { id: 'DSR-2026-0301', type: 'Rectification', summary: 'Update my address: moved from Ward 4 to Ward 7, North Okkalapa', submittedAt: '2026-08-21', status: 'In review', dueAt: '2026-09-20', dpoNote: 'Address change forwarded to reporting MFIs for confirmation.' },
];

export const ALERTS = [
  { id: 'ALT-9001', type: 'inquiry', title: 'Pact Global Microfinance Fund viewed your report', body: 'Purpose: New loan application. If you did not apply for a loan, tell us.', at: '2026-09-18 10:22', read: false, link: '/borrower/who-viewed' },
  { id: 'ALT-9000', type: 'dispute', title: 'Dispute DSP-2026-0412 sent to Alliance Myanmar Microfinance', body: 'The lender must reply by 24 Sep 2026.', at: '2026-09-10 09:13', read: false, link: '/borrower/disputes/DSP-2026-0412' },
  { id: 'ALT-8990', type: 'delinquency', title: 'Late payment reported on SMF-LN-33019', body: 'Sathapana Myanmar Finance reported 12 days past due at 25 Aug 2026.', at: '2026-09-05 06:00', read: true, link: '/borrower/report' },
  { id: 'ALT-8975', type: 'dispute', title: 'Dispute DSP-2026-0398 resolved', body: 'Loan PGMF-LN-104552 is now shown as Closed.', at: '2026-08-12 16:21', read: true, link: '/borrower/disputes/DSP-2026-0398' },
  { id: 'ALT-8950', type: 'loan', title: 'New loan reported by Pact Global Microfinance Fund', body: 'Group loan PGMF-LN-118830 of 1,200,000 MMK (your online application LAP-2026-00144) added to your file.', at: '2026-04-10 06:00', read: true, link: '/borrower/loans/LAP-2026-00144' },
];

/** Ko Aung Aung (BRW-003902) — citizen with arrears. */
const ALERTS_3902 = [
  { id: 'ALT-9102', type: 'delinquency', title: 'Late payment reported on YWEF-LN-7719', body: 'Yangon Women Enterprise Fund reported 45 days past due at 31 Aug 2026. Contact the branch to agree a repayment plan.', at: '2026-09-05 06:00', read: false, link: '/borrower/report' },
  { id: 'ALT-9101', type: 'inquiry', title: 'Maha Agriculture Microfinance viewed your report', body: 'Purpose: New loan application. If you did not apply for a loan, tell us.', at: '2026-08-28 14:10', read: true, link: '/borrower/who-viewed' },
];
const CONSENTS_3902 = [
  { id: 'CNS-YWEF-8810', mfiId: 'MFI-012', scope: 'Credit report', purpose: 'New loan application', givenAt: '2025-08-28', loanActive: true, status: 'Active', basis: 'Signed on loan application form' },
  { id: 'CNS-MAHA-4471', mfiId: 'MFI-004', scope: 'Credit report', purpose: 'New loan application', givenAt: '2026-08-28', loanActive: false, status: 'Used', basis: 'Signed at branch' },
];
const localStamp = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
const welcomeAlert = () => [{ id: 'ALT-WELCOME', type: 'loan', title: 'Welcome to CIC Borrower Self-Service', body: 'Your identity is verified. Set up your alerts so you know when a lender checks your report.', at: localStamp(), read: false, link: '/borrower/alerts' }];

/** Initial records for a citizen, keyed by collection. New accounts start empty. */
export const SEED_FOR = {
  alerts: (id) => (id === 'BRW-000184' ? ALERTS : id === 'BRW-003902' ? ALERTS_3902 : welcomeAlert()),
  consents: (id) => (id === 'BRW-000184' ? CONSENTS : id === 'BRW-003902' ? CONSENTS_3902 : []),
  dataRequests: (id) => (id === 'BRW-000184' ? DATA_REQUESTS : []),
  representatives: (id) => (id === 'BRW-000184' ? REPRESENTATIVES : []),
};

export const ALERT_TYPES = [
  { id: 'report', label: 'My credit report requests', description: 'Sent when CIC issues your report or cannot approve a request. Always sent by the channel you chose on the request.' },
  { id: 'inquiry', label: 'Someone views my report', description: 'Sent when an MFI makes an inquiry on your file.' },
  { id: 'loan', label: 'New loan reported', description: 'Sent when a lender adds a new loan in your name.' },
  { id: 'delinquency', label: 'Late payment flag', description: 'Sent when a lender reports a payment as late.' },
  { id: 'dispute', label: 'Dispute updates', description: 'Sent whenever your dispute changes status.' },
];

export const DEFAULT_PREFS = {
  report: { sms: true, email: true, inapp: true },
  inquiry: { sms: true, email: true, inapp: true },
  loan: { sms: true, email: false, inapp: true },
  delinquency: { sms: true, email: true, inapp: true },
  dispute: { sms: true, email: true, inapp: true },
};

export const SESSIONS = [
  { id: 'current', device: 'Chrome on Android (Samsung A14)', location: 'Yangon, MM', ip: '103.25.12.40', lastActive: 'Now', current: true },
  { id: 'S-2', device: 'Viber in-app browser (iPhone)', location: 'Yangon, MM', ip: '37.111.8.90', lastActive: '23 Sep 2026 15:02', current: false },
];

export const REPRESENTATIVES = [
  { id: 'REP-0042', name: 'Ko Zaw Min Oo', relation: 'Son', nrc: '12/OUKAMA(N)401122', document: 'power-of-attorney-2026.pdf', validFrom: '2026-07-01', validTo: '2026-12-31', status: 'Active' },
];
