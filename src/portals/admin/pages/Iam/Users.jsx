import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ClipboardCheck, Lock, ShieldCheck, UserCheck, UserPlus, UserX } from 'lucide-react';
import { Badge, Button, Card, CardHeader, DataTable, PageHeader, Select, StatCard, Tabs, useToast } from '@/components/ui';
import { AS_OF } from '@/data/kpis';
import { useStore } from '@/context/StoreContext';
import { roleName } from '@/data/roles';
import ConfirmReasonModal from '@/portals/government/components/ConfirmReasonModal';
import { useAdmin } from '../../lib/useAdmin';
import { useAdminCollection } from '../../context/AdminStore';
import PendingApprovals from '../../components/PendingApprovals';
import { TODAY, USER_PORTALS, USER_PORTAL_LABELS, USER_SEED, USER_STATUSES, userPortal } from '../../data/iam';
import { ChangeRoleModal, CreateUserModal, scopeText } from './components/UserModals';
import BreakGlassCard from './components/BreakGlassCard';
import CitizenAccounts from './components/CitizenAccounts';
import { CITIZEN_OPS } from '../../data/citizens';

const STATUS_TONE = { Active: 'green', 'Dormant — auto-disabled': 'slate', Locked: 'red', Disabled: 'slate', 'Sealed (break-glass)': 'violet' };

export default function Users() {
  const { user, role, can, audit, requestApproval } = useAdmin('adm.users');
  const { roles = [] } = useStore();
  const roleOf = (id) => roles.find((x) => x.id === id);
  const readOnly = !can('update');
  const toast = useToast();
  const [users] = useAdminCollection('adminUsers', USER_SEED);
  const [portal, setPortal] = useState('');
  const [params, setParams] = useSearchParams();
  const [status, setStatus] = useState(() => (USER_STATUSES.includes(params.get('status')) ? params.get('status') : ''));
  const [creating, setCreating] = useState(false);
  const [roleTarget, setRoleTarget] = useState(null);
  const tab = params.get('tab') === 'citizens' ? 'citizens' : 'staff';
  const checkerRole = role === 'adm_security' ? 'adm_super' : 'adm_security';

  const accounts = users.filter((u) => !u.breakGlass);
  const breakGlass = users.filter((u) => u.breakGlass);
  const rows = useMemo(() => accounts
    .map((u) => ({ ...u, portal: userPortal(u) }))
    .filter((u) => (!portal || u.portal === portal) && (!status || u.status === status))
    .map((u) => {
      const def = roles.find((x) => x.id === u.role);
      return { ...u, roleLabel: def?.name ?? roleName(u.role), roleOrg: def?.org, roleDisabled: def?.status === 'Disabled', scopeLabel: scopeText(u, def), scopeNarrowed: Array.isArray(u.scope?.regions), portalLabel: USER_PORTAL_LABELS[u.portal] };
    }), [accounts, portal, status, roles]);

  const active = accounts.filter((u) => u.status === 'Active');
  const mfaPct = active.length ? Math.round((active.filter((u) => u.mfa).length / active.length) * 100) : 0;
  const dormant = accounts.filter((u) => u.status.startsWith('Dormant')).length;
  const locked = accounts.filter((u) => u.status === 'Locked').length;
  const recertDue = accounts.filter((u) => u.recertDue !== '—' && u.recertDue <= '2026-10-31').length;

  const effect = (id, changes) => ({ target: 'admin', collection: 'adminUsers', op: 'patch', id, changes });

  const createUser = (form) => {
    const id = `U-${form.portal === 'gov' ? 'G' : 'M'}${String(Date.now()).slice(-4)}`;
    const item = { id, name: form.name.trim(), email: form.email.trim().toLowerCase(), portal: form.portal, role: form.role, tenant: form.portal === 'mfi' ? form.tenant : '—', ...(Array.isArray(form.regions) ? { scope: { regions: form.regions } } : {}), status: 'Active', mfa: false, lastLogin: '—', failedLogins: 0, recertDue: '2027-03-25', createdAt: TODAY, note: 'MFA enrolment pending' };
    const roleLabel = roleOf(form.role)?.name ?? roleName(form.role);
    const a = requestApproval({
      type: 'User creation', checkerRole, summary: `Create ${USER_PORTAL_LABELS[form.portal]} user ${item.name} as ${roleLabel}`,
      payload: { diff: [{ field: 'User', from: '—', to: `${item.name} <${item.email}>` }, { field: 'Role', from: '—', to: roleLabel }, { field: form.portal === 'mfi' ? 'Institution' : 'Regional scope', from: '—', to: scopeText(item, roleOf(form.role)) }], effect: { target: 'admin', collection: 'adminUsers', op: 'add', item } },
    });
    setCreating(false);
    toast(`${a.id} sent to ${roleName(checkerRole)} for approval`, 'success');
  };

  const changeRole = (form, reason, diff) => {
    const u = roleTarget;
    const changes = { role: form.role, portal: u.portal };
    if (u.portal === 'mfi') changes.tenant = form.tenant;
    else changes.scope = { ...(u.scope ?? {}), regions: Array.isArray(form.regions) ? form.regions : undefined };
    const a = requestApproval({
      type: diff.some((d) => d.field === 'Role') ? 'Role change' : 'Access scope change', checkerRole,
      summary: `${diff.map((d) => d.field).join(' and ')} for ${u.name} (${u.id}): ${diff.map((d) => d.to).join(' · ')}`,
      payload: { reason, diff, effect: effect(u.id, changes) },
    });
    setRoleTarget(null);
    toast(`${a.id} sent for approval`, 'success');
  };

  const reactivate = (u) => {
    const a = requestApproval({
      type: 'User reactivation', checkerRole, summary: `Reactivate ${u.name} (${u.id}) — currently ${u.status}`,
      payload: { diff: [{ field: 'Status', from: u.status, to: 'Active' }, { field: 'Failed logins', from: String(u.failedLogins), to: '0' }], effect: effect(u.id, { status: 'Active', failedLogins: 0, note: `Reactivated ${TODAY}; must sign in within 14 days` }) },
    });
    toast(`${a.id} sent for approval`, 'success');
  };

  const [disabling, setDisabling] = useState(null);
  const disable = (u, reason) => {
    const a = requestApproval({
      type: 'User disable', checkerRole, summary: `Disable ${u.name} (${u.id})`,
      payload: { reason, diff: [{ field: 'Status', from: u.status, to: 'Disabled' }, { field: 'Reason', from: '—', to: reason }], effect: effect(u.id, { status: 'Disabled' }) },
    });
    toast(`${a.id} sent for approval`, 'success');
  };

  const requestBreakGlass = (acct, form) => {
    audit('BREAK_GLASS_REQUEST', `${acct.name} · ${form.ticket}`, { outcome: 'SIEM alert raised; CISO paged', purpose: form.incident });
    const a = requestApproval({
      type: 'Break-glass activation', checkerRole: role === 'adm_super' ? 'adm_security' : 'adm_super', summary: `Activate ${acct.name} for ${form.hours} h — ${form.ticket}`,
      payload: { reason: form.incident, diff: [{ field: 'Status', from: acct.status, to: `Activated (${form.hours} h window)` }], effect: effect(acct.id, { status: `Activated (${form.hours} h window)`, lastUse: `${TODAY} — ${form.ticket} ${form.incident}` }) },
    });
    toast(`${a.id}: break-glass request raised — SIEM alert sent`, 'warning');
  };

  const columns = [
    { key: 'name', header: 'User', sortable: true, render: (u) => (
      <div><p className="font-medium text-slate-800">{u.name}</p><p className="text-[11px] text-slate-500">{u.id} · {u.email}</p></div>
    ) },
    { key: 'portalLabel', header: 'Portal', sortable: true, render: (u) => <Badge tone="navy">{u.portalLabel}</Badge> },
    { key: 'roleLabel', header: 'Role', sortable: true, render: (u) => (
      <div><p className="text-sm text-slate-800">{u.roleLabel}</p><p className="text-[11px] text-slate-500">{u.roleOrg ?? '—'}{u.roleDisabled ? ' · role disabled' : ''}</p></div>
    ) },
    { key: 'scopeLabel', header: 'Scope', render: (u) => (
      <span className={u.scopeNarrowed ? 'inline-flex rounded-full bg-violet-50 px-2 py-0.5 text-[11px] font-medium text-violet-800' : 'text-xs text-slate-600'}>{u.scopeLabel}</span>
    ) },
    { key: 'mfa', header: 'MFA', render: (u) => (u.mfa ? <Badge tone="green">Enrolled</Badge> : <Badge tone="amber">Pending</Badge>) },
    { key: 'lastLogin', header: 'Last login', sortable: true, className: 'whitespace-nowrap' },
    { key: 'status', header: 'Status', sortable: true, render: (u) => (
      <div><Badge tone={STATUS_TONE[u.status] ?? 'blue'}>{u.status}</Badge>{u.note && <p className="mt-1 max-w-[16rem] text-[11px] text-slate-500">{u.note}</p>}</div>
    ) },
    { key: 'actions', header: <span className="relative"><span className="sr-only">Actions</span></span>, render: (u) => (
      <div className="flex justify-end gap-1.5">
        {u.status === 'Active' ? (
          <>
            <Button size="sm" variant="outline" disabled={readOnly || u.portal === 'borrower'} onClick={() => setRoleTarget(u)}>Edit access</Button>
            <Button size="sm" variant="ghost" disabled={!can('delete') || u.id === user?.id} onClick={() => setDisabling(u)} aria-label={`Disable ${u.name}`}>Disable</Button>
          </>
        ) : (
          <Button size="sm" variant="teal" disabled={readOnly} onClick={() => reactivate(u)}>Reactivate</Button>
        )}
      </div>
    ) },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Users & access" subtitle="Staff accounts for the Government and MFI portals, and citizen accounts for the Borrower portal — every change is dual-controlled"
        actions={tab === 'staff' && <Button icon={UserPlus} disabled={!can('create')} onClick={() => setCreating(true)}>Create user</Button>} />

      <Tabs tabs={[{ id: 'staff', label: 'Staff accounts', count: accounts.length }, { id: 'citizens', label: 'Citizen accounts', count: CITIZEN_OPS.totalAccounts.toLocaleString('en-US') }]}
        value={tab} onChange={(id) => setParams(id === 'citizens' ? { tab: 'citizens' } : {}, { replace: true })} />

      {tab === 'citizens' ? <CitizenAccounts /> : (
      <>

      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-5">
        <StatCard label="Active accounts" value={active.length} icon={UserCheck} tone="navy" definition="Accounts with status Active across all portals (excl. break-glass)." asOf={AS_OF} />
        <StatCard label="MFA enrolled" value={`${mfaPct}%`} icon={ShieldCheck} tone="teal" definition="Share of active accounts with a verified MFA factor." asOf={AS_OF} />
        <StatCard label="Dormant auto-disabled" value={dormant} icon={UserX} tone="warm" definition="Accounts disabled automatically after 90 days without sign-in." asOf={AS_OF} />
        <StatCard label="Locked" value={locked} icon={Lock} tone="red" definition="Accounts locked after 5 consecutive failed sign-ins." asOf={AS_OF} />
        <StatCard label="Recertification due" value={recertDue} icon={ClipboardCheck} tone="violet" definition="Accounts whose 6-monthly access recertification falls due by 31 Oct 2026." asOf={AS_OF} />
      </div>

      <Card>
        <CardHeader title="User directory" subtitle={`${rows.length} of ${accounts.length} accounts`} />
        <DataTable columns={columns} rows={rows} searchKeys={['name', 'email', 'id', 'roleLabel', 'scopeLabel', 'tenant']} pageSize={10}
          toolbar={(
            <>
              <Select aria-label="Filter by portal" value={portal} onChange={(e) => setPortal(e.target.value)} placeholder="All portals" options={USER_PORTALS.map((p) => ({ value: p, label: USER_PORTAL_LABELS[p] }))} />
              <Select aria-label="Filter by status" value={status} onChange={(e) => setStatus(e.target.value)} placeholder="All statuses" options={USER_STATUSES.filter((s) => !s.startsWith('Sealed'))} />
            </>
          )} />
      </Card>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <BreakGlassCard accounts={breakGlass} readOnly={readOnly} maker={user?.name} checkerRole={role === 'adm_super' ? 'adm_security' : 'adm_super'} onRequest={requestBreakGlass} />
        <PendingApprovals moduleLabel="Users, roles & access" title="Pending IAM approvals" />
      </div>

      </>
      )}

      <CreateUserModal open={creating} onClose={() => setCreating(false)} onSubmit={createUser} maker={user?.name} checkerRole={checkerRole} existingEmails={users.map((u) => u.email.toLowerCase())} />
      <ConfirmReasonModal
        open={!!disabling}
        title={`Disable ${disabling?.name ?? ''}`}
        subtitle={disabling ? `${disabling.id} · ${disabling.email}` : ''}
        body={<p>The account can no longer sign in once a second administrator approves this request.</p>}
        confirmLabel="Submit for approval"
        reasonLabel="Reason for disabling"
        maker={user?.name}
        checker={roleName(checkerRole)}
        onCancel={() => setDisabling(null)}
        onConfirm={(reason) => { disable(disabling, reason); setDisabling(null); }}
      />
      <ChangeRoleModal user={roleTarget} onClose={() => setRoleTarget(null)} onSubmit={changeRole} maker={user?.name} checkerRole={checkerRole} />
    </div>
  );
}
