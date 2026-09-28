import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Calendar, Download, Paperclip } from 'lucide-react';
import { Badge, Button, useToast } from '@/components/ui';
import { useStore } from '@/context/StoreContext';
import { useI18n } from '@/i18n/I18nContext';
import { formatDate } from '@/lib/format';
import NotFound from '@/pages/NotFound';
import PageHero, { PageBody } from '../../components/PageHero';

/** Announcement detail. A non-public ID resolves to "not found" because the selector never returns it. */
export default function AnnouncementDetailPage() {
  const { id } = useParams();
  const { announcementsFor } = useStore();
  const { bi, t } = useI18n();
  const toast = useToast();
  const list = announcementsFor('public');
  const a = list.find((x) => x.id === id);
  if (!a) return <NotFound />;
  const more = list.filter((x) => x.id !== a.id).sort((x, y) => y.publishedAt.localeCompare(x.publishedAt)).slice(0, 3);

  return (
    <>
      <PageHero title={bi(a.title)} breadcrumbs={[{ label: t('public.nav.announcements'), to: '/announcements' }, { label: a.id }]}>
        <div className="flex flex-wrap items-center gap-3 text-xs text-primary-100">
          <Badge tone="amber">{a.category}</Badge>
          <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" aria-hidden="true" />Published <time dateTime={a.publishedAt}>{formatDate(a.publishedAt)}</time></span>
          <span className="font-mono">{a.id}</span>
        </div>
      </PageHero>
      <PageBody className="grid gap-8 lg:grid-cols-3">
        <article className="lg:col-span-2">
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <p className="whitespace-pre-line text-base leading-relaxed text-slate-700">{bi(a.body)}</p>
            {a.attachment && (
              <div className="mt-8 flex flex-col gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4 sm:flex-row sm:items-center">
                <Paperclip className="h-5 w-5 text-slate-500" aria-hidden="true" />
                <p className="flex-1 text-sm font-medium text-slate-800">{a.attachment}</p>
                <Button variant="outline" size="sm" icon={Download} onClick={() => toast(`Download started: ${a.attachment}`, 'info')}>Download</Button>
              </div>
            )}
            <p className="mt-8 border-t border-slate-100 pt-4 text-[11px] text-slate-500">Issued by the Credit Information Center, Central Bank of Myanmar.</p>
          </div>
          <Link to="/announcements" className="mt-6 inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"><ArrowLeft className="h-4 w-4" aria-hidden="true" /> All announcements</Link>
        </article>
        <aside>
          <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500">More announcements</h2>
          <ul className="mt-3 space-y-3">
            {more.map((m) => (
              <li key={m.id}>
                <Link to={`/announcements/${m.id}`} className="block rounded-lg border border-slate-200 bg-white p-4 hover:border-primary-200">
                  <p className="text-[11px] text-slate-500">{formatDate(m.publishedAt)} · {m.category}</p>
                  <p className="mt-1 text-sm font-medium text-slate-800">{bi(m.title)}</p>
                </Link>
              </li>
            ))}
          </ul>
        </aside>
      </PageBody>
    </>
  );
}
