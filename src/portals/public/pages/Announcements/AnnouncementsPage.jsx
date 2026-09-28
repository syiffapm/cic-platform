import clsx from 'clsx';
import { useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Calendar, Megaphone, Paperclip, Pin } from 'lucide-react';
import { Badge, EmptyState } from '@/components/ui';
import { useStore } from '@/context/StoreContext';
import { useI18n } from '@/i18n/I18nContext';
import { formatDate } from '@/lib/format';
import PageHero, { PageBody } from '../../components/PageHero';

/** Announcements. Notices come ONLY from announcementsFor('public') — classification is enforced there. */
export default function AnnouncementsPage() {
  const { announcementsFor } = useStore();
  const { bi, t } = useI18n();
  const [params, setParams] = useSearchParams();
  const category = params.get('category') ?? '';

  const all = useMemo(() => [...announcementsFor('public')].sort((a, b) => (Number(b.pinned) - Number(a.pinned)) || b.publishedAt.localeCompare(a.publishedAt)), [announcementsFor]);
  const categories = useMemo(() => [...new Set(all.map((a) => a.category))].sort(), [all]);
  const list = category ? all.filter((a) => a.category === category) : all;

  const chip = (value, label, count) => (
    <button
      key={label}
      type="button"
      aria-pressed={category === value}
      onClick={() => setParams(value ? { category: value } : {}, { replace: true })}
      className={clsx('flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-medium ring-1 ring-inset',
        category === value ? 'bg-primary text-white ring-primary' : 'bg-white text-slate-600 ring-slate-200 hover:ring-primary-300')}
    >
      {label}<span className={clsx('rounded-full px-1.5 text-[11px]', category === value ? 'bg-white/20' : 'bg-slate-100')}>{count}</span>
    </button>
  );

  return (
    <>
      <PageHero title={t('public.nav.announcements')} subtitle="Official notices from the Credit Information Center: regulations, service changes, statistics and maintenance." breadcrumbs={[{ label: t('public.nav.announcements') }]} />
      <PageBody>
        <div role="group" aria-label="Filter by category" className="mb-6 flex flex-wrap gap-2">
          {chip('', 'All', all.length)}
          {categories.map((c) => chip(c, c, all.filter((a) => a.category === c).length))}
        </div>
        {list.length === 0 ? (
          <EmptyState icon={Megaphone} title="No announcements in this category" description="New notices are published here as soon as they are approved." action={<button type="button" onClick={() => setParams({}, { replace: true })} className="inline-flex min-h-[24px] items-center text-sm font-semibold text-primary underline">Show all announcements</button>} />
        ) : (
          <ul className="space-y-3">
            {list.map((a) => (
              <li key={a.id}>
                <Link to={`/announcements/${a.id}`} className="group flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-5 shadow-sm hover:border-primary-200 hover:shadow-md sm:flex-row sm:items-start">
                  <div className="flex shrink-0 items-center gap-2 text-xs text-slate-500 sm:w-32 sm:flex-col sm:items-start">
                    <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" aria-hidden="true" /><time dateTime={a.publishedAt}>{formatDate(a.publishedAt)}</time></span>
                    <Badge tone="navy">{a.category}</Badge>
                  </div>
                  <div className="flex-1">
                    <h2 className="flex items-start gap-2 text-sm font-semibold text-slate-900 group-hover:text-primary sm:text-base">
                      {a.pinned && <Pin className="mt-1 h-3.5 w-3.5 shrink-0 text-warm" aria-label="Pinned" />}
                      {bi(a.title)}
                    </h2>
                    <p className="mt-1 line-clamp-2 text-sm text-slate-600">{bi(a.body)}</p>
                    {a.attachment && (
                      <span className="mt-3 inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-600">
                        <Paperclip className="h-3 w-3" aria-hidden="true" />{a.attachment}
                      </span>
                    )}
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </PageBody>
    </>
  );
}
