import { DatabaseBackup, RotateCcw } from 'lucide-react';
import { Alert, Badge, Card, CardBody, CardHeader, DataTable } from '@/components/ui';
import { BACKUP_STATUS, RESTORE_TESTS, RPO_TARGET, RTO_TARGET } from '../../../data/system';

const mins = (m) => (m >= 60 ? `${Math.floor(m / 60)} h ${String(m % 60).padStart(2, '0')} min` : `${m} min`);

const within = (value, target) => (
  <span className="flex items-center gap-2 whitespace-nowrap">
    <span className="font-medium">{mins(value)}</span>
    <Badge tone={value <= target ? 'green' : 'red'}>{value <= target ? 'Met' : 'Missed'}</Badge>
  </span>
);

const COLUMNS = [
  { key: 'date', header: 'Test date', sortable: true, className: 'whitespace-nowrap' },
  { key: 'backupSet', header: 'Backup set', className: 'font-mono text-xs' },
  { key: 'scope', header: 'Scope', className: 'text-xs' },
  { key: 'rpo', header: `RPO (target ${mins(RPO_TARGET)})`, render: (r) => within(r.rpo, RPO_TARGET) },
  { key: 'rto', header: `RTO (target ${mins(RTO_TARGET)})`, render: (r) => within(r.rto, RTO_TARGET) },
  { key: 'verifiedBy', header: 'Verified by', className: 'text-xs' },
  { key: 'result', header: 'Result', render: (r) => <Badge status={r.rpo <= RPO_TARGET && r.rto <= RTO_TARGET ? 'Passed' : 'Failed'} /> },
];

/** Backup status + quarterly restore-test log (SEC-10, AC09). */
export default function BackupCard() {
  const allPassed = RESTORE_TESTS.every((r) => r.rpo <= RPO_TARGET && r.rto <= RTO_TARGET);
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader icon={DatabaseBackup} title="Backup status" subtitle="Primary DC Nay Pyi Taw → DR site Yangon · encrypted, immutable copies" />
        <CardBody className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {BACKUP_STATUS.map((b) => (
            <div key={b.label} className="rounded-lg border border-slate-200 p-4">
              <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">{b.label}</p>
              <p className="mt-1 text-lg font-bold text-slate-900">{b.value}</p>
              <p className="mt-0.5 text-xs text-slate-500">{b.note}</p>
            </div>
          ))}
        </CardBody>
      </Card>
      <Card>
        <CardHeader icon={RotateCcw} title="Restore test log" subtitle="Quarterly restore to an isolated environment" />
        <CardBody className="pb-0">
          <Alert tone={allPassed ? 'success' : 'warning'}>
            {allPassed ? `All ${RESTORE_TESTS.length} recorded restore tests met RPO ≤ 1 h and RTO ≤ 4 h.` : 'At least one restore test missed its RPO/RTO target — remediation required.'}
          </Alert>
        </CardBody>
        <DataTable columns={COLUMNS} rows={RESTORE_TESTS} pageSize={8} />
      </Card>
    </div>
  );
}
