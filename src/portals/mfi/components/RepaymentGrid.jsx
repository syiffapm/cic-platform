import clsx from 'clsx';
import { GRID_MONTHS } from '../data/borrowers';
import { mfiShort } from './reportModel';

/** 24-month payment grid. Each cell shows a code and colour; the legend explains both, so colour is never the only cue. */
const CODES = {
  0: ['OK', 'bg-emerald-700 text-white', 'Paid on time'],
  1: ['1', 'bg-amber-300 text-slate-900', '1–30 days past due'],
  2: ['2', 'bg-orange-700 text-white', '31–60 days past due'],
  3: ['3', 'bg-red-600 text-white', '61–90 days past due'],
  4: ['4', 'bg-red-900 text-white', 'Over 90 days past due'],
  C: ['C', 'bg-primary-600 text-white', 'Closed / settled'],
  '.': ['', 'bg-slate-100 text-slate-600', 'Not open / no data'],
};

export function GridLegend() {
  return (
    <ul className="flex flex-wrap gap-x-4 gap-y-1.5 text-[11px] text-slate-600">
      {Object.entries(CODES).map(([k, [label, cls, text]]) => (
        <li key={k} className="flex items-center gap-1.5">
          <span className={clsx('flex h-4 min-w-[1rem] items-center justify-center rounded-sm px-0.5 text-[11px] font-bold', cls)}>{label || '·'}</span>{text}
        </li>
      ))}
    </ul>
  );
}

export default function RepaymentGrid({ loans }) {
  return (
    <div className="space-y-3">
      <div className="relative overflow-x-auto scrollbar-thin" tabIndex={0} role="region" aria-label="24-month payment history — scroll horizontally for earlier months">
        <table className="w-full border-separate border-spacing-[3px] text-[11px]">
          <caption className="sr-only">Monthly repayment status for each loan, September 2024 to August 2026</caption>
          <thead>
            <tr>
              <th scope="col" className="sticky left-0 z-10 bg-white pr-2 text-left font-semibold text-slate-500">Loan</th>
              {GRID_MONTHS.map((m) => <th key={m} scope="col" className="whitespace-nowrap px-0.5 font-medium text-slate-500">{m}</th>)}
            </tr>
          </thead>
          <tbody>
            {loans.map((l) => (
              <tr key={l.loanId}>
                <th scope="row" className="sticky left-0 z-10 whitespace-nowrap bg-white pr-2 text-left font-medium text-slate-700">
                  {l.loanId}<span className="block text-[11px] font-normal text-slate-500">{mfiShort(l.mfiId)} · {l.product}</span>
                </th>
                {[...l.history].map((c, i) => {
                  const [label, cls, text] = CODES[c] ?? CODES['.'];
                  return (
                    <td key={i} title={`${GRID_MONTHS[i]}: ${text}`} className={clsx('h-6 min-w-[1.6rem] rounded-sm text-center font-bold', cls)}>
                      <span aria-hidden="true">{label}</span><span className="sr-only">{`${GRID_MONTHS[i]}: ${text}`}</span>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <GridLegend />
    </div>
  );
}
