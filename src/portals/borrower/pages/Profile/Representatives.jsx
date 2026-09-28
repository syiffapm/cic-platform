import { useState } from 'react';
import { UserPlus, UserX, Users } from 'lucide-react';
import { Alert, Badge, Button, Card, CardBody, CardHeader, EmptyState, Input, Modal, Select, useToast } from '@/components/ui';
import { formatDate, maskNrc } from '@/lib/format';
import { parseNrc } from '@/lib/nrc';
import ConfirmDialog from '../../components/ConfirmDialog';
import EvidenceUpload from '../../components/EvidenceUpload';
import { addDays, isoDate, stamp, useBorrowerAudit, useOwnState } from '../../lib/borrower';

const RELATIONS = ['Spouse', 'Son', 'Daughter', 'Parent', 'Sibling', 'Lawyer', 'Other'];
const MAX_DAYS = 365;
const empty = () => ({ name: '', nrc: '', relation: 'Spouse', validTo: isoDate(addDays(new Date(), 90)) });

/** Authorised representatives with authority document, time-limited. */
export default function Representatives() {
  const [reps, setReps] = useOwnState('representatives');
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(empty);
  const [files, setFiles] = useState([]);
  const [revokeTarget, setRevokeTarget] = useState(null);
  const audit = useBorrowerAudit();
  const toast = useToast();

  const today = isoDate(new Date());
  const maxDate = isoDate(addDays(new Date(), MAX_DAYS));
  const nrcOk = parseNrc(form.nrc).valid;
  const valid = form.name.trim().length > 2 && nrcOk && form.validTo > today && form.validTo <= maxDate && files.length === 1 && files[0].scan === 'clean';
  const statusOf = (r) => (r.status === 'Revoked' ? 'Revoked' : r.validTo < today ? 'Expired' : 'Active');

  const save = () => {
    const id = `REP-${String(Math.floor(1000 + Math.random() * 9000))}`;
    setReps((list) => [{ id, name: form.name.trim(), relation: form.relation, nrc: parseNrc(form.nrc).normalised, document: files[0].name, validFrom: today, validTo: form.validTo, status: 'Active' }, ...list]);
    audit('REPRESENTATIVE_ADD', id, { purpose: `Valid to ${form.validTo}` });
    toast(`${form.name} can act for you until ${formatDate(form.validTo)} once CIC checks the document.`, 'success');
    setOpen(false); setForm(empty()); setFiles([]);
  };

  const revoke = () => {
    setReps((list) => list.map((r) => (r.id === revokeTarget.id ? { ...r, status: 'Revoked', revokedAt: stamp() } : r)));
    audit('REPRESENTATIVE_REVOKE', revokeTarget.id);
    toast(`Access for ${revokeTarget.name} removed.`, 'success');
    setRevokeTarget(null);
  };

  return (
    <Card>
      <CardHeader
        title="People who can act for me"
        subtitle="A trusted person can view your report and file disputes for you, with a signed authority document."
        icon={Users}
        action={<Button size="sm" icon={UserPlus} onClick={() => setOpen(true)}>Add</Button>}
      />
      <CardBody className="space-y-3">
        {reps.length === 0 && <EmptyState compact icon={Users} title="Nobody can act for you" description="Only you can see your report and file disputes. Add a trusted person if you need help, for example a family member." />}
        {reps.map((r) => {
          const st = statusOf(r);
          return (
            <div key={r.id} className="flex flex-wrap items-start justify-between gap-3 rounded-lg border border-slate-200 p-3">
              <div className="text-sm">
                <p className="font-semibold text-slate-800">{r.name} <span className="font-normal text-slate-500">· {r.relation}</span></p>
                <p className="text-xs text-slate-500">NRC {maskNrc(r.nrc)} · Document: {r.document}</p>
                <p className="text-xs text-slate-500">Valid {formatDate(r.validFrom)} – {formatDate(r.validTo)}</p>
              </div>
              <div className="flex items-center gap-2">
                <Badge status={st} />
                {st === 'Active' && <Button size="sm" variant="outline" icon={UserX} onClick={() => setRevokeTarget(r)}>Revoke</Button>}
              </div>
            </div>
          );
        })}
        <p className="text-[11px] text-slate-500">Access ends automatically on the end date (maximum 12 months). Everything a representative does is logged under their own name.</p>
      </CardBody>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Add an authorised representative"
        subtitle="They will get their own login. They cannot change your password or add other people."
        footer={<><Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button><Button onClick={save} disabled={!valid}>Add representative</Button></>}
      >
        <div className="space-y-4">
          <Input label="Full name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Ko Zaw Min Oo" />
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Their NRC" required value={form.nrc} onChange={(e) => setForm({ ...form, nrc: e.target.value })} placeholder="12/OUKAMA(N)401122" error={form.nrc && !nrcOk ? 'Use the format 12/ABC(N)123456.' : undefined} />
            <Select label="Relationship" options={RELATIONS} value={form.relation} onChange={(e) => setForm({ ...form, relation: e.target.value })} />
          </div>
          <Input
            label="Access ends on"
            type="date"
            required
            min={today}
            max={maxDate}
            value={form.validTo}
            onChange={(e) => setForm({ ...form, validTo: e.target.value })}
            hint="Up to 12 months. You can revoke earlier at any time."
            error={form.validTo && (form.validTo <= today || form.validTo > maxDate) ? 'Choose a date within the next 12 months.' : undefined}
          />
          <EvidenceUpload label="Authority document (required)" files={files} onChange={setFiles} multiple={false} hint="Signed power of attorney or court order. PDF or JPG, up to 5 MB." />
          <Alert tone="info">CIC staff check the document before access starts (usually 1 working day).</Alert>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!revokeTarget}
        onClose={() => setRevokeTarget(null)}
        onConfirm={revoke}
        title="Remove this person's access?"
        subtitle={revokeTarget ? `${revokeTarget.name} · ${revokeTarget.relation}` : ''}
        confirmLabel="Revoke access"
        cancelLabel="Keep access"
        icon={UserX}
        consequence="This cannot be undone. To give them access again you will need to add them again with a new authority document."
      >
        <p>{revokeTarget?.name} will be signed out immediately and will no longer be able to see your report or disputes.</p>
      </ConfirmDialog>
    </Card>
  );
}
