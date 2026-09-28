import { useState } from 'react';
import { Ban, CheckCircle2, Gavel } from 'lucide-react';
import { Alert, Badge, Button, Card, CardBody, CardHeader, Checkbox, Modal, Select, Textarea } from '@/components/ui';
import { REJECT_REASONS } from '@/lib/reportRequests';
import { formatDate } from '@/lib/format';
import { counts } from './requestUtils';

/** Outcome of a decided request. */
function Outcome({ req }) {
  if (req.status === 'Ready' && req.result) {
    const r = req.result;
    return (
      <CardBody className="space-y-2 text-sm">
        <Alert tone="success" title={`Report ${r.reportId} issued`}>Approved by {req.reviewedBy} on {req.reviewedAt}. The citizen was notified by {req.notify}.</Alert>
        <dl className="grid grid-cols-2 gap-3 pt-1 text-xs">
          <div><dt className="text-slate-500">Result</dt><dd className="font-semibold text-slate-900">{r.noHit ? 'No credit history yet' : `Grade ${r.grade} · ${r.score}/100`}</dd></div>
          <div><dt className="text-slate-500">Valid until</dt><dd className="font-semibold text-slate-900">{formatDate(r.validUntil)}</dd></div>
          <div><dt className="text-slate-500">Data as of</dt><dd className="text-slate-800">{formatDate(r.dataAsOf)}</dd></div>
          <div><dt className="text-slate-500">Scoring rules</dt><dd className="font-mono text-slate-800">{r.ruleVersion}</dd></div>
          <div><dt className="text-slate-500">Active loans · lenders</dt><dd className="text-slate-800">{r.activeCount} · {r.lenders}</dd></div>
          <div><dt className="text-slate-500">Records flagged under dispute</dt><dd className="text-slate-800">{r.disputeFlags?.length ? r.disputeFlags.join(', ') : 'None'}</dd></div>
        </dl>
      </CardBody>
    );
  }
  if (req.status === 'Rejected') {
    return (
      <CardBody>
        <Alert tone="danger" title="Request rejected">
          {req.rejectReason?.label} {req.rejectReason?.note && <span className="mt-1 block text-xs">Officer note: {req.rejectReason.note}</span>}
          <span className="mt-1 block text-xs">Decided by {req.reviewedBy} on {req.reviewedAt}. The citizen was notified by {req.notify}.</span>
        </Alert>
      </CardBody>
    );
  }
  return null;
}

/** Approve-and-issue or reject, with the fail/warn/own-file rules. */
export default function DecisionPanel({ req, readOnly, ownFile, onApprove, onReject }) {
  const [reviewed, setReviewed] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [code, setCode] = useState('');
  const [note, setNote] = useState('');
  const open = ['Submitted', 'Validating', 'Pending review'].includes(req.status);
  const issues = counts(req.checks);
  const validated = req.status === 'Pending review';
  const canApprove = open && validated && !issues.fail && (!issues.warn || reviewed) && !ownFile;
  const reason = REJECT_REASONS.find((r) => r.code === code);

  return (
    <Card>
      <CardHeader icon={Gavel} title="Decision" subtitle="Decide within 1 working day of submission"
        action={<Badge tone={open ? 'amber' : req.status === 'Ready' ? 'green' : 'red'}>{open ? 'Awaiting decision' : req.status === 'Ready' ? 'Issued' : 'Rejected'}</Badge>} />
      {!open ? <Outcome req={req} /> : (
        <CardBody className="space-y-4">
          {readOnly && <Alert tone="info">Your role can review this request but cannot decide it.</Alert>}
          {!validated && <Alert tone="info" title="Validation still running">Re-run validation to complete the automated checks before deciding.</Alert>}
          {issues.fail > 0 && (
            <Alert tone="danger" title="Approval blocked">
              {issues.fail} automated check{issues.fail > 1 ? 's' : ''} failed. Resolve the cause and re-run validation, or reject the request with a reason.
            </Alert>
          )}
          {!issues.fail && issues.warn > 0 && (
            <Alert tone="warning" title={`${issues.warn} warning${issues.warn > 1 ? 's' : ''} to review`}>
              Warnings do not block issue. Records under dispute are shown on the report as disputed and are not scored.
              {!readOnly && <Checkbox className="mt-2" checked={reviewed} onChange={(e) => setReviewed(e.target.checked)} label="I reviewed the warnings and the report can be issued" />}
            </Alert>
          )}
          {ownFile && <Alert tone="danger" title="Conflict of interest">This request is for your own NRC. Another officer must decide it.</Alert>}
          <p className="text-xs text-slate-500">
            Approving generates a dated report snapshot, valid for 30 days, and notifies the citizen by {req.notify}. An officer may not decide a request for their own NRC. Every decision is recorded in the audit log.
          </p>
          {!readOnly && (
            <div className="flex flex-wrap gap-2">
              <Button variant="success" icon={CheckCircle2} disabled={!canApprove} onClick={() => onApprove({ reviewedWarnings: issues.warn > 0 })}>Approve and issue report</Button>
              <Button variant="outline" icon={Ban} disabled={ownFile} onClick={() => setRejecting(true)}>Reject</Button>
            </div>
          )}
        </CardBody>
      )}

      <Modal open={rejecting} onClose={() => setRejecting(false)} title="Reject report request" subtitle={`${req.id} · ${req.name}`}
        footer={(
          <>
            <Button variant="outline" onClick={() => setRejecting(false)}>Cancel</Button>
            <Button variant="danger" disabled={!reason || note.trim().length < 5} onClick={() => { onReject({ reason, note: note.trim() }); setRejecting(false); }}>Reject and notify citizen</Button>
          </>
        )}>
        <div className="space-y-4">
          <Select label="Reason shown to the citizen" required value={code} onChange={(e) => setCode(e.target.value)} placeholder="Select a reason"
            options={REJECT_REASONS.map((r) => ({ value: r.code, label: r.label }))} />
          <Textarea label="Internal note" required rows={3} value={note} onChange={(e) => setNote(e.target.value)} hint="Recorded in the request history and audit log (at least 5 characters). Not sent to the citizen." />
          {reason && <p className="rounded-lg bg-slate-50 p-3 text-xs text-slate-600">Message sent by {req.notify}: &ldquo;CIC Myanmar: we could not issue the credit report you requested ({req.id}). Reason: {reason.label}.&rdquo;</p>}
        </div>
      </Modal>
    </Card>
  );
}
