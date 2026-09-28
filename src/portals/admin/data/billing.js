/** Billing mock data (A10, ADM-10, AC08). Amounts in MMK; commercial tax 5 %. */
export const TAX_RATE = 0.05;
export const PRICE = { Basic: 500, Full: 1500 };
export const PERIODS = [{ value: '2026-09', label: 'September 2026' }, { value: '2026-08', label: 'August 2026' }];

export const TARIFF_PLANS = [
  { id: 'Basic', name: 'Basic', monthly: 150_000, quota: 500, features: ['Basic & Full reports', 'Portal access (5 users)', 'Email support'], tone: 'slate' },
  { id: 'Standard', name: 'Standard', monthly: 600_000, quota: 3_000, features: ['Everything in Basic', 'Submission API', 'Portfolio monitoring (S9)', '20 users'], tone: 'teal' },
  { id: 'Premium', name: 'Premium', monthly: 2_500_000, quota: 15_000, features: ['Everything in Standard', 'Inquiry API + webhooks', 'Dedicated account manager', 'Unlimited users'], tone: 'navy' },
];
export const planOf = (id) => TARIFF_PLANS.find((p) => p.id === id);

/** September 2026 usage per MFI (billable counts exclude retries and duplicates within 5 minutes). */
export const USAGE = {
  'MFI-001': { plan: 'Premium', basic: 11_240, full: 5_130, retries: 412, dupes: 37 },
  'MFI-002': { plan: 'Premium', basic: 6_020, full: 2_880, retries: 188, dupes: 21 },
  'MFI-003': { plan: 'Standard', basic: 2_410, full: 1_205, retries: 96, dupes: 14 },
  'MFI-004': { plan: 'Standard', basic: 1_880, full: 640, retries: 131, dupes: 9 },
  'MFI-005': { plan: 'Standard', basic: 1_320, full: 870, retries: 54, dupes: 6 },
  'MFI-006': { plan: 'Basic', basic: 380, full: 95, retries: 22, dupes: 3 },
  'MFI-008': { plan: 'Standard', basic: 1_150, full: 410, retries: 38, dupes: 4 },
  'MFI-009': { plan: 'Basic', basic: 460, full: 120, retries: 17, dupes: 2 },
  'MFI-010': { plan: 'Basic', basic: 210, full: 44, retries: 9, dupes: 0 },
  'MFI-012': { plan: 'Standard', basic: 990, full: 520, retries: 29, dupes: 5 },
};

/** Charge calculation: the plan quota covers the first N inquiries (Basic first), the rest is billed per inquiry. */
export function computeInvoice(mfi, period = '2026-09') {
  const u = USAGE[mfi.id];
  const plan = planOf(u.plan);
  const events = u.basic + u.full;
  const basicCovered = Math.min(u.basic, plan.quota);
  const fullCovered = Math.min(u.full, plan.quota - basicCovered);
  const chargeBasic = u.basic - basicCovered;
  const chargeFull = u.full - fullCovered;
  const subscription = plan.monthly;
  const usage = chargeBasic * PRICE.Basic + chargeFull * PRICE.Full;
  const amount = subscription + usage;
  const tax = Math.round(amount * TAX_RATE);
  return {
    id: `INV-${period}-${mfi.id.slice(-3)}`, period, mfiId: mfi.id, mfi: mfi.short ?? mfi.name, plan: plan.id,
    events, retriesExcluded: u.retries + u.dupes, chargeBasic, chargeFull, subscription, usage, amount, tax, total: amount + tax,
    status: 'Draft', dueDate: '2026-10-15',
  };
}

const TYPES = ['Basic', 'Full'];
const MFIS = ['MFI-001', 'MFI-002', 'MFI-003', 'MFI-004', 'MFI-005', 'MFI-008', 'MFI-012'];
/** Recent billable-event ledger (sample of the last hour). */
export const LEDGER = Array.from({ length: 28 }, (_, i) => {
  const mfi = MFIS[(i * 3) % MFIS.length];
  const min = 59 - i * 2;
  const base = { id: `BE-${884120 - i}`, inquiryId: `INQ-2026-${(551840 - i * 7).toString()}`, mfiId: mfi, reportType: TYPES[i % 3 === 0 ? 1 : 0], at: `2026-09-25 10:${String(Math.max(min, 0)).padStart(2, '0')}:${String((i * 17) % 60).padStart(2, '0')}`, billable: true, flag: null, attempt: 1 };
  return base;
}).map((e, i, arr) => {
  if (i === 3 || i === 11 || i === 19) return { ...e, inquiryId: arr[i + 1].inquiryId, mfiId: arr[i + 1].mfiId, reportType: arr[i + 1].reportType, billable: false, flag: 'Retry — excluded', attempt: 2, note: 'Same request id after gateway timeout (HTTP 504)' };
  if (i === 7 || i === 15) return { ...e, inquiryId: arr[i + 1].inquiryId, mfiId: arr[i + 1].mfiId, reportType: arr[i + 1].reportType, billable: false, flag: 'Duplicate within 5 min — excluded', note: 'Same borrower, purpose and officer within 5 minutes' };
  return e;
});

export const CREDIT_NOTES_SEED = [
  { id: 'CN-2026-014', invoice: 'INV-2026-08-004', mfiId: 'MFI-004', amount: 187_500, reason: 'Retries billed during API outage 12 Aug (INC-2026-088)', status: 'Issued', date: '2026-09-03', maker: 'U Tin Maung' },
  { id: 'CN-2026-013', invoice: 'INV-2026-08-006', mfiId: 'MFI-006', amount: 75_000, reason: 'Pro-rata subscription — supervisory review period', status: 'Issued', date: '2026-09-02', maker: 'U Tin Maung' },
  { id: 'CN-2026-011', invoice: 'INV-2026-07-001', mfiId: 'MFI-001', amount: 42_000, reason: 'Duplicate Full report (officer double-click)', status: 'Applied', date: '2026-08-09', maker: 'U Tin Maung' },
];

/** August 2026 reconciliation: billable inquiries in the ledger vs quantities invoiced. */
export const RECON = [
  { mfiId: 'MFI-001', billable: 15_904, invoiced: 15_904 },
  { mfiId: 'MFI-002', billable: 8_412, invoiced: 8_412 },
  { mfiId: 'MFI-003', billable: 3_388, invoiced: 3_388 },
  { mfiId: 'MFI-004', billable: 2_301, invoiced: 2_426, note: 'Invoice included 125 retries during API outage — credit note CN-2026-014 raised' },
  { mfiId: 'MFI-005', billable: 2_075, invoiced: 2_075 },
  { mfiId: 'MFI-006', billable: 502, invoiced: 502 },
  { mfiId: 'MFI-008', billable: 1_486, invoiced: 1_479, note: '7 late-arriving events after cut-off — carried into September' },
  { mfiId: 'MFI-009', billable: 544, invoiced: 544 },
  { mfiId: 'MFI-010', billable: 231, invoiced: 231 },
  { mfiId: 'MFI-012', billable: 1_402, invoiced: 1_402 },
];

/** Payment status of August 2026 invoices (due 15 Sep 2026; today 25 Sep 2026). */
export const PAYMENTS = [
  { invoice: 'INV-2026-08-001', mfiId: 'MFI-001', total: 4_615_500, dueDate: '2026-09-15', status: 'Paid', paidOn: '2026-09-08', ref: 'KBZ TT 88213004' },
  { invoice: 'INV-2026-08-002', mfiId: 'MFI-002', total: 2_488_500, dueDate: '2026-09-15', status: 'Paid', paidOn: '2026-09-12', ref: 'CB TT 51220981' },
  { invoice: 'INV-2026-08-003', mfiId: 'MFI-003', total: 1_512_000, dueDate: '2026-09-15', status: 'Paid', paidOn: '2026-09-15', ref: 'AYA TT 70112459' },
  { invoice: 'INV-2026-08-004', mfiId: 'MFI-004', total: 819_000, dueDate: '2026-09-15', status: 'Overdue', paidOn: null, ref: '' },
  { invoice: 'INV-2026-08-005', mfiId: 'MFI-005', total: 630_000, dueDate: '2026-09-15', status: 'Paid', paidOn: '2026-09-10', ref: 'KBZ TT 88219117' },
  { invoice: 'INV-2026-08-006', mfiId: 'MFI-006', total: 157_500, dueDate: '2026-09-15', status: 'Overdue', paidOn: null, ref: '' },
  { invoice: 'INV-2026-08-008', mfiId: 'MFI-008', total: 630_000, dueDate: '2026-09-30', status: 'Unpaid', paidOn: null, ref: '' },
  { invoice: 'INV-2026-08-009', mfiId: 'MFI-009', total: 220_500, dueDate: '2026-09-30', status: 'Unpaid', paidOn: null, ref: '' },
  { invoice: 'INV-2026-08-010', mfiId: 'MFI-010', total: 157_500, dueDate: '2026-09-15', status: 'Paid', paidOn: '2026-09-05', ref: 'MAB TT 30044521' },
  { invoice: 'INV-2026-08-012', mfiId: 'MFI-012', total: 630_000, dueDate: '2026-09-30', status: 'Unpaid', paidOn: null, ref: '' },
];
