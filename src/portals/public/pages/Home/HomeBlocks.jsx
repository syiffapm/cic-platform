import { Link } from 'react-router-dom';
import { ArrowRight, Building2, FileText, MapPin, Paperclip, Users } from 'lucide-react';
import { Badge } from '@/components/ui';
import { publicServices } from '@/data/services';
import { AS_OF, kpi } from '@/data/kpis';
import { useStore } from '@/context/StoreContext';
import { useI18n } from '@/i18n/I18nContext';
import { formatDate, formatNumber } from '@/lib/format';
import ServiceIcon from '../../components/ServiceIcon';
import { SectionHeading } from '../../components/PageHero';
import { TOWNSHIPS_COVERED } from '../../data/site';

/** Block 3 — service catalogue cards (from the Admin A3 catalogue). */
export function ServiceCatalogue() {
  const { bi } = useI18n();
  const services = publicServices().slice(0, 8);
  return (
    <section aria-labelledby="svc-title" className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
      <SectionHeading
        id="svc-title"
        eyebrow="What we do"
        title="Our services"
        subtitle="Check your own credit record, fix mistakes, verify a lender or a report, and learn to borrow safely."
      />
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {services.map((s) => (
          <li key={s.id}>
            <Link to={`/services/${s.slug}`} className="group flex h-full flex-col rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-primary-200 hover:shadow-md">
              <div className="flex items-center justify-between">
                <span className="rounded-lg bg-primary-50 p-2.5 text-primary group-hover:bg-primary group-hover:text-white"><ServiceIcon name={s.icon} /></span>
                <span className="text-[11px] font-medium text-slate-500">{s.audience}</span>
              </div>
              <h3 className="mt-4 text-sm font-semibold text-slate-900">{bi(s.title)}</h3>
              <p className="mt-1.5 flex-1 text-xs leading-relaxed text-slate-600">{s.summary}</p>
              <p className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-[11px]">
                <span className="font-medium text-teal-700">{s.fee}</span>
                <ArrowRight className="h-4 w-4 text-slate-300 group-hover:text-primary" aria-hidden="true" />
              </p>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

/** Block 4 — key statistics with "as of" date. */
export function KeyStats() {
  const { institutions } = useStore();
  const reporting = institutions.filter((i) => i.publish && ['Licensed', 'Under Review'].includes(i.status)).length;
  const stats = [
    { label: 'Reporting MFIs', value: formatNumber(reporting), icon: Building2, def: 'Licensed institutions submitting to CIC' },
    { label: 'Borrowers covered', value: formatNumber(kpi('borrowers').value), icon: Users, def: kpi('borrowers').definition },
    { label: 'Townships reached', value: formatNumber(TOWNSHIPS_COVERED), icon: MapPin, def: 'Townships with at least one reported active loan' },
    { label: 'Reports issued (month)', value: formatNumber(kpi('inquiries').value), icon: FileText, def: 'Credit reports issued to MFIs in the month' },
  ];
  return (
    <section aria-labelledby="stats-title" className="border-y border-slate-200 bg-white">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <h2 id="stats-title" className="text-xl font-bold tracking-tight text-slate-900">The registry at a glance</h2>
          <p className="text-xs text-slate-500">{`As of ${AS_OF}`} · <Link to="/statistics" className="font-medium text-primary hover:underline">See all statistics</Link></p>
        </div>
        <dl className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {stats.map((s) => (
            <div key={s.label} className="rounded-xl border border-slate-200 bg-slate-50/60 p-5">
              <dt className="flex items-center gap-2 text-xs font-medium text-slate-600"><s.icon className="h-4 w-4 text-teal-700" aria-hidden="true" />{s.label}</dt>
              <dd className="mt-2 text-2xl font-bold tracking-tight text-primary sm:text-3xl">{s.value}</dd>
              <dd className="mt-1 text-[11px] leading-snug text-slate-500">{s.def}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}

/** Block 5 — 3 newest public notices, read only via announcementsFor('public'). */
export function LatestAnnouncements() {
  const { announcementsFor } = useStore();
  const { bi } = useI18n();
  const latest = [...announcementsFor('public')].sort((a, b) => b.publishedAt.localeCompare(a.publishedAt)).slice(0, 3);
  return (
    <section aria-labelledby="ann-title" className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
      <SectionHeading
        id="ann-title"
        eyebrow="Latest"
        title="Announcements"
        action={<Link to="/announcements" className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline">All announcements <ArrowRight className="h-4 w-4" aria-hidden="true" /></Link>}
      />
      <ul className="grid gap-4 md:grid-cols-3">
        {latest.map((a) => (
          <li key={a.id}>
            <Link to={`/announcements/${a.id}`} className="flex h-full flex-col rounded-xl border border-slate-200 bg-white p-5 shadow-sm hover:border-primary-200 hover:shadow-md">
              <div className="flex items-center gap-2">
                <Badge tone="navy">{a.category}</Badge>
                <time dateTime={a.publishedAt} className="text-[11px] text-slate-500">{formatDate(a.publishedAt)}</time>
              </div>
              <h3 className="mt-3 text-sm font-semibold leading-snug text-slate-900">{bi(a.title)}</h3>
              <p className="mt-2 line-clamp-3 flex-1 text-xs leading-relaxed text-slate-600">{bi(a.body)}</p>
              {a.attachment && <p className="mt-3 flex items-center gap-1 text-[11px] text-slate-500"><Paperclip className="h-3 w-3" aria-hidden="true" />{a.attachment}</p>}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
