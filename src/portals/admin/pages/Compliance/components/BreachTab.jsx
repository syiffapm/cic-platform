import { useEffect, useState } from 'react';
import { Plus, Send, Siren } from 'lucide-react';
import { Alert, Badge, Button, Card, CardHeader, Input, Modal, Select, Textarea, useToast } from '@/components/ui';
import { formatDateTime, formatNumber } from '@/lib/format';
import { useAdminCollection } from '../../../context/AdminStore';
import { BREACH_SEVERITIES, BREACHES } from '../../../data/compliance';

const WINDOW = 72 * 3600000;
const hms = (ms) => {
  const s = Math.floor(Math.abs(ms) / 1000);
  return `${Math.floor(s / 3600)}h ${String(Math.floor((s % 3600) / 60)).padStart(2, '0')}m ${String(s % 60).padStart(2, '0')}s`;
};

function Clock({ breach, now }) {
  const detected = new Date(breach.detectedAt).getTime();
  if (breach.regulatorNotified) {
    const took = new Date(breach.notifiedAt).getTime() - detected;
    return <Badge tone={took <= WINDOW ? 'green' : 'red'}>Notified in {hms(took)}</Badge>;
  }
  const left = detected + WINDOW - now;
  const pct = Math.min(100, Math.max(0, ((now - detected) / WINDOW) * 100));
  const tone = left < 0 ? 'bg-red-600' : left < 12 * 3600000 ? 'bg-amber-500' : 'bg-teal-600';
  return (
    <div className="w-48" role="timer" aria-label="72-hour regulator notification clock">
      <p className={`font-mono text-sm font-semibold ${left < 0 ? 'text-red-700' : 'text-slate-800'}`}>{left < 0 ? `${hms(left)} overdue` : `${hms(left)} left`}</p>
      <div className="mt-1 h-1.5 rounded-full bg-slate-200"><div className={`h-1.5 rounded-full ${tone}`} style={{ width: `${pct}%` }} /></div>
    </div>
  );
}

const EMPTY = { title: '', detectedAt: '', severity: 'Medium', records: 0, categories: '' };

/** Breach register with 72-hour regulator notification clock (ADM-14). */
export default function BreachTab({ readOnly, canCreate = !readOnly, audit }) {
  const toast = useToast();
  const [breaches, api] = useAdminCollection('breaches', BREACHES);
  const [now, setNow] = useState(Date.now());
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(EMPTY);
  useEffect(() => { const t = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(t); }, []);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const openModal = () => { setForm({ ...EMPTY, detectedAt: new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16) }); setOpen(true); };

  const log = () => {
    const n = Math.max(0, ...breaches.map((b) => Number(b.id.slice(-3)) || 0)) + 1;
    const item = { id: `BR-2026-${String(n).padStart(3, '0')}`, title: form.title.trim(), detectedAt: new Date(form.detectedAt).toISOString(), severity: form.severity, records: Number(form.records) || 0, categories: form.categories || '—', status: 'Assessing', regulatorNotified: false, subjectsNotified: false };
    api.add(item);
    audit('BREACH_LOGGED', `${item.id} · ${item.severity}`, { purpose: 'Breach register' });
    toast(`${item.id} logged — 72-hour notification clock started`, 'warning');
    setOpen(false);
  };
  const notify = (b) => {
    api.patch(b.id, { regulatorNotified: true, notifiedAt: new Date().toISOString(), status: 'Notified' });
    audit('BREACH_REGULATOR_NOTIFIED', b.id, { purpose: 'Statutory breach notification' });
    toast(`Regulator notification recorded for ${b.id}`, 'success');
  };

  const running = breaches.filter((b) => !b.regulatorNotified && b.status !== 'Closed');

  return (
    <div className="space-y-6">
      {running.length > 0 && (
        <Alert tone="danger" title={`${running.length} breach${running.length > 1 ? 'es' : ''} awaiting regulator notification`}>
          Personal-data breaches must be notified to the Central Bank of Myanmar within 72 hours of detection.
        </Alert>
      )}
      <Card>
        <CardHeader icon={Siren} title="Breach register" subtitle="Clock runs from detection time"
          action={<Button size="sm" icon={Plus} variant="danger" disabled={!canCreate} onClick={openModal}>Log new breach</Button>} />
        <ul className="divide-y divide-slate-100">
          {breaches.map((b) => (
            <li key={b.id} className="grid grid-cols-1 gap-3 px-5 py-4 lg:grid-cols-[1fr_auto_auto] lg:items-center">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-slate-800">{b.title}</p>
                <p className="mt-0.5 text-[11px] text-slate-500">{b.id} · detected {formatDateTime(b.detectedAt)} · {formatNumber(b.records)} affected record{b.records === 1 ? '' : 's'} · {b.categories}</p>
                <p className="mt-1 flex flex-wrap gap-1.5"><Badge status={b.severity} /><Badge status={b.status} /><Badge tone={b.subjectsNotified ? 'green' : 'slate'}>Subjects {b.subjectsNotified ? 'notified' : 'not notified'}</Badge></p>
              </div>
              <Clock breach={b} now={now} />
              <div>{!b.regulatorNotified && <Button size="sm" variant="outline" icon={Send} disabled={readOnly} onClick={() => notify(b)}>Mark regulator notified</Button>}</div>
            </li>
          ))}
        </ul>
      </Card>

      <Modal open={open} onClose={() => setOpen(false)} title="Log new breach" subtitle="Starts the 72-hour regulator notification clock"
        footer={<><Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button><Button variant="danger" onClick={log} disabled={!form.title.trim() || !form.detectedAt}>Log breach</Button></>}>
        <div className="space-y-4">
          <Input label="Short description" required value={form.title} onChange={set('title')} placeholder="e.g. Report emailed to wrong recipient" />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Input label="Detected at" type="datetime-local" required value={form.detectedAt} onChange={set('detectedAt')} />
            <Select label="Severity" value={form.severity} onChange={set('severity')} options={BREACH_SEVERITIES} />
            <Input label="Affected records" type="number" min={0} value={form.records} onChange={set('records')} />
          </div>
          <Textarea label="Data categories affected" rows={3} value={form.categories} onChange={set('categories')} placeholder="Name, NRC, phone, loan balances…" />
        </div>
      </Modal>
    </div>
  );
}
