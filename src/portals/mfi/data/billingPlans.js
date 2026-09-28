/**
 * Billing plan per institution. Pay per report: each Basic (USD 2) / Full (USD 4) report is paid at checkout
 * (prepaid wallet, monthly invoice or bank / mobile money). Subscription: unlimited checks for a monthly fee.
 */
export const SUBSCRIPTION_OFFER = { plan: 'Unlimited checks', priceMonthly: 300, currency: 'USD', includes: ['Unlimited Basic and Full reports for every user', 'No checkout for individual reports', 'Batch inquiry included', 'Cancel any time before the next renewal'] };

export const PAYMENT_METHODS = [
  { id: 'wallet', label: 'CIC prepaid wallet', hint: 'Deducted immediately from your institution\'s prepaid balance.' },
  { id: 'invoice', label: 'Monthly invoice (postpaid)', hint: 'Added to next month\'s CIC invoice, payable by bank transfer within 15 days.' },
  { id: 'kbzpay', label: 'KBZPay', hint: 'You are redirected to KBZPay to approve the payment.' },
  { id: 'wave', label: 'Wave Money', hint: 'You are redirected to Wave Money to approve the payment.' },
  { id: 'bank', label: 'Bank transfer (CBM / KBZ / AYA)', hint: 'Online banking redirect; access unlocks when the bank confirms.' },
];
export const methodLabel = (id) => PAYMENT_METHODS.find((m) => m.id === id)?.label ?? id;
/** Short name used on buttons, e.g. "Buy Basic — USD 2 · charged to Monthly invoice". */
export const methodShort = (id) => ({ wallet: 'Prepaid wallet', invoice: 'Monthly invoice', kbzpay: 'KBZPay', wave: 'Wave Money', bank: 'Bank transfer' }[id] ?? methodLabel(id));
/** Institution default for report purchases until the MFI Administrator picks another one. */
export const DEFAULT_PAYMENT_METHOD = 'invoice';

export const BILLING_PLANS = {
  'MFI-001': {
    type: 'Pay per report', walletBalance: 50, subscription: null, defaultMethod: 'invoice',
    walletLedger: [
      { id: 'WLT-2026-0412', at: '2026-09-02 10:14', type: 'Top-up', amount: 50, method: 'Bank transfer (CBM / KBZ / AYA)', ref: 'KBZ TT 88230117', by: 'U Kyaw Zin' },
    ],
  },
  'MFI-002': { type: 'Subscription', walletBalance: 0, walletLedger: [], subscription: { plan: 'Unlimited checks', priceMonthly: 300, currency: 'USD', startedAt: '2026-07-01', renewsOn: '2026-10-01', status: 'Active' } },
};
export const defaultPlan = () => ({ type: 'Pay per report', walletBalance: 0, subscription: null, walletLedger: [], defaultMethod: DEFAULT_PAYMENT_METHOD });
