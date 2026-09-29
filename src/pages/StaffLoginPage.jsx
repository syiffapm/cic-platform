import clsx from 'clsx';
import { useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Building2, ChevronDown, Fingerprint, KeyRound, Landmark, Lock, ShieldAlert } from 'lucide-react';
import { DEMO_USERS, ROLES } from '@/data/roles';
import { useAuth } from '@/context/AuthContext';
import { useStore } from '@/context/StoreContext';
import { Alert, Button, Input } from '@/components/ui';
import BrandMark from '@/components/layout/BrandMark';
import { WORKSPACES } from '@/config/app';

const HOME = { mfi: '/mfi', gov: '/gov' };
const WORKSPACE = { mfi: 'MFI Member Portal', gov: 'Government Portal' };
const ORG = { mfi: 'Licensed microfinance institutions', gov: 'Central Bank of Myanmar (FRD) and CIC — supervision, content and platform administration' };
const STAFF = DEMO_USERS.filter((u) => WORKSPACES.includes(u.portal));
const MAX_ATTEMPTS = 5;
const roleName = (id) => ROLES.find((r) => r.id === id)?.name;

/**
 * Staff workspace sign-in (workforce identity). Separate address and look from the citizen site:
 * work email + password + authenticator app. The account's role decides the workspace and menus.
 */
export default function StaffLoginPage() {
  const { signInUser } = useAuth();
  const { logAudit } = useStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [attempts, setAttempts] = useState(0);
  const [pending, setPending] = useState(null);
  const [otp, setOtp] = useState('');
  const [showTraining, setShowTraining] = useState(false);
  const locked = attempts >= MAX_ATTEMPTS;

  const submit = (e) => {
    e.preventDefault();
    if (locked) return;
    const user = STAFF.find((u) => u.email.toLowerCase() === email.trim().toLowerCase());
    if (!user || password !== 'Cic@2026') {
      const left = MAX_ATTEMPTS - attempts - 1;
      setAttempts((a) => a + 1);
      setError(left > 0 ? `Invalid work email or password. ${left} attempt${left === 1 ? '' : 's'} left.` : 'Account locked after 5 failed attempts. Contact your administrator.');
      logAudit({ actor: email || 'Unknown', role: '—', tenant: '—', action: 'LOGIN_FAILED', module: 'IAM (workforce)', target: email, outcome: 'Denied' });
      return;
    }
    setError('');
    setPending(user);
  };

  const verify = (e) => {
    e.preventDefault();
    if (!/^\d{6}$/.test(otp)) { setError('Enter the 6-digit code from your authenticator app.'); return; }
    signInUser(pending.portal, pending);
    logAudit({ actor: pending.name, role: pending.role, tenant: pending.tenant ?? (pending.role.startsWith('gov_') ? 'CBM' : 'CIC'), action: 'LOGIN_SUCCESS', module: 'IAM (workforce)', target: pending.id, outcome: 'Success' });
    const from = location.state?.from;
    navigate(from?.startsWith(HOME[pending.portal]) ? from : HOME[pending.portal], { replace: true });
  };

  const groups = useMemo(() => WORKSPACES.map((p) => ({ p, users: STAFF.filter((u) => u.portal === p) })), []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="gov-pattern pointer-events-none fixed inset-0 opacity-40" />
      <header className="relative border-b border-white/10">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <BrandMark light subtitle="Secure Staff Workspace" />
          <span className="hidden items-center gap-1.5 rounded-full border border-amber-400/30 bg-amber-400/10 px-3 py-1 text-[11px] font-semibold text-amber-300 sm:flex">
            <ShieldAlert className="h-3.5 w-3.5" /> Authorised personnel only
          </span>
        </div>
      </header>

      <main id="main" className="relative mx-auto grid max-w-6xl gap-10 px-6 py-12 lg:grid-cols-[1.1fr_1fr] lg:py-20">
        <section>
          <p className="text-xs font-semibold uppercase tracking-widest text-warm">workspace.cic.gov.mm</p>
          <h1 className="mt-3 text-3xl font-bold leading-tight text-white">CIC Staff Workspace</h1>
          <p className="mt-3 max-w-lg text-sm text-slate-500">For staff of the Credit Information Center, the Central Bank of Myanmar and licensed institutions. Citizens sign in on the public website instead.</p>
          <ul className="mt-8 space-y-3">
            {[['gov', Landmark], ['mfi', Building2]].map(([p, Icon]) => (
              <li key={p} className="flex items-start gap-3 rounded-xl border border-white/10 bg-white/5 p-4">
                <Icon className="mt-0.5 h-5 w-5 text-warm" />
                <div>
                  <p className="text-sm font-semibold text-white">{WORKSPACE[p]}</p>
                  <p className="text-xs text-slate-500">{ORG[p]}</p>
                </div>
              </li>
            ))}
          </ul>
          <p className="mt-6 text-xs text-slate-500">Your role decides which workspace opens and what you can see. Access is limited to approved networks and every action is recorded in a tamper-evident audit log.</p>
        </section>

        <section className="rounded-2xl border border-white/10 bg-white p-7 text-slate-800 shadow-2xl">
          {!pending ? (
            <form onSubmit={submit} className="space-y-5" noValidate>
              <div>
                <h2 className="flex items-center gap-2 text-xl font-bold text-slate-900"><Lock className="h-5 w-5 text-primary" /> Staff sign-in</h2>
                <p className="mt-1 text-sm text-slate-500">Use your organisation email.</p>
              </div>
              <Input label="Work email" type="email" placeholder="name@cbm.gov.mm · name@cic.gov.mm · name@your-mfi.org.mm" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="username" required />
              <Input label="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" required />
              {error && <Alert tone="danger">{error}</Alert>}
              <Button type="submit" className="w-full" size="lg" disabled={locked || !email || !password}>Continue</Button>
              <p className="text-center text-xs text-slate-500">Forgot your password or lost your authenticator? Ask your institution administrator or the CIC service desk.</p>

              <div className="rounded-xl border border-dashed border-slate-300">
                <button type="button" onClick={() => setShowTraining((s) => !s)} aria-expanded={showTraining} className="flex w-full items-center justify-between px-4 py-2.5 text-xs font-medium text-slate-500">
                  Training environment accounts (password Cic@2026)
                  <ChevronDown className={clsx('h-4 w-4 transition', showTraining && 'rotate-180')} />
                </button>
                {showTraining && (
                  <div className="max-h-64 space-y-3 overflow-y-auto border-t border-slate-200 px-4 py-3 scrollbar-thin">
                    {groups.map((g) => (
                      <div key={g.p}>
                        <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">{WORKSPACE[g.p]}</p>
                        {g.users.map((u) => (
                          <button key={u.id} type="button" onClick={() => { setEmail(u.email); setPassword('Cic@2026'); setError(''); setAttempts(0); }} className="flex w-full items-center justify-between gap-2 rounded-md px-2 py-1 text-left text-xs hover:bg-slate-50">
                            <span className="font-medium text-slate-700">{u.name}</span>
                            <span className="truncate text-[11px] text-slate-500">{roleName(u.role)}</span>
                          </button>
                        ))}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </form>
          ) : (
            <form onSubmit={verify} className="space-y-5">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-50 text-primary"><Fingerprint className="h-6 w-6" /></div>
              <div>
                <h2 className="text-xl font-bold text-slate-900">Authenticator code</h2>
                <p className="mt-1 text-sm text-slate-500">Open your authenticator app and enter the 6-digit code for CIC Workspace.</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs">
                <p className="font-semibold text-slate-800">{pending.name}</p>
                <p className="text-slate-500">{roleName(pending.role)} · opens <b>{WORKSPACE[pending.portal]}</b></p>
              </div>
              <Input label="Code" inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={otp} onChange={(e) => { setOtp(e.target.value.replace(/\D/g, '')); setError(''); }} error={error} autoFocus className="[&_input]:text-center [&_input]:font-mono [&_input]:text-lg [&_input]:tracking-[0.5em]" />
              <Button type="submit" className="w-full" size="lg" icon={KeyRound}>Verify and open workspace</Button>
              <button type="button" onClick={() => { setPending(null); setOtp(''); }} className="w-full text-center text-xs font-medium text-slate-500 hover:text-primary">Use a different account</button>
            </form>
          )}
        </section>
      </main>
    </div>
  );
}
