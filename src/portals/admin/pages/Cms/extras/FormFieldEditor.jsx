import { ArrowDown, ArrowUp, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui';
import { FIELD_TYPES } from '../../../data/cmsExtras';

const input = 'h-9 w-full rounded-lg border border-slate-300 bg-white px-2.5 text-sm focus:border-primary-400 disabled:bg-slate-50';

/** CMS-13 field list: bilingual labels, type, required, options; add / remove / reorder. */
export default function FormFieldEditor({ fields, onChange, readOnly }) {
  const edit = (id, changes) => onChange(fields.map((f) => (f.id === id ? { ...f, ...changes } : f)));
  const swap = (i, j) => {
    if (j < 0 || j >= fields.length) return;
    const next = [...fields];
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  };
  const add = () => onChange([...fields, { id: `f${Date.now().toString(36)}`, en: 'New field', mm: '', type: 'text', required: false, options: [] }]);

  return (
    <div className="space-y-3">
      {fields.map((f, i) => {
        const hasOptions = f.type === 'select' || f.type === 'radio';
        return (
          <fieldset key={f.id} className="rounded-lg border border-slate-200 p-3">
            <legend className="px-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500">Field {i + 1}</legend>
            <div className="grid grid-cols-1 gap-2 md:grid-cols-12">
              <label className="md:col-span-4">
                <span className="text-[11px] font-medium text-slate-600">Label (EN)</span>
                <input className={input} value={f.en} disabled={readOnly} onChange={(e) => edit(f.id, { en: e.target.value })} />
              </label>
              <label className="md:col-span-4">
                <span className="text-[11px] font-medium text-slate-600">Label (MM)</span>
                <input lang="my" className={`${input} ${!f.mm ? 'border-amber-400 bg-amber-50' : ''}`} placeholder="Missing translation" value={f.mm} disabled={readOnly} onChange={(e) => edit(f.id, { mm: e.target.value })} />
              </label>
              <label className="md:col-span-2">
                <span className="text-[11px] font-medium text-slate-600">Type</span>
                <select className={input} value={f.type} disabled={readOnly} onChange={(e) => edit(f.id, { type: e.target.value, options: ['select', 'radio'].includes(e.target.value) && !f.options.length ? ['Option 1', 'Option 2'] : f.options })}>
                  {FIELD_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </label>
              <div className="flex items-end justify-between gap-1 md:col-span-2">
                <label className="flex h-9 items-center gap-1.5 text-xs text-slate-700">
                  <input type="checkbox" checked={f.required} disabled={readOnly} onChange={(e) => edit(f.id, { required: e.target.checked })} className="h-4 w-4 accent-[hsl(214_45%_22%)]" />
                  Required
                </label>
                <div className="flex">
                  <button type="button" disabled={readOnly || i === 0} onClick={() => swap(i, i - 1)} aria-label={`Move field ${f.en} up`} className="rounded p-1.5 text-slate-500 hover:bg-slate-100 disabled:opacity-30"><ArrowUp className="h-4 w-4" /></button>
                  <button type="button" disabled={readOnly || i === fields.length - 1} onClick={() => swap(i, i + 1)} aria-label={`Move field ${f.en} down`} className="rounded p-1.5 text-slate-500 hover:bg-slate-100 disabled:opacity-30"><ArrowDown className="h-4 w-4" /></button>
                  <button type="button" disabled={readOnly} onClick={() => onChange(fields.filter((x) => x.id !== f.id))} aria-label={`Remove field ${f.en}`} className="rounded p-1.5 text-red-600 hover:bg-red-50 disabled:opacity-30"><Trash2 className="h-4 w-4" /></button>
                </div>
              </div>
              {hasOptions && (
                <label className="md:col-span-12">
                  <span className="text-[11px] font-medium text-slate-600">Options (comma-separated)</span>
                  <input className={input} value={f.options.join(', ')} disabled={readOnly} onChange={(e) => edit(f.id, { options: e.target.value.split(',').map((s) => s.trimStart()) })} />
                </label>
              )}
            </div>
          </fieldset>
        );
      })}
      <Button size="sm" variant="outline" icon={Plus} disabled={readOnly} onClick={add}>Add field</Button>
    </div>
  );
}
