/**
 * Role-based access control catalogue — the single source for what every staff role may do.
 * Managed by the Government Portal (Administration → Roles & permissions); MFI roles are templates
 * defined by CIC / Central Bank and assigned to users by each MFI administrator.
 *
 * Actions: C create · R read · U update · D delete · A approve (publish, issue, sign off) · E export.
 * A permission is a string of action letters per feature, e.g. { 'gov.cases': 'CRU' }.
 */
export const ACTIONS = [
  { key: 'C', id: 'create', label: 'Create' },
  { key: 'R', id: 'read', label: 'Read' },
  { key: 'U', id: 'update', label: 'Update' },
  { key: 'D', id: 'delete', label: 'Delete' },
  { key: 'A', id: 'approve', label: 'Approve' },
  { key: 'E', id: 'export', label: 'Export' },
];

/** Features per portal. `actions` = what the feature supports; `path` = where it lives. */
export const FEATURES = [
  // Government — Supervision
  { id: 'gov.dashboard', portal: 'gov', group: 'Supervision', label: 'Executive dashboard', actions: 'RE', path: '/gov/dashboard' },
  { id: 'gov.lending', portal: 'gov', group: 'Supervision', label: 'Lending activity', actions: 'RE', path: '/gov/lending' },
  { id: 'gov.kpi', portal: 'gov', group: 'Supervision', label: 'KPI dictionary', actions: 'RU', path: '/gov/kpi-dictionary' },
  { id: 'gov.institutions', portal: 'gov', group: 'Supervision', label: 'Institution register & licensing', actions: 'CRUDAE', path: '/gov/mfi' },
  { id: 'gov.compliance', portal: 'gov', group: 'Supervision', label: 'Reporting compliance', actions: 'RE', path: '/gov/compliance' },
  { id: 'gov.prudential', portal: 'gov', group: 'Supervision', label: 'Prudential metrics', actions: 'RE', path: '/gov/prudential' },
  { id: 'gov.cases', portal: 'gov', group: 'Supervision', label: 'Supervisory cases', actions: 'CRUDAE', path: '/gov/cases' },
  { id: 'gov.infoRequests', portal: 'gov', group: 'Supervision', label: 'Information requests to MFIs', actions: 'CRUD', path: '/gov/info-requests' },
  // Government — Risk & consumer protection
  { id: 'gov.ews', portal: 'gov', group: 'Risk & consumer protection', label: 'Early-warning alerts & rules', actions: 'CRUDA', path: '/gov/ews' },
  { id: 'gov.overIndebtedness', portal: 'gov', group: 'Risk & consumer protection', label: 'Over-indebtedness monitor', actions: 'RE', path: '/gov/over-indebtedness' },
  { id: 'gov.drilldown', portal: 'gov', group: 'Risk & consumer protection', label: 'Borrower-level drill-down (personal data)', actions: 'R', path: null },
  { id: 'gov.disputes', portal: 'gov', group: 'Risk & consumer protection', label: 'Dispute oversight & escalation', actions: 'RUE', path: '/gov/disputes' },
  { id: 'gov.complaints', portal: 'gov', group: 'Risk & consumer protection', label: 'Complaint register', actions: 'CRUDE', path: '/gov/complaints' },
  // Government — Data & analytics
  { id: 'gov.census', portal: 'gov', group: 'Data & analytics', label: 'Census & township map', actions: 'RE', path: '/gov/census' },
  { id: 'gov.altData', portal: 'gov', group: 'Data & analytics', label: 'Alternative data (pilot)', actions: 'R', path: '/gov/alt-data' },
  { id: 'gov.aiInsights', portal: 'gov', group: 'Data & analytics', label: 'AI insights', actions: 'R', path: '/gov/ai-insights' },
  { id: 'gov.reports', portal: 'gov', group: 'Data & analytics', label: 'Statutory & ad-hoc reports', actions: 'CRE', path: '/gov/reports' },
  { id: 'gov.policy', portal: 'gov', group: 'Data & analytics', label: 'Policy impact analysis', actions: 'R', path: '/gov/policy-simulation' },
  // Government — Publishing
  { id: 'gov.announcements', portal: 'gov', group: 'Publishing', label: 'Regulatory notices', actions: 'CRUD', path: '/gov/announcements' },
  { id: 'gov.publicationApproval', portal: 'gov', group: 'Publishing', label: 'Publication approval', actions: 'RA', path: '/gov/publication-approval' },
  // Government — Content (CMS)
  { id: 'cms.content', portal: 'gov', group: 'Content management', label: 'Pages, news, FAQ & documents', actions: 'CRUDA', path: '/gov/admin/cms' },
  { id: 'cms.media', portal: 'gov', group: 'Content management', label: 'Media library', actions: 'CRUD', path: '/gov/admin/cms/media' },
  { id: 'cms.navigation', portal: 'gov', group: 'Content management', label: 'Menus & landing layout', actions: 'RUA', path: '/gov/admin/cms/navigation' },
  { id: 'cms.notices', portal: 'gov', group: 'Content management', label: 'Targeted notices to MFIs', actions: 'CRUDA', path: '/gov/admin/cms/notices' },
  { id: 'cms.forms', portal: 'gov', group: 'Content management', label: 'Forms builder', actions: 'CRUDA', path: '/gov/admin/cms/forms' },
  { id: 'cms.settings', portal: 'gov', group: 'Content management', label: 'Site settings & emergency banner', actions: 'RUA', path: '/gov/admin/cms/settings' },
  { id: 'cms.translations', portal: 'gov', group: 'Content management', label: 'UI translations', actions: 'RUA', path: '/gov/admin/cms/translations' },
  { id: 'cms.analytics', portal: 'gov', group: 'Content management', label: 'Content analytics', actions: 'RE', path: '/gov/admin/cms/analytics' },
  { id: 'cms.services', portal: 'gov', group: 'Content management', label: 'Service catalogue', actions: 'RUA', path: '/gov/admin/services' },
  { id: 'cms.notifications', portal: 'gov', group: 'Content management', label: 'SMS & email templates', actions: 'CRUDA', path: '/gov/admin/notifications' },
  // Government — Platform administration
  { id: 'adm.operations', portal: 'gov', group: 'Platform administration', label: 'Operations dashboard', actions: 'RE', path: '/gov/admin' },
  { id: 'adm.approvals', portal: 'gov', group: 'Platform administration', label: 'Approvals inbox (maker-checker)', actions: 'RA', path: '/gov/admin/approvals' },
  { id: 'adm.users', portal: 'gov', group: 'Platform administration', label: 'Users & citizen accounts', actions: 'CRUDA', path: '/gov/admin/iam/users' },
  { id: 'adm.roles', portal: 'gov', group: 'Platform administration', label: 'Roles & permissions', actions: 'CRUDA', path: '/gov/admin/access/roles' },
  { id: 'adm.policies', portal: 'gov', group: 'Platform administration', label: 'Security policies', actions: 'RUA', path: '/gov/admin/iam/policies' },
  { id: 'adm.masterData', portal: 'gov', group: 'Platform administration', label: 'Master & reference data', actions: 'CRUDA', path: '/gov/admin/master-data' },
  { id: 'adm.dataQuality', portal: 'gov', group: 'Platform administration', label: 'Data quality & ingestion', actions: 'CRUDA', path: '/gov/admin/data-quality' },
  { id: 'adm.identity', portal: 'gov', group: 'Platform administration', label: 'Identity resolution', actions: 'RUA', path: '/gov/admin/identity' },
  { id: 'adm.rules', portal: 'gov', group: 'Platform administration', label: 'Scoring & EWS rules', actions: 'CRUDA', path: '/gov/admin/rules' },
  { id: 'adm.reportRequests', portal: 'gov', group: 'Platform administration', label: 'Citizen credit report requests', actions: 'RUA', path: '/gov/admin/report-requests' },
  { id: 'adm.helpdesk', portal: 'gov', group: 'Platform administration', label: 'Disputes & helpdesk', actions: 'CRUDA', path: '/gov/admin/helpdesk' },
  { id: 'adm.billing', portal: 'gov', group: 'Platform administration', label: 'Billing & entitlements', actions: 'CRUDAE', path: '/gov/admin/billing' },
  { id: 'adm.audit', portal: 'gov', group: 'Platform administration', label: 'Audit & security logs', actions: 'RE', path: '/gov/admin/audit' },
  { id: 'adm.system', portal: 'gov', group: 'Platform administration', label: 'System, jobs & backup', actions: 'RUA', path: '/gov/admin/system' },
  { id: 'adm.compliance', portal: 'gov', group: 'Platform administration', label: 'Data protection (DPO)', actions: 'CRUDE', path: '/gov/admin/compliance' },
  // MFI Member Portal
  { id: 'mfi.dashboard', portal: 'mfi', group: 'Overview', label: 'Institution dashboard', actions: 'R', path: '/mfi' },
  { id: 'mfi.applications', portal: 'mfi', group: 'Lending', label: 'Loan applications (credit check, decision, disbursement)', actions: 'CRUAE', path: '/mfi/applications' },
  { id: 'mfi.inquiry', portal: 'mfi', group: 'Credit inquiry', label: 'Credit inquiry & report', actions: 'CRE', path: '/mfi/inquiry' },
  { id: 'mfi.batchInquiry', portal: 'mfi', group: 'Credit inquiry', label: 'Batch inquiry', actions: 'CRE', path: '/mfi/inquiry/batch' },
  { id: 'mfi.submissions', portal: 'mfi', group: 'Data submission', label: 'Data submissions (upload, fix, sign off)', actions: 'CRUDAE', path: '/mfi/submissions' },
  { id: 'mfi.calendar', portal: 'mfi', group: 'Data submission', label: 'Submission calendar', actions: 'R', path: '/mfi/submissions/calendar' },
  { id: 'mfi.disputes', portal: 'mfi', group: 'Disputes', label: 'Dispute inbox & corrections', actions: 'RUE', path: '/mfi/disputes' },
  { id: 'mfi.monitoring', portal: 'mfi', group: 'Disputes', label: 'Portfolio alerts', actions: 'RU', path: '/mfi/monitoring' },
  { id: 'mfi.users', portal: 'mfi', group: 'Institution', label: 'Institution users', actions: 'CRUD', path: '/mfi/institution/users' },
  { id: 'mfi.apiKeys', portal: 'mfi', group: 'Institution', label: 'API keys & webhooks', actions: 'CRUD', path: '/mfi/institution/api-keys' },
  { id: 'mfi.billing', portal: 'mfi', group: 'Institution', label: 'Usage & invoices', actions: 'RE', path: '/mfi/institution/billing' },
  { id: 'mfi.audit', portal: 'mfi', group: 'Institution', label: 'Institution audit trail', actions: 'RE', path: '/mfi/institution/audit' },
  { id: 'mfi.announcements', portal: 'mfi', group: 'Resources', label: 'Notices (read & acknowledge)', actions: 'RU', path: '/mfi/resources/announcements' },
  { id: 'mfi.census', portal: 'mfi', group: 'Resources', label: 'Census data', actions: 'CRU', path: '/mfi/resources/census' },
  { id: 'mfi.altData', portal: 'mfi', group: 'Resources', label: 'Alternative data', actions: 'R', path: '/mfi/resources/alt-data' },
];

export const featureById = (id) => FEATURES.find((f) => f.id === id);

/** Builds a permission map: grant(['gov.cases', 'gov.ews'], 'CRU') keeps only actions each feature supports. */
function grant(ids, letters) {
  return Object.fromEntries(ids.map((id) => {
    const f = featureById(id);
    return [id, [...letters].filter((l) => f?.actions.includes(l)).join('')];
  }).filter(([, v]) => v));
}
const ids = (prefixOrGroup) => FEATURES.filter((f) => f.id.startsWith(prefixOrGroup) || f.group === prefixOrGroup).map((f) => f.id);
const merge = (...maps) => maps.reduce((acc, m) => {
  Object.entries(m).forEach(([k, v]) => { acc[k] = [...new Set([...(acc[k] ?? ''), ...v])].sort((a, b) => 'CRUDAE'.indexOf(a) - 'CRUDAE'.indexOf(b)).join(''); });
  return acc;
}, {});

const GOV_READ_SUPERVISION = ['gov.dashboard', 'gov.lending', 'gov.kpi', 'gov.compliance', 'gov.prudential', 'gov.census', 'gov.overIndebtedness'];

/**
 * Role templates. scope.data = what data the role sees; scope.regions = 'All regions' or a list;
 * scope.institution = 'Own institution' for MFI roles. Users may narrow (never widen) the scope.
 */
export const ROLE_TEMPLATES = [
  // ---- Government: Central Bank / FRD
  { id: 'gov_exec', portal: 'gov', org: 'Central Bank of Myanmar', name: 'Governor / Director', description: 'Leads supervision. Signs off licence changes, case decisions and public releases.', system: true,
    scope: { data: 'Aggregated data; case files on approval', regions: 'All regions' },
    permissions: merge(grant(GOV_READ_SUPERVISION, 'RE'), grant(['gov.institutions', 'gov.cases', 'gov.ews'], 'RAE'), grant(['gov.publicationApproval'], 'RA'), grant(['gov.announcements'], 'CRUD'), grant(['gov.reports'], 'CRE'), grant(['gov.policy', 'gov.altData', 'gov.aiInsights', 'gov.complaints', 'gov.disputes', 'gov.infoRequests'], 'RE'), grant(['adm.approvals', 'adm.operations', 'adm.audit'], 'R')) },
  { id: 'gov_supervisor', portal: 'gov', org: 'Central Bank of Myanmar', name: 'Supervisor / Examiner (national)', description: 'Runs supervision nationally: alerts, cases, information requests, drill-down with logged justification.', system: true,
    scope: { data: 'Institution data; borrower drill-down logged with justification', regions: 'All regions' },
    permissions: merge(grant(GOV_READ_SUPERVISION, 'RE'), grant(['gov.cases', 'gov.infoRequests', 'gov.ews'], 'CRUDE'), grant(['gov.institutions'], 'RE'), grant(['gov.drilldown'], 'R'), grant(['gov.disputes'], 'RUE'), grant(['gov.complaints'], 'RU'), grant(['gov.announcements'], 'CRU'), grant(['gov.reports'], 'CRE'), grant(['gov.altData', 'gov.aiInsights', 'gov.policy'], 'R')) },
  { id: 'gov_supervisor_regional', portal: 'gov', org: 'Central Bank of Myanmar', name: 'Regional Supervisor', description: 'Same duties as a supervisor, limited to the institutions and townships of assigned regions.', system: false,
    scope: { data: 'Institution data in assigned regions; drill-down logged', regions: ['Mandalay', 'Sagaing', 'Magway'] },
    permissions: merge(grant(GOV_READ_SUPERVISION, 'R'), grant(['gov.cases', 'gov.infoRequests'], 'CRU'), grant(['gov.ews'], 'RU'), grant(['gov.institutions', 'gov.complaints'], 'R'), grant(['gov.drilldown'], 'R'), grant(['gov.disputes'], 'RU'), grant(['gov.reports'], 'RE')) },
  { id: 'gov_cpo', portal: 'gov', org: 'Central Bank of Myanmar', name: 'Consumer Protection Officer', description: 'Oversees disputes and complaints, escalates breaches and opens conduct cases.', system: true,
    scope: { data: 'Dispute and complaint case data only', regions: 'All regions' },
    permissions: merge(grant(['gov.disputes'], 'RUE'), grant(['gov.complaints'], 'CRUDE'), grant(['gov.cases'], 'CRU'), grant(['gov.dashboard', 'gov.lending', 'gov.overIndebtedness'], 'R'), grant(['gov.institutions'], 'R')) },
  { id: 'gov_analyst', portal: 'gov', org: 'Central Bank of Myanmar', name: 'Policy / Research Analyst', description: 'Works with anonymised aggregates, statistics and policy analysis. Never sees personal data.', system: true,
    scope: { data: 'Anonymised aggregates only — no personal data', regions: 'All regions' },
    permissions: merge(grant(GOV_READ_SUPERVISION, 'RE'), grant(['gov.kpi'], 'RU'), grant(['gov.reports'], 'CRE'), grant(['gov.altData', 'gov.aiInsights', 'gov.policy'], 'R'), grant(['cms.analytics'], 'R')) },
  { id: 'gov_licensing', portal: 'gov', org: 'Central Bank of Myanmar', name: 'Licensing Officer', description: 'Maintains the institution register and proposes licence changes for Director approval.', system: true,
    scope: { data: 'Institution records only', regions: 'All regions' },
    permissions: merge(grant(['gov.institutions'], 'CRUE'), grant(['gov.compliance', 'gov.dashboard'], 'R')) },
  // ---- Government: CIC operations
  { id: 'adm_super', portal: 'gov', org: 'Credit Information Center', name: 'Super Administrator', description: 'Full platform configuration. Break-glass use only; every change needs a second person.', system: true,
    scope: { data: 'All data (break-glass, alerted)', regions: 'All regions' },
    permissions: Object.fromEntries(FEATURES.filter((f) => f.portal === 'gov').map((f) => [f.id, f.actions])) },
  { id: 'adm_security', portal: 'gov', org: 'Credit Information Center', name: 'Security Administrator', description: 'Manages users, roles, security policies and monitors security logs.', system: true,
    scope: { data: 'No borrower data', regions: 'All regions' },
    permissions: merge(grant(['adm.users', 'adm.roles'], 'CRUDA'), grant(['adm.policies', 'adm.system'], 'RUA'), grant(['adm.audit', 'adm.operations'], 'RE'), grant(['adm.approvals'], 'RA')) },
  { id: 'adm_editor', portal: 'gov', org: 'Credit Information Center', name: 'Content Editor', description: 'Creates and edits website content in English and Myanmar. Cannot publish.', system: true,
    scope: { data: 'Public content only', regions: 'All regions' },
    permissions: merge(grant(['cms.content', 'cms.media', 'cms.notices', 'cms.forms', 'cms.notifications'], 'CRUD'), grant(['cms.navigation', 'cms.settings', 'cms.translations', 'cms.services'], 'RU'), grant(['cms.analytics'], 'RE'), grant(['adm.approvals', 'adm.operations'], 'R')) },
  { id: 'adm_publisher', portal: 'gov', org: 'Credit Information Center', name: 'Content Publisher / Approver', description: 'Reviews and publishes content. Cannot publish an item they edited.', system: true,
    scope: { data: 'Public content only', regions: 'All regions' },
    permissions: merge(grant(ids('Content management'), 'RA'), grant(['cms.analytics'], 'RE'), grant(['adm.approvals'], 'RA'), grant(['adm.operations', 'gov.announcements'], 'R')) },
  { id: 'adm_steward', portal: 'gov', org: 'Credit Information Center', name: 'Data Steward', description: 'Owns data quality, identity resolution, scoring rules and data corrections.', system: true,
    scope: { data: 'Full registry data', regions: 'All regions' },
    permissions: merge(grant(['adm.masterData', 'adm.dataQuality', 'adm.rules'], 'CRUD'), grant(['adm.identity', 'adm.reportRequests'], 'RUA'), grant(['adm.helpdesk'], 'RUA'), grant(['adm.approvals'], 'RA'), grant(['adm.operations', 'adm.audit'], 'R'), grant(['gov.institutions'], 'R')) },
  { id: 'adm_helpdesk', portal: 'gov', org: 'Credit Information Center', name: 'Helpdesk Agent', description: 'Handles citizen tickets, identity verification and personal report requests.', system: true,
    scope: { data: 'Personal data masked', regions: 'All regions' },
    permissions: merge(grant(['adm.helpdesk'], 'CRU'), grant(['adm.reportRequests'], 'RUA'), grant(['adm.users'], 'R'), grant(['cms.notifications', 'adm.operations'], 'R')) },
  { id: 'adm_billing', portal: 'gov', org: 'Credit Information Center', name: 'Billing Officer', description: 'Manages tariffs, quotas, invoices and payment reconciliation.', system: true,
    scope: { data: 'No registry access', regions: 'All regions' },
    permissions: merge(grant(['adm.billing'], 'CRUDE'), grant(['adm.operations', 'adm.approvals'], 'R')) },
  { id: 'adm_auditor', portal: 'gov', org: 'Internal / external audit', name: 'Auditor', description: 'Read-only access to every module and log for a time-boxed engagement.', system: true,
    scope: { data: 'Read-only, all modules (time-boxed)', regions: 'All regions' },
    permissions: Object.fromEntries(FEATURES.filter((f) => f.portal === 'gov').map((f) => [f.id, [...'RE'].filter((l) => f.actions.includes(l)).join('')]).filter(([, v]) => v)) },
  { id: 'adm_dpo', portal: 'gov', org: 'Credit Information Center', name: 'DPO / Compliance Officer', description: 'Handles data subject requests, retention and breaches; read-only on the registry.', system: true,
    scope: { data: 'Read-only on registry', regions: 'All regions' },
    permissions: merge(grant(['adm.compliance'], 'CRUDE'), grant(['adm.audit'], 'RE'), grant(['adm.masterData', 'adm.dataQuality', 'adm.identity', 'adm.helpdesk', 'adm.reportRequests', 'adm.users', 'adm.operations'], 'R')) },
  // ---- MFI role templates (assigned by each MFI administrator)
  { id: 'mfi_admin', portal: 'mfi', org: 'Licensed MFI', name: 'MFI Administrator', description: 'Manages the institution’s users and API keys; second approver for large loans.', system: true,
    scope: { data: 'Own institution only', regions: 'Institution branches' },
    permissions: merge(grant(['mfi.dashboard', 'mfi.calendar', 'mfi.altData'], 'R'), grant(['mfi.applications'], 'CRUAE'), grant(['mfi.inquiry', 'mfi.batchInquiry'], 'CRE'), grant(['mfi.submissions'], 'RE'), grant(['mfi.disputes'], 'RUE'), grant(['mfi.monitoring', 'mfi.announcements'], 'RU'), grant(['mfi.users', 'mfi.apiKeys'], 'CRUD'), grant(['mfi.billing', 'mfi.audit'], 'RE'), grant(['mfi.census'], 'CRU')) },
  { id: 'mfi_officer', portal: 'mfi', org: 'Licensed MFI', name: 'Credit Officer', description: 'Processes loan applications and makes consented credit inquiries.', system: true,
    scope: { data: 'Own institution; borrower reports only with consent', regions: 'Institution branches' },
    permissions: merge(grant(['mfi.dashboard', 'mfi.calendar', 'mfi.altData'], 'R'), grant(['mfi.applications'], 'CRU'), grant(['mfi.inquiry', 'mfi.batchInquiry'], 'CRE'), grant(['mfi.monitoring', 'mfi.announcements'], 'RU')) },
  { id: 'mfi_maker', portal: 'mfi', org: 'Licensed MFI', name: 'Data Submitter (maker)', description: 'Uploads monthly data and fixes rejected rows. Cannot sign off own batch.', system: true,
    scope: { data: 'Own institution submissions', regions: 'Institution branches' },
    permissions: merge(grant(['mfi.dashboard', 'mfi.calendar'], 'R'), grant(['mfi.submissions'], 'CRUDE'), grant(['mfi.census'], 'CRU'), grant(['mfi.announcements'], 'RU')) },
  { id: 'mfi_checker', portal: 'mfi', org: 'Licensed MFI', name: 'Data Approver (checker)', description: 'Reviews batches and signs the attestation. Cannot upload.', system: true,
    scope: { data: 'Own institution submissions', regions: 'Institution branches' },
    permissions: merge(grant(['mfi.dashboard', 'mfi.calendar'], 'R'), grant(['mfi.submissions'], 'RAE'), grant(['mfi.announcements'], 'RU')) },
  { id: 'mfi_dispute', portal: 'mfi', org: 'Licensed MFI', name: 'Dispute Officer', description: 'Responds to borrower disputes and submits corrections for CIC approval.', system: true,
    scope: { data: 'Disputes on own institution data', regions: 'Institution branches' },
    permissions: merge(grant(['mfi.dashboard'], 'R'), grant(['mfi.disputes'], 'RUE'), grant(['mfi.announcements'], 'RU')) },
  { id: 'mfi_viewer', portal: 'mfi', org: 'Licensed MFI', name: 'Compliance / Viewer', description: 'Read-only oversight of the institution’s activity, invoices and audit trail.', system: true,
    scope: { data: 'Own institution, read-only', regions: 'Institution branches' },
    permissions: merge(grant(['mfi.dashboard', 'mfi.calendar', 'mfi.applications', 'mfi.submissions', 'mfi.disputes', 'mfi.announcements'], 'R'), grant(['mfi.billing', 'mfi.audit'], 'RE')) },
];
