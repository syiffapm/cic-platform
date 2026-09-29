import { lazy, Suspense, useEffect } from 'react';
import { Navigate, Route, Routes, useLocation, useParams } from 'react-router-dom';
import StaffLoginPage from './pages/StaffLoginPage';
import StaffHome from './pages/StaffHome';
import NotFound from './pages/NotFound';

// Government Portal app: supervision (/gov) plus CMS & platform administration (/gov/admin).
const RegulatorRoutes = lazy(() => import('./portals/regulator/routes'));
const AdminRoutes = lazy(() => import('./portals/admin/routes'));

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return null;
}

function Loading() {
  return (
    <div className="flex min-h-screen items-center justify-center" role="status" aria-live="polite">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary-200 border-t-primary" />
      <span className="sr-only">Loading…</span>
    </div>
  );
}

/** Former separate portals now live inside the Government Portal. */
function MovedTo({ base }) {
  const { '*': rest = '' } = useParams();
  const { search } = useLocation();
  return <Navigate to={`${base}${rest ? `/${rest}` : ''}${search}`} replace />;
}

export default function App() {
  return (
    <>
      <ScrollToTop />
      <Suspense fallback={<Loading />}>
        <Routes>
          <Route path="/" element={<Navigate to="/workspace" replace />} />
          <Route path="/login/*" element={<Navigate to="/workspace/login" replace />} />
          <Route path="/workspace" element={<StaffHome />} />
          <Route path="/workspace/login" element={<StaffLoginPage />} />
          <Route path="/gov/admin/*" element={<AdminRoutes />} />
          <Route path="/gov/*" element={<RegulatorRoutes />} />
          <Route path="/regulator/*" element={<MovedTo base="/gov" />} />
          <Route path="/admin/*" element={<MovedTo base="/gov/admin" />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </>
  );
}
