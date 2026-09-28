import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { isStaffPath, PUBLIC_ORIGIN, STAFF_ORIGIN } from '@/config/access';

/** Keeps staff paths on the staff host and public paths on the public host when both are configured. */
export default function HostGuard() {
  const { pathname, search } = useLocation();
  useEffect(() => {
    if (!STAFF_ORIGIN || !PUBLIC_ORIGIN) return;
    const here = window.location.origin;
    if (isStaffPath(pathname) && here !== STAFF_ORIGIN) window.location.replace(STAFF_ORIGIN + pathname + search);
    else if (!isStaffPath(pathname) && here === STAFF_ORIGIN) window.location.replace(pathname === '/' ? `${STAFF_ORIGIN}/workspace` : PUBLIC_ORIGIN + pathname + search);
  }, [pathname, search]);
  return null;
}
