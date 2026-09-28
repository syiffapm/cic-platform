import clsx from 'clsx';
import { Check, X } from 'lucide-react';
import { Badge } from '@/components/ui';

const TONES = { Submitted: 'blue', 'Credit check': 'violet', Approved: 'green', Rejected: 'red', Disbursed: 'teal', Withdrawn: 'slate' };

export const AppStatusBadge = ({ status }) => <Badge tone={TONES[status] ?? 'slate'}>{status}</Badge>;

/** Status of the one-time credit-check consent attached to an online application. */
export function consentStatus(app, today = new Date().toISOString().slice(0, 10)) {
  if (app.status === 'Withdrawn' && !app.inquiryId) return 'Cancelled';
  if (app.inquiryId || ['Credit check', 'Approved', 'Rejected', 'Disbursed'].includes(app.status)) return 'Used';
  if (app.consent?.expiresAt && app.consent.expiresAt < today) return 'Expired';
  return 'Active';
}

const STEPS = ['Submitted', 'Credit check', 'Decision', 'Disbursed'];

/** Index of the step now in progress (steps before it are done). */
const STEP_INDEX = { Submitted: 1, 'Credit check': 2, Approved: 3, Rejected: 2, Disbursed: 4, Withdrawn: 1 };

/** Horizontal tracker: Submitted → Credit check → Decision → Disbursed. */
export function AppTracker({ app }) {
  const idx = STEP_INDEX[app.status] ?? 1;
  const rejected = app.status === 'Rejected';
  const withdrawn = app.status === 'Withdrawn';
  return (
    <ol className="grid grid-cols-4 gap-1" aria-label="Application progress">
      {STEPS.map((s, i) => {
        const failed = (rejected || withdrawn) && i === idx;
        const done = i < idx;
        const current = i === idx && !failed;
        const label = i === 2 && rejected ? 'Declined' : i === 2 && app.status === 'Approved' ? 'Approved' : withdrawn && i === idx ? 'Withdrawn' : s;
        return (
          <li key={s} className="flex flex-col items-center text-center">
            <div className="flex w-full items-center">
              <span className={clsx('h-0.5 flex-1', i === 0 ? 'invisible' : i <= idx ? 'bg-teal' : 'bg-slate-200')} />
              <span className={clsx('flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold',
                failed ? 'bg-red-600 text-white' : done ? 'bg-teal text-white' : current ? 'bg-primary text-white ring-4 ring-primary-100' : 'bg-slate-200 text-slate-500')}>
                {failed ? <X className="h-4 w-4" aria-hidden="true" /> : done ? <Check className="h-4 w-4" aria-hidden="true" /> : i + 1}
              </span>
              <span className={clsx('h-0.5 flex-1', i === STEPS.length - 1 ? 'invisible' : i < idx ? 'bg-teal' : 'bg-slate-200')} />
            </div>
            <span className={clsx('mt-1.5 text-[11px] font-medium', failed ? 'text-red-700' : current ? 'text-slate-900' : 'text-slate-500')}>
              {label}<span className="sr-only">{failed ? ' — stopped here' : done ? ' — done' : current ? ' — current step' : ' — not yet'}</span>
            </span>
          </li>
        );
      })}
    </ol>
  );
}
