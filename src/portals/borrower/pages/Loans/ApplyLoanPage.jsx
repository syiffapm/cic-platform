import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { FileSearch, Send, ShieldCheck } from 'lucide-react';
import { Alert, Button, Card, CardBody, Checkbox, PageHeader, Stepper, useToast } from '@/components/ui';
import { useStore } from '@/context/StoreContext';
import { formatDate, formatMMK, maskNrc } from '@/lib/format';
import { AuditFootnote, StickyActions } from '../../components/Common';
import { addDays, isoDate, stamp, useBorrower, useBorrowerAudit, useOwnApplications, useOwnState } from '../../lib/borrower';
import { useMyFile } from '../../lib/myFile';
import { useReportRequests } from '../../lib/reports';
import ChooseLender from './ChooseLender';
import LoanDetailsStep, { affordability } from './LoanDetailsStep';

const STEPS = ['Choose a lender', 'Loan details', 'Consent & submit'];
const rand5 = () => String(Math.floor(10000 + Math.random() * 90000));

/** Lender chosen on the public MFI profile before signing in (the query string is lost on the sign-in redirect). */
function savedChoice() {
  try { return sessionStorage.getItem('cic.applyMfi'); } catch { return null; }
}

/** Online loan application to a licensed MFI, with a one-time, purpose-bound consent to a CIC credit check. */
export default function ApplyLoanPage() {
  const user = useBorrower();
  const audit = useBorrowerAudit();
  const toast = useToast();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { institutions, loanApplications, add } = useStore();
  const { file, loans } = useMyFile();
  const { snapshot: report } = useReportRequests();
  const mine = useOwnApplications();
  const [, setAlerts] = useOwnState('alerts');
  const [presetId] = useState(() => params.get('mfi') ?? savedChoice());
  const preset = institutions.find((i) => i.id === presetId && i.status === 'Licensed');
  useEffect(() => { try { sessionStorage.removeItem('cic.applyMfi'); } catch { /* storage unavailable */ } }, []);

  const [step, setStep] = useState(preset ? 1 : 0);
  const [mfiId, setMfiId] = useState(preset?.id ?? '');
  const [form, setForm] = useState({
    product: '', amount: '', tenor: '12', purpose: '', monthlyIncome: '',
    occupation: file?.occupation ?? '', township: file?.township ?? '',
  });
  const [agree, setAgree] = useState(false);
  const [accurate, setAccurate] = useState(false);

  const mfi = institutions.find((i) => i.id === mfiId);
  const active = loans.filter((l) => l.status === 'Active');
  const pendingSame = mine.find((a) => a.mfiId === mfiId && ['Submitted', 'Credit check', 'Approved'].includes(a.status));

  const submit = () => {
    const now = new Date();
    const nextNo = Math.max(0, ...loanApplications.map((a) => Number(a.id.split('-').pop()) || 0)) + 1;
    const id = `LAP-${now.getFullYear()}-${String(nextNo).padStart(5, '0')}`;
    const consentRef = `CNS-${mfi.short}-${rand5()}`;
    const at = stamp(now);
    add('loanApplications', {
      id, borrowerId: user.borrowerId, mfiId, product: form.product, amount: Number(form.amount), tenor: Number(form.tenor), purpose: form.purpose.trim(),
      applicant: { name: user.name, nrc: user.nrc ?? file?.nrc, phone: user.phone ?? file?.phone, township: form.township, occupation: form.occupation.trim(), monthlyIncome: Number(form.monthlyIncome) },
      consent: { ref: consentRef, grantedAt: at, expiresAt: isoDate(addDays(now, 30)), scope: 'One credit report (Basic or Full) for this application' },
      channel: 'Borrower portal', status: 'Submitted', submittedAt: at, decision: null, inquiryId: null, loanId: null,
      history: [{ at, by: user.name, action: 'Application submitted with consent to a credit check' }],
    });
    audit('CONSENT_GRANT', consentRef, { purpose: `One credit check by ${mfi.short} for ${id}` });
    audit('LOAN_APPLICATION_SUBMIT', id, { purpose: `${form.product} ${formatMMK(Number(form.amount))} to ${mfi.short}` });
    setAlerts((list) => [{ id: `ALT-${id}`, type: 'loan', title: `Application ${id} sent to ${mfi.name}`, body: `${mfi.short} may check your credit report once, until ${formatDate(addDays(now, 30))}.`, at, read: false, link: `/borrower/loans/${id}` }, ...(Array.isArray(list) ? list : [])]);
    toast(`Application ${id} sent to ${mfi.name}. We will text you when it changes.`, 'success');
    navigate(`/borrower/loans/${id}?new=1`);
  };

  const aff = affordability(form, active);

  return (
    <div>
      <PageHeader
        title="Apply for a loan"
        subtitle="Apply online to a licensed microfinance institution. You decide which lender may check your CIC credit report."
        breadcrumbs={[{ label: 'My loans', to: '/borrower/loans' }, { label: 'Apply' }]}
      />
      <Card>
        <CardBody className="space-y-6">
          <Stepper steps={STEPS} current={step} />

          {step === 0 && <ChooseLender institutions={institutions} value={mfiId} onChange={setMfiId} onNext={() => setStep(1)} homeRegion={file?.region} />}

          {step > 0 && mfi && (
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-primary-50 px-4 py-2.5 text-sm">
              <p>Applying to <strong>{mfi.name}</strong> <span className="text-xs text-slate-500">· {mfi.township}, {mfi.region}</span></p>
              <button type="button" className="inline-flex min-h-[24px] items-center text-xs font-semibold text-primary hover:underline" onClick={() => { setStep(0); setAgree(false); }}>Change lender</button>
            </div>
          )}
          {step > 0 && pendingSame && <Alert tone="warning" title="You already have an open application with this lender">{pendingSame.id} ({pendingSame.status}). You can still apply, but the lender may ask you to withdraw one of them.</Alert>}

          {step === 1 && mfi && <LoanDetailsStep mfi={mfi} form={form} setForm={setForm} activeLoans={active} onBack={() => setStep(0)} onNext={() => setStep(2)} />}

          {step === 2 && mfi && (
            <div className="space-y-5">
              <dl className="grid grid-cols-2 gap-3 rounded-lg border border-slate-200 p-4 text-sm sm:grid-cols-4">
                <div><dt className="text-[11px] text-slate-500">Product</dt><dd className="font-semibold">{form.product}</dd></div>
                <div><dt className="text-[11px] text-slate-500">Amount</dt><dd className="font-semibold">{formatMMK(Number(form.amount))}</dd></div>
                <div><dt className="text-[11px] text-slate-500">Period</dt><dd className="font-semibold">{form.tenor} months</dd></div>
                <div><dt className="text-[11px] text-slate-500">Estimated instalment</dt><dd className="font-semibold">{formatMMK(aff.newInstalment)} / month</dd></div>
                <div className="col-span-2"><dt className="text-[11px] text-slate-500">Purpose</dt><dd>{form.purpose}</dd></div>
                <div><dt className="text-[11px] text-slate-500">Applicant</dt><dd>{user?.name}</dd></div>
                <div><dt className="text-[11px] text-slate-500">NRC</dt><dd>{maskNrc(user?.nrc ?? file?.nrc)}</dd></div>
              </dl>

              <section className="rounded-xl border-2 border-primary-200 bg-primary-50/40 p-5" aria-labelledby="consent-title">
                <h2 id="consent-title" className="flex items-center gap-2 text-base font-bold text-primary"><ShieldCheck className="h-5 w-5" aria-hidden="true" /> Your consent to a credit check</h2>
                <p className="mt-2 text-sm text-slate-700">To decide on your application, <strong>{mfi.name}</strong> needs to see your CIC credit report. They can only do this with your permission.</p>
                <ul className="mt-3 space-y-1.5 text-sm text-slate-700">
                  <li className="flex gap-2"><FileSearch className="mt-0.5 h-4 w-4 shrink-0 text-teal-700" aria-hidden="true" /> What they see: your loans, repayment history, guarantees and your CIC grade{report ? (report.grade ? ` — grade ${report.grade} on your report ${report.reportId}` : ' (your report shows no credit history yet)') : ''}.{!report && <> <Link to="/borrower/requests/new" className="font-semibold text-primary underline">Request your report</Link> to see your grade — the lender still checks it with your consent.</>}</li>
                  <li className="flex gap-2"><FileSearch className="mt-0.5 h-4 w-4 shrink-0 text-teal-700" aria-hidden="true" /> How often: <strong>once</strong>, only for this application. Valid for 30 days, until {formatDate(addDays(new Date(), 30))}.</li>
                  <li className="flex gap-2"><FileSearch className="mt-0.5 h-4 w-4 shrink-0 text-teal-700" aria-hidden="true" /> You will see the check in “Who viewed my report”. Withdrawing the application before the check cancels this consent.</li>
                </ul>
                <div className="mt-4 space-y-3 rounded-lg bg-white p-4">
                  <Checkbox checked={agree} onChange={(e) => setAgree(e.target.checked)} label={`I allow ${mfi.name} to view my CIC credit report once for this application — valid 30 days.`} />
                  <Checkbox checked={accurate} onChange={(e) => setAccurate(e.target.checked)} label="The information in this application is true and complete." description="Giving false information to a lender is an offence and may lead to your application being declined." />
                </div>
              </section>

              <StickyActions row className="sm:justify-between">
                <Button variant="outline" onClick={() => setStep(1)}>Back</Button>
                <Button icon={Send} onClick={submit} disabled={!agree || !accurate}>Submit application</Button>
              </StickyActions>
            </div>
          )}
        </CardBody>
      </Card>
      <p className="mt-3 text-xs text-slate-500">CIC passes your application to the lender. CIC does not approve loans and never charges you for applying.</p>
      <AuditFootnote action="Submitting an application and granting consent" />
    </div>
  );
}
