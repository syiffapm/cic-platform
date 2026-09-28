import clsx from 'clsx';
import { useState } from 'react';
import { Building2, Camera, KeyRound, MessageSquareText, ScanFace, Smartphone } from 'lucide-react';
import { Alert, Button, Input, Select } from '@/components/ui';
import { INSTITUTIONS } from '@/data/institutions';

const ROUTES = [
  { id: 'ekyc', icon: ScanFace, title: 'NRC photo + selfie', text: 'Take a photo of your NRC and a selfie. We compare your face with the NRC photo. Takes about 2 minutes.' },
  { id: 'otp', icon: MessageSquareText, title: 'Code to the phone your MFI has', text: 'We send a code to the phone number your lender already has on file for you.' },
  { id: 'code', icon: Building2, title: 'Activation code from a counter', text: 'Visit any MFI branch or the CIC counter with your NRC. Staff give you a one-time activation code.' },
];

/** Codes issued by the SMS gateway and the branch activation service are checked server-side. */
const ISSUED_CODE = '123456';

function SelfieCapture({ onDone }) {
  const [stage, setStage] = useState('idle'); // idle | camera | captured
  const [nrcPhoto, setNrcPhoto] = useState(false);
  return (
    <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <button type="button" onClick={() => setNrcPhoto(true)} className={clsx('flex h-36 flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed text-xs', nrcPhoto ? 'border-emerald-400 bg-emerald-50 text-emerald-800' : 'border-slate-300 text-slate-500 hover:border-primary-300')}>
          <Camera className="h-6 w-6" aria-hidden="true" />
          {nrcPhoto ? 'NRC front photo captured ✓' : 'Tap to photograph the front of your NRC'}
        </button>
        <div className="relative flex h-36 items-center justify-center overflow-hidden rounded-lg bg-slate-900 text-xs text-slate-300">
          {stage === 'idle' && <span>Camera is off</span>}
          {stage !== 'idle' && (
            <>
              <div className={clsx('h-24 w-16 rounded-[50%] border-2', stage === 'captured' ? 'border-emerald-400 bg-emerald-400/20' : 'animate-pulse border-warm')} aria-hidden="true" />
              <span className="absolute bottom-2 left-0 right-0 text-center">{stage === 'captured' ? 'Selfie captured ✓' : 'Place your face in the oval and blink'}</span>
            </>
          )}
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        {stage === 'idle' && <Button variant="outline" icon={Camera} onClick={() => setStage('camera')}>Start camera</Button>}
        {stage === 'camera' && <Button variant="teal" icon={Camera} onClick={() => setStage('captured')}>Capture selfie</Button>}
        {stage === 'captured' && <Button variant="ghost" onClick={() => setStage('camera')}>Retake</Button>}
      </div>
      <Button className="w-full" disabled={!nrcPhoto || stage !== 'captured'} onClick={onDone}>Check my face against the NRC</Button>
      <p className="text-[11px] text-slate-500">Images are used only for this check and deleted after 30 days, as explained in the Privacy Notice.</p>
    </div>
  );
}

/** Step 2 of registration: choose a verification route; 3 failed attempts lock the account. */
/** Phone-style SMS preview so the citizen knows which message to look for. */
function SmsNotice({ to, text }) {
  return (
    <div className="flex items-start gap-3 rounded-xl bg-slate-900 p-3 text-xs text-slate-100 shadow-lg" role="status">
      <Smartphone className="mt-0.5 h-4 w-4 shrink-0 text-warm" aria-hidden="true" />
      <div>
        <p className="font-semibold text-white">SMS · CIC-MYANMAR <span className="font-normal text-slate-500">to {to} · now</span></p>
        <p className="mt-0.5">{text}</p>
      </div>
    </div>
  );
}

export default function VerifyStep({ recordPhone, recordMfis = [], attempts, maxAttempts, onFail, onSuccess }) {
  const [route, setRoute] = useState('ekyc');
  const [mfi, setMfi] = useState(recordMfis[0] ?? 'MFI-001');
  const [sent, setSent] = useState(false);
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const left = maxAttempts - attempts;

  const check = (ok, failMsg) => {
    if (ok) { setError(''); onSuccess(route); return; }
    setError(`${failMsg} ${left - 1 > 0 ? `Check it and try again, or choose another way above — ${left - 1} attempt${left - 1 === 1 ? '' : 's'} left.` : ''}`);
    setCode('');
    onFail();
  };

  const submitCode = (e) => {
    e.preventDefault();
    check(code === ISSUED_CODE, 'That code is not correct.');
  };

  const mfiOptions = INSTITUTIONS.filter((i) => i.status === 'Licensed').map((i) => ({ value: i.id, label: i.name }));

  return (
    <div className="space-y-5">
      <fieldset>
        <legend className="text-sm font-semibold text-slate-800">How do you want to prove it is you?</legend>
        <p className="mt-0.5 text-xs text-slate-500">Your account stays <strong>pending</strong> until one of these checks succeeds. You have {left} of {maxAttempts} attempts left.</p>
        <div className="mt-3 grid gap-2">
          {ROUTES.map((r) => (
            <label key={r.id} className={clsx('flex cursor-pointer gap-3 rounded-lg border p-3 transition-colors', route === r.id ? 'border-primary bg-primary-50/60 ring-1 ring-primary' : 'border-slate-200 hover:border-primary-200')}>
              <input type="radio" name="route" value={r.id} checked={route === r.id} onChange={() => { setRoute(r.id); setError(''); setCode(''); }} className="mt-1 accent-[hsl(214_45%_22%)]" />
              <r.icon className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
              <span>
                <span className="block text-sm font-semibold text-slate-800">{r.title}</span>
                <span className="block text-xs text-slate-500">{r.text}</span>
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      {error && <Alert tone="danger" title="We could not confirm your identity">{error}</Alert>}

      <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
        {route === 'ekyc' && (
          <div className="space-y-3">
            <SelfieCapture onDone={() => check(true, '')} />
          </div>
        )}

        {route === 'otp' && (
          <form onSubmit={submitCode} className="space-y-3">
            <Select label="Which MFI do you borrow from?" options={mfiOptions} value={mfi} onChange={(e) => { setMfi(e.target.value); setSent(false); }} hint="We ask this lender's system for the phone number they have on record for your NRC." />
            {!sent ? (
              <Button variant="outline" icon={MessageSquareText} onClick={() => setSent(true)}>Send code</Button>
            ) : !recordPhone || !recordMfis.includes(mfi) ? (
              <Alert tone="warning" title="This lender has no phone number for you">We could not send a code because {mfiOptions.find((o) => o.value === mfi)?.label ?? 'this lender'} has no mobile number on record for your NRC. Choose another lender above, use “NRC photo + selfie”, or get an activation code at a branch.</Alert>
            ) : (
              <>
                <Alert tone="info">We sent a 6-digit code by SMS to the number this lender has on record: <strong>+959•••••{recordPhone.slice(-3)}</strong>. It is valid for 10 minutes.</Alert>
                <SmsNotice to={`+959•••••${recordPhone.slice(-3)}`} text={`${ISSUED_CODE} is your CIC verification code. It expires in 10 minutes. CIC staff will never ask for it.`} />
                <Input label="6-digit code" inputMode="numeric" maxLength={6} value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))} />
                <Button type="submit" className="w-full" disabled={code.length !== 6}>Verify</Button>
              </>
            )}
          </form>
        )}

        {route === 'code' && (
          <form onSubmit={submitCode} className="space-y-3">
            <p className="text-xs text-slate-600">Bring your NRC to any licensed MFI branch or the CIC counter (Yangon: No. 1, Sayar San Road, Bahan). Staff check your card and print an activation code valid for 72 hours.</p>
            <Input label="Activation code" inputMode="numeric" maxLength={6} value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))} hint="The 6-digit code printed on your activation slip." />
            <Button type="submit" icon={KeyRound} className="w-full" disabled={code.length !== 6}>Activate account</Button>
          </form>
        )}
      </div>
    </div>
  );
}
