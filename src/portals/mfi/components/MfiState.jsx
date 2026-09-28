import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { usePermissions } from '@/lib/rbac';
import { INSTITUTIONS } from '@/data/institutions';
import { BATCHES } from '../data/batches';
import { ALERTS } from '../data/monitoring';
import { API_CLIENTS, WEBHOOKS, initialUsers } from '../data/institution';
import { CENSUS_VERSIONS } from '../data/census';
import { BILLING_PLANS } from '../data/billingPlans';

/**
 * Portal-private state for the MFI portal (batches, alerts, users, keys, census, read receipts, billing plan and wallet).
 * Persisted to localStorage so a maker → checker hand-over survives switching accounts.
 */
const KEY = 'cic.mfi.v2';
const initial = () => ({
  batches: BATCHES, alerts: ALERTS, users: initialUsers(), apiClients: API_CLIENTS, webhooks: WEBHOOKS, census: CENSUS_VERSIONS, reads: {}, billingPlans: BILLING_PLANS,
});

const MfiContext = createContext(null);

export function MfiStateProvider({ children }) {
  const [state, setState] = useState(() => {
    try {
      const saved = localStorage.getItem(KEY);
      return saved ? { ...initial(), ...JSON.parse(saved) } : initial();
    } catch { return initial(); }
  });
  useEffect(() => {
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch { /* storage unavailable */ }
  }, [state]);

  /** update('batches', (list) => next) */
  const update = useCallback((key, fn) => setState((s) => ({ ...s, [key]: fn(s[key]) })), []);
  const value = useMemo(() => ({ ...state, update }), [state, update]);
  return <MfiContext.Provider value={value}>{children}</MfiContext.Provider>;
}

export const useMfi = () => useContext(MfiContext);

/**
 * Session-derived tenant context. The tenant always comes from the session token, never from the URL.
 * `can(featureId, action)` reads the live CIC / Central Bank permission matrix for the user's role.
 */
export function useTenant() {
  const { user, role, can } = usePermissions('mfi');
  const tenant = user?.tenant;
  const institution = INSTITUTIONS.find((i) => i.id === tenant);
  return { user, role, tenant, institution, can };
}

/** Replaces one item in a list by id. */
export const patchIn = (id, changes) => (list) => list.map((x) => (x.id === id ? { ...x, ...(typeof changes === 'function' ? changes(x) : changes) } : x));

export const nowStamp = () => {
  const d = new Date();
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
};
