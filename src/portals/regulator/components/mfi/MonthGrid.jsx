import clsx from 'clsx';

/** Six-month submission grid: on time / late (n days) / missing. Text + colour, never colour alone. */
export default function MonthGrid({ months, compact }) {
  return (
    <ul className="flex gap-1" aria-label="Submission history, last 6 months">
      {months.map((m) => {
        const state = m.daysLate === null ? 'missing' : m.daysLate > 0 ? 'late' : 'ok';
        return (
          <li
            key={m.month}
            title={`${m.month}: ${state === 'ok' ? 'on time' : state === 'late' ? `${m.daysLate} days late` : 'missing'}`}
            className={clsx(
              'flex flex-col items-center justify-center rounded text-[11px] font-semibold',
              compact ? 'h-7 w-9' : 'h-10 w-12',
              state === 'ok' && 'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200',
              state === 'late' && 'bg-amber-50 text-amber-800 ring-1 ring-inset ring-amber-300',
              state === 'missing' && 'bg-red-50 text-red-700 ring-1 ring-inset ring-red-200',
            )}
          >
            {!compact && <span className="font-normal text-slate-500">{m.month.slice(0, 3)}</span>}
            <span>{state === 'ok' ? '✓' : state === 'late' ? `+${m.daysLate}d` : '✕'}</span>
            <span className="sr-only">{m.month}: {state}</span>
          </li>
        );
      })}
    </ul>
  );
}
