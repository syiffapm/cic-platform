import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AS_OF } from '@/data/kpis';
import { useStore } from '@/context/StoreContext';
import { formatMMK, formatNumber } from '@/lib/format';
import { ScopeChip } from '@/portals/government/components/FeatureGuard';
import { useRegionScope } from '@/portals/government/lib/access';
import { Badge, Card, DataTable, PageHeader, Tabs } from '@/components/ui';
import { LicenceApprovals, LICENCE_STATUSES } from '../../components/mfi/licence';
import { ExportButtons } from '../../components/common';
import { downloadCsv } from '../../lib/util';

const columns = [
  { key: 'name', header: 'Institution', sortable: true, render: (r) => <><p className="font-semibold text-slate-900">{r.name}</p><p className="text-[11px] text-slate-500">{r.short} · {r.type} · HQ {r.township}, {r.region}</p></> },
  { key: 'licenceNo', header: 'Licence', sortable: true, render: (r) => <span className="font-mono text-xs">{r.licenceNo}</span> },
  { key: 'tier', header: 'Tier', sortable: true },
  { key: 'capital', header: 'Paid-up capital', sortable: true, className: 'text-right', render: (r) => <span className="tabular-nums">{r.capital ? formatMMK(r.capital, { compact: true }) : '—'}</span> },
  { key: 'branches', header: 'Branches', sortable: true, className: 'text-right', render: (r) => <span className="tabular-nums">{r.branches}</span> },
  { key: 'borrowers', header: 'Borrowers', sortable: true, className: 'text-right', render: (r) => <span className="tabular-nums">{formatNumber(r.borrowers)}</span> },
  { key: 'status', header: 'Status', sortable: true, render: (r) => <Badge status={r.status}>{r.status}</Badge> },
];

export default function InstitutionRegister() {
  const { institutions: all } = useStore();
  const { filterByRegion } = useRegionScope();
  const institutions = useMemo(() => filterByRegion(all), [all, filterByRegion]);
  const navigate = useNavigate();
  const [tab, setTab] = useState('all');
  const rows = useMemo(() => (tab === 'all' ? institutions : institutions.filter((i) => i.status === tab)), [institutions, tab]);

  return (
    <div>
      <PageHeader
        title="Institution register"
        subtitle={`Single Institution Master — the same records drive the public MFI directory, so licence status never diverges. As of ${AS_OF}.`}
        actions={<><ScopeChip /><ExportButtons onCsv={() => downloadCsv('institution-register.csv', institutions, ['id', 'name', 'licenceNo', 'type', 'tier', 'status', 'region', 'township', 'branches', 'borrowers', 'capital', 'portfolio'].map((k) => ({ key: k, header: k })))} /></>}
      />
      <LicenceApprovals />
      <Card>
        <Tabs
          className="px-4"
          value={tab}
          onChange={setTab}
          tabs={[{ id: 'all', label: 'All', count: institutions.length }, ...LICENCE_STATUSES.map((s) => ({ id: s, label: s, count: institutions.filter((i) => i.status === s).length }))]}
        />
        <DataTable columns={columns} rows={rows} searchKeys={['name', 'short', 'licenceNo', 'region', 'township']} onRowClick={(r) => navigate(`/gov/mfi/${r.id}`)} pageSize={12} />
      </Card>
    </div>
  );
}
