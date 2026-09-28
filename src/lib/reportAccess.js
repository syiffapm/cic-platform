/**
 * Pay-per-report access for institutions (C6 Inquiry + C9 Billing).
 * - Basic report USD 2, Full report USD 4, per borrower, per institution.
 * - A purchase by any user unlocks that tier for every user of the same institution for 30 days.
 * - Full includes everything in Basic; Basic does not include Full (an upgrade costs USD 4).
 * - A purchase still needs a valid purpose and borrower consent, and is logged as an inquiry.
 */
export const REPORT_TIERS = {
  Basic: { price: 2, currency: 'USD', label: 'Basic report', includes: ['Identity match and active loans', 'Total exposure across institutions', 'Current delinquency flag', 'Credit grade (A–E)'] },
  Full: { price: 4, currency: 'USD', label: 'Full report', includes: ['Everything in Basic', '24-month repayment history per loan', 'Closed loans, guarantees and inquiries', 'Grade reason codes and dispute flags', 'Printable PDF with QR verification'] },
};
export const ACCESS_DAYS = 30;
const TODAY = '2026-09-25';

const addDays = (iso, days) => { const d = new Date(iso); d.setDate(d.getDate() + days); return d.toISOString().slice(0, 10); };
const active = (p, today) => p.validUntil >= today;

/** What an institution may currently see for a borrower: { basic, full } → the unlocking purchase or null. */
export function entitlementFor(purchases, mfiId, borrowerId, today = TODAY) {
  const mine = purchases.filter((p) => p.mfiId === mfiId && p.borrowerId === borrowerId && active(p, today));
  const full = mine.find((p) => p.tier === 'Full') ?? null;
  const basic = mine.find((p) => p.tier === 'Basic') ?? full;
  return { basic, full };
}

/** Builds a purchase record. `id` like RPU-2026-00012; charged to the institution's billing account. */
export function makePurchase({ purchases, mfiId, borrowerId, tier, user, purpose, consentRef, inquiryId, applicationId = null, now = new Date() }) {
  const seq = String(purchases.length + 13).padStart(5, '0');
  const at = now.toISOString().slice(0, 16).replace('T', ' ');
  return {
    id: `RPU-2026-${seq}`, mfiId, borrowerId, tier, price: REPORT_TIERS[tier].price, currency: 'USD',
    purchasedBy: user.name, purchasedByRole: user.role, at, validUntil: addDays(at.slice(0, 10), ACCESS_DAYS),
    purpose, consentRef, inquiryId, applicationId, billing: 'Invoiced monthly',
  };
}

/** Totals for billing views: { count, amount, basic, full } for an institution (optionally within a month 'YYYY-MM'). */
export function spendFor(purchases, mfiId, month) {
  const rows = purchases.filter((p) => (!mfiId || p.mfiId === mfiId) && (!month || p.at.startsWith(month)));
  return { count: rows.length, amount: rows.reduce((s, p) => s + p.price, 0), basic: rows.filter((p) => p.tier === 'Basic').length, full: rows.filter((p) => p.tier === 'Full').length };
}
