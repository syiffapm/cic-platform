import clsx from 'clsx';
import { Check } from 'lucide-react';
import { Badge, Card, CardHeader, DataTable } from '@/components/ui';
import { formatMMK, formatNumber } from '@/lib/format';
import { PRICE, TARIFF_PLANS, USAGE, planOf } from '../../../data/billing';

export function TariffPlans() {
  return (
    <div className="space-y-4 p-5">
      <div className="grid gap-4 md:grid-cols-3">
        {TARIFF_PLANS.map((p) => (
          <div key={p.id} className={clsx('rounded-xl border p-5', p.id === 'Premium' ? 'border-primary bg-primary-50/40' : 'border-slate-200')}>
            <div className="flex items-center justify-between"><h4 className="text-base font-semibold text-slate-900">{p.name}</h4><Badge tone={p.tone}>{p.id === 'Premium' ? 'Tier 1 MFIs' : p.id === 'Standard' ? 'Most MFIs' : 'Small MFIs'}</Badge></div>
            <p className="mt-3 text-2xl font-bold text-slate-900">{formatMMK(p.monthly)}<span className="text-sm font-normal text-slate-500"> / month</span></p>
            <p className="mt-1 text-xs text-slate-500">Includes {formatNumber(p.quota)} inquiries per month</p>
            <ul className="mt-4 space-y-1.5 text-sm text-slate-700">
              {p.features.map((f) => <li key={f} className="flex gap-2"><Check className="mt-0.5 h-4 w-4 shrink-0 text-teal-600" aria-hidden="true" />{f}</li>)}
            </ul>
          </div>
        ))}
      </div>
      <div className="overflow-x-auto rounded-lg border border-slate-200">
        <table className="w-full text-sm">
          <caption className="sr-only">Per-inquiry prices</caption>
          <thead className="bg-slate-50 text-left text-[11px] uppercase tracking-wide text-slate-500"><tr><th scope="col" className="px-4 py-2">Per-inquiry fee (beyond included quota)</th><th scope="col" className="px-4 py-2">Price</th><th scope="col" className="px-4 py-2">Notes</th></tr></thead>
          <tbody className="divide-y divide-slate-100">
            <tr><td className="px-4 py-2.5">Credit Report — Basic (S2)</td><td className="px-4 py-2.5 font-medium">{formatMMK(PRICE.Basic)}</td><td className="px-4 py-2.5 text-xs text-slate-500">Counts against quota first</td></tr>
            <tr><td className="px-4 py-2.5">Credit Report — Full (S3, incl. risk grade S4)</td><td className="px-4 py-2.5 font-medium">{formatMMK(PRICE.Full)}</td><td className="px-4 py-2.5 text-xs text-slate-500">No-hit results are not billed</td></tr>
            <tr><td className="px-4 py-2.5">Retries / duplicates within 5 min</td><td className="px-4 py-2.5 font-medium">0 MMK</td><td className="px-4 py-2.5 text-xs text-slate-500">Excluded automatically</td></tr>
          </tbody>
        </table>
      </div>
      <p className="text-[11px] text-slate-500">All prices exclude 5% commercial tax. Tariff changes follow maker-checker and take effect from the next billing period.</p>
    </div>
  );
}

export function Entitlements({ institutions }) {
  const rows = institutions.filter((i) => USAGE[i.id]).map((i) => {
    const u = USAGE[i.id]; const plan = planOf(u.plan);
    const used = u.basic + u.full;
    return { id: i.id, name: i.name, short: i.short, status: i.status, plan: u.plan, quota: plan.quota, used, pct: Math.round((used / plan.quota) * 100), overage: Math.max(0, used - plan.quota) };
  });
  const columns = [
    { key: 'name', header: 'MFI', sortable: true, render: (r) => <div><p className="font-medium text-slate-800">{r.name}</p><p className="text-[11px] text-slate-500">{r.id} · <Badge status={r.status} /></p></div> },
    { key: 'plan', header: 'Plan', sortable: true, render: (r) => <Badge tone={planOf(r.plan).tone}>{r.plan}</Badge> },
    { key: 'quota', header: 'Included quota', sortable: true, render: (r) => formatNumber(r.quota), className: 'text-right' },
    { key: 'used', header: 'Used (Sep)', sortable: true, render: (r) => formatNumber(r.used), className: 'text-right' },
    { key: 'pct', header: 'Quota use', sortable: true, render: (r) => (
      <div className="w-40">
        <div className="h-2 rounded-full bg-slate-100" role="progressbar" aria-valuenow={Math.min(r.pct, 100)} aria-valuemin={0} aria-valuemax={100} aria-label={`${r.short} quota use`}>
          <div className={clsx('h-2 rounded-full', r.pct > 100 ? 'bg-red-500' : r.pct > 80 ? 'bg-amber-500' : 'bg-teal-600')} style={{ width: `${Math.min(r.pct, 100)}%` }} />
        </div>
        <p className="mt-0.5 text-[11px] text-slate-500">{r.pct}%</p>
      </div>
    ) },
    { key: 'overage', header: 'Overage (billable)', sortable: true, render: (r) => (r.overage ? <span className="font-medium text-red-700">{formatNumber(r.overage)}</span> : <span className="text-slate-500">—</span>), className: 'text-right' },
  ];
  return (
    <Card className="border-0 shadow-none">
      <CardHeader title="Entitlements & quotas" subtitle="Month-to-date, September 2026 · retries excluded" />
      <DataTable columns={columns} rows={rows} searchKeys={['name', 'id', 'plan']} pageSize={12} />
    </Card>
  );
}
