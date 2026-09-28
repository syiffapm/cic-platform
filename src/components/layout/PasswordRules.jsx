import clsx from 'clsx';
import { Check, X } from 'lucide-react';
import { PASSWORD_RULES } from '@/lib/password';

export default function PasswordRules({ value }) {
  return (
    <ul className="grid gap-1 text-xs sm:grid-cols-2" aria-live="polite">
      {PASSWORD_RULES.map((r) => {
        const ok = r.test(value);
        return (
          <li key={r.id} className={clsx('flex items-center gap-1.5', ok ? 'text-emerald-700' : 'text-slate-500')}>
            {ok ? <Check className="h-3.5 w-3.5" aria-hidden="true" /> : <X className="h-3.5 w-3.5" aria-hidden="true" />}
            {r.label}<span className="sr-only">{ok ? ' — done' : ' — not yet'}</span>
          </li>
        );
      })}
    </ul>
  );
}
