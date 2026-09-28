import { useMemo, useState } from 'react';
import { Clock, KeyRound, Plus, ShieldCheck, Users } from 'lucide-react';
import { Alert, Button, Card, MakerCheckerBanner, PageHeader, StatCard, Tabs, useToast } from '@/components/ui';
import { useStore } from '@/context/StoreContext';
import { DEMO_USERS, roleName } from '@/data/roles';
import { formatDate } from '@/lib/format';
import ConfirmChangeModal from './ConfirmChangeModal';
import NewRoleModal from './NewRoleModal';
import PermissionHeatmap from './PermissionHeatmap';
import RolesTable from './RolesTable';
import { useRoleRequests } from './useRoleRequests';

const TABS = [
  { id: 'gov', label: 'Government roles' },
  { id: 'mfi', label: 'MFI role templates' },
  { id: 'overview', label: 'Permission overview' },
];

export default function RolesPage() {
  const { roles = [] } = useStore();
  const { can, user, checkerRole, pending, pendingFor, request, stamp } = useRoleRequests();
  const toast = useToast();
  const [tab, setTab] = useState('gov');
  const [overviewPortal, setOverviewPortal] = useState('gov');
  const [modal, setModal] = useState(null); // { kind: 'new' | 'toggle' | 'delete', role? }

  const live = useMemo(() => roles.filter((r) => r.status !== 'Retired'), [roles]);
  const pendingNew = useMemo(() => pending
    .filter((a) => a.payload?.effect?.op === 'add' && a.payload.effect.item)
    .map((a) => ({ ...a.payload.effect.item, pendingNew: true, updatedAt: a.createdAt })), [pending]);

  const perms = { create: can('adm.roles', 'create'), update: can('adm.roles', 'update'), delete: can('adm.roles', 'delete') };
  const portalOf = tab === 'overview' ? overviewPortal : tab;
  const rowsFor = (p) => [...pendingNew.filter((r) => r.portal === p), ...live.filter((r) => r.portal === p)];
  const assigned = DEMO_USERS.filter((u) => live.some((r) => r.id === u.role)).length;

  const asOf = formatDate(new Date());
  const counts = { gov: live.filter((r) => r.portal === 'gov').length, mfi: live.filter((r) => r.portal === 'mfi').length };
  const checker = roleName(checkerRole);

  const submitStatus = (reason) => {
    const { role, kind } = modal;
    const disable = role.status !== 'Disabled';
    const changes = kind === 'delete'
      ? { status: 'Retired', version: (role.version ?? 1) + 1, ...stamp() }
      : { status: disable ? 'Disabled' : 'Active', version: (role.version ?? 1) + 1, ...stamp() };
    const verb = kind === 'delete' ? 'Delete' : disable ? 'Disable' : 'Enable';
    const apr = request({
      type: `${verb} role`, roleId: role.id, summary: `${verb} role “${role.name}”`,
      diff: [`Status: ${role.status} → ${kind === 'delete' ? 'Deleted (kept in audit history)' : changes.status}`, `Justification: ${reason}`],
      effect: { target: 'store', collection: 'roles', op: 'patch', id: role.id, changes },
    });
    toast(`${apr.id} sent to ${checker} for approval`, 'success');
    setModal(null);
  };

  if (!can('adm.roles', 'read')) {
    return (<><PageHeader title="Roles & permissions" /><Alert tone="danger" title="Access restricted">Your role does not include access to role administration. Contact the CIC Security Administrator.</Alert></>);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Roles & permissions"
        subtitle="What every Government and MFI staff role may create, read, update, delete, approve and export — feature by feature."
        breadcrumbs={[{ label: 'Administration', to: '/gov/admin' }, { label: 'Roles & permissions' }]}
        actions={perms.create && <Button icon={Plus} onClick={() => setModal({ kind: 'new' })}>New role</Button>}
      />

      <Alert tone="info" title="How roles are managed">
        Government roles apply to Central Bank and CIC staff. MFI role templates are defined here by CIC and the Central Bank; each MFI administrator assigns them to their own staff and cannot add permissions.
      </Alert>

      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <StatCard label="Roles in use" value={live.length} icon={ShieldCheck} tone="navy" asOf={asOf}
          definition="Active and disabled roles across the Government Portal and MFI templates. Deleted roles are kept only in the audit history." />
        <StatCard label="Custom roles" value={live.filter((r) => !r.system).length} icon={KeyRound} tone="teal" asOf={asOf}
          definition="Roles created by administrators in addition to the system roles delivered with the platform." />
        <StatCard label="Users assigned" value={assigned} icon={Users} tone="warm" asOf={asOf}
          definition="Staff accounts (Government and MFI) holding one of these roles." />
        <StatCard label="Pending changes" value={pending.length} icon={Clock} tone="violet" asOf={asOf}
          definition="Role changes awaiting approval by a second administrator. They take effect only once approved." />
      </div>

      <MakerCheckerBanner maker={user?.name} checker={checker}
        note="Creating, changing, disabling or deleting a role is saved as a pending request and takes effect only after a different administrator approves it." />

      <Card>
        <Tabs className="px-4" value={tab} onChange={setTab}
          tabs={TABS.map((t) => ({ ...t, count: t.id === 'overview' ? undefined : counts[t.id] }))} />
        {tab === 'overview' ? (
          <>
            <div className="flex gap-1 px-4 pt-4" role="group" aria-label="Portal">
              {[['gov', 'Government roles'], ['mfi', 'MFI role templates']].map(([id, label]) => (
                <Button key={id} size="sm" variant={overviewPortal === id ? 'primary' : 'outline'} aria-pressed={overviewPortal === id} onClick={() => setOverviewPortal(id)}>{label}</Button>
              ))}
            </div>
            <PermissionHeatmap roles={live.filter((r) => r.portal === portalOf)} portal={portalOf} />
          </>
        ) : (
          <RolesTable
            rows={rowsFor(tab)}
            portal={tab}
            perms={perms}
            pendingFor={pendingFor}
            onClone={(role) => setModal({ kind: 'new', role })}
            onToggle={(role) => setModal({ kind: 'toggle', role })}
            onDelete={(role) => setModal({ kind: 'delete', role })}
          />
        )}
      </Card>

      <NewRoleModal open={modal?.kind === 'new'} cloneFrom={modal?.role} defaultPortal={tab === 'mfi' ? 'mfi' : 'gov'} onClose={() => setModal(null)} />
      <ConfirmChangeModal
        open={modal?.kind === 'toggle' || modal?.kind === 'delete'}
        danger={modal?.kind === 'delete' || modal?.role?.status === 'Active'}
        title={modal?.kind === 'delete' ? `Delete “${modal?.role?.name}”` : `${modal?.role?.status === 'Disabled' ? 'Enable' : 'Disable'} “${modal?.role?.name}”`}
        body={modal?.kind === 'delete'
          ? <p>This custom role has no users. Once approved it is removed from the role list; its definition and history remain in the audit log.</p>
          : modal?.role?.status === 'Disabled'
            ? <p>Users holding this role regain its permissions as soon as the request is approved.</p>
            : <p>Users holding this role ({DEMO_USERS.filter((u) => u.role === modal?.role?.id).length}) lose all of its permissions once the request is approved.</p>}
        maker={user?.name}
        checker={checker}
        onCancel={() => setModal(null)}
        onConfirm={submitStatus}
      />
    </div>
  );
}
