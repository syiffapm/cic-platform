import clsx from 'clsx';
import { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { BookOpen, Download, FileText, Search } from 'lucide-react';
import { Button, EmptyState, useToast } from '@/components/ui';
import { useStore } from '@/context/StoreContext';
import { useI18n } from '@/i18n/I18nContext';
import { formatDate } from '@/lib/format';
import PageHero, { PageBody } from '../../components/PageHero';

const TYPES = ['Regulation', 'Guideline', 'Form', 'Report'];
const TYPE_TONE = { Regulation: 'bg-primary-50 text-primary', Guideline: 'bg-teal-50 text-teal-700', Form: 'bg-amber-50 text-amber-800', Report: 'bg-violet-50 text-violet-700' };

/** Publications library: type filter, version, effective date, download. */
export default function PublicationsPage() {
  const { publications } = useStore();
  const { t } = useI18n();
  const toast = useToast();
  const [params, setParams] = useSearchParams();
  const type = params.get('type') ?? '';
  const q = params.get('q') ?? '';

  const setParam = (k, v) => {
    const next = new URLSearchParams(params);
    if (v) next.set(k, v); else next.delete(k);
    setParams(next, { replace: true });
  };

  const list = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const words = needle.split(/\s+/).filter((w) => w.length > 2);
    return publications
      .filter((p) => !type || p.type === type)
      .filter((p) => !words.length || words.some((w) => `${p.title} ${p.type}`.toLowerCase().includes(w)))
      .sort((a, b) => b.effective.localeCompare(a.effective));
  }, [publications, type, q]);

  const today = '2026-09-25';

  return (
    <>
      <PageHero title={t('public.nav.publications')} subtitle="Regulations, guidelines, forms and reports. Always check the version and effective date before you rely on a document." breadcrumbs={[{ label: t('public.nav.publications') }]} />
      <PageBody>
        <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div role="group" aria-label="Filter by type" className="flex flex-wrap gap-2">
            {['', ...TYPES].map((ty) => (
              <button
                key={ty || 'all'}
                type="button"
                aria-pressed={type === ty}
                onClick={() => setParam('type', ty)}
                className={clsx('rounded-full px-3.5 py-1.5 text-xs font-medium ring-1 ring-inset', type === ty ? 'bg-primary text-white ring-primary' : 'bg-white text-slate-600 ring-slate-200 hover:ring-primary-300')}
              >
                {ty ? `${ty}s` : 'All documents'}
              </button>
            ))}
          </div>
          <div className="relative md:w-72">
            <label htmlFor="pub-search" className="sr-only">Search publications</label>
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" aria-hidden="true" />
            <input id="pub-search" type="search" value={q} onChange={(e) => setParam('q', e.target.value)} placeholder="Search titles…" className="h-10 w-full rounded-lg border border-slate-300 bg-white pl-9 pr-3 text-sm" />
          </div>
        </div>

        {list.length === 0 ? (
          <EmptyState icon={BookOpen} title="No documents found" description="Try another type or search term." />
        ) : (
          <ul className="grid gap-4 md:grid-cols-2">
            {list.map((p) => {
              const upcoming = p.effective > today;
              return (
                <li key={p.id} className="flex gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className={clsx('flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-lg', TYPE_TONE[p.type])}>
                    <FileText className="h-5 w-5" aria-hidden="true" />
                    <span className="text-[9px] font-bold">{p.format}</span>
                  </div>
                  <div className="flex min-w-0 flex-1 flex-col">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">{p.type}</p>
                    <h2 className="mt-0.5 text-sm font-semibold leading-snug text-slate-900">{p.title}</h2>
                    <dl className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-slate-500">
                      <div className="flex gap-1"><dt>Version</dt><dd className="font-medium text-slate-700">{p.version}</dd></div>
                      <div className="flex gap-1"><dt>Effective</dt><dd className="font-medium text-slate-700">{formatDate(p.effective)}</dd></div>
                      <div className="flex gap-1"><dt className="sr-only">Size</dt><dd>{p.format} · {p.size}</dd></div>
                    </dl>
                    {upcoming && <p className="mt-2 w-fit rounded bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-800">Comes into effect on {formatDate(p.effective)}</p>}
                    <div className="mt-4">
                      <Button variant="outline" size="sm" icon={Download} onClick={() => toast(`Download started: ${p.title} (${p.format}, ${p.size})`, 'info')} aria-label={`Download ${p.title}`}>
                        Download
                      </Button>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </PageBody>
    </>
  );
}
