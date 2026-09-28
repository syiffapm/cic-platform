import { useCallback, useMemo } from 'react';
import { useStore } from '@/context/StoreContext';
import { usePermissions } from '@/lib/rbac';
import { MODULE, ROLE_ADMINS, checkerFor, nowStamp } from './rbacModel';

/**
 * Maker side of role administration. Every change is a pending approval; the roles collection
 * is only changed when a checker approves (the approvals inbox applies `payload.effect`).
 */
export function useRoleRequests() {
  const store = useStore();
  const { user, can } = usePermissions('gov');
  const makerRole = user?.role;
  const checkerRole = checkerFor(makerRole);

  const pending = useMemo(
    () => (store.approvals ?? []).filter((a) => a.module === MODULE && a.status === 'Pending'),
    [store.approvals],
  );
  const pendingFor = useCallback((roleId) => pending.find((a) => a.payload?.roleId === roleId) ?? null, [pending]);

  const request = useCallback(({ type, summary, roleId, diff = [], effect }) => {
    const next = Math.max(5521, ...(store.approvals ?? []).map((a) => Number(String(a.id).replace(/\D/g, '')) || 0)) + 1;
    const approval = {
      id: `APR-${next}`, type, module: MODULE, summary, maker: user?.name, makerRole,
      checkerRole, status: 'Pending', createdAt: nowStamp(), payload: { roleId, diff, effect },
    };
    store.add('approvals', approval);
    store.logAudit({
      actor: user?.name, role: makerRole, tenant: 'CIC', ip: user?.ip, action: `${type.toUpperCase().replace(/[^A-Z0-9]+/g, '_')}_REQUESTED`,
      module: MODULE, target: `${approval.id} · ${summary}`, outcome: 'Pending approval',
    });
    return approval;
  }, [store, user, makerRole, checkerRole]);

  const stamp = useCallback(() => ({ updatedAt: nowStamp().slice(0, 10), updatedBy: user?.name ?? '—' }), [user]);

  return {
    user,
    can,
    makerRole,
    checkerRole,
    isRoleAdmin: ROLE_ADMINS.includes(makerRole),
    pending,
    pendingFor,
    request,
    stamp,
  };
}
