import { Upload } from 'lucide-react';

const ctl = 'h-9 w-full rounded-lg border border-slate-300 bg-white px-2.5 text-sm';

/** Non-submitting live preview of a CMS form in EN or MM. */
export default function FormPreview({ fields, lang = 'en', title }) {
  const label = (f) => (lang === 'mm' ? f.mm || <span className="text-amber-700">[MM missing] {f.en}</span> : f.en);
  return (
    <form className="space-y-3" onSubmit={(e) => e.preventDefault()} aria-label={`Preview of ${title}`}>
      {fields.map((f) => (
        <div key={f.id} className="space-y-1">
          <p className="text-xs font-medium text-slate-700" lang={lang === 'mm' ? 'my' : 'en'}>
            {label(f)}{f.required && <span className="text-red-600" aria-hidden="true"> *</span>}
          </p>
          {f.type === 'text' && <input className={ctl} aria-label={f.en} />}
          {f.type === 'date' && <input type="date" className={ctl} aria-label={f.en} />}
          {f.type === 'textarea' && <textarea rows={3} className={`${ctl} h-auto py-2`} aria-label={f.en} />}
          {f.type === 'select' && (
            <select className={ctl} aria-label={f.en} defaultValue="">
              <option value="">Select…</option>
              {f.options.filter(Boolean).map((o) => <option key={o}>{o}</option>)}
            </select>
          )}
          {f.type === 'radio' && (
            <div className="flex flex-wrap gap-3">
              {f.options.filter(Boolean).map((o) => (
                <label key={o} className="flex items-center gap-1.5 text-sm text-slate-700"><input type="radio" name={`pv-${f.id}`} className="accent-[hsl(214_45%_22%)]" />{o}</label>
              ))}
            </div>
          )}
          {f.type === 'file' && (
            <div className="flex items-center gap-2 rounded-lg border border-dashed border-slate-300 px-3 py-2 text-xs text-slate-500">
              <Upload className="h-4 w-4" aria-hidden="true" /> Attach file (virus-scanned)
            </div>
          )}
        </div>
      ))}
      <div className="rounded-lg bg-slate-100 px-3 py-2 text-[11px] text-slate-700">CAPTCHA · Privacy notice consent · Submit</div>
    </form>
  );
}
