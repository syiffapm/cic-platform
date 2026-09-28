import clsx from 'clsx';
import { Inbox } from 'lucide-react';

export default function EmptyState({ icon: Icon = Inbox, title, description, action, compact }) {
  return (
    <div className={clsx('flex flex-col items-center justify-center text-center', compact ? 'py-10' : 'py-16')}>
      <div className="rounded-full bg-slate-100 p-3 text-slate-500"><Icon className="h-6 w-6" aria-hidden="true" /></div>
      <p className="mt-3 text-sm font-semibold text-slate-700">{title}</p>
      {description && <p className="mt-1 max-w-sm text-xs text-slate-500">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
