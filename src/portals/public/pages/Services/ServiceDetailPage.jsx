import { Link, useParams } from 'react-router-dom';
import { ArrowRight, Clock, FileText, Radio, Users, Wallet } from 'lucide-react';
import { Card, CardBody, CardHeader } from '@/components/ui';
import { getPublicService, publicServices } from '@/data/services';
import { useStore } from '@/context/StoreContext';
import { useI18n } from '@/i18n/I18nContext';
import NotFound from '@/pages/NotFound';
import PageHero, { PageBody } from '../../components/PageHero';
import ServiceIcon from '../../components/ServiceIcon';
import channelLabel from '../../lib/channelLabel';
import { SERVICE_LINKS } from '../../data/serviceLinks';

/** Service detail: description, eligibility, fee, SLA, channel, steps, documents, FAQ, CTA. */
export default function ServiceDetailPage() {
  const { slug } = useParams();
  const { bi, t } = useI18n();
  const { faqs } = useStore();
  const s = getPublicService(slug);
  if (!s) return <NotFound />;
  const links = SERVICE_LINKS[s.slug] ?? { cta: { label: 'Contact the helpdesk', to: '/help' }, faqs: [] };
  const related = faqs.filter((f) => links.faqs.includes(f.id));
  const others = publicServices().filter((x) => x.id !== s.id && x.audience === s.audience).slice(0, 3);
  const facts = [
    { icon: Users, label: 'Who it is for', value: s.audience },
    { icon: Wallet, label: 'Fee', value: s.fee },
    { icon: Clock, label: 'Service level', value: s.sla },
    { icon: Radio, label: 'Where', value: channelLabel(s.channel) },
  ];

  const cta = (
    <Link to={links.cta.to} className={`inline-flex h-11 items-center justify-center gap-2 rounded-lg px-5 text-sm font-semibold shadow-sm ${links.cta.warm ? 'bg-warm text-slate-900 hover:brightness-95' : 'bg-white text-primary hover:bg-primary-50'}`}>
      {links.cta.label} <ArrowRight className="h-4 w-4" aria-hidden="true" />
    </Link>
  );

  return (
    <>
      <PageHero title={bi(s.title)} subtitle={s.summary} breadcrumbs={[{ label: t('public.nav.services'), to: '/services' }, { label: bi(s.title) }]}>
        {cta}
      </PageHero>
      <PageBody className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <dl className="grid gap-3 sm:grid-cols-2">
            {facts.map((f) => (
              <div key={f.label} className="flex gap-3 rounded-xl border border-slate-200 bg-white p-4">
                <f.icon className="mt-0.5 h-5 w-5 shrink-0 text-teal-700" aria-hidden="true" />
                <div><dt className="text-[11px] text-slate-500">{f.label}</dt><dd className="text-sm font-medium text-slate-800">{f.value}</dd></div>
              </div>
            ))}
          </dl>
          <Card>
            <CardHeader title="Eligibility" />
            <CardBody><p className="text-sm text-slate-700">{s.eligibility}</p></CardBody>
          </Card>
          {s.steps.length > 0 && (
            <Card>
              <CardHeader title="How to use this service" subtitle={`${s.steps.length} steps`} />
              <CardBody>
                <ol className="space-y-4">
                  {s.steps.map((step, i) => (
                    <li key={step} className="flex gap-3">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-white">{i + 1}</span>
                      <p className="pt-1 text-sm text-slate-700">{step}</p>
                    </li>
                  ))}
                </ol>
              </CardBody>
            </Card>
          )}
          {related.length > 0 && (
            <Card>
              <CardHeader title="Related questions" />
              <CardBody className="divide-y divide-slate-100 py-0">
                {related.map((f) => (
                  <details key={f.id} className="group py-3">
                    <summary className="cursor-pointer list-none text-sm font-medium text-slate-800 marker:hidden">{bi(f.q)}</summary>
                    <p className="mt-2 text-sm text-slate-600">{bi(f.a)}</p>
                  </details>
                ))}
              </CardBody>
            </Card>
          )}
        </div>
        <aside className="space-y-6">
          <Card>
            <CardHeader title="Documents" icon={FileText} />
            <CardBody>
              {s.documents.length ? (
                <ul className="space-y-2">
                  {s.documents.map((d) => <li key={d}><Link to={`/publications?q=${encodeURIComponent(d)}`} className="text-sm text-primary hover:underline">{d}</Link></li>)}
                </ul>
              ) : <p className="text-sm text-slate-500">No documents needed.</p>}
            </CardBody>
          </Card>
          <div className="rounded-xl bg-primary p-5 text-white">
            <div className="flex items-center gap-2"><ServiceIcon name={s.icon} className="h-5 w-5 text-warm" /><p className="text-sm font-semibold">Ready to start?</p></div>
            <p className="mt-2 text-xs text-primary-100">This service is provided through: {channelLabel(s.channel)}.</p>
            <div className="mt-4">{cta}</div>
          </div>
          {others.length > 0 && (
            <div>
              <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500">Related services</h2>
              <ul className="mt-2 space-y-1">
                {others.map((o) => <li key={o.id}><Link to={`/services/${o.slug}`} className="text-sm text-primary hover:underline">{bi(o.title)}</Link></li>)}
              </ul>
            </div>
          )}
        </aside>
      </PageBody>
    </>
  );
}
