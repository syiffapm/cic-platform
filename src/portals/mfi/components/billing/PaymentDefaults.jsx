import { useState } from 'react';
import clsx from 'clsx';
import { Settings2, Zap } from 'lucide-react';
import { Badge, Button, Card, CardBody, CardHeader, useToast } from '@/components/ui';
import { useStore } from '@/context/StoreContext';
import { PAYMENT_METHODS, methodLabel } from '../../data/billingPlans';
import { useTenant } from '../MfiState';
import { useBillingPlan } from '../reportAccess/billingPlan';

const ONE_STEP = { invoice: 'One-step purchase', wallet: 'One-step while the balance covers the price' };

/**
 * Institution-wide default payment method for credit report purchases. Only the MFI Administrator changes it;
 * every other user sees which method their purchases are charged to.
 */
export default function PaymentDefaults() {
  const { plan, subscribed, set, defaultMethod } = useBillingPlan();
  const { user, tenant, institution, can } = useTenant();
  const { logAudit } = useStore();
  const toast = useToast();
  const admin = can('mfi.apiKeys', 'create');
  const [choice, setChoice] = useState(defaultMethod);

  const save = () => {
    set((p) => ({ ...p, defaultMethod: choice }));
    logAudit({ actor: user.name, role: user.role, tenant, action: 'PAYMENT_DEFAULT_CHANGED', module: 'Billing', target: `${methodLabel(defaultMethod)} → ${methodLabel(choice)}`, outcome: 'Success' });
    toast(`Credit reports are now charged to ${methodLabel(choice)} by default`, 'success');
  };

  return (
    <Card>
      <CardHeader
        title="Default payment for credit reports"
        subtitle={`Used when anyone at ${institution?.short ?? 'your institution'} buys a Basic or Full report`}
        icon={Settings2}
        action={<Badge tone="navy">{methodLabel(defaultMethod)}</Badge>}
      />
      <CardBody className="space-y-4">
        <p className="text-sm text-slate-600">
          With <b>Monthly invoice</b> — or the <b>prepaid wallet</b> while its balance (USD {plan.walletBalance.toFixed(2)}) covers the price — users buy a report in one step with a short confirmation.
          Other methods, or a wallet that is too low, open the full checkout. Users can always choose another method for a single purchase.
        </p>
        {subscribed && <p className="text-xs text-slate-500">Your Unlimited checks subscription covers every report, so no payment is taken while it is active.</p>}
        {admin ? (
          <fieldset className="space-y-2">
            <legend className="mb-1 text-xs font-medium text-slate-700">Default method</legend>
            <div className="grid gap-2 sm:grid-cols-2">
              {PAYMENT_METHODS.map((m) => (
                <label key={m.id} className={clsx('flex cursor-pointer items-start gap-3 rounded-lg border p-3', choice === m.id ? 'border-primary bg-primary-50 ring-1 ring-primary' : 'border-slate-200 hover:border-slate-300')}>
                  <input type="radio" name="default-method" value={m.id} checked={choice === m.id} onChange={() => setChoice(m.id)} className="mt-1 accent-[hsl(214,45%,22%)]" />
                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-center gap-1.5 text-sm font-medium text-slate-800">
                      {m.label}
                      {ONE_STEP[m.id] && <span className="inline-flex items-center gap-1 text-[11px] font-medium text-teal-700"><Zap className="h-3 w-3" aria-hidden="true" />{ONE_STEP[m.id]}</span>}
                    </span>
                    <span className={clsx('block text-[11px]', choice === m.id ? 'text-slate-700' : 'text-slate-500')}>{m.hint}</span>
                  </span>
                </label>
              ))}
            </div>
            <div className="flex justify-end pt-1">
              <Button onClick={save} disabled={choice === defaultMethod}>Save default</Button>
            </div>
          </fieldset>
        ) : (
          <p className="text-[11px] text-slate-500">Only an MFI Administrator can change the default payment method.</p>
        )}
      </CardBody>
    </Card>
  );
}
