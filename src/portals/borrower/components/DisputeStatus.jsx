import clsx from 'clsx';
import { Clock } from 'lucide-react';
import { Badge, Stepper } from '@/components/ui';
import { formatDate, slaDaysLeft } from '@/lib/format';

export const DISPUTE_STEPS = ['Filed', 'MFI investigating', 'CIC review', 'Resolved'];

/** Maps a dispute status to the index of the current step in DISPUTE_STEPS. */
export function stepIndex(status) {
  switch (status) {
    case 'Awaiting MFI':
    case 'Investigating':
      return 1;
    case 'Pending CIC approval':
    case 'CIC review':
    case 'Escalated':
      return 2;
    case 'Resolved':
    case 'Rejected':
    case 'Closed':
      return 4;
    default:
      return 0;
  }
}

export function DisputeStepper({ status }) {
  return <Stepper steps={DISPUTE_STEPS} current={stepIndex(status)} />;
}

/** SLA countdown chip. Negative days = overdue. */
export function SlaCountdown({ dueAt, label = 'Resolution due', closed }) {
  if (closed) return <span className="text-xs text-slate-500">Closed</span>;
  const days = slaDaysLeft(dueAt);
  const tone = days < 0 ? 'text-red-700 bg-red-50' : days <= 3 ? 'text-amber-800 bg-amber-50' : 'text-teal-700 bg-teal-50';
  return (
    <span className={clsx('inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-medium', tone)}>
      <Clock className="h-3 w-3" aria-hidden="true" />
      {label} {formatDate(dueAt)} · {days < 0 ? `${Math.abs(days)} days overdue` : days === 0 ? 'due today' : `${days} days left`}
    </span>
  );
}

export function DisputeBadge({ status }) {
  if (status === 'Pending CIC approval') return <Badge tone="violet">CIC review</Badge>;
  return <Badge status={status} />;
}
