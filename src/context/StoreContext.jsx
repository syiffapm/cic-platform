import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import * as seed from '@/data/seed';
import { INSTITUTIONS } from '@/data/institutions';
import { ROLE_TEMPLATES } from '@/data/rbac';

/**
 * In-browser stand-in for the Shared Core Services (C1–C12).
 * Holds only collections that cross portal boundaries; persisted to localStorage so a demo
 * flow (e.g. borrower files dispute → MFI responds → CIC approves) survives navigation.
 */
const STORAGE_KEY = 'cic.store.v8';

const initialState = () => ({
  announcements: seed.ANNOUNCEMENTS,
  faqs: seed.FAQS,
  publications: seed.PUBLICATIONS,
  disputes: seed.DISPUTES,
  inquiries: seed.INQUIRIES,
  approvals: seed.APPROVALS,
  grievances: seed.GRIEVANCES,
  auditLog: seed.AUDIT_LOG,
  institutions: INSTITUTIONS,
  accounts: seed.ACCOUNTS,
  loanApplications: seed.LOAN_APPLICATIONS,
  reportedLoans: seed.REPORTED_LOANS,
  outbox: seed.OUTBOX,
  reportRequests: seed.REPORT_REQUESTS,
  reportPurchases: seed.REPORT_PURCHASES,
  roles: ROLE_TEMPLATES.map((r) => ({ ...r, status: 'Active', version: 1, updatedAt: '2026-09-01', updatedBy: 'U Soe Paing' })),
});

const StoreContext = createContext(null);

/** Which classifications each audience may receive — the server-side rule behind AC07. */
const AUDIENCE_CLASSIFICATIONS = {
  public: ['Public'],
  borrower: ['Public'],
  mfi: ['Public', 'MFI-only'],
  regulator: ['Public', 'MFI-only', 'Regulator-only'],
  admin: ['Public', 'MFI-only', 'Regulator-only', 'Internal'],
};

export function StoreProvider({ children }) {
  const [state, setState] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? { ...initialState(), ...JSON.parse(saved) } : initialState();
    } catch {
      return initialState();
    }
  });

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch { /* storage unavailable */ }
  }, [state]);

  const add = useCallback((collection, item, { prepend = true } = {}) => {
    setState((s) => ({ ...s, [collection]: prepend ? [item, ...s[collection]] : [...s[collection], item] }));
    return item;
  }, []);

  const patch = useCallback((collection, id, changes) => {
    setState((s) => ({
      ...s,
      [collection]: s[collection].map((x) => (x.id === id ? { ...x, ...(typeof changes === 'function' ? changes(x) : changes) } : x)),
    }));
  }, []);

  const remove = useCallback((collection, id) => {
    setState((s) => ({ ...s, [collection]: s[collection].filter((x) => x.id !== id) }));
  }, []);

  /** Appends a hash-chained audit entry (SEC-08). The hash is illustrative only. */
  const logAudit = useCallback((entry) => {
    const now = new Date();
    const stamp = now.toISOString().replace('T', ' ').slice(0, 19);
    setState((s) => {
      const prev = s.auditLog[0]?.hash ?? '0000';
      const hash = `${Math.abs([...`${prev}${stamp}${entry.action}`].reduce((h, c) => (h * 31 + c.charCodeAt(0)) | 0, 7)).toString(16).padStart(8, '0').slice(0, 4)}…${Math.random().toString(16).slice(2, 6)}`;
      const item = { id: `AUD-${900413 + s.auditLog.length}`, at: stamp, ip: '103.25.12.40', purpose: '—', outcome: 'Success', ...entry, hash };
      return { ...s, auditLog: [item, ...s.auditLog] };
    });
  }, []);

  const reset = useCallback(() => setState(initialState()), []);

  /** Announcements an audience may see. Every portal must read notices through this, never filter in the page. */
  const announcementsFor = useCallback((audience) => state.announcements.filter(
    (a) => a.status === 'Published' && AUDIENCE_CLASSIFICATIONS[audience].includes(a.classification),
  ), [state.announcements]);

  const value = useMemo(() => ({ ...state, add, patch, remove, logAudit, reset, announcementsFor }), [state, add, patch, remove, logAudit, reset, announcementsFor]);
  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export const useStore = () => useContext(StoreContext);
