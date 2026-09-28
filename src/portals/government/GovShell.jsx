import { useMemo } from 'react';
import PortalLayout from '@/components/layout/PortalLayout';
import { useStore } from '@/context/StoreContext';
import { OPEN_STATUSES } from '@/lib/reportRequests';
import { usePermissions } from '@/lib/rbac';
import { buildGovNav } from './navigation';
import { AccessPopover } from './components/AccessPanel';
import { useRegionScope } from './lib/access';
import { useSupervisionRecords } from './lib/workQueues';

/**
 * The single Government Portal shell (supervision, content management and platform administration).
 * The sidebar lists only the features the signed-in role can read.
 */
export default function GovShell() {
  const { can, user } = usePermissions('gov');
  const { approvals = [], announcements = [], reportRequests = [] } = useStore();
  const { alerts, statReleases } = useSupervisionRecords();

  const { filterByMfi } = useRegionScope();
  const newAlerts = filterByMfi(alerts).filter((a) => a.status === 'New').length;
  const pendingPub = announcements.filter((a) => a.status === 'In review').length + statReleases.filter((s) => s.status === 'In review').length;
  const pendingLicence = approvals.filter((a) => a.type === 'Licence status' && a.status === 'Pending').length;
  const pendingAdmin = approvals.filter((a) => a.status === 'Pending' && (String(a.checkerRole ?? '').startsWith('adm_') || String(a.module ?? '').startsWith('Admin')) && a.maker !== user?.name);
  const openReports = reportRequests.filter((r) => OPEN_STATUSES.includes(r.status)).length;

  const navGroups = useMemo(() => buildGovNav(can, {
    'gov.ews': newAlerts,
    'gov.publicationApproval': can('gov.publicationApproval', 'approve') ? pendingPub : 0,
    'gov.institutions': can('gov.institutions', 'approve') ? pendingLicence : 0,
    'adm.approvals': can('adm.approvals', 'approve') ? pendingAdmin.length : 0,
    'adm.reportRequests': openReports,
  }), [can, newAlerts, pendingPub, pendingLicence, pendingAdmin.length, openReports]);

  const notifications = [
    can('gov.ews', 'read') && newAlerts > 0 && { title: `${newAlerts} new early-warning alerts awaiting triage`, time: 'Risk & consumer protection' },
    can('gov.institutions', 'approve') && pendingLicence > 0 && { title: `${pendingLicence} licence status change(s) awaiting your approval`, time: 'Institution register' },
    can('gov.publicationApproval', 'approve') && pendingPub > 0 && { title: `${pendingPub} item(s) queued for public release`, time: 'Publication approval' },
    can('adm.reportRequests', 'update') && openReports > 0 && { title: `${openReports} citizen credit report request(s) open`, time: 'Credit report requests' },
    ...(can('adm.approvals', 'approve') ? pendingAdmin.slice(0, 4).map((a) => ({ title: `Approval needed: ${a.summary}`, time: `${a.id} · ${a.createdAt}` })) : []),
  ].filter(Boolean);

  return <PortalLayout portal="gov" title="Government Portal" navGroups={navGroups} notifications={notifications} headerExtra={<AccessPopover />} />;
}
