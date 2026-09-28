import { Link, useSearchParams } from 'react-router-dom';
import { Bot, Clock, Mail, MapPin, MessageSquareWarning, Phone, ShieldAlert } from 'lucide-react';
import { useI18n } from '@/i18n/I18nContext';
import PageHero, { PageBody, SectionHeading } from '../../components/PageHero';
import { HELPDESK } from '../../data/site';
import FaqList from './FaqList';

const ICONS = { hotline: Phone, email: Mail, mfi: Phone, office: MapPin };

/** Help centre: FAQ, assistant, helpdesk contacts, grievance entry. */
export default function HelpPage() {
  const { t } = useI18n();
  const [params] = useSearchParams();
  return (
    <>
      <PageHero title={t('public.nav.help')} subtitle="Answers to common questions, ways to reach us, and how to raise a complaint." breadcrumbs={[{ label: t('public.nav.help') }]} />
      <PageBody className="space-y-12">
        <section aria-labelledby="faq-title">
          <SectionHeading id="faq-title" title="Frequently asked questions" />
          <FaqList openId={params.get('faq')} />
        </section>

        <div className="grid gap-6 lg:grid-cols-2">
          <section id="assistant" aria-labelledby="assistant-title" className="scroll-mt-20 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <Bot className="h-7 w-7 text-primary" aria-hidden="true" />
            <h2 id="assistant-title" className="mt-3 text-lg font-bold text-slate-900">CIC assistant</h2>
            <p className="mt-1 text-sm text-slate-600">Tap <strong>“Ask CIC”</strong> at the bottom right of any page. The assistant answers from our public FAQ and service catalogue only. It cannot see anyone's credit record.</p>
            <p className="mt-4 flex items-start gap-2 rounded-lg bg-amber-50 p-3 text-xs text-amber-900">
              <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              Never type your NRC, phone number or loan details. If you do, the assistant removes them and does not store them.
            </p>
          </section>
          <section aria-labelledby="grv-title" className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <MessageSquareWarning className="h-7 w-7 text-warm" aria-hidden="true" />
            <h2 id="grv-title" className="mt-3 text-lg font-bold text-slate-900">Complaints and feedback</h2>
            <p className="mt-1 text-sm text-slate-600">Report unfair treatment by an MFI, an unlicensed lender, a problem with this website, or send a suggestion. You get a ticket number and a reply within 14 days.</p>
            <p className="mt-2 text-xs text-slate-500">To dispute an entry on your own credit report, use the Borrower portal instead — disputes are free.</p>
            <div className="mt-4 flex flex-wrap gap-3">
              <Link to="/help/grievance" className="inline-flex h-10 items-center rounded-lg bg-primary px-4 text-sm font-semibold text-white hover:bg-primary-700">Open the feedback form</Link>
              <Link to="/borrower/disputes/new" className="inline-flex h-10 items-center rounded-lg border border-slate-300 px-4 text-sm font-medium text-slate-700 hover:bg-slate-50">Dispute my report</Link>
            </div>
          </section>
        </div>

        <section id="contact" aria-labelledby="contact-title" className="scroll-mt-20">
          <SectionHeading id="contact-title" title="Contact the helpdesk" />
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {HELPDESK.map((h) => {
              const Icon = ICONS[h.id];
              return (
                <li key={h.id} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                  <Icon className="h-5 w-5 text-teal-700" aria-hidden="true" />
                  <p className="mt-2 text-xs text-slate-500">{h.label}</p>
                  {h.href ? <a href={h.href} className="mt-0.5 block break-words text-sm font-semibold text-primary hover:underline">{h.value}</a> : <p className="mt-0.5 text-sm font-medium text-slate-800">{h.value}</p>}
                  <p className="mt-2 flex items-center gap-1 text-[11px] text-slate-500"><Clock className="h-3 w-3" aria-hidden="true" />{h.hours}</p>
                </li>
              );
            })}
          </ul>
        </section>
      </PageBody>
    </>
  );
}
