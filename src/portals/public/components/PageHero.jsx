import { ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';

/** Lighter public-page header: navy band with breadcrumb, title and subtitle. */
export default function PageHero({ title, subtitle, breadcrumbs = [], children }) {
  return (
    <section className="relative overflow-hidden bg-primary text-white">
      <div className="gov-pattern absolute inset-0" aria-hidden="true" />
      <div className="relative mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
        <nav aria-label="Breadcrumb" className="mb-3 flex flex-wrap items-center gap-1 text-xs text-primary-200">
          <Link to="/" className="hover:text-white">Home</Link>
          {breadcrumbs.map((b) => (
            <span key={b.label} className="flex items-center gap-1">
              <ChevronRight className="h-3 w-3" aria-hidden="true" />
              {b.to ? <Link to={b.to} className="hover:text-white">{b.label}</Link> : <span aria-current="page" className="text-white">{b.label}</span>}
            </span>
          ))}
        </nav>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{title}</h1>
        {subtitle && <p className="mt-2 max-w-3xl text-sm text-primary-100 sm:text-base">{subtitle}</p>}
        {children && <div className="mt-5">{children}</div>}
      </div>
    </section>
  );
}

/** Standard page body container. */
export function PageBody({ children, className = '' }) {
  return <div className={`mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 ${className}`}>{children}</div>;
}

/** Section heading used on the landing page and elsewhere. */
export function SectionHeading({ eyebrow, title, subtitle, action, id }) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        {eyebrow && <p className="text-xs font-semibold uppercase tracking-wider text-teal-700">{eyebrow}</p>}
        <h2 id={id} className="mt-1 text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">{title}</h2>
        {subtitle && <p className="mt-1 max-w-2xl text-sm text-slate-600">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}
