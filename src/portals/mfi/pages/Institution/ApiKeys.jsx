import { useState } from 'react';
import { Copy, KeyRound, Plus, RotateCcw, ShieldOff, Webhook } from 'lucide-react';
import { Alert, Badge, Button, Card, CardHeader, Checkbox, DataTable, Input, Modal, PageHeader, Select, useToast } from '@/components/ui';
import { useStore } from '@/context/StoreContext';
import { nowStamp, patchIn, useMfi, useTenant } from '../../components/MfiState';
import DevDocs from '../../components/DevDocs';
import ConfirmDialog from '../../components/ConfirmDialog';
import { PermButton, ViewOnlyBanner } from '../../components/access';

const randomSecret = () => `cic_sk_${Array.from({ length: 32 }, () => 'abcdefghijklmnopqrstuvwxyz0123456789'[Math.floor(Math.random() * 36)]).join('')}`;

/** API clients, webhooks and developer docs. */
export default function ApiKeys() {
  const { user, tenant } = useTenant();
  const { apiClients, webhooks, update } = useMfi();
  const { logAudit } = useStore();
  const toast = useToast();
  const [draft, setDraft] = useState(null);
  const [secret, setSecret] = useState(null);
  const [revoking, setRevoking] = useState(null);

  const own = apiClients.filter((c) => c.tenant === tenant);
  const audit = (action, target) => logAudit({ actor: user.name, role: user.role, tenant, action, module: 'API', target, outcome: 'Success' });

  const create = () => {
    const s = randomSecret();
    const id = `API-PGMF-${String(own.length + 1).padStart(2, '0')}`;
    const env = draft.env;
    update('apiClients', (list) => [{ id, tenant, name: draft.name, clientId: `pgmf_${env === 'Sandbox' ? 'sbx' : 'prod'}_${s.slice(-4)}`, env, scopes: draft.scopes, created: nowStamp().slice(0, 10), lastUsed: null, status: 'Active', secretHint: `••••••••${s.slice(-4)}` }, ...list]);
    audit('API_KEY_CREATE', id);
    setSecret({ name: draft.name, value: s });
    setDraft(null);
  };

  const rotate = (c) => {
    const s = randomSecret();
    update('apiClients', patchIn(c.id, { secretHint: `••••••••${s.slice(-4)}`, rotatedAt: nowStamp() }));
    audit('API_KEY_ROTATE', c.id);
    setSecret({ name: c.name, value: s, rotated: true });
  };

  const revoke = () => {
    const c = revoking;
    update('apiClients', patchIn(c.id, { status: 'Revoked', revokedAt: nowStamp(), revokedBy: user.name }));
    audit('API_KEY_REVOKE', c.id);
    toast(`${c.name} revoked — requests with this key now return 401`, 'warning');
    setRevoking(null);
  };

  const copy = async () => {
    try { await navigator.clipboard.writeText(secret.value); toast('Secret copied', 'success'); } catch { toast('Copy failed — select the text manually', 'warning'); }
  };

  const toggleScope = (sc) => setDraft((d) => ({ ...d, scopes: d.scopes.includes(sc) ? d.scopes.filter((x) => x !== sc) : [...d.scopes, sc] }));

  return (
    <div className="space-y-6">
      <PageHeader
        title="API keys & webhooks"
        subtitle="Machine-to-machine clients for submission and inquiry. Keys are scoped, environment-bound and rotated at least every 90 days."
        actions={<PermButton feature="mfi.apiKeys" action="create" what="create API keys" icon={Plus} onClick={() => setDraft({ name: '', env: 'Sandbox', scopes: ['inquiry'] })}>New API client</PermButton>}
      />
      <ViewOnlyBanner feature="mfi.apiKeys" />

      <Card>
        <CardHeader title="API clients" icon={KeyRound} />
        <DataTable
          rows={own}
          emptyTitle="No API clients yet — create one to submit or inquire from your own systems"
          columns={[
            { key: 'name', header: 'Client', render: (c) => <>{c.name}<span className="block font-mono text-[11px] text-slate-500">{c.clientId}</span></> },
            { key: 'env', header: 'Environment', render: (c) => <Badge tone={c.env === 'Production' ? 'navy' : 'teal'}>{c.env}</Badge> },
            { key: 'scopes', header: 'Scopes', render: (c) => <div className="flex flex-wrap gap-1">{c.scopes.map((s) => <Badge key={s} tone="slate">{s}</Badge>)}</div> },
            { key: 'secretHint', header: 'Secret', className: 'font-mono text-xs' },
            { key: 'created', header: 'Created' },
            { key: 'lastUsed', header: 'Last used', render: (c) => c.lastUsed ?? 'Never' },
            { key: 'status', header: 'Status', render: (c) => <Badge status={c.status} /> },
            {
              key: 'actions', header: '', className: 'text-right', render: (c) => c.status === 'Active' && (
                <div className="flex flex-wrap justify-end gap-1">
                  <PermButton feature="mfi.apiKeys" action="update" what="rotate API keys" size="sm" variant="ghost" icon={RotateCcw} onClick={() => rotate(c)}>Rotate</PermButton>
                  <PermButton feature="mfi.apiKeys" action="delete" what="revoke API keys" size="sm" variant="ghost" icon={ShieldOff} onClick={() => setRevoking(c)} className="text-red-700" aria-label={`Revoke ${c.name}`}>Revoke</PermButton>
                </div>
              ),
            },
          ]}
        />
      </Card>

      <Card>
        <CardHeader title="Webhooks" subtitle="Events pushed to your systems; failed deliveries retry 5 times with back-off" icon={Webhook} />
        <DataTable
          rows={webhooks}
          emptyTitle="No webhooks registered"
          columns={[
            { key: 'url', header: 'Endpoint URL', className: 'font-mono text-xs' },
            { key: 'events', header: 'Events', render: (w) => <div className="flex flex-wrap gap-1">{w.events.map((e) => <Badge key={e} tone="blue">{e}</Badge>)}</div> },
            { key: 'secretHint', header: 'HMAC secret', className: 'font-mono text-xs' },
            { key: 'lastDelivery', header: 'Last delivery' },
            { key: 'lastStatus', header: 'Status', render: (w) => <Badge tone={w.lastStatus.startsWith('200') ? 'green' : 'amber'}>{w.lastStatus}</Badge> },
          ]}
        />
      </Card>

      <DevDocs />

      <Modal open={!!draft} onClose={() => setDraft(null)} title="New API client" footer={<><Button variant="outline" onClick={() => setDraft(null)}>Cancel</Button><Button disabled={!draft?.name || !draft?.scopes.length} onClick={create}>Create client</Button></>}>
        {draft && (
          <div className="space-y-4">
            <Input label="Client name" required value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} placeholder="Mobile loan app — inquiry" />
            <Select label="Environment" value={draft.env} onChange={(e) => setDraft({ ...draft, env: e.target.value })} options={['Sandbox', 'Production']} hint="Sandbox uses synthetic borrowers and is never billed." />
            <fieldset className="space-y-2">
              <legend className="text-xs font-medium text-slate-700">Scopes</legend>
              <Checkbox checked={draft.scopes.includes('submission')} onChange={() => toggleScope('submission')} label="submission" description="POST /v1/batches, GET /v1/batches/{id}" />
              <Checkbox checked={draft.scopes.includes('inquiry')} onChange={() => toggleScope('inquiry')} label="inquiry" description="POST /v1/inquiries, GET /v1/reports/{id}" />
            </fieldset>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={!!revoking}
        onClose={() => setRevoking(null)}
        title={`Revoke ${revoking?.name ?? ''}?`}
        subtitle={revoking ? `${revoking.clientId} · ${revoking.env}` : undefined}
        confirmLabel="Revoke key"
        confirmIcon={ShieldOff}
        onConfirm={revoke}
      >
        <p>Every request signed with this client's secret is refused from now on (HTTP 401). Systems still using it stop working until you give them a new client.</p>
        <p className="text-xs text-slate-500">The client stays in the list as Revoked and the action is recorded in the audit trail.</p>
      </ConfirmDialog>

      <Modal open={!!secret} onClose={() => setSecret(null)} title={secret?.rotated ? 'Secret rotated' : 'API client created'} footer={<Button onClick={() => setSecret(null)}>I have stored the secret</Button>}>
        {secret && (
          <div className="space-y-4">
            <Alert tone="warning" title="This secret is shown only once">Store it in your secrets vault now. CIC keeps only a hash; if lost, rotate the key.{secret.rotated && ' The previous secret stays valid for 24 hours.'}</Alert>
            <p className="text-xs text-slate-500">{secret.name}</p>
            <div className="flex items-center gap-2">
              <code className="flex-1 break-all rounded-lg bg-slate-900 p-3 font-mono text-xs text-emerald-200">{secret.value}</code>
              <Button variant="outline" size="icon" icon={Copy} onClick={copy} aria-label="Copy secret" />
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
