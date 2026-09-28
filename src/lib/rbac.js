import { useCallback, useMemo } from 'react';
import { useSession } from '@/context/AuthContext';
import { useStore } from '@/context/StoreContext';
import { ACTIONS, FEATURES } from '@/data/rbac';

const LETTER = Object.fromEntries(ACTIONS.flatMap((a) => [[a.id, a.key], [a.key, a.key], [a.label.toLowerCase(), a.key]]));

/**
 * Permission check for the signed-in staff user of a portal ('gov' or 'mfi').
 *   const { can, scope, role } = usePermissions('gov');
 *   can('gov.cases', 'create')  // or 'C' / 'read' / 'update' / 'delete' / 'approve' / 'export'
 * Roles live in the shared store (edited in Government → Roles & permissions), so a change there
 * takes effect immediately. UI checks only — the server enforces the same matrix on every call.
 */
export function usePermissions(portal = 'gov') {
  const user = useSession(portal);
  const { roles = [] } = useStore();
  const role = roles.find((r) => r.id === user?.role) ?? null;

  const can = useCallback((featureId, action = 'read') => {
    if (!role || ['Disabled', 'Retired'].includes(role.status)) return false;
    const letter = LETTER[String(action).toLowerCase()] ?? LETTER[action];
    return (role.permissions?.[featureId] ?? '').includes(letter);
  }, [role]);

  const scope = useMemo(() => ({ ...(role?.scope ?? {}), ...(user?.scope ?? {}) }), [role, user]);
  const readable = useMemo(() => FEATURES.filter((f) => f.portal === portal && can(f.id, 'read')), [portal, can]);

  return { user, role, can, scope, readable };
}

/** Text like "Create · Read · Update" for a permission string. */
export const describeActions = (letters = '') => ACTIONS.filter((a) => letters.includes(a.key)).map((a) => a.label).join(' · ');
