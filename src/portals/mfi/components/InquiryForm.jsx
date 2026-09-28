import clsx from 'clsx';
import { useState } from 'react';
import { FileSignature, Search } from 'lucide-react';
import { Alert, Button, Card, CardBody, CardHeader, Checkbox, Input, Select, Tabs } from '@/components/ui';
import { PURPOSE_CODES } from '@/data/reference';
import { parseNrc } from '@/lib/nrc';

const MODES = [
  { id: 'nrc', label: 'NRC' },
  { id: 'id', label: 'Borrower ID' },
];

/**
 * Credit inquiry form (NRC or CIC borrower ID). Purpose and consent are mandatory: the submit button stays disabled
 * until a purpose is chosen and consent is confirmed with a reference number or an uploaded signed form.
 */
export default function InquiryForm({ onSubmit, busy }) {
  const [mode, setMode] = useState('nrc');
  const [nrc, setNrc] = useState('');
  const [borrowerId, setBorrowerId] = useState('');
  const [purpose, setPurpose] = useState('');
  const [consent, setConsent] = useState(false);
  const [consentRef, setConsentRef] = useState('');
  const [consentFile, setConsentFile] = useState('');
  const [touched, setTouched] = useState(false);

  const nrcCheck = nrc ? parseNrc(nrc) : null;
  const identityOk = mode === 'nrc' ? nrcCheck?.valid : /^BRW-\d{6}$/i.test(borrowerId.trim());
  const consentOk = consent && (consentRef.trim().length >= 5 || !!consentFile);
  const ready = identityOk && !!purpose && consentOk;

  const submit = (e) => {
    e.preventDefault();
    setTouched(true);
    if (!ready) return;
    const query = mode === 'nrc' ? { mode, value: nrcCheck.normalised } : { mode, value: borrowerId.trim().toUpperCase() };
    onSubmit({ query, purpose, consentRef: consentRef.trim() || `UPLOAD:${consentFile}` });
  };

  return (
    <Card>
      <CardHeader title="Search the registry" subtitle="Every inquiry is logged with purpose, consent reference, rule version and data date." icon={Search} />
      <form onSubmit={submit} noValidate>
        <CardBody className="space-y-5">
          <Tabs tabs={MODES} value={mode} onChange={setMode} />
          {mode === 'nrc' && (
            <Input
              label="NRC number" required value={nrc} onChange={(e) => setNrc(e.target.value)} placeholder="12/OUKAMA(N)245781"
              error={nrc && !nrcCheck?.valid ? nrcCheck?.error : undefined}
              hint={nrcCheck?.valid ? `Valid: state ${nrcCheck.state}, township ${nrcCheck.township}, ${nrcCheck.typeLabel}` : 'Format: state/township(type)number, e.g. 12/OUKAMA(N)245781. Myanmar digits are accepted and normalised.'}
            />
          )}
          {mode === 'id' && (
            <Input label="CIC borrower ID" required value={borrowerId} onChange={(e) => setBorrowerId(e.target.value)} placeholder="BRW-000184" error={borrowerId && !identityOk ? 'Format: BRW- followed by 6 digits' : undefined} />
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <Select
              label="Purpose of inquiry" required value={purpose} onChange={(e) => setPurpose(e.target.value)} placeholder="Select a purpose…"
              options={PURPOSE_CODES.map((p) => ({ value: p.code, label: `${p.code} — ${p.label}` }))}
              error={touched && !purpose ? 'A purpose code is mandatory' : undefined}
            />
            <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-[11px] text-slate-600">
              <p className="font-medium text-slate-800">Report and price are chosen after the match</p>
              <p className="mt-0.5">Basic USD 2 or Full USD 4, unlocked for everyone at your institution for 30 days. No charge when there is no record or when a colleague has already unlocked the report.</p>
            </div>
          </div>

          <div className={clsx('space-y-3 rounded-lg border p-4', consentOk ? 'border-emerald-200 bg-emerald-50/50' : 'border-amber-200 bg-amber-50/50')}>
            <p className="flex items-center gap-2 text-sm font-semibold text-slate-800"><FileSignature className="h-4 w-4" aria-hidden="true" /> Borrower consent</p>
            <Checkbox checked={consent} onChange={(e) => setConsent(e.target.checked)} label="Signed borrower consent is on file for this inquiry" description="Consent template v2 (ANN-2026-025). Inquiries without consent are blocked and may lead to sanctions." />
            <div className="grid gap-3 sm:grid-cols-2">
              <Input label="Consent reference number" value={consentRef} onChange={(e) => setConsentRef(e.target.value)} placeholder="CNS-PGMF-24410" disabled={!consent} />
              <label className="block space-y-1.5">
                <span className="block text-xs font-medium text-slate-700">…or upload signed form (PDF/JPG)</span>
                <input type="file" accept=".pdf,.jpg,.jpeg,.png" disabled={!consent} onChange={(e) => setConsentFile(e.target.files?.[0]?.name ?? '')} className="block w-full text-xs text-slate-600 file:mr-3 file:rounded-md file:border-0 file:bg-primary file:px-3 file:py-2 file:text-xs file:font-medium file:text-white disabled:opacity-50" />
              </label>
            </div>
          </div>

          {!consentOk && (
            <Alert tone="warning" title="Inquiry blocked until consent is captured">Tick the consent box and enter the consent reference number or upload the signed form.</Alert>
          )}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-[11px] text-slate-500">Rule set GR-2026.2 · data as of 31 Aug 2026 · searching is free; you pay only for the report you choose.</p>
            <Button type="submit" icon={Search} disabled={!ready || busy}>{busy ? 'Searching…' : 'Search registry'}</Button>
          </div>
        </CardBody>
      </form>
    </Card>
  );
}
