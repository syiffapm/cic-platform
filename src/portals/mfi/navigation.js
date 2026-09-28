import {
  BellRing, ClipboardList, FileStack, KeyRound, LayoutDashboard, Megaphone, MessageSquareWarning,
  Receipt, ScrollText, Signal, Table2, Users,
} from 'lucide-react';

/**
 * Route → feature map. The sidebar and the route guard both read the live permission matrix
 * (CIC / Central Bank role templates), so nothing here names a role.
 */
export const ROUTE_FEATURES = {
  '': 'mfi.dashboard',
  'credit/applications': 'mfi.applications',
  'applications/:id': 'mfi.applications',
  'credit/inquiry': 'mfi.inquiry',
  'credit/batch': 'mfi.batchInquiry',
  'credit/unlocked': 'mfi.inquiry',
  submissions: 'mfi.submissions',
  'submissions/calendar': 'mfi.calendar',
  'submissions/:batchId': 'mfi.submissions',
  disputes: 'mfi.disputes',
  'disputes/:disputeId': 'mfi.disputes',
  monitoring: 'mfi.monitoring',
  'institution/users': 'mfi.users',
  'institution/api-keys': 'mfi.apiKeys',
  'institution/billing': 'mfi.billing',
  'institution/audit': 'mfi.audit',
  'resources/announcements': 'mfi.announcements',
  'resources/census': 'mfi.census',
  'resources/alt-data': 'mfi.altData',
};

/** Tabs of the "Credit & lending" item. */
export const CREDIT_TABS = [
  { to: '/mfi/credit/applications', label: 'Loan applications', feature: 'mfi.applications' },
  { to: '/mfi/credit/inquiry', label: 'Credit inquiry', feature: 'mfi.inquiry' },
  { to: '/mfi/credit/batch', label: 'Batch inquiry', feature: 'mfi.batchInquiry' },
  { to: '/mfi/credit/unlocked', label: 'Unlocked reports', feature: 'mfi.inquiry' },
];

/** Tabs of the "Submissions" item. */
export const SUBMISSION_TABS = [
  { to: '/mfi/submissions', end: true, label: 'Batches', feature: 'mfi.submissions' },
  { to: '/mfi/submissions/calendar', label: 'Calendar', feature: 'mfi.calendar' },
];

const readsAny = (tabs, can) => tabs.some((t) => can(t.feature, 'read'));

/** Sidebar config; badges are passed in from live counts. */
export function buildNav({ openApplications = 0, openDisputes = 0, newAlerts = 0, unreadNotices = 0, awaitingApproval = 0 } = {}, can = () => false) {
  const groups = [
    {
      label: 'Overview',
      items: [
        { to: '/mfi', end: true, label: 'Dashboard', icon: LayoutDashboard, feature: 'mfi.dashboard' },
        { to: '/mfi/monitoring', label: 'Portfolio alerts', icon: BellRing, feature: 'mfi.monitoring', badge: newAlerts || null },
      ],
    },
    {
      label: 'Lending & inquiry',
      items: [
        { to: '/mfi/credit', label: 'Credit & lending', icon: ClipboardList, visible: readsAny(CREDIT_TABS, can), badge: openApplications || null },
      ],
    },
    {
      label: 'Data Submission',
      items: [
        { to: can('mfi.submissions', 'read') ? '/mfi/submissions' : '/mfi/submissions/calendar', label: 'Submissions', icon: FileStack, visible: readsAny(SUBMISSION_TABS, can), badge: awaitingApproval || null },
      ],
    },
    {
      label: 'Disputes',
      items: [
        { to: '/mfi/disputes', label: 'Dispute inbox', icon: MessageSquareWarning, feature: 'mfi.disputes', badge: openDisputes || null },
      ],
    },
    {
      label: 'Institution',
      items: [
        { to: '/mfi/institution/users', label: 'Users & roles', icon: Users, feature: 'mfi.users' },
        { to: '/mfi/institution/api-keys', label: 'API keys & webhooks', icon: KeyRound, feature: 'mfi.apiKeys' },
        { to: '/mfi/institution/billing', label: 'Usage & billing', icon: Receipt, feature: 'mfi.billing' },
        { to: '/mfi/institution/audit', label: 'Audit trail', icon: ScrollText, feature: 'mfi.audit' },
      ],
    },
    {
      label: 'Resources',
      items: [
        { to: '/mfi/resources/announcements', label: 'Announcements', icon: Megaphone, feature: 'mfi.announcements', badge: unreadNotices || null },
        { to: '/mfi/resources/census', label: 'Census data', icon: Table2, feature: 'mfi.census' },
        { to: '/mfi/resources/alt-data', label: 'Alternative data', icon: Signal, feature: 'mfi.altData' },
      ],
    },
  ];
  return groups
    .map((g) => ({ ...g, items: g.items.filter((i) => i.visible ?? can(i.feature, 'read')) }))
    .filter((g) => g.items.length);
}
