import { useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { BookOpen, Building2, HelpCircle, LayoutGrid, Megaphone, Search, SearchX } from 'lucide-react';
import { EmptyState } from '@/components/ui';
import { publicServices } from '@/data/services';
import { useStore } from '@/context/StoreContext';
import { useI18n } from '@/i18n/I18nContext';
import { formatDate } from '@/lib/format';
import PageHero, { PageBody } from '../../components/PageHero';

const match = (needle, ...fields) => fields.some((f) => (f ?? '').toString().toLowerCase().includes(needle));

/** Site-wide search. Announcements come only from announcementsFor('public'). */
export default function SearchPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const q = params.get('q') ?? '';
  const [draft, setDraft] = useState(q);
  const { announcementsFor, faqs, publications, institutions } = useStore();
  const { bi } = useI18n();

  const groups = useMemo(() => {
    const n = q.trim().toLowerCase();
    if (!n) return [];
    return [
      { id: 'services', label: 'Services', icon: LayoutGrid, items: publicServices().filter((s) => match(n, s.title.en, s.title.mm, s.summary, s.audience)).map((s) => ({ key: s.id, to: `/services/${s.slug}`, title: bi(s.title), text: s.summary })) },
      { id: 'announcements', label: 'Announcements', icon: Megaphone, items: announcementsFor('public').filter((a) => match(n, a.title.en, a.title.mm, a.body.en, a.category)).map((a) => ({ key: a.id, to: `/announcements/${a.id}`, title: bi(a.title), text: `${formatDate(a.publishedAt)} · ${a.category}` })) },
      { id: 'faq', label: 'FAQ', icon: HelpCircle, items: faqs.filter((f) => match(n, f.q.en, f.q.mm, f.a.en, f.a.mm)).map((f) => ({ key: f.id, to: `/help?faq=${f.id}`, title: bi(f.q), text: bi(f.a) })) },
      { id: 'publications', label: 'Publications', icon: BookOpen, items: publications.filter((p) => match(n, p.title, p.type)).map((p) => ({ key: p.id, to: `/publications?q=${encodeURIComponent(p.title)}`, title: p.title, text: `${p.type} · v${p.version} · effective ${formatDate(p.effective)}` })) },
      { id: 'mfis', label: 'MFI Directory', icon: Building2, items: institutions.filter((i) => i.publish === true && match(n, i.name, i.short, i.licenceNo, i.township, i.region)).map((i) => ({ key: i.id, to: `/mfi-directory/${i.id}`, title: i.name, text: `${i.licenceNo} · ${i.status} · ${i.township}, ${i.region}` })) },
    ].filter((g) => g.items.length);
  }, [q, announcementsFor, faqs, publications, institutions, bi]);

  const total = groups.reduce((n, g) => n + g.items.length, 0);

  return (
    <>
      <PageHero title="Search" breadcrumbs={[{ label: 'Search' }]}>
        <form role="search" onSubmit={(e) => { e.preventDefault(); navigate(`/search?q=${encodeURIComponent(draft.trim())}`); }} className="relative max-w-xl">
          <label htmlFor="search-page-input" className="sr-only">Search this website</label>
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" aria-hidden="true" />
          <input id="search-page-input" type="search" value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Search services, notices, FAQ, documents, MFIs…" className="h-12 w-full rounded-xl border-0 bg-white pl-11 pr-4 text-sm text-slate-800 shadow-lg" />
        </form>
      </PageHero>
      <PageBody>
        {q && <p role="status" className="mb-6 text-sm text-slate-600"><strong>{total}</strong> result{total === 1 ? '' : 's'} for “{q}”</p>}
        {!q && <EmptyState icon={Search} title="What are you looking for?" description="Try “dispute”, “consent form”, “Mandalay” or a licence number." />}
        {q && total === 0 && (
          <EmptyState icon={SearchX} title="No results" description="Check the spelling or try fewer words. You can also ask the CIC assistant or contact the helpdesk." action={<Link to="/help" className="text-sm font-semibold text-primary underline">Go to Help</Link>} />
        )}
        {groups.length > 0 && (
          <div className="grid gap-8 lg:grid-cols-[200px,1fr]">
            <nav aria-label="Result groups" className="hidden lg:block">
              <ul className="sticky top-16 space-y-1 text-sm">
                {groups.map((g) => <li key={g.id}><a href={`#results-${g.id}`} className="flex justify-between rounded-lg px-3 py-2 text-slate-600 hover:bg-white hover:text-primary">{g.label}<span className="text-slate-500">{g.items.length}</span></a></li>)}
              </ul>
            </nav>
            <div className="space-y-8">
              {groups.map((g) => (
                <section key={g.id} id={`results-${g.id}`} aria-labelledby={`results-${g.id}-h`} className="scroll-mt-16">
                  <h2 id={`results-${g.id}-h`} className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-slate-500"><g.icon className="h-4 w-4" aria-hidden="true" />{g.label} <span className="font-normal">({g.items.length})</span></h2>
                  <ul className="mt-3 divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white shadow-sm">
                    {g.items.map((it) => (
                      <li key={it.key}>
                        <Link to={it.to} className="block px-5 py-4 hover:bg-slate-50">
                          <p className="text-sm font-semibold text-primary">{it.title}</p>
                          <p className="mt-0.5 line-clamp-2 text-xs text-slate-600">{it.text}</p>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </section>
              ))}
            </div>
          </div>
        )}
      </PageBody>
    </>
  );
}
