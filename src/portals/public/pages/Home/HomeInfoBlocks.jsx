import { Link } from 'react-router-dom';
import { ArrowRight, BookOpen, Bot, FileSearch, HelpCircle, MessageSquareWarning, Phone, Scale, ShieldCheck, Upload, UserCheck } from 'lucide-react';
import { useStore } from '@/context/StoreContext';
import { formatDate } from '@/lib/format';
import { SectionHeading } from '../../components/PageHero';
import { HOW_IT_WORKS, RIGHTS } from '../../data/site';

const STEP_ICONS = { Upload, ShieldCheck, FileSearch, UserCheck };

/** Block 6 — how the credit reporting system works, in 4 steps. */
export function HowItWorks() {
  return (
    <section aria-labelledby="how-title" className="bg-white">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <SectionHeading
          id="how-title"
          eyebrow="How it works"
          title="From loan to fair credit record"
          subtitle="Your data flows through four controlled steps. Every access is logged."
          action={<Link to="/how-it-works" className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline">Step-by-step guides for citizens <ArrowRight className="h-4 w-4" aria-hidden="true" /></Link>}
        />
        <ol className="grid gap-6 md:grid-cols-4">
          {HOW_IT_WORKS.map((s, i) => {
            const Icon = STEP_ICONS[s.icon];
            return (
              <li key={s.title} className="relative">
                {i < HOW_IT_WORKS.length - 1 && <span className="absolute left-12 right-0 top-6 hidden h-px bg-gradient-to-r from-primary-200 to-transparent md:block" aria-hidden="true" />}
                <div className="relative flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-white shadow-sm">
                  <Icon className="h-5 w-5" aria-hidden="true" />
                  <span className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-warm text-[11px] font-bold text-slate-900">{i + 1}</span>
                </div>
                <h3 className="mt-4 text-sm font-semibold text-slate-900">{s.title}</h3>
                <p className="mt-1 text-xs leading-relaxed text-slate-600">{s.text}</p>
              </li>
            );
          })}
        </ol>
        <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[['Get access to my report', '/how-it-works#access'], ['Check my credit score', '/how-it-works#score'], ['Apply for a loan online', '/how-it-works#apply'], ['Fix a mistake', '/how-it-works#dispute']].map(([label, to]) => (
            <Link key={to} to={to} className="flex items-center justify-between rounded-lg border border-slate-200 px-4 py-3 text-sm font-medium text-slate-700 hover:border-primary-300 hover:text-primary">
              {label} <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

/** Block 7 — borrower rights, dispute timeline, privacy notice. */
export function KnowYourRights() {
  return (
    <section aria-labelledby="rights-title" className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
      <div className="grid gap-8 rounded-2xl bg-teal-50 p-6 ring-1 ring-teal-100 sm:p-10 lg:grid-cols-5">
        <div className="lg:col-span-2">
          <Scale className="h-8 w-8 text-teal-700" aria-hidden="true" />
          <h2 id="rights-title" className="mt-3 text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">Know your rights</h2>
          <p className="mt-2 text-sm text-slate-700">Your credit record belongs to you. The law gives you clear rights, and CIC must respect them.</p>
          <div className="mt-6 rounded-xl bg-white p-4 text-xs shadow-sm">
            <p className="font-semibold text-slate-800">Dispute timeline</p>
            <ol className="mt-3 space-y-2 text-slate-600">
              <li className="flex gap-2"><span className="font-mono font-semibold text-teal-700">Day 0</span> You file a dispute (free)</li>
              <li className="flex gap-2"><span className="font-mono font-semibold text-teal-700">≤ 10 WD</span> The MFI must respond</li>
              <li className="flex gap-2"><span className="font-mono font-semibold text-teal-700">≤ 30 d</span> CIC resolves and notifies you</li>
            </ol>
          </div>
          <div className="mt-5 flex flex-wrap gap-4 text-sm">
            <Link to="/services/dispute-correction" className="inline-flex items-center gap-1 font-semibold text-primary hover:underline">How to dispute <ArrowRight className="h-4 w-4" aria-hidden="true" /></Link>
            <Link to="/privacy" className="inline-flex items-center gap-1 font-semibold text-primary hover:underline">Privacy notice <ArrowRight className="h-4 w-4" aria-hidden="true" /></Link>
          </div>
        </div>
        <ul className="grid gap-4 sm:grid-cols-2 lg:col-span-3">
          {RIGHTS.map((r) => (
            <li key={r.title} className="rounded-xl bg-white p-5 shadow-sm">
              <ShieldCheck className="h-5 w-5 text-teal-700" aria-hidden="true" />
              <h3 className="mt-2 text-sm font-semibold text-slate-900">{r.title}</h3>
              <p className="mt-1 text-xs leading-relaxed text-slate-600">{r.text}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

/** Block 8 — publications teaser: one of each key type. */
export function PublicationsTeaser() {
  const { publications } = useStore();
  const pick = ['Report', 'Regulation', 'Guideline', 'Form']
    .map((type) => publications.filter((p) => p.type === type).sort((a, b) => b.effective.localeCompare(a.effective))[0])
    .filter(Boolean);
  return (
    <section aria-labelledby="pubs-title" className="bg-white">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <SectionHeading
          id="pubs-title"
          eyebrow="Library"
          title="Publications"
          subtitle="Annual reports, statistical bulletins, regulations and guidelines."
          action={<Link to="/publications" className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline">Browse the library <ArrowRight className="h-4 w-4" aria-hidden="true" /></Link>}
        />
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {pick.map((p) => (
            <li key={p.id} className="flex gap-3 rounded-xl border border-slate-200 p-4">
              <BookOpen className="mt-0.5 h-5 w-5 shrink-0 text-warm" aria-hidden="true" />
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">{p.type}</p>
                <p className="mt-0.5 text-sm font-medium leading-snug text-slate-900">{p.title}</p>
                <p className="mt-1 text-[11px] text-slate-500">v{p.version} · effective {formatDate(p.effective)}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

/** Block 9 — help: FAQ, AI assistant, helpdesk, grievance form. */
export function HelpBlock() {
  const items = [
    { icon: HelpCircle, title: 'Frequently asked questions', text: 'Answers about reports, disputes and privacy.', to: '/help', cta: 'Read the FAQ' },
    { icon: Bot, title: 'Ask the CIC assistant', text: 'Quick answers from public information — use the "Ask CIC" button on any page.', to: '/help#assistant', cta: 'How it works' },
    { icon: Phone, title: 'Call the helpdesk', text: '1800 242 242 · Mon–Fri 9:00–17:00, free call.', to: '/help#contact', cta: 'All contacts' },
    { icon: MessageSquareWarning, title: 'Complaint or feedback', text: 'Report an MFI, an unlicensed lender or a website problem.', to: '/help/grievance', cta: 'Open the form' },
  ];
  return (
    <section aria-labelledby="help-title" className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
      <SectionHeading id="help-title" eyebrow="Support" title="Need help?" />
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {items.map((it) => (
          <li key={it.title}>
            <Link to={it.to} className="group flex h-full flex-col rounded-xl border border-slate-200 bg-white p-5 shadow-sm hover:border-primary-200 hover:shadow-md">
              <it.icon className="h-6 w-6 text-primary" aria-hidden="true" />
              <h3 className="mt-3 text-sm font-semibold text-slate-900">{it.title}</h3>
              <p className="mt-1 flex-1 text-xs leading-relaxed text-slate-600">{it.text}</p>
              <span className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-primary group-hover:underline">{it.cta} <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" /></span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
