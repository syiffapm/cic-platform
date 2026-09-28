import clsx from 'clsx';
import { Check } from 'lucide-react';

/** steps: string[]; current: index of active step */
export default function Stepper({ steps, current }) {
  return (
    <ol className="flex flex-wrap items-center gap-2">
      {steps.map((s, i) => (
        <li key={s} className="flex items-center gap-2">
          <span className={clsx(
            'flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold',
            i < current ? 'bg-teal text-white' : i === current ? 'bg-primary text-white ring-4 ring-primary-100' : 'bg-slate-200 text-slate-500',
          )}>
            {i < current ? <Check className="h-3.5 w-3.5" /> : i + 1}
          </span>
          <span className={clsx('text-xs font-medium', i === current ? 'text-slate-900' : 'text-slate-500')}>{s}</span>
          {i < steps.length - 1 && <span className="mx-1 hidden h-px w-8 bg-slate-300 sm:block" />}
        </li>
      ))}
    </ol>
  );
}
