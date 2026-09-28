import { Navigate, Route, Routes } from 'react-router-dom';
import RequireAuth from '@/components/layout/RequireAuth';
import { usePermissions } from '@/lib/rbac';
import NotFound from '@/pages/NotFound';
import GovShell from '@/portals/government/GovShell';
import FeatureGuard from '@/portals/government/components/FeatureGuard';
import RoleHome from '@/portals/government/RoleHome';
import RolesPage from '@/portals/government/access/RolesPage';
import RoleDetail from '@/portals/government/access/RoleDetail';
import { AdminStoreProvider } from './context/AdminStore';
import Dashboard from './pages/Dashboard/Dashboard';
import ApprovalsInbox from './pages/Approvals/ApprovalsInbox';
import ContentList from './pages/Cms/ContentList';
import ContentEditor from './pages/Cms/ContentEditor';
import MediaLibrary from './pages/Cms/MediaLibrary';
import NavigationBuilder from './pages/Cms/NavigationBuilder';
import TargetedNotices from './pages/Cms/TargetedNotices';
import FormsBuilder from './pages/Cms/FormsBuilder';
import GlobalSettings from './pages/Cms/GlobalSettings';
import Translations from './pages/Cms/Translations';
import ContentAnalytics from './pages/Cms/ContentAnalytics';
import ServiceCatalogue from './pages/Services/ServiceCatalogue';
import NotificationTemplates from './pages/Notifications/NotificationTemplates';
import IamUsers from './pages/Iam/Users';
import Policies from './pages/Iam/Policies';
import MasterData from './pages/MasterData/MasterData';
import DataQuality from './pages/DataQuality/DataQuality';
import IdentityResolution from './pages/IdentityResolution/IdentityResolution';
import Rules from './pages/Rules/Rules';
import Helpdesk from './pages/Helpdesk/Helpdesk';
import Billing from './pages/Billing/Billing';
import ReportRequests from './pages/ReportRequests/ReportRequests';
import ReportRequestDetail from './pages/ReportRequests/ReportRequestDetail';
import Audit from './pages/Audit/Audit';
import System from './pages/System/System';
import Compliance from './pages/Compliance/Compliance';

const g = (feature, el) => <FeatureGuard feature={feature}>{el}</FeatureGuard>;

/** Operations dashboard for roles that can read it; everyone else goes to their own home page. */
function AdminHome() {
  const { can } = usePermissions('gov');
  return can('adm.operations', 'read') ? g('adm.operations', <Dashboard />) : <RoleHome />;
}

export default function AdminRoutes() {
  return (
    <AdminStoreProvider>
      <Routes>
        <Route element={<RequireAuth portal="gov"><GovShell /></RequireAuth>}>
          <Route index element={<AdminHome />} />
          <Route path="approvals" element={g('adm.approvals', <ApprovalsInbox />)} />
          <Route path="cms" element={g('cms.content', <ContentList />)} />
          <Route path="cms/new" element={g('cms.content', <ContentEditor />)} />
          <Route path="cms/edit/:id" element={g('cms.content', <ContentEditor />)} />
          <Route path="cms/media" element={g('cms.media', <MediaLibrary />)} />
          <Route path="cms/navigation" element={g('cms.navigation', <NavigationBuilder />)} />
          <Route path="cms/notices" element={g('cms.notices', <TargetedNotices />)} />
          <Route path="cms/forms" element={g('cms.forms', <FormsBuilder />)} />
          <Route path="cms/settings" element={g('cms.settings', <GlobalSettings />)} />
          <Route path="cms/translations" element={g('cms.translations', <Translations />)} />
          <Route path="cms/analytics" element={g('cms.analytics', <ContentAnalytics />)} />
          <Route path="services" element={g('cms.services', <ServiceCatalogue />)} />
          <Route path="notifications" element={g('cms.notifications', <NotificationTemplates />)} />
          <Route path="iam/users" element={g('adm.users', <IamUsers />)} />
          <Route path="iam/roles" element={<Navigate to="/gov/admin/access/roles" replace />} />
          <Route path="access/roles" element={g('adm.roles', <RolesPage />)} />
          <Route path="access/roles/:id" element={g('adm.roles', <RoleDetail />)} />
          <Route path="iam/policies" element={g('adm.policies', <Policies />)} />
          <Route path="master-data" element={g('adm.masterData', <MasterData />)} />
          <Route path="data-quality" element={g('adm.dataQuality', <DataQuality />)} />
          <Route path="identity" element={g('adm.identity', <IdentityResolution />)} />
          <Route path="rules" element={g('adm.rules', <Rules />)} />
          <Route path="helpdesk" element={g('adm.helpdesk', <Helpdesk />)} />
          <Route path="report-requests" element={g('adm.reportRequests', <ReportRequests />)} />
          <Route path="report-requests/:id" element={g('adm.reportRequests', <ReportRequestDetail />)} />
          <Route path="billing" element={g('adm.billing', <Billing />)} />
          <Route path="audit" element={g('adm.audit', <Audit />)} />
          <Route path="system" element={g('adm.system', <System />)} />
          <Route path="compliance" element={g('adm.compliance', <Compliance />)} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </AdminStoreProvider>
  );
}
