import clsx from 'clsx';
import { Check, X } from 'lucide-react';
import { PIPELINE } from '../data/batches';

const STEP_INDEX = {
  Uploaded: 0, Validating: 1, 'Validation failed': 1, 'Awaiting approval': 2, 'Rejected by checker': 2, Withdrawn: 2,
  Approved: 3, 'Identity resolution': 4, Loaded: 6,
};

/** Submission journey: Uploaded → Validating → Awaiting approval → Approved → Identity resolution → Loaded → Receipt. */
export default function PipelineStatus({ status, compact = false }) {
  const current = STEP_INDEX[status] ?? 0;
  const failed = ['Validation failed', 'Rejected by checker', 'Withdrawn'].includes(status);
  const done = status === 'Loaded';
  return (
    <ol className={clsx('flex items-center', compact ? 'gap-1' : 'flex-wrap gap-y-3')} aria-label={`Pipeline: ${status}`}>
      {PIPELINE.map((step, i) => {
        const isDone = done || i < current;
        const isFail = failed && i === current;
        const isCurrent = !done && !failed && i === current;
        const label = isFail ? status : step;
        return (
          <li key={step} className="flex items-center">
            {compact ? (
              <span
                title={label}
                className={clsx('block h-1.5 w-5 rounded-full', isFail ? 'bg-red-500' : isDone ? 'bg-teal-700' : isCurrent ? 'bg-warm' : 'bg-slate-200')}
              />
            ) : (
              <>
                <span className="flex items-center gap-2">
                  <span className={clsx(
                    'flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold',
                    isFail ? 'bg-red-600 text-white' : isDone ? 'bg-teal-700 text-white' : isCurrent ? 'bg-primary text-white ring-4 ring-primary-100' : 'bg-slate-200 text-slate-500',
                  )}>
                    {isFail ? <X className="h-3.5 w-3.5" /> : isDone ? <Check className="h-3.5 w-3.5" /> : i + 1}
                  </span>
                  <span className={clsx('text-xs font-medium', isFail ? 'text-red-700' : isCurrent ? 'text-slate-900' : 'text-slate-500')}>{label}</span>
                </span>
                {i < PIPELINE.length - 1 && <span className="mx-2 hidden h-px w-6 bg-slate-300 sm:block" aria-hidden="true" />}
              </>
            )}
          </li>
        );
      })}
    </ol>
  );
}
