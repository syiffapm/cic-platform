import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Camera, KeyRound, Lock, QrCode, ShieldCheck } from 'lucide-react';
import { Alert, Button, Card, CardBody, Input, Tabs } from '@/components/ui';
import { useI18n } from '@/i18n/I18nContext';
import { useStore } from '@/context/StoreContext';
import PageHero, { PageBody } from '../../components/PageHero';
import { verifyReport } from '../../data/verifiableReports';
import VerifyResult from './VerifyResult';

const MAX_ATTEMPTS = 5;
const LOCK_SECONDS = 60;
const ID_PATTERN = /^CIC-(R-\d{4}-\d{4}|P-\d{6})-\d{4}$/;

/** Report authenticity check: valid / revoked / not found — no report content. */
export default function VerifyPage() {
  const { t } = useI18n();
  const [params] = useSearchParams();
  const { reportRequests } = useStore();
  const [tab, setTab] = useState('manual');
  const [reportId, setReportId] = useState(params.get('id') ?? '');
  const [code, setCode] = useState(params.get('code') ?? '');
  const [errors, setErrors] = useState({});
  const [result, setResult] = useState(null);
  const [attempts, setAttempts] = useState(0);
  const [lockedUntil, setLockedUntil] = useState(0);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    if (!lockedUntil) return undefined;
    const timer = setInterval(() => {
      setNow(Date.now());
      if (Date.now() >= lockedUntil) { setLockedUntil(0); setAttempts(0); }
    }, 1000);
    return () => clearInterval(timer);
  }, [lockedUntil]);

  const locked = lockedUntil > now;
  const secondsLeft = Math.max(0, Math.ceil((lockedUntil - now) / 1000));

  const submit = (e) => {
    e.preventDefault();
    if (locked) return;
    const id = reportId.trim().toUpperCase();
    const errs = {};
    if (!ID_PATTERN.test(id)) errs.id = 'Enter the report ID exactly as printed on the report, e.g. CIC-P-260913-4417.';
    if (!/^\d{6}$/.test(code.trim())) errs.code = 'Enter the 6-digit verification code.';
    setErrors(errs);
    if (Object.keys(errs).length) return;
    const next = attempts + 1;
    setAttempts(next);
    if (next >= MAX_ATTEMPTS) { const until = Date.now() + LOCK_SECONDS * 1000; setLockedUntil(until); setNow(Date.now()); }
    setResult({ ...verifyReport(id, code, reportRequests), reportId: id });
  };

  return (
    <>
      <PageHero title={t('public.nav.verify')} subtitle="Check that a CIC credit report is genuine. We only confirm whether it is valid — we never show what the report contains." breadcrumbs={[{ label: t('public.nav.verify') }]} />
      <PageBody className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <div className="px-5 pt-2"><Tabs tabs={[{ id: 'manual', label: 'Enter report ID' }, { id: 'qr', label: 'Scan QR code' }]} value={tab} onChange={setTab} /></div>
            <CardBody>
              {tab === 'manual' ? (
                <form onSubmit={submit} noValidate className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-5">
                    <Input className="sm:col-span-3" label="Report ID" required value={reportId} onChange={(e) => setReportId(e.target.value)} placeholder="CIC-P-260913-4417" autoComplete="off" spellCheck={false} error={errors.id} hint="Printed at the top of every page of the report" />
                    <Input className="sm:col-span-2" label="6-digit code" required value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))} placeholder="••••••" inputMode="numeric" autoComplete="off" maxLength={6} error={errors.code} hint="Next to the QR code" />
                  </div>
                  {locked && <Alert tone="warning" title="Too many attempts">For security, please wait {secondsLeft} seconds before trying again.</Alert>}
                  <div className="flex flex-wrap items-center gap-3">
                    <Button type="submit" icon={ShieldCheck} disabled={locked}>Verify report</Button>
                    <p className="flex items-center gap-1 text-[11px] text-slate-500"><Lock className="h-3 w-3" aria-hidden="true" /> Limited to {MAX_ATTEMPTS} checks per minute to protect report holders.</p>
                  </div>
                </form>
              ) : (
                <div className="grid gap-5 sm:grid-cols-[auto,1fr] sm:items-center">
                  <div className="mx-auto flex h-40 w-40 items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50">
                    <QrCode className="h-16 w-16 text-slate-300" aria-hidden="true" />
                  </div>
                  <div className="space-y-3 text-sm text-slate-700">
                    <p className="font-semibold text-slate-900">Scan with your phone camera</p>
                    <ol className="list-decimal space-y-1.5 pl-5 text-sm">
                      <li>Open the camera app on your phone.</li>
                      <li>Point it at the QR code in the top-right corner of the report.</li>
                      <li>Tap the link that appears — it opens this page with the ID and code filled in.</li>
                    </ol>
                    <p className="text-xs text-slate-500">Check that the link starts with <span className="font-mono">cic.cbm.gov.mm/verify</span>. Scanning happens on your device; no image is uploaded.</p>
                    <Button variant="outline" size="sm" icon={Camera} onClick={() => setTab('manual')}>Camera not working? Enter the ID instead</Button>
                  </div>
                </div>
              )}
            </CardBody>
          </Card>
          {result && <VerifyResult result={result} reportId={result.reportId} />}
        </div>
        <aside className="space-y-4">
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <KeyRound className="h-5 w-5 text-teal-700" aria-hidden="true" />
            <p className="mt-2 text-sm font-semibold text-slate-900">What you will see</p>
            <ul className="mt-2 space-y-1.5 text-xs text-slate-600">
              <li><strong className="text-emerald-700">Valid</strong> — issued by CIC and still valid</li>
              <li><strong className="text-amber-700">Expired</strong> — older than its 30-day validity; ask for a new report</li>
              <li><strong className="text-red-700">Revoked</strong> — withdrawn; ask for a new report</li>
              <li><strong className="text-slate-800">Not found</strong> — no matching report</li>
            </ul>
            <p className="mt-3 text-xs text-slate-500">We also show the issue date and the institution it was issued to — never names, NRCs or loan details.</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-5 text-xs text-slate-600">
            <QrCode className="h-5 w-5 text-primary" aria-hidden="true" />
            <p className="mt-2 text-sm font-semibold text-slate-900">Where to find the ID and code</p>
            <p className="mt-1">Both are printed at the top of every CIC report, next to the QR code. A personal report ID looks like <span className="font-mono">CIC-P-260913-4417</span> and a lender report ID like <span className="font-mono">CIC-R-2026-0918-7731</span>; the verification code has 6 digits.</p>
            <p className="mt-2">Scanning the QR code with your phone camera fills both in for you.</p>
          </div>
        </aside>
      </PageBody>
    </>
  );
}
