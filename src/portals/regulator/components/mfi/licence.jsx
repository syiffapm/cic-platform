import { useState } from 'react';
import { CheckCircle2, XCircle } from 'lucide-react';
import { useSession } from '@/context/AuthContext';
import { usePermissions } from '@/lib/rbac';
import { useStore } from '@/context/StoreContext';
import { LICENCE_HISTORY } from '@/data/institutions';
import { Alert, Badge, Button, Card, CardBody, CardHeader, MakerCheckerBanner, Modal, Select, Textarea, Input, useToast } from '@/components/ui';
import { uid } from '@/lib/format';
import { TODAY, nowStamp } from '../../lib/util';
import ConfirmReasonModal from '@/portals/government/components/ConfirmReasonModal';

export const LICENCE_STATUSES = ['Licensed', 'Under Review', 'Suspended', 'Revoked'];

export const statusHistoryOf = (inst) => inst.statusHistory
  ?? LICENCE_HISTORY[inst.id]
  ?? [{ date: inst.licensedSince, status: 'Licensed', note: 'Initial licence granted' }];

const isOwn = (a, user) => a.makerId ? a.makerId === user?.id : a.maker === user?.name;

/** Maker: Licensing Officer raises a licence status change request (GOV-03, SEC-03). */
export function LicenceChangeModal({ inst, open, onClose }) {
  const user = useSession('gov');
  const { add, logAudit } = useStore();
  const toast = useToast();
  const [to, setTo] = useState('');
  const [reason, setReason] = useState('');
  const [effective, setEffective] = useState(TODAY);
  const [err, setErr] = useState('');

  const submit = () => {
    if (!to || to === inst.status) return setErr('Choose a status different from the current one.');
    if (reason.trim().length < 15) return setErr('Give the legal or supervisory basis (at least 15 characters).');
    const item = {
      id: uid('APR'), type: 'Licence status', module: 'Supervision · Institution register',
      summary: `Change ${inst.name}: ${inst.status} → ${to}`,
      maker: user.name, makerId: user.id, makerRole: user.role, checkerRole: 'gov_exec', status: 'Pending', createdAt: nowStamp(),
      payload: { institutionId: inst.id, from: inst.status, to, reason: reason.trim(), effective },
    };
    add('approvals', item);
    logAudit({ actor: user.name, role: user.role, tenant: 'CBM', action: 'LICENCE_CHANGE_REQUEST', module: 'MFI Management', target: inst.id, purpose: reason.trim(), outcome: 'Pending approval' });
    toast(`Request ${item.id} sent to the Director for approval`, 'success');
    setTo(''); setReason(''); setErr('');
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Request licence status change"
      subtitle={`${inst.name} · ${inst.licenceNo} · current status ${inst.status}`}
      footer={<><Button variant="outline" onClick={onClose}>Cancel</Button><Button onClick={submit}>Submit for approval</Button></>}
    >
      <div className="space-y-4">
        <MakerCheckerBanner maker={user?.name} checker="Governor / Director" />
        <Select label="New status" required value={to} onChange={(e) => setTo(e.target.value)} placeholder="Select…" options={LICENCE_STATUSES.filter((s) => s !== inst.status)} />
        <Input label="Effective date" type="date" value={effective} onChange={(e) => setEffective(e.target.value)} />
        <Textarea label="Basis / reason" required rows={3} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. FRD Order 17/2026 — failure to recapitalise by deadline" hint="Shown on the public directory status history if the new status is published." />
        {err && <Alert tone="danger">{err}</Alert>}
      </div>
    </Modal>
  );
}

/** Checker queue: Director approves or rejects pending licence changes. */
export function LicenceApprovals({ institutionId }) {
  const user = useSession('gov');
  const { approvals, institutions, patch, logAudit } = useStore();
  const toast = useToast();
  const [rejecting, setRejecting] = useState(null);
  const pending = approvals.filter((a) => a.type === 'Licence status' && a.status === 'Pending' && (!institutionId || a.payload?.institutionId === institutionId));
  const { can } = usePermissions('gov');
  if (!pending.length) return null;
  const canCheck = can('gov.institutions', 'approve');

  const decide = (a, approve, reason = '') => {
    if (!canCheck) return;
    if (isOwn(a, user)) { toast('You cannot approve your own request (maker-checker).', 'danger'); return; }
    patch('approvals', a.id, { status: approve ? 'Approved' : 'Rejected', checker: user.name, decidedAt: nowStamp(), ...(reason ? { comment: reason } : {}) });
    if (approve) {
      const inst = institutions.find((i) => i.id === a.payload.institutionId);
      patch('institutions', a.payload.institutionId, {
        status: a.payload.to,
        statusHistory: [...statusHistoryOf(inst), { date: a.payload.effective ?? TODAY, status: a.payload.to, note: `${a.payload.reason ?? a.summary} (approved by ${user.name}, ${a.id})` }],
      });
    }
    logAudit({ actor: user.name, role: user.role, tenant: 'CBM', action: approve ? 'LICENCE_CHANGE_APPROVE' : 'LICENCE_CHANGE_REJECT', module: 'MFI Management', target: `${a.id} / ${a.payload.institutionId}`, ...(reason ? { purpose: reason } : {}), outcome: 'Success' });
    toast(approve ? `Licence status updated to ${a.payload.to}` : 'Request rejected', approve ? 'success' : 'info');
  };

  return (
    <Card className="mb-6 border-violet-200">
      <CardHeader title="Pending licence status changes" subtitle={canCheck ? 'You are the checker for these requests' : 'Awaiting approval by the Governor / Director'} />
      <CardBody className="space-y-3">
        <MakerCheckerBanner checker="Governor / Director" note="Licence status changes take effect only after a Director different from the maker approves them." />
        {pending.map((a) => (
          <div key={a.id} className="flex flex-col gap-3 rounded-lg border border-slate-200 p-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <p className="text-sm font-medium text-slate-900">{a.summary}</p>
              <p className="text-[11px] text-slate-500">
                <span className="font-mono">{a.id}</span> · maker {a.maker} · {a.createdAt}
                {a.payload?.reason && <> · “{a.payload.reason}”</>}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <Badge status="Pending">Pending</Badge>
              {canCheck && (
                isOwn(a, user)
                  ? <span className="text-[11px] text-slate-500">Own request — cannot approve</span>
                  : <>
                    <Button size="sm" variant="success" icon={CheckCircle2} onClick={() => decide(a, true)}>Approve</Button>
                    <Button size="sm" variant="outline" icon={XCircle} onClick={() => setRejecting(a)}>Reject</Button>
                  </>
              )}
            </div>
          </div>
        ))}
      </CardBody>
      <ConfirmReasonModal
        open={!!rejecting}
        title="Reject licence status change"
        subtitle={rejecting ? `${rejecting.id} · ${rejecting.summary}` : ''}
        body={<p>The institution keeps its current licence status. The licensing officer sees your reason.</p>}
        confirmLabel="Reject request"
        reasonLabel="Reason for rejection"
        onCancel={() => setRejecting(null)}
        onConfirm={(reason) => { decide(rejecting, false, reason); setRejecting(null); }}
      />
    </Card>
  );
}
