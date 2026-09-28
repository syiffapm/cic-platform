import { useEffect, useState } from 'react';
import { Button, Modal, Textarea, Badge, MakerCheckerBanner } from '@/components/ui';
import { roleName } from '@/data/roles';

/** Approve / reject a maker-checker request with a mandatory comment on rejection. */
export default function DecisionModal({ approval, decision, onClose, onConfirm }) {
  const [comment, setComment] = useState('');
  useEffect(() => setComment(''), [approval, decision]);
  if (!approval) return null;
  const rejecting = decision === 'reject';
  const invalid = rejecting && comment.trim().length < 5;
  return (
    <Modal
      open={!!approval}
      onClose={onClose}
      title={rejecting ? 'Reject request' : 'Approve request'}
      subtitle={`${approval.id} · ${approval.type}`}
      footer={(
        <>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button variant={rejecting ? 'danger' : 'success'} disabled={invalid} onClick={() => onConfirm(comment)}>
            {rejecting ? 'Reject' : 'Approve'}
          </Button>
        </>
      )}
    >
      <div className="space-y-4">
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm">
          <p className="font-medium text-slate-900">{approval.summary}</p>
          <p className="mt-1 text-xs text-slate-500">
            {approval.module} · maker <b>{approval.maker}</b> ({roleName(approval.makerRole)}) · {approval.createdAt}
          </p>
          {approval.payload?.diff && (
            <ul className="mt-2 space-y-1 text-xs">
              {approval.payload.diff.map((d) => (
                <li key={d.field}><Badge tone="slate">{d.field}</Badge> <span className="text-red-600 line-through">{String(d.from)}</span> → <span className="text-emerald-700">{String(d.to)}</span></li>
              ))}
            </ul>
          )}
        </div>
        <MakerCheckerBanner maker={approval.maker} checker={roleName(approval.checkerRole)} note="You are acting as checker. Your decision is final and written to the hash-chained audit log." />
        <Textarea label={rejecting ? 'Reason for rejection' : 'Comment (optional)'} required={rejecting} value={comment} onChange={(e) => setComment(e.target.value)} rows={3} error={rejecting && comment && invalid ? 'Please give a reason (min. 5 characters)' : undefined} />
      </div>
    </Modal>
  );
}
