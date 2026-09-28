import { ACTIONS, FEATURES, featureById } from '@/data/rbac';
import { DEMO_USERS } from '@/data/roles';
import { describeActions } from '@/lib/rbac';

/** Pure helpers for the role builder: permission maths, diffs and segregation-of-duties checks. */

export const ORDER = 'CRUDAE';
export const ROLE_ADMINS = ['adm_super', 'adm_security'];
export const MODULE = 'Government · Roles & permissions';
export const PORTAL_LABEL = { gov: 'Government', mfi: 'MFI role template' };

export const sortLetters = (s = '') => [...new Set(s)].sort((a, b) => ORDER.indexOf(a) - ORDER.indexOf(b)).join('');
export const nowStamp = () => new Date().toISOString().replace('T', ' ').slice(0, 16);
export const slug = (s) => s.toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '').slice(0, 40);

export const featuresFor = (portal) => FEATURES.filter((f) => f.portal === portal);

/** Features of a portal grouped by `group`, preserving catalogue order. */
export function groupedFeatures(portal) {
  const groups = [];
  featuresFor(portal).forEach((f) => {
    let g = groups.find((x) => x.name === f.group);
    if (!g) { g = { name: f.group, features: [] }; groups.push(g); }
    g.features.push(f);
  });
  return groups;
}

export const usersWithRole = (roleId) => DEMO_USERS.filter((u) => u.role === roleId);
export const featureCount = (permissions = {}) => Object.values(permissions).filter(Boolean).length;
export const checkerFor = (makerRole) => (makerRole === 'adm_super' ? 'adm_security' : 'adm_super');
export const regionText = (regions) => (Array.isArray(regions) ? regions.join(', ') : regions ?? '—');

/** Drops empty entries and letters a feature does not support; sorts letters. */
export function cleanPermissions(perms = {}) {
  return Object.fromEntries(Object.entries(perms).map(([id, v]) => {
    const f = featureById(id);
    return [id, sortLetters([...(v ?? '')].filter((l) => f?.actions.includes(l)).join(''))];
  }).filter(([, v]) => v));
}

/** Toggle one cell. Any action other than Read needs Read; removing Read clears the row. */
export function toggleCell(perms, feature, letter) {
  const cur = perms[feature.id] ?? '';
  let next;
  if (cur.includes(letter)) next = letter === 'R' ? '' : cur.replace(letter, '');
  else next = sortLetters(cur + letter + (feature.actions.includes('R') ? 'R' : ''));
  return { ...perms, [feature.id]: next };
}

export function toggleRow(perms, feature) {
  const cur = perms[feature.id] ?? '';
  const full = cur.length === feature.actions.length;
  return { ...perms, [feature.id]: full ? '' : feature.actions };
}

/** Column toggle within a group: grants the action on every feature that supports it, or removes it from all. */
export function toggleColumn(perms, features, letter) {
  const eligible = features.filter((f) => f.actions.includes(letter));
  const allOn = eligible.length > 0 && eligible.every((f) => (perms[f.id] ?? '').includes(letter));
  const next = { ...perms };
  eligible.forEach((f) => {
    const cur = next[f.id] ?? '';
    if (allOn) next[f.id] = letter === 'R' ? '' : cur.replace(letter, '');
    else next[f.id] = sortLetters(cur + letter + (f.actions.includes('R') ? 'R' : ''));
  });
  return next;
}

export const columnState = (perms, features, letter) => {
  const eligible = features.filter((f) => f.actions.includes(letter));
  const on = eligible.filter((f) => (perms[f.id] ?? '').includes(letter)).length;
  return { eligible: eligible.length, on, all: eligible.length > 0 && on === eligible.length };
};

/** Readable diff lines: [{ feature, from, to }]. */
export function permissionDiff(before = {}, after = {}) {
  const idsAll = [...new Set([...Object.keys(before), ...Object.keys(after)])];
  return FEATURES.filter((f) => idsAll.includes(f.id))
    .map((f) => ({ id: f.id, feature: f.label, from: sortLetters(before[f.id] ?? ''), to: sortLetters(after[f.id] ?? '') }))
    .filter((d) => d.from !== d.to)
    .map((d) => ({ ...d, text: `${d.feature}: ${describeActions(d.from) || 'No access'} → ${describeActions(d.to) || 'No access'}` }));
}

/** Features whose records form an evidence trail — deleting them needs a strong justification. */
const RECORD_FEATURES = ['adm.audit', 'mfi.audit', 'adm.compliance', 'gov.cases', 'gov.complaints', 'adm.helpdesk'];

/** Segregation-of-duties and record-keeping warnings for a permission set. */
export function roleWarnings(perms = {}, portal = 'gov') {
  const out = [];
  const has = (id, l) => (perms[id] ?? '').includes(l);
  const sod = featuresFor(portal).filter((f) => has(f.id, 'C') && has(f.id, 'A'));
  const mfiSubmission = portal === 'mfi' && has('mfi.submissions', 'C') && has('mfi.submissions', 'A');
  const sodOther = sod.filter((f) => !(mfiSubmission && f.id === 'mfi.submissions'));
  if (mfiSubmission) {
    out.push({ tone: 'danger', title: 'Submitter and approver in one role', text: 'This role can both upload data submissions and sign them off. The Central Bank requires a separate Data Approver to sign the monthly attestation.' });
  }
  if (sodOther.length) {
    out.push({ tone: 'warning', title: 'Maker and checker in one role — segregation of duties', text: `Can both create and approve: ${sodOther.map((f) => f.label).join(', ')}. The platform still blocks a person from approving their own request, but a second holder of this role could approve it.` });
  }
  const del = RECORD_FEATURES.filter((id) => has(id, 'D')).map((id) => featureById(id)?.label);
  if (del.length) {
    out.push({ tone: 'warning', title: 'Delete on record-keeping features', text: `Can delete: ${del.join(', ')}. These records form part of the supervisory and audit trail; closing or archiving is normally preferred.` });
  }
  return out;
}

/** Plain-language access lines, e.g. "Supervisory cases — create, read, update". */
export const effectiveAccess = (perms = {}, portal = 'gov') => featuresFor(portal)
  .filter((f) => perms[f.id])
  .map((f) => ({ id: f.id, group: f.group, text: `${f.label} — ${ACTIONS.filter((a) => perms[f.id].includes(a.key)).map((a) => a.label.toLowerCase()).join(', ')}` }));

/** Share of supported actions granted per group (0–1), or null when the group has no features. */
export function groupCoverage(perms = {}, portal) {
  return groupedFeatures(portal).map((g) => {
    const total = g.features.reduce((n, f) => n + f.actions.length, 0);
    const granted = g.features.reduce((n, f) => n + [...(perms[f.id] ?? '')].filter((l) => f.actions.includes(l)).length, 0);
    const features = g.features.filter((f) => perms[f.id]).length;
    return { group: g.name, share: total ? granted / total : null, granted, total, features, of: g.features.length };
  });
}
