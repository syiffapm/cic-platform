import { useState } from 'react';
import { Check, CheckCheck } from 'lucide-react';
import { Badge, Button, Card, DataTable, PageHeader, Select, StatCard, useToast } from '@/components/ui';
import { useStore } from '@/context/StoreContext';
import { ALERT_TYPES } from '../../data/monitoring';
import { nowStamp, patchIn, useMfi, useTenant } from '../../components/MfiState';
import { mfiName } from '../../components/reportModel';
import { PermButton, ViewOnlyBanner } from '../../components/access';

/** Portfolio monitoring alerts on own borrowers. */
export default function PortfolioAlerts() {
  const { user, tenant, can } = useTenant();
  const { alerts, update } = useMfi();
  const { logAudit } = useStore();
  const toast = useToast();
  const [type, setType] = useState('');
  const [severity, setSeverity] = useState('');
  const [status, setStatus] = useState('New');

  const own = alerts.filter((a) => a.tenant === tenant);
  const rows = own.filter((a) => (!type || a.type === type) && (!severity || a.severity === severity) && (!status || a.status === status));
  const canAck = can('mfi.monitoring', 'update');

  const ack = (ids) => {
    const at = nowStamp();
    ids.forEach((id) => update('alerts', patchIn(id, { status: 'Acknowledged', ackBy: user.name, ackAt: at })));
    logAudit({ actor: user.name, role: user.role, tenant, action: 'ALERT_ACKNOWLEDGE', module: 'Monitoring', target: ids.join(', '), outcome: 'Success' });
    toast(`${ids.length} alert(s) acknowledged`, 'success');
  };

  const byType = (t) => own.filter((a) => a.type === t && a.status === 'New').length;
  const newIds = rows.filter((a) => a.status === 'New').map((a) => a.id);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Portfolio alerts"
        subtitle="Nightly monitoring of your active borrowers against the whole registry. Alerts cover only borrowers with an active loan at your institution."
        actions={newIds.length > 0 && <PermButton feature="mfi.monitoring" action="update" what="acknowledge alerts" variant="outline" icon={CheckCheck} onClick={() => ack(newIds)}>Acknowledge {newIds.length} shown</PermButton>}
      />
      <ViewOnlyBanner feature="mfi.monitoring" />

      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        {ALERT_TYPES.map((t, i) => (
          <StatCard key={t} label={t} value={byType(t)} tone={['navy', 'red', 'violet', 'warm'][i]} definition="New (unacknowledged) alerts of this type on your borrowers." asOf="24 Sep 2026 02:10" />
        ))}
      </div>

      <Card>
        <DataTable
          rows={rows}
          searchKeys={['borrowerName', 'borrowerId', 'detail', 'ownLoan']}
          toolbar={(
            <>
              <Select aria-label="Alert type" value={type} onChange={(e) => setType(e.target.value)} placeholder="All types" options={ALERT_TYPES} />
              <Select aria-label="Severity" value={severity} onChange={(e) => setSeverity(e.target.value)} placeholder="All severities" options={['High', 'Medium', 'Low']} />
              <Select aria-label="Status" value={status} onChange={(e) => setStatus(e.target.value)} placeholder="All statuses" options={['New', 'Acknowledged']} />
            </>
          )}
          emptyTitle="No alerts match these filters"
          columns={[
            { key: 'at', header: 'Detected', sortable: true },
            { key: 'severity', header: 'Severity', render: (r) => <Badge status={r.severity} /> },
            { key: 'type', header: 'Type' },
            { key: 'borrowerName', header: 'Borrower', render: (r) => <>{r.borrowerName}<span className="block text-[11px] text-slate-500">{r.borrowerId} · your loan {r.ownLoan}</span></> },
            { key: 'detail', header: 'Detail', render: (r) => <span className="text-xs">{r.detail}{r.otherMfi && <span className="block text-[11px] text-slate-500">Reporting institution: {mfiName(r.otherMfi)}</span>}</span> },
            {
              key: 'status', header: 'Status', render: (r) => (r.status === 'New'
                ? (canAck ? <Button size="sm" variant="outline" icon={Check} onClick={(e) => { e.stopPropagation(); ack([r.id]); }}>Acknowledge</Button> : <Badge tone="blue">New</Badge>)
                : <span className="text-[11px] text-slate-500">Acknowledged by {r.ackBy}{r.ackAt ? ` · ${r.ackAt}` : ''}</span>),
            },
          ]}
        />
      </Card>
    </div>
  );
}
