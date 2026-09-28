import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { DEMO_USERS, ROLES } from '@/data/roles';

/**
 * Demo authentication. One session per portal so a presenter can be signed in to
 * MFI and Regulator at the same time in different tabs. Real build: C1 IAM with SSO + MFA.
 */
const STORAGE_KEY = 'cic.sessions.v1';
const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [sessions, setSessions] = useState(() => {
    try { return JSON.parse(sessionStorage.getItem(STORAGE_KEY)) ?? {}; } catch { return {}; }
  });

  useEffect(() => {
    try { sessionStorage.setItem(STORAGE_KEY, JSON.stringify(sessions)); } catch { /* storage unavailable */ }
  }, [sessions]);

  const signIn = useCallback((portal, userId) => {
    const user = DEMO_USERS.find((u) => u.id === userId && u.portal === portal);
    if (!user) return null;
    const session = {
      ...user,
      roleName: ROLES.find((r) => r.id === user.role)?.name,
      sessionId: `SID-${Math.random().toString(36).slice(2, 10).toUpperCase()}`,
      ip: portal === 'admin' ? '10.10.4.2' : '103.25.12.40',
      signedInAt: new Date().toISOString(),
    };
    setSessions((s) => ({ ...s, [portal]: session }));
    return session;
  }, []);

  /** Signs in any resolved user object (citizen accounts, staff found by the role-based login). */
  const signInUser = useCallback((portal, user) => {
    const session = {
      ...user,
      portal,
      roleName: ROLES.find((r) => r.id === user.role)?.name,
      sessionId: `SID-${Math.random().toString(36).slice(2, 10).toUpperCase()}`,
      ip: portal === 'admin' ? '10.10.4.2' : '103.25.12.40',
      signedInAt: new Date().toISOString(),
    };
    // The Government Portal is one workspace: supervision and administration share one session.
    setSessions((s) => (portal === 'gov' ? { ...s, gov: session, regulator: session, admin: session } : { ...s, [portal]: session }));
    return session;
  }, []);

  const signOut = useCallback((portal) => setSessions((s) => {
    const next = { ...s };
    (['gov', 'regulator', 'admin'].includes(portal) ? ['gov', 'regulator', 'admin'] : [portal]).forEach((k) => delete next[k]);
    return next;
  }), []);

  const value = useMemo(() => ({ sessions, signIn, signInUser, signOut }), [sessions, signIn, signInUser, signOut]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);

/** Current user of a portal: const user = useSession('mfi'); */
export const useSession = (portal) => useContext(AuthContext).sessions[portal] ?? null;

/** Role check helper for UI gating. Server-side enforcement is SEC-02; this only hides controls. */
export function useCan(portal) {
  const user = useSession(portal);
  return useCallback((...roles) => !!user && roles.includes(user.role), [user]);
}
