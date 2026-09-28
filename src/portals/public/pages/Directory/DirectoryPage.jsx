import clsx from 'clsx';
import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Building2, LayoutGrid, List, MapPin, Search } from 'lucide-react';
import { EmptyState, Select } from '@/components/ui';
import { useStore } from '@/context/StoreContext';
import { useI18n } from '@/i18n/I18nContext';
import { formatNumber } from '@/lib/format';
import PageHero, { PageBody } from '../../components/PageHero';
import LicenceBadge from '../../components/LicenceBadge';
import { readLocal, writeLocal } from '../../lib/storage';

const STATUSES = ['Licensed', 'Under Review', 'Suspended', 'Revoked'];

/** MFI Directory: only Institution Master records with publish === true. */
export default function DirectoryPage() {
  const { institutions } = useStore();
  const { t } = useI18n();
  const [params, setParams] = useSearchParams();
  const [view, setView] = useState(() => readLocal('cic.public.dirView', 'cards'));
  const q = params.get('q') ?? '';
  const region = params.get('region') ?? '';
  const status = params.get('status') ?? '';
  const type = params.get('type') ?? '';

  const published = useMemo(() => institutions.filter((i) => i.publish === true), [institutions]);
  const regions = useMemo(() => [...new Set(published.map((i) => i.region))].sort(), [published]);
  const types = useMemo(() => [...new Set(published.map((i) => i.type))].sort(), [published]);

  const setParam = (key, value) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value); else next.delete(key);
    setParams(next, { replace: true });
  };
  const changeView = (v) => { setView(v); writeLocal('cic.public.dirView', v); };

  const list = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return published.filter((i) => (
      (!needle || [i.name, i.short, i.licenceNo, i.township, i.region].some((f) => f.toLowerCase().includes(needle)))
      && (!region || i.region === region)
      && (!status || i.status === status)
      && (!type || i.type === type)
    )).sort((a, b) => a.name.localeCompare(b.name));
  }, [published, q, region, status, type]);

  return (
    <>
      <PageHero title={t('public.nav.directory')} subtitle="Check that a lender is licensed before you borrow. Only institutions shown as “Licensed” may offer microfinance loans." breadcrumbs={[{ label: t('public.nav.directory') }]}>
        <form role="search" onSubmit={(e) => e.preventDefault()} className="relative max-w-xl">
          <label htmlFor="dir-search" className="sr-only">Search by name, licence number or township</label>
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" aria-hidden="true" />
          <input
            id="dir-search"
            type="search"
            value={q}
            onChange={(e) => setParam('q', e.target.value)}
            placeholder="Name, licence no. (e.g. MFI-0014/2013) or township"
            className="h-12 w-full rounded-xl border-0 bg-white pl-11 pr-4 text-sm text-slate-800 shadow-lg placeholder:text-slate-400"
          />
        </form>
      </PageHero>
      <PageBody>
        <div className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm md:flex-row md:items-end">
          <div className="grid flex-1 gap-3 sm:grid-cols-3">
            <Select label="Region / State" value={region} onChange={(e) => setParam('region', e.target.value)} placeholder="All regions" options={regions} />
            <Select label="Licence status" value={status} onChange={(e) => setParam('status', e.target.value)} placeholder="All statuses" options={STATUSES} />
            <Select label="Institution type" value={type} onChange={(e) => setParam('type', e.target.value)} placeholder="All types" options={types} />
          </div>
          <div role="group" aria-label="View as" className="inline-flex h-10 shrink-0 rounded-lg bg-slate-100 p-0.5">
            {[['cards', LayoutGrid, 'Cards'], ['table', List, 'Table']].map(([id, Icon, label]) => (
              <button key={id} type="button" aria-pressed={view === id} onClick={() => changeView(id)} className={clsx('flex items-center gap-1.5 rounded-md px-3 text-xs font-medium', view === id ? 'bg-white text-primary shadow-sm' : 'text-slate-700 hover:text-primary')}>
                <Icon className="h-4 w-4" aria-hidden="true" />{label}
              </button>
            ))}
          </div>
        </div>

        <p className="mt-5 text-sm text-slate-600" role="status" aria-live="polite">
          Showing <strong>{list.length}</strong> of {published.length} institutions
          {(q || region || status || type) && <button type="button" onClick={() => setParams({}, { replace: true })} className="ml-2 text-xs font-medium text-primary underline">Clear filters</button>}
        </p>

        {list.length === 0 && <EmptyState icon={Building2} title="No institution matches your search" description="Check the spelling or licence number. If a lender is not listed, it is not licensed — report it through the feedback form." action={<Link to="/help/grievance" className="text-sm font-semibold text-primary underline">Report an unlicensed lender</Link>} />}

        {list.length > 0 && view === 'cards' && (
          <ul className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {list.map((i) => (
              <li key={i.id}>
                <Link to={`/mfi-directory/${i.id}`} className={clsx('flex h-full flex-col rounded-xl border bg-white p-5 shadow-sm hover:shadow-md', ['Suspended', 'Revoked'].includes(i.status) ? 'border-red-200' : 'border-slate-200 hover:border-primary-200')}>
                  <div className="flex items-start justify-between gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary-50 text-xs font-bold text-primary">{i.short.slice(0, 4)}</span>
                    <LicenceBadge status={i.status} />
                  </div>
                  <h2 className="mt-3 text-sm font-semibold text-slate-900">{i.name}</h2>
                  <p className="mt-0.5 font-mono text-[11px] text-slate-500">{i.licenceNo}</p>
                  <p className="mt-3 flex items-center gap-1.5 text-xs text-slate-600"><MapPin className="h-3.5 w-3.5 text-slate-500" aria-hidden="true" />{i.township}, {i.region}</p>
                  <div className="mt-auto pt-3">
                    <p className="flex justify-between border-t border-slate-100 pt-3 text-[11px] text-slate-500"><span>{i.type}</span><span>{formatNumber(i.branches)} branches</span></p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}

        {list.length > 0 && view === 'table' && (
          <div className="mt-4 overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
            <table className="w-full text-left text-sm">
              <caption className="sr-only">Licensed microfinance institutions</caption>
              <thead className="bg-slate-50 text-xs font-semibold text-slate-600">
                <tr>{['Institution', 'Licence no.', 'Type', 'Township / Region', 'Branches', 'Status'].map((h) => <th key={h} scope="col" className="whitespace-nowrap px-4 py-3">{h}</th>)}</tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {list.map((i) => (
                  <tr key={i.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3"><Link to={`/mfi-directory/${i.id}`} className="font-medium text-primary hover:underline">{i.name}</Link></td>
                    <td className="whitespace-nowrap px-4 py-3 font-mono text-xs text-slate-600">{i.licenceNo}</td>
                    <td className="px-4 py-3 text-slate-600">{i.type}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-slate-600">{i.township}, {i.region}</td>
                    <td className="px-4 py-3 text-slate-600">{formatNumber(i.branches)}</td>
                    <td className="px-4 py-3"><LicenceBadge status={i.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </PageBody>
    </>
  );
}
