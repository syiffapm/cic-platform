/**
 * Lending activity aggregates (DWH monthly cube, cut-off last day of month). Sector-wide counts of
 * loan applications reported by MFIs and made through the Borrower portal. No borrower-level rows.
 */
export const LENDING_AS_OF = '31 Aug 2026';
const AVG_LOAN_MMK = 1_080_000;

const MONTHS = ['Sep 25', 'Oct 25', 'Nov 25', 'Dec 25', 'Jan 26', 'Feb 26', 'Mar 26', 'Apr 26', 'May 26', 'Jun 26', 'Jul 26', 'Aug 26'];
const ONLINE = [2410, 2930, 3480, 4120, 4870, 5610, 6390, 7180, 7940, 8820, 9610, 10420];
const BRANCH = [58240, 57610, 59080, 61790, 55420, 56930, 58310, 57240, 56080, 55790, 54910, 54180];
const APPROVAL = [74.8, 75.2, 74.1, 73.6, 74.9, 75.4, 74.2, 73.1, 72.6, 72.9, 73.4, 73.8];
const DAYS_ONLINE = [3.8, 3.6, 3.4, 3.1, 2.9, 2.7, 2.6, 2.4, 2.3, 2.2, 2.1, 2.0];
const DAYS_BRANCH = [6.9, 6.8, 6.9, 6.7, 6.6, 6.4, 6.5, 6.3, 6.2, 6.2, 6.1, 6.0];
const MULTI_SHARE = [7.9, 8.1, 8.3, 8.6, 8.4, 8.8, 9.1, 9.4, 9.6, 9.9, 10.2, 10.5];
const MULTI_APPROVAL = [51, 50, 49, 48, 47, 46, 45, 44, 43, 42, 41, 40];
const ACCOUNTS = [38210, 49640, 61930, 74820, 88150, 101470, 114230, 127910, 141280, 155640, 170380, 186240];
const REPORT_VIEWS = [11840, 14210, 16930, 19120, 22380, 25790, 28740, 32310, 35120, 39580, 43210, 47930];
const DISPUTES = [212, 236, 261, 284, 305, 331, 352, 377, 398, 421, 446, 468];

export const LENDING_MONTHLY = MONTHS.map((month, i) => {
  const total = ONLINE[i] + BRANCH[i];
  const decided = Math.round(total * 0.94);
  const approved = Math.round(decided * (APPROVAL[i] / 100));
  return {
    month,
    online: ONLINE[i],
    branch: BRANCH[i],
    total,
    approved,
    declined: decided - approved,
    approvalRate: APPROVAL[i],
    onlineShare: Math.round((ONLINE[i] / total) * 1000) / 10,
    daysOnline: DAYS_ONLINE[i],
    daysBranch: DAYS_BRANCH[i],
    disbursedBn: Math.round((approved * 0.97 * AVG_LOAN_MMK) / 1e8) / 10,
    multiShare: MULTI_SHARE[i],
    multiApps: Math.round(total * (MULTI_SHARE[i] / 100)),
    multiApproval: MULTI_APPROVAL[i],
    accounts: ACCOUNTS[i],
    reportViews: REPORT_VIEWS[i],
    disputesFiled: DISPUTES[i],
  };
});

/** Decline reasons, last 12 months (codes as in the MFI decision form). */
export const DECLINE_COUNTS = { L01: 49120, L02: 38460, L03: 26870, L04: 16240, L05: 8310 };

/** Disbursed amount by region, last 12 months (bn MMK). */
export const DISBURSED_BY_REGION = [
  { region: 'Yangon', bn: 176.4 }, { region: 'Mandalay', bn: 112.8 }, { region: 'Ayeyarwady', bn: 94.1 },
  { region: 'Bago', bn: 58.7 }, { region: 'Sagaing', bn: 51.2 }, { region: 'Magway', bn: 47.9 },
  { region: 'Shan', bn: 33.6 }, { region: 'Mon', bn: 24.8 }, { region: 'Tanintharyi', bn: 11.5 },
];

/** Disbursed amount by institution, last 12 months (bn MMK). */
export const DISBURSED_BY_MFI = {
  'MFI-001': 168.2, 'MFI-002': 121.4, 'MFI-003': 97.3, 'MFI-004': 48.1, 'MFI-005': 44.6, 'MFI-012': 33.2,
  'MFI-008': 29.4, 'MFI-009': 21.3, 'MFI-010': 12.1, 'MFI-006': 8.9, 'MFI-007': 2.1,
};

/** How citizen accounts were verified at registration (share of all accounts). */
export const VERIFICATION_SPLIT = [
  { method: 'OTP to phone on record at an MFI', pct: 58 },
  { method: 'NRC + selfie eKYC', pct: 34 },
  { method: 'In person at a CIC help desk', pct: 8 },
];

/**
 * Personal credit report requests made by citizens through the Borrower portal (validated and issued
 * by CIC). Monthly aggregates; median hours from request to issue.
 */
const RR_REQUESTED = [1840, 2310, 2890, 3420, 4010, 4620, 5180, 5790, 6340, 6920, 7510, 8160];
const RR_REJECT_PCT = [4.1, 3.9, 3.8, 3.6, 3.5, 3.4, 3.3, 3.2, 3.2, 3.1, 3.0, 2.9];
const RR_MEDIAN_HOURS = [31, 29, 27, 25, 23, 21, 20, 19, 18, 17, 16, 15];
export const REPORT_REQUESTS_MONTHLY = MONTHS.map((month, i) => {
  const rejected = Math.round(RR_REQUESTED[i] * (RR_REJECT_PCT[i] / 100));
  return { month, requested: RR_REQUESTED[i], rejected, issued: RR_REQUESTED[i] - rejected, medianHours: RR_MEDIAN_HOURS[i] };
});
