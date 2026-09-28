import { Eye, Users } from 'lucide-react';
import { Card, CardBody, CardHeader, EmptyState } from '@/components/ui';
import { useStore } from '@/context/StoreContext';
import { effectiveAccess, regionText, usersWithRole } from './rbacModel';

/** Who holds the role, and what the (draft) permissions allow in plain language. */
export default function RoleSidePanel({ role, perms, changed }) {
  const { institutions = [] } = useStore();
  const users = usersWithRole(role.id);
  const lines = effectiveAccess(perms, role.portal);
  const groups = [...new Set(lines.map((l) => l.group))];
  const instName = (id) => institutions.find((i) => i.id === id)?.name ?? id;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader icon={Users} title="Users with this role" subtitle={`${users.length} account${users.length === 1 ? '' : 's'}`} />
        <CardBody className="p-0">
          {users.length === 0 ? (
            <p className="px-5 py-4 text-sm text-slate-500">No one holds this role yet.</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {users.map((u) => (
                <li key={u.id} className="px-5 py-3 text-sm">
                  <p className="font-medium text-slate-800">{u.name}</p>
                  <p className="text-xs text-slate-500">{u.email}</p>
                  {u.tenant && <p className="mt-0.5 text-xs text-slate-600">Institution: {instName(u.tenant)}</p>}
                  {u.scope?.regions && <p className="mt-0.5 text-xs text-teal-700">Regions: {regionText(u.scope.regions)}</p>}
                </li>
              ))}
            </ul>
          )}
        </CardBody>
      </Card>

      <Card>
        <CardHeader icon={Eye} title="Effective access" subtitle={changed ? 'Preview including your unsaved changes' : 'As currently approved'} />
        <div className="max-h-[520px] space-y-4 overflow-y-auto p-5 scrollbar-thin" tabIndex={0} role="region" aria-label="Role summary">
          {lines.length === 0 ? (
            <EmptyState title="No access" description="This role cannot open any feature." />
          ) : groups.map((g) => (
            <div key={g}>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">{g}</p>
              <ul className="mt-1 space-y-1">
                {lines.filter((l) => l.group === g).map((l) => <li key={l.id} className="text-sm text-slate-700">{l.text}</li>)}
              </ul>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
