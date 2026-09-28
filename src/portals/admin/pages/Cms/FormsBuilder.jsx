import { useEffect, useState } from 'react';
import clsx from 'clsx';
import { ClipboardList, Eye, Inbox, RotateCcw, Send, Settings } from 'lucide-react';
import { Badge, Button, Card, CardBody, CardHeader, DataTable, Input, MakerCheckerBanner, PageHeader, Select, Toggle, useToast } from '@/components/ui';
import { formatNumber } from '@/lib/format';
import { useAdmin } from '../../lib/useAdmin';
import { useAdminCollection } from '../../context/AdminStore';
import { FORMS, SUBMISSIONS } from '../../data/cmsExtras';
import FormFieldEditor from './extras/FormFieldEditor';
import FormPreview from './extras/FormPreview';

const QUEUES = ['Helpdesk · Grievances', 'Helpdesk · General', 'Helpdesk · Disputes', 'Helpdesk · Research'];
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);

function fieldDiff(from, to) {
  const diff = [];
  const names = (l) => l.map((f) => `${f.en}${f.required ? '*' : ''} [${f.type}]`).join(', ');
  if (!same(from.fields, to.fields)) diff.push({ field: 'Fields', from: names(from.fields), to: names(to.fields) });
  Object.keys(to.routing).forEach((k) => {
    if (from.routing[k] !== to.routing[k]) diff.push({ field: `Routing · ${k}`, from: String(from.routing[k]), to: String(to.routing[k]) });
  });
  return diff;
}

export default function FormsBuilder() {
  const { user, can, requestApproval } = useAdmin('cms.forms');
  const readOnly = !can('update');
  const toast = useToast();
  const [forms] = useAdminCollection('cmsForms', FORMS);
  const [selectedId, setSelectedId] = useState(forms[0].id);
  const form = forms.find((f) => f.id === selectedId) ?? forms[0];
  const [draft, setDraft] = useState({ fields: form.fields, routing: form.routing });
  const [lang, setLang] = useState('en');

  useEffect(() => { setDraft({ fields: form.fields, routing: form.routing }); }, [form]);

  const dirty = !same(draft, { fields: form.fields, routing: form.routing });
  const setRouting = (changes) => setDraft((d) => ({ ...d, routing: { ...d.routing, ...changes } }));

  const publish = () => {
    if (draft.fields.length === 0) { toast('A form needs at least one field', 'danger'); return; }
    if (draft.fields.some((f) => !f.en.trim())) { toast('Every field needs an English label', 'danger'); return; }
    if (draft.fields.some((f) => ['select', 'radio'].includes(f.type) && f.options.filter((o) => o.trim()).length < 2)) { toast('Select and radio fields need at least two options', 'danger'); return; }
    const clean = draft.fields.map((f) => ({ ...f, options: f.options.map((o) => o.trim()).filter(Boolean) }));
    const apr = requestApproval({
      type: 'Form change',
      summary: `${form.name} v${form.version + 1} (${clean.length} fields → ${draft.routing.queue})`,
      checkerRole: 'adm_publisher',
      payload: {
        diff: fieldDiff(form, draft),
        effect: { target: 'admin', collection: 'cmsForms', op: 'patch', id: form.id, changes: { fields: clean, routing: draft.routing, version: form.version + 1, status: 'Published' } },
      },
    });
    toast(`${apr.id}: ${form.name} v${form.version + 1} sent to a Publisher`, 'success');
  };

  const submissions = SUBMISSIONS.filter((s) => s.form === form.id);
  const missingMm = draft.fields.filter((f) => !f.mm.trim()).length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Forms builder"
        subtitle="Grievance, feedback and survey forms on the Public portal. Every submission becomes a Helpdesk ticket."
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {forms.map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => setSelectedId(f.id)}
            aria-pressed={f.id === form.id}
            className={clsx('rounded-xl border bg-white p-4 text-left shadow-sm transition hover:border-primary-300', f.id === form.id ? 'border-primary ring-2 ring-primary-200' : 'border-slate-200')}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                <ClipboardList className="h-4 w-4 text-primary" aria-hidden="true" />
                <p className="text-sm font-semibold text-slate-900">{f.name}</p>
              </div>
              <Badge status={f.status} />
            </div>
            <p className="mt-2 text-2xl font-bold text-slate-900">{formatNumber(f.submissions)}</p>
            <p className="text-xs text-slate-500">submissions · {f.kind} · v{f.version} · {f.fields.length} fields</p>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-5">
        <Card className="xl:col-span-3">
          <CardHeader
            icon={ClipboardList}
            title={`Fields — ${form.name}`}
            subtitle="Labels in EN and MM; amber = Myanmar translation missing"
            action={<div className="flex gap-2">{missingMm > 0 && <Badge tone="amber">{missingMm} MM missing</Badge>}{dirty && <Badge tone="amber">Unsaved</Badge>}</div>}
          />
          <CardBody>
            <FormFieldEditor fields={draft.fields} onChange={(fields) => setDraft((d) => ({ ...d, fields }))} readOnly={readOnly} />
          </CardBody>
        </Card>

        <div className="space-y-6 xl:col-span-2">
          <Card>
            <CardHeader
              icon={Eye}
              title="Live preview"
              action={(
                <div className="flex rounded-lg border border-slate-200 p-0.5 text-xs" role="group" aria-label="Preview language">
                  {['en', 'mm'].map((l) => (
                    <button key={l} type="button" aria-pressed={lang === l} onClick={() => setLang(l)} className={clsx('rounded-md px-2.5 py-1 font-medium', lang === l ? 'bg-primary text-white' : 'text-slate-600')}>{l.toUpperCase()}</button>
                  ))}
                </div>
              )}
            />
            <CardBody><FormPreview fields={draft.fields} lang={lang} title={form.name} /></CardBody>
          </Card>

          <Card>
            <CardHeader icon={Settings} title="Routing" subtitle="Submissions route to a Helpdesk queue" />
            <CardBody className="space-y-4">
              <Select label="Helpdesk queue" options={QUEUES} value={draft.routing.queue} disabled={readOnly} onChange={(e) => setRouting({ queue: e.target.value })} />
              <Input label="SLA (working days)" type="number" min={1} max={60} value={draft.routing.slaDays} disabled={readOnly} onChange={(e) => setRouting({ slaDays: Number(e.target.value) })} />
              <Toggle label="Auto-acknowledge" description="Send ticket number by SMS/email on submission" checked={draft.routing.autoAck} onChange={(v) => !readOnly && setRouting({ autoAck: v })} />
              <MakerCheckerBanner maker={user?.name} checker="CMS Publisher (adm_publisher)" />
              <div className="flex justify-end gap-2">
                <Button variant="ghost" icon={RotateCcw} disabled={!dirty || readOnly} onClick={() => setDraft({ fields: form.fields, routing: form.routing })}>Discard</Button>
                <Button icon={Send} disabled={!dirty || readOnly} onClick={publish}>Publish change</Button>
              </div>
            </CardBody>
          </Card>
        </div>
      </div>

      <Card>
        <CardHeader icon={Inbox} title="Recent submissions" subtitle={`${form.name} → ${form.routing.queue}`} />
        <DataTable
          dense
          rows={submissions}
          emptyTitle="No recent submissions"
          columns={[
            { key: 'id', header: 'Submission', render: (r) => <span className="font-mono text-xs">{r.id}</span> },
            { key: 'at', header: 'Received', sortable: true },
            { key: 'summary', header: 'Summary' },
            { key: 'township', header: 'Township' },
            { key: 'ticket', header: 'Routed ticket', render: (r) => <span className="font-mono text-xs font-semibold text-primary">{r.ticket}</span> },
            { key: 'status', header: 'Ticket status', render: (r) => <Badge status={r.status} /> },
          ]}
        />
      </Card>
    </div>
  );
}
