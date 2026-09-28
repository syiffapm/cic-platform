import { useCallback, useMemo } from 'react';
import { useStore } from '@/context/StoreContext';
import { useAdminCollection, useAdminObject } from '../../context/AdminStore';
import { nowStamp } from '../../lib/time';
import { CMS_ITEMS, CMS_SETTINGS, slugify, snapshotOf } from '../../data/cms';

/**
 * One list of CMS content across both backing stores:
 * - announcements → shared store (what the Public / MFI / Regulator portals read via announcementsFor())
 * - everything else → portal-local 'cmsItems' collection
 * Every save appends a version snapshot { version, at, by, note, snapshot } (CMS-06).
 */
function normaliseAnnouncement(a) {
  const item = {
    seo: { meta: '', ogImage: '' }, scheduleAt: null, expiresAt: null, ...a,
    type: 'announcement',
    slug: a.slug ?? slugify(a.title?.en),
    lastEditor: a.lastEditor ?? a.author,
    updatedAt: a.updatedAt ?? (a.publishedAt ? `${a.publishedAt} 09:00` : '2026-09-24 10:00'),
  };
  item.enUpdatedAt = a.enUpdatedAt ?? item.updatedAt;
  item.mmUpdatedAt = a.mmUpdatedAt ?? (a.title?.mm || a.body?.mm ? item.updatedAt : null);
  if (!a.versions?.length) {
    const snap = snapshotOf(item);
    const created = a.publishedAt ? `${a.publishedAt} 08:00` : item.updatedAt;
    item.versions = [{ version: 1, at: created, by: a.author, note: 'Draft created', snapshot: { ...snap, status: 'Draft' } }];
    if (a.status !== 'Draft') {
      item.versions.push({ version: 2, at: item.updatedAt, by: a.approver ?? a.author, note: a.approver ? `Approved and ${a.status.toLowerCase()}` : `Moved to ${a.status}`, snapshot: snap });
    }
  }
  return item;
}

export function useCmsItems() {
  const store = useStore();
  const [local, localApi] = useAdminCollection('cmsItems', CMS_ITEMS);
  const [settings, setSettings] = useAdminObject('cmsSettings', CMS_SETTINGS);

  const items = useMemo(() => [
    ...store.announcements.map(normaliseAnnouncement),
    ...local.map((x) => ({ ...x, versions: x.versions ?? [] })),
  ].sort((a, b) => String(b.updatedAt).localeCompare(String(a.updatedAt))), [store.announcements, local]);

  const get = useCallback((id) => items.find((x) => x.id === id) ?? null, [items]);

  const nextId = useCallback((type) => {
    if (type === 'announcement') {
      const max = Math.max(32, ...store.announcements.map((a) => Number(String(a.id).split('-').pop()) || 0));
      return `ANN-2026-${String(max + 1).padStart(3, '0')}`;
    }
    const max = Math.max(0, ...local.map((x) => Number(String(x.id).replace(/\D/g, '')) || 0));
    return `CMS-${String(max + 101).padStart(4, '0')}`;
  }, [store.announcements, local]);

  /** Persists the item and appends a version entry. Returns the saved item. */
  const save = useCallback((item, { versionNote = 'Saved', by = 'System' } = {}) => {
    const existing = item.id ? items.find((x) => x.id === item.id) : null;
    const id = item.id ?? nextId(item.type);
    const at = nowStamp();
    const base = { ...item, id, updatedAt: at };
    const prev = existing?.versions ?? item.versions ?? [];
    const version = { version: (prev[prev.length - 1]?.version ?? 0) + 1, at, by, note: versionNote, snapshot: snapshotOf(base) };
    const saved = { ...base, versions: [...prev, version] };
    if (saved.type === 'announcement') {
      const { type, ...record } = saved; // eslint-disable-line no-unused-vars
      if (existing) store.patch('announcements', id, record); else store.add('announcements', record);
    } else if (existing) localApi.patch(id, saved);
    else localApi.add(saved);
    return saved;
  }, [items, nextId, store, localApi]);

  return { items, get, save, settings, setSettings };
}
