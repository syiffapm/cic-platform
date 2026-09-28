import { useEffect, useMemo, useState } from 'react';
import { Alert, Button, Input, MakerCheckerBanner, Modal, Select, Textarea, useToast } from '@/components/ui';
import { useStore } from '@/context/StoreContext';
import { roleName } from '@/data/roles';
import { featureCount, permissionDiff, slug } from './rbacModel';
import { useRoleRequests } from './useRoleRequests';

const DEFAULT_ORG = { gov: 'Central Bank of Myanmar', mfi: 'Licensed MFI' };
const DEFAULT_SCOPE = {
  gov: { data: 'Institution data; no borrower-level personal data', regions: 'All regions' },
  mfi: { data: 'Own institution only', regions: 'Own institution' },
};

/** Create a role (blank or cloned). The role exists only after a checker approves the request. */
export default function NewRoleModal({ open, onClose, cloneFrom, defaultPortal = 'gov' }) {
  const { roles = [] } = useStore();
  const { request, stamp, user, checkerRole, pending } = useRoleRequests();
  const toast = useToast();
  const [form, setForm] = useState({});
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    const portal = cloneFrom?.portal ?? defaultPortal;
    setForm({
      portal,
      name: cloneFrom ? `${cloneFrom.name} (copy)` : '',
      org: cloneFrom?.org ?? DEFAULT_ORG[portal],
      description: cloneFrom?.description ?? '',
      source: cloneFrom?.id ?? '',
    });
    setError('');
  }, [open, cloneFrom, defaultPortal]);

  const sources = useMemo(
    () => roles.filter((r) => r.portal === form.portal && r.status !== 'Retired'),
    [roles, form.portal],
  );
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const setPortal = (e) => {
    const portal = e.target.value;
    setForm((f) => ({ ...f, portal, source: '', org: DEFAULT_ORG[portal] }));
  };

  const submit = () => {
    const name = form.name?.trim();
    if (!name || name.length < 4) { setError('Enter a role name of at least 4 characters.'); return; }
    if (!form.description?.trim()) { setError('Describe what this role is for.'); return; }
    const id = `custom_${slug(name)}`;
    const taken = roles.some((r) => r.id === id || r.name.toLowerCase() === name.toLowerCase())
      || pending.some((a) => a.payload?.roleId === id);
    if (taken) { setError('A role with this name already exists or is awaiting approval.'); return; }

    const source = roles.find((r) => r.id === form.source);
    const permissions = { ...(source?.permissions ?? {}) };
    const item = {
      id, portal: form.portal, org: form.org.trim() || DEFAULT_ORG[form.portal], name, description: form.description.trim(),
      system: false, scope: { ...(source?.scope ?? DEFAULT_SCOPE[form.portal]) }, permissions,
      status: 'Active', version: 1, ...stamp(),
    };
    const diff = [
      `New ${form.portal === 'mfi' ? 'MFI role template' : 'Government role'}: ${name} (${item.org})`,
      source ? `Permissions cloned from ${source.name} — ${featureCount(permissions)} features` : 'Starts with no permissions',
      ...permissionDiff({}, permissions).map((d) => d.text),
    ];
    const apr = request({
      type: 'Create role', roleId: id, summary: `Create role “${name}”${source ? ` from ${source.name}` : ''}`,
      diff, effect: { target: 'store', collection: 'roles', op: 'add', id, item },
    });
    toast(`${apr.id} sent for approval by ${roleName(checkerRole)}`, 'success');
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      title={cloneFrom ? `Clone “${cloneFrom.name}”` : 'New role'}
      subtitle="The role becomes available for assignment once a second administrator approves it."
      footer={<><Button variant="ghost" onClick={onClose}>Cancel</Button><Button onClick={submit}>Submit for approval</Button></>}
    >
      <div className="space-y-4">
        {error && <Alert tone="danger">{error}</Alert>}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Select label="Portal" value={form.portal ?? 'gov'} onChange={setPortal} disabled={!!cloneFrom}
            options={[{ value: 'gov', label: 'Government role' }, { value: 'mfi', label: 'MFI role template' }]} />
          <Input label="Organisation" value={form.org ?? ''} onChange={set('org')} required />
        </div>
        <Input label="Role name" value={form.name ?? ''} onChange={set('name')} required maxLength={60}
          hint="Shown to administrators when assigning roles, e.g. “Township Examiner — Upper Myanmar”." />
        <Textarea label="Description" rows={3} value={form.description ?? ''} onChange={set('description')} required />
        <Select label="Start from" value={form.source ?? ''} onChange={set('source')}
          options={[{ value: '', label: 'Blank — no permissions' }, ...sources.map((r) => ({ value: r.id, label: `Copy of ${r.name}` }))]}
          hint="Permissions and data scope are copied; you can refine them on the role page after approval." />
        {form.portal === 'mfi' && (
          <Alert tone="info">MFI role templates always limit data to the user’s own institution. MFI administrators can assign this template to their staff but cannot add permissions to it.</Alert>
        )}
        <MakerCheckerBanner maker={user?.name} checker={roleName(checkerRole)} />
      </div>
    </Modal>
  );
}
