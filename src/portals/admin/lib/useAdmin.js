import { useCallback, useMemo } from 'react';
import { useStore } from '@/context/StoreContext';
import { maskNrc, maskPhone } from '@/lib/format';
import { useGovAccess } from '@/portals/government/lib/access';
import { approvalArea, featureFor, moduleLabel } from './access';
import { nowStamp } from './time';

/**
 * Everything a console page needs about the signed-in operator:
 * const { user, role, readOnly, can, audit, requestApproval, nrc, phone } = useAdmin('adm.users');
 * `module` is a feature id (or an older module key). Permissions come from the role matrix:
 * can('create') / can('update') / can('delete') / can('approve') / can('export') for this feature,
 * or can('approve', 'adm.approvals') for another one. readOnly = read / export only.
 */
export function useAdmin(module) {
  const { user, role: roleDef, can: canFeature, readOnly: readOnlyFor, piiUnmasked } = useGovAccess();
  const store = useStore();
  const role = user?.role;
  const feature = featureFor(module);
  const label = moduleLabel(module);
  const area = approvalArea(module);

  const audit = useCallback((action, target, extra = {}) => store.logAudit({
    actor: user?.name, role, tenant: roleDef?.org === 'Central Bank of Myanmar' ? 'CBM' : 'CIC', ip: user?.ip ?? '10.10.4.2', action, module: label, target: target ?? '—', ...extra,
  }), [store, user, role, roleDef, label]);

  /**
   * Maker side of maker-checker. payload.effect (optional) is applied when a checker approves:
   * { target: 'store' | 'admin', collection, op: 'patch' | 'add' | 'set', id?, changes?, item? }
   */
  const requestApproval = useCallback(({ type, summary, checkerRole = 'adm_super', payload = {} }) => {
    const next = Math.max(5521, ...store.approvals.map((a) => Number(String(a.id).replace(/\D/g, '')) || 0)) + 1;
    const approval = {
      id: `APR-${next}`, type, module: `Admin · ${area}`, summary, maker: user?.name, makerRole: role,
      checkerRole, status: 'Pending', createdAt: nowStamp(), payload,
    };
    store.add('approvals', approval);
    audit(`${type.toUpperCase().replace(/[^A-Z0-9]+/g, '_')}_REQUESTED`, summary, { outcome: 'Pending approval' });
    return approval;
  }, [store, user, role, area, audit]);

  const can = useCallback((action, featureId = feature) => canFeature(featureId, action), [canFeature, feature]);

  return useMemo(() => ({
    user,
    role,
    roleDef,
    store,
    feature,
    can,
    canView: canFeature(feature, 'read'),
    readOnly: readOnlyFor(feature),
    piiUnmasked,
    nrc: (v) => (piiUnmasked ? v : maskNrc(v)),
    phone: (v) => (piiUnmasked ? v : maskPhone(v)),
    audit,
    requestApproval,
  }), [user, role, roleDef, store, feature, can, canFeature, readOnlyFor, piiUnmasked, audit, requestApproval]);
}
