import { SERVICES } from '@/data/services';
import { ABAC_SEED, POLICY_SEED, USER_SEED } from './iam';
import { API_CLIENTS, FEATURE_FLAGS, JOBS, SYSTEM_DEFAULTS } from './system';
import { BREACHES, DSRS } from './compliance';
import { FORMS, GLOBAL_SETTINGS, LANDING_BLOCKS, MEDIA, MENU_ITEMS, NOTICES } from './cmsExtras';
import { CMS_ITEMS, CMS_SETTINGS } from './cms';
import { CREDIT_NOTES_SEED } from './billing';
import { BATCHES, DQ_RULES } from './dataQuality';
import { ID_TICKETS } from './helpdesk';
import { IDENTITY_PAIRS } from './identity';
import { TEMPLATE_SEED } from './notifications';
import { RULE_SETS } from './rules';
import { SECURITY_EVENTS, SIEM_DEFAULTS } from './security';
import { REFERENCE_TABLES } from './masterData';

export const NAV_SEED = { blocks: LANDING_BLOCKS, menu: MENU_ITEMS, publishedAt: '2026-09-12 14:05', publishedBy: 'Daw Moe Moe' };

/**
 * Starting value of every admin collection, keyed by storage key. The store falls back to
 * these so an approval decided in the inbox applies even if the owning page was never opened.
 */
export const SEED_REGISTRY = {
  services: SERVICES,
  adminUsers: USER_SEED,
  abacRules: ABAC_SEED,
  iamPolicy: POLICY_SEED,
  roleMatrix: {},
  apiClients: API_CLIENTS,
  featureFlags: FEATURE_FLAGS,
  systemJobs: JOBS,
  systemConfig: SYSTEM_DEFAULTS,
  breaches: BREACHES,
  dsrs: DSRS,
  cmsForms: FORMS,
  cmsMedia: MEDIA,
  cmsNotices: NOTICES,
  cmsItems: CMS_ITEMS,
  cmsSettings: CMS_SETTINGS,
  cmsGlobalSettings: GLOBAL_SETTINGS,
  cmsNavigation: NAV_SEED,
  cmsTranslations: {},
  creditNotes: CREDIT_NOTES_SEED,
  invoices: [],
  dqBatches: BATCHES,
  dqRules: DQ_RULES,
  idTickets: ID_TICKETS,
  identityPairs: IDENTITY_PAIRS,
  notificationTemplates: TEMPLATE_SEED,
  ruleSets: RULE_SETS,
  securityEvents: SECURITY_EVENTS,
  siemConfig: SIEM_DEFAULTS,
  ...Object.fromEntries(Object.values(REFERENCE_TABLES).map((t) => [t.key, t.seed])),
};
