import { SNAPSHOT_FIELDS } from '../../../data/cms';

/** Second-resolution timestamp so EN/MM edit order is comparable with seed 'YYYY-MM-DD HH:mm' stamps. */
export const stampSec = () => new Date().toISOString().replace('T', ' ').slice(0, 19);

/** Translation status (CMS-03): Complete / MM missing / MM outdated (EN edited after MM). */
export function translationStatus(item) {
  if (!item?.title?.mm?.trim() || !item?.body?.mm?.trim()) return { id: 'missing', label: 'MM missing', tone: 'red' };
  if (item.mmUpdatedAt && item.enUpdatedAt && item.enUpdatedAt > item.mmUpdatedAt) return { id: 'outdated', label: 'MM outdated', tone: 'amber' };
  return { id: 'complete', label: 'Complete', tone: 'green' };
}

/**
 * Workflow permissions. `rights` = the role's { create, update, approve } on Pages, news, FAQ &
 * documents. Returns { canEditFields, actions: { key: { allowed, reason } } }.
 * The checker may never be the author or the last editor of the item.
 */
export function workflowPermissions({ item, user, rights = {}, settings, isNew }) {
  const readOnly = !rights.create && !rights.update && !rights.approve;
  const status = item.status ?? 'Draft';
  const own = !isNew && (item.author === user?.name || (item.lastEditor ?? item.author) === user?.name);
  const mmMissing = translationStatus(item).id === 'missing';
  const futureSchedule = !!item.scheduleAt && new Date(item.scheduleAt) > new Date();

  const editRole = isNew ? !!rights.create : !!rights.update;
  const pubRole = !!rights.approve;
  const editable = ['Draft', 'In review', 'Approved', 'Scheduled', 'Published', 'Archived'].includes(status);
  const canEditFields = !readOnly && editRole && editable;

  const deny = (reason) => ({ allowed: false, reason });
  const ok = { allowed: true, reason: null };

  const makerCheck = (needStatuses, label) => {
    if (readOnly) return deny('Read-only access.');
    if (!pubRole) return deny(`Only a Content Publisher can ${label}. Editors prepare content; a different person approves it.`);
    if (isNew) return deny('Save the item first.');
    if (own) return deny(`You ${item.author === user?.name ? 'authored' : 'last edited'} this item, so you cannot ${label} it. A different publisher must act.`);
    if (!needStatuses.includes(status)) return deny(`Not available while the item is ${status}.`);
    return ok;
  };

  const actions = {
    save: readOnly ? deny('Read-only access.') : !editRole ? deny('Publishers cannot edit content they approve — ask a Content Editor to make changes.') : ok,
    submit: readOnly ? deny('Read-only access.') : !editRole ? deny('Only editors submit content for review.')
      : status !== 'Draft' ? deny(`Already ${status}.`) : ok,
    approve: makerCheck(['In review'], 'approve'),
    publish: makerCheck(['Approved', 'Scheduled'], 'publish'),
    schedule: makerCheck(['Approved'], 'schedule'),
    archive: makerCheck(['Published', 'Scheduled'], 'archive'),
    returnDraft: makerCheck(['In review', 'Approved', 'Scheduled'], 'return to draft'),
  };

  if (settings?.blockPublishIfMmMissing && mmMissing) {
    for (const k of ['publish', 'schedule']) {
      if (actions[k].allowed) actions[k] = deny('Myanmar translation is missing — publishing is blocked by the "Block publish if MM missing" setting.');
    }
  }
  if (actions.schedule.allowed && !futureSchedule) actions.schedule = deny('Set a publish date/time in the future first.');

  return { canEditFields, own, futureSchedule, actions };
}

const get = (obj, path) => path.split('.').reduce((o, k) => (o == null ? o : o[k]), obj);

const DIFF_PATHS = SNAPSHOT_FIELDS.flatMap((f) => (f === 'title' || f === 'body' ? [`${f}.en`, `${f}.mm`] : f === 'seo' ? ['seo.meta', 'seo.ogImage'] : [f]));

const LABELS = {
  'title.en': 'Title (EN)', 'title.mm': 'Title (MM)', 'body.en': 'Body (EN)', 'body.mm': 'Body (MM)',
  'seo.meta': 'Meta description', 'seo.ogImage': 'OG image', scheduleAt: 'Publish at', expiresAt: 'Expires', category: 'Category',
  classification: 'Classification', status: 'Status', slug: 'Slug', pinned: 'Pinned',
};

const show = (v) => (v === null || v === undefined || v === '' ? '—' : typeof v === 'boolean' ? (v ? 'Yes' : 'No') : String(v));

/** Field-level diff between two snapshots: [{ field, label, from, to }]. */
export function diffSnapshots(from, to) {
  return DIFF_PATHS
    .map((p) => ({ field: p, label: LABELS[p] ?? p, from: show(get(from, p)), to: show(get(to, p)) }))
    .filter((d) => d.from !== d.to);
}
