import { FileText, Receipt, Wallet } from 'lucide-react';
import { Badge, Card, CardBody, CardHeader, DataTable, StatCard } from '@/components/ui';
import { useStore } from '@/context/StoreContext';
import { REPORT_TIERS, spendFor } from '@/lib/reportAccess';
import { formatDate, maskNrc } from '@/lib/format';
import { getBorrowerFile } from '../../data/borrowers';
import { useTenant } from '../MfiState';
import { useBillingPlan } from '../reportAccess/billingPlan';

export const MONTH = '2026-09';
const usd = (n) => `USD ${Number(n).toFixed(2)}`;
const onInvoice = (p) => p.billing === 'Invoiced monthly';

/** Credit report purchases this month: totals, invoice line, purchase list and wallet movements. */
export default function ReportPurchases() {
  const store = useStore();
  const { tenant } = useTenant();
  const { plan } = useBillingPlan();
  const mine = store.reportPurchases.filter((p) => p.mfiId === tenant && p.at.startsWith(MONTH));
  const total = spendFor(store.reportPurchases, tenant, MONTH);
  const invoiced = mine.filter(onInvoice);
  const inv = { basic: invoiced.filter((p) => p.tier === 'Basic').length, full: invoiced.filter((p) => p.tier === 'Full').length };
  const invAmount = inv.basic * REPORT_TIERS.Basic.price + inv.full * REPORT_TIERS.Full.price;
  const paidNow = mine.filter((p) => !onInvoice(p)).reduce((s, p) => s + p.price, 0);
  const rows = mine.map((p) => {
    const f = getBorrowerFile(p.borrowerId, store);
    return { ...p, borrower: f?.nameEn ?? p.borrowerId, nrc: f?.nrc };
  });

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <StatCard label="Reports purchased (Sep)" value={total.count} icon={FileText} tone="navy" definition={`Basic ${total.basic} · Full ${total.full}. Each unlock is shared by every user of your institution for 30 days.`} asOf="25 Sep 2026" />
        <StatCard label="Report spend (Sep)" value={usd(total.amount)} icon={Receipt} tone="teal" definition="Basic × USD 2 + Full × USD 4, all payment methods. Subscription reports count as USD 0." asOf="25 Sep 2026" />
        <StatCard label="On next invoice" value={usd(invAmount)} tone="warm" definition="Reports paid by monthly invoice (postpaid); billed on the October invoice for September." asOf="25 Sep 2026" />
        <StatCard label="Wallet balance" value={usd(plan.walletBalance)} icon={Wallet} tone={plan.walletBalance < 10 ? 'red' : 'green'} definition={`Prepaid balance. Paid at checkout this month (wallet, KBZPay, Wave, bank): ${usd(paidNow)}.`} asOf="25 Sep 2026" />
      </div>

      <Card>
        <CardHeader title="Credit report purchases — September 2026" subtitle="Every unlock by any user of your institution" icon={FileText} />
        <CardBody className="border-b border-slate-100 py-3">
          <p className="text-sm text-slate-700">
            <span className="font-medium">Invoice line:</span> Credit reports — Basic {inv.basic} × USD 2, Full {inv.full} × USD 4 = <b>{usd(invAmount)}</b>
            {paidNow > 0 && <span className="text-slate-500"> · paid at checkout {usd(paidNow)} (not invoiced again)</span>}
          </p>
        </CardBody>
        <DataTable
          dense
          rows={rows}
          searchKeys={['borrower', 'borrowerId', 'purchasedBy', 'purpose']}
          columns={[
            { key: 'at', header: 'Date', sortable: true, render: (r) => formatDate(r.at.slice(0, 10)) },
            { key: 'borrower', header: 'Borrower', render: (r) => <>{r.borrower}<span className="block font-mono text-[11px] text-slate-500">{maskNrc(r.nrc)}</span></> },
            { key: 'tier', header: 'Report', render: (r) => <Badge tone={r.tier === 'Full' ? 'navy' : 'slate'}>{r.tier}</Badge> },
            { key: 'price', header: 'Price', render: (r) => (r.coveredBy ? 'Subscription' : usd(r.price)) },
            { key: 'purchasedBy', header: 'Purchased by' },
            { key: 'purpose', header: 'Purpose' },
            { key: 'payment', header: 'Payment', render: (r) => <>{r.payment?.method ?? 'Monthly invoice (postpaid)'}{r.payment?.receiptNo && <span className="block font-mono text-[11px] text-slate-500">{r.payment.receiptNo}</span>}</> },
          ]}
        />
      </Card>

      {plan.walletLedger?.length > 0 && (
        <Card>
          <CardHeader title="Wallet transactions" icon={Wallet} />
          <DataTable dense rows={plan.walletLedger} columns={[
            { key: 'at', header: 'Time' }, { key: 'type', header: 'Type' },
            { key: 'amount', header: 'Amount', render: (r) => <span className={r.amount < 0 ? 'text-red-600' : 'text-emerald-700'}>{r.amount < 0 ? '−' : '+'}{usd(Math.abs(r.amount))}</span> },
            { key: 'method', header: 'Method' }, { key: 'ref', header: 'Reference', className: 'text-xs' }, { key: 'by', header: 'By' },
          ]} />
        </Card>
      )}
    </div>
  );
}
