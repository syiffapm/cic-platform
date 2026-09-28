import { DEMO_USERS } from '@/data/roles';

/** Tenant users: the institution's portal users. */
export const EXTRA_USERS = [
  { id: 'U-M007', role: 'mfi_officer', name: 'Ko Zaw Myo', email: 'zaw.myo@pgmf.org.mm', tenant: 'MFI-001', branch: 'Pathein branch', status: 'Active', lastLogin: '2026-09-23 16:40', mfa: 'Authenticator app' },
  { id: 'U-M008', role: 'mfi_officer', name: 'Ma Thin Thin Aye', email: 'thin.aye@pgmf.org.mm', tenant: 'MFI-001', branch: 'Monywa branch', status: 'Suspended', lastLogin: '2026-06-02 10:11', mfa: 'SMS OTP', note: 'Suspended after leaving branch (HR ticket 2291)' },
  { id: 'U-M009', role: 'mfi_maker', name: 'Ko Nyein Chan', email: 'nyein.chan@pgmf.org.mm', tenant: 'MFI-001', branch: 'Head office', status: 'Invited', lastLogin: null, mfa: 'Not enrolled' },
  { id: 'U-X101', role: 'mfi_admin', name: 'AMM Administrator', email: 'admin@alliancemm.com', tenant: 'MFI-002', branch: 'Head office', status: 'Active', lastLogin: '2026-09-24 08:00', mfa: 'Authenticator app' },
];

export const initialUsers = () => [
  ...DEMO_USERS.filter((u) => u.portal === 'mfi').map((u, i) => ({
    ...u, branch: 'Head office', status: 'Active', lastLogin: `2026-09-${String(24 - i).padStart(2, '0')} 0${8 + (i % 2)}:1${i}`, mfa: i % 2 ? 'SMS OTP' : 'Authenticator app',
  })),
  ...EXTRA_USERS,
];

export const API_CLIENTS = [
  { id: 'API-PGMF-01', tenant: 'MFI-001', name: 'Core banking — nightly submission', clientId: 'pgmf_cbs_prod_7f3a', env: 'Production', scopes: ['submission'], created: '2025-11-02', lastUsed: '2026-09-23 23:05', status: 'Active', secretHint: '••••••••e91c' },
  { id: 'API-PGMF-02', tenant: 'MFI-001', name: 'Loan origination — inquiry', clientId: 'pgmf_los_prod_12bd', env: 'Production', scopes: ['inquiry'], created: '2026-01-15', lastUsed: '2026-09-24 09:57', status: 'Active', secretHint: '••••••••40aa' },
  { id: 'API-PGMF-03', tenant: 'MFI-001', name: 'Integration testing', clientId: 'pgmf_test_sbx_0c77', env: 'Sandbox', scopes: ['submission', 'inquiry'], created: '2026-08-20', lastUsed: '2026-09-19 14:22', status: 'Active', secretHint: '••••••••b812' },
  { id: 'API-PGMF-00', tenant: 'MFI-001', name: 'Legacy uploader (v3.0)', clientId: 'pgmf_legacy_1a02', env: 'Production', scopes: ['submission'], created: '2024-03-01', lastUsed: '2025-10-30 22:00', status: 'Revoked', secretHint: '••••••••0001' },
];

export const WEBHOOKS = [
  { id: 'WH-01', url: 'https://cbs.pgmf.org.mm/hooks/cic/batch', events: ['batch.validated', 'batch.loaded'], secretHint: 'whsec_••••7c21', lastDelivery: '2026-09-24 09:42', lastStatus: '200 OK' },
  { id: 'WH-02', url: 'https://los.pgmf.org.mm/cic/alerts', events: ['portfolio.alert', 'dispute.assigned'], secretHint: 'whsec_••••a3f0', lastDelivery: '2026-09-24 02:11', lastStatus: '200 OK' },
  { id: 'WH-03', url: 'https://sandbox.pgmf.org.mm/cic/test', events: ['batch.validated'], secretHint: 'whsec_••••11de', lastDelivery: '2026-09-19 14:23', lastStatus: '503 Retrying (3/5)' },
];

export const CHANGELOG = [
  { version: 'API 2.4', date: '2026-09-20', note: 'Schema v3.2 fields guarantor_nrc and household_size added to POST /v1/batches.' },
  { version: 'API 2.3', date: '2026-07-01', note: 'Idempotency-Key header required on POST /v1/batches; replays return the original receipt.' },
  { version: 'API 2.2', date: '2026-04-15', note: 'Webhook signatures moved to HMAC-SHA256 (X-CIC-Signature).' },
  { version: 'API 2.1', date: '2026-01-10', note: 'POST /v1/inquiries returns rule_version and data_date per record.' },
];

/** Billing. Tariff: Full 450 MMK, Basic 250 MMK, no-hit 150 MMK. Retries and technical duplicates are never billed. */
export const TARIFF = { tier: 'Tier 1 — Enterprise', quota: 25_000, full: 450, basic: 250, noHit: 150, subscription: 1_500_000 };

export const USAGE_BY_USER = [
  { user: 'Ma Su Myat', full: 6_120, basic: 2_410, noHit: 380 },
  { user: 'Ko Zaw Myo', full: 4_880, basic: 1_990, noHit: 290 },
  { user: 'LOS API client', full: 2_104, basic: 1_020, noHit: 160 },
  { user: 'U Kyaw Zin', full: 42, basic: 18, noHit: 3 },
];

export const USAGE_BY_PURPOSE = [
  { code: 'NL', count: 11_920 },
  { code: 'RV', count: 4_860 },
  { code: 'CL', count: 1_310 },
  { code: 'GR', count: 1_334 },
];

export const RETRIES_EXCLUDED = 142;

export const INVOICES = [
  { id: 'INV-PGMF-2026-08', period: 'Aug 2026', issued: '2026-09-03', due: '2026-09-30', inquiries: 19_424, amount: 8_420_150, status: 'Unpaid', retriesExcluded: 142 },
  { id: 'INV-PGMF-2026-07', period: 'Jul 2026', issued: '2026-08-03', due: '2026-08-31', inquiries: 18_902, amount: 8_211_300, status: 'Paid', paidOn: '2026-08-21', retriesExcluded: 97 },
  { id: 'INV-PGMF-2026-06', period: 'Jun 2026', issued: '2026-07-03', due: '2026-07-31', inquiries: 18_155, amount: 7_903_900, status: 'Paid', paidOn: '2026-07-28', retriesExcluded: 120 },
  { id: 'INV-PGMF-2026-05', period: 'May 2026', issued: '2026-06-03', due: '2026-06-30', inquiries: 17_740, amount: 7_722_050, status: 'Paid', paidOn: '2026-06-19', retriesExcluded: 64 },
  { id: 'INV-PGMF-2026-04', period: 'Apr 2026', issued: '2026-05-04', due: '2026-05-31', inquiries: 17_020, amount: 7_411_600, status: 'Paid', paidOn: '2026-05-30', retriesExcluded: 88 },
];

/** Portal-local audit extras — entries older than the shared store seed. */
export const AUDIT_EXTRAS = [
  { id: 'AUD-900398', at: '2026-09-23 16:05:10', actor: 'Ma Su Myat', role: 'mfi_officer', tenant: 'MFI-001', ip: '103.25.12.40', action: 'INQUIRY_BASIC_REPORT', module: 'Inquiry', target: 'BRW-004777', purpose: 'RV', outcome: 'Success', hash: 'aa01…93bc' },
  { id: 'AUD-900391', at: '2026-09-23 11:48:33', actor: 'Ko Zaw Myo', role: 'mfi_officer', tenant: 'MFI-001', ip: '103.25.14.9', action: 'INQUIRY_NO_HIT', module: 'Inquiry', target: '14/HAKATA(N)551020', purpose: 'NL', outcome: 'No hit', hash: '12c7…0fe1' },
  { id: 'AUD-900385', at: '2026-09-22 15:20:00', actor: 'Daw Khin Mar', role: 'mfi_checker', tenant: 'MFI-001', ip: '103.25.12.44', action: 'BATCH_APPROVE', module: 'Submission', target: 'BAT-PGMF-2026-09-D17', purpose: '—', outcome: 'Success', hash: '7e3d…b210' },
  { id: 'AUD-900377', at: '2026-09-22 10:02:41', actor: 'Ma Ei Phyu', role: 'mfi_dispute', tenant: 'MFI-001', ip: '103.25.12.45', action: 'DISPUTE_VIEW', module: 'Disputes', target: 'DSP-2026-0405', purpose: 'Dispute handling', outcome: 'Success', hash: '3ff0…44d8' },
  { id: 'AUD-900360', at: '2026-09-21 09:15:12', actor: 'U Kyaw Zin', role: 'mfi_admin', tenant: 'MFI-001', ip: '103.25.12.40', action: 'API_KEY_ROTATE', module: 'API', target: 'API-PGMF-02', purpose: '—', outcome: 'Success', hash: '90ab…c1d2' },
  { id: 'AUD-900352', at: '2026-09-20 14:40:55', actor: 'Ma Su Myat', role: 'mfi_officer', tenant: 'MFI-001', ip: '103.25.12.40', action: 'REPORT_DOWNLOAD_PDF', module: 'Inquiry', target: 'CIC-R-2026-0918-7731', purpose: 'NL', outcome: 'Success', hash: '5a5a…e8e8' },
  { id: 'AUD-800101', at: '2026-09-20 10:00:00', actor: 'AMM Credit Officer', role: 'mfi_officer', tenant: 'MFI-002', ip: '103.40.2.1', action: 'INQUIRY_FULL_REPORT', module: 'Inquiry', target: 'BRW-000184', purpose: 'RV', outcome: 'Success', hash: 'ffff…0000' },
];
