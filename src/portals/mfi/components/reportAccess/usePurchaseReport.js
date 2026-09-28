import { useStore } from '@/context/StoreContext';
import { REPORT_TIERS, makePurchase } from '@/lib/reportAccess';
import { getBorrowerFile } from '../../data/borrowers';
import { DATA_AS_OF, RULE_VERSION, buildReport } from '../reportModel';
import { useTenant } from '../MfiState';
import { newInquiryId, newReportId, stampNow } from '../applications/appUtils';
import { useBillingPlan } from './billingPlan';
import { methodLabel } from '../../data/billingPlans';

const receiptNo = () => `RCT-2026-${Math.floor(100000 + Math.random() * 900000)}`;

/**
 * Unlocks a Basic or Full report for the whole institution: logs the consented inquiry, records the purchase
 * (with payment method and receipt, or as covered by the subscription), writes the audit trail and — for an
 * online application — moves the application to "Credit check" with a case-history entry.
 */
export default function usePurchaseReport() {
  const store = useStore();
  const { add, patch, logAudit, reportPurchases, loanApplications, inquiries, disputes } = store;
  const { user, tenant, institution } = useTenant();
  const { subscribed, debit } = useBillingPlan();
  const short = institution?.short ?? 'PGMF';
  const actor = { actor: user.name, role: user.role, tenant };

  return ({ borrowerId, tier, purpose, consentRef, applicationId = null, method }) => {
    const covered = subscribed;
    const price = covered ? 0 : REPORT_TIERS[tier].price;
    const at = stampNow();
    const reportId = newReportId();
    const inquiry = {
      id: newInquiryId(), borrowerId, mfiId: tenant, user: user.name, purpose, consentRef, reportType: tier, reportId, ruleVersion: RULE_VERSION, dataDate: DATA_AS_OF,
      at, billable: price > 0, price, currency: 'USD', result: 'Match', ...(applicationId ? { applicationId } : {}), ...(covered ? { coveredBy: 'Subscription' } : {}),
    };
    add('inquiries', inquiry);
    const base = makePurchase({ purchases: reportPurchases, mfiId: tenant, borrowerId, tier, user, purpose, consentRef, inquiryId: inquiry.id, applicationId });
    const payment = covered
      ? { method: 'Subscription', receiptNo: null, paidAt: at }
      : { method: methodLabel(method), receiptNo: receiptNo(), paidAt: at, status: method === 'invoice' ? 'On next invoice' : 'Paid' };
    const purchase = { ...base, at, price, payment, billing: covered ? 'Included in subscription' : method === 'invoice' ? 'Invoiced monthly' : 'Paid at checkout', ...(covered ? { coveredBy: 'Subscription' } : {}) };
    add('reportPurchases', purchase);
    if (!covered && method === 'wallet') debit(price, `${purchase.id} · ${tier} report ${borrowerId}`);

    const charge = covered ? 'covered by subscription' : `USD ${price}`;
    logAudit({ ...actor, action: 'REPORT_PURCHASED', module: 'Inquiry', target: `${borrowerId} · ${tier} · ${charge}`, purpose, outcome: covered ? 'Subscription' : `${payment.method} · ${payment.receiptNo}` });
    logAudit({ ...actor, action: tier === 'Full' ? 'INQUIRY_FULL_REPORT' : 'INQUIRY_BASIC_REPORT', module: 'Inquiry', target: borrowerId, purpose, outcome: `Success · ${tier} ${charge}` });

    const app = applicationId && loanApplications.find((a) => a.id === applicationId);
    if (app) {
      const file = getBorrowerFile(borrowerId, store);
      const model = file ? buildReport(file, [inquiry, ...inquiries], disputes) : null;
      const result = model?.grade ? `grade ${model.grade}` : 'no credit record';
      const what = covered ? `${tier} report opened (included in subscription)` : `${tier} report purchased (USD ${price})`;
      patch('loanApplications', app.id, (a) => ({
        status: ['Submitted', 'Credit check'].includes(a.status) ? 'Credit check' : a.status, inquiryId: inquiry.id,
        history: [...a.history, { at, by: `${user.name} (${short})`, action: `${what} by ${user.name} — ${result} (report ${reportId})` }],
      }));
    }
    return { inquiry, purchase };
  };
}
