import {
  Activity, AlertTriangle, BarChart3, Bell, BellRing, BookOpen, Building2, Calculator, CheckSquare, ClipboardCheck,
  ClipboardList, Database, DatabaseZap, FileBarChart, FileCheck2, FileSignature, FileText, Fingerprint, FolderKanban,
  Gauge, Headphones, Image, Inbox, KeyRound, Languages, LayoutDashboard, LayoutGrid, Map, Megaphone, Menu,
  MessageSquareWarning, Receipt, SatelliteDish, Scale, ScrollText, Send, Server, Settings, ShieldCheck,
  SlidersHorizontal, Sparkles, TrendingUp, UserCog, Users,
} from 'lucide-react';
import { FEATURES, featureById } from '@/data/rbac';

/** Sidebar sections of the Government Portal, in display order. */
export const GROUP_ORDER = [
  'Supervision', 'Risk & consumer protection', 'Data & analytics', 'Publishing', 'Content management', 'Platform administration',
];

export const FEATURE_ICONS = {
  'gov.dashboard': LayoutDashboard, 'gov.lending': TrendingUp, 'gov.kpi': BookOpen, 'gov.institutions': Building2,
  'gov.compliance': ClipboardCheck, 'gov.prudential': Gauge, 'gov.cases': FolderKanban, 'gov.infoRequests': Send,
  'gov.ews': AlertTriangle, 'gov.overIndebtedness': Users, 'gov.disputes': Scale, 'gov.complaints': MessageSquareWarning,
  'gov.census': Map, 'gov.altData': SatelliteDish, 'gov.aiInsights': Sparkles, 'gov.reports': FileBarChart,
  'gov.policy': SlidersHorizontal, 'gov.announcements': Megaphone, 'gov.publicationApproval': CheckSquare,
  'cms.content': FileText, 'cms.media': Image, 'cms.navigation': Menu, 'cms.notices': BellRing, 'cms.forms': ClipboardList,
  'cms.settings': Settings, 'cms.translations': Languages, 'cms.analytics': BarChart3, 'cms.services': LayoutGrid,
  'cms.notifications': Bell, 'adm.operations': Activity, 'adm.approvals': Inbox, 'adm.users': UserCog, 'adm.roles': KeyRound,
  'adm.policies': ShieldCheck, 'adm.masterData': Database, 'adm.dataQuality': DatabaseZap, 'adm.identity': Fingerprint,
  'adm.rules': Calculator, 'adm.reportRequests': FileCheck2, 'adm.helpdesk': Headphones, 'adm.billing': Receipt,
  'adm.audit': ScrollText, 'adm.system': Server, 'adm.compliance': FileSignature,
};

/** Shorter sidebar labels (the full feature label is used in the permission matrix). */
const NAV_LABELS = {
  'gov.institutions': 'Institution register',
  'gov.infoRequests': 'Information requests',
  'gov.ews': 'EWS alerts & rules',
  'gov.overIndebtedness': 'Over-indebtedness',
  'gov.disputes': 'Dispute oversight',
  'gov.reports': 'Reports',
  'gov.announcements': 'Regulatory notices',
  'cms.content': 'Pages, news & FAQ',
  'cms.navigation': 'Menus & layout',
  'cms.notices': 'Targeted notices',
  'cms.settings': 'Site settings',
  'cms.notifications': 'SMS & email templates',
  'adm.approvals': 'Approvals inbox',
  'adm.users': 'Users & access',
  'adm.masterData': 'Master data',
  'adm.dataQuality': 'Data quality',
  'adm.rules': 'Scoring & EWS rules',
  'adm.reportRequests': 'Credit report requests',
  'adm.system': 'System & jobs',
  'adm.compliance': 'Data protection (DPO)',
};

/** Paths that must only match exactly (their children are separate menu items). */
const EXACT = new Set(['/gov/admin', '/gov/admin/cms']);

/**
 * Sidebar groups for the signed-in user: every Government feature with a path that the role can read.
 * badges: { featureId: number }.
 */
export function buildGovNav(can, badges = {}) {
  return GROUP_ORDER.map((group) => {
    const items = FEATURES
      .filter((f) => f.portal === 'gov' && f.group === group && f.path && can(f.id, 'read'))
      .map((f) => ({
        to: f.path, end: EXACT.has(f.path), label: NAV_LABELS[f.id] ?? f.label, icon: FEATURE_ICONS[f.id], feature: f.id,
        badge: badges[f.id] || undefined,
      }));
    // The ad-hoc report builder sits with reports for roles that can create them.
    if (group === 'Data & analytics' && can('gov.reports', 'create')) {
      const at = items.findIndex((i) => i.feature === 'gov.reports');
      items.splice(at + 1, 0, { to: '/gov/analytics', label: 'Ad-hoc builder', icon: BarChart3, feature: 'gov.reports' });
    }
    return { label: group, items };
  }).filter((g) => g.items.length);
}

/** Usual home page per role; used when the role can still read it. */
const ROLE_HOME = {
  gov_exec: 'gov.dashboard', gov_supervisor: 'gov.dashboard', gov_supervisor_regional: 'gov.dashboard', gov_analyst: 'gov.dashboard',
  gov_cpo: 'gov.disputes', gov_licensing: 'gov.institutions',
  adm_super: 'adm.operations', adm_security: 'adm.users', adm_editor: 'cms.content', adm_publisher: 'cms.content',
  adm_steward: 'adm.dataQuality', adm_helpdesk: 'adm.reportRequests', adm_billing: 'adm.billing', adm_auditor: 'adm.audit',
  adm_dpo: 'adm.compliance',
};

const LANDING_ORDER = ['gov.dashboard', 'adm.operations', 'cms.content', 'gov.institutions', 'gov.disputes', 'adm.reportRequests'];

/** Feature a role lands on after sign-in: its usual home if readable, else the first readable feature. */
export function landingFeatureFor(role, can) {
  const preferred = role?.home ?? ROLE_HOME[role?.id];
  if (preferred && featureById(preferred)?.path && can(preferred, 'read')) return preferred;
  const order = [...LANDING_ORDER, ...FEATURES.filter((f) => f.portal === 'gov').map((f) => f.id)];
  return order.map(featureById).find((f) => f?.path && can(f.id, 'read'))?.id ?? null;
}

/** Path a role lands on after sign-in. */
export function landingFor(role, can) {
  const id = landingFeatureFor(role, can);
  return id ? featureById(id).path : null;
}
