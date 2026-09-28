import { Link } from 'react-router-dom';
import {
  ArrowRight, BadgeCheck, Bell, Building2, CheckCircle2, Eye, FileText, Gauge, Gavel, HandCoins, KeyRound, LogIn,
  Download, FileSearch, Mail, MessageSquareText, ScanFace, ShieldCheck, Smartphone, UserPlus,
} from 'lucide-react';
import PageHero, { PageBody, SectionHeading } from '../../components/PageHero';

const STEPS = [
  {
    icon: UserPlus, title: 'Register and verify your identity', time: 'About 5 minutes',
    text: 'Enter your name, NRC and mobile number (email optional), then prove it is you in one of three ways.',
    ways: [
      { icon: ScanFace, title: 'NRC photo + selfie', text: 'Photograph your NRC and take a selfie. The faces are compared automatically.' },
      { icon: MessageSquareText, title: 'SMS to the phone your lender has', text: 'We send a 6-digit code to the mobile number already registered with your MFI.' },
      { icon: Building2, title: 'Activation code at a branch', text: 'Show your NRC at any licensed MFI branch or the CIC counter and receive a printed code.' },
    ],
  },
  {
    icon: Mail, title: 'Receive your sign-in details', time: 'Within minutes',
    text: 'Once your identity is confirmed, CIC sends your account confirmation and user ID by SMS or email — whichever you chose.',
    points: ['You choose your own password when you register', 'One account per NRC — nobody else can register with yours'],
  },
  {
    icon: LogIn, title: 'Sign in and set your password', time: 'First time only',
    text: 'Sign in with your NRC or mobile number and the password you created, then enter the SMS code.',
    points: ['Every later sign-in: password + a one-time SMS code', 'After 5 wrong passwords the account is locked for 30 minutes'],
  },
];

const REPORT_STEPS = [
  { icon: FileSearch, title: 'Request your credit report', text: 'Choose why you need it and how we should notify you. One report a year is free.' },
  { icon: ShieldCheck, title: 'CIC validates and approves', text: 'CIC checks your identity and the latest data from every lender; an officer approves — within 1 working day.' },
  { icon: Bell, title: 'You are notified', text: 'An SMS or email tells you the report is ready (or why it could not be issued).' },
  { icon: Gauge, title: 'View your score and report', text: 'Grade A–E, score out of 100 and every loan by lender. The report is valid for 30 days.' },
];

const NEXT = [
  { icon: Download, title: 'Download or share', text: 'Save the PDF, or give a lender the report ID and verification code to check at /verify.' },
  { icon: Gavel, title: 'Dispute and re-issue', text: 'Something wrong? File a free dispute. Once it is corrected, request an updated report for free.' },
  { icon: HandCoins, title: 'Apply for a loan', text: 'Apply online to a licensed MFI; with your consent the lender sees the same grade.' },
];

const YOU_SEE = [
  { icon: Gauge, title: 'Your CIC credit score', text: 'Grade A–E and a score out of 100, with the factors behind it and tips to improve — issued after CIC validates your data. The same grade lenders see.' },
  { icon: FileText, title: 'All your loans', text: 'Every loan and guarantee reported by licensed MFIs, grouped by lender, with 24 months of repayment history.' },
  { icon: Eye, title: 'Who checked you', text: 'Every lender that viewed your report, when, why, and under which of your consents.' },
  { icon: HandCoins, title: 'Loan applications', text: 'Apply online to a licensed MFI and follow the decision step by step.' },
  { icon: Gavel, title: 'Disputes', text: 'Report a mistake for free. The lender must reply in 10 working days; CIC closes every case within 30 days.' },
  { icon: Bell, title: 'Alerts', text: 'An SMS when a lender checks your report, a new loan is reported or a payment is marked late.' },
];

/** Public guide: how a citizen gets access to their own credit report and score. */
export default function MyCreditPage() {
  return (
    <>
      <PageHero title="Check my credit report" subtitle="Register once, then request your credit report whenever you need it. CIC validates your data and issues the report — usually within 1 working day." breadcrumbs={[{ label: 'Check my credit report' }]}>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Link to="/borrower/register" className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-warm px-6 text-base font-semibold text-slate-900 shadow-lg hover:brightness-95">
            <UserPlus className="h-5 w-5" aria-hidden="true" /> Create account
          </Link>
          <Link to="/login" className="inline-flex h-12 items-center justify-center gap-2 rounded-lg border border-white/30 bg-white/5 px-6 text-base font-semibold text-white hover:bg-white/10">
            <LogIn className="h-5 w-5" aria-hidden="true" /> Sign in
          </Link>
        </div>
      </PageHero>

      <PageBody className="space-y-14">
        <section aria-labelledby="steps-title">
          <SectionHeading id="steps-title" eyebrow="Step 1 · Get access" title="Create your account" subtitle="You need your NRC card and the mobile phone you use every day." />
          <ol className="grid gap-5 lg:grid-cols-3">
            {STEPS.map((s, i) => (
              <li key={s.title} className="relative rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex items-center gap-3">
                  <span className="relative flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-white">
                    <s.icon className="h-5 w-5" aria-hidden="true" />
                    <span className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-warm text-xs font-bold text-slate-900">{i + 1}</span>
                  </span>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">{s.title}</h3>
                    <p className="text-xs text-teal-700">{s.time}</p>
                  </div>
                </div>
                <p className="mt-3 text-sm text-slate-600">{s.text}</p>
                {s.points && <ul className="mt-3 space-y-1.5">{s.points.map((p) => <li key={p} className="flex gap-2 text-xs text-slate-600"><CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-teal-700" aria-hidden="true" />{p}</li>)}</ul>}
                {s.ways && (
                  <ul className="mt-3 space-y-2">
                    {s.ways.map((w) => (
                      <li key={w.title} className="flex gap-2.5 rounded-lg bg-slate-50 p-2.5">
                        <w.icon className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                        <span><span className="block text-xs font-semibold text-slate-800">{w.title}</span><span className="block text-[11px] text-slate-500">{w.text}</span></span>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ol>
          <p className="mt-4 flex items-start gap-2 text-xs text-slate-500"><Smartphone className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" /> No smartphone? Visit any licensed MFI branch or the CIC counter — staff can help you register and print your report.</p>
        </section>

        <section aria-labelledby="report-title">
          <SectionHeading id="report-title" eyebrow="Step 2 · Get your report" title="Request, validation, approval" subtitle="Your score is never shown straight after sign-in: CIC first validates the data and an officer approves the report." />
          <ol className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {REPORT_STEPS.map((s, i) => (
              <li key={s.title} className="rounded-xl border border-slate-200 bg-white p-5">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-warm text-sm font-bold text-slate-900">{i + 1}</span>
                  <s.icon className="h-5 w-5 text-primary" aria-hidden="true" />
                </div>
                <h3 className="mt-3 text-sm font-semibold text-slate-900">{s.title}</h3>
                <p className="mt-1 text-xs leading-relaxed text-slate-600">{s.text}</p>
              </li>
            ))}
          </ol>
        </section>

        <section aria-labelledby="next-title">
          <SectionHeading id="next-title" eyebrow="Step 3 · After your report" title="What you can do next" />
          <ul className="grid gap-4 md:grid-cols-3">
            {NEXT.map((n) => (
              <li key={n.title} className="flex gap-3 rounded-xl border border-slate-200 bg-white p-5">
                <n.icon className="h-6 w-6 shrink-0 text-teal-700" aria-hidden="true" />
                <span><span className="block text-sm font-semibold text-slate-900">{n.title}</span><span className="mt-1 block text-xs leading-relaxed text-slate-600">{n.text}</span></span>
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="see-title">
          <SectionHeading id="see-title" eyebrow="Inside your account" title="What you will see" />
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {YOU_SEE.map((y) => (
              <li key={y.title} className="rounded-xl border border-slate-200 bg-white p-5">
                <y.icon className="h-6 w-6 text-teal-700" aria-hidden="true" />
                <h3 className="mt-2 text-sm font-semibold text-slate-900">{y.title}</h3>
                <p className="mt-1 text-xs leading-relaxed text-slate-600">{y.text}</p>
              </li>
            ))}
          </ul>
        </section>

        <section className="grid gap-5 lg:grid-cols-3" aria-label="Costs and safety">
          <div className="rounded-xl bg-primary p-6 text-white lg:col-span-2">
            <BadgeCheck className="h-7 w-7 text-warm" aria-hidden="true" />
            <h2 className="mt-2 text-lg font-bold">Free, and only for you</h2>
            <ul className="mt-3 space-y-1.5 text-sm text-primary-100">
              <li>• One credit report every 12 months is free; after that each report costs 3,000 MMK, paid only when CIC approves it.</li>
              <li>• An updated report after a corrected dispute is always free.</li>
              <li>• While your report is valid (30 days) you can view it and download the PDF as often as you like.</li>
              <li>• Disputes are always free. Checking your own report never lowers your score.</li>
              <li>• Lenders cannot see that you have an account or when you look at your report.</li>
            </ul>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-6">
            <KeyRound className="h-6 w-6 text-primary" aria-hidden="true" />
            <h2 className="mt-2 text-base font-bold text-slate-900">Ready?</h2>
            <p className="mt-1 text-sm text-slate-600">Have your NRC and phone with you.</p>
            <div className="mt-4 flex flex-col gap-2">
              <Link to="/borrower/register" className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-warm text-sm font-semibold text-slate-900 hover:brightness-95"><UserPlus className="h-4 w-4" aria-hidden="true" /> Create account</Link>
              <Link to="/login" className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-slate-300 text-sm font-semibold text-slate-700 hover:bg-slate-50"><LogIn className="h-4 w-4" aria-hidden="true" /> Sign in</Link>
            </div>
            <Link to="/how-it-works" className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline">See all step-by-step guides <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" /></Link>
          </div>
        </section>
      </PageBody>
    </>
  );
}
