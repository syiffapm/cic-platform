import { Route, Routes } from 'react-router-dom';
import NotFound from '@/pages/NotFound';
import PublicLayout from './components/PublicLayout';
import HomePage from './pages/Home/HomePage';
import ServicesPage from './pages/Services/ServicesPage';
import ServiceDetailPage from './pages/Services/ServiceDetailPage';
import DirectoryPage from './pages/Directory/DirectoryPage';
import MfiProfilePage from './pages/Directory/MfiProfilePage';
import AnnouncementsPage from './pages/Announcements/AnnouncementsPage';
import AnnouncementDetailPage from './pages/Announcements/AnnouncementDetailPage';
import PublicationsPage from './pages/Publications/PublicationsPage';
import StatisticsPage from './pages/Statistics/StatisticsPage';
import VerifyPage from './pages/Verify/VerifyPage';
import HelpPage from './pages/Help/HelpPage';
import GrievancePage from './pages/Help/GrievancePage';
import SearchPage from './pages/Search/SearchPage';
import LegalPage from './pages/Legal/LegalPage';
import MyCreditPage from './pages/Guides/MyCreditPage';
import HowItWorksPage from './pages/Guides/HowItWorksPage';

/** Public website. Mounted at /* in App.jsx; no login, no personal data. */
export default function PublicRoutes() {
  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route index element={<HomePage />} />
        <Route path="services" element={<ServicesPage />} />
        <Route path="services/:slug" element={<ServiceDetailPage />} />
        <Route path="mfi-directory" element={<DirectoryPage />} />
        <Route path="mfi-directory/:id" element={<MfiProfilePage />} />
        <Route path="announcements" element={<AnnouncementsPage />} />
        <Route path="announcements/:id" element={<AnnouncementDetailPage />} />
        <Route path="publications" element={<PublicationsPage />} />
        <Route path="statistics" element={<StatisticsPage />} />
        <Route path="verify" element={<VerifyPage />} />
        <Route path="my-credit" element={<MyCreditPage />} />
        <Route path="how-it-works" element={<HowItWorksPage />} />
        <Route path="help" element={<HelpPage />} />
        <Route path="help/grievance" element={<GrievancePage />} />
        <Route path="search" element={<SearchPage />} />
        <Route path="privacy" element={<LegalPage doc="privacy" />} />
        <Route path="terms" element={<LegalPage doc="terms" />} />
        <Route path="accessibility" element={<LegalPage doc="accessibility" />} />
        <Route path="cookies" element={<LegalPage doc="cookies" />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
