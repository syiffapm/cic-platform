import { useCallback, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { useStore } from '@/context/StoreContext';
import { usePermissions } from '@/lib/rbac';
import { FEATURES, featureById } from '@/data/rbac';

/** Roles that work with full registry data; everyone else sees NRC and phone numbers masked. */
export const PII_ROLES = ['adm_super', 'adm_steward', 'adm_dpo'];

/** Actions that change something (anything beyond read / export). */
const WRITE = ['C', 'U', 'D', 'A'];

/**
 * Government Portal access for the signed-in staff user.
 *   const { can, readOnly, piiUnmasked } = useGovAccess();
 *   readOnly('gov.cases')  // true when the role may only read / export the feature
 */
export function useGovAccess() {
  const perms = usePermissions('gov');
  const { can: canRaw, role } = perms;
  // Downloads of a list on a feature without a separate Export right follow its Read right.
  const can = useCallback((featureId, action = 'read') => {
    const a = String(action).toLowerCase();
    if ((a === 'export' || a === 'e') && !featureById(featureId)?.actions.includes('E')) return canRaw(featureId, 'read');
    return canRaw(featureId, action);
  }, [canRaw]);
  const piiUnmasked = can('gov.drilldown', 'read') || PII_ROLES.includes(role?.id);
  const readOnly = useCallback((featureId) => {
    const f = featureById(featureId);
    const supportsWrite = WRITE.some((a) => f?.actions.includes(a));
    return supportsWrite && !WRITE.some((a) => can(featureId, a));
  }, [can]);
  return { ...perms, can, piiUnmasked, readOnly };
}

/**
 * Regional scope of the signed-in user. When the role (or the user) is limited to named regions,
 * institution-linked lists are filtered to institutions headquartered in those regions.
 */
export function useRegionScope() {
  const { scope } = usePermissions('gov');
  const { institutions = [] } = useStore();
  const regions = Array.isArray(scope?.regions) && scope.regions.length ? scope.regions : null;

  return useMemo(() => {
    const regionOf = (mfiId) => institutions.find((i) => i.id === mfiId)?.region;
    const inRegion = (region) => !regions || regions.includes(region);
    const mfiInScope = (mfiId) => !regions || regions.includes(regionOf(mfiId));
    const filterByRegion = (rows = [], key = 'region') => (regions ? rows.filter((r) => regions.includes(r[key])) : rows);
    const filterByMfi = (rows = [], key = 'mfiId') => (regions ? rows.filter((r) => mfiInScope(r[key])) : rows);
    return { regions, label: regions ? regions.join(', ') : 'All regions', inRegion, mfiInScope, filterByRegion, filterByMfi };
  }, [regions, institutions]);
}

const EXTRA_PATHS = [['/gov/analytics', 'gov.reports']];

/** Feature id that owns a Government Portal path (longest matching feature path wins). */
export function featureForPath(pathname = '') {
  const extra = EXTRA_PATHS.find(([p]) => pathname === p || pathname.startsWith(`${p}/`));
  if (extra) return extra[1];
  const hits = FEATURES.filter((f) => f.portal === 'gov' && f.path && (pathname === f.path || pathname.startsWith(`${f.path}/`)));
  return hits.sort((a, b) => b.path.length - a.path.length)[0]?.id ?? null;
}

/** Feature of the page currently open. */
export function useCurrentFeature() {
  const { pathname } = useLocation();
  return featureForPath(pathname);
}
