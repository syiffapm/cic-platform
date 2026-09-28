import clsx from 'clsx';
import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, ChevronDown, Eye, KeyRound, Lock, MessageSquareText, ShieldCheck, Smartphone } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useStore } from '@/context/StoreContext';
import { useI18n } from '@/i18n/I18nContext';
import { parseNrc } from '@/lib/nrc';
import { passwordOk } from '@/lib/password';
import { formatDateTime } from '@/lib/format';
import { Alert, Button, Input } from '@/components/ui';
import BrandMark from '@/components/layout/BrandMark';
import LanguageSwitcher from '@/components/layout/LanguageSwitcher';
import PasswordRules from '@/components/layout/PasswordRules';

const MAX_ATTEMPTS = 5;
const maskPhone = (p) => p.replace(/^(\+959)\d+(\d{3})$/, '$1 ••• ••$2');

/**
 * Citizen sign-in on the public website (Borrower Self-Service). Staff never sign in here —
 * they use the separate staff workspace. Accounts created by registration arrive with a
 * confirmation by SMS / email and sign in with the password they chose at registration. Accounts
 * reset by the helpdesk (mustChangePassword) set a new password on their next sign-in.
 */
export default function LoginPage() {
  const { signInUser } = useAuth();
  const { accounts, outbox, patch, logAudit } = useStore();
  const { t } = useI18n();
  const navigate = useNavigate();
  const location = useLocation();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [attempts, setAttempts] = useState(0);
  const [account, setAccount] = useState(null);
  const [step, setStep] = useState('credentials'); // credentials | new-password | otp
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [otp, setOtp] = useState('');
  const [showTraining, setShowTraining] = useState(false);
  const locked = attempts >= MAX_ATTEMPTS;

  const findAccount = () => {
    const parsed = parseNrc(identifier);
    const digits = identifier.replace(/[^\d]/g, '').replace(/^(95|0)/, '');
    return accounts.find((a) => (parsed.valid && a.nrc.toUpperCase() === parsed.normalised) || (digits.length >= 7 && a.phone.replace(/[^\d]/g, '').endsWith(digits)));
  };

  const submitCredentials = (e) => {
    e.preventDefault();
    if (locked) return;
    const acc = findAccount();
    if (!acc || acc.password !== password) {
      const left = MAX_ATTEMPTS - attempts - 1;
      setAttempts((a) => a + 1);
      setError(left > 0 ? `Incorrect NRC / phone number or password. ${left} attempt${left === 1 ? '' : 's'} left.` : 'Too many failed attempts. Your account is locked for 30 minutes.');
      logAudit({ actor: identifier || 'Unknown', role: 'borrower', tenant: 'PUBLIC', action: 'LOGIN_FAILED', module: 'IAM (citizen)', target: identifier, outcome: 'Denied' });
      return;
    }
    if (!['Active', 'Pending first sign-in'].includes(acc.status)) { setError(`This account is ${acc.status.toLowerCase()}. Please call the CIC helpdesk on 1800 242 242.`); return; }
    setError('');
    setAccount(acc);
    setStep(acc.mustChangePassword ? 'new-password' : 'otp');
  };

  const saveNewPassword = (e) => {
    e.preventDefault();
    if (!passwordOk(newPw)) { setError('Your new password does not meet all the rules.'); return; }
    if (newPw !== confirmPw) { setError('The two passwords do not match.'); return; }
    if (newPw === account.password) { setError('Choose a password different from the one the helpdesk issued.'); return; }
    patch('accounts', account.id, { password: newPw, mustChangePassword: false });
    logAudit({ actor: account.name, role: 'borrower', tenant: 'PUBLIC', action: 'PASSWORD_SET_FIRST_LOGIN', module: 'IAM (citizen)', target: account.id, outcome: 'Success' });
    setError('');
    setStep('otp');
  };

  const verify = (e) => {
    e.preventDefault();
    if (!/^\d{6}$/.test(otp)) { setError('Enter the 6-digit code.'); return; }
    const first = account.status === 'Pending first sign-in';
    if (first) patch('accounts', account.id, { status: 'Active', activatedAt: new Date().toISOString().slice(0, 16).replace('T', ' ') });
    signInUser('borrower', { id: account.id, role: 'borrower', name: account.name, email: account.email, nrc: account.nrc, phone: account.phone, borrowerId: account.borrowerId });
    logAudit({ actor: account.name, role: 'borrower', tenant: 'PUBLIC', action: 'LOGIN_SUCCESS', module: 'IAM (citizen)', target: account.id, outcome: 'Success', purpose: first ? 'First sign-in — account activated' : '—' });
    const from = location.state?.from;
    navigate(first ? '/borrower?welcome=1' : (from?.startsWith('/borrower') ? from : '/borrower'), { replace: true });
  };

  const trainingCitizens = accounts.filter((a) => a.status === 'Active' && !a.mustChangePassword).slice(0, 3);
  const recentMessages = outbox.filter((m) => m.kind === 'credentials').slice(0, 3);

  return (
    <div className="grid min-h-screen lg:grid-cols-[1fr_1.1fr]">
      <div className="relative hidden overflow-hidden bg-primary lg:block">
        <div className="gov-pattern absolute inset-0" />
        <div className="relative flex h-full flex-col justify-between p-12 text-white">
          <Link to="/"><BrandMark light /></Link>
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-warm">Borrower Self-Service</p>
            <h1 className="mt-3 text-3xl font-bold leading-tight">Your credit file, only for you</h1>
            <p className="mt-3 max-w-md text-sm text-primary-100">Sign in to see your CIC credit score and report, who checked it, your loan applications and disputes.</p>
            <ul className="mt-8 space-y-3 text-sm text-primary-100">
              <li className="flex items-center gap-2"><Eye className="h-4 w-4 text-warm" /> You only ever see your own records</li>
              <li className="flex items-center gap-2"><Smartphone className="h-4 w-4 text-warm" /> A one-time SMS code on every sign-in</li>
              <li className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-warm" /> Every view and download is logged</li>
            </ul>
          </div>
          <p className="flex items-center gap-2 text-[11px] text-primary-300"><Lock className="h-3.5 w-3.5" /> cic.gov.mm · Credit Information Center, Central Bank of Myanmar</p>
        </div>
      </div>

      <div className="flex flex-col bg-white">
        <div className="flex items-center justify-between px-6 py-5">
          <Link to="/" className="flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-primary"><ArrowLeft className="h-4 w-4" /> Back to the CIC website</Link>
          <LanguageSwitcher />
        </div>
        <div className="flex flex-1 items-start justify-center px-6 pb-12 pt-4 sm:items-center">
          <div className="w-full max-w-md">
            <BrandMark className="mb-8 lg:hidden" />

            {step === 'credentials' && (
              <form onSubmit={submitCredentials} className="space-y-5" noValidate>
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">{t('common.signIn')}</h2>
                  <p className="mt-1 text-sm text-slate-500">Use the NRC or mobile number you registered with, and the password you created.</p>
                </div>
                <Input label="NRC number or mobile number" placeholder="12/OUKAMA(N)245781 or 09 421 005 678" value={identifier} onChange={(e) => setIdentifier(e.target.value)} autoComplete="username" required />
                <Input label="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" required />
                {error && <Alert tone="danger">{error}</Alert>}
                <Button type="submit" className="w-full" size="lg" disabled={locked || !identifier || !password}>Continue</Button>
                <div className="flex items-center justify-between text-xs">
                  <Link to="/help" className="font-medium text-slate-500 hover:text-primary">Forgot password?</Link>
                  <Link to="/borrower/register" className="font-semibold text-primary hover:underline">No account yet? Register</Link>
                </div>

                <div className="rounded-xl border border-dashed border-slate-300">
                  <button type="button" onClick={() => setShowTraining((s) => !s)} aria-expanded={showTraining} className="flex w-full items-center justify-between px-4 py-2.5 text-xs font-medium text-slate-500">
                    Training environment
                    <ChevronDown className={clsx('h-4 w-4 transition', showTraining && 'rotate-180')} />
                  </button>
                  {showTraining && (
                    <div className="space-y-3 border-t border-slate-200 px-4 py-3">
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Existing citizen accounts · password Cic@2026</p>
                        {trainingCitizens.map((a) => (
                          <button key={a.id} type="button" onClick={() => { setIdentifier(a.nrc); setPassword(a.password); setError(''); }} className="flex w-full justify-between rounded-md px-2 py-1 text-left text-xs hover:bg-slate-50">
                            <span className="font-medium text-slate-700">{a.name}</span><span className="font-mono text-[11px] text-slate-500">{a.nrc}</span>
                          </button>
                        ))}
                      </div>
                      <div>
                        <p className="flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider text-slate-500"><MessageSquareText className="h-3 w-3" /> Confirmations sent to new registrations</p>
                        {recentMessages.length === 0 && <p className="px-2 py-1 text-[11px] text-slate-500">No registrations yet in this session.</p>}
                        {recentMessages.map((m) => (
                          <button key={m.id} type="button" onClick={() => { setIdentifier(m.userId); setPassword(''); setError(''); }} className="mt-1 block w-full rounded-md bg-slate-50 px-2 py-1.5 text-left text-[11px] text-slate-600 hover:bg-slate-100">
                            <span className="font-semibold text-slate-700">{m.channel} to {m.to}</span> · {formatDateTime(m.sentAt)}
                            <span className="mt-0.5 block whitespace-pre-line">{m.body}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </form>
            )}

            {step === 'new-password' && (
              <form onSubmit={saveNewPassword} className="space-y-5">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-50 text-primary"><KeyRound className="h-6 w-6" /></div>
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">Welcome, {account.name}</h2>
                  <p className="mt-1 text-sm text-slate-500">Your password was reset by the CIC helpdesk. Choose a new password to continue.</p>
                </div>
                <Input label="New password" type="password" value={newPw} onChange={(e) => { setNewPw(e.target.value); setError(''); }} autoComplete="new-password" required />
                {newPw && <PasswordRules value={newPw} />}
                <Input label="Confirm new password" type="password" value={confirmPw} onChange={(e) => { setConfirmPw(e.target.value); setError(''); }} autoComplete="new-password" required />
                {error && <Alert tone="danger">{error}</Alert>}
                <Button type="submit" className="w-full" size="lg" disabled={!newPw || !confirmPw}>Save password and continue</Button>
              </form>
            )}

            {step === 'otp' && (
              <form onSubmit={verify} className="space-y-5">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-50 text-amber-600"><Smartphone className="h-6 w-6" /></div>
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">Enter your SMS code</h2>
                  <p className="mt-1 text-sm text-slate-500">We sent a 6-digit code to {maskPhone(account.phone)}. It expires in 5 minutes.</p>
                </div>
                <Input label="Verification code" inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={otp} onChange={(e) => { setOtp(e.target.value.replace(/\D/g, '')); setError(''); }} error={error} autoFocus className="[&_input]:text-center [&_input]:font-mono [&_input]:text-lg [&_input]:tracking-[0.5em]" />
                <Button type="submit" className="w-full" size="lg">Verify and sign in</Button>
                <button type="button" onClick={() => { setStep('credentials'); setOtp(''); setAccount(null); }} className="w-full text-center text-xs font-medium text-slate-500 hover:text-primary">Use a different account</button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
