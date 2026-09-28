import { Download, Receipt } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Alert, Badge, Card, CardBody, CardHeader, ChartCard, DataTable, PageHeader, StatCard } from '@/components/ui';
import { useStore } from '@/context/StoreContext';
import { AS_OF } from '@/data/kpis';
import { PURPOSE_CODES } from '@/data/reference';
import { formatDate, formatMMK, formatNumber } from '@/lib/format';
import { INVOICES, RETRIES_EXCLUDED, TARIFF, USAGE_BY_PURPOSE, USAGE_BY_USER } from '../../data/institution';
import { useTenant } from '../../components/MfiState';
import { downloadFile } from '../../components/download';
import { PermButton } from '../../components/access';
import { AXIS, GRID, SERIES, TOOLTIP } from '../../components/chartTheme';
import PlanCard from '../../components/billing/PlanCard';
import ReportPurchases from '../../components/billing/ReportPurchases';
import PaymentDefaults from '../../components/billing/PaymentDefaults';

const purposeLabel = (c) => PURPOSE_CODES.find((p) => p.code === c)?.label ?? c;

/** Usage and billing. */
export default function Billing() {
  const { user, tenant } = useTenant();
  const { logAudit } = useStore();
  const users = USAGE_BY_USER.map((u) => ({ ...u, id: u.user, total: u.full + u.basic + u.noHit }));
  const purposes = USAGE_BY_PURPOSE.map((p) => ({ ...p, id: p.code, label: `${p.code} — ${purposeLabel(p.code)}` }));
  const total = users.reduce((s, u) => s + u.total, 0);
  const unpaid = INVOICES.filter((i) => i.status === 'Unpaid');

  const download = (inv) => {
    const text = [
      'CREDIT INFORMATION CENTRE — INVOICE', `Invoice: ${inv.id}`, `Customer: Pact Global Microfinance Fund (${tenant})`, `Period: ${inv.period}`,
      `Billable inquiries: ${inv.inquiries}`, `Retries / technical duplicates excluded (not billed): ${inv.retriesExcluded}`,
      `Subscription: ${TARIFF.subscription} MMK`, `Amount due: ${inv.amount} MMK`, `Due date: ${inv.due}`, `Status: ${inv.status}`,
    ].join('\n');
    downloadFile(`${inv.id}.txt`, text, 'text/plain');
    logAudit({ actor: user.name, role: user.role, tenant, action: 'INVOICE_DOWNLOAD', module: 'Billing', target: inv.id, outcome: 'Success' });
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Usage & billing" subtitle="Your plan, prepaid wallet and default payment method, credit report purchases in US dollars, inquiry volumes and invoices." />

      <PlanCard />
      <PaymentDefaults />
      <ReportPurchases />

      <h2 className="pt-2 text-sm font-semibold uppercase tracking-wide text-slate-500">Inquiry volume and invoices — August 2026</h2>

      <Alert tone="info" title="Retries are never billed">
        Technical retries, time-outs and duplicate requests with the same idempotency key are never charged. August 2026: {formatNumber(RETRIES_EXCLUDED)} retries excluded.
      </Alert>

      <div className="grid gap-4 sm:grid-cols-2">
        <StatCard label="Inquiries (Aug)" value={formatNumber(total)} icon={Receipt} tone="navy" definition="Full, Basic and no-hit inquiries that returned a result. Excludes retries." asOf={AS_OF} />
        <StatCard label="Outstanding invoices" value={formatMMK(unpaid.reduce((s, i) => s + i.amount, 0))} tone={unpaid.length ? 'red' : 'green'} definition="Sum of unpaid invoices issued before USD report pricing." />
      </div>

      <div className="grid gap-6 lg:grid-cols-2 [&>*]:min-w-0">
        <ChartCard title="Inquiries by user" subtitle="By report type, August 2026" asOf={AS_OF} height={260}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={users} layout="vertical" margin={{ top: 4, right: 16, left: 24, bottom: 0 }}>
              <CartesianGrid stroke={GRID} horizontal={false} />
              <XAxis type="number" tick={AXIS} tickLine={false} axisLine={false} />
              <YAxis type="category" dataKey="user" tick={AXIS} tickLine={false} axisLine={false} width={100} />
              <Tooltip {...TOOLTIP} cursor={{ fill: '#f1f5f9' }} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="full" name="Full" stackId="a" fill={SERIES[0]} stroke="#fff" strokeWidth={1} />
              <Bar dataKey="basic" name="Basic" stackId="a" fill={SERIES[1]} stroke="#fff" strokeWidth={1} />
              <Bar dataKey="noHit" name="No hit" stackId="a" fill={SERIES[2]} stroke="#fff" strokeWidth={1} radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
        <ChartCard title="Inquiries by purpose" subtitle="August 2026" asOf={AS_OF} height={260}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={purposes} margin={{ top: 4, right: 8, left: -8, bottom: 0 }}>
              <CartesianGrid stroke={GRID} vertical={false} />
              <XAxis dataKey="code" tick={AXIS} tickLine={false} axisLine={false} />
              <YAxis tick={AXIS} tickLine={false} axisLine={false} />
              <Tooltip {...TOOLTIP} cursor={{ fill: '#f1f5f9' }} labelFormatter={(c) => `${c} — ${purposeLabel(c)}`} />
              <Bar dataKey="count" name="Inquiries" fill={SERIES[0]} radius={[4, 4, 0, 0]} maxBarSize={48} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <div className="grid gap-6 lg:grid-cols-2 [&>*]:min-w-0">
        <Card>
          <CardHeader title="Usage by user" />
          <DataTable dense rows={users} emptyTitle="No inquiries this month" columns={[
            { key: 'user', header: 'User' }, { key: 'full', header: 'Full', render: (r) => formatNumber(r.full) }, { key: 'basic', header: 'Basic', render: (r) => formatNumber(r.basic) },
            { key: 'noHit', header: 'No hit', render: (r) => formatNumber(r.noHit) }, { key: 'total', header: 'Total', render: (r) => formatNumber(r.total) },
          ]} />
        </Card>
        <Card>
          <CardHeader title="Usage by purpose" />
          <DataTable dense rows={purposes} emptyTitle="No inquiries this month" columns={[
            { key: 'label', header: 'Purpose' }, { key: 'count', header: 'Inquiries', render: (r) => formatNumber(r.count) },
            { key: 'share', header: 'Share', render: (r) => `${((r.count / purposes.reduce((s, p) => s + p.count, 0)) * 100).toFixed(1)}%` },
          ]} />
          <CardBody className="border-t border-slate-100 text-[11px] text-slate-500">Purpose totals include API inquiries; user totals group all API calls under the client name.</CardBody>
        </Card>
      </div>

      <Card>
        <CardHeader title="Invoices" subtitle="Payment by bank transfer to CIC account at CBM; reference the invoice number" icon={Receipt} />
        <DataTable rows={INVOICES} emptyTitle="No invoices issued yet" columns={[
          { key: 'id', header: 'Invoice', className: 'font-mono text-xs' },
          { key: 'period', header: 'Period' },
          { key: 'inquiries', header: 'Billable inquiries', render: (r) => <>{formatNumber(r.inquiries)}<span className="block text-[11px] text-slate-500">{r.retriesExcluded} retries excluded</span></> },
          { key: 'amount', header: 'Amount', render: (r) => <span className="font-medium">{formatMMK(r.amount)}</span> },
          { key: 'due', header: 'Due', render: (r) => formatDate(r.due) },
          { key: 'status', header: 'Status', render: (r) => <><Badge status={r.status} />{r.paidOn && <span className="block text-[11px] text-slate-500">Paid {formatDate(r.paidOn)}</span>}</> },
          { key: 'dl', header: '', className: 'text-right', render: (r) => <PermButton feature="mfi.billing" action="export" what="download invoices" size="sm" variant="ghost" icon={Download} onClick={() => download(r)} aria-label={`Download ${r.id}`}>Download</PermButton> },
        ]} />
      </Card>
    </div>
  );
}
