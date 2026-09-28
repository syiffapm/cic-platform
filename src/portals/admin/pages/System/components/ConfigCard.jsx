import { useEffect, useState } from 'react';
import { Settings2 } from 'lucide-react';
import { Alert, Badge, Button, Card, CardBody, CardHeader, Input, MakerCheckerBanner, Modal, Select, Toggle, useToast } from '@/components/ui';
import { roleName } from '@/data/roles';
import { useAdminObject } from '../../../context/AdminStore';
import { BACKUP_FREQUENCIES, SYSTEM_DEFAULTS } from '../../../data/system';

const FIELDS = {
  maintenanceMode: 'Maintenance mode',
  auditRetentionDays: 'Audit retention (days)',
  backupFrequency: 'Backup frequency',
  sessionIdleMinutes: 'Session idle timeout (min)',
};
const show = (v) => (typeof v === 'boolean' ? (v ? 'On' : 'Off') : String(v));

/** ADM-13 configuration with maker-checker (SEC-03): edits become a pending approval with a diff. */
export default function ConfigCard({ user, role, readOnly, requestApproval, approvals }) {
  const toast = useToast();
  const [config] = useAdminObject('systemConfig', SYSTEM_DEFAULTS);
  const [draft, setDraft] = useState(config);
  const [confirm, setConfirm] = useState(false);
  const [reason, setReason] = useState('');
  useEffect(() => setDraft(config), [config]);

  const checkerRole = role === 'adm_super' ? 'adm_security' : 'adm_super';
  const set = (k, v) => setDraft((d) => ({ ...d, [k]: v }));
  const diff = Object.keys(FIELDS).filter((k) => draft[k] !== config[k]).map((k) => ({ field: FIELDS[k], from: show(config[k]), to: show(draft[k]) }));
  const changes = Object.fromEntries(Object.keys(FIELDS).filter((k) => draft[k] !== config[k]).map((k) => [k, draft[k]]));
  const pending = approvals.filter((a) => a.status === 'Pending' && a.type === 'Config change' && a.module.includes('System'));
  const retentionError = draft.auditRetentionDays < 3650 ? 'Audit logs must be kept at least 3,650 days (10 years, WORM)' : null;
  const idleError = draft.sessionIdleMinutes > 10 ? 'Security policy caps idle timeout at 10 minutes' : null;

  const submit = () => {
    const a = requestApproval({
      type: 'Config change',
      summary: diff.map((d) => `${d.field} ${d.from} → ${d.to}`).join('; '),
      checkerRole,
      payload: { diff, reason, effect: { target: 'admin', collection: 'systemConfig', op: 'set', changes } },
    });
    setConfirm(false); setReason('');
    toast(`${a.id} submitted — awaiting ${roleName(checkerRole)}`, 'success');
  };

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <Card className="lg:col-span-2">
        <CardHeader icon={Settings2} title="System configuration" subtitle="Changes take effect only after checker approval" />
        <CardBody className="space-y-5">
          {config.maintenanceMode && <Alert tone="warning" title="Maintenance mode is ON">Public, borrower and MFI portals show the maintenance page; inquiries are paused.</Alert>}
          <div className="rounded-lg border border-slate-200 p-4">
            <Toggle label="Maintenance mode" description="Blocks inquiries and submissions on all external portals" checked={draft.maintenanceMode} onChange={(v) => !readOnly && set('maintenanceMode', v)} />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Input label="Audit retention (days)" type="number" min={3650} value={draft.auditRetentionDays} disabled={readOnly} error={retentionError} onChange={(e) => set('auditRetentionDays', Number(e.target.value))} />
            <Select label="Backup frequency" value={draft.backupFrequency} disabled={readOnly} options={BACKUP_FREQUENCIES} onChange={(e) => set('backupFrequency', e.target.value)} />
            <Input label="Session idle timeout (min)" type="number" min={1} max={10} value={draft.sessionIdleMinutes} disabled={readOnly} error={idleError} onChange={(e) => set('sessionIdleMinutes', Number(e.target.value))} />
          </div>
          <div className="flex flex-wrap justify-end gap-2">
            <Button variant="ghost" onClick={() => setDraft(config)} disabled={readOnly || diff.length === 0}>Discard</Button>
            <Button onClick={() => setConfirm(true)} disabled={readOnly || diff.length === 0 || !!retentionError || !!idleError}>Request change ({diff.length})</Button>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Current vs pending" subtitle="Active values and requests awaiting a checker" />
        <CardBody className="space-y-4 text-sm">
          <dl className="space-y-2">
            {Object.entries(FIELDS).map(([k, label]) => (
              <div key={k} className="flex justify-between gap-2"><dt className="text-slate-500">{label}</dt><dd className="font-medium text-slate-800">{show(config[k])}</dd></div>
            ))}
          </dl>
          <div className="space-y-3 border-t border-slate-100 pt-3">
            {pending.length === 0 ? <p className="text-xs text-slate-500">No pending configuration changes.</p> : pending.map((a) => (
              <div key={a.id} className="rounded-lg border border-amber-200 bg-amber-50/60 p-3">
                <p className="flex items-center justify-between text-xs font-semibold text-slate-800">{a.id} <Badge status="Pending" /></p>
                <p className="mt-0.5 text-[11px] text-slate-500">by {a.maker} · checker {roleName(a.checkerRole)} · {a.createdAt}</p>
                <ul className="mt-2 space-y-0.5 text-xs">
                  {(a.payload?.diff ?? []).map((d) => <li key={d.field}>{d.field}: <s className="text-slate-500">{d.from}</s> → <b>{d.to}</b></li>)}
                  {!a.payload?.diff && <li>{a.summary}</li>}
                </ul>
              </div>
            ))}
          </div>
        </CardBody>
      </Card>

      <Modal open={confirm} onClose={() => setConfirm(false)} title="Request configuration change" subtitle="Maker-checker"
        footer={<><Button variant="ghost" onClick={() => setConfirm(false)}>Cancel</Button><Button onClick={submit} disabled={!reason.trim()}>Submit for approval</Button></>}>
        <div className="space-y-4">
          <table className="w-full text-sm">
            <thead className="text-left text-[11px] uppercase text-slate-500"><tr><th className="py-1">Field</th><th>Current</th><th>Proposed</th></tr></thead>
            <tbody className="divide-y divide-slate-100">
              {diff.map((d) => <tr key={d.field}><td className="py-1.5">{d.field}</td><td className="text-slate-500">{d.from}</td><td className="font-semibold text-primary">{d.to}</td></tr>)}
            </tbody>
          </table>
          <Input label="Reason / change ticket" required value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. CHG-2026-118 tighten RPO before Q4 audit" />
          <MakerCheckerBanner maker={user?.name} checker={roleName(checkerRole)} />
        </div>
      </Modal>
    </div>
  );
}
