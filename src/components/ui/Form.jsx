import clsx from 'clsx';
import { useId } from 'react';

const base = 'w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-800 placeholder:text-slate-400 focus:border-primary-400 disabled:bg-slate-50 disabled:text-slate-500';

export function Field({ label, hint, error, required, children, className }) {
  return (
    <div className={clsx('space-y-1.5', className)}>
      {label && (
        <span className="block text-xs font-medium text-slate-700">
          {label}{required && <span className="text-red-500" aria-hidden="true"> *</span>}
        </span>
      )}
      {children}
      {hint && !error && <p className="text-[11px] text-slate-500">{hint}</p>}
      {error && <p role="alert" className="text-[11px] font-medium text-red-600">{error}</p>}
    </div>
  );
}

export function Input({ label, hint, error, required, className, ...props }) {
  const id = useId();
  return (
    <Field label={label && <label htmlFor={id}>{label}</label>} hint={hint} error={error} required={required} className={className}>
      <input id={id} required={required} aria-invalid={!!error} className={clsx(base, 'h-10', error && 'border-red-400')} {...props} />
    </Field>
  );
}

export function Textarea({ label, hint, error, required, className, rows = 4, ...props }) {
  const id = useId();
  return (
    <Field label={label && <label htmlFor={id}>{label}</label>} hint={hint} error={error} required={required} className={className}>
      <textarea id={id} rows={rows} required={required} aria-invalid={!!error} className={clsx(base, 'py-2', error && 'border-red-400')} {...props} />
    </Field>
  );
}

/** options: array of strings or { value, label } */
export function Select({ label, hint, error, required, options, placeholder, className, ...props }) {
  const id = useId();
  return (
    <Field label={label && <label htmlFor={id}>{label}</label>} hint={hint} error={error} required={required} className={className}>
      <select id={id} required={required} aria-invalid={!!error} className={clsx(base, 'h-10 pr-8', error && 'border-red-400')} {...props}>
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((o) => {
          const opt = typeof o === 'string' ? { value: o, label: o } : o;
          return <option key={opt.value} value={opt.value}>{opt.label}</option>;
        })}
      </select>
    </Field>
  );
}

export function Checkbox({ label, description, className, ...props }) {
  const id = useId();
  return (
    <div className={clsx('flex items-start gap-2.5', className)}>
      <input id={id} type="checkbox" className="mt-0.5 h-4 w-4 rounded border-slate-300 text-primary accent-[hsl(214_45%_22%)]" {...props} />
      <label htmlFor={id} className="text-sm text-slate-700">
        {label}
        {description && <span className="block text-xs text-slate-500">{description}</span>}
      </label>
    </div>
  );
}

export function Toggle({ checked, onChange, label, description }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <p className="text-sm font-medium text-slate-800">{label}</p>
        {description && <p className="text-xs text-slate-500">{description}</p>}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={() => onChange(!checked)}
        className={clsx('relative h-6 w-11 shrink-0 rounded-full transition-colors', checked ? 'bg-primary' : 'bg-slate-300')}
      >
        <span className={clsx('absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform', checked ? 'translate-x-5' : 'translate-x-0.5')} />
      </button>
    </div>
  );
}
