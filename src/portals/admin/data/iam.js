import { DEMO_USERS, ROLES } from '@/data/roles';

/** IAM mock data for A4 (ADM-03, ADM-04). "Today" = 2026-09-25. */
export const TODAY = '2026-09-25';
/** Sign-in channels with their own MFA and network policy (Government staff of CBM and CIC sign in from different networks). */
export const PORTALS = ['borrower', 'mfi', 'regulator', 'admin'];
export const PORTAL_LABELS = { borrower: 'Borrower portal', mfi: 'MFI portal', regulator: 'Government Portal · Central Bank staff', admin: 'Government Portal · CIC staff', system: 'System' };

/** Portals a user account belongs to. Older records filed under the former supervision / console names are Government accounts. */
export const USER_PORTALS = ['gov', 'mfi', 'borrower'];
export const USER_PORTAL_LABELS = { gov: 'Government', mfi: 'MFI', borrower: 'Borrower' };
export const userPortal = (u) => (['regulator', 'admin'].includes(u?.portal) ? 'gov' : u?.portal);
export const USER_STATUSES = ['Active', 'Dormant — auto-disabled', 'Locked', 'Disabled', 'Sealed (break-glass)'];

const LAST_LOGINS = ['2026-09-25 08:12', '2026-09-24 17:40', '2026-09-25 09:03', '2026-09-23 11:26', '2026-09-24 14:55', '2026-09-22 10:01', '2026-09-25 07:48'];
const RECERT = ['2026-10-15', '2026-10-31', '2027-01-20', '2027-03-05'];

const base = DEMO_USERS.map((u, i) => ({
  id: u.id, name: u.name, email: u.email, portal: u.portal, role: u.role, tenant: u.tenant ?? (u.portal === 'mfi' ? 'MFI-001' : '—'), scope: u.scope,
  status: 'Active', mfa: u.portal !== 'borrower' || i % 2 === 0, lastLogin: LAST_LOGINS[i % LAST_LOGINS.length], failedLogins: 0,
  recertDue: u.portal === 'borrower' ? '—' : RECERT[i % RECERT.length], createdAt: '2025-11-03',
}));

export const EXTRA_USERS = [
  { id: 'U-M014', name: 'Ko Nyein Chan', email: 'nyein.chan@alliancemm.com', portal: 'mfi', role: 'mfi_officer', tenant: 'MFI-002', status: 'Active', mfa: true, lastLogin: '2026-09-24 16:22', failedLogins: 0, recertDue: '2026-10-05', createdAt: '2026-02-11' },
  { id: 'U-M021', name: 'Ma Phyu Sin', email: 'phyu.sin@visionfund.mm', portal: 'mfi', role: 'mfi_maker', tenant: 'MFI-003', status: 'Active', mfa: true, lastLogin: '2026-09-25 08:40', failedLogins: 0, recertDue: '2026-10-05', createdAt: '2026-01-18' },
  { id: 'U-M033', name: 'U Win Naing', email: 'win.naing@mahamfi.com', portal: 'mfi', role: 'mfi_officer', tenant: 'MFI-004', status: 'Dormant — auto-disabled', mfa: true, lastLogin: '2026-05-30 15:04', failedLogins: 0, recertDue: '2026-10-05', createdAt: '2025-08-02', note: 'No sign-in for 118 days; auto-disabled 2026-08-28 (90-day rule)' },
  { id: 'U-G011', name: 'Daw Sandar Oo', email: 'sandar.oo@cbm.gov.mm', portal: 'gov', role: 'gov_analyst', tenant: '—', status: 'Dormant — auto-disabled', mfa: true, lastLogin: '2026-06-11 09:37', failedLogins: 0, recertDue: '2026-10-31', createdAt: '2025-06-14', note: 'No sign-in for 106 days; auto-disabled 2026-09-09 (90-day rule)' },
  { id: 'U-M042', name: 'Ko Zeyar Htun', email: 'zeyar@sathapana.mm', portal: 'mfi', role: 'mfi_checker', tenant: 'MFI-005', status: 'Locked', mfa: true, lastLogin: '2026-09-25 06:58', failedLogins: 5, recertDue: '2026-10-05', createdAt: '2026-03-22', note: 'Locked after 5 failed sign-ins from 103.25.12.40 at 06:58' },
  { id: 'U-A014', name: 'Ma Thiri Kyaw', email: 'thiri.kyaw@cic.gov.mm', portal: 'gov', role: 'adm_editor', tenant: '—', status: 'Active', mfa: false, lastLogin: '2026-09-24 13:15', failedLogins: 1, recertDue: '2026-10-15', createdAt: '2026-09-01', note: 'MFA enrolment pending (grace period ends 2026-09-30)' },
  { id: 'U-BG01', name: 'bg-emergency-01', email: 'bg-emergency-01@cic.gov.mm', portal: 'gov', role: 'adm_super', tenant: '—', status: 'Sealed (break-glass)', breakGlass: true, mfa: true, lastLogin: '2026-03-14 02:17', failedLogins: 0, recertDue: '2026-12-31', createdAt: '2024-12-01', lastUse: '2026-03-14 02:17 — DB failover drill (INC-2026-031), sealed again 02:58', custodian: 'CISO safe A (sealed envelope #0417)' },
  { id: 'U-BG02', name: 'bg-emergency-02', email: 'bg-emergency-02@cic.gov.mm', portal: 'gov', role: 'adm_super', tenant: '—', status: 'Sealed (break-glass)', breakGlass: true, mfa: true, lastLogin: '2025-11-02 21:40', failedLogins: 0, recertDue: '2026-12-31', createdAt: '2024-12-01', lastUse: '2025-11-02 21:40 — Annual DR test, sealed again 22:15', custodian: 'Deputy Governor safe (sealed envelope #0418)' },
];

export const USER_SEED = [...base, ...EXTRA_USERS];

export const TENANTS = [
  { value: 'MFI-001', label: 'MFI-001 · PGMF' }, { value: 'MFI-002', label: 'MFI-002 · AMM' }, { value: 'MFI-003', label: 'MFI-003 · VFM' },
  { value: 'MFI-004', label: 'MFI-004 · MAHA' }, { value: 'MFI-005', label: 'MFI-005 · SMF' }, { value: 'MFI-008', label: 'MFI-008 · SHCF' },
  { value: 'MFI-012', label: 'MFI-012 · YWEF' },
];

export const rolesForPortal = (portal) => ROLES.filter((r) => r.portal === portal);

/* ---------- Role builder ---------- */
export const ACTIONS = ['view', 'create', 'edit', 'approve', 'export'];

export const MATRIX_MODULES = {
  admin: [
    ['A1', 'Operations dashboard'], ['A2', 'CMS'], ['A3', 'Service catalogue'], ['A4', 'Users, roles & access'], ['A5', 'Master data'],
    ['A6', 'Data quality & ingestion'], ['A7', 'Identity resolution'], ['A8', 'Rules & scoring'], ['A9', 'Disputes & helpdesk'],
    ['A10', 'Billing & entitlements'], ['A11', 'Notification templates'], ['A12', 'Audit & security'], ['A13', 'System & jobs'], ['A14', 'Compliance / DPO'],
  ],
  mfi: [['M1', 'Dashboard'], ['M2', 'Credit inquiry'], ['M3', 'Data submission'], ['M4', 'Batch approval'], ['M5', 'Disputes'], ['M6', 'Users & API keys'], ['M7', 'Invoices & usage']],
  regulator: [['R1', 'Executive dashboard'], ['R2', 'MFI supervision'], ['R3', 'Early warning'], ['R4', 'Consumer protection'], ['R5', 'Analytics & census'], ['R6', 'Licensing'], ['R7', 'Publications']],
  borrower: [['B1', 'My report'], ['B2', 'Consent log & who-viewed'], ['B3', 'Disputes'], ['B4', 'Alerts & profile']],
};

// letters: v view, c create, e edit, a approve, x export
const ADMIN_SCOPE = {
  adm_super: { '*': 'vceax' },
  adm_security: { A1: 'v', A4: 'vcex', A12: 'vcex', A13: 'vce' },
  adm_editor: { A1: 'v', A2: 'vce', A3: 'vce', A11: 'vce' },
  adm_publisher: { A1: 'v', A2: 'va', A3: 'va', A11: 'va' },
  adm_steward: { A1: 'v', A5: 'vce', A6: 'vcex', A7: 'vce', A8: 'vce', A9: 'vce' },
  adm_helpdesk: { A1: 'v', A9: 'vce', A11: 'v' },
  adm_billing: { A1: 'v', A10: 'vcex' },
  adm_auditor: { '*': 'vx' },
  adm_dpo: { A1: 'v', A5: 'v', A6: 'v', A7: 'v', A9: 'v', A12: 'vx', A14: 'vceax' },
};
const OTHER_SCOPE = {
  mfi_admin: { M1: 'v', M6: 'vce', M7: 'vx' }, mfi_officer: { M1: 'v', M2: 'vcx' }, mfi_maker: { M1: 'v', M3: 'vce' },
  mfi_checker: { M1: 'v', M3: 'v', M4: 'va' }, mfi_dispute: { M1: 'v', M5: 'vce' }, mfi_viewer: { M1: 'vx', M3: 'v', M5: 'v', M7: 'vx' },
  gov_exec: { R1: 'vx', R2: 'v', R7: 'va' }, gov_supervisor: { R1: 'v', R2: 'vcex', R3: 'vce', R4: 'v' }, gov_cpo: { R1: 'v', R4: 'vcea' },
  gov_analyst: { R1: 'v', R5: 'vcx', R7: 'vc' }, gov_licensing: { R2: 'v', R6: 'vce' },
  borrower: { B1: 'vx', B2: 'v', B3: 'vc', B4: 've' }, borrower_rep: { B1: 'v', B2: 'v', B3: 'vc' },
};

export function defaultPerms(roleId, moduleCode) {
  const scope = ADMIN_SCOPE[roleId] ?? OTHER_SCOPE[roleId] ?? {};
  const letters = scope[moduleCode] ?? scope['*'] ?? '';
  return {
    view: letters.includes('v'), create: letters.includes('c'), edit: letters.includes('e'), approve: letters.includes('a'), export: letters.includes('x'),
  };
}

export const ABAC_SEED = [
  { id: 'ABAC-01', name: 'Tenant isolation', appliesTo: 'All MFI roles', attribute: 'resource.tenant', operator: '=', value: 'token.tenant', effect: 'Deny + log', status: 'Active' },
  { id: 'ABAC-02', name: 'Supervisor regional scope', appliesTo: 'gov_supervisor', attribute: 'mfi.region', operator: '∈', value: 'user.regions', effect: 'Deny drill-down outside region', status: 'Active' },
  { id: 'ABAC-03', name: 'Purpose-bound inquiry', appliesTo: 'mfi_officer', attribute: 'request.purpose', operator: 'required', value: 'PURPOSE_CODES + consent ref', effect: 'Reject inquiry', status: 'Active' },
  { id: 'ABAC-04', name: 'Time-boxed audit access', appliesTo: 'adm_auditor', attribute: 'now()', operator: '≤', value: 'grant.expires_at (max 30 d)', effect: 'Session revoked at expiry', status: 'Active' },
  { id: 'ABAC-05', name: 'Borrower own-record only', appliesTo: 'borrower, borrower_rep', attribute: 'report.subject_id', operator: '=', value: 'token.borrower_id', effect: 'Deny + log', status: 'Active' },
];

/* ---------- Policies ---------- */
export const POLICY_SEED = {
  mfa: {
    borrower: { enforced: true, method: 'SMS OTP' },
    mfi: { enforced: true, method: 'TOTP authenticator' },
    regulator: { enforced: true, method: 'SSO (CBM AD) + MFA' },
    admin: { enforced: true, method: 'Hardware key (FIDO2) or TOTP' },
  },
  password: { minLength: 12, complexity: true, history: 5, expiryDays: 90, lockoutAttempts: 5 },
  ipAllow: {
    borrower: [],
    mfi: ['103.25.12.0/24', '203.81.64.0/22'],
    regulator: ['10.20.0.0/16', '192.168.50.0/24'],
    admin: ['10.10.4.0/24', '10.10.8.0/24'],
  },
  session: { idleMinutes: 10, absoluteHours: 8, concurrent: 1 },
  dormantDays: 90,
  recertMonths: 6,
};

export const MFA_METHODS = {
  borrower: ['SMS OTP', 'SMS OTP + device binding'],
  mfi: ['TOTP authenticator', 'SMS OTP', 'Hardware key (FIDO2)'],
  regulator: ['SSO (CBM AD) + MFA', 'SSO only'],
  admin: ['Hardware key (FIDO2) or TOTP', 'Hardware key (FIDO2) only', 'TOTP authenticator'],
};

export const CIDR_RE = /^(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}\/(3[0-2]|[12]?\d)$/;

export const RECERT_CAMPAIGN = {
  id: 'Q3-2026', name: 'Access recertification Q3-2026', started: '2026-09-01', due: '2026-10-05', scope: 'All MFI and Government accounts',
  managers: [
    { manager: 'U Kyaw Zin (PGMF admin)', total: 48, certified: 46, revoked: 2 },
    { manager: 'Daw Hla Hla (AMM admin)', total: 31, certified: 22, revoked: 1 },
    { manager: 'U Myo Thant (VFM admin)', total: 27, certified: 12, revoked: 0 },
    { manager: 'Dr. Than Than Nwe (CBM FRD)', total: 19, certified: 19, revoked: 1 },
    { manager: 'U Soe Paing (CIC)', total: 14, certified: 10, revoked: 1 },
  ],
};
