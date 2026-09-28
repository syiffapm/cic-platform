import clsx from 'clsx';
import { useMemo, useState } from 'react';
import { BadgeCheck, Building2, MapPin } from 'lucide-react';
import { Badge, Button, EmptyState, Input, Select } from '@/components/ui';
import { formatNumber } from '@/lib/format';
import { StickyActions } from '../../components/Common';

/** Step 1 — choose a licensed MFI. Only institutions whose licence is currently "Licensed" can receive applications. */
export default function ChooseLender({ institutions, value, onChange, onNext, homeRegion }) {
  const licensed = useMemo(() => institutions.filter((i) => i.status === 'Licensed'), [institutions]);
  const regions = [...new Set(licensed.map((i) => i.region))].sort();
  const [region, setRegion] = useState(homeRegion && regions.includes(homeRegion) ? homeRegion : '');
  const [q, setQ] = useState('');
  const list = licensed.filter((i) => (!region || i.region === region)
    && (!q || `${i.name} ${i.short} ${i.township} ${i.products.join(' ')}`.toLowerCase().includes(q.toLowerCase())));

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <Select label="Region" value={region} onChange={(e) => setRegion(e.target.value)} options={[{ value: '', label: 'All regions' }, ...regions.map((r) => ({ value: r, label: r }))]} hint="Lenders usually serve borrowers near their branches." />
        <Input label="Search lender, township or product" value={q} onChange={(e) => setQ(e.target.value)} placeholder="e.g. Agriculture loan, Hlaingthaya" />
      </div>
      <p className="text-xs text-slate-500">{list.length} licensed lender{list.length === 1 ? '' : 's'} accept online applications{region ? ` in ${region}` : ''}. Suspended, revoked or under-review institutions are not listed.</p>

      <fieldset>
        <legend className="sr-only">Choose a lender</legend>
        <div className="grid gap-3 md:grid-cols-2">
          {list.map((i) => (
            <label key={i.id} className={clsx('flex cursor-pointer gap-3 rounded-lg border p-4 transition-colors', value === i.id ? 'border-primary bg-primary-50/60 ring-1 ring-primary' : 'border-slate-200 bg-white hover:border-primary-200')}>
              <input type="radio" name="mfi" value={i.id} checked={value === i.id} onChange={() => onChange(i.id)} className="mt-1 accent-[hsl(214_45%_22%)]" />
              <span className="min-w-0 flex-1">
                <span className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-semibold text-slate-900">{i.name}</span>
                  <Badge tone="green"><BadgeCheck className="h-3 w-3" aria-hidden="true" /> Licensed</Badge>
                </span>
                <span className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
                  <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" aria-hidden="true" />{i.township}, {i.region}</span>
                  <span className="inline-flex items-center gap-1"><Building2 className="h-3 w-3" aria-hidden="true" />{formatNumber(i.branches)} branches</span>
                  <span className="font-mono">Licence {i.licenceNo}</span>
                </span>
                <span className="mt-2 flex flex-wrap gap-1.5">{i.products.map((p) => <Badge key={p} tone="teal">{p}</Badge>)}</span>
              </span>
            </label>
          ))}
        </div>
        {list.length === 0 && <EmptyState compact icon={Building2} title="No licensed lender matches" description="Choose “All regions” or try a different word, such as a township or a loan type." action={<Button size="sm" variant="outline" onClick={() => { setRegion(''); setQ(''); }}>Show all licensed lenders</Button>} />}
      </fieldset>

      <StickyActions className="sm:justify-end">
        <Button onClick={onNext} disabled={!licensed.some((i) => i.id === value)}>Continue</Button>
      </StickyActions>
    </div>
  );
}
