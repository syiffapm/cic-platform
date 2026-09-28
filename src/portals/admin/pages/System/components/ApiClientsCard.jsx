import { KeyRound, Plug } from 'lucide-react';
import { Badge, Button, Card, CardHeader, DataTable, useToast } from '@/components/ui';
import { roleName } from '@/data/roles';
import { slaDaysLeft } from '@/lib/format';
import { useAdminCollection } from '../../../context/AdminStore';
import { today } from '../../../lib/time';
import { API_CLIENTS } from '../../../data/system';

/** API client registry (ADM-13): mTLS cert expiry, key rotation via maker-checker. */
export default function ApiClientsCard({ role, readOnly, requestApproval, approvals }) {
  const toast = useToast();
  const [clients] = useAdminCollection('apiClients', API_CLIENTS);
  const checkerRole = role === 'adm_super' ? 'adm_security' : 'adm_super';
  const pendingFor = (id) => approvals.some((a) => a.status === 'Pending' && a.payload?.clientId === id);

  const rotate = (c) => {
    const a = requestApproval({
      type: 'API key rotation',
      summary: `Rotate API key for ${c.id} (${c.mfi})`,
      checkerRole,
      payload: { clientId: c.id, diff: [{ field: 'Key rotated', from: c.keyRotated, to: today() }], effect: { target: 'admin', collection: 'apiClients', op: 'patch', id: c.id, changes: { keyRotated: today() } } },
    });
    toast(`${a.id} submitted — new key issued after approval`, 'info');
  };

  const columns = [
    { key: 'id', header: 'Client ID', sortable: true, className: 'font-mono text-xs' },
    { key: 'mfi', header: 'Institution', sortable: true },
    { key: 'scopes', header: 'Scopes', render: (c) => <span className="font-mono text-[11px] text-slate-600">{c.scopes}</span> },
    {
      key: 'certExpiry', header: 'mTLS cert expiry', sortable: true, render: (c) => {
        const d = slaDaysLeft(c.certExpiry);
        return <span className="flex items-center gap-2 whitespace-nowrap text-xs">{c.certExpiry}{c.status !== 'Revoked' && d <= 30 && <Badge tone={d < 0 ? 'red' : 'amber'}>{d < 0 ? 'Expired' : `${d} d`}</Badge>}</span>;
      },
    },
    {
      key: 'keyRotated', header: 'Key rotated', sortable: true, render: (c) => {
        const age = -slaDaysLeft(c.keyRotated);
        return <span className="flex items-center gap-2 whitespace-nowrap text-xs">{c.keyRotated}{c.status === 'Active' && age > 180 && <Badge tone="amber">&gt; 180 d</Badge>}</span>;
      },
    },
    { key: 'status', header: 'Status', render: (c) => <Badge status={c.status} /> },
    {
      key: 'rotate', header: <span className="relative"><span className="sr-only">Actions</span></span>, render: (c) => (
        <Button size="sm" variant="outline" icon={KeyRound} disabled={readOnly || c.status !== 'Active' || pendingFor(c.id)} onClick={() => rotate(c)}>
          {pendingFor(c.id) ? 'Pending' : 'Rotate key'}
        </Button>
      ),
    },
  ];

  return (
    <Card>
      <CardHeader icon={Plug} title="API client registry" subtitle={`Rotation requires approval by ${roleName(checkerRole)} · policy: rotate every 180 days`} />
      <DataTable columns={columns} rows={clients} pageSize={10} searchKeys={['id', 'mfi', 'scopes']} />
    </Card>
  );
}
