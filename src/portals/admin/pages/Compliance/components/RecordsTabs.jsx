import { BellRing } from 'lucide-react';
import { Badge, Button, Card, CardBody, CardHeader, DataTable, useToast } from '@/components/ui';
import { DPIAS, POLICIES, RETENTION } from '../../../data/compliance';

const RETENTION_COLUMNS = [
  { key: 'dataClass', header: 'Data class', render: (r) => <span className="font-medium text-slate-800">{r.dataClass}</span> },
  { key: 'period', header: 'Retention', render: (r) => <Badge tone={r.period.startsWith('10') ? 'navy' : 'slate'}>{r.period}</Badge> },
  { key: 'basis', header: 'Legal basis', className: 'min-w-[200px] text-xs text-slate-600' },
  { key: 'mode', header: 'Storage / mode', className: 'text-xs' },
  { key: 'purgeJob', header: 'Purge job', className: 'font-mono text-[11px]' },
];

/** Retention schedule by data class (§9 logs + registry). */
export function RetentionTab() {
  return (
    <Card>
      <CardHeader title="Retention schedule" subtitle="Purges run through the scheduled retention job; WORM classes cannot be purged early" />
      <DataTable columns={RETENTION_COLUMNS} rows={RETENTION} pageSize={12} />
    </Card>
  );
}

const DPIA_COLUMNS = [
  { key: 'id', header: 'DPIA', className: 'font-mono text-xs' },
  { key: 'system', header: 'System / processing', render: (r) => <span className="font-medium text-slate-800">{r.system}</span> },
  { key: 'date', header: 'Assessed', sortable: true, className: 'whitespace-nowrap text-xs' },
  { key: 'risk', header: 'Residual risk', sortable: true, render: (r) => <Badge status={r.risk} /> },
  { key: 'status', header: 'Status', render: (r) => <Badge status={r.status} /> },
  { key: 'reviewer', header: 'Reviewer', className: 'text-xs' },
  { key: 'next', header: 'Next review', className: 'whitespace-nowrap text-xs' },
];

export function DpiaTab() {
  return (
    <Card>
      <CardHeader title="DPIA records" subtitle="Data protection impact assessments for high-risk processing" />
      <DataTable columns={DPIA_COLUMNS} rows={DPIAS} pageSize={10} searchKeys={['system', 'id', 'reviewer']} />
    </Card>
  );
}

/** Policy acknowledgements by CIC staff, with overdue lists and audited reminders. */
export function PoliciesTab({ readOnly, audit }) {
  const toast = useToast();
  const remind = (p) => {
    audit('POLICY_REMINDER_SENT', `${p.id} ${p.version} · ${p.overdue.length} staff`);
    toast(`Reminder sent to ${p.overdue.length} staff for “${p.policy}”`, 'success');
  };
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      {POLICIES.map((p) => {
        const pct = Math.round((p.acknowledged / p.total) * 100);
        return (
          <Card key={p.id}>
            <CardHeader title={`${p.policy} ${p.version}`} subtitle={`Published ${p.published} · acknowledge by ${p.due}`}
              action={p.overdue.length > 0 && <Badge tone="red">{p.overdue.length} overdue</Badge>} />
            <CardBody className="space-y-3">
              <div>
                <div className="flex justify-between text-xs"><span className="text-slate-500">Acknowledged</span><span className="font-semibold text-slate-800">{p.acknowledged} / {p.total} ({pct}%)</span></div>
                <div className="mt-1.5 h-2 rounded-full bg-slate-100" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label={`${p.policy} acknowledgement`}>
                  <div className={`h-2 rounded-full ${pct === 100 ? 'bg-emerald-600' : p.overdue.length ? 'bg-amber-500' : 'bg-teal-600'}`} style={{ width: `${pct}%` }} />
                </div>
              </div>
              {p.overdue.length > 0 && (
                <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                  <p className="text-xs text-slate-600"><span className="font-medium text-red-700">Overdue:</span> {p.overdue.join(', ')}</p>
                  <Button size="sm" variant="outline" icon={BellRing} disabled={readOnly} onClick={() => remind(p)}>Send reminder</Button>
                </div>
              )}
            </CardBody>
          </Card>
        );
      })}
    </div>
  );
}
