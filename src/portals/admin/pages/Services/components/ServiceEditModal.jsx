import { useEffect, useState } from 'react';
import { Plus, X } from 'lucide-react';
import { Button, Input, MakerCheckerBanner, Modal, Select, Textarea, Toggle } from '@/components/ui';
import { looksLikeZawgyi } from '@/lib/nrc';
import ServiceCardPreview from './ServiceCardPreview';

const STATUSES = ['Live', 'Pilot', 'Planned'];
const LEGACY = { P0: 'Live', P1: 'Live', P2: 'Pilot' };
/** Operational status of a service (stored in the `priority` field of the catalogue record). */
export const serviceStage = (v) => (STATUSES.includes(v) ? v : LEGACY[v] ?? 'Planned');

function ListEditor({ label, items, onChange, placeholder, disabled }) {
  const [draft, setDraft] = useState('');
  const add = () => { if (draft.trim()) { onChange([...items, draft.trim()]); setDraft(''); } };
  return (
    <div className="space-y-1.5">
      <p className="text-xs font-medium text-slate-700">{label}</p>
      <ol className="space-y-1">
        {items.map((it, i) => (
          <li key={`${it}-${i}`} className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-1.5 text-sm text-slate-700">
            <span className="w-5 text-xs text-slate-500">{i + 1}.</span><span className="flex-1">{it}</span>
            <button type="button" disabled={disabled} onClick={() => onChange(items.filter((_, j) => j !== i))} aria-label={`Remove ${it}`} className="rounded p-1 text-slate-500 hover:bg-slate-200 hover:text-red-600"><X className="h-3.5 w-3.5" /></button>
          </li>
        ))}
        {items.length === 0 && <li className="text-xs text-slate-500">None</li>}
      </ol>
      <div className="flex gap-2">
        <input aria-label={`Add to ${label}`} value={draft} disabled={disabled} onChange={(e) => setDraft(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); add(); } }} placeholder={placeholder} className="h-9 w-full rounded-lg border border-slate-300 px-3 text-sm" />
        <Button size="sm" variant="outline" icon={Plus} disabled={disabled || !draft.trim()} onClick={add}>Add</Button>
      </div>
    </div>
  );
}

/** Edit form for one service; submit creates a publisher approval with a field diff. */
export default function ServiceEditModal({ service, onClose, onSubmit, maker, readOnly }) {
  const [form, setForm] = useState(null);
  useEffect(() => { setForm(service ? structuredClone(service) : null); }, [service]);
  if (!service || !form) return null;

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const zawgyi = looksLikeZawgyi(form.title.mm ?? '');
  const valid = form.title.en.trim() && form.title.mm.trim() && form.summary.trim() && !zawgyi;

  return (
    <Modal open onClose={onClose} size="xl" title={`Edit ${service.id} · ${service.title.en}`} subtitle="Changes publish to the Public service cards after a Content Publisher approves"
      footer={<><Button variant="outline" onClick={onClose}>Cancel</Button><Button disabled={readOnly || !valid} onClick={() => onSubmit(form)}>Submit for publishing</Button></>}>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-4">
          <MakerCheckerBanner maker={maker} checker="Content Publisher / Approver" note="Saved as a pending change; the Publisher reviews the diff and the Public site updates on approval (an editor cannot publish their own change)." />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input label="Title (English)" required value={form.title.en} onChange={(e) => set('title', { ...form.title, en: e.target.value })} />
            <Input label="Title (Myanmar, Unicode)" required lang="my" value={form.title.mm} onChange={(e) => set('title', { ...form.title, mm: e.target.value })} error={zawgyi ? 'Looks like Zawgyi — convert to Unicode before saving' : null} />
          </div>
          <Textarea label="Summary / description" required rows={3} value={form.summary} onChange={(e) => set('summary', e.target.value)} hint={`${form.summary.length}/200 characters shown on the card`} />
          <Textarea label="Eligibility" rows={2} value={form.eligibility} onChange={(e) => set('eligibility', e.target.value)} />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input label="Fee" value={form.fee} onChange={(e) => set('fee', e.target.value)} />
            <Input label="Service level (SLA)" value={form.sla} onChange={(e) => set('sla', e.target.value)} />
            <Input label="Channel" value={form.channel} onChange={(e) => set('channel', e.target.value)} />
            <Select label="Service status" value={form.priority} onChange={(e) => set('priority', e.target.value)} options={STATUSES.map((s) => ({ value: s, label: s }))} />
          </div>
          <div className="rounded-lg border border-slate-200 p-3">
            <Toggle
              checked={!!form.showOnPublic}
              onChange={(v) => set('showOnPublic', v)}
              label="Show on Public Portal"
              description="Only for services citizens use or look up themselves. Institutional services (reporting, inquiries, supervision) stay inside the MFI and Government portals."
            />
          </div>
          <ListEditor label="Steps" items={form.steps} onChange={(v) => set('steps', v)} placeholder="Add a step" disabled={readOnly} />
          <ListEditor label="Documents" items={form.documents} onChange={(v) => set('documents', v)} placeholder="e.g. Consent form template" disabled={readOnly} />
        </div>
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Public card preview</p>
          <ServiceCardPreview service={form} lang="en" />
          <ServiceCardPreview service={form} lang="mm" />
        </div>
      </div>
    </Modal>
  );
}
