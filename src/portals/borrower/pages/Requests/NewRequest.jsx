import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { FileSearch, Mail, MessageSquareText, Send, ShieldCheck } from 'lucide-react';
import { Alert, Button, Card, CardBody, CardHeader, Checkbox, PageHeader, Select, useToast } from '@/components/ui';
import { useStore } from '@/context/StoreContext';
import { getBorrowerFile } from '@/data/registry';
import { REQUEST_PURPOSES, runAutomatedChecks } from '@/lib/reportRequests';
import { formatMMK, maskNrc, maskPhone } from '@/lib/format';
import { AuditFootnote, ButtonLink, StickyActions } from '../../components/Common';
import { QuotaNote } from '../../components/ReportRequestCards';
import { stamp, useBorrower, useBorrowerAudit } from '../../lib/borrower';
import { useReportRequests } from '../../lib/reports';

const CORRECTED = 'After a dispute was corrected';
const nextId = (list) => `CRQ-2026-${String(Math.max(900, ...list.map((r) => Number(r.id.slice(-5)) || 0)) + 1).padStart(5, '0')}`;

/** Request my credit report: purpose, notification channel, fee notice, declaration → CIC validation queue. */
export default function NewRequest() {
  const user = useBorrower();
  const audit = useBorrowerAudit();
  const toast = useToast();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const store = useStore();
  const { add, patch, reportRequests, accounts, disputes } = store;
  const state = useReportRequests();
  const { quota, correctedDispute, block } = state;
  const account = accounts.find((a) => a.borrowerId === user?.borrowerId) ?? { nrc: user?.nrc, phone: user?.phone, email: '' };

  const asked = params.get('purpose');
  const [purpose, setPurpose] = useState(asked === 'corrected' && correctedDispute ? CORRECTED : REQUEST_PURPOSES.includes(asked) && asked !== CORRECTED ? asked : '');
  const [notify, setNotify] = useState('SMS');
  const [declare, setDeclare] = useState(false);
  const [busy, setBusy] = useState(false);

  const reissue = purpose === CORRECTED && !!correctedDispute;
  const blocked = block && !(block.kind === 'valid' && reissue);
  const purposes = REQUEST_PURPOSES.filter((p) => p !== CORRECTED || correctedDispute);
  const fee = reissue || quota.freeLeft ? 0 : quota.paidFee;

  const submit = () => {
    if (!purpose || !declare || blocked || busy) return;
    setBusy(true);
    const file = getBorrowerFile(user.borrowerId, store);
    const checks = runAutomatedChecks({ file, account, disputes, requests: reportRequests });
    const warnings = checks.filter((c) => c.result !== 'pass').length;
    const at = stamp();
    const id = nextId(reportRequests);
    add('reportRequests', {
      id, borrowerId: user.borrowerId, accountId: account.id ?? null, name: user.name, nrc: account.nrc ?? user.nrc,
      purpose, notify, fee, status: 'Validating', submittedAt: at, checks, reviewedBy: null, reviewedAt: null, result: null,
      history: [
        { at, by: user.name, action: `Report requested (${reissue ? 'free re-issue after corrected dispute' : fee ? `fee ${formatMMK(fee)} payable at approval` : 'free annual report'})` },
        { at, by: 'CIC system', action: `Automated validation completed — ${warnings ? `${warnings} warning${warnings > 1 ? 's' : ''}` : 'no issues'}` },
      ],
    });
    audit('REPORT_REQUESTED', id, { purpose });
    setTimeout(() => {
      patch('reportRequests', id, (r) => (r.status === 'Validating'
        ? { status: 'Pending review', history: [...r.history, { at: stamp(), by: 'CIC system', action: 'Queued for CIC officer review' }] }
        : {}));
    }, 1500);
    toast(`Request ${id} sent to CIC. We will notify you by ${notify}.`, 'success');
    navigate(`/borrower/requests/${id}`);
  };

  return (
    <div>
      <PageHeader
        title="Request my credit report"
        subtitle="CIC validates the data from every lender and an officer approves your report before it is issued — usually within 1 working day."
        breadcrumbs={[{ label: 'My report requests', to: '/borrower/requests' }, { label: 'New request' }]}
      />

      {blocked && (
        <Alert tone="info" title={block.kind === 'open' ? 'A request is already in progress' : 'You already have a valid report'} className="mb-6">
          <p>{block.text}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {block.kind === 'open'
              ? <ButtonLink to={`/borrower/requests/${state.open.id}`} size="sm">Track my request</ButtonLink>
              : <ButtonLink to="/borrower/report" size="sm">View my report</ButtonLink>}
          </div>
        </Alert>
      )}

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <Card>
          <CardHeader title="Your request" subtitle="Takes less than a minute." icon={FileSearch} />
          <CardBody className="space-y-5">
            <dl className="grid grid-cols-2 gap-3 rounded-lg bg-slate-50 p-4 text-sm sm:grid-cols-3">
              <div><dt className="text-[11px] text-slate-500">Name</dt><dd className="font-semibold">{user?.name}</dd></div>
              <div><dt className="text-[11px] text-slate-500">NRC</dt><dd className="font-semibold">{maskNrc(account.nrc ?? '')}</dd></div>
              <div><dt className="text-[11px] text-slate-500">CIC file</dt><dd className="font-mono font-semibold">{user?.borrowerId}</dd></div>
            </dl>

            <Select label="Why do you need the report?" required value={purpose} onChange={(e) => setPurpose(e.target.value)} options={purposes} placeholder="Choose a purpose" disabled={!!blocked} />

            <fieldset>
              <legend className="text-xs font-medium text-slate-700">How should we tell you it is ready? <span className="text-red-500" aria-hidden="true">*</span></legend>
              <div className="mt-2 grid gap-2 sm:grid-cols-2">
                {[['SMS', MessageSquareText, maskPhone(account.phone ?? '')], ['Email', Mail, account.email || 'No email on your account']].map(([ch, Icon, to]) => {
                  const disabled = ch === 'Email' && !account.email;
                  return (
                    <label key={ch} className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 text-sm ${notify === ch ? 'border-primary bg-primary-50/50' : 'border-slate-200'} ${disabled ? 'cursor-not-allowed opacity-50' : ''}`}>
                      <input type="radio" name="notify" value={ch} checked={notify === ch} disabled={disabled || !!blocked} onChange={() => setNotify(ch)} className="accent-[hsl(214_45%_22%)]" />
                      <Icon className="h-4 w-4 text-primary" aria-hidden="true" />
                      <span><span className="block font-medium text-slate-800">{ch}</span><span className="block text-[11px] text-slate-500">{to}</span></span>
                    </label>
                  );
                })}
              </div>
            </fieldset>

            <div className="rounded-lg border border-slate-200 p-4">
              <p className="text-sm font-semibold text-slate-900">Fee: {fee ? formatMMK(fee) : 'Free'}</p>
              <div className="mt-1"><QuotaNote quota={quota} freeReissue={reissue} /></div>
            </div>

            <Checkbox checked={declare} onChange={(e) => setDeclare(e.target.checked)} disabled={!!blocked}
              label="I am requesting my own credit report."
              description="Requesting someone else's report without their written authorisation is an offence. CIC records this request with your identity." />

            <StickyActions className="sm:justify-end">
              <Button icon={Send} size="lg" className="w-full sm:w-auto" onClick={submit} disabled={!purpose || !declare || !!blocked || busy}>Send request to CIC</Button>
            </StickyActions>
          </CardBody>
        </Card>

        <aside className="space-y-4">
          <Card>
            <CardHeader title="What happens next" icon={ShieldCheck} />
            <CardBody>
              <ol className="list-decimal space-y-2 pl-4 text-xs text-slate-600">
                <li><strong>Validation</strong> — CIC matches your identity and checks that every lender has sent its latest data.</li>
                <li><strong>Officer review</strong> — a CIC officer approves the report. Decision within 1 working day.</li>
                <li><strong>Notification</strong> — we send an {notify === 'Email' ? 'email' : 'SMS'} when the report is issued.</li>
                <li><strong>Your report</strong> — view your score and full report online for 30 days, download the PDF and share it with a lender.</li>
              </ol>
            </CardBody>
          </Card>
          <p className="text-[11px] text-slate-500">Checking your own report never lowers your score and is never shown to lenders.</p>
        </aside>
      </div>

      <AuditFootnote action="Requesting your report" />
    </div>
  );
}
