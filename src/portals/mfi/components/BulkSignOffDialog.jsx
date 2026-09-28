import { useState } from 'react';
import { FileCheck2 } from 'lucide-react';
import { Checkbox, Input, MakerCheckerBanner, Textarea } from '@/components/ui';
import { formatMMK, formatNumber } from '@/lib/format';
import ConfirmDialog from './ConfirmDialog';
import { ATTESTATION } from './BatchPanels';

/**
 * One attestation for several batches awaiting approval. The caller still approves each batch on its own
 * (own audit entry, maker ≠ checker checked per batch); this dialog only collects the signature once.
 */
export default function BulkSignOffDialog({ open, batches, user, onClose, onConfirm }) {
  const [attest, setAttest] = useState(false);
  const [signature, setSignature] = useState('');
  const [comment, setComment] = useState('');
  const sigOk = signature.trim().toLowerCase() === user.name.toLowerCase();
  const close = () => { setAttest(false); setSignature(''); setComment(''); onClose(); };
  const total = batches.reduce((s, b) => s + (b.received ?? 0), 0);

  return (
    <ConfirmDialog
      open={open}
      size="lg"
      onClose={close}
      title={`Sign off ${batches.length} batch${batches.length === 1 ? '' : 'es'}`}
      subtitle={`${formatNumber(total)} rows · each batch is approved and audited separately`}
      tone="success"
      confirmLabel={`Approve & sign ${batches.length}`}
      confirmIcon={FileCheck2}
      confirmDisabled={!attest || !sigOk || !batches.length}
      onConfirm={() => { onConfirm({ signature: signature.trim(), comment: comment.trim() }); close(); }}
      irreversible="Approved batches go straight to identity resolution and loading. To change a batch after sign-off, submit a corrected file for the same period."
    >
      <ul className="divide-y divide-slate-100 rounded-lg border border-slate-200 text-xs">
        {batches.map((b) => (
          <li key={b.id} className="flex flex-wrap items-start justify-between gap-x-3 gap-y-0.5 px-3 py-2">
            <span className="min-w-0">
              <span className="block break-all font-mono font-semibold text-slate-800">{b.id}</span>
              <span className="block text-slate-500">{b.fileName} · uploaded by {b.uploadedByName}</span>
            </span>
            <span className="text-right text-slate-600">{formatNumber(b.accepted)} accepted · {formatMMK(b.control.outstanding, { compact: true })}<span className="block font-medium text-emerald-700">Reconciled</span></span>
          </li>
        ))}
      </ul>
      <MakerCheckerBanner maker="Uploaders of the batches above" checker={`${user.name} (checker)`} note="You cannot sign off a batch you uploaded yourself — those are left out of the selection." />
      <blockquote className="rounded-lg border-l-4 border-warm bg-amber-50/60 p-3 text-xs leading-relaxed text-slate-700">{ATTESTATION}</blockquote>
      <Checkbox checked={attest} onChange={(e) => setAttest(e.target.checked)} label="I have reviewed the validation report and reconciliation of every batch listed and make the attestation above for each of them" />
      <div className="grid gap-4 sm:grid-cols-2">
        <Input label="Signature — type your full name" value={signature} onChange={(e) => setSignature(e.target.value)} placeholder={user.name} error={signature && !sigOk ? 'Must match your registered name exactly' : undefined} />
        <Textarea label="Comment (optional)" rows={2} value={comment} onChange={(e) => setComment(e.target.value)} />
      </div>
    </ConfirmDialog>
  );
}
