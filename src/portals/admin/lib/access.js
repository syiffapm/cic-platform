import { featureById } from '@/data/rbac';
import { PII_ROLES } from '@/portals/government/lib/access';

/**
 * Console module keys used by older pages → Government Portal feature ids. Every permission
 * decision reads the role matrix (Platform administration → Roles & permissions).
 */
export const MODULE_FEATURE = {
  dashboard: 'adm.operations',
  approvals: 'adm.approvals',
  cms: 'cms.content',
  services: 'cms.services',
  notifications: 'cms.notifications',
  iam: 'adm.users',
  masterdata: 'adm.masterData',
  dataquality: 'adm.dataQuality',
  identity: 'adm.identity',
  rules: 'adm.rules',
  helpdesk: 'adm.helpdesk',
  reportRequests: 'adm.reportRequests',
  billing: 'adm.billing',
  audit: 'adm.audit',
  system: 'adm.system',
  compliance: 'adm.compliance',
};

/** Accepts either an old module key ('iam') or a feature id ('adm.users'). */
export const featureFor = (module) => MODULE_FEATURE[module] ?? module;
export const moduleLabel = (module) => featureById(featureFor(module))?.label ?? module;

/** Approval-queue area per feature (approval.module = `Admin · <area>`; queues filter on it). */
const APPROVAL_AREA = {
  'adm.operations': 'Operations dashboard', 'adm.approvals': 'Approvals inbox', 'cms.services': 'Service catalogue',
  'cms.notifications': 'Notification templates', 'adm.users': 'Users, roles & access', 'adm.roles': 'Users, roles & access',
  'adm.policies': 'Users, roles & access', 'adm.masterData': 'Master data', 'adm.dataQuality': 'Data quality & ingestion',
  'adm.identity': 'Identity resolution', 'adm.rules': 'Rules & scoring', 'adm.helpdesk': 'Disputes & helpdesk',
  'adm.reportRequests': 'Credit report requests', 'adm.billing': 'Billing & entitlements', 'adm.audit': 'Audit & security',
  'adm.system': 'System & jobs', 'adm.compliance': 'Compliance / DPO',
};
export const approvalArea = (module) => {
  const f = featureFor(module);
  return APPROVAL_AREA[f] ?? (f.startsWith('cms.') ? 'CMS' : moduleLabel(module));
};

/** Roles that see borrower PII unmasked (plus supervisors with borrower drill-down). */
export const PII_UNMASKED = PII_ROLES;
