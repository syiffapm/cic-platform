import { Route, Routes } from 'react-router-dom';
import RequireAuth from '@/components/layout/RequireAuth';
import NotFound from '@/pages/NotFound';
import GovShell from '@/portals/government/GovShell';
import FeatureGuard from '@/portals/government/components/FeatureGuard';
import RoleHome from '@/portals/government/RoleHome';
import { RegulatorStoreProvider } from './lib/RegulatorStore';
import LendingActivity from './pages/Overview/LendingActivity';
import ExecutiveDashboard from './pages/Overview/ExecutiveDashboard';
import KpiDictionary from './pages/Overview/KpiDictionary';
import InstitutionRegister from './pages/MfiManagement/InstitutionRegister';
import InstitutionDetail from './pages/MfiManagement/InstitutionDetail';
import ReportingCompliance from './pages/MfiManagement/ReportingCompliance';
import PrudentialMetrics from './pages/Supervision/PrudentialMetrics';
import Cases from './pages/Supervision/Cases';
import CaseDetail from './pages/Supervision/CaseDetail';
import InfoRequests from './pages/Supervision/InfoRequests';
import EwsAlerts from './pages/RiskIntelligence/EwsAlerts';
import OverIndebtedness from './pages/RiskIntelligence/OverIndebtedness';
import DisputeOversight from './pages/ConsumerProtection/DisputeOversight';
import Complaints from './pages/ConsumerProtection/Complaints';
import AltDataHub from './pages/Data/AltDataHub';
import Census from './pages/Data/Census';
import Announcements from './pages/Publishing/Announcements';
import PublicationApproval from './pages/Publishing/PublicationApproval';
import Reports from './pages/Publishing/Reports';
import AdhocBuilder from './pages/Publishing/AdhocBuilder';
import PolicySimulation from './pages/Publishing/PolicySimulation';
import AiInsights from './pages/AiInsights/AiInsights';

const g = (feature, el) => <FeatureGuard feature={feature}>{el}</FeatureGuard>;

export default function RegulatorRoutes() {
  return (
    <RequireAuth portal="gov">
      <RegulatorStoreProvider>
        <Routes>
          <Route element={<GovShell />}>
            <Route index element={<RoleHome />} />
            <Route path="dashboard" element={g('gov.dashboard', <ExecutiveDashboard />)} />
            <Route path="lending" element={g('gov.lending', <LendingActivity />)} />
            <Route path="kpi-dictionary" element={g('gov.kpi', <KpiDictionary />)} />
            <Route path="mfi" element={g('gov.institutions', <InstitutionRegister />)} />
            <Route path="mfi/:id" element={g('gov.institutions', <InstitutionDetail />)} />
            <Route path="compliance" element={g('gov.compliance', <ReportingCompliance />)} />
            <Route path="prudential" element={g('gov.prudential', <PrudentialMetrics />)} />
            <Route path="cases" element={g('gov.cases', <Cases />)} />
            <Route path="cases/:id" element={g('gov.cases', <CaseDetail />)} />
            <Route path="info-requests" element={g('gov.infoRequests', <InfoRequests />)} />
            <Route path="ews" element={g('gov.ews', <EwsAlerts />)} />
            <Route path="over-indebtedness" element={g('gov.overIndebtedness', <OverIndebtedness />)} />
            <Route path="disputes" element={g('gov.disputes', <DisputeOversight />)} />
            <Route path="complaints" element={g('gov.complaints', <Complaints />)} />
            <Route path="alt-data" element={g('gov.altData', <AltDataHub />)} />
            <Route path="census" element={g('gov.census', <Census />)} />
            <Route path="announcements" element={g('gov.announcements', <Announcements />)} />
            <Route path="publication-approval" element={g('gov.publicationApproval', <PublicationApproval />)} />
            <Route path="reports" element={g('gov.reports', <Reports />)} />
            <Route path="analytics" element={g('gov.reports', <AdhocBuilder />)} />
            <Route path="policy-simulation" element={g('gov.policy', <PolicySimulation />)} />
            <Route path="ai-insights" element={g('gov.aiInsights', <AiInsights />)} />
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </RegulatorStoreProvider>
    </RequireAuth>
  );
}
