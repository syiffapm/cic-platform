import { useState } from 'react';
import { Ban, Fingerprint, UserMinus, UserPlus } from 'lucide-react';
import { Alert, Badge, Button, Card, DataTable, Input, MakerCheckerBanner, Modal, PageHeader, useToast } from '@/components/ui';
import { useStore } from '@/context/StoreContext';
import { nowStamp, patchIn, useMfi, useTenant } from '../../components/MfiState';
import { PermButton, ViewOnlyBanner } from '../../components/access';
import RolePicker, { useMfiRoles } from '../../components/RolePicker';
import RoleMatrix from '../../components/RoleMatrix';
import ConfirmDialog from '../../components/ConfirmDialog';

/** Own-tenant user management. Role templates come from CIC / Central Bank; role changes are dual-controlled. */
export default function Users() {
  const { user, tenant, institution } = useTenant();
  const { users, update } = useMfi();
  const { add, logAudit } = useStore();
  const { active, all, nameOf } = useMfiRoles();
  const toast = useToast();
  const [invite, setInvite] = useState(null);
  const [roleEdit, setRoleEdit] = useState(null);
  const [removing, setRemoving] = useState(null);

  const own = users.filter((u) => u.tenant === tenant && u.status !== 'Removed');
  const domain = user.email?.split('@')[1] ?? 'pgmf.org.mm';
  const audit = (action, target, outcome = 'Success') => logAudit({ actor: user.name, role: user.role, tenant, action, module: 'IAM', target, outcome });
  const roleDisabled = (id) => all.find((r) => r.id === id)?.status === 'Disabled';

  const sendInvite = () => {
    const id = `U-M${Math.floor(100 + Math.random() * 800)}`;
    update('users', (list) => [...list, { id, tenant, name: invite.name, email: invite.email, role: invite.role, branch: invite.branch || 'Head office', status: 'Invited', lastLogin: null, mfa: 'Not enrolled' }]);
    audit('USER_INVITE', `${invite.email} as ${nameOf(invite.role)}`);
    toast(`Invitation sent to ${invite.email} (expires in 72 h)`, 'success');
    setInvite(null);
  };

  const requestRole = () => {
    const target = own.find((u) => u.id === roleEdit.id);
    add('approvals', {
      id: `APR-${Math.floor(5700 + Math.random() * 200)}`, type: 'Role change', module: `MFI · ${institution?.short} users`,
      summary: `${target.name}: ${nameOf(target.role)} → ${nameOf(roleEdit.role)}`, maker: user.name, makerRole: user.role, checkerRole: 'mfi_admin (second administrator)',
      status: 'Pending', createdAt: nowStamp(), payload: { userId: target.id, tenant, from: target.role, to: roleEdit.role },
    });
    update('users', patchIn(target.id, { pendingRole: roleEdit.role }));
    audit('ROLE_CHANGE_REQUEST', target.id, 'Pending approval');
    toast('Role change saved as pending — a second administrator must approve', 'info');
    setRoleEdit(null);
  };

  const toggleSuspend = (u) => {
    const next = u.status === 'Suspended' ? 'Active' : 'Suspended';
    update('users', patchIn(u.id, { status: next }));
    audit(next === 'Suspended' ? 'USER_SUSPEND' : 'USER_REACTIVATE', u.id);
    toast(`${u.name} ${next === 'Suspended' ? 'suspended — sessions revoked' : 'reactivated'}`, next === 'Suspended' ? 'warning' : 'success');
  };

  const mfaReset = (u) => {
    update('users', patchIn(u.id, { mfaResetRequested: nowStamp() }));
    audit('MFA_RESET_REQUEST', u.id, 'Sent to CIC Security');
    toast(`MFA reset request for ${u.name} sent to CIC Security Administration`, 'info');
  };

  const remove = () => {
    update('users', patchIn(removing.id, { status: 'Removed', removedAt: nowStamp() }));
    audit(removing.status === 'Invited' ? 'USER_INVITE_CANCEL' : 'USER_REMOVE', removing.id);
    toast(`${removing.name} removed — access revoked, history kept in the audit trail`, 'warning');
    setRemoving(null);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Users & roles"
        subtitle={`Users of ${institution?.name}. You can only see and manage accounts in your own institution (${tenant}).`}
        actions={<PermButton feature="mfi.users" action="create" what="invite users" icon={UserPlus} onClick={() => setInvite({ name: '', email: '', role: active.find((r) => r.id === 'mfi_officer')?.id ?? active[0]?.id, branch: '' })}>Invite user</PermButton>}
      />
      <ViewOnlyBanner feature="mfi.users" />
      <Alert tone="info" title="Roles are set by CIC and the Central Bank">Roles and their permissions are set by CIC and the Central Bank. You assign them to your staff.</Alert>
      <MakerCheckerBanner maker={user.name} checker="a second MFI Administrator" note="Role changes are saved as pending requests and take effect after a second administrator approves them." />

      <Card>
        <DataTable
          rows={own}
          searchKeys={['name', 'email', 'branch', 'role']}
          emptyTitle="No users match this search"
          columns={[
            { key: 'name', header: 'User', sortable: true, render: (u) => <>{u.name}{u.id === user.id && <Badge tone="navy" className="ml-1.5">You</Badge>}<span className="block text-[11px] text-slate-500">{u.email}</span></> },
            {
              key: 'role', header: 'Role', render: (u) => (
                <>
                  {nameOf(u.role)}
                  {roleDisabled(u.role) && <span className="block text-[11px] text-red-600">Role disabled by CIC — no access</span>}
                  {u.pendingRole && <span className="block text-[11px] text-violet-700">Pending → {nameOf(u.pendingRole)}</span>}
                </>
              ),
            },
            { key: 'branch', header: 'Branch' },
            { key: 'status', header: 'Status', render: (u) => <Badge status={u.status} tone={u.status === 'Invited' ? 'blue' : undefined} /> },
            { key: 'mfa', header: 'MFA', render: (u) => <span className="text-xs">{u.mfa}{u.mfaResetRequested && <span className="block text-[11px] text-amber-700">Reset requested</span>}</span> },
            { key: 'lastLogin', header: 'Last sign-in', render: (u) => u.lastLogin ?? '—' },
            {
              key: 'actions', header: '', className: 'text-right', render: (u) => (u.id === user.id ? <span className="text-[11px] text-slate-500">Own account</span> : (
                <div className="flex flex-wrap justify-end gap-1">
                  <PermButton feature="mfi.users" action="update" what="change user roles" size="sm" variant="ghost" onClick={() => setRoleEdit({ id: u.id, role: u.role })} disabled={!!u.pendingRole}>Change role</PermButton>
                  <PermButton hide feature="mfi.users" action="update" what="reset MFA" size="sm" variant="ghost" icon={Fingerprint} onClick={() => mfaReset(u)} aria-label={`Request MFA reset for ${u.name}`}>MFA</PermButton>
                  <PermButton hide feature="mfi.users" action="update" what="suspend users" size="sm" variant="ghost" icon={Ban} onClick={() => toggleSuspend(u)}>{u.status === 'Suspended' ? 'Reactivate' : 'Suspend'}</PermButton>
                  <PermButton feature="mfi.users" action="delete" what="remove users" size="sm" variant="ghost" icon={UserMinus} className="text-red-700" onClick={() => setRemoving(u)} aria-label={`Remove ${u.name}`}>Remove</PermButton>
                </div>
              )),
            },
          ]}
        />
      </Card>

      <RoleMatrix />

      <Modal open={!!invite} onClose={() => setInvite(null)} size="lg" title="Invite user" subtitle="The user receives an activation link and must enrol MFA on first sign-in." footer={<><Button variant="outline" onClick={() => setInvite(null)}>Cancel</Button><Button disabled={!invite?.name || !invite?.role || !new RegExp(`^[^@\\s]+@${domain.replace(/\./g, '\\.')}$`, 'i').test(invite?.email ?? '')} onClick={sendInvite}>Send invitation</Button></>}>
        {invite && (
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-3">
              <Input label="Full name" required value={invite.name} onChange={(e) => setInvite({ ...invite, name: e.target.value })} />
              <Input label="Work email" required type="email" value={invite.email} onChange={(e) => setInvite({ ...invite, email: e.target.value })} placeholder={`name@${domain}`} hint="Only your institution's domain is allowed." />
              <Input label="Branch" value={invite.branch} onChange={(e) => setInvite({ ...invite, branch: e.target.value })} placeholder="Head office" />
            </div>
            <RolePicker value={invite.role} onChange={(role) => setInvite({ ...invite, role })} />
          </div>
        )}
      </Modal>

      <Modal open={!!roleEdit} onClose={() => setRoleEdit(null)} size="lg" title="Request role change" subtitle={own.find((u) => u.id === roleEdit?.id)?.name} footer={<><Button variant="outline" onClick={() => setRoleEdit(null)}>Cancel</Button><Button onClick={requestRole} disabled={own.find((u) => u.id === roleEdit?.id)?.role === roleEdit?.role}>Submit for approval</Button></>}>
        {roleEdit && (
          <div className="space-y-4">
            <RolePicker label="New role" value={roleEdit.role} current={own.find((u) => u.id === roleEdit.id)?.role} onChange={(role) => setRoleEdit({ ...roleEdit, role })} />
            <MakerCheckerBanner note="This creates a pending approval. The user keeps the current role until a second administrator approves." />
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={!!removing}
        onClose={() => setRemoving(null)}
        title={`Remove ${removing?.name ?? ''}?`}
        subtitle={removing ? `${removing.email} · ${nameOf(removing.role)}` : undefined}
        confirmLabel={removing?.status === 'Invited' ? 'Cancel invitation' : 'Remove user'}
        confirmIcon={UserMinus}
        onConfirm={remove}
      >
        <p>The account is closed and all sessions and API tokens issued to this user are revoked immediately.</p>
        <p className="text-xs text-slate-500">Their past actions stay in the audit trail. To give access again, send a new invitation.</p>
      </ConfirmDialog>
    </div>
  );
}
