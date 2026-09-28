import { useMemo, useState } from 'react';
import { Download, Globe, EyeOff } from 'lucide-react';
import { Badge, Button, Card, DataTable, Select } from '@/components/ui';
import { useAdmin } from '../../../lib/useAdmin';
import { downloadCsv } from '../../../lib/csv';
import InstitutionDetail from './InstitutionDetail';

const STATUSES = ['Licensed', 'Under Review', 'Suspended', 'Revoked'];

export default function InstitutionsTab() {
  const { store, audit, can } = useAdmin('adm.masterData');
  const [status, setStatus] = useState('');
  const [tier, setTier] = useState('');
  const [selectedId, setSelectedId] = useState(null);

  const pendingIds = useMemo(() => new Set(store.approvals
    .filter((a) => a.status === 'Pending' && a.module.includes('Master data'))
    .flatMap((a) => [a.payload?.effect].flat().filter(Boolean).map((e) => e.id))), [store.approvals]);

  const rows = store.institutions.filter((i) => (!status || i.status === status) && (!tier || i.tier === tier));
  const selected = store.institutions.find((i) => i.id === selectedId);

  const columns = [
    {
      key: 'name', header: 'Institution', sortable: true,
      render: (r) => (
        <div className="min-w-[12rem]">
          <p className="font-medium text-slate-800">{r.name}</p>
          <p className="text-[11px] text-slate-500">{r.id} · {r.short}</p>
        </div>
      ),
    },
    { key: 'licenceNo', header: 'Licence no', render: (r) => <span className="font-mono text-xs">{r.licenceNo}</span> },
    { key: 'type', header: 'Type', sortable: true },
    { key: 'tier', header: 'Tier', sortable: true },
    { key: 'status', header: 'Status', render: (r) => <Badge status={r.status} tone={r.status === 'Under Review' ? 'amber' : undefined} /> },
    { key: 'region', header: 'Region / township', render: (r) => <span className="text-xs">{r.region}<span className="block text-slate-500">{r.township}</span></span> },
    {
      key: 'publish', header: 'Directory',
      render: (r) => (
        <span className="inline-flex items-center gap-1.5 text-xs">
          {r.publish ? <Globe className="h-3.5 w-3.5 text-teal-700" aria-hidden="true" /> : <EyeOff className="h-3.5 w-3.5 text-slate-500" aria-hidden="true" />}
          {r.publish ? 'Published' : 'Hidden'}
          {pendingIds.has(r.id) && <Badge tone="violet">Pending checker</Badge>}
        </span>
      ),
    },
  ];

  const exportCsv = () => {
    downloadCsv('institution-master.csv', rows, [
      { key: 'id', header: 'ID' }, { key: 'name', header: 'Name' }, { key: 'licenceNo', header: 'Licence no' },
      { key: 'type', header: 'Type' }, { key: 'tier', header: 'Tier' }, { key: 'status', header: 'Status' },
      { key: 'region', header: 'Region' }, { key: 'township', header: 'Township' }, { key: 'publish', header: 'Publish' },
    ]);
    audit('MASTERDATA_EXPORT', `Institution master (${rows.length} rows)`);
  };

  return (
    <Card>
      <DataTable
        columns={columns}
        rows={rows}
        searchKeys={['name', 'short', 'licenceNo', 'township', 'id']}
        onRowClick={(r) => setSelectedId(r.id)}
        toolbar={(
          <>
            <Select aria-label="Filter by status" placeholder="All statuses" options={STATUSES} value={status} onChange={(e) => setStatus(e.target.value)} className="w-40" />
            <Select aria-label="Filter by tier" placeholder="All tiers" options={['Tier 1', 'Tier 2', 'Tier 3']} value={tier} onChange={(e) => setTier(e.target.value)} className="w-32" />
            <Button size="sm" variant="outline" icon={Download} disabled={!can('export')} onClick={exportCsv}>CSV</Button>
          </>
        )}
      />
      <InstitutionDetail institution={selected} pending={selected ? pendingIds.has(selected.id) : false} onClose={() => setSelectedId(null)} />
    </Card>
  );
}
