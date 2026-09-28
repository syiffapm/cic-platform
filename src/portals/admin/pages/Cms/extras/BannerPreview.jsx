import clsx from 'clsx';
import { AlertTriangle, Info, ShieldAlert } from 'lucide-react';

export const SEVERITIES = ['Info', 'Warning', 'Critical'];

const STYLE = {
  Info: ['bg-blue-600 text-white', Info],
  Warning: ['bg-amber-400 text-slate-900', AlertTriangle],
  Critical: ['bg-red-700 text-white', ShieldAlert],
};

/** Site-wide emergency banner as it appears above the government header on every Public page. */
export default function BannerPreview({ on, severity, en, mm }) {
  const [cls, Icon] = STYLE[severity] ?? STYLE.Info;
  if (!on) return <p className="rounded-lg border border-dashed border-slate-300 px-3 py-4 text-center text-xs text-slate-500">Banner is off — nothing shows on the Public portal.</p>;
  return (
    <div className={clsx('flex items-start gap-2.5 rounded-lg px-3 py-2.5 text-xs', cls)} role="alert">
      <Icon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
      <div className="space-y-0.5">
        <p className="font-semibold">{en || 'English text missing'}</p>
        <p lang="my">{mm || 'Myanmar text missing'}</p>
      </div>
    </div>
  );
}
