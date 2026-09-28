import { AlertTriangle } from 'lucide-react';
import { Button, Modal } from '@/components/ui';

/**
 * One confirmation pattern for every irreversible citizen action (withdraw an application, revoke a
 * consent or a representative, close the account): what will happen, what cannot be undone, and a
 * safe default ("Keep …") next to the red confirm button.
 */
export default function ConfirmDialog({ open, onClose, onConfirm, title, subtitle, children, consequence, confirmLabel, cancelLabel = 'Cancel', icon, confirmDisabled = false }) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      subtitle={subtitle}
      size="sm"
      footer={(
        <div className="flex w-full flex-col-reverse gap-2 sm:w-auto sm:flex-row">
          <Button variant="outline" onClick={onClose}>{cancelLabel}</Button>
          <Button variant="danger" icon={icon} onClick={onConfirm} disabled={confirmDisabled}>{confirmLabel}</Button>
        </div>
      )}
    >
      <div className="space-y-3 text-sm text-slate-700">
        {children}
        {consequence && (
          <p className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            <span>{consequence}</span>
          </p>
        )}
      </div>
    </Modal>
  );
}
