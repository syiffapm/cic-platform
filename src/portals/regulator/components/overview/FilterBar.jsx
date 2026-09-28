import { RotateCcw, SlidersHorizontal } from 'lucide-react';
import { Button, Select } from '@/components/ui';
import { PRODUCT_TYPES } from '@/data/reference';
import { TOWNSHIP_REGIONS } from '../../data/townships';
import { DEFAULT_FILTERS } from './useExecutiveData';

/** One-row filter bar above all charts (GOV-02). Every change re-scales tiles, charts and the heat-map. */
export default function FilterBar({ value, onChange, share }) {
  const set = (k) => (e) => onChange({ ...value, [k]: e.target.value });
  const active = Object.entries(value).filter(([k, v]) => v && v !== DEFAULT_FILTERS[k]).length;
  return (
    <section aria-label="Dashboard filters" className="mb-6 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between gap-3">
        <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
          <SlidersHorizontal className="h-3.5 w-3.5" aria-hidden="true" /> Filters
          {active > 0 && <span className="rounded-full bg-warm px-1.5 text-[11px] font-bold text-slate-900">{active}</span>}
        </p>
        <div className="flex items-center gap-3">
          {share < 0.999 && (
            <span className="text-[11px] text-slate-500">
              Showing <b className="text-slate-800">{(share * 100).toFixed(1)}%</b> of sector portfolio
            </span>
          )}
          <Button variant="ghost" size="sm" icon={RotateCcw} onClick={() => onChange(DEFAULT_FILTERS)} disabled={!active}>Reset</Button>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Select label="Period" value={value.period} onChange={set('period')} options={[{ value: '3m', label: 'Last 3 months' }, { value: '6m', label: 'Last 6 months' }, { value: '12m', label: 'Last 12 months' }]} />
        <Select label="Region / State" value={value.region} onChange={set('region')} placeholder="All regions" options={TOWNSHIP_REGIONS} />
        <Select label="MFI tier" value={value.tier} onChange={set('tier')} placeholder="All tiers" options={['Tier 1', 'Tier 2', 'Tier 3']} />
        <Select label="Product" value={value.product} onChange={set('product')} placeholder="All products" options={PRODUCT_TYPES} />
      </div>
    </section>
  );
}
