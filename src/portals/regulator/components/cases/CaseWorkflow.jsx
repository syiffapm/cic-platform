import { useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, Gavel, Lock, Send } from 'lucide-react';
import { useSession } from '@/context/AuthContext';
import { usePermissions } from '@/lib/rbac';
import { useStore } from '@/context/StoreContext';
import { uid } from '@/lib/format';
import { Alert, Badge, Button, Card, CardBody, CardHeader, Checkbox, Input, MakerCheckerBanner, Select, Textarea, useToast } from '@/components/ui';
import { useRegulator } from '../../lib/RegulatorStore';
import { ACTION_TYPES } from '../../data/cases';
import { TODAY, addDays, nowStamp } from '../../lib/util';

const audit = (logAudit, user, action, target, extra = {}) => logAudit({ actor: user.name, role: user.role, tenant: 'CBM', action, module: 'Supervision', target, outcome: 'Success', ...extra });

/** Stage 2 — request information from the MFI (creates a GOV-07 request linked to the case). */
export function RequestInfoPanel({ c }) {
  const user = useSession('gov');
  const { can } = usePermissions('gov');
  const { add, patch, infoRequests } = useRegulator();
  const { logAudit } = useStore();
  const [subject, setSubject] = useState('');
  const linked = infoRequests.filter((r) => r.caseId === c.id);
  const send = () => {
    const id = `IR-2026-${120 + infoRequests.length + 1}`;
    add('infoRequests', { id, mfiId: c.mfiId, caseId: c.id, subject: subject.trim(), sentAt: TODAY, dueAt: addDays(TODAY, 14), status: 'Sent', sentBy: user.name, answeredAt: null });
    patch('cases', c.id, (x) => ({ correspondence: [...x.correspondence, { at: nowStamp(), from: user.name, to: 'MFI compliance officer', channel: 'Information request', message: `${id} sent: ${subject.trim()} (due ${addDays(TODAY, 14)})` }] }));
    audit(logAudit, user, 'INFO_REQUEST_SEND', `${id} / ${c.mfiId}`);
    setSubject('');
  };
  return (
    <div className="space-y-3">
      {linked.map((r) => (
        <div key={r.id} className="flex items-center justify-between gap-2 rounded-lg border border-slate-200 p-2.5 text-sm">
          <span><span className="font-mono text-[11px] text-slate-500">{r.id}</span> {r.subject}</span>
          <Badge status={r.status}>{r.status}</Badge>
        </div>
      ))}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
        <Input className="flex-1" label="New information request" value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="What must the MFI provide?" hint="Due in 14 days; tracked under Information requests." />
        <Button icon={Send} onClick={send} disabled={!can('gov.infoRequests', 'create') || subject.trim().length < 5}>Send</Button>
      </div>
      <Link to="/gov/info-requests" className="text-xs font-medium text-primary hover:underline">All information requests →</Link>
    </div>
  );
}

/** Stage 3 — proposed decision needs approval by a Director who did not propose it. */
export function DecisionPanel({ c }) {
  const user = useSession('gov');
  const { can } = usePermissions('gov');
  const { patch } = useRegulator();
  const { logAudit } = useStore();
  const toast = useToast();
  const [text, setText] = useState('');
  const d = c.decision;
  const own = d && d.proposedById === user.id;

  const propose = () => {
    patch('cases', c.id, { decision: { text: text.trim(), proposedBy: user.name, proposedById: user.id, status: 'Pending approval', approver: null } });
    audit(logAudit, user, 'CASE_DECISION_PROPOSE', c.id, { outcome: 'Pending approval' });
    setText('');
  };
  const decide = (ok) => {
    if (own) { toast('You cannot approve a decision you proposed.', 'danger'); return; }
    patch('cases', c.id, { decision: { ...d, status: ok ? 'Approved' : 'Returned', approver: user.name, decidedAt: nowStamp() } });
    audit(logAudit, user, ok ? 'CASE_DECISION_APPROVE' : 'CASE_DECISION_RETURN', c.id);
    toast(ok ? 'Decision approved' : 'Decision returned to owner', ok ? 'success' : 'info');
  };

  return (
    <div className="space-y-3">
      <MakerCheckerBanner maker={d?.proposedBy} checker="Governor / Director" note="Supervisory decisions take effect only after approval by a Director other than the proposer." />
      {d && (
        <div className="rounded-lg border border-slate-200 p-3">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs text-slate-500">Proposed by <b className="text-slate-700">{d.proposedBy}</b></p>
            <Badge status={d.status === 'Pending approval' ? 'Awaiting approval' : d.status}>{d.status}</Badge>
          </div>
          <p className="mt-1.5 text-sm text-slate-800">{d.text}</p>
          {d.approver && <p className="mt-1.5 text-[11px] text-slate-500">{d.status} by {d.approver}</p>}
          {d.status === 'Pending approval' && can('gov.cases', 'approve') && (
            own ? <p className="mt-2 text-[11px] text-slate-500">Own proposal — another Director must approve.</p> : (
              <div className="mt-3 flex gap-2">
                <Button size="sm" variant="success" icon={CheckCircle2} onClick={() => decide(true)}>Approve decision</Button>
                <Button size="sm" variant="outline" onClick={() => decide(false)}>Return</Button>
              </div>
            )
          )}
        </div>
      )}
      {(!d || d.status === 'Returned') && can('gov.cases', 'update') && (
        <div className="space-y-2">
          <Textarea label="Proposed decision" rows={3} value={text} onChange={(e) => setText(e.target.value)} placeholder="Finding, legal basis and proposed measure" />
          <Button icon={Gavel} onClick={propose} disabled={text.trim().length < 20}>Submit for approval</Button>
        </div>
      )}
    </div>
  );
}

/** Stage 4 — enforcement action. Suspension / revocation also raises a licence maker-checker request. */
export function ActionPanel({ c, inst }) {
  const user = useSession('gov');
  const { can } = usePermissions('gov');
  const { patch } = useRegulator();
  const { add, logAudit } = useStore();
  const [type, setType] = useState('Warning');
  const [amount, setAmount] = useState('');
  const [ref, setRef] = useState('');

  const record = () => {
    patch('cases', c.id, { action: { type, ref: ref.trim() || '—', amount: type === 'Fine' ? Number(amount) : null, at: TODAY } });
    if (['Suspension', 'Licence revocation'].includes(type) && inst) {
      const to = type === 'Suspension' ? 'Suspended' : 'Revoked';
      add('approvals', { id: uid('APR'), type: 'Licence status', module: 'Supervision · Institution register', summary: `Change ${inst.name}: ${inst.status} → ${to} (case ${c.id})`, maker: user.name, makerId: user.id, makerRole: user.role, checkerRole: 'gov_exec', status: 'Pending', createdAt: nowStamp(), payload: { institutionId: inst.id, from: inst.status, to, reason: `${c.id}: ${ref.trim() || type}`, effective: TODAY } });
    }
    audit(logAudit, user, 'CASE_ACTION_RECORD', `${c.id} / ${type}`);
  };

  if (c.action) {
    return (
      <Alert tone="success" title={`Action recorded: ${c.action.type}`}>
        Reference {c.action.ref}{c.action.amount ? ` · fine ${c.action.amount.toLocaleString()} MMK` : ''} · {c.action.at}
        {['Suspension', 'Licence revocation'].includes(c.action.type) && <> · licence change sent to the Director for approval (<Link className="underline" to={`/gov/mfi/${c.mfiId}`}>view</Link>)</>}
      </Alert>
    );
  }
  if (c.decision?.status !== 'Approved') return <Alert tone="warning" title="Decision not yet approved">Record the enforcement action once the decision is approved.</Alert>;
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:items-end">
      <Select label="Action" value={type} onChange={(e) => setType(e.target.value)} options={ACTION_TYPES} />
      {type === 'Fine' && <Input label="Fine amount (MMK)" type="number" min="0" value={amount} onChange={(e) => setAmount(e.target.value)} />}
      <Input label="Order / letter reference" value={ref} onChange={(e) => setRef(e.target.value)} placeholder="e.g. FRD/W/2026/24" />
      <div className="sm:col-span-3"><Button icon={Gavel} onClick={record} disabled={!can('gov.cases', 'update') || (type === 'Fine' && !(Number(amount) > 0))}>Record action</Button></div>
    </div>
  );
}

/** Close the case; if "publish if public" is ticked, a Public notice is queued for publication approval. */
export function ClosePanel({ c, inst }) {
  const user = useSession('gov');
  const { can } = usePermissions('gov');
  const { patch } = useRegulator();
  const { add, logAudit } = useStore();
  const toast = useToast();
  const [publish, setPublish] = useState(c.publishIfPublic);
  const [note, setNote] = useState('');
  const close = () => {
    patch('cases', c.id, { stage: 5, closedAt: TODAY, publishIfPublic: publish, closingNote: note.trim() });
    if (publish && c.action && c.action.type !== 'No action') {
      add('announcements', {
        id: `ANN-${Date.now().toString().slice(-6)}`, title: { en: `Enforcement action: ${inst?.name ?? c.mfiId} — ${c.action.type}`, mm: '' },
        body: { en: `The Central Bank of Myanmar has taken the following action against ${inst?.name}: ${c.action.type} (${c.action.ref}). ${note.trim()}`, mm: '' },
        category: 'Enforcement', classification: 'Public', status: 'In review', publishedAt: null, author: user.name, approver: null, attachment: null, pinned: false, mandatory: false, source: c.id,
      });
      toast('Case closed; public notice queued for publication approval', 'success');
    } else toast('Case closed', 'success');
    logAudit({ actor: user.name, role: user.role, tenant: 'CBM', action: 'CASE_CLOSE', module: 'Supervision', target: c.id, outcome: 'Success' });
  };
  return (
    <div className="space-y-3">
      <Textarea label="Closing note" rows={2} value={note} onChange={(e) => setNote(e.target.value)} />
      <Checkbox checked={publish} onChange={(e) => setPublish(e.target.checked)} label="Publish if public" description="Queues a Public enforcement notice for Director approval before it appears on the Public Portal." />
      <Button icon={Lock} variant="secondary" onClick={close} disabled={!can('gov.cases', 'update') || !c.action}>Close case</Button>
    </div>
  );
}

export function StagePanel({ title, children }) {
  return (
    <Card className="border-primary-200">
      <CardHeader title={title} />
      <CardBody>{children}</CardBody>
    </Card>
  );
}
