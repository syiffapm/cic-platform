/** KPI dictionary (BRD §7.3). Every tile references one of these so numbers match everywhere. */
export const AS_OF = '31 Aug 2026';

export const KPI_DICTIONARY = [
  { id: 'coverage', name: 'Reporting coverage', definition: 'MFIs submitting on time ÷ licensed MFIs', frequency: 'Monthly', source: 'C4 Ingestion, C2 Institution Master', value: 83.3, unit: '%' },
  { id: 'borrowers', name: 'Borrowers covered', definition: 'Distinct resolved borrower IDs with ≥ 1 active loan', frequency: 'Monthly', source: 'C3 Registry, C5 Identity Resolution', value: 1_203_600, unit: '' },
  { id: 'portfolio', name: 'Gross portfolio (MMK)', definition: 'Sum of outstanding principal, active loans', frequency: 'Monthly', source: 'C3 Registry', value: 1_393_500_000_000, unit: 'MMK' },
  { id: 'par30', name: 'PAR30', definition: 'Outstanding of loans ≥ 30 DPD ÷ gross portfolio', frequency: 'Monthly', source: 'C3 Registry', value: 3.2, unit: '%' },
  { id: 'npl', name: 'NPL ratio', definition: 'Outstanding of loans classified non-performing ÷ gross portfolio', frequency: 'Monthly', source: 'C3 Registry', value: 2.1, unit: '%' },
  { id: 'multi', name: 'Multiple borrowing rate', definition: 'Borrowers with ≥ 3 active loans across MFIs ÷ borrowers covered', frequency: 'Monthly', source: 'C3 Registry, C5 Identity Resolution', value: 6.8, unit: '%' },
  { id: 'disputeSla', name: 'Dispute SLA compliance', definition: 'Disputes closed within SLA ÷ disputes closed', frequency: 'Monthly', source: 'C7 Dispute & Correction', value: 91.4, unit: '%' },
  { id: 'dq', name: 'Data quality score', definition: 'Accepted rows ÷ received rows, weighted by critical-field completeness', frequency: 'Per batch', source: 'C4 Ingestion & Data Quality', value: 94.7, unit: '%' },
  { id: 'inquiries', name: 'Inquiry volume', definition: 'Billable inquiries by purpose and MFI', frequency: 'Daily', source: 'C6 Inquiry, C9 Metering', value: 48_210, unit: '' },
];

export const kpi = (id) => KPI_DICTIONARY.find((k) => k.id === id);

/** 12-month sector trend, published aggregates. */
export const SECTOR_TREND = [
  { month: 'Sep 25', portfolio: 1210, par30: 3.9, npl: 2.6, borrowers: 1102, inquiries: 38.1 },
  { month: 'Oct 25', portfolio: 1228, par30: 3.8, npl: 2.6, borrowers: 1110, inquiries: 39.4 },
  { month: 'Nov 25', portfolio: 1241, par30: 3.8, npl: 2.5, borrowers: 1118, inquiries: 40.2 },
  { month: 'Dec 25', portfolio: 1262, par30: 3.7, npl: 2.5, borrowers: 1126, inquiries: 42.8 },
  { month: 'Jan 26', portfolio: 1270, par30: 3.6, npl: 2.4, borrowers: 1131, inquiries: 41.0 },
  { month: 'Feb 26', portfolio: 1284, par30: 3.6, npl: 2.4, borrowers: 1140, inquiries: 41.9 },
  { month: 'Mar 26', portfolio: 1301, par30: 3.5, npl: 2.3, borrowers: 1152, inquiries: 43.6 },
  { month: 'Apr 26', portfolio: 1319, par30: 3.4, npl: 2.3, borrowers: 1161, inquiries: 44.1 },
  { month: 'May 26', portfolio: 1336, par30: 3.4, npl: 2.2, borrowers: 1172, inquiries: 45.5 },
  { month: 'Jun 26', portfolio: 1352, par30: 3.3, npl: 2.2, borrowers: 1184, inquiries: 46.0 },
  { month: 'Jul 26', portfolio: 1371, par30: 3.3, npl: 2.1, borrowers: 1195, inquiries: 47.3 },
  { month: 'Aug 26', portfolio: 1393, par30: 3.2, npl: 2.1, borrowers: 1203, inquiries: 48.2 },
];

export const PORTFOLIO_BY_REGION = [
  { region: 'Yangon', portfolio: 412, borrowers: 342, par30: 2.6 },
  { region: 'Mandalay', portfolio: 268, borrowers: 221, par30: 3.1 },
  { region: 'Ayeyarwady', portfolio: 231, borrowers: 214, par30: 4.2 },
  { region: 'Bago', portfolio: 142, borrowers: 118, par30: 3.5 },
  { region: 'Magway', portfolio: 124, borrowers: 102, par30: 5.4 },
  { region: 'Sagaing', portfolio: 98, borrowers: 87, par30: 6.8 },
  { region: 'Shan', portfolio: 58, borrowers: 49, par30: 4.1 },
  { region: 'Mon', portfolio: 31, borrowers: 38, par30: 5.9 },
  { region: 'Tanintharyi', portfolio: 18, borrowers: 22, par30: 4.9 },
  { region: 'Others', portfolio: 11, borrowers: 10, par30: 5.1 },
];
