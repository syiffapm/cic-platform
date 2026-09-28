import { useCallback } from 'react';
import { useSession } from '@/context/AuthContext';
import { usePermissions } from '@/lib/rbac';
import { useStore } from '@/context/StoreContext';
import { roleName } from '@/data/roles';
import { useAdminStore } from '../context/AdminStore';
import { nowStamp } from './time';

/**
 * Why the current user may not decide an approval, or null if they may. `canApprove` is the
 * role's Approve right on the approvals inbox; maker ≠ checker and the checker role still apply.
 */
export function blockReason(approval, user, canApprove = false) {
  if (!user) return 'Not signed in';
  if (approval.status !== 'Pending') return `Already ${approval.status.toLowerCase()}`;
  if (!canApprove) return 'Your role can view approvals but not decide them';
  if (approval.maker === user.name) return 'You created this request — a different user must approve it';
  if (approval.checkerRole && !approval.checkerRole.startsWith('adm_')) return `Decided in Supervision by ${roleName(approval.checkerRole)}`;
  if (approval.checkerRole && approval.checkerRole !== user.role && user.role !== 'adm_super') {
    return `Requires ${roleName(approval.checkerRole)}`;
  }
  return null;
}

/** Checker side: approve / reject with comment; applies payload.effect on approval. */
export function useApprovalDecision() {
  const user = useSession('gov');
  const { can } = usePermissions('gov');
  const store = useStore();
  const admin = useAdminStore();

  const applyEffect = useCallback((effect) => {
    if (!effect) return;
    const effects = Array.isArray(effect) ? effect : [effect];
    effects.forEach((e) => {
      if (e.target === 'store') {
        if (e.op === 'add') store.add(e.collection, e.item);
        else store.patch(e.collection, e.id, e.changes);
      } else if (e.target === 'admin') {
        if (e.op === 'add') admin.addItem(e.collection, e.item);
        else if (e.op === 'set') admin.setCollection(e.collection, (cur) => (Array.isArray(cur) && cur.length ? cur : { ...(Array.isArray(cur) ? {} : cur), ...e.changes }));
        else admin.patchItem(e.collection, e.id, e.changes);
      }
    });
  }, [store, admin]);

  return useCallback((approval, decision, comment = '') => {
    const reason = blockReason(approval, user, can('adm.approvals', 'approve'));
    if (reason) {
      store.logAudit({ actor: user?.name, role: user?.role, tenant: 'CIC', ip: user?.ip, action: 'APPROVAL_DENIED', module: approval.module, target: approval.id, outcome: 'Denied' });
      return { ok: false, reason };
    }
    const status = decision === 'approve' ? 'Approved' : 'Rejected';
    store.patch('approvals', approval.id, { status, checker: user.name, decidedAt: nowStamp(), comment });
    if (status === 'Approved') applyEffect(approval.payload?.effect);
    store.logAudit({ actor: user.name, role: user.role, tenant: 'CIC', ip: user.ip, action: `APPROVAL_${status.toUpperCase()}`, module: approval.module, target: `${approval.id} · ${approval.type}`, outcome: 'Success' });
    return { ok: true, status };
  }, [user, can, store, applyEffect]);
}
