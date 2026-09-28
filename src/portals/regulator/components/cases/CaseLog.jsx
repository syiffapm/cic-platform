import { useState } from 'react';
import { FileText, Paperclip, Send } from 'lucide-react';
import { useSession } from '@/context/AuthContext';
import { useStore } from '@/context/StoreContext';
import { Button, Card, CardBody, CardHeader, EmptyState, Input, Select, Textarea } from '@/components/ui';
import { useRegulator } from '../../lib/RegulatorStore';
import { TODAY, nowStamp } from '../../lib/util';

/** Case documents (GOV-06). Files are not uploaded in the prototype — only metadata is recorded. */
export function CaseDocuments({ c, readOnly }) {
  const user = useSession('gov');
  const { patch } = useRegulator();
  const { logAudit } = useStore();
  const onFile = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const size = f.size > 1e6 ? `${(f.size / 1e6).toFixed(1)} MB` : `${Math.max(1, Math.round(f.size / 1e3))} KB`;
    patch('cases', c.id, (x) => ({ documents: [...x.documents, { name: f.name, size, by: user.name, at: TODAY }] }));
    logAudit({ actor: user.name, role: user.role, tenant: 'CBM', action: 'CASE_DOCUMENT_ADD', module: 'Supervision', target: `${c.id}/${f.name}`, outcome: 'Success' });
    e.target.value = '';
  };
  return (
    <Card>
      <CardHeader
        title="Documents"
        subtitle={`${c.documents.length} file(s) · stored encrypted, retained 10 years`}
        action={!readOnly && (
          <label className="inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 text-xs font-medium text-slate-700 hover:bg-slate-50 focus-within:ring-2 focus-within:ring-primary">
            <Paperclip className="h-3.5 w-3.5" aria-hidden="true" /> Attach
            <input type="file" className="sr-only" onChange={onFile} />
          </label>
        )}
      />
      <CardBody className="space-y-2">
        {c.documents.length === 0 && <p className="text-sm text-slate-500">No documents yet.</p>}
        {c.documents.map((d) => (
          <div key={d.name + d.at} className="flex items-center gap-3 rounded-lg border border-slate-200 p-2.5">
            <FileText className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-slate-800">{d.name}</p>
              <p className="text-[11px] text-slate-500">{d.size} · {d.by} · {d.at}</p>
            </div>
          </div>
        ))}
      </CardBody>
    </Card>
  );
}

/** Correspondence log with the MFI and internal notes (GOV-06). */
export function Correspondence({ c, readOnly }) {
  const user = useSession('gov');
  const { patch } = useRegulator();
  const [f, setF] = useState({ to: 'MFI compliance officer', channel: 'Portal notice', message: '' });
  const send = () => {
    if (!f.message.trim()) return;
    patch('cases', c.id, (x) => ({ correspondence: [...x.correspondence, { at: nowStamp(), from: user.name, ...f, message: f.message.trim() }] }));
    setF({ ...f, message: '' });
  };
  return (
    <Card>
      <CardHeader title="Correspondence log" subtitle="Chronological, immutable once recorded" />
      <CardBody>
        {c.correspondence.length === 0
          ? <EmptyState compact title="No correspondence yet" />
          : (
            <ol className="space-y-3">
              {c.correspondence.map((m, i) => (
                <li key={i} className="rounded-lg bg-slate-50 p-3">
                  <p className="text-[11px] text-slate-500"><b className="text-slate-700">{m.from}</b> → {m.to} · {m.channel} · {m.at}</p>
                  <p className="mt-1 text-sm text-slate-800">{m.message}</p>
                </li>
              ))}
            </ol>
          )}
        {!readOnly && (
          <div className="mt-4 grid grid-cols-1 gap-3 border-t border-slate-100 pt-4 sm:grid-cols-2">
            <Input label="To" value={f.to} onChange={(e) => setF({ ...f, to: e.target.value })} />
            <Select label="Channel" value={f.channel} onChange={(e) => setF({ ...f, channel: e.target.value })} options={['Portal notice', 'Letter', 'Email', 'Meeting', 'Phone', 'Note']} />
            <Textarea className="sm:col-span-2" label="Message" rows={2} value={f.message} onChange={(e) => setF({ ...f, message: e.target.value })} />
            <div className="sm:col-span-2"><Button size="sm" icon={Send} onClick={send} disabled={!f.message.trim()}>Record</Button></div>
          </div>
        )}
      </CardBody>
    </Card>
  );
}
