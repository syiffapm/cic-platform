import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSession } from '@/context/AuthContext';
import { useStore } from '@/context/StoreContext';
import { getInstitution } from '@/data/institutions';
import { OTHER_INQUIRIES } from '@/data/registry';
import { SEED_FOR } from '../data/portalMock';

/** Signed-in borrower (portal 'borrower'). */
export const useBorrower = () => useSession('borrower');

/**
 * localStorage-backed state for portal-local data (alerts, preferences, downloads). Hooks sharing a key stay in sync
 * (e.g. sidebar badge and Alerts page). Falls back to memory if storage is blocked.
 */
const cache = new Map();
const listeners = new Map();

function readKey(storageKey, initial) {
  if (cache.has(storageKey)) return cache.get(storageKey);
  let value = initial;
  try {
    const raw = localStorage.getItem(storageKey);
    if (raw) value = JSON.parse(raw);
  } catch { /* storage unavailable */ }
  cache.set(storageKey, value);
  return value;
}

export function usePersistentState(key, initial) {
  const storageKey = `cic.borrower.${key}`;
  const [value, setValue] = useState(() => readKey(storageKey, initial));
  useEffect(() => {
    const set = listeners.get(storageKey) ?? new Set();
    set.add(setValue);
    listeners.set(storageKey, set);
    // Catch up with a write made by another hook between this hook's first render and now.
    if (cache.has(storageKey)) setValue(cache.get(storageKey));
    return () => { set.delete(setValue); };
  }, [storageKey]);
  const update = useCallback((next) => {
    const prev = readKey(storageKey, initial);
    const v = typeof next === 'function' ? next(prev) : next;
    cache.set(storageKey, v);
    try { localStorage.setItem(storageKey, JSON.stringify(v)); } catch { /* storage unavailable */ }
    listeners.get(storageKey)?.forEach((fn) => fn(v));
  }, [storageKey]); // eslint-disable-line react-hooks/exhaustive-deps
  return [value, update];
}

/** Per-citizen persistent collection (alerts, consents, data requests, representatives), keyed by the session borrowerId. */
export function useOwnState(key) {
  const user = useBorrower();
  const id = user?.borrowerId ?? 'anon';
  return usePersistentState(`${key}.${id}`, SEED_FOR[key] ? SEED_FOR[key](id) : []);
}

/**
 * Own-data guard: every collection is filtered by the borrowerId in the session token,
 * never by anything the user can type.
 */
export function useOwnDisputes() {
  const user = useBorrower();
  const { disputes } = useStore();
  return useMemo(() => disputes.filter((d) => d.borrowerId === user?.borrowerId), [disputes, user]);
}

/**
 * Every credit check on the citizen's file: checks made through the CIC inquiry service (including those
 * an MFI made for the citizen's online loan application) plus earlier checks from the registry history.
 */
export function useOwnInquiries() {
  const user = useBorrower();
  const { inquiries, loanApplications } = useStore();
  return useMemo(() => {
    const own = inquiries.filter((i) => i.borrowerId === user?.borrowerId).map((i) => {
      const app = loanApplications.find((a) => a.inquiryId === i.id || (a.borrowerId === i.borrowerId && a.consent?.ref === i.consentRef));
      return app ? { ...i, applicationId: app.id } : i;
    });
    const past = OTHER_INQUIRIES.filter((q) => q.borrowerId === user?.borrowerId).map((q, n) => ({
      id: `INQ-${q.at.replace(/-/g, '').slice(2)}${n}`, borrowerId: q.borrowerId, mfiId: q.mfiId, purpose: q.purpose, at: `${q.at} 10:00`,
      reportType: 'Full', consentRef: 'Signed at branch', user: 'Loan officer',
    }));
    return [...own, ...past];
  }, [inquiries, loanApplications, user]);
}

export function useOwnApplications() {
  const user = useBorrower();
  const { loanApplications } = useStore();
  return useMemo(() => loanApplications.filter((a) => a.borrowerId === user?.borrowerId).sort((a, b) => b.submittedAt.localeCompare(a.submittedAt)), [loanApplications, user]);
}

/** Audit helper with the borrower as actor. */
export function useBorrowerAudit() {
  const user = useBorrower();
  const { logAudit } = useStore();
  return useCallback((action, target, extra = {}) => logAudit({
    actor: user?.name ?? 'Unknown', role: user?.role ?? 'borrower', tenant: 'PUBLIC', module: 'Borrower',
    action, target: target ?? user?.borrowerId, purpose: 'Self access', ...extra,
  }), [logAudit, user]);
}

export const mfiName = (id) => getInstitution(id)?.name ?? id;
export const mfiShort = (id) => getInstitution(id)?.short ?? id;

/** Disputes that are still open (not resolved/rejected/closed). */
export const isOpenDispute = (d) => !['Resolved', 'Rejected', 'Closed', 'Withdrawn'].includes(d.status);

export function addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

export function addWorkingDays(date, days) {
  const d = new Date(date);
  let left = days;
  while (left > 0) {
    d.setDate(d.getDate() + 1);
    if (d.getDay() !== 0 && d.getDay() !== 6) left -= 1;
  }
  return d;
}

export const isoDate = (d) => {
  const x = new Date(d);
  return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`;
};

export const stamp = (d = new Date()) => `${isoDate(d)} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;

/** Free-report quota: 1 free official PDF per rolling 12 months, per citizen. */
export const FREE_REPORTS_PER_YEAR = 1;

export function useReportQuota() {
  const user = useBorrower();
  const [downloads, setDownloads] = usePersistentState(`reportDownloads.${user?.borrowerId ?? 'anon'}`, []);
  const since = addDays(new Date(), -365);
  const used = downloads.filter((d) => new Date(d.at) >= since).length;
  const remaining = Math.max(0, FREE_REPORTS_PER_YEAR - used);
  const lastFree = downloads[0];
  const nextFreeAt = lastFree ? addDays(lastFree.at, 365) : null;
  const consume = (entry) => setDownloads((list) => [entry, ...list]);
  return { remaining, used, downloads, nextFreeAt, consume };
}
