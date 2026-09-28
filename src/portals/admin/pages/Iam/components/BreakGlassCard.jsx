import { useState } from 'react';
import { Siren } from 'lucide-react';
import { Alert, Badge, Button, Card, CardHeader, Input, MakerCheckerBanner, Modal, Select } from '@/components/ui';
import { roleName } from '@/data/roles';

const INCIDENT_TYPES = ['Production outage — all admins locked out', 'Identity provider (SSO) failure', 'Security incident containment', 'Disaster recovery activation'];

/** Break-glass accounts (ADM-04): sealed, dual-controlled, SIEM-alerted. */
export default function BreakGlassCard({ accounts, readOnly, maker, checkerRole, onRequest }) {
  const [target, setTarget] = useState(null);
  const [form, setForm] = useState({ incident: INCIDENT_TYPES[0], ticket: '', hours: '4' });
  const valid = /^INC-\d{4}-\d{3,}$/.test(form.ticket.trim());

  return (
    <Card>
      <CardHeader icon={Siren} title="Break-glass accounts" subtitle="Emergency super-admin access · dual control" />
      <div className="space-y-4 p-5">
        <Alert tone="danger" title="Break-glass accounts are sealed; any use triggers SIEM alert + page to CISO">
          Credentials are held offline in sealed envelopes. Activation needs an incident ticket and a second approver; the session is recorded and time-boxed.
        </Alert>
        <ul className="divide-y divide-slate-100 rounded-lg border border-slate-200">
          {accounts.map((a) => (
            <li key={a.id} className="flex flex-col gap-3 px-4 py-3 md:flex-row md:items-center md:justify-between">
              <div className="min-w-0">
                <p className="font-mono text-sm font-semibold text-slate-800">{a.name}</p>
                <p className="text-xs text-slate-500">{roleName(a.role)} · custodian: {a.custodian}</p>
                <p className="text-xs text-slate-500">Last use: {a.lastUse}</p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <Badge tone={a.status.startsWith('Sealed') ? 'slate' : 'red'}>{a.status}</Badge>
                <Button size="sm" variant="danger" disabled={readOnly || !a.status.startsWith('Sealed')} onClick={() => { setTarget(a); setForm({ incident: INCIDENT_TYPES[0], ticket: '', hours: '4' }); }}>
                  Request break-glass activation
                </Button>
              </div>
            </li>
          ))}
        </ul>
      </div>
      <Modal open={!!target} onClose={() => setTarget(null)} title={`Request activation · ${target?.name ?? ''}`} subtitle="Emergency access request — SIEM alert and CISO page are sent immediately"
        footer={<><Button variant="outline" onClick={() => setTarget(null)}>Cancel</Button><Button variant="danger" disabled={!valid} onClick={() => { onRequest(target, form); setTarget(null); }}>Submit request</Button></>}>
        <div className="space-y-4">
          <MakerCheckerBanner maker={maker} checker={roleName(checkerRole)} note="Activation requires a second approver (dual control). The account is re-sealed and its password rotated automatically when the window closes." />
          <Select label="Incident type" value={form.incident} onChange={(e) => setForm({ ...form, incident: e.target.value })} options={INCIDENT_TYPES} />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input label="Incident ticket" required placeholder="INC-2026-118" value={form.ticket} onChange={(e) => setForm({ ...form, ticket: e.target.value })} error={form.ticket && !valid ? 'Format INC-YYYY-NNN' : null} />
            <Select label="Access window" value={form.hours} onChange={(e) => setForm({ ...form, hours: e.target.value })} options={[{ value: '1', label: '1 hour' }, { value: '2', label: '2 hours' }, { value: '4', label: '4 hours (max)' }]} />
          </div>
        </div>
      </Modal>
    </Card>
  );
}
