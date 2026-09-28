import { Copy, Power, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Badge, Button, DataTable } from '@/components/ui';
import { formatDate } from '@/lib/format';
import { featureCount, featuresFor, regionText, usersWithRole } from './rbacModel';

const stop = (fn) => (e) => { e.stopPropagation(); fn(); };

/**
 * Role list for one portal. rows: live roles plus pending new roles (`pendingNew: true`).
 * perms: { create, update, delete } — what the signed-in administrator may request.
 */
export default function RolesTable({ rows, portal, perms, pendingFor, onClone, onToggle, onDelete }) {
  const navigate = useNavigate();
  const total = featuresFor(portal).length;

  const columns = [
    {
      key: 'name', header: 'Role', sortable: true, className: 'min-w-[180px]',
      render: (r) => (
        <div>
          <p className="font-medium text-slate-900">{r.name}</p>
          <p className="text-[11px] text-slate-500">{r.org}</p>
          <Badge className="mt-1" tone={r.system ? 'navy' : 'teal'}>{r.system ? 'System' : 'Custom'}</Badge>
        </div>
      ),
    },
    { key: 'description', header: 'Description', className: 'min-w-[200px] max-w-xs text-xs text-slate-600', render: (r) => r.description },
    { key: 'data', header: 'Data scope', className: 'min-w-[150px] text-xs', render: (r) => r.scope?.data ?? '—' },
    { key: 'regionsText', header: 'Regions', className: 'min-w-[100px] text-xs', render: (r) => regionText(r.scope?.regions) },
    { key: 'users', header: 'Users', sortable: true, className: 'text-right tabular-nums' },
    { key: 'features', header: 'Features', sortable: true, className: 'whitespace-nowrap tabular-nums', render: (r) => <span>{r.features}<span className="text-slate-500"> / {total}</span></span> },
    {
      key: 'status', header: 'Status',
      render: (r) => (
        <div className="flex flex-col items-start gap-1">
          {r.pendingNew ? <Badge tone="violet">Awaiting creation</Badge> : <Badge status={r.status} />}
          {!r.pendingNew && pendingFor(r.id) && <Badge tone="amber">Pending approval</Badge>}
        </div>
      ),
    },
    {
      key: 'updatedAt', header: 'Last change', sortable: true, className: 'whitespace-nowrap text-xs',
      render: (r) => (r.pendingNew ? <span className="text-slate-500">Requested {r.updatedAt}</span> : (
        <div><p>{formatDate(r.updatedAt)} · v{r.version}</p><p className="text-[11px] text-slate-500">{r.updatedBy}</p></div>
      )),
    },
    {
      key: 'actions', header: <span className="relative"><span className="sr-only">Actions</span></span>, className: 'text-right',
      render: (r) => {
        if (r.pendingNew) return null;
        const locked = !!pendingFor(r.id);
        return (
          <div className="flex justify-end gap-1">
            {perms.create && (
              <Button size="icon" variant="ghost" aria-label={`Clone ${r.name}`} title="Clone" onClick={stop(() => onClone(r))}><Copy className="h-4 w-4" /></Button>
            )}
            {perms.update && (
              <Button size="icon" variant="ghost" disabled={locked} aria-label={`${r.status === 'Disabled' ? 'Enable' : 'Disable'} ${r.name}`}
                title={locked ? 'A change is already awaiting approval' : r.status === 'Disabled' ? 'Enable' : 'Disable'} onClick={stop(() => onToggle(r))}>
                <Power className={r.status === 'Disabled' ? 'h-4 w-4 text-emerald-700' : 'h-4 w-4'} />
              </Button>
            )}
            {perms.delete && !r.system && r.users === 0 && (
              <Button size="icon" variant="ghost" disabled={locked} aria-label={`Delete ${r.name}`} title="Delete" onClick={stop(() => onDelete(r))}>
                <Trash2 className="h-4 w-4 text-red-600" />
              </Button>
            )}
          </div>
        );
      },
    },
  ];

  const data = rows.map((r) => ({
    ...r,
    data: r.scope?.data ?? '',
    regionsText: regionText(r.scope?.regions),
    users: r.pendingNew ? 0 : usersWithRole(r.id).length,
    features: featureCount(r.permissions),
    kind: r.system ? 'System' : 'Custom',
  }));

  return (
    <DataTable
      columns={columns}
      rows={data}
      searchKeys={['name', 'org', 'description', 'data', 'regionsText']}
      pageSize={12}
      dense
      onRowClick={(r) => !r.pendingNew && navigate(`/gov/admin/access/roles/${r.id}`)}
      emptyTitle="No roles match your search"
    />
  );
}
