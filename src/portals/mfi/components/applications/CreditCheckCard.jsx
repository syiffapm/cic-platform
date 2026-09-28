import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import clsx from 'clsx';
import { FileSearch, SearchX } from 'lucide-react';
import { Alert, Button, Card, CardBody, CardHeader, useToast } from '@/components/ui';
import { useStore } from '@/context/StoreContext';
import { formatMMK } from '@/lib/format';
import { GRADE_TONES, buildReport } from '../reportModel';
import { useTenant } from '../MfiState';
import CreditReport from '../../pages/Inquiry/CreditReport';
import TierChoice from '../reportAccess/TierChoice';
import { UnlockedNote } from '../reportAccess/AccessNotes';
import { checkoutUrl, useBillingPlan, useEntitlement } from '../reportAccess/billingPlan';
import usePurchaseReport from '../reportAccess/usePurchaseReport';
import { methodLabel } from '../../data/billingPlans';
import { applicantFile } from './useApplicationActions';
import { isoDate, monthlyInstalment } from './appUtils';

function Figure({ label, value, tone }) {
  return (
    <div className="rounded-lg border border-slate-100 px-3 py-2">
      <p className="text-[11px] text-slate-500">{label}</p>
      <p className={clsx('text-sm font-semibold', tone ?? 'text-slate-800')}>{value}</p>
    </div>
  );
}

const PURPOSE = 'NL';

/**
 * Credit check on an online application. Nothing from the report is shown until the institution holds
 * a Basic (USD 2) or Full (USD 4) report for the applicant; a report bought by any colleague opens without charge.
 */
export default function CreditCheckCard({ app, canAct, actions }) {
  const store = useStore();
  const { user, tenant, institution } = useTenant();
  const navigate = useNavigate();
  const toast = useToast();
  const buy = usePurchaseReport();
  const ent = useEntitlement(app.borrowerId);
  const { subscribed } = useBillingPlan();
  const [showReport, setShowReport] = useState(false);
  const file = applicantFile(app, store);
  const consentExpired = isoDate() > app.consent.expiresAt;
  const closed = ['Withdrawn'].includes(app.status);
  const what = 'buy credit reports on applications';

  /** Pay per report: one step on the default method (method set) or the checkout page; on a subscription the Full report opens directly at no charge. */
  const onChoose = (tier, method) => {
    if (subscribed) {
      buy({ borrowerId: app.borrowerId, tier, purpose: PURPOSE, consentRef: app.consent.ref, applicationId: app.id });
      toast('Full report opened — included in your subscription', 'success');
      return;
    }
    if (method) {
      const { purchase: p } = buy({ borrowerId: app.borrowerId, tier, purpose: PURPOSE, consentRef: app.consent.ref, applicationId: app.id, method });
      toast(`${tier} report unlocked — USD ${p.price} charged to ${methodLabel(method)} · receipt ${p.payment.receiptNo}`, 'success');
      return;
    }
    navigate(checkoutUrl({ kind: 'report', borrower: app.borrowerId, tier, purpose: PURPOSE, consent: app.consent.ref, app: app.id }));
  };
  const choice = (held) => (
    <TierChoice held={held} institution={institution} consentRef={app.consent.ref} purpose={PURPOSE} subject={`${app.applicant.name} · ${app.id}`} feature="mfi.applications" action="update" what={what} disabled={!canAct} onChoose={onChoose} />
  );

  if (file.noHit) {
    return (
      <Card>
        <CardHeader title="Credit check" subtitle="Registry search by the applicant's NRC" icon={SearchX} />
        <CardBody>
          <Alert tone="info" title="No record found — you are not charged">
            No licensed institution has reported a loan for {app.applicant.name}. No credit record is not a low score: assess the application on income, references and your product rules.
          </Alert>
        </CardBody>
      </Card>
    );
  }

  if (!ent.tier) {
    return (
      <Card>
        <CardHeader title="Choose a credit report" subtitle={`Purpose NL — New loan application · consent ${app.consent.ref}`} icon={FileSearch} />
        <CardBody className="space-y-4">
          {consentExpired && <Alert tone="danger" title="Consent has expired">The applicant's consent expired on {app.consent.expiresAt}. Ask the applicant to renew consent from the borrower portal before a report can be bought.</Alert>}
          {closed && <Alert tone="info" title="Application withdrawn">The applicant withdrew this application. No report can be bought.</Alert>}
          {app.inquiryId && <Alert tone="info" title="Earlier report access has ended">The report from inquiry {app.inquiryId} was open for 30 days and has expired. A new purchase needs valid consent.</Alert>}
          {!consentExpired && !closed && (
            <>
              <p className="text-sm text-slate-600">No report is shown until you choose one. The inquiry is recorded in the applicant's "who viewed my report" log.</p>
              {choice(null)}
            </>
          )}
        </CardBody>
      </Card>
    );
  }

  const full = ent.tier === 'Full';
  const model = buildReport(file, store.inquiries, store.disputes);
  const inq = store.inquiries.find((q) => q.id === ent.purchase.inquiryId);
  const obligations = model.active.filter((l) => l.loanId !== app.loanId).reduce((s, l) => s + monthlyInstalment(l.amount, l.rate ?? 28, l.tenor ?? 12), 0);
  const income = app.applicant.monthlyIncome;
  const dti = income ? ((obligations + monthlyInstalment(app.amount, 28, app.tenor)) / income) * 100 : null;
  const meta = {
    reportId: inq?.reportId ?? `CIC-R-${ent.purchase.inquiryId.replace('INQ-', '')}`, at: ent.purchase.at, user: inq?.user ?? user.name, tenant,
    mfiShort: institution?.short ?? 'PGMF', mfiName: institution?.name, purpose: PURPOSE, consentRef: app.consent.ref, reportType: ent.tier,
  };
  const toggle = () => { if (!showReport) actions.logView(meta.reportId); setShowReport((v) => !v); };

  return (
    <Card>
      <CardHeader title={`Credit check result · ${ent.tier} report`} subtitle={`Report ${meta.reportId} · ${meta.at}`} icon={FileSearch}
        action={full && <Button size="sm" variant="outline" onClick={toggle}>{showReport ? 'Hide full report' : 'View full report'}</Button>} />
      <CardBody className="space-y-4">
        <UnlockedNote purchase={ent.purchase} self={ent.purchase.purchasedBy === user.name && ent.purchase.at.slice(0, 10) === isoDate()} />
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          {model.grade ? (
            <div className="flex items-center gap-3">
              <span className={clsx('flex h-14 w-14 items-center justify-center rounded-2xl text-2xl font-bold text-white', GRADE_TONES[model.grade])} role="img" aria-label={`Grade ${model.grade}`}>{model.grade}</span>
              <div><p className="text-sm font-semibold text-slate-800">{model.gradeLabel}</p><p className="text-[11px] text-slate-500">Points {model.score}/100</p></div>
            </div>
          ) : (
            <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
              <p className="text-sm font-semibold text-slate-800">No credit record</p>
              <p className="text-[11px] text-slate-500">This is not a low score — the applicant has no reported loans yet.</p>
            </div>
          )}
          <div className="grid flex-1 grid-cols-2 gap-2 lg:grid-cols-4">
            <Figure label="Active loans" value={`${model.active.length} at ${model.institutions.length} institution(s)`} />
            <Figure label="Total exposure" value={formatMMK(model.exposure)} />
            <Figure label="Delinquency" value={model.worstDpd > 0 ? `Yes — ${model.worstDpd} DPD` : 'None'} tone={model.worstDpd > 30 ? 'text-red-600' : model.worstDpd > 0 ? 'text-amber-700' : undefined} />
            <Figure label="Debt service incl. this loan" value={dti == null ? '—' : `${dti.toFixed(0)}% of income`} tone={dti > 45 ? 'text-red-600' : dti > 30 ? 'text-amber-700' : undefined} />
          </div>
        </div>
        {full && (
          <ul className="space-y-1">
            {model.reasons.map((r) => <li key={r.code} className="text-xs text-slate-600">• {r.text}</li>)}
          </ul>
        )}
        {!full && !consentExpired && !closed && (
          <div className="space-y-2 border-t border-slate-100 pt-4">
            <p className="text-sm font-semibold text-slate-800">Need the full history?</p>
            {choice('Basic')}
          </div>
        )}
        {full && showReport && <CreditReport borrower={file} model={model} meta={meta} exportFeature="mfi.applications" actor={{ actor: user.name, role: user.role, tenant }} />}
      </CardBody>
    </Card>
  );
}

