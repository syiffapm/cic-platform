import { Navigate, useLocation } from 'react-router-dom';
import { useSession } from '@/context/AuthContext';
import { loginPathFor } from '@/config/access';

export default function RequireAuth({ portal, children }) {
  const user = useSession(portal);
  const location = useLocation();
  if (!user) return <Navigate to={loginPathFor(portal)} replace state={{ from: location.pathname }} />;
  return children;
}
