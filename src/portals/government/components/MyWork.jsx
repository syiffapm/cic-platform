import { useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import clsx from 'clsx';
import { CheckCircle2, ChevronRight, KeyRound, ListChecks } from 'lucide-react';
import { Badge } from '@/components/ui';
import { featureById } from '@/data/rbac';
import { useGovAccess } from '../lib/access';
import { useWorkQueues } from '../lib/workQueues';
import { landingFeatureFor } from '../navigation';

/** Opens the "Your access" popover in the header. */
export const openAccessPopover = () => window.dispatchEvent(new Event('gov:open-access'));

/**
 * The signed-in user's work queue: counts per queue and the most urgent items, each linking
 * straight to the record. Only work the role can act on is listed.
 *   <MyWork title="Needs your action" limit={10} accessLink />   (operations dashboard)
 *   <MyWork compact />                                            (top of a role's landing page)
 */
export default function MyWork({ title = 'My work', limit = 4, compact = false, accessLink = false, className = 'mb-6' }) {
  const queues = useWorkQueues();
  const items = useMemo(() => queues
    .flatMap((q) => q.items.map((i) => ({ ...i, queue: q.label, queueId: q.id, primary: q.primary })))
    .sort((a, b) => Number(b.primary) - Number(a.primary) || (a.due?.rank ?? 3) - (b.due?.rank ?? 3))
    .slice(0, limit), [queues, limit]);
  const total = queues.reduce((s, q) => s + q.items.length, 0);
  const urgent = queues.reduce((s, q) => s + q.urgent, 0);

  return (
    <section aria-labelledby="my-work-title" className={clsx('rounded-xl border border-slate-200 bg-white shadow-sm', className)}>
      <div className="flex flex-wrap items-start justify-between gap-2 border-b border-slate-100 px-4 py-3 sm:px-5">
        <div className="min-w-0">
          <h2 id="my-work-title" className="flex items-center gap-2 text-sm font-semibold text-slate-900">
            <ListChecks className="h-4 w-4 text-primary" aria-hidden="true" /> {title}
            {total > 0 && <Badge tone={urgent ? 'red' : 'navy'}>{total}{urgent ? ` · ${urgent} urgent` : ''}</Badge>}
          </h2>
          <p className="mt-0.5 text-xs text-slate-500">
            {total ? 'Items your role can act on, most urgent first.' : 'Items your role can act on appear here.'}
          </p>
        </div>
        {accessLink && (
          <button type="button" onClick={openAccessPopover} className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-medium text-primary hover:bg-slate-50 hover:underline">
            <KeyRound className="h-3.5 w-3.5" aria-hidden="true" /> Your access
          </button>
        )}
      </div>

      {total === 0 ? (
        <p className="flex items-center gap-2 px-4 py-4 text-sm text-slate-600 sm:px-5">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-700" aria-hidden="true" />
          Nothing needs your action right now.
        </p>
      ) : (
        <>
          <ul className="flex flex-wrap gap-2 px-4 pt-3 sm:px-5" aria-label="Your queues">
            {queues.map((q) => (
              <li key={q.id}>
                <Link to={q.to} className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 px-3 py-1 text-xs font-medium text-slate-700 hover:border-primary-200 hover:bg-primary-50">
                  {q.label}
                  <span className="rounded-full bg-slate-100 px-1.5 font-semibold text-slate-800">{q.items.length}</span>
                  {q.urgent > 0 && <span className="text-red-700">{q.urgent} urgent</span>}
                </Link>
              </li>
            ))}
          </ul>
          <ul className={clsx('mt-2 divide-y divide-slate-100', !compact && 'lg:grid lg:grid-cols-2 lg:divide-y-0 lg:gap-x-4 lg:px-2')}>
            {items.map((i) => (
              <li key={`${i.queueId}-${i.key}`} className={clsx(!compact && 'lg:border-b lg:border-slate-100')}>
                <Link to={i.to} className="group flex items-start gap-3 px-4 py-2.5 hover:bg-slate-50 sm:px-5 lg:px-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">{i.queue}</p>
                    <p className="break-words text-sm font-medium text-slate-900 group-hover:text-primary">{i.title}</p>
                    <p className="break-words text-xs text-slate-500">{i.meta}</p>
                  </div>
                  {i.due && <Badge tone={i.due.tone} className="mt-0.5 shrink-0">{i.due.label}</Badge>}
                  <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-slate-500" aria-hidden="true" />
                </Link>
              </li>
            ))}
          </ul>
          {total > items.length && (
            <p className="border-t border-slate-100 px-4 py-2 text-xs text-slate-500 sm:px-5">
              Showing the {items.length} most urgent of {total}. Open a queue above for the rest.
            </p>
          )}
        </>
      )}
    </section>
  );
}

/** Compact "My work" panel, shown only on the signed-in role's own landing page. */
export function LandingWork({ feature }) {
  const { role, can } = useGovAccess();
  const { pathname } = useLocation();
  const path = featureById(feature)?.path;
  if (!path || pathname.replace(/\/$/, '') !== path || landingFeatureFor(role, can) !== feature) return null;
  return <MyWork compact />;
}
