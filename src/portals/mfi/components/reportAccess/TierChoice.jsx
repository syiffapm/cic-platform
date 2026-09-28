import { useState } from 'react';
import clsx from 'clsx';
import { Check, CheckCircle2, CreditCard, Sparkles, Zap } from 'lucide-react';
import { Badge } from '@/components/ui';
import { ACCESS_DAYS, REPORT_TIERS } from '@/lib/reportAccess';
import { PURPOSE_CODES } from '@/data/reference';
import { formatDate } from '@/lib/format';
import { methodLabel, methodShort } from '../../data/billingPlans';
import { PermButton } from '../access';
import { useBillingPlan } from './billingPlan';
import QuickBuyDialog from './QuickBuyDialog';

const purposeText = (c) => `${c} — ${PURPOSE_CODES.find((p) => p.code === c)?.label ?? c}`;

/**
 * "Choose a credit report": Basic USD 2 or Full USD 4, unlocked for every user of the institution.
 * `held` is 'Basic' when only the Basic report is unlocked (upgrade path), otherwise null.
 * When the institution's default payment needs no redirect (monthly invoice, or a wallet that covers the price),
 * the main button buys in one step after a short confirmation: onChoose(tier, method). "Choose another payment
 * method" — or any other default — opens the full checkout: onChoose(tier).
 * On a subscription there is no per-report charge: one button opens the Full report.
 */
export default function TierChoice({ held = null, institution, consentRef, purpose, subject, feature, action, what, onChoose, disabled }) {
  const { subscribed, plan, defaultMethod, quickMethod } = useBillingPlan();
  const [confirm, setConfirm] = useState(null); // { tier, method }
  const name = institution?.short ?? institution?.name ?? 'your institution';

  if (subscribed) {
    return (
      <div className="space-y-3 rounded-xl border border-teal-200 bg-teal-50/60 p-4">
        <p className="flex items-center gap-2 text-sm font-semibold text-slate-800"><Sparkles className="h-4 w-4 text-teal-700" aria-hidden="true" /> Included in your Unlimited checks subscription</p>
        <p className="text-xs text-slate-600">
          No charge for this report — your subscription renews on {formatDate(plan.subscription.renewsOn)}. The Full report unlocks for everyone at {name} for {ACCESS_DAYS} days
          and is still logged as a consented inquiry (purpose {purposeText(purpose)}, consent <span className="font-mono">{consentRef}</span>).
        </p>
        <PermButton feature={feature} action={action} what={what} icon={CheckCircle2} disabled={disabled} onClick={() => onChoose('Full')}>Open Full report</PermButton>
      </div>
    );
  }

  const options = held === 'Basic' ? ['Full'] : ['Basic', 'Full'];
  const lowWallet = defaultMethod === 'wallet' && options.some((t) => plan.walletBalance < REPORT_TIERS[t].price);
  return (
    <div className="space-y-3">
      <div className={clsx('grid gap-3', options.length > 1 && 'sm:grid-cols-2')}>
        {options.map((t) => {
          const tier = REPORT_TIERS[t];
          const upgrade = held === 'Basic';
          const quick = quickMethod(tier.price);
          const verb = upgrade ? 'Upgrade to Full' : `Buy ${t}`;
          return (
            <section key={t} aria-label={`${tier.label} — USD ${tier.price}`} className={clsx('flex flex-col rounded-xl border p-4', t === 'Full' ? 'border-primary-200 bg-primary-50/40' : 'border-slate-200 bg-white')}>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold text-slate-800">{upgrade ? 'Upgrade to Full report' : tier.label}</p>
                  <p className="text-[11px] text-slate-500">{t === 'Basic' ? 'Grade and current position' : 'Complete history and printable report'}</p>
                </div>
                <p className="text-right"><span className="text-xl font-bold text-primary">USD {tier.price}</span><span className="block text-[11px] text-slate-500">per borrower</span></p>
              </div>
              <ul className="mt-3 flex-1 space-y-1">
                {tier.includes.map((i) => <li key={i} className="flex items-start gap-1.5 text-xs text-slate-600"><Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-teal-700" aria-hidden="true" />{i}</li>)}
              </ul>
              {t === 'Full' && !upgrade && <Badge tone="navy" className="mt-3 self-start">Includes everything in Basic</Badge>}
              <PermButton
                className="mt-4 h-auto min-h-10 w-full flex-wrap py-2 text-center"
                variant={t === 'Full' ? 'primary' : 'outline'}
                feature={feature} action={action} what={what}
                icon={quick ? Zap : CreditCard}
                disabled={disabled}
                onClick={() => (quick ? setConfirm({ tier: t, method: quick }) : onChoose(t))}
              >
                <span>{verb} — USD {tier.price}</span>
                {quick && <span className="text-xs font-normal opacity-90">· charged to {methodShort(quick)}</span>}
              </PermButton>
              {quick && !disabled && (
                <button type="button" onClick={() => onChoose(t)} className="mt-2 self-center rounded text-xs font-medium text-primary underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-warm">
                  Choose another payment method
                </button>
              )}
            </section>
          );
        })}
      </div>
      <p className="text-[11px] text-slate-500">
        Unlocks for everyone at {name} for {ACCESS_DAYS} days — colleagues open it without a further charge. Purpose {purposeText(purpose)} · consent <span className="font-mono">{consentRef}</span>.
        {' '}{lowWallet
          ? `Your default is the prepaid wallet, but its balance (USD ${plan.walletBalance.toFixed(2)}) does not cover every report — those are paid at checkout.`
          : ['invoice', 'wallet'].includes(defaultMethod)
            ? `Charged to your institution's default: ${methodLabel(defaultMethod)}.`
            : `Your institution's default (${methodLabel(defaultMethod)}) is paid at checkout.`}
      </p>
      <QuickBuyDialog
        open={!!confirm}
        tier={confirm?.tier}
        method={confirm?.method}
        upgrade={held === 'Basic'}
        subject={subject}
        institution={name}
        purpose={purposeText(purpose)}
        consentRef={consentRef}
        onClose={() => setConfirm(null)}
        onConfirm={() => { const c = confirm; setConfirm(null); onChoose(c.tier, c.method); }}
        onOther={() => { const c = confirm; setConfirm(null); onChoose(c.tier); }}
      />
    </div>
  );
}
