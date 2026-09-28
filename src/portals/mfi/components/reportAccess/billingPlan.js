import { useCallback, useMemo } from 'react';
import { entitlementFor } from '@/lib/reportAccess';
import { useStore } from '@/context/StoreContext';
import { DEFAULT_PAYMENT_METHOD, defaultPlan } from '../../data/billingPlans';
import { useMfi, useTenant, nowStamp } from '../MfiState';

/** The signed-in institution's billing plan and prepaid wallet, with helpers to change them. */
export function useBillingPlan() {
  const { billingPlans = {}, update } = useMfi();
  const { tenant, user } = useTenant();
  const plan = billingPlans[tenant] ?? defaultPlan();
  const set = useCallback((fn) => update('billingPlans', (all = {}) => ({ ...all, [tenant]: fn(all[tenant] ?? defaultPlan()) })), [tenant, update]);

  const addLedger = (p, entry) => [{ id: `WLT-2026-${String(413 + (p.walletLedger?.length ?? 0)).padStart(4, '0')}`, at: nowStamp(), by: user?.name, ...entry }, ...(p.walletLedger ?? [])];
  const debit = (amount, ref) => set((p) => ({ ...p, walletBalance: +(p.walletBalance - amount).toFixed(2), walletLedger: addLedger(p, { type: 'Report purchase', amount: -amount, method: 'CIC prepaid wallet', ref }) }));
  const credit = (amount, method, ref) => set((p) => ({ ...p, walletBalance: +(p.walletBalance + amount).toFixed(2), walletLedger: addLedger(p, { type: 'Top-up', amount, method, ref }) }));

  const defaultMethod = plan.defaultMethod ?? DEFAULT_PAYMENT_METHOD;
  /** One-step purchase is offered when the default needs no redirect: monthly invoice, or the wallet if it covers the price. */
  const quickMethod = (price) => {
    if (defaultMethod === 'invoice') return 'invoice';
    if (defaultMethod === 'wallet' && plan.walletBalance >= price) return 'wallet';
    return null;
  };

  return { plan, subscribed: plan.type === 'Subscription' && plan.subscription?.status === 'Active', set, debit, credit, defaultMethod, quickMethod };
}

/** What the institution currently holds for a borrower: { basic, full, tier: 'Full'|'Basic'|null, purchase }. */
export function useEntitlement(borrowerId) {
  const { reportPurchases } = useStore();
  const { tenant } = useTenant();
  return useMemo(() => {
    const e = entitlementFor(reportPurchases, tenant, borrowerId);
    return { ...e, tier: e.full ? 'Full' : e.basic ? 'Basic' : null, purchase: e.full ?? e.basic };
  }, [reportPurchases, tenant, borrowerId]);
}

/** Checkout URL for a report, a wallet top-up or a subscription. */
export function checkoutUrl(params) {
  const q = new URLSearchParams(Object.entries(params).filter(([, v]) => v != null && v !== ''));
  return `/mfi/checkout?${q.toString()}`;
}
