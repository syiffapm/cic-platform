/** Ingestion & data quality mock data (ADM-06, AC01, AC02). Period = reporting month. */
export const BATCHES = [
  { id: 'BAT-PGMF-2026-09-A', mfiId: 'MFI-001', mfi: 'PGMF', period: 'Aug 2026', receivedAt: '2026-09-24 09:40', rows: 486_214, accepted: 485_902, schema: 'v3.2', status: 'Loaded', dq: 98.6 },
  { id: 'BAT-AMM-2026-09-A', mfiId: 'MFI-002', mfi: 'AMM', period: 'Aug 2026', receivedAt: '2026-09-23 17:12', rows: 211_530, accepted: 210_844, schema: 'v3.2', status: 'Loaded', dq: 96.2 },
  { id: 'BAT-VFM-2026-09-B', mfiId: 'MFI-003', mfi: 'VFM', period: 'Aug 2026', receivedAt: '2026-09-24 08:05', rows: 198_311, accepted: 0, schema: 'v3.2', status: 'Validating', dq: null },
  { id: 'BAT-MAHA-2026-09-A', mfiId: 'MFI-004', mfi: 'MAHA', period: 'Aug 2026', receivedAt: '2026-09-22 14:30', rows: 97_402, accepted: 86_210, schema: 'v3.1', status: 'Awaiting approval', dq: 88.5 },
  { id: 'BAT-SMF-2026-09-A', mfiId: 'MFI-005', mfi: 'SMF', period: 'Aug 2026', receivedAt: '2026-09-20 11:02', rows: 64_812, accepted: 64_590, schema: 'v3.2', status: 'Loaded', dq: 95.1 },
  { id: 'BAT-AHT-2026-09-A', mfiId: 'MFI-006', mfi: 'AHTWIN', period: 'Aug 2026', receivedAt: '2026-09-23 22:48', rows: 21_915, accepted: 15_120, schema: 'v3.0', status: 'Rejected', dq: 69.0 },
  { id: 'BAT-GDF-2026-09-A', mfiId: 'MFI-007', mfi: 'GDF', period: 'Aug 2026', receivedAt: '2026-09-21 09:14', rows: 14_210, accepted: 0, schema: 'v3.1', status: 'Failed', dq: null, error: 'Control total mismatch; file truncated at row 9,882' },
  { id: 'BAT-SHCF-2026-09-A', mfiId: 'MFI-008', mfi: 'SHCF', period: 'Aug 2026', receivedAt: '2026-09-19 15:50', rows: 43_120, accepted: 42_910, schema: 'v3.2', status: 'Loaded', dq: 93.0 },
  { id: 'BAT-MCM-2026-09-A', mfiId: 'MFI-009', mfi: 'MCM', period: 'Aug 2026', receivedAt: '2026-09-24 07:31', rows: 18_604, accepted: 0, schema: 'v3.1', status: 'Failed', dq: null, error: 'SFTP transfer interrupted — checksum mismatch' },
  { id: 'BAT-TRF-2026-09-A', mfiId: 'MFI-010', mfi: 'TRF', period: 'Aug 2026', receivedAt: '2026-09-18 10:20', rows: 9_402, accepted: 9_388, schema: 'v3.2', status: 'Loaded', dq: 91.9 },
  { id: 'BAT-YWEF-2026-09-A', mfiId: 'MFI-012', mfi: 'YWEF', period: 'Aug 2026', receivedAt: '2026-09-17 16:44', rows: 38_709, accepted: 38_650, schema: 'v3.2', status: 'Loaded', dq: 97.3 },
  { id: 'BAT-PGMF-2026-08-A', mfiId: 'MFI-001', mfi: 'PGMF', period: 'Jul 2026', receivedAt: '2026-08-22 10:02', rows: 484_010, accepted: 483_620, schema: 'v3.2', status: 'Loaded', dq: 98.4 },
  { id: 'BAT-AHT-2026-08-A', mfiId: 'MFI-006', mfi: 'AHTWIN', period: 'Jul 2026', receivedAt: '2026-08-29 23:10', rows: 22_004, accepted: 17_880, schema: 'v3.0', status: 'Loaded', dq: 81.3 },
];

export const BATCH_STATUSES = ['Loaded', 'Validating', 'Rejected', 'Awaiting approval', 'Failed'];

export const SCHEMA_VERSIONS = [
  { version: 'v3.0', status: 'Retired', released: '2024-01-15', sunset: '2026-06-30', fieldsAdded: ['Base loan & repayment schedule', 'Group member linkage'], mfis: ['AHTWIN'] },
  { version: 'v3.1', status: 'Deprecated', released: '2025-03-01', sunset: '2026-10-31', fieldsAdded: ['previous_nrc', 'guarantor_nrc', 'restructure_flag'], mfis: ['MAHA', 'GDF', 'MCM'] },
  { version: 'v3.2', status: 'Active', released: '2026-01-10', sunset: null, fieldsAdded: ['moratorium_code', 'name_mm (Unicode)', 'phone_e164', 'control_total_hash'], mfis: ['PGMF', 'AMM', 'VFM', 'SMF', 'SHCF', 'TRF', 'YWEF'] },
];

export const DQ_RULES = [
  { id: 'DQ-001', field: 'nrc', condition: 'Matches NRC pattern state/township(type)number', severity: 'error', active: true },
  { id: 'DQ-002', field: 'date_of_birth', condition: 'Age between 18 and 75 at disbursement', severity: 'error', active: true },
  { id: 'DQ-003', field: 'outstanding_principal', condition: '≤ disbursed_amount', severity: 'error', active: true },
  { id: 'DQ-004', field: 'days_past_due', condition: 'Increase ≤ days since previous period + 31', severity: 'error', active: true },
  { id: 'DQ-005', field: 'name_mm', condition: 'Unicode Myanmar (reject Zawgyi-encoded text)', severity: 'error', active: true },
  { id: 'DQ-006', field: 'phone', condition: 'E.164 format +959…', severity: 'warning', active: true },
  { id: 'DQ-007', field: 'township_code', condition: 'Exists in township reference table', severity: 'error', active: true },
  { id: 'DQ-008', field: 'loan_id', condition: 'Unique per MFI and period (idempotent key)', severity: 'error', active: true },
  { id: 'DQ-009', field: 'father_name', condition: 'Not blank for individual loans', severity: 'warning', active: false },
];

export const REJECTS = [
  { id: 'REJ-1', batch: 'BAT-AHT-2026-09-A', row: 1204, field: 'nrc', value: '9/MAHTAMA(N)448210X', rule: 'DQ-001', message: 'Invalid NRC — trailing character' },
  { id: 'REJ-2', batch: 'BAT-AHT-2026-09-A', row: 1377, field: 'name_mm', value: 'ေမာင္ေအး', rule: 'DQ-005', message: 'Zawgyi-encoded text detected' },
  { id: 'REJ-3', batch: 'BAT-AHT-2026-09-A', row: 2210, field: 'outstanding_principal', value: '1,450,000', rule: 'DQ-003', message: 'Outstanding exceeds disbursed 1,200,000' },
  { id: 'REJ-4', batch: 'BAT-MAHA-2026-09-A', row: 318, field: 'date_of_birth', value: '2011-04-02', rule: 'DQ-002', message: 'Borrower age 15 at disbursement' },
  { id: 'REJ-5', batch: 'BAT-MAHA-2026-09-A', row: 9021, field: 'township_code', value: 'MGWY', rule: 'DQ-007', message: 'Unknown township code' },
  { id: 'REJ-6', batch: 'BAT-MAHA-2026-09-A', row: 11455, field: 'nrc', value: '8/MAKANA(N)120934', rule: 'DQ-008', message: 'Duplicate loan_id MAHA-LN-55017 in same period' },
  { id: 'REJ-7', batch: 'BAT-AMM-2026-09-A', row: 40211, field: 'days_past_due', value: '95', rule: 'DQ-004', message: 'DPD jumped 0 → 95 in one month' },
  { id: 'REJ-8', batch: 'BAT-PGMF-2026-09-A', row: 77102, field: 'nrc', value: '12/OUKAMA(N)245781', rule: 'DQ-008', message: 'Resubmitted row already loaded — skipped (no duplicate)' },
];

export const RECON = [
  { id: 'RC-1', mfi: 'GDF', batch: 'BAT-GDF-2026-09-A', metric: 'Outstanding principal', submitted: 11_812_400_000, loaded: 8_204_115_000 },
  { id: 'RC-2', mfi: 'AHTWIN', batch: 'BAT-AHT-2026-09-A', metric: 'Loan count', submitted: 21_915, loaded: 15_120 },
  { id: 'RC-3', mfi: 'MAHA', batch: 'BAT-MAHA-2026-09-A', metric: 'Outstanding principal', submitted: 118_020_000_000, loaded: 117_640_500_000 },
  { id: 'RC-4', mfi: 'AMM', batch: 'BAT-AMM-2026-09-A', metric: 'Disbursed (period)', submitted: 14_200_000_000, loaded: 14_198_300_000 },
];
