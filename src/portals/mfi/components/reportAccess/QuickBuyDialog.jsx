import { CreditCard } from 'lucide-react';
import { ACCESS_DAYS, REPORT_TIERS } from '@/lib/reportAccess';
import { formatDate } from '@/lib/format';
import { methodLabel } from '../../data/billingPlans';
import ConfirmDialog from '../ConfirmDialog';
import { isoDate } from '../applications/appUtils';
import { useBillingPlan } from './billingPlan';

const addDays = (n) => { const d = new Date(); d.setDate(d.getDate() + n); return isoDate(d); };

/** Short confirmation for a one-step report purchase charged to the institution's default method. */
export default function QuickBuyDialog({ open, tier, method, upgrade, subject, institution, purpose, consentRef, onClose, onConfirm, onOther }) {
  const { plan } = useBillingPlan();
  if (!open || !tier) return null;
  const t = REPORT_TIERS[tier];
  const rows = [
    ...(subject ? [['Borrower', subject]] : []),
    ['Report', `${t.label}${upgrade ? ' (upgrade from Basic)' : ''}`],
    ['Charged to', method === 'wallet'
      ? `${methodLabel(method)} — balance after USD ${(plan.walletBalance - t.price).toFixed(2)}`
      : `${methodLabel(method)} — on next month's CIC invoice`],
    ['Access', `Everyone at ${institution} until ${formatDate(addDays(ACCESS_DAYS))}`],
    ['Purpose', purpose],
    ['Consent', <span key="c" className="font-mono">{consentRef}</span>],
  ];
  return (
    <ConfirmDialog
      open
      size="sm"
      onClose={onClose}
      title={`${upgrade ? 'Upgrade to Full' : `Buy ${tier} report`} — USD ${t.price}`}
      subtitle="Your institution's default payment method"
      tone="primary"
      confirmLabel={`Confirm — USD ${t.price}`}
      confirmIcon={CreditCard}
      onConfirm={onConfirm}
      irreversible="Report fees are not refunded once the report is unlocked. The inquiry is recorded in the borrower's “who viewed my report” log."
    >
      <dl className="space-y-2 rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs">
        {rows.map(([k, v]) => (
          <div key={k} className="flex items-start justify-between gap-3">
            <dt className="shrink-0 text-slate-500">{k}</dt>
            <dd className="text-right font-medium text-slate-800">{v}</dd>
          </div>
        ))}
      </dl>
      <button type="button" onClick={onOther} className="rounded text-xs font-medium text-primary underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-warm">
        Choose another payment method
      </button>
    </ConfirmDialog>
  );
}
