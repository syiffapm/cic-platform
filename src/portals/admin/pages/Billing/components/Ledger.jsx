import { useState } from 'react';
import { Alert, Badge, DataTable, Select } from '@/components/ui';
import { LEDGER } from '../../../data/billing';

/** Billable-event ledger with retry / duplicate exclusion (AC08). */
export default function Ledger({ institutions }) {
  const [filter, setFilter] = useState('');
  const name = (id) => institutions.find((i) => i.id === id)?.short ?? id;
  const rows = LEDGER.filter((e) => !filter || (filter === 'billable' ? e.billable : !e.billable)).map((e) => ({ ...e, mfi: name(e.mfiId) }));
  const excluded = LEDGER.filter((e) => !e.billable).length;

  const columns = [
    { key: 'at', header: 'Timestamp', sortable: true, className: 'whitespace-nowrap font-mono text-xs' },
    { key: 'id', header: 'Event', className: 'font-mono text-xs' },
    { key: 'inquiryId', header: 'Inquiry ID', className: 'font-mono text-xs' },
    { key: 'mfi', header: 'MFI', sortable: true },
    { key: 'reportType', header: 'Report', render: (e) => <Badge tone={e.reportType === 'Full' ? 'navy' : 'slate'}>{e.reportType}</Badge> },
    { key: 'attempt', header: 'Attempt', className: 'text-center' },
    { key: 'billable', header: 'Billable', render: (e) => (e.billable ? <Badge tone="green">Billable</Badge> : (
      <div><Badge tone="amber">{e.flag}</Badge><p className="mt-0.5 max-w-[15rem] text-[11px] text-slate-500">{e.note}</p></div>
    )) },
  ];

  return (
    <div>
      <div className="p-4">
        <Alert tone="info" title="Invoices exclude retries">
          Each inquiry is billed once per request id. Retries of the same request (e.g. after a timeout) and identical inquiries by the same officer within 5 minutes are recorded but flagged non-billable. {excluded} of {LEDGER.length} events in this sample are excluded.
        </Alert>
      </div>
      <DataTable columns={columns} rows={rows} searchKeys={['inquiryId', 'mfi', 'id']} pageSize={12} dense
        toolbar={<Select aria-label="Filter billable" value={filter} onChange={(e) => setFilter(e.target.value)} placeholder="All events" options={[{ value: 'billable', label: 'Billable only' }, { value: 'excluded', label: 'Excluded only' }]} />} />
    </div>
  );
}
