import { useMemo } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import PortalLayout from '@/components/layout/PortalLayout';
import RequireAuth from '@/components/layout/RequireAuth';
import { useStore } from '@/context/StoreContext';
import NotFound from '@/pages/NotFound';
import { buildNav, CREDIT_TABS, ROUTE_FEATURES, SUBMISSION_TABS } from './navigation';
import { MfiStateProvider, useMfi, useTenant } from './components/MfiState';
import { AccessChip, FeatureGate, useAccess } from './components/access';
import { FirstTab, SectionLayout } from './components/SectionTabs';
import { slaDaysLeft } from '@/lib/format';
import Dashboard from './pages/Dashboard/Dashboard';
import InquiryPage from './pages/Inquiry/InquiryPage';
import BatchInquiry from './pages/Inquiry/BatchInquiry';
import UnlockedReports from './pages/Inquiry/UnlockedReports';
import Checkout from './pages/Checkout/Checkout';
import ApplicationInbox from './pages/Applications/ApplicationInbox';
import ApplicationDetail from './pages/Applications/ApplicationDetail';
import SubmissionList from './pages/Submissions/SubmissionList';
import BatchDetail from './pages/Submissions/BatchDetail';
import Calendar from './pages/Submissions/Calendar';
import DisputeInbox from './pages/Disputes/DisputeInbox';
import DisputeDetail from './pages/Disputes/DisputeDetail';
import PortfolioAlerts from './pages/Monitoring/PortfolioAlerts';
import Users from './pages/Institution/Users';
import ApiKeys from './pages/Institution/ApiKeys';
import Billing from './pages/Institution/Billing';
import Audit from './pages/Institution/Audit';
import Census from './pages/Resources/Census';
import AltData from './pages/Resources/AltData';
import Announcements from './pages/Resources/Announcements';

const OPEN_DISPUTE = ['Awaiting MFI', 'Investigating', 'Open'];

function MfiShell() {
  const { user, tenant, institution } = useTenant();
  const { batches, alerts, reads } = useMfi();
  const { disputes, loanApplications, announcementsFor } = useStore();
  const { can } = useAccess();

  const counts = useMemo(() => {
    const own = disputes.filter((d) => d.mfiId === tenant && OPEN_DISPUTE.includes(d.status));
    const notices = announcementsFor('mfi');
    const apps = loanApplications.filter((a) => a.mfiId === tenant && ['Submitted', 'Credit check'].includes(a.status));
    return {
      openApplications: apps.length,
      newApplications: apps.filter((a) => a.status === 'Submitted'),
      openDisputes: own.length,
      dueSoon: own.filter((d) => slaDaysLeft(d.mfiDueAt) <= 2),
      newAlerts: alerts.filter((a) => a.tenant === tenant && a.status === 'New').length,
      awaitingApproval: batches.filter((b) => b.tenant === tenant && b.status === 'Awaiting approval').length,
      unread: notices.filter((n) => !reads[`${user?.id}:${n.id}`]),
    };
  }, [disputes, loanApplications, tenant, alerts, batches, announcementsFor, reads, user?.id]);

  const navGroups = buildNav({ ...counts, unreadNotices: counts.unread.length }, can);
  const readable = (id) => can(id, 'read');
  const notifications = [
    ...(readable('mfi.applications') ? counts.newApplications : []).map((a) => ({ title: `New loan application ${a.id} — ${a.applicant.name}`, time: `Received ${a.submittedAt}` })),
    ...(readable('mfi.disputes') ? counts.dueSoon : []).map((d) => ({ title: `Dispute ${d.id} — MFI response due ${d.mfiDueAt}`, time: `SLA ${slaDaysLeft(d.mfiDueAt)} day(s)` })),
    ...(counts.awaitingApproval && readable('mfi.submissions') ? [{ title: `${counts.awaitingApproval} batch(es) awaiting checker approval`, time: 'Data submission' }] : []),
    ...(readable('mfi.announcements') ? counts.unread : []).filter((n) => n.mandatory).map((n) => ({ title: `Mandatory notice: ${n.title.en}`, time: `Published ${n.publishedAt}` })),
    ...(counts.newAlerts && readable('mfi.monitoring') ? [{ title: `${counts.newAlerts} new portfolio alert(s)`, time: 'Nightly monitoring run 02:10' }] : []),
  ];

  return (
    <PortalLayout
      portal="mfi"
      title="MFI Member Portal"
      tenantLabel={`${institution?.name ?? ''} · ${tenant ?? ''}`}
      navGroups={navGroups}
      notifications={notifications}
      headerExtra={<AccessChip />}
    />
  );
}

/** Old URLs (bookmarks, notifications, CIC links) land on the matching tab; query strings are kept. */
function Moved({ to }) {
  const { search } = useLocation();
  return <Navigate to={`${to}${search}`} replace />;
}

/** Credit & lending tabs, with the open-applications count on the first tab. */
function CreditSection() {
  const { tenant } = useTenant();
  const { loanApplications } = useStore();
  const open = loanApplications.filter((a) => a.mfiId === tenant && ['Submitted', 'Credit check'].includes(a.status)).length;
  return <SectionLayout label="Credit & lending" tabs={CREDIT_TABS.map((t, i) => (i === 0 ? { ...t, badge: open || null } : t))} />;
}

/** Every route is guarded by the feature it belongs to (see ROUTE_FEATURES). */
const gate = (path, el) => <FeatureGate feature={ROUTE_FEATURES[path]}>{el}</FeatureGate>;

export default function MfiRoutes() {
  return (
    <MfiStateProvider>
      <Routes>
        <Route element={<RequireAuth portal="mfi"><MfiShell /></RequireAuth>}>
          <Route index element={gate('', <Dashboard />)} />
          <Route path="credit" element={<CreditSection />}>
            <Route index element={<FirstTab tabs={CREDIT_TABS} />} />
            <Route path="applications" element={gate('credit/applications', <ApplicationInbox />)} />
            <Route path="inquiry" element={gate('credit/inquiry', <InquiryPage />)} />
            <Route path="batch" element={gate('credit/batch', <BatchInquiry />)} />
            <Route path="unlocked" element={gate('credit/unlocked', <UnlockedReports />)} />
          </Route>
          <Route path="applications" element={<Moved to="/mfi/credit/applications" />} />
          <Route path="applications/:id" element={gate('applications/:id', <ApplicationDetail />)} />
          <Route path="inquiry" element={<Moved to="/mfi/credit/inquiry" />} />
          <Route path="inquiry/batch" element={<Moved to="/mfi/credit/batch" />} />
          <Route path="inquiry/unlocked" element={<Moved to="/mfi/credit/unlocked" />} />
          <Route path="checkout" element={<Checkout />} />
          <Route path="submissions" element={<SectionLayout label="Submissions" tabs={SUBMISSION_TABS} />}>
            <Route index element={gate('submissions', <SubmissionList />)} />
            <Route path="calendar" element={gate('submissions/calendar', <Calendar />)} />
          </Route>
          <Route path="submissions/:batchId" element={gate('submissions/:batchId', <BatchDetail />)} />
          <Route path="disputes" element={gate('disputes', <DisputeInbox />)} />
          <Route path="disputes/:disputeId" element={gate('disputes/:disputeId', <DisputeDetail />)} />
          <Route path="monitoring" element={gate('monitoring', <PortfolioAlerts />)} />
          <Route path="institution/users" element={gate('institution/users', <Users />)} />
          <Route path="institution/api-keys" element={gate('institution/api-keys', <ApiKeys />)} />
          <Route path="institution/billing" element={gate('institution/billing', <Billing />)} />
          <Route path="institution/audit" element={gate('institution/audit', <Audit />)} />
          <Route path="resources/announcements" element={gate('resources/announcements', <Announcements />)} />
          <Route path="resources/census" element={gate('resources/census', <Census />)} />
          <Route path="resources/alt-data" element={gate('resources/alt-data', <AltData />)} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </MfiStateProvider>
  );
}
