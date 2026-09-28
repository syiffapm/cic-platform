import { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  ArrowRight, BadgeCheck, Bell, Building2, CheckCircle2, ClipboardCheck, Eye, FileCheck2, FileSearch, Gauge,
  Gavel, HandCoins, KeyRound, Lightbulb, LogIn, Mail, QrCode, Scale, Search, Upload, UserPlus, Wallet,
} from 'lucide-react';
import PageHero, { PageBody } from '../../components/PageHero';

const JOURNEYS = [
  {
    id: 'access', icon: KeyRound, title: 'Get access to your credit report', lead: 'Free for every citizen with an NRC. About 5 minutes.',
    steps: [
      { icon: UserPlus, title: 'Register and verify', text: 'NRC, mobile number, optional email — then a selfie with your NRC, an SMS to the phone your lender has, or a branch activation code.', to: '/borrower/register', cta: 'Register' },
      { icon: Mail, title: 'Get your account confirmation', text: 'Once your identity is confirmed, CIC sends your user ID by SMS or email. Your password is the one you created — CIC never sends it.', to: '/my-credit', cta: 'How it works' },
      { icon: LogIn, title: 'Sign in', text: 'Use your NRC or mobile number and your password, then enter the SMS code. Every sign-in needs a code.', to: '/login', cta: 'Sign in' },
      { icon: CheckCircle2, title: 'Your file is linked', text: 'Your account is linked to your CIC file. Next: request your credit report.', to: '/how-it-works#score', cta: 'Get my report' },
    ],
  },
  {
    id: 'score', icon: Gauge, title: 'Get your credit report and score', lead: 'Requested by you, validated by CIC, approved by an officer — usually within 1 working day.',
    steps: [
      { icon: FileSearch, title: 'Request your report', text: 'Choose the purpose and how to be notified. One report every 12 months is free; after that 3,000 MMK, paid at approval.', to: '/borrower/requests/new', cta: 'Request my report' },
      { icon: ClipboardCheck, title: 'CIC validates and approves', text: 'Identity and the latest data from every lender are checked, then a CIC officer approves. Follow each step online.', to: '/borrower/requests', cta: 'Track my request' },
      { icon: Bell, title: 'You are notified', text: 'An SMS or email tells you the report is ready — or why it could not be issued and what to do.', to: '/borrower/alerts', cta: 'My alerts' },
      { icon: Gauge, title: 'View your score and report', text: 'Grade A–E, score out of 100, the factors behind it and every loan by lender. Valid for 30 days.', to: '/borrower/report', cta: 'My credit report' },
    ],
    note: 'Next steps: download the PDF or share the report ID and verification code with a lender; dispute anything wrong and get an updated report free once it is corrected; or apply for a loan. No loans yet? The report says “No credit history yet” — never a low score.',
  },
  {
    id: 'apply', icon: HandCoins, title: 'Apply for a loan online', lead: 'Apply to any licensed MFI and follow the decision step by step.',
    steps: [
      { icon: Search, title: 'Choose a licensed lender', text: 'Only institutions with a valid licence accept online applications. Filter by region and product.', to: '/mfi-directory', cta: 'MFI directory' },
      { icon: Wallet, title: 'Tell them what you need', text: 'Product, amount, period and purpose. We show the monthly instalment and warn you if it is more than 40% of your income.', to: '/borrower/loans/apply', cta: 'Apply' },
      { icon: FileCheck2, title: 'Give a one-time consent', text: 'You allow that lender to check your credit report once, for this application only, within 30 days.', to: '/borrower/consents', cta: 'My consents' },
      { icon: ClipboardCheck, title: 'Track the decision', text: 'Submitted → Credit check → Decision → Disbursed. You get an SMS at each step and the reason if declined.', to: '/borrower/loans', cta: 'My applications' },
    ],
    note: 'Once the loan is paid out it appears in your credit report. Paying on time builds your history.',
  },
  {
    id: 'dispute', icon: Gavel, title: 'Fix a mistake (dispute)', lead: 'Free. The lender must reply within 10 working days; CIC closes every case within 30 days.',
    steps: [
      { icon: Eye, title: 'Spot the error', text: 'A wrong balance, a late mark you paid, a closed loan shown active, or a check you did not agree to.', to: '/borrower/report', cta: 'My report' },
      { icon: Upload, title: 'File the dispute', text: 'Choose the record, the reason, explain in your words and add a receipt or letter.', to: '/borrower/disputes/new', cta: 'File a dispute' },
      { icon: Scale, title: 'Lender and CIC review', text: 'The line is flagged “under dispute” at once and is not scored while open. CIC checks any correction.', to: '/borrower/disputes', cta: 'Track disputes' },
      { icon: Bell, title: 'Get the outcome', text: 'You see the old and new values and are told by SMS. Then request an updated report — free after a correction. Not satisfied? Escalate to the Central Bank.', to: '/borrower/requests/new', cta: 'Updated report' },
    ],
  },
  {
    id: 'verify', icon: BadgeCheck, title: 'Verify a lender or a report', lead: 'Protect yourself from unlicensed lenders and fake reports. No sign-in needed.',
    steps: [
      { icon: Building2, title: 'Check the lender’s licence', text: 'Search the MFI directory. Only “Licensed” institutions may lend; suspended or revoked ones may not.', to: '/mfi-directory', cta: 'Search MFIs' },
      { icon: QrCode, title: 'Scan the report QR', text: 'Every official CIC report carries a QR code, report ID and 6-digit verification code.', to: '/verify', cta: 'Verify a report' },
      { icon: FileSearch, title: 'See the result', text: 'Valid, revoked or not found — plus the issue date. Never the contents.', to: '/verify', cta: 'Open verifier' },
      { icon: Gavel, title: 'Report a problem', text: 'Unlicensed lender or fake report? Tell us — it goes to the Central Bank consumer-protection team.', to: '/help/grievance', cta: 'Report it' },
    ],
  },
];

/** Public "How it works": visual, step-by-step citizen journeys, each step linking to the real page. */
export default function HowItWorksPage() {
  const { hash } = useLocation();
  useEffect(() => {
    if (!hash) return;
    const t = setTimeout(() => document.getElementById(hash.slice(1))?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 80);
    return () => clearTimeout(t);
  }, [hash]);

  return (
    <>
      <PageHero title="How it works" subtitle="Step-by-step guides for the things citizens do most on the CIC service. Every step links to the page where you do it." breadcrumbs={[{ label: 'How it works' }]}>
        <nav aria-label="Guides on this page" className="flex flex-wrap gap-2">
          {JOURNEYS.map((j) => (
            <a key={j.id} href={`#${j.id}`} className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold text-white ring-1 ring-white/20 hover:bg-white/20">
              <j.icon className="h-3.5 w-3.5 text-warm" aria-hidden="true" /> {j.title}
            </a>
          ))}
        </nav>
      </PageHero>

      <PageBody className="space-y-10">
        {JOURNEYS.map((j, n) => (
          <section key={j.id} id={j.id} aria-labelledby={`${j.id}-title`} className="scroll-mt-20 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
            <div className="flex flex-wrap items-start gap-4">
              <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-white"><j.icon className="h-6 w-6" aria-hidden="true" /></span>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold uppercase tracking-wider text-teal-700">Guide {n + 1} of {JOURNEYS.length}</p>
                <h2 id={`${j.id}-title`} className="text-xl font-bold text-slate-900">{j.title}</h2>
                <p className="mt-0.5 text-sm text-slate-600">{j.lead}</p>
              </div>
            </div>
            <ol className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {j.steps.map((s, i) => (
                <li key={s.title} className="relative flex flex-col rounded-xl bg-slate-50 p-4">
                  {i < j.steps.length - 1 && <ArrowRight className="absolute -right-3.5 top-8 z-10 hidden h-5 w-5 rounded-full bg-white text-primary-300 xl:block" aria-hidden="true" />}
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-warm text-sm font-bold text-slate-900">{i + 1}</span>
                    <s.icon className="h-5 w-5 text-primary" aria-hidden="true" />
                  </div>
                  <h3 className="mt-3 text-sm font-semibold text-slate-900">{s.title}</h3>
                  <p className="mt-1 flex-1 text-xs leading-relaxed text-slate-600">{s.text}</p>
                  <Link to={s.to} className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline">{s.cta} <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" /></Link>
                </li>
              ))}
            </ol>
            {j.note && <p className="mt-4 flex items-start gap-2 rounded-lg bg-teal-50 p-3 text-xs text-teal-900"><Lightbulb className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />{j.note}</p>}
          </section>
        ))}

        <section className="rounded-2xl bg-primary p-6 text-white sm:p-8">
          <h2 className="text-lg font-bold">Behind the scenes</h2>
          <p className="mt-1 max-w-3xl text-sm text-primary-100">Licensed MFIs report every loan and repayment to CIC each month. CIC checks the data, matches it to the right person and keeps it in the national Borrower & Loan Registry. A lender can only see your report with your consent and a stated purpose — and every look is recorded and shown to you.</p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link to="/my-credit" className="inline-flex h-11 items-center gap-2 rounded-lg bg-warm px-5 text-sm font-semibold text-slate-900 hover:brightness-95">Check my credit report <ArrowRight className="h-4 w-4" aria-hidden="true" /></Link>
            <Link to="/help" className="inline-flex h-11 items-center rounded-lg border border-white/30 px-5 text-sm font-semibold hover:bg-white/10">Help & FAQ</Link>
          </div>
        </section>
      </PageBody>
    </>
  );
}
