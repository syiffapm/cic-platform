import clsx from 'clsx';
import { Link } from 'react-router-dom';
import { HelpCircle, ShieldCheck } from 'lucide-react';

const LINK_VARIANTS = {
  primary: 'bg-primary text-primary-foreground hover:bg-primary-700 shadow-sm',
  outline: 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-50',
  warm: 'bg-warm text-slate-900 hover:brightness-95 shadow-sm',
  ghost: 'text-slate-600 hover:bg-slate-100',
};
const LINK_SIZES = { sm: 'h-8 px-3 text-xs gap-1.5', md: 'h-10 px-4 text-sm gap-2', lg: 'h-12 px-6 text-base gap-2' };

/** A router link styled like the UI-kit Button (avoids nesting <button> inside <a>). */
export function ButtonLink({ to, variant = 'primary', size = 'md', icon: Icon, className, children, ...props }) {
  return (
    <Link to={to} className={clsx('inline-flex items-center justify-center rounded-lg font-medium transition-colors', LINK_VARIANTS[variant], LINK_SIZES[size], className)} {...props}>
      {Icon && <Icon className={size === 'sm' ? 'h-3.5 w-3.5' : 'h-4 w-4'} aria-hidden="true" />}
      {children}
    </Link>
  );
}

/** Small "what does this mean?" disclosure next to a field. Uses <details> so it works without JS and with screen readers. */
export function Explain({ children, label = 'What does this mean?' }) {
  return (
    <details className="group mt-1 text-xs text-slate-600">
      <summary className="inline-flex cursor-pointer list-none items-center gap-1 font-medium text-primary-600 hover:text-primary">
        <HelpCircle className="h-3.5 w-3.5" aria-hidden="true" /> {label}
      </summary>
      <p className="mt-1 rounded-lg bg-primary-50 p-2.5 leading-relaxed text-slate-700">{children}</p>
    </details>
  );
}

/** Label + value pair with an optional plain-language explanation. */
export function Fact({ label, value, help, className }) {
  return (
    <div className={className}>
      <dt className="text-[11px] font-medium uppercase tracking-wide text-slate-500">{label}</dt>
      <dd className="mt-0.5 text-sm font-semibold text-slate-900">
        {value}
        {help && <div className="font-normal"><Explain>{help}</Explain></div>}
      </dd>
    </div>
  );
}

/** Control footnote shown on every borrower page: own data only + audited. */
export function AuditFootnote({ action = 'Viewing this page' }) {
  return (
    <p className="mt-8 flex items-start gap-2 border-t border-slate-200 pt-4 text-[11px] leading-relaxed text-slate-500">
      <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-teal-700" aria-hidden="true" />
      <span>
        You can only see records linked to your own verified identity. {action} is written to CIC&apos;s tamper-evident audit log
        with you as the actor. Views of your own report are free and never billed to anyone.
      </span>
    </p>
  );
}

/**
 * Primary action bar for long forms. On phones it sticks to the bottom of the screen so the next step
 * is always in reach; from `sm` up it sits in the normal flow. Place it as the last child of a CardBody.
 */
export function StickyActions({ children, className, row = false }) {
  return (
    <div
      className={clsx(
        'sticky bottom-0 z-20 -mx-5 -mb-5 flex gap-2 border-t border-slate-200 bg-white/95 px-5 py-3 shadow-[0_-6px_16px_-10px_rgba(15,23,42,0.35)] backdrop-blur',
        'sm:static sm:z-auto sm:mx-0 sm:mb-0 sm:flex-row sm:border-0 sm:bg-transparent sm:p-0 sm:shadow-none sm:backdrop-blur-none',
        row ? 'flex-row [&>*]:flex-1 sm:[&>*]:flex-none' : 'flex-col-reverse',
        className,
      )}
    >
      {children}
    </div>
  );
}
