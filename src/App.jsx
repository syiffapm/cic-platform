import { lazy, Suspense, useEffect } from 'react';
import { Navigate, Route, Routes, useLocation, useParams } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import StaffLoginPage from './pages/StaffLoginPage';
import StaffHome from './pages/StaffHome';
import HostGuard from './components/layout/HostGuard';
import { loginPathFor } from './config/access';

// Each portal is its own lazily-loaded bundle with its own routes file.
const PublicRoutes = lazy(() => import('./portals/public/routes'));
const BorrowerRoutes = lazy(() => import('./portals/borrower/routes'));
const MfiRoutes = lazy(() => import('./portals/mfi/routes'));
const RegulatorRoutes = lazy(() => import('./portals/regulator/routes'));
const AdminRoutes = lazy(() => import('./portals/admin/routes'));

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return null;
}

/** Old per-portal login links (/login/mfi …) → the right entry point for that audience. */
function LegacyLogin() {
  const { portal } = useParams();
  const { state } = useLocation();
  return <Navigate to={loginPathFor(portal)} replace state={state} />;
}

/** Former separate portals now live inside the Government Portal. */
function MovedTo({ base }) {
  const { '*': rest = '' } = useParams();
  const { search } = useLocation();
  return <Navigate to={`${base}${rest ? `/${rest}` : ''}${search}`} replace />;
}

function Loading() {
  return (
    <div className="flex min-h-screen items-center justify-center" role="status" aria-live="polite">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary-200 border-t-primary" />
      <span className="sr-only">Loading…</span>
    </div>
  );
}

export default function App() {
  return (
    <>
      <ScrollToTop />
      <HostGuard />
      <Suspense fallback={<Loading />}>
        <Routes>
          <Route path="/portals" element={<Navigate to="/" replace />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/login/:portal" element={<LegacyLogin />} />
          <Route path="/workspace" element={<StaffHome />} />
          <Route path="/workspace/login" element={<StaffLoginPage />} />
          <Route path="/borrower/*" element={<BorrowerRoutes />} />
          <Route path="/mfi/*" element={<MfiRoutes />} />
          <Route path="/gov/admin/*" element={<AdminRoutes />} />
          <Route path="/gov/*" element={<RegulatorRoutes />} />
          <Route path="/regulator/*" element={<MovedTo base="/gov" />} />
          <Route path="/admin/*" element={<MovedTo base="/gov/admin" />} />
          <Route path="/*" element={<PublicRoutes />} />
        </Routes>
      </Suspense>
    </>
  );
}
