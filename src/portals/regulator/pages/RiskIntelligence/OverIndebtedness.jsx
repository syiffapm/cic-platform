import { useMemo, useState } from 'react';
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Eye, EyeOff, Lock, ShieldCheck } from 'lucide-react';
import { useSession } from '@/context/AuthContext';
import { useStore } from '@/context/StoreContext';
import { AS_OF } from '@/data/kpis';
import { formatMMK, formatNumber } from '@/lib/format';
import { usePermissions } from '@/lib/rbac';
import { ScopeChip } from '@/portals/government/components/FeatureGuard';
import { useRegionScope } from '@/portals/government/lib/access';
import { Alert, Badge, Button, Card, CardBody, CardHeader, ChartCard, DataTable, EmptyState, PageHeader, Select, StatCard, useToast } from '@/components/ui';
import DrilldownModal from '../../components/risk/DrilldownModal';
import { TOWNSHIP_STATS } from '../../data/townships';
import { borrowerRowsFor } from '../../data/riskData';
import { C, axis, axisLabel, legend, tooltip } from '../../lib/chart';
import { round } from '../../lib/util';

const DTI_FACTOR = { 40: 1.62, 50: 1, 60: 0.57 };

const borrowerCols = [
  { key: 'id', header: 'Pseudonymous ID', render: (r) => <span className="font-mono text-xs">{r.id}</span> },
  { key: 'activeLoans', header: 'Active loans', sortable: true, className: 'text-right' },
  { key: 'lenders', header: 'Lenders', render: (r) => <span className="text-xs">{r.lenders}</span> },
  { key: 'outstanding', header: 'Outstanding', sortable: true, className: 'text-right', render: (r) => <span className="tabular-nums">{formatMMK(r.outstanding, { compact: true })}</span> },
  { key: 'monthlyIncomeBand', header: 'Income band (MMK/mo)' },
  { key: 'dti', header: 'DTI', sortable: true, className: 'text-right', render: (r) => <span className={r.dti > 50 ? 'font-semibold text-red-600' : ''}>{r.dti}%</span> },
  { key: 'maxDpd', header: 'Max DPD', sortable: true, className: 'text-right' },
  { key: 'gender', header: 'Sex' },
];

export default function OverIndebtedness() {
  const user = useSession('gov');
  const { can } = usePermissions('gov');
  const { filterByRegion } = useRegionScope();
  const townships = useMemo(() => filterByRegion(TOWNSHIP_STATS), [filterByRegion]);
  const { auditLog, logAudit } = useStore();
  const toast = useToast();
  const [dti, setDti] = useState('50');
  const [region, setRegion] = useState('');
  const [modal, setModal] = useState(null);
  const [drill, setDrill] = useState(null);
  const canDrill = can('gov.drilldown', 'read');

  const rows = useMemo(() => townships.filter((t) => !region || t.region === region).map((t) => {
    const highDti = Math.round(t.highDti * DTI_FACTOR[dti]);
    const overlap = Math.round(Math.min(t.multi, highDti) * 0.45);
    const total = t.multi + highDti - overlap;
    return { ...t, highDtiAdj: highDti, total, rate: round((total / t.borrowers) * 100) };
  }).sort((a, b) => b.rate - a.rate), [dti, region, townships]);

  const totals = rows.reduce((s, r) => ({ borrowers: s.borrowers + r.borrowers, multi: s.multi + r.multi, high: s.high + r.highDtiAdj, total: s.total + r.total }), { borrowers: 0, multi: 0, high: 0, total: 0 });
  const history = auditLog.filter((a) => a.action === 'BORROWER_DRILLDOWN' && a.actor === user?.name);

  const confirmDrill = ({ township, caseRef, justification }) => {
    const t = TOWNSHIP_STATS.find((x) => x.code === township);
    logAudit({ actor: user.name, role: user.role, tenant: 'CBM', ip: user.ip, action: 'BORROWER_DRILLDOWN', module: 'Risk Intelligence', target: `Township ${t.name}${caseRef ? ` / ${caseRef}` : ''}`, purpose: justification, outcome: 'Success' });
    setDrill({ township, name: t.name, rows: borrowerRowsFor(township), justification });
    setModal(null);
  };

  const denied = () => {
    logAudit({ actor: user.name, role: user.role, tenant: 'CBM', action: 'BORROWER_DRILLDOWN', module: 'Risk Intelligence', target: 'Over-indebtedness', purpose: '—', outcome: 'Denied' });
    toast('Borrower-level drill-down is not permitted for your role (aggregated data only). Attempt logged.', 'warning');
  };

  const columns = [
    { key: 'name', header: 'Township', sortable: true, render: (r) => <><p className="font-medium text-slate-900">{r.name}</p><p className="text-[11px] text-slate-500">{r.region}</p></> },
    { key: 'borrowers', header: 'Borrowers', sortable: true, className: 'text-right', render: (r) => <span className="tabular-nums">{formatNumber(r.borrowers)}</span> },
    { key: 'multi', header: '≥ 3 active loans', sortable: true, className: 'text-right', render: (r) => <span className="tabular-nums">{formatNumber(r.multi)}</span> },
    { key: 'highDtiAdj', header: `DTI > ${dti}%`, sortable: true, className: 'text-right', render: (r) => <span className="tabular-nums">{formatNumber(r.highDtiAdj)}</span> },
    { key: 'rate', header: 'Over-indebted %', sortable: true, className: 'text-right', render: (r) => <Badge tone={r.rate > 12 ? 'red' : r.rate > 8 ? 'amber' : 'green'}>{r.rate}%</Badge> },
    {
      key: 'drill', header: <span className="relative"><span className="sr-only">Drill-down</span></span>,
      render: (r) => (canDrill
        ? <Button size="sm" variant="ghost" icon={Eye} onClick={() => setModal(r.code)}>Drill down</Button>
        : <Button size="sm" variant="ghost" icon={Lock} onClick={denied} aria-disabled="true" className="text-slate-500" title="Not permitted for your role">Drill down</Button>),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Over-indebtedness monitor"
        subtitle={`Borrowers with ≥ 3 active loans across MFIs or debt-to-income above the threshold, by township. Aggregates only; borrower-level access requires a logged justification. As of ${AS_OF}.`}
        actions={<ScopeChip />}
      />
      <Card className="mb-6">
        <CardBody className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Select label="DTI threshold" value={dti} onChange={(e) => setDti(e.target.value)} options={[{ value: '40', label: 'DTI > 40%' }, { value: '50', label: 'DTI > 50% (guideline draft)' }, { value: '60', label: 'DTI > 60%' }]} />
          <Select label="Region / State" value={region} onChange={(e) => setRegion(e.target.value)} placeholder="All regions" options={[...new Set(townships.map((t) => t.region))]} />
          <div className="flex items-end">
            {canDrill
              ? <Button icon={ShieldCheck} variant="warm" onClick={() => setModal('')}>Borrower drill-down…</Button>
              : <Alert tone="info" className="w-full"><span className="inline-flex items-center gap-1"><EyeOff className="h-3.5 w-3.5" /> Your role sees aggregated data only (no PII).</span></Alert>}
          </div>
        </CardBody>
      </Card>

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Over-indebted borrowers" value={formatNumber(totals.total)} tone="violet" definition={`Distinct borrowers with ≥ 3 active loans or DTI > ${dti}% (counted once)`} asOf={AS_OF} />
        <StatCard label="≥ 3 active loans" value={formatNumber(totals.multi)} tone="warm" definition="Resolved borrower IDs with three or more active loans across MFIs" asOf={AS_OF} />
        <StatCard label={`DTI > ${dti}%`} value={formatNumber(totals.high)} tone="red" definition="Monthly instalments ÷ declared monthly household income above threshold" asOf={AS_OF} />
        <StatCard label="Share of borrowers" value={`${round((totals.total / totals.borrowers) * 100)}%`} tone="navy" definition="Over-indebted ÷ borrowers covered in selected townships" asOf={AS_OF} />
      </div>

      <ChartCard title="Over-indebted borrowers by township" subtitle="Stacked: ≥ 3 active loans and high DTI (overlap removed from the high-DTI segment)" asOf={AS_OF} height={300}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={rows.slice(0, 14).map((r) => ({ name: r.name, multi: r.multi, dtiOnly: r.total - r.multi }))} margin={{ top: 8, right: 8, left: 8, bottom: 40 }}>
            <CartesianGrid stroke={C.grid} vertical={false} />
            <XAxis dataKey="name" {...axis} angle={-35} textAnchor="end" interval={0} height={50} />
            <YAxis {...axis} width={56} label={axisLabel('Borrowers', true)} tickFormatter={(v) => `${v / 1000}k`} />
            <Tooltip {...tooltip} formatter={(v, n) => [formatNumber(v), n]} />
            <Legend {...legend} verticalAlign="top" height={28} />
            <Bar dataKey="multi" name="≥ 3 active loans" stackId="a" fill={C.navy} maxBarSize={32} />
            <Bar dataKey="dtiOnly" name={`DTI > ${dti}% only`} stackId="a" fill={C.amber} radius={[4, 4, 0, 0]} maxBarSize={32} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      <Card className="mt-6">
        <CardHeader title="By township" subtitle="Sorted by over-indebted share" />
        <DataTable columns={columns} rows={rows} rowKey="code" searchKeys={['name', 'region']} pageSize={10} />
      </Card>

      {drill && (
        <Card className="mt-6 border-amber-300">
          <CardHeader
            title={`Pseudonymised borrowers — ${drill.name}`}
            subtitle={`Justification: “${drill.justification}”`}
            action={<Button size="sm" variant="outline" icon={EyeOff} onClick={() => setDrill(null)}>Hide records</Button>}
          />
          <DataTable columns={borrowerCols} rows={drill.rows} dense pageSize={8} />
          <p className="border-t border-slate-100 px-4 py-2 text-[11px] text-slate-500">Tokens are keyed hashes of the resolved borrower ID. Re-identification requires a separate DPO-approved request.</p>
        </Card>
      )}

      <Card className="mt-6">
        <CardHeader title="Your drill-down history" subtitle="From the audit log — reviewable by the DPO and internal audit" />
        {history.length === 0 ? <EmptyState compact title="No drill-downs recorded for your account" /> : (
          <DataTable dense pageSize={6} rows={history} columns={[
            { key: 'at', header: 'Time', render: (r) => <span className="font-mono text-xs">{r.at}</span> },
            { key: 'target', header: 'Scope' },
            { key: 'purpose', header: 'Justification', render: (r) => <span className="text-xs">{r.purpose}</span> },
            { key: 'outcome', header: 'Outcome', render: (r) => <Badge status={r.outcome === 'Denied' ? 'Rejected' : 'Success'}>{r.outcome}</Badge> },
            { key: 'hash', header: 'Hash', render: (r) => <span className="font-mono text-[11px] text-slate-500">{r.hash}</span> },
          ]} />
        )}
      </Card>

      {modal !== null && <DrilldownModal open onClose={() => setModal(null)} onConfirm={confirmDrill} defaultTownship={modal} />}
    </div>
  );
}
