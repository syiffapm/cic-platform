import { lazy, Suspense, useEffect } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import LoginPage from './pages/LoginPage';

// Landing page app: public website + citizen (Borrower) self-service. Each is its own lazily-loaded bundle.
const PublicRoutes = lazy(() => import('./portals/public/routes'));
const BorrowerRoutes = lazy(() => import('./portals/borrower/routes'));

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
          <Route path="/portals" element={<Navigate to="/" replace />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/login/:portal" element={<Navigate to="/login" replace />} />
          <Route path="/borrower/*" element={<BorrowerRoutes />} />
          <Route path="/*" element={<PublicRoutes />} />
        </Routes>
      </Suspense>
    </>
  );
}
