import { useState } from 'react';
import { ListChecks, Pencil, Plus } from 'lucide-react';
import { Badge, Button, Card, CardHeader, DataTable, Input, MakerCheckerBanner, Modal, Select, Textarea, Toggle, useToast } from '@/components/ui';
import { roleName } from '@/data/roles';
import { useAdmin } from '../../../lib/useAdmin';
import { useAdminCollection } from '../../../context/AdminStore';
import { DQ_RULES } from '../../../data/dataQuality';
import { stewardChecker } from '../../../data/masterData';

const EMPTY = { field: '', condition: '', severity: 'error', active: true };

/** DQ validation rules. Every add / edit / (de)activation is a maker-checker request on the dqRules collection. */
export default function DqRuleEditor() {
  const { user, role, store, can, requestApproval } = useAdmin('adm.dataQuality');
  const readOnly = !can('update');
  const toast = useToast();
  const [rules] = useAdminCollection('dqRules', DQ_RULES);
  const [edit, setEdit] = useState(null); // { original, draft }
  const [reason, setReason] = useState('');
  const checkerRole = stewardChecker(role);

  const pending = new Set(store.approvals
    .filter((a) => a.status === 'Pending' && a.payload?.effect?.collection === 'dqRules')
    .map((a) => a.payload.effect.id ?? a.payload.effect.item?.id));

  const submitChange = (original, draft, why) => {
    const isNew = !original;
    const id = isNew ? `DQ-${String(Math.max(0, ...rules.map((r) => Number(r.id.slice(3)))) + 1).padStart(3, '0')}` : original.id;
    const fields = ['field', 'condition', 'severity', 'active'];
    const diff = fields
      .filter((f) => isNew || original[f] !== draft[f])
      .map((f) => ({ field: f, from: isNew ? '—' : String(original[f]), to: String(draft[f]) }));
    if (!diff.length) { toast('No changes to submit', 'info'); return false; }
    requestApproval({
      type: `DQ rule ${isNew ? 'add' : 'change'}`,
      summary: `${id} (${draft.field}): ${isNew ? 'new rule' : diff.map((d) => `${d.field} ${d.from} → ${d.to}`).join('; ')}`,
      checkerRole,
      payload: {
        reason: why, diff,
        effect: isNew
          ? { target: 'admin', collection: 'dqRules', op: 'add', item: { id, ...draft } }
          : { target: 'admin', collection: 'dqRules', op: 'patch', id, changes: Object.fromEntries(fields.map((f) => [f, draft[f]])) },
      },
    });
    toast(`${id} submitted for ${roleName(checkerRole)} approval`, 'success');
    return true;
  };

  const columns = [
    { key: 'id', header: 'Rule', render: (r) => <span className="font-mono text-xs font-medium text-slate-800">{r.id}</span> },
    { key: 'field', header: 'Field', render: (r) => <span className="font-mono text-xs">{r.field}</span> },
    { key: 'condition', header: 'Condition' },
    { key: 'severity', header: 'Severity', render: (r) => <Badge tone={r.severity === 'error' ? 'red' : 'amber'}>{r.severity}</Badge> },
    {
      key: 'active', header: 'Active',
      render: (r) => (
        <div className="flex items-center gap-2">
          <button
            type="button"
            role="switch"
            aria-checked={r.active}
            aria-label={`${r.active ? 'Deactivate' : 'Activate'} ${r.id}`}
            disabled={readOnly || pending.has(r.id)}
            onClick={() => submitChange(r, { ...r, active: !r.active }, `${r.active ? 'Deactivate' : 'Activate'} rule`)}
            className={`relative h-5 w-9 rounded-full transition-colors disabled:opacity-50 ${r.active ? 'bg-primary' : 'bg-slate-300'}`}
          >
            <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${r.active ? 'translate-x-4' : 'translate-x-0.5'}`} />
          </button>
          {pending.has(r.id) && <Badge tone="violet">Pending checker</Badge>}
        </div>
      ),
    },
    {
      key: 'act', header: <span className="relative"><span className="sr-only">Actions</span></span>,
      render: (r) => <Button size="sm" variant="ghost" icon={Pencil} aria-label={`Edit ${r.id}`} disabled={readOnly || pending.has(r.id)} onClick={() => { setReason(''); setEdit({ original: r, draft: { ...r } }); }}>Edit</Button>,
    },
  ];

  const set = (k, v) => setEdit((e) => ({ ...e, draft: { ...e.draft, [k]: v } }));
  const valid = edit && edit.draft.field.trim() && edit.draft.condition.trim() && reason.trim();

  return (
    <Card>
      <CardHeader
        icon={ListChecks}
        title="Validation rules"
        subtitle="Applied to every incoming row. Error = row rejected; warning = row loaded and flagged."
        action={<Button size="sm" icon={Plus} disabled={!can('create')} onClick={() => { setReason(''); setEdit({ original: null, draft: { ...EMPTY } }); }}>Add rule</Button>}
      />
      <DataTable columns={columns} rows={rules} dense searchKeys={['id', 'field', 'condition']} />
      <Modal
        open={!!edit}
        onClose={() => setEdit(null)}
        title={edit?.original ? `Edit ${edit.original.id}` : 'New DQ rule'}
        footer={(
          <>
            <Button variant="outline" onClick={() => setEdit(null)}>Cancel</Button>
            <Button disabled={!valid} onClick={() => submitChange(edit.original, edit.draft, reason) && setEdit(null)}>Submit for approval</Button>
          </>
        )}
      >
        {edit && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Input label="Field" required value={edit.draft.field} onChange={(e) => set('field', e.target.value)} placeholder="e.g. guarantor_nrc" />
              <Select label="Severity" options={[{ value: 'error', label: 'Error — reject row' }, { value: 'warning', label: 'Warning — load and flag' }]} value={edit.draft.severity} onChange={(e) => set('severity', e.target.value)} />
            </div>
            <Input label="Condition" required value={edit.draft.condition} onChange={(e) => set('condition', e.target.value)} placeholder="e.g. Matches NRC pattern when guarantor present" />
            <Toggle label="Active" description="Inactive rules are kept for history but not evaluated" checked={edit.draft.active} onChange={(v) => set('active', v)} />
            <Textarea label="Reason for change" required rows={2} value={reason} onChange={(e) => setReason(e.target.value)} />
            <MakerCheckerBanner maker={user?.name} checker={roleName(checkerRole)} note="Rule changes affect every MFI submission from the next batch after approval." />
          </div>
        )}
      </Modal>
    </Card>
  );
}
