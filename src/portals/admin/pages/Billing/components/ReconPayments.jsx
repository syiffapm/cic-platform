import clsx from 'clsx';
import { Alert, Badge, DataTable } from '@/components/ui';
import { formatDate, formatMMK, formatNumber } from '@/lib/format';
import { PAYMENTS, RECON } from '../../../data/billing';

const TODAY = '2026-09-25';

export function Reconciliation({ institutions }) {
  const name = (id) => institutions.find((i) => i.id === id)?.name ?? id;
  const rows = RECON.map((r) => ({ ...r, id: r.mfiId, mfi: name(r.mfiId), variance: r.invoiced - r.billable }));
  const off = rows.filter((r) => r.variance !== 0).length;
  const columns = [
    { key: 'mfi', header: 'MFI', sortable: true },
    { key: 'billable', header: 'Billable inquiries (ledger)', render: (r) => formatNumber(r.billable), className: 'text-right' },
    { key: 'invoiced', header: 'Invoiced quantity', render: (r) => formatNumber(r.invoiced), className: 'text-right' },
    { key: 'variance', header: 'Variance', sortable: true, className: 'text-right', render: (r) => (
      <span className={clsx('rounded px-1.5 py-0.5 font-semibold', r.variance === 0 ? 'text-emerald-700' : 'bg-red-50 text-red-700')}>{r.variance > 0 ? '+' : ''}{formatNumber(r.variance)}</span>
    ) },
    { key: 'note', header: 'Resolution', render: (r) => (r.variance === 0 ? <Badge tone="green">Matched</Badge> : <span className="text-xs text-slate-600">{r.note}</span>) },
  ];
  return (
    <div>
      <div className="p-4">
        <Alert tone={off ? 'warning' : 'success'} title={`August 2026 reconciliation: ${rows.length - off} matched, ${off} with variance`}>
          Compares non-retry billable events in the ledger with quantities on issued invoices. Positive variance = over-billed (credit note required).
        </Alert>
      </div>
      <DataTable columns={columns} rows={rows} pageSize={12} dense />
    </div>
  );
}

export function PaymentStatus({ institutions }) {
  const name = (id) => institutions.find((i) => i.id === id)?.short ?? id;
  const rows = PAYMENTS.map((p) => ({ ...p, id: p.invoice, mfi: name(p.mfiId), daysOverdue: p.status === 'Overdue' ? Math.round((new Date(TODAY) - new Date(p.dueDate)) / 86400000) : 0 }));
  const outstanding = rows.filter((r) => r.status !== 'Paid').reduce((a, r) => a + r.total, 0);
  const columns = [
    { key: 'invoice', header: 'Invoice', className: 'font-mono text-xs' },
    { key: 'mfi', header: 'MFI', sortable: true },
    { key: 'total', header: 'Amount', sortable: true, render: (r) => formatMMK(r.total), className: 'text-right whitespace-nowrap' },
    { key: 'dueDate', header: 'Due date', sortable: true, render: (r) => formatDate(r.dueDate), className: 'whitespace-nowrap' },
    { key: 'status', header: 'Status', sortable: true, render: (r) => (
      <div><Badge status={r.status} />{r.daysOverdue > 0 && <p className="mt-0.5 text-[11px] text-red-600">{r.daysOverdue} days overdue</p>}</div>
    ) },
    { key: 'paidOn', header: 'Paid on / reference', render: (r) => (r.paidOn ? <span className="text-xs">{formatDate(r.paidOn)} · {r.ref}</span> : <span className="text-slate-500">—</span>) },
  ];
  return (
    <div>
      <p className="px-4 pt-4 text-sm text-slate-600">August 2026 invoices · outstanding <b className="text-slate-900">{formatMMK(outstanding)}</b>. Overdue MFIs receive a reminder (template NT-10) and inquiry access is throttled after 30 days.</p>
      <DataTable columns={columns} rows={rows} searchKeys={['invoice', 'mfi']} pageSize={12} />
    </div>
  );
}
