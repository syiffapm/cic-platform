import { Bell, ClipboardList, Eye, FileCheck2, FileSearch, FileText, Gavel, HandCoins, Home, PlusCircle, UserCircle } from 'lucide-react';

/** Borrower Self-Service sidebar (labels mirror i18n keys borrower.nav.*). */
export const borrowerNav = (t, { openDisputes = 0, unreadAlerts = 0, openApplications = 0, reportRequests = 0 } = {}) => [
  {
    label: 'My credit file',
    items: [
      { to: '/borrower', end: true, label: t('borrower.nav.home'), icon: Home },
      { to: '/borrower/report', end: true, label: t('borrower.nav.report'), icon: FileText },
      { to: '/borrower/requests', label: 'My report requests', icon: FileSearch, badge: reportRequests || null },
      { to: '/borrower/who-viewed', label: t('borrower.nav.viewed'), icon: Eye },
      { to: '/borrower/consents', label: t('borrower.nav.consents'), icon: FileCheck2 },
    ],
  },
  {
    label: 'Loans',
    items: [
      { to: '/borrower/loans', end: true, label: 'My loans & applications', icon: HandCoins, badge: openApplications || null },
      { to: '/borrower/loans/apply', label: 'Apply for a loan', icon: PlusCircle },
    ],
  },
  {
    label: 'Help & rights',
    items: [
      { to: '/borrower/disputes', label: t('borrower.nav.disputes'), icon: Gavel, badge: openDisputes || null },
      { to: '/borrower/data-requests', label: t('borrower.nav.requests'), icon: ClipboardList },
      { to: '/borrower/alerts', label: t('borrower.nav.alerts'), icon: Bell, badge: unreadAlerts || null },
      { to: '/borrower/profile', label: t('borrower.nav.profile'), icon: UserCircle },
    ],
  },
];
