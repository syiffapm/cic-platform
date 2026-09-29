import { lazy, Suspense, useEffect } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import StaffLoginPage from './pages/StaffLoginPage';
import StaffHome from './pages/StaffHome';
import NotFound from './pages/NotFound';

// MFI Member Portal app: staff sign-in + the portal for licensed institutions.
const MfiRoutes = lazy(() => import('./portals/mfi/routes'));

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
          <Route path="/mfi/*" element={<MfiRoutes />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </>
  );
}
