import clsx from 'clsx';
import { AlertTriangle, CheckCircle2, Info, ShieldAlert } from 'lucide-react';

const STYLES = {
  info: ['bg-blue-50 border-blue-200 text-blue-900', Info],
  success: ['bg-emerald-50 border-emerald-200 text-emerald-900', CheckCircle2],
  warning: ['bg-amber-50 border-amber-200 text-amber-900', AlertTriangle],
  danger: ['bg-red-50 border-red-200 text-red-900', ShieldAlert],
};

export default function Alert({ tone = 'info', title, children, className, action }) {
  const [cls, Icon] = STYLES[tone];
  return (
    <div role={tone === 'danger' ? 'alert' : 'status'} className={clsx('flex gap-3 rounded-lg border p-3.5 text-sm', cls, className)}>
      <Icon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
      <div className="flex-1">
        {title && <p className="font-semibold">{title}</p>}
        {children && <div className={clsx(title && 'mt-0.5', 'text-[13px] opacity-90')}>{children}</div>}
      </div>
      {action}
    </div>
  );
}
