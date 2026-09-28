import { useState } from 'react';
import { CheckCircle2, CornerUpLeft, Send } from 'lucide-react';
import { Alert, Badge, Button, Card, CardBody, CardHeader, MakerCheckerBanner, Select, Textarea, Timeline, useToast } from '@/components/ui';
import { formatDate } from '@/lib/format';
import { useAdmin } from '../../../lib/useAdmin';
import { nowStamp } from '../../../lib/time';
import { TEMPLATES } from '../../../data/helpdesk';
import { SlaCell } from './CaseQueue';
import ConfirmReasonModal from '@/portals/government/components/ConfirmReasonModal';


function Fact({ label, children }) {
  return (
    <div>
      <dt className="text-[11px] uppercase tracking-wide text-slate-500">{label}</dt>
      <dd className="mt-0.5 text-sm text-slate-800">{children}</dd>
    </div>
  );
}

/** Case detail: facts, CIC checker step for MFI corrections, history, templated responses. */
export default function CaseDetail({ item: c, addNote }) {
  const { user, store, can, nrc, phone, audit } = useAdmin('adm.helpdesk');
  const readOnly = !can('update');
  const toast = useToast();
  const [template, setTemplate] = useState('');
  const [reply, setReply] = useState('');
  const [rejecting, setRejecting] = useState(false);

  const canApprove = can('approve');
  const pendingCorrection = c.kind === 'dispute' && c.status === 'Pending CIC approval';

  /** Keeps the Approvals inbox in sync with a decision taken here (the MFI raised the approval). */
  const closeLinkedApprovals = (status, comment) => store.approvals
    .filter((a) => a.status === 'Pending' && a.payload?.disputeId === c.id)
    .forEach((a) => store.patch('approvals', a.id, { status, checker: user.name, decidedAt: nowStamp(), comment }));

  const approve = () => {
    closeLinkedApprovals('Approved', 'Approved from Helpdesk case view');
    store.patch('disputes', c.id, (d) => ({
      status: 'Resolved',
      outcome: `Corrected — ${d.mfiResponse}`,
      history: [...d.history, { at: nowStamp(), by: `${user.name} (CIC)`, action: `Correction approved; record version ${d.history.length + 2} created` }],
    }));
    audit('DISPUTE_CORRECTION_APPROVED', `${c.id} · ${c.raw.loanId}`, { outcome: 'Success' });
    toast(`${c.id} correction approved — borrower will be notified`, 'success');
  };

  const reject = (rejectReason) => {
    closeLinkedApprovals('Rejected', rejectReason);
    store.patch('disputes', c.id, (d) => ({
      status: 'Awaiting MFI',
      history: [...d.history, { at: nowStamp(), by: `${user.name} (CIC)`, action: `Correction rejected — returned to MFI: ${rejectReason}` }],
    }));
    audit('DISPUTE_CORRECTION_REJECTED', `${c.id} · ${c.raw.loanId}`, { outcome: 'Returned to MFI', purpose: rejectReason });
    toast(`${c.id} returned to MFI`, 'warning');
    setRejecting(false);
  };

  const pickTemplate = (v) => {
    setTemplate(v);
    const t = TEMPLATES.find((x) => x.value === v);
    if (t) setReply(t.body.replace('{id}', c.id));
  };

  const send = () => {
    addNote(c.id, { at: nowStamp(), by: `${user.name} (Helpdesk)`, action: `Response sent to ${c.kind === 'grievance' ? 'complainant' : 'borrower'} via ${c.channel === 'Hotline' ? 'SMS' : 'portal + SMS'}: "${reply.slice(0, 80)}${reply.length > 80 ? '…' : ''}"` });
    audit('CASE_RESPONSE_SENT', c.id, { purpose: template ? `Template: ${template}` : 'Free text' });
    toast('Response sent and logged', 'success');
    setReply('');
    setTemplate('');
  };

  return (
    <Card>
      <CardHeader
        title={<span className="flex flex-wrap items-center gap-2"><span className="font-mono">{c.id}</span><Badge status={c.status} tone={pendingCorrection ? 'violet' : undefined} /></span>}
        subtitle={`${c.type} · ${c.subject}`}
      />
      <CardBody className="space-y-6">
        <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Fact label="Borrower">{c.borrowerName}{c.borrowerId && <span className="block font-mono text-[11px] text-slate-500">{c.borrowerId}</span>}</Fact>
          <Fact label="NRC / phone">{c.pii ? <span className="font-mono text-xs">{nrc(c.pii.nrc)}<br />{phone(c.pii.phone)}</span> : '—'}</Fact>
          <Fact label={c.dueLabel}>{formatDate(c.due)} · <SlaCell c={c} /></Fact>
          <Fact label="Assignee / channel">{c.assignee}<span className="block text-[11px] text-slate-500">{c.channel}{c.mfi ? ` · ${c.mfi}` : ''}</span></Fact>
        </dl>
        {c.detail && <p className="rounded-lg bg-slate-50 p-3 text-sm text-slate-700">{c.detail}</p>}

        {pendingCorrection && (
          <section aria-labelledby="corr" className="space-y-3 rounded-xl border border-violet-200 bg-violet-50/40 p-4">
            <h3 id="corr" className="text-sm font-semibold text-slate-900">MFI correction awaiting CIC approval</h3>
            <p className="text-sm text-slate-700"><b>{c.mfi} response:</b> {c.raw.mfiResponse}</p>
            <MakerCheckerBanner maker={`${c.mfi} Dispute Officer (MFI)`} checker="Data Steward or Super Administrator" note="The MFI submitted this correction (maker). Approving here is the CIC checker step; a new record version is created and the borrower is notified." />
            {!canApprove && !readOnly && <Alert tone="info">Your role can view, assign and respond. Corrections are approved or rejected by a role with the Approve right (Data Steward).</Alert>}
            <div className="flex flex-wrap gap-2">
                <Button size="sm" variant="success" icon={CheckCircle2} disabled={!canApprove} onClick={approve}>Approve correction</Button>
                <Button size="sm" variant="outline" icon={CornerUpLeft} disabled={!canApprove} onClick={() => setRejecting(true)}>Reject → back to MFI</Button>
            </div>
            <ConfirmReasonModal
              open={rejecting}
              title="Return correction to the MFI?"
              subtitle={`${c.id} · ${c.raw.loanId}`}
              body={<p>The record is not changed. The dispute goes back to <b>{c.mfi}</b> with your reason and the MFI response clock restarts.</p>}
              confirmLabel="Return to MFI"
              reasonLabel="Reason for returning to MFI"
              onCancel={() => setRejecting(false)}
              onConfirm={reject}
            />
          </section>
        )}
        {c.kind === 'dispute' && c.raw.outcome && <Alert tone="success" title="Outcome">{c.raw.outcome}</Alert>}

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <section aria-labelledby="hist">
            <h3 id="hist" className="mb-3 text-sm font-semibold text-slate-900">History</h3>
            <Timeline items={[...c.history].reverse().map((h, i) => ({ title: h.action, time: h.at, actor: h.by, tone: i === 0 && c.open ? 'current' : 'done' }))} />
          </section>
          <section aria-labelledby="reply" className="space-y-3">
            <h3 id="reply" className="text-sm font-semibold text-slate-900">Respond</h3>
            <Select label="Response template" placeholder="Choose a template…" options={TEMPLATES.map(({ value, label }) => ({ value, label }))} value={template} onChange={(e) => pickTemplate(e.target.value)} disabled={readOnly} />
            <Textarea label="Message" rows={5} value={reply} onChange={(e) => setReply(e.target.value)} disabled={readOnly} hint="Sent by SMS and shown in the borrower's portal. Do not include full NRC or phone numbers." />
            <div className="flex justify-end">
              <Button size="sm" icon={Send} disabled={readOnly || !reply.trim()} onClick={send}>Send response</Button>
            </div>
          </section>
        </div>
      </CardBody>
    </Card>
  );
}
