import { useState } from 'react';
import { Badge, Card, DataTable, PageHeader, Tabs } from '@/components/ui';
import { useAdmin } from '../../lib/useAdmin';
import { LOG_CATALOGUE, SECURITY_EVENTS } from '../../data/security';
import AuditLogTab from './components/AuditLogTab';
import SecurityEventsTab from './components/SecurityEventsTab';
import SiemTab from './components/SiemTab';

const CATALOGUE_COLUMNS = [
  { key: 'name', header: 'Log', render: (r) => <span className="font-medium text-slate-800">{r.name}</span> },
  { key: 'content', header: 'Content', className: 'min-w-[240px] text-xs text-slate-600' },
  { key: 'retention', header: 'Retention', render: (r) => <Badge tone={r.retention.includes('10') ? 'navy' : 'slate'}>{r.retention}</Badge> },
  { key: 'storage', header: 'Storage', className: 'text-xs' },
  { key: 'integrity', header: 'Integrity', className: 'text-xs' },
  { key: 'owner', header: 'Owner', className: 'text-xs' },
];

export default function Audit() {
  const { user, role, store, readOnly, piiUnmasked, audit, requestApproval } = useAdmin('audit');
  const [tab, setTab] = useState('log');
  const tabs = [
    { id: 'log', label: 'Audit log', count: store.auditLog.length },
    { id: 'security', label: 'Security events', count: SECURITY_EVENTS.filter((e) => e.status !== 'Closed').length },
    { id: 'siem', label: 'SIEM export' },
    { id: 'catalogue', label: 'Log catalogue', count: LOG_CATALOGUE.length },
  ];

  return (
    <div>
      <PageHeader
        title="Audit, logs & security monitoring"
        subtitle="Hash-chained, WORM-retained audit trail of every sensitive action, with security event monitoring and SIEM export."
      />
      <Tabs tabs={tabs} value={tab} onChange={setTab} className="mb-6" />
      {tab === 'log' && <AuditLogTab auditLog={store.auditLog} audit={audit} maskBorrower={!piiUnmasked} />}
      {tab === 'security' && <SecurityEventsTab audit={audit} readOnly={readOnly} />}
      {tab === 'siem' && <SiemTab user={user} role={role} readOnly={readOnly} audit={audit} requestApproval={requestApproval} approvals={store.approvals} />}
      {tab === 'catalogue' && (
        <Card>
          <DataTable columns={CATALOGUE_COLUMNS} rows={LOG_CATALOGUE} pageSize={10} />
          <p className="border-t border-slate-100 px-4 py-3 text-[11px] text-slate-500">Retention per §9 and the data-class schedule in Compliance / DPO. Audit and admin change logs are write-once (WORM) and hash-chained.</p>
        </Card>
      )}
    </div>
  );
}
