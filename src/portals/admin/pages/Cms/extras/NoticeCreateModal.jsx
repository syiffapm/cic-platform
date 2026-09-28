import { useMemo, useState } from 'react';
import { Send } from 'lucide-react';
import { Badge, Button, Checkbox, Field, Input, MakerCheckerBanner, Modal, Textarea } from '@/components/ui';
import { TIERS } from '../../../data/cmsExtras';
import { resolveRecipients } from './noticeUtils';

const EMPTY = { title: '', body: '', tiers: [], regions: [], due: '' };

/** CMS-12: compose a notice targeted by tier and/or region; recipients are resolved live from Institution Master. */
export default function NoticeCreateModal({ open, onClose, onSubmit, institutions, maker, minDue }) {
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const regions = useMemo(() => [...new Set(institutions.map((i) => i.region))].sort(), [institutions]);
  const recipients = resolveRecipients(institutions, form.tiers, form.regions);

  const toggle = (key, value) => setForm((f) => ({ ...f, [key]: f[key].includes(value) ? f[key].filter((x) => x !== value) : [...f[key], value] }));
  const close = () => { setForm(EMPTY); setErrors({}); onClose(); };

  const submit = () => {
    const e = {};
    if (!form.title.trim()) e.title = 'Title is required.';
    if (!form.body.trim()) e.body = 'Message body is required.';
    if (!form.due) e.due = 'Set an acknowledgement due date.';
    else if (form.due < minDue) e.due = 'Due date cannot be in the past.';
    if (recipients.length === 0) e.target = 'No institution matches this targeting.';
    setErrors(e);
    if (Object.keys(e).length) return;
    onSubmit({ ...form, recipients: recipients.length });
    close();
  };

  return (
    <Modal
      open={open}
      onClose={close}
      size="lg"
      title="New targeted notice"
      subtitle="Delivered to the MFI portal inbox with a mandatory read receipt and acknowledgement"
      footer={<><Button variant="ghost" onClick={close}>Cancel</Button><Button icon={Send} onClick={submit}>Submit for approval</Button></>}
    >
      <div className="space-y-4">
        <MakerCheckerBanner maker={maker} checker="CMS Publisher (adm_publisher)" note="The notice is sent to MFIs only after a Publisher approves it." />
        <Input label="Title" required value={form.title} error={errors.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
        <Textarea label="Message" required rows={4} value={form.body} error={errors.body} onChange={(e) => setForm({ ...form, body: e.target.value })} />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Field label="Target tiers" hint="None selected = all tiers">
            <div className="flex flex-wrap gap-3 pt-1">
              {TIERS.map((t) => <Checkbox key={t} label={t} checked={form.tiers.includes(t)} onChange={() => toggle('tiers', t)} />)}
            </div>
          </Field>
          <Input label="Acknowledge by" type="date" required min={minDue} value={form.due} error={errors.due} onChange={(e) => setForm({ ...form, due: e.target.value })} />
        </div>
        <Field label="Target regions" hint="None selected = all regions" error={errors.target}>
          <div className="grid grid-cols-2 gap-2 pt-1 sm:grid-cols-3 lg:grid-cols-4">
            {regions.map((r) => <Checkbox key={r} label={r} checked={form.regions.includes(r)} onChange={() => toggle('regions', r)} />)}
          </div>
        </Field>
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
          <p className="text-xs font-semibold text-slate-700">Resolved recipients: {recipients.length} MFI{recipients.length === 1 ? '' : 's'} <span className="font-normal text-slate-500">(from Institution Master, revoked excluded)</span></p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {recipients.map((i) => <Badge key={i.id} tone="navy">{i.short} · {i.tier} · {i.region}</Badge>)}
            {recipients.length === 0 && <span className="text-xs text-red-600">No match</span>}
          </div>
        </div>
      </div>
    </Modal>
  );
}
