import clsx from 'clsx';
import { HISTORY_CODES, HISTORY_MONTHS } from '../lib/myFile';

/** Colour legend for the 24-month repayment grid. */
export function RepaymentLegend({ className }) {
  return (
    <ul className={clsx('flex flex-wrap gap-x-4 gap-y-1.5 text-[11px] text-slate-600', className)} aria-label="Repayment grid legend">
      {Object.entries(HISTORY_CODES).map(([code, c]) => (
        <li key={code} className="flex items-center gap-1.5">
          <span className={clsx('inline-block h-3.5 w-3.5 rounded-sm ring-1 ring-inset ring-black/5', c.cls)} aria-hidden="true" />
          {c.label}
        </li>
      ))}
    </ul>
  );
}

/**
 * 24-month repayment history, oldest → newest. Each cell has a text label for screen readers,
 * so colour is never the only signal (WCAG 1.4.1).
 */
export default function RepaymentGrid({ history, compact = false, label = 'Repayment history, last 24 months' }) {
  return (
    <div className="relative max-w-full overflow-x-auto rounded scrollbar-thin focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary" tabIndex={0} role="region" aria-label={`${label} — scroll sideways to see every month`}>
      <ol className="grid min-w-[520px] grid-cols-[repeat(24,minmax(0,1fr))] gap-0.5" aria-label="Repayment history, last 24 months">
        {HISTORY_MONTHS.map((m, i) => {
          const code = history[i] ?? '.';
          const c = HISTORY_CODES[code] ?? HISTORY_CODES['.'];
          const showYear = i === 0 || m.label === 'Jan';
          return (
            <li key={m.key} className="flex flex-col items-center gap-0.5">
              <span className="h-3 text-[9px] font-semibold text-slate-500">{showYear ? m.year : ''}</span>
              <span
                className={clsx('flex w-full items-center justify-center rounded-sm text-[9px] font-bold ring-1 ring-inset ring-black/5', compact ? 'h-4' : 'h-6', c.cls)}
                title={`${m.label} ${m.year}: ${c.label}`}
              >
                <span className="sr-only">{`${m.label} ${m.year}: ${c.label}`}</span>
                <span aria-hidden="true">{c.cell}</span>
              </span>
              {!compact && <span className="text-[9px] text-slate-500" aria-hidden="true">{m.label[0]}</span>}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
