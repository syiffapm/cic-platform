import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import clsx from 'clsx';
import { publicServices } from '@/data/services';
import { useI18n } from '@/i18n/I18nContext';
import PageHero, { PageBody } from '../../components/PageHero';
import ServiceIcon from '../../components/ServiceIcon';
import channelLabel from '../../lib/channelLabel';

const GROUPS = [
  { id: 'all', label: 'All services' },
  { id: 'borrower', label: 'My credit record', test: /borrower/i },
  { id: 'everyone', label: 'Check & learn', test: /public|anyone|researcher/i },
];

/** Service catalogue S1–S13. */
export default function ServicesPage() {
  const { bi, t } = useI18n();
  const [group, setGroup] = useState('all');
  const list = useMemo(() => {
    const g = GROUPS.find((x) => x.id === group);
    return g.test ? publicServices().filter((s) => g.test.test(s.audience)) : publicServices();
  }, [group]);

  return (
    <>
      <PageHero title={t('public.nav.services')} subtitle="Services you can use yourself — check your own credit record, correct mistakes, verify a lender or a report, and learn about borrowing safely." breadcrumbs={[{ label: t('public.nav.services') }]} />
      <PageBody>
        <div role="group" aria-label="Filter by audience" className="mb-6 flex flex-wrap gap-2">
          {GROUPS.map((g) => (
            <button
              key={g.id}
              type="button"
              aria-pressed={group === g.id}
              onClick={() => setGroup(g.id)}
              className={clsx('rounded-full px-3.5 py-1.5 text-xs font-medium ring-1 ring-inset transition',
                group === g.id ? 'bg-primary text-white ring-primary' : 'bg-white text-slate-600 ring-slate-200 hover:ring-primary-300')}
            >
              {g.label}
            </button>
          ))}
        </div>
        <ul className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {list.map((s) => (
            <li key={s.id}>
              <Link to={`/services/${s.slug}`} className="group flex h-full gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm hover:border-primary-200 hover:shadow-md">
                <span className="h-fit rounded-lg bg-primary-50 p-2.5 text-primary group-hover:bg-primary group-hover:text-white"><ServiceIcon name={s.icon} /></span>
                <div className="flex flex-1 flex-col">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">{s.audience}</p>
                  <h2 className="mt-1 text-sm font-semibold text-slate-900">{bi(s.title)}</h2>
                  <p className="mt-1 flex-1 text-xs leading-relaxed text-slate-600">{s.summary}</p>
                  <dl className="mt-3 grid grid-cols-2 gap-2 border-t border-slate-100 pt-3 text-[11px]">
                    <div><dt className="text-slate-500">Fee</dt><dd className="font-medium text-slate-700">{s.fee}</dd></div>
                    <div><dt className="text-slate-500">Where</dt><dd className="font-medium text-slate-700">{channelLabel(s.channel)}</dd></div>
                  </dl>
                  <span className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-primary">View details <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" /></span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
        <p className="mt-8 rounded-xl border border-slate-200 bg-white p-4 text-xs text-slate-500">
          Are you a licensed institution or CIC / Central Bank staff? Credit data reporting, credit inquiries and supervisory services are provided through the CIC Staff Workspace — use the address and account issued by your organisation.
        </p>
      </PageBody>
    </>
  );
}
