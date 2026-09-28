import { useEffect, useMemo, useState } from 'react';
import { Alert, Button, Checkbox, Input, MakerCheckerBanner, Modal, Select } from '@/components/ui';
import { useStore } from '@/context/StoreContext';
import { REGIONS } from '@/data/reference';
import { roleName } from '@/data/roles';
import { TENANTS, USER_PORTALS, USER_PORTAL_LABELS, userPortal } from '../../../data/iam';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Active roles for a portal, from the Roles & permissions catalogue. */
export function useAssignableRoles(portal) {
  const { roles = [] } = useStore();
  return useMemo(() => roles.filter((r) => r.portal === portal && r.status !== 'Disabled'), [roles, portal]);
}

/** Label for the data scope a user works under: named regions, own institution, or the role default. */
export function scopeText(u, role, tenants = TENANTS) {
  if (userPortal(u) === 'mfi') return tenants.find((t) => t.value === u.tenant)?.label ?? u.tenant ?? '—';
  const regions = Array.isArray(u.scope?.regions) ? u.scope.regions : role?.scope?.regions;
  return Array.isArray(regions) ? regions.join(', ') : (regions ?? 'All regions');
}

/** Role + scope fields shared by the create and edit dialogs. */
function AccessFields({ portal, value, onChange, touched, errors = {} }) {
  const roles = useAssignableRoles(portal);
  const role = roles.find((r) => r.id === value.role);
  const roleRegions = Array.isArray(role?.scope?.regions) ? role.scope.regions : null;
  const custom = Array.isArray(value.regions);
  const toggleRegion = (reg) => onChange({ regions: value.regions.includes(reg) ? value.regions.filter((r) => r !== reg) : [...value.regions, reg] });

  return (
    <div className="space-y-4">
      <Select label="Role" value={value.role} onChange={(e) => onChange({ role: e.target.value })}
        options={roles.map((r) => ({ value: r.id, label: `${r.name} · ${r.org}` }))} placeholder="Select role" error={touched && errors.role} />
      {role && <p className="-mt-2 text-xs text-slate-500">{role.description} Data scope: {role.scope?.data}.</p>}
      {portal === 'mfi' && (
        <Select label="Institution" required value={value.tenant} onChange={(e) => onChange({ tenant: e.target.value })} options={TENANTS} placeholder="Select MFI"
          error={touched && errors.tenant} hint="Users of an MFI only ever see their own institution's data." />
      )}
      {portal === 'gov' && (
        <fieldset className="rounded-lg border border-slate-200 p-3">
          <legend className="px-1 text-xs font-semibold text-slate-700">Regional scope</legend>
          <div className="flex flex-wrap gap-4 text-sm">
            <label className="flex items-center gap-2">
              <input type="radio" name="scope" checked={!custom} onChange={() => onChange({ regions: null })} />
              Role default ({roleRegions ? roleRegions.join(', ') : role?.scope?.regions ?? 'All regions'})
            </label>
            <label className="flex items-center gap-2">
              <input type="radio" name="scope" checked={custom} onChange={() => onChange({ regions: roleRegions ?? [] })} />
              Selected regions only
            </label>
          </div>
          {custom && (
            <div className="mt-3 grid grid-cols-2 gap-1.5 sm:grid-cols-3">
              {REGIONS.map((reg) => <Checkbox key={reg} label={reg} checked={value.regions.includes(reg)} onChange={() => toggleRegion(reg)} />)}
            </div>
          )}
          {touched && errors.regions && <p className="mt-2 text-xs text-red-600">{errors.regions}</p>}
          <p className="mt-2 text-[11px] text-slate-500">Institutions, cases, complaints, disputes and township data are limited to these regions. A scope can only narrow what the role allows.</p>
        </fieldset>
      )}
    </div>
  );
}

const accessErrors = (portal, v) => ({
  role: !v.role ? 'Select a role' : null,
  tenant: portal === 'mfi' && !v.tenant ? 'Institution is required for MFI users' : null,
  regions: portal === 'gov' && Array.isArray(v.regions) && v.regions.length === 0 ? 'Select at least one region' : null,
});

/** Create-user request: saved as a pending maker-checker item. */
export function CreateUserModal({ open, onClose, onSubmit, maker, checkerRole, existingEmails, portals = USER_PORTALS.filter((p) => p !== 'borrower') }) {
  const empty = { name: '', email: '', portal: portals[0] ?? 'gov', role: '', tenant: '', regions: null };
  const [form, setForm] = useState(empty);
  const [touched, setTouched] = useState(false);
  useEffect(() => { if (open) { setForm(empty); setTouched(false); } }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  const set = (changes) => setForm((f) => {
    const next = { ...f, ...changes };
    if ('portal' in changes && changes.portal !== f.portal) Object.assign(next, { role: '', tenant: changes.portal === 'mfi' ? 'MFI-001' : '', regions: null });
    return next;
  });
  const errors = {
    name: form.name.trim().length < 3 ? 'Enter the full name' : null,
    email: !EMAIL_RE.test(form.email) ? 'Enter a valid email' : existingEmails.includes(form.email.toLowerCase()) ? 'A user with this email already exists' : null,
    ...accessErrors(form.portal, form),
  };
  const valid = !Object.values(errors).some(Boolean);
  const submit = () => { setTouched(true); if (valid) onSubmit(form); };

  return (
    <Modal open={open} onClose={onClose} title="Create user" subtitle="New account request — activated only after checker approval" size="md"
      footer={<><Button variant="outline" onClick={onClose}>Cancel</Button><Button onClick={submit}>Submit for approval</Button></>}>
      <div className="space-y-4">
        <MakerCheckerBanner maker={maker} checker={roleName(checkerRole)} />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input label="Full name" required value={form.name} onChange={(e) => set({ name: e.target.value })} error={touched && errors.name} />
          <Input label="Email" type="email" required value={form.email} onChange={(e) => set({ email: e.target.value })} error={touched && errors.email} />
          <Select label="Portal" className="sm:col-span-2" value={form.portal} onChange={(e) => set({ portal: e.target.value })} options={portals.map((p) => ({ value: p, label: USER_PORTAL_LABELS[p] }))} />
        </div>
        <AccessFields portal={form.portal} value={form} onChange={set} touched={touched} errors={errors} />
        <Alert tone="info">The user receives an activation link and must enrol MFA on first sign-in. Accounts are included in the next access recertification.</Alert>
      </div>
    </Modal>
  );
}

/** Role and scope change request with before/after diff. */
export function ChangeRoleModal({ user, onClose, onSubmit, maker, checkerRole }) {
  const { roles = [] } = useStore();
  const portal = userPortal(user);
  const [form, setForm] = useState({ role: '', tenant: '', regions: null });
  const [reason, setReason] = useState('');
  const [touched, setTouched] = useState(false);
  useEffect(() => {
    if (user) {
      setForm({ role: user.role, tenant: user.tenant, regions: Array.isArray(user.scope?.regions) ? user.scope.regions : null });
      setReason(''); setTouched(false);
    }
  }, [user]);
  if (!user) return null;

  const roleOf = (id) => roles.find((r) => r.id === id);
  const before = scopeText(user, roleOf(user.role));
  const after = scopeText({ ...user, tenant: form.tenant, scope: { ...(user.scope ?? {}), regions: form.regions ?? undefined } }, roleOf(form.role));
  const diff = [
    form.role !== user.role && { field: 'Role', from: roleName(user.role), to: roleOf(form.role)?.name ?? roleName(form.role) },
    before !== after && { field: portal === 'mfi' ? 'Institution' : 'Regional scope', from: before, to: after },
  ].filter(Boolean);
  const errors = accessErrors(portal, form);
  const valid = diff.length > 0 && reason.trim().length >= 5 && !Object.values(errors).some(Boolean);

  return (
    <Modal open={!!user} onClose={onClose} title={`Edit access · ${user.name}`} subtitle={`${user.id} · ${USER_PORTAL_LABELS[portal] ?? portal} portal`}
      footer={<><Button variant="outline" onClick={onClose}>Cancel</Button><Button disabled={!valid} onClick={() => { setTouched(true); if (valid) onSubmit(form, reason, diff); }}>Submit for approval</Button></>}>
      <div className="space-y-4">
        <MakerCheckerBanner maker={maker} checker={roleName(checkerRole)} />
        <AccessFields portal={portal} value={form} onChange={(c) => setForm((f) => ({ ...f, ...c }))} touched={touched} errors={errors} />
        <Input label="Justification" required value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. Transferred to the Mandalay regional office (HR memo 2026/114)" />
        {diff.length > 0 && (
          <div className="rounded-lg border border-slate-200 text-xs">
            <p className="border-b border-slate-100 bg-slate-50 px-3 py-2 font-semibold text-slate-600">Change preview</p>
            {diff.map((d) => (
              <div key={d.field} className="grid grid-cols-3 gap-2 px-3 py-2">
                <span className="text-slate-500">{d.field}</span>
                <span className="text-red-700 line-through">{d.from}</span>
                <span className="font-medium text-emerald-700">{d.to}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </Modal>
  );
}
