import { useState } from 'react';
import { Filter, Plus } from 'lucide-react';
import { Badge, Button, Card, CardHeader, DataTable, Input, MakerCheckerBanner, Modal, Select } from '@/components/ui';
import { useStore } from '@/context/StoreContext';
import { roleName } from '@/data/roles';

const ATTRIBUTES = ['resource.tenant', 'mfi.region', 'request.purpose', 'request.consent_ref', 'now()', 'request.ip', 'report.subject_id', 'data.classification'];
const OPERATORS = ['=', '≠', '∈', '∉', '≤', '≥', 'required'];
const EFFECTS = ['Deny + log', 'Deny + alert SOC', 'Require step-up MFA', 'Require justification', 'Mask PII fields'];

/** Attribute-based access rules layered on top of RBAC . */
export default function AbacRules({ rules, readOnly, maker, checkerRole, onAdd }) {
  const { roles = [] } = useStore();
  const [open, setOpen] = useState(false);
  const empty = { name: '', appliesTo: 'mfi_officer', attribute: ATTRIBUTES[0], operator: '=', value: '', effect: EFFECTS[0] };
  const [form, setForm] = useState(empty);
  const valid = form.name.trim().length >= 4 && (form.operator === 'required' || form.value.trim().length > 0);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const columns = [
    { key: 'id', header: 'ID', className: 'font-mono text-xs' },
    { key: 'name', header: 'Rule', render: (r) => <span className="font-medium text-slate-800">{r.name}</span> },
    { key: 'appliesTo', header: 'Applies to' },
    { key: 'cond', header: 'Condition', render: (r) => <code className="rounded bg-slate-100 px-1.5 py-0.5 text-[11px] text-slate-700">{r.attribute} {r.operator} {r.value}</code> },
    { key: 'effect', header: 'On violation' },
    { key: 'status', header: 'Status', render: (r) => <Badge status={r.status} /> },
  ];

  return (
    <Card>
      <CardHeader icon={Filter} title="ABAC rules" subtitle="Attribute conditions evaluated on every request after the role check"
        action={<Button size="sm" icon={Plus} disabled={readOnly} onClick={() => { setForm(empty); setOpen(true); }}>Add rule</Button>} />
      <DataTable columns={columns} rows={rules} dense pageSize={8} />
      <Modal open={open} onClose={() => setOpen(false)} title="Add ABAC rule" subtitle="Takes effect after checker approval"
        footer={<><Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button><Button disabled={!valid} onClick={() => { onAdd(form); setOpen(false); }}>Submit for approval</Button></>}>
        <div className="space-y-4">
          <MakerCheckerBanner maker={maker} checker={roleName(checkerRole)} />
          <Input label="Rule name" required value={form.name} onChange={set('name')} placeholder="e.g. Office-hours only for MFI submitters" />
          <Select label="Applies to role" value={form.appliesTo} onChange={set('appliesTo')} options={roles.filter((r) => r.status !== 'Disabled').map((r) => ({ value: r.id, label: `${r.name} · ${r.portal === 'gov' ? 'Government' : 'MFI'}` }))} />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Select label="Attribute" value={form.attribute} onChange={set('attribute')} options={ATTRIBUTES} />
            <Select label="Operator" value={form.operator} onChange={set('operator')} options={OPERATORS} />
            <Input label="Value" value={form.value} onChange={set('value')} disabled={form.operator === 'required'} placeholder="token.tenant" />
          </div>
          <Select label="Effect on violation" value={form.effect} onChange={set('effect')} options={EFFECTS} />
        </div>
      </Modal>
    </Card>
  );
}
