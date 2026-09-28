import { Link } from 'react-router-dom';
import { formatDate } from '@/lib/format';
import NotFound from '@/pages/NotFound';
import PageHero, { PageBody } from '../../components/PageHero';
import { LEGAL_DOCS } from '../../data/legal';

const ORDER = [['privacy', '/privacy'], ['terms', '/terms'], ['accessibility', '/accessibility'], ['cookies', '/cookies']];

/** Legal notices driven by data/legal.js. */
export default function LegalPage({ doc }) {
  const d = LEGAL_DOCS[doc];
  if (!d) return <NotFound />;
  return (
    <>
      <PageHero title={d.title} subtitle={d.intro} breadcrumbs={[{ label: d.title }]} />
      <PageBody className="grid gap-8 lg:grid-cols-[220px,1fr]">
        <nav aria-label="Legal notices" className="order-2 lg:order-1">
          <ul className="space-y-1 text-sm lg:sticky lg:top-16">
            {ORDER.map(([key, to]) => (
              <li key={key}>
                <Link to={to} aria-current={key === doc ? 'page' : undefined} className={`block rounded-lg px-3 py-2 ${key === doc ? 'bg-primary-50 font-semibold text-primary' : 'text-slate-600 hover:bg-white hover:text-primary'}`}>{LEGAL_DOCS[key].title}</Link>
              </li>
            ))}
          </ul>
        </nav>
        <article className="order-1 rounded-xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8 lg:order-2">
          <p className="text-xs text-slate-500">Version {d.version} · effective {formatDate(d.effective)}</p>
          <div className="mt-6 space-y-8">
            {d.sections.map((s, i) => (
              <section key={s.heading} aria-labelledby={`legal-${i}`}>
                <h2 id={`legal-${i}`} className="text-base font-semibold text-slate-900">{i + 1}. {s.heading}</h2>
                <div className="mt-2 space-y-2">
                  {s.body.map((p) => <p key={p} className="text-sm leading-relaxed text-slate-700">{p}</p>)}
                </div>
              </section>
            ))}
          </div>
          <p className="mt-10 border-t border-slate-100 pt-4 text-xs text-slate-500">Questions? Contact the helpdesk at <a href="mailto:helpdesk@cic.cbm.gov.mm" className="text-primary underline">helpdesk@cic.cbm.gov.mm</a>.</p>
        </article>
      </PageBody>
    </>
  );
}
