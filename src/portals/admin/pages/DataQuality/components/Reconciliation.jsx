import { Scale } from 'lucide-react';
import { Badge, Card, CardHeader, DataTable } from '@/components/ui';
import { formatMMK, formatNumber } from '@/lib/format';
import { RECON } from '../../../data/dataQuality';

const fmt = (r, v) => (r.metric === 'Loan count' ? formatNumber(v) : formatMMK(v, { compact: true }));

/** Control totals submitted by the MFI vs totals actually loaded (AC02: totals must reconcile). */
export default function Reconciliation() {
  const rows = RECON.map((r) => ({ ...r, variance: r.submitted - r.loaded, pct: ((r.submitted - r.loaded) / r.submitted) * 100 }));
  const columns = [
    { key: 'mfi', header: 'MFI', sortable: true },
    { key: 'batch', header: 'Batch', render: (r) => <span className="font-mono text-[11px]">{r.batch}</span> },
    { key: 'metric', header: 'Control total' },
    { key: 'submitted', header: 'Submitted', className: 'text-right', render: (r) => fmt(r, r.submitted) },
    { key: 'loaded', header: 'Loaded', className: 'text-right', render: (r) => fmt(r, r.loaded) },
    { key: 'variance', header: 'Variance', className: 'text-right', render: (r) => <span className="font-semibold text-red-700">{fmt(r, r.variance)} ({r.pct.toFixed(2)}%)</span> },
    { key: 'st', header: 'Tolerance (0.05%)', render: (r) => (r.pct <= 0.05 ? <Badge status="Passed">Within</Badge> : <Badge status="Failed">Exception</Badge>) },
  ];
  return (
    <Card>
      <CardHeader icon={Scale} title="Reconciliation exceptions" subtitle="Batches whose loaded totals differ from the MFI's submitted control totals. A batch is only final when totals reconcile." />
      <DataTable columns={columns} rows={rows} dense />
    </Card>
  );
}
