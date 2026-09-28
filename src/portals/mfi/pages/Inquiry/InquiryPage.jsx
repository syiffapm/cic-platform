import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ShieldCheck } from 'lucide-react';
import { Card, CardBody, CardHeader, DataTable, PageHeader, useToast } from '@/components/ui';
import { useStore } from '@/context/StoreContext';
import { REPORT_TIERS, entitlementFor } from '@/lib/reportAccess';
import { maskNrc } from '@/lib/format';
import { methodLabel } from '../../data/billingPlans';
import { findById, findByNrc, getBorrowerFile } from '../../data/borrowers';
import { useTenant } from '../../components/MfiState';
import InquiryForm from '../../components/InquiryForm';
import { NoHit } from '../../components/InquiryResults';
import { DATA_AS_OF, RULE_VERSION, buildReport } from '../../components/reportModel';
import { newInquiryId, stampNow } from '../../components/applications/appUtils';
import { checkoutUrl, useBillingPlan, useEntitlement } from '../../components/reportAccess/billingPlan';
import usePurchaseReport from '../../components/reportAccess/usePurchaseReport';
import MatchedBorrower from '../../components/reportAccess/MatchedBorrower';
import QuickBuyDialog from '../../components/reportAccess/QuickBuyDialog';
import { UnlockedNote } from '../../components/reportAccess/AccessNotes';
import CreditReport from './CreditReport';
import { ViewOnlyBanner } from '../../components/access';

const charge = (r) => {
  if (r.result === 'No hit' || r.billable === false) return r.coveredBy ? 'Subscription' : 'No charge';
  const price = r.price ?? REPORT_TIERS[r.reportType]?.price;
  return price ? `USD ${price}` : '—';
};

/**
 * Walk-in / branch credit inquiry: search (free) → choose Basic USD 2 or Full USD 4 → checkout → report.
 * A report already unlocked for the institution opens without charge. Online applications buy from the application.
 */
export default function InquiryPage() {
  const { user, tenant, institution, can } = useTenant();
  const store = useStore();
  const { inquiries, disputes, add, logAudit } = store;
  const { subscribed, quickMethod } = useBillingPlan();
  const [upgrade, setUpgrade] = useState(null); // quick-buy method for Basic → Full
  const buy = usePurchaseReport();
  const toast = useToast();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const [found, setFound] = useState(null); // { borrower, req }
  const [nohit, setNohit] = useState(null);
  const [busy, setBusy] = useState(false);
  const ent = useEntitlement(found?.borrower.borrowerId);
  const actor = { actor: user.name, role: user.role, tenant };
  const opened = useRef(null);

  // Re-open an unlocked report (from the unlocked-reports list or after checkout) — read permission only, no charge.
  const openId = params.get('open');
  useEffect(() => {
    if (!openId || opened.current === openId) return;
    opened.current = openId;
    const file = getBorrowerFile(openId, store);
    if (!file) return;
    setNohit(null);
    setFound({ borrower: file, req: null });
    logAudit({ ...actor, action: 'REPORT_VIEW', module: 'Inquiry', target: openId, outcome: 'Unlocked report — no charge' });
  }, [openId]); // eslint-disable-line react-hooks/exhaustive-deps

  const reset = () => { setFound(null); setNohit(null); opened.current = null; if (openId) setParams({}); };

  const onSubmit = (req) => {
    setBusy(true);
    reset();
    setTimeout(() => {
      setBusy(false);
      const { query } = req;
      const acc = query.mode === 'nrc' ? store.accounts.find((a) => a.nrc?.toUpperCase() === query.value.toUpperCase()) : null;
      const match = query.mode === 'nrc' ? findByNrc(query.value) ?? (acc && { borrowerId: acc.borrowerId }) : findById(query.value);
      const file = match && getBorrowerFile(match.borrowerId, store);
      if (!file || file.noHit) {
        const id = newInquiryId();
        add('inquiries', { id, borrowerId: null, query: query.value, mfiId: tenant, user: user.name, purpose: req.purpose, consentRef: req.consentRef, reportType: '—', reportId: null, ruleVersion: RULE_VERSION, dataDate: DATA_AS_OF, at: stampNow(), billable: false, price: 0, currency: 'USD', result: 'No hit' });
        logAudit({ ...actor, action: 'INQUIRY_NO_HIT', module: 'Inquiry', target: query.value, purpose: req.purpose, outcome: 'No hit — not charged' });
        setNohit({ query: query.value, inquiryId: id });
        return;
      }
      setFound({ borrower: file, req });
      const e = entitlementFor(store.reportPurchases, tenant, file.borrowerId);
      const held = e.full ?? e.basic;
      if (held) {
        add('inquiries', { id: newInquiryId(), borrowerId: file.borrowerId, mfiId: tenant, user: user.name, purpose: req.purpose, consentRef: req.consentRef, reportType: held.tier, reportId: null, ruleVersion: RULE_VERSION, dataDate: DATA_AS_OF, at: stampNow(), billable: false, price: 0, currency: 'USD', result: 'Match', note: `Unlocked by ${held.purchasedBy}` });
        logAudit({ ...actor, action: 'REPORT_VIEW', module: 'Inquiry', target: file.borrowerId, purpose: req.purpose, outcome: `Already unlocked by ${held.purchasedBy} — no charge` });
      }
    }, 600);
  };

  /** method set → one-step purchase on the institution's default; otherwise the full checkout. */
  const onChoose = (tier, method) => {
    const b = found.borrower;
    const purpose = found.req?.purpose ?? ent.purchase?.purpose;
    const consentRef = found.req?.consentRef ?? ent.purchase?.consentRef;
    if (subscribed) {
      buy({ borrowerId: b.borrowerId, tier, purpose, consentRef });
      toast('Full report opened — included in your subscription', 'success');
      return;
    }
    if (method) {
      const { purchase: p } = buy({ borrowerId: b.borrowerId, tier, purpose, consentRef, method });
      toast(`${tier} report unlocked — USD ${p.price} charged to ${methodLabel(method)} · receipt ${p.payment.receiptNo}`, 'success');
      return;
    }
    navigate(checkoutUrl({ kind: 'report', borrower: b.borrowerId, tier, purpose, consent: consentRef }));
  };

  let view = null;
  if (nohit) view = <NoHit query={nohit.query} inquiryId={nohit.inquiryId} onNewSearch={reset} />;
  else if (found && ent.tier) {
    const p = ent.purchase;
    const inq = inquiries.find((q) => q.id === p.inquiryId);
    const meta = {
      reportId: inq?.reportId ?? `CIC-R-${p.inquiryId.replace('INQ-', '')}`, at: p.at, user: user.name, tenant, mfiShort: institution?.short ?? 'PGMF', mfiName: institution?.name,
      purpose: found.req?.purpose ?? p.purpose, consentRef: found.req?.consentRef ?? p.consentRef, reportType: ent.tier,
    };
    const model = buildReport(found.borrower, inquiries, disputes);
    view = (
      <CreditReport borrower={found.borrower} model={model} meta={meta} onNewSearch={reset} actor={actor}
        notice={<UnlockedNote purchase={p} self={p.purchasedBy === user.name && p.at.slice(0, 10) === stampNow().slice(0, 10)} />}
        onUpgrade={ent.tier === 'Basic' ? () => { const m = !subscribed && quickMethod(REPORT_TIERS.Full.price); if (m) setUpgrade(m); else onChoose('Full'); } : undefined} />
    );
  } else if (found) {
    view = <MatchedBorrower borrower={found.borrower} req={found.req} institution={institution} onChoose={onChoose} onNewSearch={reset} />;
  }

  const recent = inquiries.filter((q) => q.mfiId === tenant).slice(0, 6);

  return (
    <div className="space-y-6">
      <PageHeader title="Credit inquiry" subtitle="Search by NRC or CIC borrower ID. A purpose code and signed borrower consent are mandatory for every inquiry." />
      <ViewOnlyBanner feature="mfi.inquiry" />

      {!view && can('mfi.inquiry', 'create') && <InquiryForm onSubmit={onSubmit} busy={busy} />}
      {view}
      {found && (
        <QuickBuyDialog
          open={!!upgrade}
          tier="Full"
          method={upgrade}
          upgrade
          subject={`${found.borrower.nameEn} · ${maskNrc(found.borrower.nrc)}`}
          institution={institution?.short ?? 'your institution'}
          purpose={found.req?.purpose ?? ent.purchase?.purpose}
          consentRef={found.req?.consentRef ?? ent.purchase?.consentRef}
          onClose={() => setUpgrade(null)}
          onConfirm={() => { const m = upgrade; setUpgrade(null); onChoose('Full', m); }}
          onOther={() => { setUpgrade(null); onChoose('Full'); }}
        />
      )}

      <div className="grid gap-6 lg:grid-cols-3 [&>*]:min-w-0">
        <Card className="lg:col-span-2">
          <CardHeader title="Recent inquiries by your institution" subtitle={`Only inquiries made by ${institution?.short ?? 'your'} users are listed.`} />
          <DataTable
            dense
            rows={recent}
            columns={[
              { key: 'at', header: 'Time' },
              { key: 'user', header: 'User' },
              { key: 'borrowerId', header: 'Subject', render: (r) => r.borrowerId ?? r.query ?? '—' },
              { key: 'purpose', header: 'Purpose' },
              { key: 'reportType', header: 'Report', render: (r) => (r.result === 'No hit' ? 'No hit' : r.reportType) },
              { key: 'price', header: 'Charge', render: charge },
            ]}
          />
        </Card>
        <Card>
          <CardHeader title="Inquiry rules" subtitle="Applied by CIC to every request" icon={ShieldCheck} />
          <CardBody>
            <ul className="space-y-2.5 text-xs text-slate-600">
              <li><b className="text-slate-800">Purpose-bound.</b> The report may be used only for the purpose code selected.</li>
              <li><b className="text-slate-800">Consent required.</b> Keep the signed consent form for 5 years; CIC may request it during inspection.</li>
              <li><b className="text-slate-800">Visible to the borrower.</b> Each inquiry appears in the borrower's "who viewed my report" log.</li>
              <li><b className="text-slate-800">Pay once per institution.</b> Basic USD 2 · Full USD 4 per borrower, open to every user of your institution for 30 days. No-hit searches are free. With the Unlimited checks subscription there is no per-report charge.</li>
              <li><b className="text-slate-800">Online applications.</b> Choose the report from the application — its digital consent is attached automatically.</li>
            </ul>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
