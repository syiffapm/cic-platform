import { useMemo, useState } from 'react';
import { Download } from 'lucide-react';
import { Badge, Card, DataTable, PageHeader, Select, StatCard } from '@/components/ui';
import { useStore } from '@/context/StoreContext';
import { PURPOSE_CODES } from '@/data/reference';
import { AUDIT_EXTRAS } from '../../data/institution';
import { useTenant } from '../../components/MfiState';
import { downloadFile, toCsv } from '../../components/download';
import { PermButton } from '../../components/access';

const purposeText = (p) => {
  const hit = PURPOSE_CODES.find((c) => c.code === p);
  return hit ? `${p} — ${hit.label}` : p;
};
const outcomeTone = (o) => (o === 'Denied' ? 'red' : o === 'Success' ? 'green' : 'amber');

/** Own-tenant audit view: who in my MFI searched whom and why. */
export default function Audit() {
  const { user, tenant } = useTenant();
  const { auditLog, logAudit, roles = [] } = useStore();
  const roleLabel = (id) => roles.find((r) => r.id === id)?.name ?? id;
  const [scope, setScope] = useState('inquiry');
  const [actor, setActor] = useState('');
  const [outcome, setOutcome] = useState('');

  // Server-side rule mirrored here: only entries whose tenant equals the session tenant are ever returned.
  const all = useMemo(() => [...auditLog, ...AUDIT_EXTRAS.filter((x) => !auditLog.some((a) => a.id === x.id))]
    .filter((a) => a.tenant === tenant)
    .sort((a, b) => b.at.localeCompare(a.at)), [auditLog, tenant]);

  const rows = all.filter((a) => (scope === 'all' || (scope === 'inquiry' ? a.module === 'Inquiry' : a.outcome === 'Denied'))
    && (!actor || a.actor === actor) && (!outcome || a.outcome === outcome));
  const actors = [...new Set(all.map((a) => a.actor))];
  const outcomes = [...new Set(all.map((a) => a.outcome))];

  const exportCsv = () => {
    downloadFile(`audit-${tenant}-${new Date().toISOString().slice(0, 10)}.csv`, toCsv(rows, [
      { key: 'id', header: 'Audit ID' }, { key: 'at', header: 'Timestamp' }, { key: 'actor', header: 'User' }, { key: 'role', header: 'Role' },
      { key: 'action', header: 'Action' }, { key: 'module', header: 'Module' }, { key: 'target', header: 'Subject' }, { key: 'purpose', header: 'Purpose' },
      { key: 'outcome', header: 'Outcome' }, { key: 'ip', header: 'IP' }, { key: 'hash', header: 'Hash' },
    ]));
    logAudit({ actor: user.name, role: user.role, tenant, action: 'AUDIT_EXPORT', module: 'Audit', target: `${rows.length} entries`, outcome: 'Success' });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Audit trail"
        subtitle="Who in your institution searched whom, why, and what else they did. Entries are hash-chained and retained for 10 years (WORM)."
        actions={<PermButton feature="mfi.audit" action="export" what="export the audit trail" variant="outline" icon={Download} onClick={exportCsv}>Export CSV</PermButton>}
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Entries (your institution)" value={all.length} tone="navy" definition={`Audit entries for ${tenant}. Other institutions' entries are never returned.`} />
        <StatCard label="Inquiries logged" value={all.filter((a) => a.module === 'Inquiry' && a.action.startsWith('INQUIRY')).length} tone="teal" definition="Credit inquiries by your users, each with purpose code." />
        <StatCard label="Denied attempts" value={all.filter((a) => a.outcome === 'Denied').length} tone="red" definition="Requests refused by authorisation rules, including attempts to open another institution's records." />
      </div>

      <Card>
        <DataTable
          rows={rows}
          searchKeys={['actor', 'action', 'target', 'purpose', 'id']}
          pageSize={12}
          toolbar={(
            <>
              <Select aria-label="Scope" value={scope} onChange={(e) => setScope(e.target.value)} options={[{ value: 'inquiry', label: 'Inquiries (who searched whom)' }, { value: 'denied', label: 'Denied only' }, { value: 'all', label: 'All actions' }]} />
              <Select aria-label="User" value={actor} onChange={(e) => setActor(e.target.value)} placeholder="All users" options={actors} />
              <Select aria-label="Outcome" value={outcome} onChange={(e) => setOutcome(e.target.value)} placeholder="All outcomes" options={outcomes} />
            </>
          )}
          columns={[
            { key: 'at', header: 'Time', sortable: true, className: 'whitespace-nowrap text-xs' },
            { key: 'actor', header: 'User', render: (a) => <>{a.actor}<span className="block text-[11px] text-slate-500">{roleLabel(a.role)}</span></> },
            { key: 'action', header: 'Action', render: (a) => <span className="font-mono text-[11px]">{a.action}</span> },
            { key: 'target', header: 'Subject', className: 'font-mono text-xs' },
            { key: 'purpose', header: 'Why (purpose)', render: (a) => <span className="text-xs">{purposeText(a.purpose)}</span> },
            { key: 'outcome', header: 'Outcome', render: (a) => <Badge tone={outcomeTone(a.outcome)}>{a.outcome}</Badge> },
            { key: 'hash', header: 'Hash', className: 'font-mono text-[11px] text-slate-500' },
          ]}
        />
      </Card>
    </div>
  );
}
