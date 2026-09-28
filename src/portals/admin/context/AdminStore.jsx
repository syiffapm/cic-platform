import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { SEED_REGISTRY } from '../data/seedRegistry';

/**
 * Portal-local mutable collections (services, CMS items, users, rule sets, config …).
 * Collections are seeded lazily by the page that first uses them and persisted to
 * localStorage so approvals decided in the inbox can apply their change later.
 */
const STORAGE_KEY = 'cic.admin.v1';
const AdminStoreContext = createContext(null);
const SEEDS = { ...SEED_REGISTRY };

export function AdminStoreProvider({ children }) {
  const [state, setState] = useState(() => {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) ?? {}; } catch { return {}; }
  });

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch { /* storage unavailable */ }
  }, [state]);

  const current = (s, key) => s[key] ?? SEEDS[key] ?? [];

  const setCollection = useCallback((key, updater) => {
    setState((s) => ({ ...s, [key]: typeof updater === 'function' ? updater(current(s, key)) : updater }));
  }, []);

  const addItem = useCallback((key, item, { prepend = true } = {}) => {
    setCollection(key, (list) => (prepend ? [item, ...list] : [...list, item]));
    return item;
  }, [setCollection]);

  const patchItem = useCallback((key, id, changes) => {
    setCollection(key, (list) => list.map((x) => (x.id === id ? { ...x, ...(typeof changes === 'function' ? changes(x) : changes) } : x)));
  }, [setCollection]);

  const removeItem = useCallback((key, id) => setCollection(key, (list) => list.filter((x) => x.id !== id)), [setCollection]);

  const resetAdmin = useCallback(() => setState({}), []);

  const value = useMemo(() => ({ state, setCollection, addItem, patchItem, removeItem, resetAdmin }), [state, setCollection, addItem, patchItem, removeItem, resetAdmin]);
  return <AdminStoreContext.Provider value={value}>{children}</AdminStoreContext.Provider>;
}

export const useAdminStore = () => useContext(AdminStoreContext);

/**
 * const [items, api] = useAdminCollection('services', SERVICES);
 * api: { set(updater), add(item), patch(id, changes), remove(id) }
 */
export function useAdminCollection(key, seed) {
  if (!(key in SEEDS)) SEEDS[key] = seed;
  const { state, setCollection, addItem, patchItem, removeItem } = useAdminStore();
  const items = state[key] ?? seed;
  const api = useMemo(() => ({
    set: (updater) => setCollection(key, updater),
    add: (item, opts) => addItem(key, item, opts),
    patch: (id, changes) => patchItem(key, id, changes),
    remove: (id) => removeItem(key, id),
  }), [key, setCollection, addItem, patchItem, removeItem]);
  return [items, api];
}

/** Single settings object stored under a key: const [cfg, setCfg] = useAdminObject('system', DEFAULTS) */
export function useAdminObject(key, seed) {
  if (!(key in SEEDS)) SEEDS[key] = seed;
  const { state, setCollection } = useAdminStore();
  const value = state[key] ?? seed;
  const set = useCallback((changes) => setCollection(key, (cur) => ({ ...cur, ...(typeof changes === 'function' ? changes(cur) : changes) })), [key, setCollection]);
  return [value, set];
}
