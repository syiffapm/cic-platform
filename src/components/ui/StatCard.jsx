import clsx from 'clsx';
import { Info, TrendingDown, TrendingUp } from 'lucide-react';

const ICON_TONES = {
  navy: 'bg-primary-50 text-primary',
  warm: 'bg-amber-50 text-amber-600',
  teal: 'bg-teal-50 text-teal-600',
  green: 'bg-emerald-50 text-emerald-600',
  red: 'bg-red-50 text-red-600',
  violet: 'bg-violet-50 text-violet-600',
};

/**
 * KPI tile. `definition` and `asOf` implement the KPI dictionary requirement (GOV-01, G13):
 * every figure shows what it means and when it was measured.
 */
export default function StatCard({ label, value, icon: Icon, tone = 'navy', delta, deltaLabel, definition, asOf, className }) {
  const positive = typeof delta === 'number' ? delta >= 0 : null;
  return (
    <div className={clsx('rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5', className)}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="flex items-center gap-1 text-xs font-medium text-slate-500">
            {label}
            {definition && (
              <span className="group relative inline-flex">
                <Info className="h-3.5 w-3.5 cursor-help text-slate-500" aria-label={`Definition: ${definition}`} tabIndex={0} />
                <span role="tooltip" className="pointer-events-none absolute left-1/2 top-5 z-30 hidden w-56 -translate-x-1/2 rounded-lg bg-slate-900 p-2.5 text-[11px] font-normal leading-snug text-white shadow-lg group-hover:block group-focus-within:block">
                  {definition}
                </span>
              </span>
            )}
          </p>
          <p className="mt-2 break-words text-lg font-bold leading-tight text-slate-900 sm:text-2xl">{value}</p>
        </div>
        {Icon && (
          <div className={clsx('hidden rounded-lg p-2.5 sm:block', ICON_TONES[tone])}>
            <Icon className="h-5 w-5" aria-hidden="true" />
          </div>
        )}
      </div>
      {(delta !== undefined || asOf) && (
        <div className="mt-3 flex flex-wrap items-center justify-between gap-x-2 gap-y-1 text-[11px]">
          {delta !== undefined ? (
            <span className={clsx('inline-flex items-center gap-1 font-medium', positive ? 'text-emerald-700' : 'text-red-700')}>
              {positive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
              {typeof delta === 'number' ? `${delta > 0 ? '+' : ''}${delta}%` : delta}
              {deltaLabel && <span className="font-normal text-slate-500">{deltaLabel}</span>}
            </span>
          ) : <span />}
          {asOf && <span className="text-slate-500">As of {asOf}</span>}
        </div>
      )}
    </div>
  );
}
