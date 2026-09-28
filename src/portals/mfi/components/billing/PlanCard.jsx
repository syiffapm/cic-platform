import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, CreditCard, Sparkles, Wallet } from 'lucide-react';
import { Badge, Button, Card, CardBody, CardHeader, Modal, useToast } from '@/components/ui';
import { useStore } from '@/context/StoreContext';
import { formatDate } from '@/lib/format';
import { SUBSCRIPTION_OFFER } from '../../data/billingPlans';
import { useTenant } from '../MfiState';
import { PermButton } from '../access';
import { checkoutUrl, useBillingPlan } from '../reportAccess/billingPlan';
import { STRONG } from '../buttonTones';

const TOP_UPS = [20, 50, 100, 300];

/** Current billing plan, prepaid wallet and the Unlimited checks subscription offer. Plan changes: MFI Administrator only. */
export default function PlanCard() {
  const { plan, subscribed, set } = useBillingPlan();
  const { user, tenant, institution, can } = useTenant();
  const { logAudit } = useStore();
  const navigate = useNavigate();
  const toast = useToast();
  const [cancelOpen, setCancelOpen] = useState(false);
  const admin = can('mfi.apiKeys', 'create');
  const what = 'change the billing plan or top up the wallet';

  const cancel = () => {
    set((p) => ({ ...p, type: 'Pay per report', subscription: { ...p.subscription, status: 'Cancelled', cancelledAt: new Date().toISOString().slice(0, 10), cancelledBy: user.name } }));
    logAudit({ actor: user.name, role: user.role, tenant, action: 'PLAN_CANCELLED', module: 'Billing', target: SUBSCRIPTION_OFFER.plan, outcome: 'Switched to pay per report' });
    setCancelOpen(false);
    toast('Subscription cancelled — reports are now paid per borrower (Basic USD 2 · Full USD 4)', 'info');
  };

  return (
    <div className="grid gap-6 lg:grid-cols-2 [&>*]:min-w-0">
      <Card>
        <CardHeader title="Current plan" subtitle={institution?.name} icon={CreditCard} action={<Badge tone={subscribed ? 'teal' : 'navy'}>{subscribed ? SUBSCRIPTION_OFFER.plan : 'Pay per report'}</Badge>} />
        <CardBody className="space-y-4">
          {subscribed ? (
            <p className="text-sm text-slate-600">
              Unlimited Basic and Full reports for every user — USD {plan.subscription.priceMonthly}/month, started {formatDate(plan.subscription.startedAt)}, renews {formatDate(plan.subscription.renewsOn)}.
            </p>
          ) : (
            <p className="text-sm text-slate-600">Each report is paid once per borrower: <b>Basic USD 2</b> · <b>Full USD 4</b>, open to every user at {institution?.short} for 30 days. No-hit searches are free.</p>
          )}
          <div className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
            <div className="flex items-center gap-3">
              <Wallet className="h-5 w-5 text-primary" aria-hidden="true" />
              <div>
                <p className="text-[11px] text-slate-500">CIC prepaid wallet</p>
                <p className="text-lg font-bold text-slate-900">USD {plan.walletBalance.toFixed(2)}</p>
              </div>
            </div>
            <div className="flex flex-wrap justify-end gap-1.5">
              {TOP_UPS.map((a) => (
                <PermButton key={a} size="sm" variant="outline" feature="mfi.apiKeys" action="create" what={what} onClick={() => navigate(checkoutUrl({ kind: 'topup', amount: a }))} aria-label={`Top up USD ${a}`}>+{a}</PermButton>
              ))}
            </div>
          </div>
          {subscribed && <PermButton variant="ghost" size="sm" feature="mfi.apiKeys" action="create" what={what} onClick={() => setCancelOpen(true)}>Cancel subscription</PermButton>}
          {!admin && <p className="text-[11px] text-slate-500">Only an MFI Administrator can top up the wallet or change the plan.</p>}
        </CardBody>
      </Card>

      <Card className={subscribed ? 'opacity-90' : 'border-teal-200'}>
        <CardHeader title={`Upgrade to ${SUBSCRIPTION_OFFER.plan} — USD ${SUBSCRIPTION_OFFER.priceMonthly}/month`} subtitle="For institutions that check many borrowers every month" icon={Sparkles} />
        <CardBody className="space-y-4">
          <ul className="space-y-1.5">
            {SUBSCRIPTION_OFFER.includes.map((i) => <li key={i} className="flex items-start gap-2 text-sm text-slate-700"><Check className="mt-0.5 h-4 w-4 shrink-0 text-teal-700" aria-hidden="true" />{i}</li>)}
          </ul>
          <p className="text-[11px] text-slate-500">Break-even at 75 Full or 150 Basic reports a month. Purpose and borrower consent are still required for every inquiry.</p>
          {subscribed
            ? <Badge tone="teal">Active until {formatDate(plan.subscription.renewsOn)}</Badge>
            : <PermButton variant="teal" className={STRONG.teal} icon={Sparkles} feature="mfi.apiKeys" action="create" what={what} onClick={() => navigate(checkoutUrl({ kind: 'subscription' }))}>Subscribe — USD {SUBSCRIPTION_OFFER.priceMonthly}/month</PermButton>}
        </CardBody>
      </Card>

      <Modal open={cancelOpen} onClose={() => setCancelOpen(false)} size="sm" title="Cancel Unlimited checks?"
        footer={<><Button variant="outline" onClick={() => setCancelOpen(false)}>Keep subscription</Button><Button variant="danger" onClick={cancel}>Cancel subscription</Button></>}>
        <p className="text-sm text-slate-600">Your institution returns to pay per report (Basic USD 2 · Full USD 4). Reports already unlocked stay open until they expire.</p>
      </Modal>
    </div>
  );
}
