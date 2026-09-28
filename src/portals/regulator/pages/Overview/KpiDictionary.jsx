import { AS_OF, KPI_DICTIONARY } from '@/data/kpis';
import { formatNumber } from '@/lib/format';
import { Alert, Badge, Card, DataTable, PageHeader } from '@/components/ui';
import { ExportButtons } from '../../components/common';
import { downloadCsv } from '../../lib/util';

/** Governance metadata kept alongside the shared dictionary (G13). */
const META = {
  coverage: { owner: 'FRD Supervision Unit', lineage: 'Batch receipts → cut-off calendar → licensed MFIs → DWH fact_submission' },
  borrowers: { owner: 'CIC Data Steward', lineage: 'Loan records → identity resolution golden ID → DWH dim_borrower' },
  portfolio: { owner: 'FRD Statistics', lineage: 'Loan records → outstanding principal → DWH fact_loan_month' },
  par30: { owner: 'FRD Statistics', lineage: 'fact_loan_month.dpd ≥ 30 → Σ outstanding ÷ gross portfolio' },
  npl: { owner: 'FRD Statistics', lineage: 'fact_loan_month.classification = NPL (Directive 1/2024) → ratio' },
  multi: { owner: 'Policy & Research', lineage: 'Golden borrower ID → count active loans across tenants ≥ 3' },
  disputeSla: { owner: 'Consumer Protection', lineage: 'Dispute events → closed-within-due flag' },
  dq: { owner: 'CIC Data Steward', lineage: 'Batch validation results → accepted ÷ received, critical-field weights' },
  inquiries: { owner: 'CIC Business Office', lineage: 'Inquiry log → metering → daily aggregate' },
};

const rows = KPI_DICTIONARY.map((k) => ({ ...k, ...META[k.id], current: k.unit === '%' ? `${k.value}%` : k.unit === 'MMK' ? `${(k.value / 1e12).toFixed(2)}T MMK` : formatNumber(k.value) }));

const columns = [
  { key: 'name', header: 'KPI', sortable: true, render: (r) => <><p className="font-semibold text-slate-900">{r.name}</p><p className="font-mono text-[11px] text-slate-500">{r.id}</p></> },
  { key: 'definition', header: 'Definition', className: 'min-w-[220px]', render: (r) => <span className="text-xs leading-relaxed">{r.definition}</span> },
  { key: 'current', header: `Value (${AS_OF})`, render: (r) => <span className="font-semibold tabular-nums">{r.current}</span> },
  { key: 'source', header: 'Source service', render: (r) => <span className="text-xs">{r.source}</span> },
  { key: 'frequency', header: 'Frequency', sortable: true, render: (r) => <Badge tone="blue">{r.frequency}</Badge> },
  { key: 'owner', header: 'Owner', sortable: true, render: (r) => <span className="text-xs">{r.owner}</span> },
  { key: 'lineage', header: 'Lineage', className: 'min-w-[260px]', render: (r) => <span className="font-mono text-[11px] text-slate-600">{r.lineage}</span> },
];

export default function KpiDictionary() {
  return (
    <div>
      <PageHeader
        title="KPI dictionary"
        subtitle="One definition per indicator. Every tile in every portal references this dictionary so the Governor, supervisors, MFIs and the public see the same number."
        actions={<ExportButtons onCsv={() => downloadCsv('kpi-dictionary.csv', rows, columns.map((c) => ({ key: c.key, header: c.header })))} />}
      />
      <Alert tone="info" className="mb-4" title="Change control">
        Definitions change only through a maker-checker request to the CIC Data Steward; the version in force is shown on every export footer.
      </Alert>
      <Card>
        <DataTable columns={columns} rows={rows} searchKeys={['name', 'definition', 'source', 'owner']} pageSize={12} />
      </Card>
    </div>
  );
}
