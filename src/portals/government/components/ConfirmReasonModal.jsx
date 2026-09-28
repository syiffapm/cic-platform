import { useEffect, useState } from 'react';
import { Button, MakerCheckerBanner, Modal, Textarea } from '@/components/ui';

/**
 * Confirmation for destructive or irreversible actions (reject, disable, delete, archive,
 * dismiss, break-glass …). The reason is required and is passed to onConfirm(reason).
 */
export default function ConfirmReasonModal({
  open, title, subtitle, body, confirmLabel = 'Confirm', danger = true, reasonLabel = 'Reason', minLength = 10,
  hint = 'Recorded in the audit log.', maker, checker, onCancel, onConfirm,
}) {
  const [reason, setReason] = useState('');
  useEffect(() => { if (open) setReason(''); }, [open]);
  const ok = reason.trim().length >= minLength;
  return (
    <Modal
      open={open}
      onClose={onCancel}
      size="sm"
      title={title}
      subtitle={subtitle}
      footer={<><Button variant="ghost" onClick={onCancel}>Cancel</Button><Button variant={danger ? 'danger' : 'primary'} disabled={!ok} onClick={() => onConfirm(reason.trim())}>{confirmLabel}</Button></>}
    >
      <div className="space-y-4 text-sm text-slate-700">
        {body}
        <Textarea label={reasonLabel} required rows={3} value={reason} onChange={(e) => setReason(e.target.value)}
          hint={`${hint} At least ${minLength} characters.`} />
        {checker && <MakerCheckerBanner maker={maker} checker={checker} />}
      </div>
    </Modal>
  );
}
