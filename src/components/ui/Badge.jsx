import clsx from 'clsx';

const TONES = {
  slate: 'bg-slate-100 text-slate-700 ring-slate-200',
  blue: 'bg-blue-50 text-blue-700 ring-blue-200',
  navy: 'bg-primary-50 text-primary-800 ring-primary-200',
  green: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  amber: 'bg-amber-50 text-amber-800 ring-amber-200',
  red: 'bg-red-50 text-red-700 ring-red-200',
  teal: 'bg-teal-50 text-teal-700 ring-teal-200',
  violet: 'bg-violet-50 text-violet-700 ring-violet-200',
};

/** Maps common workflow statuses to a tone so every portal colours them the same way. */
const STATUS_TONES = {
  active: 'green', licensed: 'green', approved: 'green', published: 'green', passed: 'green', resolved: 'green',
  closed: 'slate', valid: 'green', success: 'green', paid: 'green', verified: 'green', accepted: 'green', loaded: 'green',
  pending: 'amber', 'in review': 'amber', review: 'amber', scheduled: 'blue', draft: 'slate', open: 'blue',
  investigating: 'violet', 'awaiting mfi': 'amber', escalated: 'red', warning: 'amber', overdue: 'red',
  suspended: 'red', revoked: 'red', rejected: 'red', failed: 'red', critical: 'red', high: 'red',
  medium: 'amber', low: 'blue', archived: 'slate', expired: 'slate', 'not found': 'slate', unpaid: 'amber',
  processing: 'blue', validating: 'blue', 'awaiting approval': 'amber', dormant: 'slate', locked: 'red',
};

export default function Badge({ tone, status, className, children }) {
  const key = (status ?? (typeof children === 'string' ? children : '')).toString().toLowerCase();
  const resolved = tone ?? STATUS_TONES[key] ?? 'slate';
  return (
    <span className={clsx('inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-medium ring-1 ring-inset', TONES[resolved], className)}>
      {children ?? status}
    </span>
  );
}
