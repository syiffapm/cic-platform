/** Portfolio monitoring alerts on own borrowers. Generated nightly against the tenant's active book. */
export const ALERT_TYPES = ['New external loan', 'Default elsewhere', 'New inquiry by other MFI', 'Over-indebtedness threshold'];

export const ALERTS = [
  { id: 'ALT-7741', tenant: 'MFI-001', type: 'Default elsewhere', severity: 'High', borrowerId: 'BRW-003902', borrowerName: 'Ko Aung Aung', ownLoan: 'PGMF-LN-150234', detail: 'Loan at Yangon Women Enterprise Fund reached 45 DPD (Substandard).', otherMfi: 'MFI-012', at: '2026-09-24 02:10', status: 'New' },
  { id: 'ALT-7738', tenant: 'MFI-001', type: 'Default elsewhere', severity: 'High', borrowerId: 'BRW-003902', borrowerName: 'Ko Aung Aung', ownLoan: 'PGMF-LN-150234', detail: 'Loan at Golden Delta Finance reached 31 DPD.', otherMfi: 'MFI-007', at: '2026-09-21 02:10', status: 'New' },
  { id: 'ALT-7735', tenant: 'MFI-001', type: 'New inquiry by other MFI', severity: 'Medium', borrowerId: 'BRW-003902', borrowerName: 'Ko Aung Aung', ownLoan: 'PGMF-LN-150234', detail: 'Maha Agriculture Microfinance made a New-loan inquiry.', otherMfi: 'MFI-004', at: '2026-08-29 02:10', status: 'New' },
  { id: 'ALT-7730', tenant: 'MFI-001', type: 'New external loan', severity: 'Medium', borrowerId: 'BRW-000184', borrowerName: 'Daw Hnin Wai', ownLoan: 'PGMF-LN-118830', detail: 'New individual loan 2,500,000 MMK disbursed by Alliance Myanmar Microfinance.', otherMfi: 'MFI-002', at: '2026-09-19 02:10', status: 'New' },
  { id: 'ALT-7722', tenant: 'MFI-001', type: 'Over-indebtedness threshold', severity: 'High', borrowerId: 'BRW-000184', borrowerName: 'Daw Hnin Wai', ownLoan: 'PGMF-LN-118830', detail: 'Borrower now has 3 active loans across 3 institutions (threshold: 3).', otherMfi: null, at: '2026-09-19 02:10', status: 'New' },
  { id: 'ALT-7701', tenant: 'MFI-001', type: 'New inquiry by other MFI', severity: 'Low', borrowerId: 'BRW-004777', borrowerName: 'U Aung Aung', ownLoan: 'PGMF-LN-088120', detail: 'Sathapana Myanmar Finance made a Review inquiry.', otherMfi: 'MFI-005', at: '2026-09-12 02:10', status: 'Acknowledged', ackBy: 'Ma Su Myat' },
  { id: 'ALT-7688', tenant: 'MFI-001', type: 'New external loan', severity: 'Low', borrowerId: 'BRW-003318', borrowerName: 'U Aung Aung', ownLoan: 'PGMF-LN-099310', detail: 'New agriculture loan 1,500,000 MMK disbursed by Vision Fund Myanmar.', otherMfi: 'MFI-003', at: '2026-05-11 02:10', status: 'Acknowledged', ackBy: 'Ma Su Myat' },
  { id: 'ALT-7650', tenant: 'MFI-001', type: 'Default elsewhere', severity: 'High', borrowerId: 'BRW-006611', borrowerName: 'Daw Thida', ownLoan: 'PGMF-LN-140021', detail: 'Loan at Myanmar Ahtwin Microfinance classified Doubtful (95 DPD).', otherMfi: 'MFI-006', at: '2026-09-15 02:10', status: 'New' },
  { id: 'ALT-9001', tenant: 'MFI-002', type: 'New external loan', severity: 'Low', borrowerId: 'BRW-000184', borrowerName: 'Daw Hnin Wai', ownLoan: 'AMM-LN-778120', detail: 'Other tenant — must never be visible to PGMF.', otherMfi: 'MFI-001', at: '2026-09-19 02:10', status: 'New' },
];

/** DQ score per monthly batch (KPI "dq": accepted ÷ received, weighted by critical-field completeness). */
export const DQ_TREND = [
  { period: 'Sep 25', dq: 96.1, sector: 93.0 }, { period: 'Oct 25', dq: 96.4, sector: 93.2 }, { period: 'Nov 25', dq: 96.9, sector: 93.1 },
  { period: 'Dec 25', dq: 97.2, sector: 93.6 }, { period: 'Jan 26', dq: 97.0, sector: 93.8 }, { period: 'Feb 26', dq: 97.6, sector: 94.0 },
  { period: 'Mar 26', dq: 97.9, sector: 94.1 }, { period: 'Apr 26', dq: 98.1, sector: 94.3 }, { period: 'May 26', dq: 98.3, sector: 94.4 },
  { period: 'Jun 26', dq: 98.4, sector: 94.5 }, { period: 'Jul 26', dq: 98.5, sector: 94.6 }, { period: 'Aug 26', dq: 98.6, sector: 94.7 },
];

/** Alternative data signals. Only shown where the borrower ticked the alt-data consent box (consent template v2). */
export const ALT_DATA = [
  { borrowerId: 'BRW-000184', name: 'Daw Hnin Wai', consent: true, consentRef: 'CNS-PGMF-24410', telcoTenure: '6 yr 2 mo', topUpRegularity: 'Weekly, stable', mobileMoney: '38 transactions / month', utilityOnTime: 100, source: 'Telco A · YESC', updated: '2026-09-01' },
  { borrowerId: 'BRW-004777', name: 'U Aung Aung', consent: true, consentRef: 'CNS-PGMF-22011', telcoTenure: '9 yr 0 mo', topUpRegularity: 'Monthly, stable', mobileMoney: '12 transactions / month', utilityOnTime: 92, source: 'Telco B · MESC', updated: '2026-09-01' },
  { borrowerId: 'BRW-003902', name: 'Ko Aung Aung', consent: false },
  { borrowerId: 'BRW-006611', name: 'Daw Thida', consent: true, consentRef: 'CNS-PGMF-20877', telcoTenure: '2 yr 5 mo', topUpRegularity: 'Irregular (3 gaps > 30 days)', mobileMoney: '4 transactions / month', utilityOnTime: 67, source: 'Telco A', updated: '2026-09-01' },
  { borrowerId: 'BRW-002331', name: 'U Tun Tun Oo', consent: false },
];
