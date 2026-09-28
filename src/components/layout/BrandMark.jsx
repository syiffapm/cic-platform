import clsx from 'clsx';
import { ShieldCheck } from 'lucide-react';

export default function BrandMark({ light = false, subtitle, className }) {
  return (
    <div className={clsx('flex items-center gap-2.5', className)}>
      <div className={clsx('flex h-9 w-9 items-center justify-center rounded-lg', light ? 'bg-white/10 ring-1 ring-white/20' : 'bg-primary')}>
        <ShieldCheck className="h-5 w-5 text-warm" aria-hidden="true" />
      </div>
      <div className="leading-tight">
        <p className={clsx('text-sm font-bold tracking-tight', light ? 'text-white' : 'text-primary')}>CIC Myanmar</p>
        <p className={clsx('text-[11px] font-medium', light ? 'text-primary-200' : 'text-slate-500')}>{subtitle ?? 'Credit Information Center'}</p>
      </div>
    </div>
  );
}
