import clsx from 'clsx';

/** items: [{ title, time, description?, actor?, tone? ('done' | 'current' | 'pending') }] */
export default function Timeline({ items }) {
  return (
    <ol className="relative space-y-5 border-l border-slate-200 pl-5">
      {items.map((it, i) => (
        <li key={i} className="relative">
          <span className={clsx(
            'absolute -left-[27px] top-1 h-3 w-3 rounded-full ring-4 ring-white',
            it.tone === 'pending' ? 'bg-slate-300' : it.tone === 'current' ? 'bg-warm' : 'bg-primary',
          )} />
          <p className="text-sm font-medium text-slate-800">{it.title}</p>
          <p className="text-[11px] text-slate-500">{[it.time, it.actor].filter(Boolean).join(' · ')}</p>
          {it.description && <p className="mt-1 text-xs text-slate-600">{it.description}</p>}
        </li>
      ))}
    </ol>
  );
}
