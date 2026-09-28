import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { FileSignature } from 'lucide-react';
import { Alert, Badge, Card, CardHeader, ChartCard, DataTable, PageHeader, StatCard, Toggle } from '@/components/ui';
import { ALT_DATA_COVERAGE, ALT_DATA_SOURCES } from '../../data/riskData';
import { C, axis, axisLabel, legend, tooltip } from '../../lib/chart';

const STATUS_TONE = { 'Pilot live': 'green', 'Agreement in review': 'amber', Onboarding: 'blue' };

const cols = [
  { key: 'name', header: 'Source', render: (r) => <span className="font-medium text-slate-900">{r.name}</span> },
  { key: 'type', header: 'Type', render: (r) => <Badge tone={r.type === 'Telco' ? 'teal' : 'amber'}>{r.type}</Badge> },
  { key: 'records', header: 'Coverage' },
  { key: 'status', header: 'Status', render: (r) => <Badge tone={STATUS_TONE[r.status] ?? 'slate'}>{r.status}</Badge> },
  { key: 'agreement', header: 'Agreement', render: (r) => <span className="text-xs text-slate-600">{r.agreement}</span> },
];

export default function AltDataHub() {
  const live = ALT_DATA_SOURCES.filter((s) => s.status === 'Pilot live').length;
  return (
    <div>
      <PageHeader
        title="Alternative data hub"
        subtitle="Pilot — telco and utility data from partners under signed data-sharing agreements, used to give thin-file borrowers a fairer credit picture."
      />
      <Alert tone="info" className="mb-6" title="Pilot scope">
        Alternative data is used only for borrowers who gave separate, optional consent on the updated consent form. Pilot results are monitored monthly by FRD and are not yet used in the credit grade shown to lenders.
      </Alert>

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Telco match rate" value="76%" tone="teal" definition="Consented pilot borrowers whose mobile number matched an active subscriber at the partner operator" asOf="31 Aug 2026" />
        <StatCard label="Utility match rate" value="33%" tone="warm" definition="Consented pilot borrowers matched to an electricity billing account (Yangon and Mandalay)" asOf="31 Aug 2026" />
        <StatCard label="Partners live" value={`${live} of ${ALT_DATA_SOURCES.length}`} tone="navy" icon={FileSignature} definition="Partners with a signed data-sharing agreement and an active monthly feed" asOf="24 Sep 2026" />
      </div>

      <ChartCard title="Pilot coverage by region" subtitle="Share of consented pilot borrowers matched to a partner record (%)" height={300}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={ALT_DATA_COVERAGE} margin={{ top: 8, right: 8, left: 0, bottom: 16 }}>
            <CartesianGrid stroke={C.grid} vertical={false} />
            <XAxis dataKey="region" {...axis} label={axisLabel('Region')} />
            <YAxis {...axis} width={44} domain={[0, 100]} label={axisLabel('Matched %', true)} />
            <Tooltip {...tooltip} formatter={(v, n) => [`${v}%`, n]} />
            <Legend {...legend} verticalAlign="top" height={28} />
            <Bar dataKey="telco" name="Telco" fill={C.teal} radius={[4, 4, 0, 0]} maxBarSize={22} />
            <Bar dataKey="utility" name="Utility" fill={C.amber} radius={[4, 4, 0, 0]} maxBarSize={22} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader title="Data partners" />
          <DataTable columns={cols} rows={ALT_DATA_SOURCES} rowKey="name" />
        </Card>
        <Card>
          <CardHeader title="Use controls" subtitle="Changes need DPO sign-off and Governor approval" />
          <fieldset disabled aria-label="Alternative data use controls" className="space-y-4 p-5">
            <Toggle checked onChange={() => {}} label="Ingest telco data" description="Active — signed agreement, consented borrowers only" />
            <Toggle checked onChange={() => {}} label="Ingest utility data" description="Active — Yangon and Mandalay" />
            <Toggle checked={false} onChange={() => {}} label="Use in credit reports" description="Off until the pilot evaluation is approved by the Governor" />
          </fieldset>
          <p className="px-5 pb-4 text-[11px] text-slate-500">Settings are managed in Platform administration under maker-checker.</p>
        </Card>
      </div>
    </div>
  );
}
