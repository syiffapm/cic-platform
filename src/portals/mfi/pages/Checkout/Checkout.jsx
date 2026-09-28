import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Loader2, Lock, ShieldCheck } from 'lucide-react';
import { Alert, Button, Card, CardBody, EmptyState, PageHeader, useToast } from '@/components/ui';
import { useStore } from '@/context/StoreContext';
import { ACCESS_DAYS, REPORT_TIERS } from '@/lib/reportAccess';
import { PURPOSE_CODES } from '@/data/reference';
import { formatDate, maskNrc } from '@/lib/format';
import { getBorrowerFile } from '../../data/borrowers';
import { SUBSCRIPTION_OFFER, methodLabel } from '../../data/billingPlans';
import { useTenant } from '../../components/MfiState';
import { applicantFile } from '../../components/applications/useApplicationActions';
import { isoDate, stampNow } from '../../components/applications/appUtils';
import { checkoutUrl, useBillingPlan, useEntitlement } from '../../components/reportAccess/billingPlan';
import usePurchaseReport from '../../components/reportAccess/usePurchaseReport';
import { MethodPicker, OrderSummary, PaymentReceipt } from '../../components/reportAccess/CheckoutParts';

const addDays = (d, n) => { const x = new Date(`${d}T00:00:00`); x.setDate(x.getDate() + n); return isoDate(x); };
const addMonth = (d) => { const x = new Date(`${d}T00:00:00`); x.setMonth(x.getMonth() + 1); return isoDate(x); };
const receiptNo = () => `RCT-2026-${Math.floor(100000 + Math.random() * 900000)}`;
const REDIRECT = { kbzpay: 'KBZPay', wave: 'Wave Money', bank: 'your bank' };

/** Checkout for a credit report, a prepaid wallet top-up or the Unlimited checks subscription. */
export default function Checkout() {
  const [params] = useSearchParams();
  const kind = params.get('kind') ?? 'report';
  const store = useStore();
  const { logAudit, loanApplications } = store;
  const { user, tenant, institution, can } = useTenant();
  const { plan, subscribed, set, debit, credit, defaultMethod } = useBillingPlan();
  const purchase = usePurchaseReport();
  const navigate = useNavigate();
  const toast = useToast();
  // A report checkout starts on the institution's default method (unless the wallet is too low).
  const [method, setMethod] = useState(() => {
    if (kind !== 'report') return null;
    const price = REPORT_TIERS[params.get('tier') === 'Full' ? 'Full' : 'Basic'].price;
    return defaultMethod === 'wallet' && plan.walletBalance < price ? null : defaultMethod;
  });
  const [stage, setStage] = useState('select');
  const [receipt, setReceipt] = useState(null);

  const borrowerId = params.get('borrower');
  const tier = params.get('tier') === 'Full' ? 'Full' : 'Basic';
  const appId = params.get('app');
  const app = appId ? loanApplications.find((a) => a.id === appId && a.mfiId === tenant) : null;
  const ent = useEntitlement(borrowerId);
  const name = institution?.short ?? 'your institution';
  const back = kind === 'report' ? (app ? `/mfi/applications/${app.id}` : `/mfi/credit/inquiry?open=${borrowerId}`) : '/mfi/institution/billing';
  const backToBuyer = kind === 'report' ? (app ? `/mfi/applications/${app.id}` : '/mfi/credit/inquiry') : '/mfi/institution/billing';

  const allowed = kind === 'report' ? (app ? can('mfi.applications', 'update') : can('mfi.inquiry', 'create')) : can('mfi.billing', 'read') && can('mfi.apiKeys', 'create');
  const header = <PageHeader title="Checkout" subtitle={`${institution?.name ?? ''} · payments to the Credit Information Centre`} breadcrumbs={[{ label: kind === 'report' ? (app ? app.id : 'Credit inquiry') : 'Usage & billing', to: backToBuyer }, { label: 'Checkout' }]} />;
  const wrap = (body) => <div className="space-y-6">{header}{body}</div>;

  if (!allowed) {
    return wrap(<EmptyState icon={Lock} title="You cannot make this payment" description={kind === 'report' ? 'Your role cannot buy credit reports. Ask a credit officer or your MFI Administrator.' : 'Only an MFI Administrator can top up the wallet or change the billing plan.'} action={<Link to={backToBuyer}><Button variant="outline">Go back</Button></Link>} />);
  }

  // What is being bought
  let order;
  if (kind === 'report') {
    const file = getBorrowerFile(borrowerId, store) ?? (app ? applicantFile(app, store) : null);
    const purpose = params.get('purpose');
    const consentRef = params.get('consent');
    if (!file || !purpose || !consentRef) return wrap(<Alert tone="warning" title="Nothing to pay for">The checkout link is incomplete. Start again from the credit inquiry or the loan application.</Alert>);
    const already = tier === 'Full' ? ent.full : ent.basic;
    if (receipt == null && (already || subscribed)) {
      return wrap(
        <Alert tone="success" title={subscribed ? 'Included in your subscription — no payment needed' : `${tier} report already unlocked — no charge`}
          action={<Link to={back}><Button size="sm">Open report</Button></Link>}>
          {already ? `Unlocked by ${already.purchasedBy} on ${formatDate(already.at.slice(0, 10))}, valid until ${formatDate(already.validUntil)} for everyone at ${name}.` : 'Your institution has an Unlimited checks subscription.'}
        </Alert>,
      );
    }
    const t = REPORT_TIERS[tier];
    const upgrade = tier === 'Full' && ent.basic && !ent.full;
    order = {
      title: `${t.label}${upgrade ? ' (upgrade from Basic)' : ''}`, total: t.price, methods: ['wallet', 'invoice', 'kbzpay', 'wave', 'bank'],
      lines: [
        ['Borrower', `${file.nameEn} · ${maskNrc(file.nrc)}`], ['CIC borrower ID', borrowerId], ['Report', t.label], ...(app ? [['Loan application', app.id]] : []),
        ['Purpose', `${purpose} — ${PURPOSE_CODES.find((p) => p.code === purpose)?.label ?? purpose}`], ['Consent reference', consentRef],
        ['Access', `All users at ${name} until ${formatDate(addDays(isoDate(), ACCESS_DAYS))}`],
      ],
      includes: t.includes,
      pay: (m) => {
        const { purchase: p } = purchase({ borrowerId, tier, purpose, consentRef, applicationId: app?.id ?? null, method: m });
        return {
          title: `${tier} report unlocked`, message: `The ${tier} report for ${file.nameEn} is now open to everyone at ${name} until ${formatDate(p.validUntil)}.`,
          rows: [['Receipt no.', p.payment.receiptNo], ['Paid with', p.payment.method], ['Amount', `USD ${p.price.toFixed(2)}`], ['Time', p.at], ['Purchase', p.id], ['Status', p.payment.status]],
          cta: app ? 'Back to the application' : 'Open the report',
        };
      },
    };
  } else if (kind === 'topup') {
    const amount = Math.max(10, Number(params.get('amount')) || 50);
    order = {
      title: 'Prepaid wallet top-up', total: amount, methods: ['kbzpay', 'wave', 'bank'],
      lines: [['Wallet', `${institution?.name} (${tenant})`], ['Current balance', `USD ${plan.walletBalance.toFixed(2)}`], ['Balance after top-up', `USD ${(plan.walletBalance + amount).toFixed(2)}`]],
      pay: (m) => {
        const no = receiptNo();
        credit(amount, methodLabel(m), no);
        logAudit({ actor: user.name, role: user.role, tenant, action: 'WALLET_TOPUP', module: 'Billing', target: `USD ${amount}`, outcome: `${methodLabel(m)} · ${no}` });
        return { title: 'Wallet topped up', message: `USD ${amount.toFixed(2)} was added to ${name}'s prepaid wallet.`, rows: [['Receipt no.', no], ['Paid with', methodLabel(m)], ['Amount', `USD ${amount.toFixed(2)}`], ['Time', stampNow()]], cta: 'Back to usage & billing' };
      },
    };
  } else {
    if (subscribed && !receipt) return wrap(<Alert tone="info" title="Already subscribed">{name} already has the Unlimited checks subscription, renewing on {formatDate(plan.subscription.renewsOn)}.</Alert>);
    const start = isoDate();
    order = {
      title: `${SUBSCRIPTION_OFFER.plan} subscription — first month`, total: SUBSCRIPTION_OFFER.priceMonthly, methods: ['wallet', 'invoice', 'kbzpay', 'wave', 'bank'],
      lines: [['Plan', `${SUBSCRIPTION_OFFER.plan} · USD ${SUBSCRIPTION_OFFER.priceMonthly}/month`], ['Starts', formatDate(start)], ['Renews', formatDate(addMonth(start))], ['Users covered', `Everyone at ${name}`]],
      includes: SUBSCRIPTION_OFFER.includes,
      pay: (m) => {
        const no = receiptNo();
        if (m === 'wallet') debit(SUBSCRIPTION_OFFER.priceMonthly, `${no} · Unlimited checks subscription`);
        set((p) => ({ ...p, type: 'Subscription', subscription: { plan: SUBSCRIPTION_OFFER.plan, priceMonthly: SUBSCRIPTION_OFFER.priceMonthly, currency: 'USD', startedAt: start, renewsOn: addMonth(start), status: 'Active', payment: { method: methodLabel(m), receiptNo: no }, by: user.name } }));
        logAudit({ actor: user.name, role: user.role, tenant, action: 'PLAN_SUBSCRIBED', module: 'Billing', target: `${SUBSCRIPTION_OFFER.plan} · USD ${SUBSCRIPTION_OFFER.priceMonthly}/month`, outcome: `${methodLabel(m)} · ${no}` });
        return { title: 'Subscription active', message: `Every user at ${name} can now open Basic and Full reports without a per-report charge until ${formatDate(addMonth(start))}.`, rows: [['Receipt no.', no], ['Paid with', methodLabel(m)], ['Amount', `USD ${SUBSCRIPTION_OFFER.priceMonthly.toFixed(2)}`], ['Time', stampNow()]], cta: 'Back to usage & billing' };
      },
    };
  }

  const redirect = REDIRECT[method];
  const confirm = () => {
    setStage('processing');
    setTimeout(() => {
      const r = order.pay(method);
      setReceipt(r);
      setStage('done');
      toast(`${r.title} — receipt ${r.rows[0][1]}`, 'success');
    }, redirect ? 1600 : 700);
  };

  if (stage === 'done' && receipt) {
    return wrap(
      <PaymentReceipt receipt={receipt}>
        <Button onClick={() => navigate(back)}>{receipt.cta}</Button>
        <Link to="/mfi/institution/billing" className="inline-flex"><Button variant="outline" tabIndex={-1}>View billing</Button></Link>
      </PaymentReceipt>,
    );
  }

  const topUpTo = can('mfi.apiKeys', 'create') ? checkoutUrl({ kind: 'topup', amount: 50 }) : null;
  return wrap(
    <div className="grid gap-6 lg:grid-cols-5 [&>*]:min-w-0">
      <Card className="lg:col-span-3">
        <CardBody className="space-y-5">
          {stage === 'processing' ? (
            <div className="flex flex-col items-center py-12 text-center" role="status" aria-live="polite">
              <Loader2 className="h-8 w-8 animate-spin text-primary" aria-hidden="true" />
              <p className="mt-3 text-sm font-semibold text-slate-800">{redirect ? `Waiting for approval in ${redirect}…` : 'Processing payment…'}</p>
              <p className="mt-1 text-xs text-slate-500">{redirect ? 'Approve the payment request on your phone or in online banking. Do not close this page.' : 'This takes a few seconds.'}</p>
            </div>
          ) : (
            <>
              <MethodPicker value={method} onChange={setMethod} allowed={order.methods} balance={plan.walletBalance} total={order.total} topUpTo={kind === 'report' ? topUpTo : null} />
              <p className="flex items-start gap-2 text-[11px] text-slate-500"><ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                {method === 'invoice' ? `USD ${order.total} will be charged to ${name}'s CIC account and appear on the monthly invoice.` : 'Payments are processed by CIC\'s licensed payment partners. The amount is shown in US dollars.'}
              </p>
              <div className="flex flex-wrap justify-between gap-2">
                <Link to={backToBuyer} className="inline-flex"><Button variant="ghost" icon={ArrowLeft} tabIndex={-1}>Cancel</Button></Link>
                <Button onClick={confirm} disabled={!method}>{method === 'invoice' ? `Confirm — add USD ${order.total} to invoice` : `Pay USD ${order.total}`}</Button>
              </div>
            </>
          )}
        </CardBody>
      </Card>
      <div className="lg:col-span-2">
        <OrderSummary title={order.title} lines={order.lines} total={order.total}>
          {order.includes && <ul className="space-y-1 rounded-lg bg-slate-50 p-3 text-xs text-slate-600">{order.includes.map((i) => <li key={i}>• {i}</li>)}</ul>}
        </OrderSummary>
      </div>
    </div>,
  );
}
