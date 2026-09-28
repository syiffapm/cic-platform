import { useState } from 'react';
import { Download, FileWarning } from 'lucide-react';
import { Badge, Button, Card, CardHeader, DataTable, Select, useToast } from '@/components/ui';
import { formatNumber } from '@/lib/format';
import { useAdmin } from '../../../lib/useAdmin';
import { downloadCsv } from '../../../lib/csv';
import { REJECTS } from '../../../data/dataQuality';

/** Row-level rejects. NRC values are masked for roles without PII access. */
export default function RejectQueue() {
  const { nrc, piiUnmasked, readOnly, audit, can } = useAdmin('adm.dataQuality');
  const toast = useToast();
  const [batch, setBatch] = useState('');
  const [returned, setReturned] = useState([]);

  const show = (r) => (r.field === 'nrc' ? nrc(r.value) : r.value);
  const rows = REJECTS.filter((r) => !batch || r.batch === batch).map((r) => ({ ...r, shown: show(r) }));

  const columns = [
    { key: 'batch', header: 'Batch', render: (r) => <span className="font-mono text-[11px]">{r.batch}</span> },
    { key: 'row', header: 'Row', className: 'text-right', render: (r) => formatNumber(r.row) },
    { key: 'field', header: 'Field', render: (r) => <span className="font-mono text-xs">{r.field}</span> },
    { key: 'shown', header: 'Value', render: (r) => <span className="font-mono text-xs text-slate-800">{r.shown}</span> },
    { key: 'rule', header: 'Rule', render: (r) => <Badge tone="navy">{r.rule}</Badge> },
    { key: 'message', header: 'Message', render: (r) => <span className="text-xs">{r.message}</span> },
    { key: 'st', header: 'Status', render: (r) => (returned.includes(r.batch) ? <Badge status="Awaiting MFI" /> : <Badge status="Open" />) },
  ];

  const returnToMfi = () => {
    const ids = [...new Set(rows.map((r) => r.batch))].filter((b) => !returned.includes(b));
    setReturned((x) => [...x, ...ids]);
    audit('REJECTS_RETURNED_TO_MFI', ids.join(', '), { outcome: 'Success' });
    toast(`Reject file sent to ${ids.length} MFI submission inbox(es)`, 'success');
  };

  const exportCsv = () => {
    downloadCsv('reject-queue.csv', rows, [
      { key: 'batch', header: 'Batch' }, { key: 'row', header: 'Row' }, { key: 'field', header: 'Field' },
      { key: 'shown', header: 'Value' }, { key: 'rule', header: 'Rule' }, { key: 'message', header: 'Message' },
    ]);
    audit('REJECTS_EXPORT', `${rows.length} rows${piiUnmasked ? '' : ' (masked)'}`);
  };

  return (
    <Card>
      <CardHeader icon={FileWarning} title="Reject queue" subtitle={piiUnmasked ? 'Row-level rejects from validation' : 'Row-level rejects — NRC values masked for your role'} />
      <DataTable
        columns={columns}
        rows={rows}
        dense
        searchKeys={['batch', 'field', 'rule', 'message']}
        toolbar={(
          <>
            <Select aria-label="Filter by batch" placeholder="All batches" options={[...new Set(REJECTS.map((r) => r.batch))]} value={batch} onChange={(e) => setBatch(e.target.value)} className="w-52" />
            <Button size="sm" variant="outline" icon={Download} disabled={!can('export')} onClick={exportCsv}>CSV</Button>
            <Button size="sm" disabled={readOnly} onClick={returnToMfi}>Return to MFI</Button>
          </>
        )}
      />
    </Card>
  );
}
