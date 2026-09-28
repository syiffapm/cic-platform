import clsx from 'clsx';
import { Mail, MessageSquareText } from 'lucide-react';
import { Button, Checkbox, Input } from '@/components/ui';
import { parseNrc } from '@/lib/nrc';
import { TOWNSHIPS } from '@/data/reference';
import { passwordOk } from '@/lib/password';
import PasswordRules from '@/components/layout/PasswordRules';
import { Explain, StickyActions } from '../../components/Common';

const STATES = ['', 'Kachin', 'Kayah', 'Kayin', 'Chin', 'Sagaing', 'Tanintharyi', 'Bago', 'Magway', 'Mandalay', 'Mon', 'Rakhine', 'Yangon', 'Shan', 'Ayeyarwady'];

export const PHONE_RE = /^\+959\d{7,9}$/;

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function accountValid(f) {
  return f.name.trim().length >= 3 && (!f.email || EMAIL_RE.test(f.email)) && parseNrc(f.nrc).valid && PHONE_RE.test(f.phone)
    && (f.delivery !== 'Email' || EMAIL_RE.test(f.email)) && passwordOk(f.password) && f.password === f.confirm && f.terms && f.privacy;
}

/** Step 1 of registration: NRC with live parsing, mobile, optional email, password, where to send the confirmation, consents. */
export default function AccountStep({ form, setForm, onNext, error }) {
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));
  const nrc = parseNrc(form.nrc);
  const township = nrc.valid ? TOWNSHIPS.find((t) => t.code === nrc.township) : null;
  const phoneOk = PHONE_RE.test(form.phone);

  return (
    <form className="space-y-5" onSubmit={(e) => { e.preventDefault(); if (accountValid(form)) onNext(); }} noValidate>
      {error}
      <Input label="Full name (as on your NRC)" required value={form.name} onChange={set('name')} placeholder="e.g. Daw Aye Aye Myint" autoComplete="name" hint="Include U, Daw, Ko or Ma if it is on your card." />
      <div>
        <Input
          label="NRC number"
          required
          value={form.nrc}
          onChange={set('nrc')}
          placeholder="e.g. 12/KAMATA(N)123456"
          autoComplete="off"
          error={form.nrc && !nrc.valid ? nrc.error : undefined}
          hint="Type it exactly as on your National Registration Card. Myanmar digits (၁၂) are accepted."
        />
        {nrc.valid && (
          <dl className="mt-2 grid grid-cols-2 gap-2 rounded-lg bg-teal-50 p-3 text-xs sm:grid-cols-4" aria-live="polite">
            <div><dt className="text-slate-500">State / Region</dt><dd className="font-semibold text-slate-800">{nrc.state} · {STATES[nrc.state]}</dd></div>
            <div><dt className="text-slate-500">Township code</dt><dd className="font-semibold text-slate-800">{nrc.township}{township ? ` (${township.name})` : ''}</dd></div>
            <div><dt className="text-slate-500">Type</dt><dd className="font-semibold text-slate-800">{nrc.typeLabel}</dd></div>
            <div><dt className="text-slate-500">Number</dt><dd className="font-semibold text-slate-800">{nrc.number}</dd></div>
          </dl>
        )}
        <Explain>Your NRC is how CIC finds the loans that belong to you. We never show your full NRC to anyone else, and lenders cannot see that you have an account here.</Explain>
      </div>

      <div>
        <Input
          label="Mobile number"
          required
          type="tel"
          inputMode="tel"
          value={form.phone}
          onChange={set('phone')}
          placeholder="+959421005678"
          error={form.phone.length > 4 && !phoneOk ? 'Use the format +959 followed by 7–9 digits.' : undefined}
          hint="We send your sign-in codes and alerts to this number."
        />
      </div>

      <Input
        label="Email (optional)"
        type="email"
        value={form.email}
        onChange={set('email')}
        placeholder="name@example.com"
        autoComplete="email"
        error={form.email && !EMAIL_RE.test(form.email) ? 'Check the email address.' : undefined}
        hint="For report copies and dispute updates. You can add it later."
      />

      <div className="space-y-3">
        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="Create a password" required type="password" autoComplete="new-password" value={form.password} onChange={set('password')} />
          <Input label="Confirm password" required type="password" autoComplete="new-password" value={form.confirm} onChange={set('confirm')} error={form.confirm && form.confirm !== form.password ? 'Passwords do not match.' : undefined} />
        </div>
        {form.password && <PasswordRules value={form.password} />}
        <p className="text-[11px] text-slate-500">You will use this password with your NRC or mobile number to sign in. Your account can be used once your identity is confirmed.</p>
      </div>

      <fieldset>
        <legend className="text-xs font-medium text-slate-700">Send my account confirmation by <span className="text-red-500" aria-hidden="true">*</span></legend>
        <p className="mt-0.5 text-[11px] text-slate-500">After we confirm your identity we send your account confirmation and user ID here. Then sign in on this website with the password you just created.</p>
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          {[['SMS', MessageSquareText, form.phone || 'your mobile number', true], ['Email', Mail, form.email || 'add an email above', EMAIL_RE.test(form.email)]].map(([id, Icon, to, enabled]) => (
            <label key={id} className={clsx('flex cursor-pointer items-start gap-3 rounded-lg border p-3 text-sm', form.delivery === id ? 'border-primary bg-primary-50/60 ring-1 ring-primary' : 'border-slate-200', !enabled && 'cursor-not-allowed opacity-50')}>
              <input type="radio" name="delivery" value={id} disabled={!enabled} checked={form.delivery === id} onChange={() => setForm((f) => ({ ...f, delivery: id }))} className="mt-1 accent-[hsl(214_45%_22%)]" />
              <span><span className="flex items-center gap-1.5 font-semibold text-slate-800"><Icon className="h-4 w-4" /> {id}</span><span className="block truncate text-xs text-slate-500">{to}</span></span>
            </label>
          ))}
        </div>
      </fieldset>

      <div className="space-y-3 rounded-lg border border-slate-200 p-4">
        <Checkbox
          checked={form.terms}
          onChange={set('terms')}
          label="I accept the Terms of Use"
          description="The portal is for looking at your own credit record only. Using someone else's NRC is an offence."
        />
        <Checkbox
          checked={form.privacy}
          onChange={set('privacy')}
          label="I agree to the Privacy Notice"
          description="CIC uses your NRC, phone and selfie (if chosen) only to confirm who you are. You can ask for a copy or deletion at any time."
        />
      </div>

      <StickyActions>
        <Button type="submit" size="lg" className="w-full" disabled={!accountValid(form)}>Continue to identity check</Button>
        {!accountValid(form) && <p className="text-center text-[11px] text-slate-600 sm:hidden">Fill in every required field and tick both boxes to continue.</p>}
      </StickyActions>
    </form>
  );
}
