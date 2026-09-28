import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Building2, CheckCircle2, History, LifeBuoy, LogIn, Mail, MessageSquareText, Phone } from 'lucide-react';
import { Alert, Badge, Button, Card, CardBody, PageHeader, Stepper } from '@/components/ui';
import BrandMark from '@/components/layout/BrandMark';
import LanguageSwitcher from '@/components/layout/LanguageSwitcher';
import { useStore } from '@/context/StoreContext';
import { BORROWERS, findByNrc } from '@/data/registry';
import { TOWNSHIPS } from '@/data/reference';
import { maskNrc } from '@/lib/format';
import { parseNrc } from '@/lib/nrc';
import AccountStep from './AccountStep';
import VerifyStep from './VerifyStep';

const STEPS = ['Your details', 'Identity check', 'Account confirmed'];
const MAX_ATTEMPTS = 3;
const ROUTE_LABEL = { ekyc: 'NRC + selfie eKYC', otp: 'OTP to phone on record at an MFI', code: 'In-person activation code' };
const STATES = ['', 'Kachin', 'Kayah', 'Kayin', 'Chin', 'Sagaing', 'Tanintharyi', 'Bago', 'Magway', 'Mandalay', 'Mon', 'Rakhine', 'Yangon', 'Shan', 'Ayeyarwady'];

/** Details step saved on this device only (never the password or the consents) so a citizen can come back to it. */
const DRAFT_KEY = 'cic.register.draft';
const DRAFT_FIELDS = ['name', 'nrc', 'phone', 'email', 'delivery'];
const EMPTY_FORM = { name: '', nrc: '', phone: '+959', email: '', password: '', confirm: '', delivery: 'SMS', terms: false, privacy: false };
function readDraft() {
  try {
    const d = JSON.parse(sessionStorage.getItem(DRAFT_KEY) ?? 'null');
    return d && (d.name || d.nrc || (d.phone && d.phone !== '+959') || d.email) ? d : null;
  } catch { return null; }
}
function writeDraft(form) {
  try { sessionStorage.setItem(DRAFT_KEY, JSON.stringify(Object.fromEntries(DRAFT_FIELDS.map((k) => [k, form[k]])))); } catch { /* storage unavailable */ }
}
function clearDraft() {
  try { sessionStorage.removeItem(DRAFT_KEY); } catch { /* storage unavailable */ }
}

/** Assisted registration for citizens who cannot register online. */
function AssistedRegistration() {
  return (
    <section aria-labelledby="assisted-title" className="mt-4 rounded-xl border border-teal-200 bg-teal-50 p-4 text-sm text-slate-700">
      <h2 id="assisted-title" className="flex items-center gap-2 font-semibold text-teal-900"><Building2 className="h-4 w-4 shrink-0" aria-hidden="true" /> Can&apos;t register online?</h2>
      <p className="mt-1">Visit any licensed MFI branch or the CIC counter with your NRC — staff will register you and give you an activation code. Then choose “Activation code from a counter” in step 2, or sign in with the code they give you.</p>
      <p className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs">
        <Link to="/mfi-directory" className="inline-flex min-h-[24px] items-center font-semibold text-primary underline">Find a licensed MFI branch</Link>
        <a href="tel:1800242242" className="inline-flex min-h-[24px] items-center gap-1 font-semibold text-primary underline"><Phone className="h-3.5 w-3.5" aria-hidden="true" />Helpdesk 1800 242 242</a>
        <span className="inline-flex min-h-[24px] items-center">CIC counter: No. 1, Sayar San Road, Bahan, Yangon</span>
      </p>
    </section>
  );
}

const pad = (n) => String(n).padStart(2, '0');
const nowStamp = (d = new Date()) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;

/**
 * Citizen self-registration: details + own password → identity check → account confirmed.
 * The citizen is not signed in here: a confirmation with their user ID is sent by SMS or email,
 * and they then sign in on /login with their NRC (or phone) and the password they created.
 */
export default function RegisterPage() {
  const { accounts, add, logAudit } = useStore();
  const [step, setStep] = useState(0);
  const [draft] = useState(readDraft);
  const [restored, setRestored] = useState(!!draft);
  const [form, setForm] = useState(() => ({ ...EMPTY_FORM, ...(draft ?? {}) }));
  useEffect(() => { if (step === 0) writeDraft(form); }, [form, step]);
  const startAgain = () => { clearDraft(); setForm(EMPTY_FORM); setRestored(false); setDuplicate(false); };
  const [attempts, setAttempts] = useState(0);
  const [status, setStatus] = useState('none'); // none | pending | verified | locked
  const [duplicate, setDuplicate] = useState(false);
  const [created, setCreated] = useState(null);

  const nrc = parseNrc(form.nrc);
  const who = nrc.normalised ?? form.nrc;
  const match = nrc.valid ? findByNrc(who) : null;
  const audit = (action, outcome, extra = {}) => logAudit({ actor: maskNrc(who), role: 'borrower (unverified)', tenant: 'PUBLIC', module: 'Borrower registration', action, target: maskNrc(who), outcome, ...extra });

  const toVerify = () => {
    const exists = accounts.some((a) => a.nrc.toUpperCase() === who.toUpperCase() || (match && a.borrowerId === match.borrowerId));
    if (exists) {
      setDuplicate(true);
      audit('BORROWER_REGISTER', 'Rejected', { purpose: 'Account already exists for this NRC' });
      return;
    }
    setDuplicate(false);
    setStatus('pending');
    setStep(1);
    audit('BORROWER_REGISTER', 'Pending verification');
  };

  const fail = () => {
    const n = attempts + 1;
    setAttempts(n);
    audit('IDENTITY_VERIFY', 'Failed', { purpose: `Attempt ${n}/${MAX_ATTEMPTS}` });
    if (n >= MAX_ATTEMPTS) {
      setStatus('locked');
      audit('ACCOUNT_LOCKED', 'Locked', { purpose: 'Max verification attempts reached' });
    }
  };

  const succeed = (route) => {
    audit('IDENTITY_VERIFY', 'Success', { purpose: ROUTE_LABEL[route] });
    const taken = new Set([...BORROWERS.map((b) => b.borrowerId), ...accounts.map((a) => a.borrowerId)]);
    let borrowerId = match?.borrowerId;
    while (!borrowerId || (!match && taken.has(borrowerId))) borrowerId = `BRW-0${String(10000 + Math.floor(Math.random() * 89999))}`;
    const town = TOWNSHIPS.find((t) => t.code === nrc.township);
    const account = {
      id: `ACC-${borrowerId.slice(4)}`, borrowerId, name: match?.nameEn ?? form.name.trim(), nameMm: match?.nameMm ?? '', nrc: who,
      phone: form.phone, email: form.email.trim(), password: form.password, mustChangePassword: false, status: 'Pending first sign-in',
      verifiedVia: ROUTE_LABEL[route], createdAt: nowStamp(), credentialsSentVia: form.delivery,
      township: match?.township ?? town?.name ?? '', region: match?.region ?? town?.region ?? STATES[nrc.state] ?? '',
    };
    add('accounts', account);
    const to = form.delivery === 'Email' ? account.email : account.phone;
    add('outbox', {
      id: `MSG-${Date.now().toString(36).toUpperCase()}`, kind: 'credentials', channel: form.delivery, to, accountId: account.id,
      userId: account.nrc, sentAt: new Date().toISOString(), status: 'Delivered',
      body: `CIC Myanmar: your identity is confirmed and your account is active. User ID: ${account.nrc} (or your mobile number ${account.phone}). Sign in at cic.gov.mm/login with the password you created. CIC will never ask for your password.`,
    });
    logAudit({ actor: account.name, role: 'borrower', tenant: 'PUBLIC', module: 'Borrower registration', action: 'ACCOUNT_ISSUED', target: borrowerId, outcome: 'Success', purpose: `${match ? 'Linked to existing CIC file' : 'New CIC file opened'} · credentials sent by ${form.delivery}` });
    clearDraft();
    setStatus('verified');
    setStep(2);
    setCreated({ ...account, to });
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-2xl items-center justify-between gap-3 px-4 py-3">
          <Link to="/" aria-label="CIC Myanmar home" className="min-w-0"><BrandMark subtitle="Borrower registration" /></Link>
          <LanguageSwitcher />
        </div>
      </header>

      <main id="main" className="mx-auto max-w-2xl px-4 py-6">
        <Link to="/login" className="mb-4 inline-flex min-h-[24px] items-center gap-1 text-xs font-medium text-slate-600 hover:text-primary">
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" /> Already registered? Sign in
        </Link>
        <PageHeader
          title="Create your borrower account"
          subtitle="See your own credit report and CIC score for free, check who looked at it, apply for loans and fix mistakes. It takes about 5 minutes."
        />

        <Card>
          <CardBody className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <Stepper steps={STEPS} current={step} />
              {status !== 'none' && (
                <p className="text-xs text-slate-500">Account status: <Badge status={status === 'verified' ? 'Verified' : status === 'locked' ? 'Locked' : 'Pending'} /></p>
              )}
            </div>

            {step === 0 && restored && (
              <Alert tone="info" title="Continue where you left off">
                <p>We kept the details you entered earlier on this device. For your safety, enter your password again.</p>
                <Button size="sm" variant="outline" icon={History} className="mt-2" onClick={startAgain}>Start again with an empty form</Button>
              </Alert>
            )}

            {step === 0 && (
              <AccountStep
                form={form}
                setForm={(f) => { setDuplicate(false); setForm(f); }}
                onNext={toVerify}
                error={duplicate && (
                  <Alert tone="warning" title="You already have an account">
                    An account for NRC {maskNrc(who)} already exists. <Link to="/login" className="font-semibold underline">Sign in</Link> instead, or call 1800 242 242 if you did not create it.
                  </Alert>
                )}
              />
            )}

            {step === 1 && status === 'locked' && (
              <div className="space-y-4">
                <Alert tone="danger" title="Account locked for your protection">
                  We could not confirm your identity after {MAX_ATTEMPTS} attempts, so registration for NRC {maskNrc(who)} is locked.
                  This stops someone else from registering with your NRC.
                </Alert>
                <div className="rounded-lg border border-slate-200 p-4 text-sm">
                  <p className="flex items-center gap-2 font-semibold text-slate-800"><LifeBuoy className="h-4 w-4 text-primary" aria-hidden="true" /> Contact the CIC helpdesk</p>
                  <p className="mt-1 text-xs text-slate-600">Call <a className="font-semibold text-primary underline" href="tel:1800242242">1800 242 242</a> (Mon–Fri 9:00–17:00) or visit the CIC counter with your NRC. Quote reference <span className="font-mono">REG-{nrc.number ?? '000000'}</span>.</p>
                </div>
              </div>
            )}

            {step === 1 && status === 'pending' && (
              <VerifyStep recordPhone={match?.phone} recordMfis={[...new Set(match?.loans.map((l) => l.mfiId) ?? [])]} attempts={attempts} maxAttempts={MAX_ATTEMPTS} onFail={fail} onSuccess={succeed} />
            )}

            {step === 2 && created && (
              <div className="space-y-5 text-center" role="status" aria-live="polite">
                <CheckCircle2 className="mx-auto h-14 w-14 text-teal-700" aria-hidden="true" />
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Identity confirmed — your account is ready</h2>
                  <p className="mt-1 text-sm text-slate-600">We have sent a confirmation with your user ID to <b>{created.credentialsSentVia === 'Email' ? created.to : created.to.replace(/^(\+959)\d+(\d{3})$/, '$1 ••• ••$2')}</b>. </p>
                </div>
                <div className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 text-left text-sm">
                  {created.credentialsSentVia === 'Email' ? <Mail className="mt-0.5 h-5 w-5 text-primary" /> : <MessageSquareText className="mt-0.5 h-5 w-5 text-primary" />}
                  <ol className="list-decimal space-y-1 pl-4 text-slate-600">
                    <li>Open the message from <b>CIC Myanmar</b>.</li>
                    <li>Go to <b>cic.gov.mm/login</b> and sign in with your NRC (or mobile number) and the password you created.</li>
                    <li>Enter the 6-digit SMS code we send to your phone.</li>
                  </ol>
                </div>
                <Alert tone="info" className="text-left">
                  {match
                    ? 'We found loans reported under your NRC — you will see them after you sign in.'
                    : 'No lender has reported a loan under your NRC yet, so your file starts empty.'} Your registration reference is <span className="font-mono">{created.id}</span>.
                </Alert>
                <Link to="/login" className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-primary px-6 text-sm font-semibold text-white hover:bg-primary-700"><LogIn className="h-4 w-4" aria-hidden="true" /> Go to sign in</Link>
                <p className="text-xs text-slate-500">Did not receive it after 15 minutes? Call 1800 242 242 and quote your reference.</p>
              </div>
            )}
          </CardBody>
        </Card>
        {step < 2 && <AssistedRegistration />}
        <p className="mt-4 text-center text-[11px] text-slate-500">Registration and each verification attempt are recorded in CIC&apos;s audit log.</p>
      </main>
    </div>
  );
}
