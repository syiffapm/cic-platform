import clsx from 'clsx';

/** tabs: [{ id, label, count? }] — controlled via value/onChange */
export default function Tabs({ tabs, value, onChange, className }) {
  return (
    <div role="tablist" className={clsx('flex gap-1 overflow-x-auto border-b border-slate-200 scrollbar-thin [mask-image:linear-gradient(to_right,black_85%,transparent)] sm:[mask-image:none]', className)}>
      {tabs.map((t) => (
        <button
          key={t.id}
          type="button"
          role="tab"
          aria-selected={value === t.id}
          onClick={() => onChange(t.id)}
          className={clsx(
            '-mb-px flex items-center gap-2 whitespace-nowrap border-b-2 px-3.5 py-2.5 text-sm font-medium transition-colors',
            value === t.id ? 'border-warm text-primary' : 'border-transparent text-slate-500 hover:text-slate-800',
          )}
        >
          {t.label}
          {t.count !== undefined && (
            <span className={clsx('rounded-full px-1.5 py-px text-[11px]', value === t.id ? 'bg-primary text-white' : 'bg-slate-100 text-slate-600')}>{t.count}</span>
          )}
        </button>
      ))}
    </div>
  );
}
