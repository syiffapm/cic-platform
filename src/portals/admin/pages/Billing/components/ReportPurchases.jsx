import { useState } from 'react';
import { Badge, DataTable, Select } from '@/components/ui';
import { REPORT_TIERS, spendFor } from '@/lib/reportAccess';
import { formatDate } from '@/lib/format';
import { PERIODS } from '../../../data/billing';

const usd = (n) => `USD ${Number(n).toFixed(2)}`;

/** Pay-per-report purchases across institutions: count and USD by MFI and tier, plus the purchase list. */
export default function ReportPurchases({ purchases, institutions }) {
  const [period, setPeriod] = useState(PERIODS[0].value);
  const name = (id) => institutions.find((i) => i.id === id)?.short ?? id;
  const inPeriod = purchases.filter((p) => p.at.startsWith(period));
  const mfis = [...new Set(inPeriod.map((p) => p.mfiId))];
  const byMfi = mfis.map((id) => {
    const s = spendFor(inPeriod, id);
    const rows = inPeriod.filter((p) => p.mfiId === id);
    return {
      id, mfi: name(id), ...s, basicUsd: s.basic * REPORT_TIERS.Basic.price, fullUsd: s.full * REPORT_TIERS.Full.price,
      invoiced: rows.filter((p) => p.billing === 'Invoiced monthly').reduce((a, p) => a + p.price, 0),
      covered: rows.filter((p) => p.coveredBy === 'Subscription').length,
    };
  }).sort((a, b) => b.amount - a.amount);
  const all = spendFor(inPeriod);

  return (
    <div className="space-y-4 p-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[['Reports', all.count], ['Basic', `${all.basic} × USD 2`], ['Full', `${all.full} × USD 4`], ['Total', usd(all.amount)]].map(([k, v]) => (
            <div key={k}><p className="text-[11px] text-slate-500">{k}</p><p className="text-lg font-semibold text-slate-900">{v}</p></div>
          ))}
        </div>
        <Select label="Period" value={period} onChange={(e) => setPeriod(e.target.value)} options={PERIODS} className="w-48" />
      </div>
      <DataTable dense rows={byMfi} columns={[
        { key: 'mfi', header: 'Institution' },
        { key: 'basic', header: 'Basic', render: (r) => `${r.basic} · ${usd(r.basicUsd)}` },
        { key: 'full', header: 'Full', render: (r) => `${r.full} · ${usd(r.fullUsd)}` },
        { key: 'covered', header: 'Subscription', render: (r) => (r.covered ? `${r.covered} report(s)` : '—') },
        { key: 'invoiced', header: 'To invoice', render: (r) => usd(r.invoiced) },
        { key: 'amount', header: 'Total', sortable: true, render: (r) => <span className="font-semibold">{usd(r.amount)}</span>, className: 'text-right' },
      ]} />
      <DataTable dense rows={inPeriod} pageSize={8} searchKeys={['mfiId', 'borrowerId', 'purchasedBy']} columns={[
        { key: 'at', header: 'Date', sortable: true, render: (r) => formatDate(r.at.slice(0, 10)) },
        { key: 'mfiId', header: 'Institution', render: (r) => name(r.mfiId) },
        { key: 'borrowerId', header: 'Borrower', className: 'font-mono text-xs' },
        { key: 'tier', header: 'Report', render: (r) => <Badge tone={r.tier === 'Full' ? 'navy' : 'slate'}>{r.tier}</Badge> },
        { key: 'price', header: 'Price', render: (r) => (r.coveredBy ? 'Subscription' : usd(r.price)) },
        { key: 'payment', header: 'Payment', render: (r) => r.payment?.method ?? 'Monthly invoice (postpaid)' },
        { key: 'purchasedBy', header: 'Purchased by' },
      ]} />
      <p className="text-[11px] text-slate-500">Basic USD 2 · Full USD 4 per borrower per institution; one purchase unlocks the report for every user of that institution for 30 days.</p>
    </div>
  );
}
