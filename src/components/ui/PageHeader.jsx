import { ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';

/** `reqIds` is kept for traceability in code only — requirement IDs are never shown to users. */
// eslint-disable-next-line no-unused-vars
export default function PageHeader({ title, subtitle, breadcrumbs, actions, reqIds }) {
  return (
    <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div>
        {breadcrumbs && (
          <nav aria-label="Breadcrumb" className="mb-2 flex items-center gap-1 text-xs text-slate-500">
            {breadcrumbs.map((b, i) => (
              <span key={b.label} className="flex items-center gap-1">
                {i > 0 && <ChevronRight className="h-3 w-3" aria-hidden="true" />}
                {b.to ? <Link to={b.to} className="hover:text-primary">{b.label}</Link> : <span className="text-slate-700">{b.label}</span>}
              </span>
            ))}
          </nav>
        )}
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">{title}</h1>
        {subtitle && <p className="mt-1 max-w-3xl text-sm text-slate-500">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}
