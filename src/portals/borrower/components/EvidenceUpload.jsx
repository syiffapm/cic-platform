import { useId, useRef, useState } from 'react';
import { FileCheck2, Loader2, Paperclip, ShieldCheck, Trash2 } from 'lucide-react';

const MAX_BYTES = 5 * 1024 * 1024;
const DEFAULT_ACCEPT = ['.pdf', '.jpg', '.jpeg'];

const sizeLabel = (b) => (b >= 1024 * 1024 ? `${(b / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(b / 1024))} KB`);

/**
 * Evidence / document upload with client-side checks: PDF/JPG only, ≤ 5 MB,
 * then a simulated antivirus scan. `onChange` must be a React state setter (accepts updater functions). files: [{ name, size, scan: 'scanning' | 'clean' }]
 */
export default function EvidenceUpload({ files, onChange, label = 'Evidence (optional)', hint, multiple = true, accept = DEFAULT_ACCEPT }) {
  const id = useId();
  const inputRef = useRef(null);
  const [errors, setErrors] = useState([]);

  const handle = (list) => {
    const errs = [];
    const accepted = [];
    Array.from(list).forEach((f) => {
      const ext = `.${f.name.split('.').pop().toLowerCase()}`;
      if (!accept.includes(ext)) errs.push(`${f.name}: only ${accept.join(', ').toUpperCase()} files are accepted.`);
      else if (f.size > MAX_BYTES) errs.push(`${f.name} is ${sizeLabel(f.size)}. The limit is 5 MB — try a smaller photo or scan.`);
      else accepted.push({ name: f.name, size: f.size, scan: 'scanning' });
    });
    setErrors(errs);
    if (!accepted.length) return;
    const next = multiple ? [...files, ...accepted] : accepted.slice(0, 1);
    onChange(next);
    setTimeout(() => {
      onChange((cur) => cur.map((f) => (accepted.some((a) => a.name === f.name) ? { ...f, scan: 'clean' } : f)));
    }, 1200);
    if (inputRef.current) inputRef.current.value = '';
  };

  return (
    <div className="space-y-2">
      <p className="block text-xs font-medium text-slate-700">{label}</p>
      <label
        htmlFor={id}
        className="flex cursor-pointer flex-col items-center gap-1.5 rounded-lg border-2 border-dashed border-slate-300 bg-slate-50 px-4 py-5 text-center text-xs text-slate-600 hover:border-primary-300 focus-within:border-primary-400"
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => { e.preventDefault(); handle(e.dataTransfer.files); }}
      >
        <Paperclip className="h-5 w-5 text-slate-500" aria-hidden="true" />
        <span><span className="font-semibold text-primary">Choose a file</span> or drag it here</span>
        <span className="text-[11px] text-slate-500">{hint ?? 'PDF or JPG, up to 5 MB each. A clear phone photo of a receipt is fine.'}</span>
        <input id={id} aria-label={label} ref={inputRef} type="file" accept={accept.join(',')} multiple={multiple} className="sr-only" onChange={(e) => handle(e.target.files)} />
      </label>
      {errors.map((e) => <p key={e} role="alert" className="text-[11px] font-medium text-red-600">{e}</p>)}
      {files.length > 0 && (
        <ul className="space-y-1.5">
          {files.map((f) => (
            <li key={f.name} className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs">
              <FileCheck2 className="h-4 w-4 shrink-0 text-slate-500" aria-hidden="true" />
              <span className="min-w-0 flex-1 truncate font-medium text-slate-700">{f.name}</span>
              <span className="text-slate-500">{sizeLabel(f.size)}</span>
              {f.scan === 'scanning' ? (
                <span className="inline-flex items-center gap-1 text-blue-600"><Loader2 className="h-3 w-3 animate-spin" aria-hidden="true" /> Virus scan…</span>
              ) : (
                <span className="inline-flex items-center gap-1 text-emerald-700"><ShieldCheck className="h-3 w-3" aria-hidden="true" /> Virus scan: clean</span>
              )}
              <button type="button" aria-label={`Remove ${f.name}`} onClick={() => onChange(files.filter((x) => x.name !== f.name))} className="rounded p-1 text-slate-500 hover:bg-slate-100 hover:text-red-600">
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
