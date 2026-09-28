/**
 * Submission batches. Tagged by tenant; pages always filter by the session tenant.
 * The MFI-002 record exists only to prove the tenant filter works (it must never appear for PGMF users).
 */
export const PIPELINE = ['Uploaded', 'Validating', 'Awaiting approval', 'Approved', 'Identity resolution', 'Loaded', 'Receipt'];

export const SCHEMA_VERSIONS = [
  { value: 'v3.2', label: 'v3.2 — current (mandatory from 1 Nov 2026)' },
  { value: 'v3.1', label: 'v3.1 — deprecated (accepted until October cut-off)' },
];

export const BATCHES = [
  {
    id: 'BAT-PGMF-2026-09-A', tenant: 'MFI-001', period: '2026-08', fileName: 'pgmf_2026-08_monthly.csv', format: 'CSV', schema: 'v3.2', channel: 'Portal',
    uploadedBy: 'U-M003', uploadedByName: 'Ko Thiha Aung', uploadedAt: '2026-09-24 09:40', status: 'Awaiting approval',
    received: 48_210, accepted: 48_102, rejected: 108, warnings: 214,
    control: { records: 48_210, outstanding: 61_284_550_000, licenceNo: 'MFI-0001/2012' },
    computed: { records: 48_210, outstanding: 61_284_550_000 },
  },
  {
    id: 'BAT-PGMF-2026-09-D23', tenant: 'MFI-001', period: '2026-09', fileName: 'api-daily-2026-09-23.json', format: 'API', schema: 'v3.2', channel: 'API',
    uploadedBy: 'API', uploadedByName: 'pgmf-core-banking (API)', uploadedAt: '2026-09-23 23:04', status: 'Awaiting approval',
    received: 1_236, accepted: 1_233, rejected: 3, warnings: 9,
    control: { records: 1_236, outstanding: 1_463_900_000, licenceNo: 'MFI-0001/2012' },
    computed: { records: 1_236, outstanding: 1_463_900_000 },
  },
  {
    id: 'BAT-PGMF-2026-09-D17', tenant: 'MFI-001', period: '2026-09', fileName: 'api-daily-2026-09-17.json', format: 'API', schema: 'v3.2', channel: 'API',
    uploadedBy: 'API', uploadedByName: 'pgmf-core-banking (API)', uploadedAt: '2026-09-17 23:05', status: 'Identity resolution',
    received: 1_184, accepted: 1_180, rejected: 4, warnings: 11, approvedBy: 'Daw Khin Mar', approvedAt: '2026-09-18 08:30',
    control: { records: 1_184, outstanding: 1_402_300_000, licenceNo: 'MFI-0001/2012' },
    computed: { records: 1_184, outstanding: 1_402_300_000 },
  },
  {
    id: 'BAT-PGMF-2026-08-B', tenant: 'MFI-001', period: '2026-07', fileName: 'pgmf_2026-07_monthly_fixed.csv', format: 'CSV', schema: 'v3.2', channel: 'Portal',
    uploadedBy: 'U-M003', uploadedByName: 'Ko Thiha Aung', uploadedAt: '2026-08-06 14:12', status: 'Loaded',
    received: 47_880, accepted: 47_851, rejected: 29, warnings: 180, approvedBy: 'Daw Khin Mar', approvedAt: '2026-08-06 16:40',
    receiptNo: 'RCP-PGMF-2026-07-0001', loadedAt: '2026-08-06 18:02', resubmissionOf: 'BAT-PGMF-2026-08-A',
    control: { records: 47_880, outstanding: 60_912_000_000, licenceNo: 'MFI-0001/2012' },
    computed: { records: 47_880, outstanding: 60_912_000_000 },
  },
  {
    id: 'BAT-PGMF-2026-08-A', tenant: 'MFI-001', period: '2026-07', fileName: 'pgmf_2026-07_monthly.csv', format: 'CSV', schema: 'v3.1', channel: 'Portal',
    uploadedBy: 'U-M003', uploadedByName: 'Ko Thiha Aung', uploadedAt: '2026-08-05 10:03', status: 'Validation failed',
    received: 47_880, accepted: 44_310, rejected: 3_570, warnings: 402,
    control: { records: 47_880, outstanding: 60_912_000_000, licenceNo: 'MFI-0001/2012' },
    computed: { records: 47_880, outstanding: 58_004_750_000 },
  },
  {
    id: 'BAT-PGMF-2026-07-A', tenant: 'MFI-001', period: '2026-06', fileName: 'pgmf_2026-06_monthly.xlsx', format: 'XLSX', schema: 'v3.1', channel: 'Portal',
    uploadedBy: 'U-M003', uploadedByName: 'Ko Thiha Aung', uploadedAt: '2026-07-04 11:20', status: 'Loaded',
    received: 47_302, accepted: 47_260, rejected: 42, warnings: 250, approvedBy: 'Daw Khin Mar', approvedAt: '2026-07-04 15:02',
    receiptNo: 'RCP-PGMF-2026-06-0001', loadedAt: '2026-07-04 17:45',
    control: { records: 47_302, outstanding: 60_120_400_000, licenceNo: 'MFI-0001/2012' },
    computed: { records: 47_302, outstanding: 60_120_400_000 },
  },
  {
    id: 'BAT-PGMF-2026-06-A', tenant: 'MFI-001', period: '2026-05', fileName: 'pgmf_2026-05_monthly.xml', format: 'XML', schema: 'v3.1', channel: 'Portal',
    uploadedBy: 'U-M003', uploadedByName: 'Ko Thiha Aung', uploadedAt: '2026-06-05 09:55', status: 'Loaded',
    received: 46_910, accepted: 46_850, rejected: 60, warnings: 310, approvedBy: 'Daw Khin Mar', approvedAt: '2026-06-05 13:10',
    receiptNo: 'RCP-PGMF-2026-05-0001', loadedAt: '2026-06-05 15:30',
    control: { records: 46_910, outstanding: 59_480_000_000, licenceNo: 'MFI-0001/2012' },
    computed: { records: 46_910, outstanding: 59_480_000_000 },
  },
  {
    id: 'BAT-AMM-2026-09-A', tenant: 'MFI-002', period: '2026-08', fileName: 'amm_aug.csv', format: 'CSV', schema: 'v3.2', channel: 'Portal',
    uploadedBy: 'AMM-U01', uploadedByName: 'AMM Data Officer', uploadedAt: '2026-09-05 10:00', status: 'Loaded',
    received: 21_150, accepted: 21_100, rejected: 50, warnings: 90, receiptNo: 'RCP-AMM-2026-08-0001',
    control: { records: 21_150, outstanding: 24_800_000_000, licenceNo: 'MFI-0014/2013' },
    computed: { records: 21_150, outstanding: 24_800_000_000 },
  },
];

/** Sample row-level issues by code. The on-screen report shows the first page. */
export const ERROR_CODES = {
  E101: { field: 'nrc', message: 'Invalid NRC format — expected 12/ABC(N)123456', severity: 'Error' },
  E102: { field: 'dob', message: 'Date of birth in the future or borrower under 18', severity: 'Error' },
  E150: { field: 'guarantor_nrc', message: 'Guarantor NRC missing (mandatory in schema v3.2)', severity: 'Error' },
  E204: { field: 'dpd', message: 'Days past due is negative', severity: 'Error' },
  E211: { field: 'outstanding', message: 'Outstanding exceeds disbursed amount + interest', severity: 'Error' },
  E230: { field: 'closure_date', message: 'Closure date before disbursement date', severity: 'Error' },
  W301: { field: 'phone', message: 'Phone number missing', severity: 'Warning' },
  W305: { field: 'household_size', message: 'Household size missing — defaulted to blank', severity: 'Warning' },
  W310: { field: 'address_ward', message: 'Ward not found in township reference list', severity: 'Warning' },
};

const PATTERN = ['E101', 'W301', 'E204', 'W305', 'E211', 'W301', 'E150', 'W310', 'E101', 'E230', 'W301', 'E102'];
const VALUES = { E101: '12/OKM245781', E102: '2011-02-30', E150: '', E204: '-3', E211: '2,450,000', E230: '2025-01-04', W301: '', W305: '', W310: 'Ward 41' };

export function errorsFor(batch) {
  if (!batch.rejected && !batch.warnings) return [];
  const count = Math.min(40, batch.rejected + batch.warnings);
  const seed = batch.id.length;
  return Array.from({ length: count }, (_, i) => {
    const code = batch.schema === 'v3.1' && i % 3 === 0 ? 'E150' : PATTERN[(i + seed) % PATTERN.length];
    return {
      id: `${batch.id}-${i}`,
      row: 118 + i * 377 + ((i * seed) % 97),
      loanId: `PGMF-LN-${String(200100 + i * 131).padStart(6, '0')}`,
      code,
      value: VALUES[code],
      ...ERROR_CODES[code],
    };
  });
}
