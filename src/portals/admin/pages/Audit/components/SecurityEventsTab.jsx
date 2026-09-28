import { useMemo, useState } from 'react';
import { Fingerprint, Globe, LogIn, MapPin } from 'lucide-react';
import { Badge, Button, Card, DataTable, Select, StatCard, useToast } from '@/components/ui';
import { useAdminCollection } from '../../../context/AdminStore';
import { DASH_AS_OF } from '../../../data/ops';
import { SECURITY_EVENTS } from '../../../data/security';

const count = (list, re) => list.filter((e) => re.test(e.type)).length;

/** ADM-12 security events: failed logins, IP / geo anomalies, MFA failures. */
export default function SecurityEventsTab({ audit, readOnly }) {
  const toast = useToast();
  const [events, api] = useAdminCollection('securityEvents', SECURITY_EVENTS);
  const [type, setType] = useState('');
  const [severity, setSeverity] = useState('');
  const [status, setStatus] = useState('');

  const types = useMemo(() => [...new Set(events.map((e) => e.type))].sort(), [events]);
  const rows = events.filter((e) => (!type || e.type === type) && (!severity || e.severity === severity) && (!status || e.status === status));

  const act = (e, next) => {
    api.patch(e.id, { status: next });
    audit(next === 'Closed' ? 'SECURITY_EVENT_CLOSED' : 'SECURITY_EVENT_INVESTIGATE', `${e.id} · ${e.type}`);
    toast(`${e.id} marked ${next.toLowerCase()}`, 'success');
  };

  const columns = [
    { key: 'at', header: 'Detected', sortable: true, className: 'whitespace-nowrap font-mono text-xs' },
    { key: 'type', header: 'Type', sortable: true, className: 'whitespace-nowrap' },
    { key: 'account', header: 'Account', className: 'font-mono text-xs' },
    { key: 'tenant', header: 'Tenant', className: 'text-xs' },
    { key: 'ip', header: 'IP / location', render: (e) => <div><p className="font-mono text-xs">{e.ip}</p><p className="text-[11px] text-slate-500">{e.geo}</p></div> },
    { key: 'detail', header: 'Detail', className: 'min-w-[220px] text-xs text-slate-600' },
    { key: 'severity', header: 'Severity', sortable: true, render: (e) => <Badge status={e.severity} /> },
    { key: 'status', header: 'Status', sortable: true, render: (e) => <Badge status={e.status} /> },
    {
      key: 'actions', header: <span className="relative"><span className="sr-only">Actions</span></span>, render: (e) => (e.status === 'Closed' ? null : (
        <div className="flex gap-1.5">
          {e.status === 'Open' && <Button size="sm" variant="outline" disabled={readOnly} onClick={() => act(e, 'Investigating')}>Investigate</Button>}
          <Button size="sm" variant="ghost" disabled={readOnly} onClick={() => act(e, 'Closed')}>Close</Button>
        </div>
      )),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <StatCard label="Failed-login bursts" value={count(events, /login/i)} icon={LogIn} tone="red" definition="≥ 10 failed logins for one account or IP within 5 minutes" asOf={DASH_AS_OF} />
        <StatCard label="IP anomalies" value={count(events, /IP anomaly/)} icon={Globe} tone="violet" definition="Access from outside the tenant IP allow-list or from known anonymisers" asOf={DASH_AS_OF} />
        <StatCard label="MFA failures" value={count(events, /MFA/)} icon={Fingerprint} tone="warm" definition="Second-factor failures raised as events (repeat or unusual pattern)" asOf={DASH_AS_OF} />
        <StatCard label="Geo anomalies" value={count(events, /Geo/)} icon={MapPin} tone="navy" definition="Impossible travel or login country outside Myanmar for domestic users" asOf={DASH_AS_OF} />
      </div>
      <Card>
        <div className="grid grid-cols-1 gap-3 border-b border-slate-100 p-4 sm:grid-cols-3">
          <Select label="Type" value={type} onChange={(e) => setType(e.target.value)} options={types} placeholder="All types" />
          <Select label="Severity" value={severity} onChange={(e) => setSeverity(e.target.value)} options={['Critical', 'High', 'Medium', 'Low']} placeholder="All severities" />
          <Select label="Status" value={status} onChange={(e) => setStatus(e.target.value)} options={['Open', 'Investigating', 'Closed']} placeholder="All statuses" />
        </div>
        <DataTable columns={columns} rows={rows} pageSize={10} dense />
      </Card>
    </div>
  );
}
