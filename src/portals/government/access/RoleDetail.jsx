import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Grid3x3, Lock, RotateCcw, Send } from 'lucide-react';
import { Alert, Badge, Button, Card, CardBody, CardHeader, EmptyState, MakerCheckerBanner, PageHeader, useToast } from '@/components/ui';
import { useStore } from '@/context/StoreContext';
import { roleName } from '@/data/roles';
import { formatDate } from '@/lib/format';
import ConfirmChangeModal from './ConfirmChangeModal';
import PermissionMatrix from './PermissionMatrix';
import RoleSidePanel from './RoleSidePanel';
import ScopeEditor from './ScopeEditor';
import { PORTAL_LABEL, cleanPermissions, permissionDiff, regionText, roleWarnings } from './rbacModel';
import { useRoleRequests } from './useRoleRequests';

const fromRole = (r) => ({ name: r.name, description: r.description, scope: { ...r.scope }, permissions: { ...r.permissions } });
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);

/** Lines describing everything that differs between the approved role and the draft. */
function buildDiff(role, draft, perms) {
  const lines = [];
  if (draft.name.trim() !== role.name) lines.push(`Name: ${role.name} → ${draft.name.trim()}`);
  if (draft.description.trim() !== role.description) lines.push('Description updated');
  if ((draft.scope.data ?? '') !== (role.scope?.data ?? '')) lines.push(`Data scope: ${role.scope?.data ?? '—'} → ${draft.scope.data}`);
  if (!same(draft.scope.regions, role.scope?.regions)) lines.push(`Regions: ${regionText(role.scope?.regions)} → ${regionText(draft.scope.regions)}`);
  return [...lines, ...permissionDiff(cleanPermissions(role.permissions), perms).map((d) => d.text)];
}

export default function RoleDetail() {
  const { id } = useParams();
  const { roles = [] } = useStore();
  const { can, user, isRoleAdmin, checkerRole, pendingFor, request, stamp } = useRoleRequests();
  const toast = useToast();
  const role = roles.find((r) => r.id === id);
  const [draft, setDraft] = useState(() => (role ? fromRole(role) : null));
  const [confirm, setConfirm] = useState(false);

  // Reload the draft whenever an approved change lands (new version) or another role is opened.
  useEffect(() => { if (role) setDraft(fromRole(role)); }, [role?.id, role?.version]); // eslint-disable-line react-hooks/exhaustive-deps

  const perms = useMemo(() => cleanPermissions(draft?.permissions), [draft]);
  const saved = useMemo(() => cleanPermissions(role?.permissions), [role]);
  const diff = useMemo(() => (role && draft ? buildDiff(role, draft, perms) : []), [role, draft, perms]);
  const warnings = useMemo(() => (role ? roleWarnings(perms, role.portal) : []), [perms, role]);

  if (!role || !draft || role.status === 'Retired') {
    return (
      <>
        <PageHeader title="Role not found" breadcrumbs={[{ label: 'Roles & permissions', to: '/gov/admin/access/roles' }, { label: id }]} />
        <Card><EmptyState title="This role does not exist or has been deleted" action={<Link to="/gov/admin/access/roles" className="text-sm font-medium text-primary hover:underline">Back to roles</Link>} /></Card>
      </>
    );
  }

  const pending = pendingFor(role.id);
  const systemLocked = role.system && !isRoleAdmin;
  const readOnly = !can('adm.roles', 'update') || systemLocked || !!pending;
  const lockReason = !can('adm.roles', 'update') ? 'Your role can view but not change role definitions.'
    : systemLocked ? 'System roles can be changed only by the Super Administrator or Security Administrator.'
      : pending ? `A change to this role (${pending.id}) is awaiting approval. Further edits are possible once it is decided.` : null;
  const regionsInvalid = Array.isArray(draft.scope.regions) && draft.scope.regions.length === 0;
  const changed = diff.length > 0;
  const checker = roleName(checkerRole);

  const submit = (reason) => {
    const changes = {
      permissions: perms, scope: draft.scope, description: draft.description.trim(),
      ...(role.system ? {} : { name: draft.name.trim() }), version: (role.version ?? 1) + 1, ...stamp(),
    };
    const apr = request({
      type: 'Change role permissions', roleId: role.id, summary: `Update “${role.name}” — ${diff.length} change${diff.length === 1 ? '' : 's'}`,
      diff: [...diff, ...warnings.map((w) => `Warning: ${w.title}`), `Justification: ${reason}`],
      effect: { target: 'store', collection: 'roles', op: 'patch', id: role.id, changes },
    });
    setConfirm(false);
    toast(`${apr.id} sent to ${checker} for approval`, 'success');
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={role.name}
        subtitle={role.description}
        breadcrumbs={[{ label: 'Administration', to: '/gov/admin' }, { label: 'Roles & permissions', to: '/gov/admin/access/roles' }, { label: role.name }]}
        actions={!readOnly && (
          <>
            <Button variant="outline" icon={RotateCcw} disabled={!changed} onClick={() => setDraft(fromRole(role))}>Discard changes</Button>
            <Button icon={Send} disabled={!changed || regionsInvalid || !draft.name.trim()} onClick={() => setConfirm(true)}>Submit changes</Button>
          </>
        )}
      />
      <div className="-mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-600">
        <Badge tone="navy">{PORTAL_LABEL[role.portal]}</Badge>
        <Badge tone={role.system ? 'slate' : 'teal'}>{role.system ? 'System role' : 'Custom role'}</Badge>
        <Badge status={role.status} />
        <span>{role.org}</span><span aria-hidden="true">·</span>
        <span>Version {role.version} · last changed {formatDate(role.updatedAt)} by {role.updatedBy}</span>
      </div>

      {lockReason && <Alert tone={pending ? 'warning' : 'info'} title={pending ? 'Pending approval' : 'Read-only'}>{lockReason}
        {pending && <ul className="mt-2 list-disc pl-5">{(pending.payload?.diff ?? []).slice(0, 8).map((d) => <li key={d}>{d}</li>)}</ul>}
      </Alert>}
      {role.status === 'Disabled' && <Alert tone="warning" title="This role is disabled">Users holding it currently have no access through this role.</Alert>}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="min-w-0 space-y-6">
          <ScopeEditor role={role} draft={draft} readOnly={readOnly} nameLocked={role.system} onChange={setDraft} />

          <Card>
            <CardHeader icon={Grid3x3} title="Permission matrix"
              subtitle="Tick what this role may do in each feature. Any action also grants Read; removing Read removes all access to that feature."
              action={readOnly && <Lock className="h-4 w-4 text-slate-500" aria-label="Read-only" />} />
            <CardBody className="space-y-4">
              {warnings.map((w) => <Alert key={w.title} tone={w.tone} title={w.title}>{w.text}</Alert>)}
              {changed && (
                <p className="flex flex-wrap items-center gap-3 text-xs text-slate-600">
                  <b>{diff.length} unsaved change{diff.length === 1 ? '' : 's'}</b>
                  <span className="inline-flex items-center gap-1"><span className="h-3 w-3 rounded bg-emerald-100 ring-1 ring-emerald-400" /> added</span>
                  <span className="inline-flex items-center gap-1"><span className="h-3 w-3 rounded bg-red-100 ring-1 ring-red-300" /> removed</span>
                </p>
              )}
              <PermissionMatrix portal={role.portal} perms={perms} saved={saved} readOnly={readOnly}
                onChange={(next) => setDraft((d) => ({ ...d, permissions: next }))} />
              {!readOnly && <MakerCheckerBanner maker={user?.name} checker={checker} />}
            </CardBody>
          </Card>
        </div>
        <RoleSidePanel role={role} perms={perms} changed={changed} />
      </div>

      <ConfirmChangeModal
        open={confirm}
        title={`Submit changes to “${role.name}”`}
        body={(
          <div>
            <p className="font-medium text-slate-800">Changes</p>
            <ul className="mt-1 max-h-56 list-disc space-y-0.5 overflow-y-auto pl-5 text-xs" tabIndex={0} role="region" aria-label="Changes in this request">{diff.map((d) => <li key={d}>{d}</li>)}</ul>
            {warnings.length > 0 && <Alert className="mt-3" tone="warning" title="Warnings will be shown to the approver">{warnings.map((w) => w.title).join('; ')}</Alert>}
          </div>
        )}
        maker={user?.name}
        checker={checker}
        onCancel={() => setConfirm(false)}
        onConfirm={submit}
      />
    </div>
  );
}
