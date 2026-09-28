import { useEffect, useRef, useState } from 'react';
import { Download, Play, Send } from 'lucide-react';
import { Alert, Badge, Button, DataTable, MakerCheckerBanner, Select, Stepper } from '@/components/ui';
import { roleName } from '@/data/roles';
import { formatMMK, formatNumber } from '@/lib/format';
import { PERIODS, USAGE, computeInvoice } from '../../../data/billing';
import { downloadCsv } from '../../../lib/csv';

const STEPS = ['Freeze ledger', 'Exclude retries & duplicates', 'Apply tariffs & quotas', 'Compute tax', 'Draft invoices'];

/** Monthly invoice run (ADM-10): generate drafts → maker-checker → issue. */
export default function InvoiceRun({ institutions, invoices, api, readOnly, canExport = true, maker, checkerRole, audit, requestApproval, toast }) {
  const [period, setPeriod] = useState('2026-09');
  const [step, setStep] = useState(-1);
  const timer = useRef(null);
  useEffect(() => () => clearInterval(timer.current), []);
  const rows = invoices.filter((i) => i.period === period);
  const issued = rows.some((r) => r.status === 'Issued');
  const awaiting = rows.some((r) => r.status === 'Awaiting approval');

  const run = () => {
    setStep(0);
    let s = 0;
    timer.current = setInterval(() => {
      s += 1;
      setStep(s);
      if (s >= STEPS.length) {
        clearInterval(timer.current);
        const drafts = institutions.filter((i) => USAGE[i.id]).map((i) => computeInvoice(i, period));
        api.set((list) => [...list.filter((x) => x.period !== period), ...drafts]);
        const excluded = drafts.reduce((a, d) => a + d.retriesExcluded, 0);
        audit('INVOICE_RUN', `Period ${period} · ${drafts.length} draft invoices`, { outcome: `${excluded} retries/duplicates excluded` });
        toast(`${drafts.length} draft invoices generated`, 'success');
        setStep(-1);
      }
    }, 450);
  };

  const submit = () => {
    const total = rows.reduce((a, r) => a + r.total, 0);
    const a = requestApproval({
      type: 'Invoice run', checkerRole, summary: `Issue ${rows.length} invoices for ${period} — total ${formatMMK(total)}`,
      payload: {
        diff: [{ field: 'Invoices', from: 'Draft', to: 'Issued' }, { field: 'Total incl. tax', from: '—', to: formatMMK(total) }],
        effect: rows.map((r) => ({ target: 'admin', collection: 'invoices', op: 'patch', id: r.id, changes: { status: 'Issued' } })),
      },
    });
    rows.forEach((r) => api.patch(r.id, { status: 'Awaiting approval' }));
    toast(`${a.id}: invoice run sent for approval`, 'success');
  };

  const exportCsv = () => {
    downloadCsv(`cic-invoices-${period}.csv`, rows, [
      { key: 'id', header: 'Invoice' }, { key: 'mfi', header: 'MFI' }, { key: 'events', header: 'Billable events' }, { key: 'retriesExcluded', header: 'Retries excluded' },
      { key: 'subscription', header: 'Subscription' }, { key: 'usage', header: 'Usage' }, { key: 'tax', header: 'Tax' }, { key: 'total', header: 'Total' },
    ]);
    audit('INVOICE_EXPORT', `Invoices ${period}`);
  };

  const columns = [
    { key: 'id', header: 'Invoice', className: 'font-mono text-xs' },
    { key: 'mfi', header: 'MFI', sortable: true, render: (r) => <div><p className="font-medium">{r.mfi}</p><p className="text-[11px] text-slate-500">{r.plan} plan</p></div> },
    { key: 'events', header: 'Events counted', sortable: true, render: (r) => formatNumber(r.events), className: 'text-right' },
    { key: 'retriesExcluded', header: 'Retries excluded', render: (r) => <span className="text-amber-700">{formatNumber(r.retriesExcluded)}</span>, className: 'text-right' },
    { key: 'subscription', header: 'Subscription', render: (r) => formatMMK(r.subscription), className: 'text-right whitespace-nowrap' },
    { key: 'usage', header: 'Usage', render: (r) => <span title={`${r.chargeBasic} Basic + ${r.chargeFull} Full beyond quota`}>{formatMMK(r.usage)}</span>, className: 'text-right whitespace-nowrap' },
    { key: 'tax', header: 'Tax 5%', render: (r) => formatMMK(r.tax), className: 'text-right whitespace-nowrap' },
    { key: 'total', header: 'Total', sortable: true, render: (r) => <b>{formatMMK(r.total)}</b>, className: 'text-right whitespace-nowrap' },
    { key: 'status', header: 'Status', render: (r) => <Badge tone={r.status === 'Issued' ? 'green' : r.status === 'Draft' ? 'slate' : 'amber'}>{r.status}</Badge> },
  ];

  return (
    <div className="space-y-4 p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <Select label="Billing period" value={period} onChange={(e) => setPeriod(e.target.value)} options={PERIODS} className="sm:w-56" />
        <Button icon={Play} disabled={readOnly || step >= 0 || issued} onClick={run}>{rows.length ? 'Re-run invoice generation' : 'Run monthly invoices'}</Button>
        {rows.length > 0 && <Button variant="outline" icon={Download} disabled={!canExport} onClick={exportCsv}>Export CSV</Button>}
        {rows.length > 0 && <Button variant="warm" icon={Send} disabled={readOnly || issued || awaiting} onClick={submit}>Submit for issue</Button>}
      </div>
      {step >= 0 && <div className="rounded-lg border border-slate-200 p-4" aria-live="polite"><Stepper steps={STEPS} current={step} /></div>}
      {rows.length > 0 ? (
        <>
          {awaiting && <Alert tone="warning">Invoice run awaiting approval in the Approvals inbox. If it is rejected, re-run to regenerate drafts.</Alert>}
          {!issued && !awaiting && <MakerCheckerBanner maker={maker} checker={roleName(checkerRole)} note="Draft invoices are not visible to MFIs. Issuing requires approval by a second authorised user." />}
          <div className="rounded-lg border border-slate-200"><DataTable columns={columns} rows={rows} pageSize={12} dense /></div>
          <p className="text-right text-sm text-slate-600">Period total: <b>{formatMMK(rows.reduce((a, r) => a + r.total, 0))}</b> · {formatNumber(rows.reduce((a, r) => a + r.retriesExcluded, 0))} retries/duplicates excluded</p>
        </>
      ) : step < 0 && <Alert tone="info">No invoices generated for this period yet. The run freezes the billable-event ledger at 23:59 on the last day of the month.</Alert>}
    </div>
  );
}
