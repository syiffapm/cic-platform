import { useEffect, useRef, useState } from 'react';
import clsx from 'clsx';
import { Braces } from 'lucide-react';
import { Alert, Button, Input, MakerCheckerBanner, Modal, Tabs } from '@/components/ui';
import { SAMPLE_VALUES, VARIABLES } from '../../../data/notifications';

/** SMS segment maths: GSM-7 160 / 153 per part; UCS-2 (Unicode, e.g. Myanmar) 70 / 67 per part. */
export function smsInfo(text) {
  const unicode = /[^\x00-\x7F]/.test(text); // eslint-disable-line no-control-regex
  const single = unicode ? 70 : 160;
  const multi = unicode ? 67 : 153;
  const len = [...text].length;
  const segments = len <= single ? 1 : Math.ceil(len / multi);
  return { unicode, len, single, segments, limit: segments === 1 ? single : segments * multi };
}

export const render = (text, values = SAMPLE_VALUES) => (text ?? '').replace(/\{\{(\w+)\}\}/g, (_, k) => values[k] ?? `{{${k}}}`);
const unknownVars = (text) => [...(text ?? '').matchAll(/\{\{(\w+)\}\}/g)].map((m) => m[1]).filter((v) => !VARIABLES.includes(v));

function SmsCounter({ text }) {
  const s = smsInfo(render(text));
  return (
    <p className={clsx('text-[11px]', s.segments > 2 ? 'text-red-600' : s.segments > 1 ? 'text-amber-700' : 'text-slate-500')}>
      {s.len} chars after variables · {s.unicode ? 'Unicode (70/segment)' : 'GSM-7 (160/segment)'} · <b>{s.segments} segment{s.segments > 1 ? 's' : ''}</b>
    </p>
  );
}

/** Edit EN/MM bodies with variable chips and a live preview (ADM-11). */
export default function TemplateEditor({ template, eventLabel, onClose, onSubmit, maker, readOnly }) {
  const [form, setForm] = useState(null);
  const [lang, setLang] = useState('en');
  const ref = useRef(null);
  useEffect(() => { if (template) { setForm({ ...template }); setLang('en'); } }, [template]);
  if (!template || !form) return null;

  const insert = (v) => {
    const token = `{{${v}}}`;
    const el = ref.current;
    const text = form[lang] ?? '';
    const start = el?.selectionStart ?? text.length;
    const end = el?.selectionEnd ?? text.length;
    setForm({ ...form, [lang]: text.slice(0, start) + token + text.slice(end) });
    requestAnimationFrame(() => { el?.focus(); el?.setSelectionRange(start + token.length, start + token.length); });
  };
  const bad = [...unknownVars(form.en), ...unknownVars(form.mm), ...unknownVars(form.subject)];
  const changed = form.en !== template.en || form.mm !== template.mm || form.subject !== template.subject;
  const valid = form.en.trim() && form.mm.trim() && bad.length === 0 && changed;

  return (
    <Modal open onClose={onClose} size="xl" title={`Edit ${template.id} · ${eventLabel}`} subtitle={`${template.channel} · version ${template.version} → ${template.version + 1} on approval`}
      footer={<><Button variant="outline" onClick={onClose}>Cancel</Button><Button disabled={readOnly || !valid} onClick={() => onSubmit(form)}>Submit for approval</Button></>}>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="space-y-4">
          <MakerCheckerBanner maker={maker} checker="Content Publisher / Approver" />
          {template.channel === 'Email' && <Input label="Subject" value={form.subject ?? ''} onChange={(e) => setForm({ ...form, subject: e.target.value })} />}
          <Tabs tabs={[{ id: 'en', label: 'English' }, { id: 'mm', label: 'Myanmar (Unicode)' }]} value={lang} onChange={setLang} />
          <div>
            <label htmlFor="tpl-body" className="sr-only">Body ({lang === 'en' ? 'English' : 'Myanmar'})</label>
            <textarea id="tpl-body" ref={ref} lang={lang === 'mm' ? 'my' : 'en'} rows={template.channel === 'Email' ? 8 : 4} value={form[lang]} disabled={readOnly}
              onChange={(e) => setForm({ ...form, [lang]: e.target.value })}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm leading-relaxed focus:border-primary-400" />
            {template.channel === 'SMS' && <SmsCounter text={form[lang]} />}
          </div>
          <div>
            <p className="mb-1.5 flex items-center gap-1 text-xs font-medium text-slate-700"><Braces className="h-3.5 w-3.5" aria-hidden="true" /> Insert variable</p>
            <div className="flex flex-wrap gap-1.5">
              {VARIABLES.map((v) => (
                <button key={v} type="button" disabled={readOnly} onClick={() => insert(v)}
                  className="rounded-full border border-teal-200 bg-teal-50 px-2 py-0.5 font-mono text-[11px] text-teal-800 hover:bg-teal-100 disabled:opacity-50">
                  {`{{${v}}}`}
                </button>
              ))}
            </div>
          </div>
          {bad.length > 0 && <Alert tone="danger">Unknown variable(s): {[...new Set(bad)].join(', ')}</Alert>}
        </div>
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Preview with test values</p>
          {['en', 'mm'].map((l) => (
            <div key={l} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="mb-2 text-[11px] font-semibold text-slate-500">{l === 'en' ? 'English' : 'Myanmar'} · {template.channel}</p>
              {template.channel === 'Email' && <p className="mb-2 border-b border-slate-200 pb-2 text-sm font-semibold text-slate-800">{render(form.subject)}</p>}
              <p lang={l === 'mm' ? 'my' : 'en'} className={clsx('whitespace-pre-wrap text-sm leading-relaxed text-slate-700', template.channel === 'SMS' && 'rounded-2xl rounded-bl-sm bg-white p-3 shadow-sm')}>{render(form[l])}</p>
              {template.channel === 'SMS' && <div className="mt-2"><SmsCounter text={form[l]} /></div>}
            </div>
          ))}
          {template.mandatory && <Alert tone="warning">Mandatory / security message — delivered even to recipients who opted out of optional notifications.</Alert>}
        </div>
      </div>
    </Modal>
  );
}
