import clsx from 'clsx';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { KeyRound, LogOut, MonitorSmartphone, ShieldCheck, UserRound, UserRoundX } from 'lucide-react';
import { Alert, Badge, Button, Card, CardBody, CardHeader, Input, Modal, PageHeader, useToast } from '@/components/ui';
import { useAuth } from '@/context/AuthContext';
import { useStore } from '@/context/StoreContext';
import ConfirmDialog from '../../components/ConfirmDialog';
import { maskNrc, maskPhone } from '@/lib/format';
import { SESSIONS } from '../../data/portalMock';
import { AuditFootnote, Fact } from '../../components/Common';
import { PASSWORD_RULES } from '@/lib/password';
import { isOpenDispute, useBorrower, useBorrowerAudit, useOwnApplications, useOwnDisputes, usePersistentState } from '../../lib/borrower';
import Representatives from './Representatives';

const MFA = [
  { id: 'sms', label: 'SMS code to my phone', text: 'A 6-digit code by SMS each time you sign in.' },
  { id: 'app', label: 'Authenticator app', text: 'Works without phone signal. Use Google Authenticator or similar.' },
];

/** Profile & security. */
export default function ProfilePage() {
  const user = useBorrower();
  const audit = useBorrowerAudit();
  const toast = useToast();
  const [mfa, setMfa] = usePersistentState('mfa', 'sms');
  const [sessions, setSessions] = useState(() => SESSIONS.map((s) => (s.current ? { ...s, ip: user?.ip ?? s.ip } : s)));
  const [pwOpen, setPwOpen] = useState(false);
  const [pw, setPw] = useState({ current: '', next: '', confirm: '' });
  const [closeOpen, setCloseOpen] = useState(false);
  const { accounts, patch } = useStore();
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const openDisputes = useOwnDisputes().filter(isOpenDispute);
  const openApps = useOwnApplications().filter((a) => ['Submitted', 'Credit check', 'Approved'].includes(a.status));
  const closeBlocked = openDisputes.length > 0 || openApps.length > 0;

  const closeAccount = () => {
    const acc = accounts.find((a) => a.borrowerId === user?.borrowerId);
    if (acc) patch('accounts', acc.id, { status: 'Closed', closedAt: new Date().toISOString() });
    audit('ACCOUNT_CLOSE', user?.borrowerId, { purpose: 'Closed by the account holder' });
    setCloseOpen(false);
    signOut('borrower');
    toast('Your online account is closed. You can register again at any time with your NRC.', 'success');
    navigate('/');
  };

  const pwValid = pw.current.length > 0 && PASSWORD_RULES.every((r) => r.test(pw.next)) && pw.next === pw.confirm && pw.next !== pw.current;

  const changePw = () => {
    audit('PASSWORD_CHANGE', user?.id, { purpose: 'Self-service' });
    toast('Password changed. Other devices have been signed out.', 'success');
    setSessions((s) => s.filter((x) => x.current));
    setPwOpen(false); setPw({ current: '', next: '', confirm: '' });
  };

  const changeMfa = (id) => {
    setMfa(id);
    audit('MFA_METHOD_CHANGE', user?.id, { purpose: id === 'app' ? 'Authenticator app' : 'SMS' });
    toast('Sign-in method updated.', 'success');
  };

  const endSession = (s) => {
    setSessions((list) => list.filter((x) => x.id !== s.id));
    audit('SESSION_REVOKE', s.id, { purpose: s.device });
  };

  return (
    <div>
      <PageHeader title="Profile & security" subtitle="Your details, how you sign in, and who else can act for you." />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title="Personal details" subtitle="Taken from your verified NRC. To change them, send a rectification request." icon={UserRound} />
          <CardBody>
            <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Fact label="Name" value={user?.name} />
              <Fact label="NRC" value={maskNrc(user?.nrc ?? '')} help="Hidden in part for your safety. Only the last 4 digits are shown." />
              <Fact label="Mobile" value={maskPhone(user?.phone ?? '')} help="Where we send sign-in codes and SMS alerts. Changing it needs a new identity check." />
              <Fact label="Email" value={user?.email ?? '—'} />
              <Fact label="CIC file number" value={<span className="font-mono">{user?.borrowerId}</span>} />
              <Fact label="Account status" value={<Badge status="Verified" />} />
            </dl>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Sign-in & security" icon={ShieldCheck} />
          <CardBody className="space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="text-sm font-medium text-slate-800">Password</p>
                <p className="text-xs text-slate-500">Last changed 14 Jun 2026</p>
              </div>
              <Button size="sm" variant="outline" icon={KeyRound} onClick={() => setPwOpen(true)}>Change password</Button>
            </div>
            <fieldset>
              <legend className="text-sm font-medium text-slate-800">Second sign-in step (always on)</legend>
              <p className="text-xs text-slate-500">Needed every time you sign in. You will be signed out after 10 minutes without activity.</p>
              <div className="mt-2 grid gap-2">
                {MFA.map((m) => (
                  <label key={m.id} className={clsx('flex cursor-pointer gap-3 rounded-lg border p-3', mfa === m.id ? 'border-primary bg-primary-50/60 ring-1 ring-primary' : 'border-slate-200')}>
                    <input type="radio" name="mfa" checked={mfa === m.id} onChange={() => changeMfa(m.id)} className="mt-1 accent-[hsl(214_45%_22%)]" />
                    <span><span className="block text-sm font-semibold text-slate-800">{m.label}</span><span className="block text-xs text-slate-500">{m.text}</span></span>
                  </label>
                ))}
              </div>
            </fieldset>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Where you are signed in" subtitle="Sign out any device you don't recognise." icon={MonitorSmartphone} />
          <ul className="divide-y divide-slate-100">
            {sessions.map((s) => (
              <li key={s.id} className="flex flex-wrap items-center justify-between gap-2 px-5 py-3">
                <div className="text-sm">
                  <p className="font-medium text-slate-800">{s.device} {s.current && <Badge tone="green">This device</Badge>}</p>
                  <p className="text-xs text-slate-500">{s.location} · IP {s.ip} · {s.lastActive}</p>
                </div>
                {!s.current && <Button size="sm" variant="ghost" icon={LogOut} onClick={() => endSession(s)}>Sign out</Button>}
              </li>
            ))}
          </ul>
        </Card>

        <Representatives />

        <Card className="lg:col-span-2">
          <CardHeader title="Close my online account" subtitle="Stop using this website. Your credit file at CIC stays — lenders must keep reporting your loans by law." icon={UserRoundX} />
          <CardBody className="space-y-3">
            {closeBlocked ? (
              <Alert tone="warning" title="You cannot close your account yet">
                You have {openDisputes.length ? `${openDisputes.length} open dispute${openDisputes.length > 1 ? 's' : ''}` : ''}{openDisputes.length && openApps.length ? ' and ' : ''}{openApps.length ? `${openApps.length} loan application${openApps.length > 1 ? 's' : ''} in progress` : ''}.
                {openApps.length ? 'Withdraw the application or wait for the lender\'s decision' : 'Wait until the case is closed'}{openDisputes.length && openApps.length ? ', and wait until every dispute is closed' : ''}, then come back here — so we can still reach you about the outcome.
              </Alert>
            ) : (
              <p className="text-sm text-slate-600">You will be signed out and can no longer see your report, alerts or consents online. You can register again later with your NRC.</p>
            )}
            <Button variant="outline" icon={UserRoundX} disabled={closeBlocked} onClick={() => setCloseOpen(true)} className="border-red-300 text-red-700 hover:bg-red-50">Close my account</Button>
          </CardBody>
        </Card>
      </div>

      <ConfirmDialog
        open={closeOpen}
        onClose={() => setCloseOpen(false)}
        onConfirm={closeAccount}
        title="Close your online account?"
        subtitle={user?.name}
        confirmLabel="Close my account"
        cancelLabel="Keep my account"
        icon={UserRoundX}
        consequence="This cannot be undone. Your alerts, saved settings and representatives are removed. To use this website again you must register and confirm your identity again."
      >
        <p>You will be signed out on every device straight away. Your credit file stays at CIC and lenders can still check it with your consent.</p>
      </ConfirmDialog>

      <Modal
        open={pwOpen}
        onClose={() => setPwOpen(false)}
        title="Change password"
        size="sm"
        footer={<><Button variant="outline" onClick={() => setPwOpen(false)}>Cancel</Button><Button onClick={changePw} disabled={!pwValid}>Change password</Button></>}
      >
        <div className="space-y-3">
          <Input label="Current password" type="password" autoComplete="current-password" value={pw.current} onChange={(e) => setPw({ ...pw, current: e.target.value })} />
          <Input label="New password" type="password" autoComplete="new-password" value={pw.next} onChange={(e) => setPw({ ...pw, next: e.target.value })} />
          <Input label="Confirm new password" type="password" autoComplete="new-password" value={pw.confirm} onChange={(e) => setPw({ ...pw, confirm: e.target.value })} error={pw.confirm && pw.confirm !== pw.next ? 'Passwords do not match.' : undefined} />
          <ul className="grid gap-1 text-xs">
            {PASSWORD_RULES.map((r) => <li key={r.id} className={r.test(pw.next) ? 'text-emerald-700' : 'text-slate-500'}>{r.test(pw.next) ? '✓' : '○'} {r.label}</li>)}
          </ul>
        </div>
      </Modal>

      <AuditFootnote action="Every security change" />
    </div>
  );
}
