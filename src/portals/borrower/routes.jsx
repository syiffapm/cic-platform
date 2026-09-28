import { Route, Routes } from 'react-router-dom';
import PortalLayout from '@/components/layout/PortalLayout';
import RequireAuth from '@/components/layout/RequireAuth';
import NotFound from '@/pages/NotFound';
import { useI18n } from '@/i18n/I18nContext';
import { borrowerNav } from './navigation';
import { isOpenDispute, useOwnApplications, useOwnDisputes } from './lib/borrower';
import ReportPrintView from './components/ReportPrintView';
import RegisterPage from './pages/Register/RegisterPage';
import DashboardPage from './pages/Dashboard/DashboardPage';
import CreditReportPage from './pages/CreditReport/CreditReportPage';
import WhoViewedPage from './pages/WhoViewed/WhoViewedPage';
import ConsentsPage from './pages/Consents/ConsentsPage';
import DisputesPage from './pages/Disputes/DisputesPage';
import NewDispute from './pages/Disputes/NewDispute';
import DisputeDetail from './pages/Disputes/DisputeDetail';
import DataRequestsPage from './pages/DataRequests/DataRequestsPage';
import AlertsPage from './pages/Alerts/AlertsPage';
import ProfilePage from './pages/Profile/ProfilePage';
import LoansPage from './pages/Loans/LoansPage';
import ApplyLoanPage from './pages/Loans/ApplyLoanPage';
import LoanApplicationPage from './pages/Loans/LoanApplicationPage';
import RequestsPage from './pages/Requests/RequestsPage';
import NewRequest from './pages/Requests/NewRequest';
import RequestDetail from './pages/Requests/RequestDetail';
import { useAllAlerts, useReportRequests } from './lib/reports';

function BorrowerShell() {
  const { t } = useI18n();
  const disputes = useOwnDisputes();
  const [alerts] = useAllAlerts();
  const unread = alerts.filter((a) => !a.read);
  const apps = useOwnApplications();
  const { open, unseenReady } = useReportRequests();
  const navGroups = borrowerNav(t, { openDisputes: disputes.filter(isOpenDispute).length, unreadAlerts: unread.length, openApplications: apps.filter((a) => ['Submitted', 'Credit check', 'Approved'].includes(a.status)).length, reportRequests: (open ? 1 : 0) + unseenReady.length });
  const notifications = unread.map((a) => ({ title: a.title, time: a.at }));
  return <PortalLayout portal="borrower" title="Borrower Self-Service" navGroups={navGroups} notifications={notifications} />;
}

/** Borrower Self-Service. Mounted at /borrower/*. */
export default function BorrowerRoutes() {
  return (
    <Routes>
      <Route path="register" element={<RegisterPage />} />
      <Route path="report/print" element={<RequireAuth portal="borrower"><ReportPrintView /></RequireAuth>} />
      <Route element={<RequireAuth portal="borrower"><BorrowerShell /></RequireAuth>}>
        <Route index element={<DashboardPage />} />
        <Route path="report" element={<CreditReportPage />} />
        <Route path="requests" element={<RequestsPage />} />
        <Route path="requests/new" element={<NewRequest />} />
        <Route path="requests/:id" element={<RequestDetail />} />
        <Route path="loans" element={<LoansPage />} />
        <Route path="loans/apply" element={<ApplyLoanPage />} />
        <Route path="loans/:id" element={<LoanApplicationPage />} />
        <Route path="who-viewed" element={<WhoViewedPage />} />
        <Route path="consents" element={<ConsentsPage />} />
        <Route path="disputes" element={<DisputesPage />} />
        <Route path="disputes/new" element={<NewDispute />} />
        <Route path="disputes/:id" element={<DisputeDetail />} />
        <Route path="data-requests" element={<DataRequestsPage />} />
        <Route path="alerts" element={<AlertsPage />} />
        <Route path="profile" element={<ProfilePage />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
