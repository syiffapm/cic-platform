import ConfirmReasonModal from '../components/ConfirmReasonModal';

/** Asks for a justification before a role change is sent for approval. */
export default function ConfirmChangeModal({ confirmLabel = 'Submit for approval', danger = false, ...props }) {
  return <ConfirmReasonModal confirmLabel={confirmLabel} danger={danger} reasonLabel="Justification" hint="Recorded in the approval request and the audit log." {...props} />;
}
