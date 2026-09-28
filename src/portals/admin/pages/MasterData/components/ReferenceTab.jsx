import { useState } from 'react';
import { Pencil, Plus } from 'lucide-react';
import { Badge, Button, Card, DataTable, Input, MakerCheckerBanner, Modal, Select, Textarea, useToast } from '@/components/ui';
import { roleName } from '@/data/roles';
import { useAdmin } from '../../../lib/useAdmin';
import { useAdminCollection } from '../../../context/AdminStore';
import { stewardChecker } from '../../../data/masterData';

/** Generic reference table (regions, townships, codes, currencies, holidays). Add / edit → maker-checker. */
export default function ReferenceTab({ config }) {
  const { user, role, store, can, requestApproval } = useAdmin('adm.masterData');
  const readOnly = !can('update');
  const toast = useToast();
  const [items] = useAdminCollection(config.key, config.seed);
  const [editing, setEditing] = useState(null); // { original|null, draft }
  const [reason, setReason] = useState('');
  const checkerRole = stewardChecker(role);

  const pendingIds = new Set(store.approvals
    .filter((a) => a.status === 'Pending' && a.payload?.effect?.collection === config.key)
    .map((a) => a.payload.effect.id ?? a.payload.effect.item?.id));

  const open = (row) => {
    setReason('');
    setEditing({ original: row, draft: row ? { ...row } : Object.fromEntries(config.fields.map((f) => [f.key, f.options ? f.options[0] : ''])) });
  };

  const setField = (k, v) => setEditing((e) => ({ ...e, draft: { ...e.draft, [k]: v } }));

  const submit = () => {
    const { original, draft } = editing;
    const isNew = !original;
    const id = isNew ? (config.idField === 'id' ? `${config.key.slice(3, 4)}-${Date.now().toString(36).toUpperCase()}` : String(draft[config.idField]).toUpperCase()) : original.id;
    const item = { ...draft, id, active: true, ...(config.idField !== 'id' && isNew ? { [config.idField]: id } : {}) };
    const diff = config.fields
      .filter((f) => isNew || String(original[f.key]) !== String(draft[f.key]))
      .map((f) => ({ field: f.label, from: isNew ? '—' : String(original[f.key] ?? ''), to: String(item[f.key] ?? '') }));
    if (!diff.length) { toast('No changes to submit', 'info'); return; }
    const changes = Object.fromEntries(config.fields.map((f) => [f.key, item[f.key]]));
    requestApproval({
      type: `Reference data ${isNew ? 'add' : 'edit'}`,
      summary: `${config.label}: ${isNew ? 'add' : 'edit'} ${config.noun} "${item.name}"`,
      checkerRole,
      payload: {
        reason, diff,
        effect: isNew
          ? { target: 'admin', collection: config.key, op: 'add', item }
          : { target: 'admin', collection: config.key, op: 'patch', id, changes },
      },
    });
    toast(`Submitted for ${roleName(checkerRole)} approval`, 'success');
    setEditing(null);
  };

  const columns = [
    ...config.fields.map((f, i) => ({
      key: f.key, header: f.label, sortable: true,
      render: (r) => (i === 0 ? <span className="font-mono text-xs font-medium text-slate-800">{String(r[f.key])}</span> : String(r[f.key] ?? '—')),
    })),
    {
      key: 'state', header: 'Status',
      render: (r) => (
        <span className="flex flex-wrap gap-1">
          <Badge status={r.active ? 'Active' : 'Archived'} />
          {r.base && <Badge tone="navy">Base</Badge>}
          {pendingIds.has(r.id) && <Badge tone="violet">Pending checker</Badge>}
        </span>
      ),
    },
    {
      key: 'act', header: <span className="relative"><span className="sr-only">Actions</span></span>, className: 'text-right',
      render: (r) => (
        <Button size="sm" variant="ghost" icon={Pencil} aria-label={`Edit ${r.name}`} disabled={readOnly || pendingIds.has(r.id) || r.base} onClick={(e) => { e.stopPropagation(); open(r); }}>Edit</Button>
      ),
    },
  ];

  const draftValid = editing && config.fields.every((f) => String(editing.draft[f.key] ?? '').trim()) && reason.trim();

  return (
    <Card>
      <DataTable
        columns={columns}
        rows={items}
        dense
        pageSize={12}
        searchKeys={config.fields.map((f) => f.key)}
        toolbar={(
          <>
            <span className="text-xs text-slate-500">{items.length} {config.label.toLowerCase()}</span>
            <Button size="sm" icon={Plus} disabled={!can('create')} onClick={() => open(null)}>Add {config.noun}</Button>
          </>
        )}
      />
      <Modal
        open={!!editing}
        onClose={() => setEditing(null)}
        title={editing?.original ? `Edit ${config.noun}` : `Add ${config.noun}`}
        subtitle={`${config.label} reference table`}
        footer={(
          <>
            <Button variant="outline" onClick={() => setEditing(null)}>Cancel</Button>
            <Button onClick={submit} disabled={!draftValid}>Submit for approval</Button>
          </>
        )}
      >
        {editing && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {config.fields.map((f) => {
                const locked = !!editing.original && f.key === config.idField;
                const common = { label: f.label, required: true, value: editing.draft[f.key] ?? '', onChange: (e) => setField(f.key, e.target.value), disabled: locked };
                return f.options ? <Select key={f.key} {...common} options={f.options} /> : <Input key={f.key} {...common} type={f.type ?? 'text'} hint={locked ? 'Business key cannot be changed' : undefined} />;
              })}
            </div>
            <Textarea label="Reason for change" required rows={2} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. CBM reference rate update 24 Sep 2026" />
            <MakerCheckerBanner maker={user?.name} checker={roleName(checkerRole)} note="Reference data is used by ingestion validation and every portal. The change applies only after a checker approves." />
          </div>
        )}
      </Modal>
    </Card>
  );
}
