import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { CASES } from '../data/cases';
import { EWS_ALERTS, EWS_RULES } from '../data/ews';
import { INFO_REQUESTS, STAT_RELEASES } from '../data/supervision';

/**
 * Portal-private state for the Regulator portal (cases, alerts, rules, information requests,
 * statistics releases). Cross-portal records (institutions, approvals, disputes, grievances,
 * announcements, audit log) stay in the shared StoreContext.
 */
const KEY = 'cic.regulator.v1';
const initial = () => ({ cases: CASES, alerts: EWS_ALERTS, rules: EWS_RULES, infoRequests: INFO_REQUESTS, statReleases: STAT_RELEASES });

const Ctx = createContext(null);

export function RegulatorStoreProvider({ children }) {
  const [state, setState] = useState(() => {
    try {
      const saved = localStorage.getItem(KEY);
      return saved ? { ...initial(), ...JSON.parse(saved) } : initial();
    } catch {
      return initial();
    }
  });

  useEffect(() => {
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch { /* storage unavailable */ }
  }, [state]);

  const add = useCallback((col, item) => setState((s) => ({ ...s, [col]: [item, ...s[col]] })), []);
  const patch = useCallback((col, id, changes) => setState((s) => ({
    ...s,
    [col]: s[col].map((x) => (x.id === id ? { ...x, ...(typeof changes === 'function' ? changes(x) : changes) } : x)),
  })), []);

  const value = useMemo(() => ({ ...state, add, patch }), [state, add, patch]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export const useRegulator = () => useContext(Ctx);
