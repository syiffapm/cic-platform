import { useState } from 'react';
import { Plug, Send } from 'lucide-react';
import { Alert, Badge, Button, Card, CardBody, CardHeader, Input, MakerCheckerBanner, Select, Toggle, useToast } from '@/components/ui';
import { roleName } from '@/data/roles';
import { useAdminObject } from '../../../context/AdminStore';
import { SIEM_DEFAULTS } from '../../../data/security';

const FIELDS = { endpoint: 'Endpoint URL', format: 'Format', tls: 'TLS', batchSeconds: 'Batch interval (s)', includeReads: 'Include read events' };
const show = (v) => (typeof v === 'boolean' ? (v ? 'On' : 'Off') : String(v));

/** SIEM export settings (ADM-12). Saving is a maker-checker change. */
export default function SiemTab({ user, role, readOnly, audit, requestApproval, approvals }) {
  const toast = useToast();
  const [current] = useAdminObject('siemConfig', SIEM_DEFAULTS);
  const [draft, setDraft] = useState(current);
  const [testing, setTesting] = useState(false);
  const checkerRole = role === 'adm_super' ? 'adm_security' : 'adm_super';
  const set = (k, v) => setDraft((d) => ({ ...d, [k]: v }));
  const diff = Object.keys(FIELDS).filter((k) => draft[k] !== current[k]).map((k) => ({ field: FIELDS[k], from: show(current[k]), to: show(draft[k]) }));
  const pending = approvals.filter((a) => a.status === 'Pending' && a.type === 'SIEM export change');

  const test = () => {
    setTesting(true);
    setTimeout(() => {
      setTesting(false);
      const ok = draft.tls && /^(syslog\+tls|https):\/\//.test(draft.endpoint);
      audit('SIEM_TEST_CONNECTION', draft.endpoint, { outcome: ok ? 'Success' : 'Failed' });
      toast(ok ? 'Connection OK — test event received by SIEM (TLS 1.3)' : 'Connection refused: endpoint must use TLS (syslog+tls:// or https://)', ok ? 'success' : 'danger');
    }, 1200);
  };

  const save = () => {
    const a = requestApproval({
      type: 'SIEM export change',
      summary: `SIEM export: ${diff.map((d) => `${d.field} ${d.from} → ${d.to}`).join('; ')}`,
      checkerRole,
      payload: { diff, effect: { target: 'admin', collection: 'siemConfig', op: 'set', changes: draft } },
    });
    toast(`${a.id} sent to ${roleName(checkerRole)} for approval`, 'success');
  };

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <Card className="lg:col-span-2">
        <CardHeader icon={Plug} title="SIEM export" subtitle="Stream audit and security logs to the national SOC" />
        <CardBody className="space-y-4">
          <Input label="Syslog / JSON endpoint URL" value={draft.endpoint} onChange={(e) => set('endpoint', e.target.value)} disabled={readOnly} hint="syslog+tls://host:6514 or https://host/ingest" />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Select label="Format" value={draft.format} onChange={(e) => set('format', e.target.value)} disabled={readOnly} options={['CEF', 'LEEF', 'JSON (ECS)', 'RFC 5424 syslog']} />
            <Input label="Batch interval (seconds)" type="number" min={5} max={300} value={draft.batchSeconds} onChange={(e) => set('batchSeconds', Number(e.target.value))} disabled={readOnly} />
          </div>
          <div className="space-y-3 rounded-lg border border-slate-200 p-4">
            <Toggle label="TLS (mutual auth)" description="Required for any endpoint outside the CIC network" checked={draft.tls} onChange={(v) => !readOnly && set('tls', v)} />
            <Toggle label="Include read events" description="Export every read of personal data, not only changes" checked={draft.includeReads} onChange={(v) => !readOnly && set('includeReads', v)} />
          </div>
          {!draft.tls && <Alert tone="warning">Sending logs without TLS exposes personal data in transit and breaches the data protection policy.</Alert>}
          <MakerCheckerBanner maker={user?.name} checker={roleName(checkerRole)} />
          <div className="flex flex-wrap justify-end gap-2">
            <Button variant="outline" icon={Send} onClick={test} disabled={readOnly || testing}>{testing ? 'Testing…' : 'Test connection'}</Button>
            <Button onClick={save} disabled={readOnly || diff.length === 0}>Submit for approval</Button>
          </div>
        </CardBody>
      </Card>
      <Card>
        <CardHeader title="Current vs pending" subtitle="Active configuration" />
        <CardBody className="space-y-3 text-sm">
          {Object.entries(FIELDS).map(([k, label]) => (
            <div key={k} className="flex items-start justify-between gap-2">
              <span className="text-slate-500">{label}</span>
              <span className="break-all text-right font-medium text-slate-800">{show(current[k])}</span>
            </div>
          ))}
          {pending.length > 0 && (
            <div className="space-y-2 border-t border-slate-100 pt-3">
              {pending.map((a) => <p key={a.id} className="text-xs text-slate-600"><Badge status="Pending" /> {a.id} · {a.summary}</p>)}
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
