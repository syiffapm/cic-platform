import { Link } from 'react-router-dom';
import clsx from 'clsx';
import { AS_OF } from '@/data/kpis';
import { formatNumber } from '@/lib/format';
import { PAR30_LEGEND, par30Tone } from '../../lib/chart';

/** Side panel of the regional heat-map: legend, portfolio by region (or township) and selection details. */
export default function RegionalPanel({ rows, byTownship, activeRegion, onPickRegion, onPickTownship, selected }) {
  const max = Math.max(...rows.map((r) => r.portfolio), 1);
  return (
    <div className="flex flex-col gap-4 text-sm">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">PAR30</p>
        <ul className="mt-2 flex flex-wrap gap-x-3 gap-y-1.5 text-[11px] text-slate-600">
          {PAR30_LEGEND.map((l) => (
            <li key={l.label} className="inline-flex items-center gap-1.5"><span className="h-3 w-3 rounded-sm" style={{ background: par30Tone(l.v).bg }} aria-hidden="true" />{l.label}</li>
          ))}
        </ul>
      </div>

      <div>
        <div className="flex items-baseline justify-between">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">{byTownship ? `Portfolio by township · ${activeRegion}` : 'Portfolio by region'}</p>
          {byTownship && <button type="button" onClick={() => onPickRegion('')} className="text-[11px] font-medium text-primary hover:underline">All regions</button>}
        </div>
        <p className="text-[11px] text-slate-500">Gross portfolio, MMK billions</p>
        <ul className="mt-2 max-h-72 space-y-1 overflow-y-auto pr-1 scrollbar-thin">
          {rows.map((r) => (
            <li key={r.name}>
              <button
                type="button"
                onClick={() => (byTownship ? onPickTownship(r.name) : onPickRegion(r.name))}
                className={clsx('w-full rounded-md px-2 py-1.5 text-left hover:bg-white', selected === r.name && 'bg-white ring-1 ring-primary-200')}
                title={byTownship ? `Show ${r.name} details` : `Filter the dashboard to ${r.name}`}
              >
                <span className="flex items-center justify-between gap-2 text-xs">
                  <span className="flex min-w-0 items-center gap-1.5 font-medium text-slate-800">
                    <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: par30Tone(r.par30).bg }} aria-hidden="true" />
                    {r.name}
                  </span>
                  <span className="shrink-0 tabular-nums text-slate-600">{formatNumber(r.portfolio)} bn · <span className="font-semibold text-slate-900">{r.par30}%</span></span>
                </span>
                <span className="mt-1 block h-1.5 rounded-full bg-slate-200" aria-hidden="true">
                  <span className="block h-1.5 rounded-full bg-teal" style={{ width: `${(r.portfolio / max) * 100}%` }} />
                </span>
              </button>
            </li>
          ))}
        </ul>
      </div>
      <p className="text-[11px] text-slate-500">Source: CIC DWH · As of {AS_OF} · <Link to="/gov/census" className="font-medium text-primary underline">Census map</Link></p>
    </div>
  );
}
