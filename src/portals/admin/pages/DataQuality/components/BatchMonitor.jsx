import { useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { Alert, Badge, Button, Card, DataTable, Modal, Select, useToast } from '@/components/ui';
import { formatNumber } from '@/lib/format';
import { useAdmin } from '../../../lib/useAdmin';
import { nowStamp } from '../../../lib/time';
import { BATCH_STATUSES } from '../../../data/dataQuality';

const dqTone = (v) => (v == null ? 'text-slate-500' : v >= 95 ? 'text-emerald-700' : v >= 85 ? 'text-amber-700' : 'text-red-700');

/** Sector-wide batch monitor with re-process of failed batches (idempotent — AC01). */
export default function BatchMonitor({ batches, api }) {
  const { readOnly, audit } = useAdmin('dataquality');
  const toast = useToast();
  const [status, setStatus] = useState('');
  const [mfi, setMfi] = useState('');
  const [period, setPeriod] = useState('');
  const [confirm, setConfirm] = useState(null);

  const mfis = [...new Set(batches.map((b) => b.mfi))].sort();
  const periods = [...new Set(batches.map((b) => b.period))];
  const rows = batches.filter((b) => (!status || b.status === status) && (!mfi || b.mfi === mfi) && (!period || b.period === period));

  const reprocess = () => {
    const b = confirm;
    setConfirm(null);
    api.patch(b.id, { status: 'Validating', error: null, reprocessedAt: nowStamp() });
    audit('BATCH_REPROCESS', b.id, { outcome: 'Started', purpose: 'Re-process failed batch (idempotent on batch ID + loan ID)' });
    toast(`${b.id} re-queued for validation`, 'info');
    setTimeout(() => {
      const accepted = Math.round(b.rows * 0.972);
      api.patch(b.id, { status: 'Loaded', accepted, dq: 94.1 });
      toast(`${b.id} loaded — ${formatNumber(accepted)} rows, 0 duplicates`, 'success');
    }, 3500);
  };

  const columns = [
    { key: 'id', header: 'Batch', render: (b) => <span className="font-mono text-xs text-slate-800">{b.id}</span> },
    { key: 'mfi', header: 'MFI', sortable: true },
    { key: 'period', header: 'Period' },
    { key: 'receivedAt', header: 'Received', sortable: true, render: (b) => <span className="whitespace-nowrap text-xs">{b.receivedAt}</span> },
    { key: 'rows', header: 'Rows', sortable: true, className: 'text-right', render: (b) => formatNumber(b.rows) },
    { key: 'accepted', header: 'Accepted', className: 'text-right', render: (b) => (b.accepted ? formatNumber(b.accepted) : '—') },
    {
      key: 'rej', header: 'Rejected', className: 'text-right',
      render: (b) => (b.dq == null ? '—' : `${(((b.rows - b.accepted) / b.rows) * 100).toFixed(1)}%`),
    },
    { key: 'dq', header: 'DQ score', sortable: true, className: 'text-right', render: (b) => <span className={`font-semibold ${dqTone(b.dq)}`}>{b.dq == null ? '—' : `${b.dq}%`}</span> },
    {
      key: 'status', header: 'Status',
      render: (b) => (
        <div>
          <Badge status={b.status} />
          {b.error && <p className="mt-1 max-w-[14rem] text-[11px] text-red-600">{b.error}</p>}
          {b.reprocessedAt && <p className="mt-1 text-[11px] text-slate-500">Re-processed {b.reprocessedAt}</p>}
        </div>
      ),
    },
    {
      key: 'act', header: <span className="relative"><span className="sr-only">Actions</span></span>,
      render: (b) => (b.status === 'Failed' ? (
        <Button size="sm" variant="outline" icon={RefreshCw} disabled={readOnly} onClick={() => setConfirm(b)} aria-label={`Re-process ${b.id}`}>Re-process</Button>
      ) : null),
    },
  ];

  return (
    <Card>
      <DataTable
        columns={columns}
        rows={rows}
        dense
        searchKeys={['id', 'mfi']}
        toolbar={(
          <>
            <Select aria-label="Filter by MFI" placeholder="All MFIs" options={mfis} value={mfi} onChange={(e) => setMfi(e.target.value)} className="w-32" />
            <Select aria-label="Filter by period" placeholder="All periods" options={periods} value={period} onChange={(e) => setPeriod(e.target.value)} className="w-32" />
            <Select aria-label="Filter by status" placeholder="All statuses" options={BATCH_STATUSES} value={status} onChange={(e) => setStatus(e.target.value)} className="w-40" />
          </>
        )}
      />
      <Modal
        open={!!confirm}
        onClose={() => setConfirm(null)}
        size="sm"
        title="Re-process batch?"
        subtitle={confirm?.id}
        footer={(
          <>
            <Button variant="outline" onClick={() => setConfirm(null)}>Cancel</Button>
            <Button icon={RefreshCw} onClick={reprocess}>Re-process</Button>
          </>
        )}
      >
        <div className="space-y-3 text-sm text-slate-700">
          <p>The stored file for <b>{confirm?.mfi}</b> ({confirm?.period}, {formatNumber(confirm?.rows ?? 0)} rows) will be re-validated and loaded.</p>
          <Alert tone="info" title="Idempotent load">
            Rows are keyed on batch ID + MFI loan ID. Rows already loaded are skipped, so resubmission never creates duplicate loans.
          </Alert>
          <p className="text-xs text-slate-500">This action is written to the audit log as BATCH_REPROCESS.</p>
        </div>
      </Modal>
    </Card>
  );
}
