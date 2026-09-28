import { useState } from 'react';
import { CheckCircle2, Download, FileCheck2, Scale, ShieldCheck, Undo2, XCircle } from 'lucide-react';
import { Alert, Badge, Button, Card, CardBody, CardHeader, Checkbox, Input, MakerCheckerBanner, Textarea } from '@/components/ui';
import { formatMMK, formatNumber } from '@/lib/format';
import { downloadFile } from './download';
import { PermButton } from './access';
import { STRONG } from './buttonTones';

export const ATTESTATION = 'I attest that this submission is complete and accurate to the best of my knowledge, was prepared from the institution\'s books of record in accordance with the CIC Directive on Credit Reporting v2.0, and that the control totals reconcile to our general ledger.';

function Result({ r }) {
  if (r.cic === null) return <span className="text-xs text-slate-500">Pending</span>;
  return r.ok
    ? <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700"><CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" /> Match</span>
    : <span className="inline-flex items-center gap-1 text-xs font-medium text-red-700"><XCircle className="h-3.5 w-3.5" aria-hidden="true" /> Mismatch</span>;
}

/** Reconciliation of MFI control totals vs CIC-computed totals. */
export function ReconciliationPanel({ batch }) {
  const c = batch.computed;
  const rows = [
    { label: 'Loan record count', mfi: formatNumber(batch.control.records), cic: c ? formatNumber(c.records) : null, ok: c && c.records === batch.control.records },
    { label: 'Sum of outstanding balance', mfi: formatMMK(batch.control.outstanding), cic: c ? formatMMK(c.outstanding) : null, ok: c && c.outstanding === batch.control.outstanding },
    { label: 'Reporting period', mfi: batch.period, cic: c ? batch.period : null, ok: !!c },
    { label: 'Licence number', mfi: batch.control.licenceNo, cic: c ? batch.control.licenceNo : null, ok: !!c },
  ];
  const allOk = c && rows.every((r) => r.ok);
  return (
    <Card>
      <CardHeader title="Reconciliation" subtitle="MFI control totals vs totals computed by CIC from accepted and rejected rows" icon={Scale} action={c ? <Badge tone={allOk ? 'green' : 'red'}>{allOk ? 'Reconciled' : 'Mismatch'}</Badge> : <Badge tone="blue">Pending</Badge>} />
      {/* Phones: one block per check. */}
      <ul className="divide-y divide-slate-100 sm:hidden">
        {rows.map((r) => (
          <li key={r.label} className="space-y-1 px-4 py-3 text-xs">
            <div className="flex items-start justify-between gap-3"><span className="font-medium text-slate-800">{r.label}</span><Result r={r} /></div>
            <div className="flex justify-between gap-3"><span className="text-slate-500">MFI control</span><span className="text-right font-medium text-slate-700">{r.mfi}</span></div>
            <div className="flex justify-between gap-3"><span className="text-slate-500">CIC computed</span><span className="text-right font-medium text-slate-700">{r.cic ?? '…'}</span></div>
          </li>
        ))}
      </ul>
      <div className="hidden overflow-x-auto scrollbar-thin sm:block" tabIndex={0} role="region" aria-label="Reconciliation checks">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-[11px] uppercase tracking-wide text-slate-500">
            <tr><th scope="col" className="px-4 py-2">Check</th><th scope="col" className="px-4 py-2">MFI control</th><th scope="col" className="px-4 py-2">CIC computed</th><th scope="col" className="px-4 py-2">Result</th></tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((r) => (
              <tr key={r.label}>
                <td className="px-4 py-2.5 text-slate-600">{r.label}</td>
                <td className="px-4 py-2.5 font-medium">{r.mfi}</td>
                <td className="px-4 py-2.5 font-medium">{r.cic ?? '…'}</td>
                <td className="px-4 py-2.5"><Result r={r} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {c && !allOk && <CardBody><Alert tone="danger" title="Totals do not reconcile">Difference in outstanding: {formatMMK(batch.control.outstanding - c.outstanding)}. Correct the rejected rows and resubmit a new file for the same period — the failed batch is kept for audit and nothing is loaded twice.</Alert></CardBody>}
    </Card>
  );
}

/** Checker approval with attestation and signature. */
export function ApprovalPanel({ batch, user, canApprove, onApprove, onReturn }) {
  const [attest, setAttest] = useState(false);
  const [signature, setSignature] = useState('');
  const [comment, setComment] = useState('');
  const isOwn = batch.uploadedBy === user.id;
  const isChecker = !!canApprove;
  const sigOk = signature.trim().toLowerCase() === user.name.toLowerCase();

  return (
    <Card>
      <CardHeader title="Checker approval & attestation" subtitle="Required before the batch is loaded to the registry" icon={ShieldCheck} />
      <CardBody className="space-y-4">
        <MakerCheckerBanner maker={batch.uploadedByName} checker="MFI Data Approver (checker)" />
        {isOwn && <Alert tone="warning" title="You uploaded this batch">A maker cannot approve their own batch. A different user with the checker role must approve it.</Alert>}
        {!isOwn && !isChecker && <Alert tone="info">Waiting for a user with sign-off rights (Data Approver) to review and sign the attestation. Your role cannot approve batches.</Alert>}
        {!isOwn && isChecker && (
          <>
            <blockquote className="rounded-lg border-l-4 border-warm bg-amber-50/60 p-3 text-xs leading-relaxed text-slate-700">{ATTESTATION}</blockquote>
            <Checkbox checked={attest} onChange={(e) => setAttest(e.target.checked)} label="I have reviewed the validation report and reconciliation and make the attestation above" />
            <div className="grid gap-4 sm:grid-cols-2">
              <Input label="Signature — type your full name" value={signature} onChange={(e) => setSignature(e.target.value)} placeholder={user.name} error={signature && !sigOk ? 'Must match your registered name exactly' : undefined} />
              <Textarea label="Comment (optional)" rows={2} value={comment} onChange={(e) => setComment(e.target.value)} />
            </div>
            <div className="flex flex-wrap justify-end gap-2">
              <Button variant="outline" icon={Undo2} disabled={!comment.trim()} onClick={() => onReturn(comment.trim())} title="Add a comment to return the batch">Return to maker</Button>
              <Button variant="success" className={STRONG.success} icon={FileCheck2} disabled={!attest || !sigOk} onClick={() => onApprove({ signature: signature.trim(), comment: comment.trim() })}>Approve & sign</Button>
            </div>
          </>
        )}
      </CardBody>
    </Card>
  );
}

/** Submission receipt (journey end). */
export function ReceiptCard({ batch }) {
  const hash = `sha256:${[...batch.id].reduce((h, ch) => (h * 33 + ch.charCodeAt(0)) >>> 0, 5381).toString(16)}${batch.received.toString(16)}e4c1`;
  const text = [
    'CREDIT INFORMATION CENTRE — SUBMISSION RECEIPT',
    `Receipt no: ${batch.receiptNo}`, `Batch: ${batch.id}`, `Period: ${batch.period}`, `File: ${batch.fileName} (schema ${batch.schema})`,
    `Received: ${batch.received}  Accepted: ${batch.accepted}  Rejected: ${batch.rejected}  Warnings: ${batch.warnings}`,
    `Control outstanding: ${batch.control.outstanding} MMK — reconciled`, `Uploaded by: ${batch.uploadedByName} ${batch.uploadedAt}`,
    `Approved by: ${batch.approvedBy ?? '—'} ${batch.approvedAt ?? ''}`, `Loaded: ${batch.loadedAt}`, `File hash: ${hash}`,
  ].join('\n');
  return (
    <Card className="border-emerald-200">
      <CardHeader title={`Submission receipt ${batch.receiptNo}`} subtitle={`Loaded to registry ${batch.loadedAt}`} icon={FileCheck2} action={<PermButton feature="mfi.submissions" action="export" what="download submission receipts" size="sm" variant="outline" icon={Download} onClick={() => downloadFile(`${batch.receiptNo}.txt`, text, 'text/plain')}>Download receipt</PermButton>} />
      <CardBody className="grid gap-3 text-xs sm:grid-cols-3">
        <p><span className="block text-slate-500">Approved by</span><b>{batch.approvedBy ?? '—'}</b> {batch.approvedAt}</p>
        <p><span className="block text-slate-500">Records loaded</span><b>{formatNumber(batch.accepted)}</b> (identity-resolved, idempotent upsert)</p>
        <p className="break-all"><span className="block text-slate-500">File hash</span><span className="font-mono">{hash}</span></p>
      </CardBody>
    </Card>
  );
}
