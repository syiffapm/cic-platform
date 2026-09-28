import { AlertTriangle } from 'lucide-react';
import { Button, Modal } from '@/components/ui';
import { strong } from './buttonTones';

/**
 * One confirmation pattern for actions that cannot be undone (revoke a key, remove a user, withdraw a batch,
 * disburse a loan, sign off batches): what happens, what is kept, then Cancel / the named action.
 * `tone` is the confirm button variant; `confirmDisabled` holds it until required checks are ticked.
 */
export default function ConfirmDialog({
  open, onClose, title, subtitle, children, confirmLabel, confirmIcon, onConfirm, tone = 'danger', confirmDisabled = false,
  irreversible = 'This cannot be undone.', size = 'sm',
}) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      size={size}
      title={title}
      subtitle={subtitle}
      footer={(
        <>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button variant={tone} className={strong(tone)} icon={confirmIcon} disabled={confirmDisabled} onClick={onConfirm}>{confirmLabel}</Button>
        </>
      )}
    >
      <div className="space-y-4 text-sm text-slate-700">
        {children}
        {irreversible && (
          <p className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-900">
            <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            {irreversible}
          </p>
        )}
      </div>
    </Modal>
  );
}
