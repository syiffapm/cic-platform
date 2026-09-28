/**
 * Borrower & Loan Registry (C3) — the single source used by every portal: the borrower sees their own
 * file, an MFI sees it through a consented inquiry, supervisors see aggregates.
 *
 * Payment history: 24 characters, oldest → newest month (Sep 2024 → Aug 2026).
 * 0 = paid on time · 1 = 1–30 DPD · 2 = 31–60 · 3 = 61–90 · 4 = 90+ · C = closed · . = not open / no data
 */
export const GRID_MONTHS = Array.from({ length: 24 }, (_, i) => {
  const d = new Date(2024, 8 + i, 1);
  return d.toLocaleDateString('en-GB', { month: 'short', year: '2-digit' });
});

export const BORROWERS = [
  {
    borrowerId: 'BRW-000184', nameEn: 'Daw Hnin Wai', nameMm: 'ဒေါ်နှင်းဝေ', nrc: '12/OUKAMA(N)245781', previousNrc: null,
    dob: '1987-04-12', gender: 'Female', fatherName: 'U Ba Tin', phone: '+959421005678', township: 'Okkalapa North', region: 'Yangon',
    address: 'No. 18, Thitsar Road, Ward 7, North Okkalapa, Yangon', occupation: 'Grocery shop owner', householdSize: 5,
    loans: [
      { loanId: 'PGMF-LN-118830', mfiId: 'MFI-001', product: 'Group loan', role: 'Borrower', disbursed: '2026-04-02', amount: 1_200_000, tenor: 12, rate: 28, frequency: 'Fortnightly', outstanding: 640_000, dpd: 0, maxDpd12: 0, status: 'Active', classification: 'Standard', dataDate: '2026-08-31', history: '....................0000' },
      { loanId: 'AMM-LN-778120', mfiId: 'MFI-002', product: 'Individual loan', role: 'Borrower', disbursed: '2025-11-15', amount: 2_500_000, tenor: 18, rate: 28, frequency: 'Monthly', outstanding: 1_850_000, dpd: 0, maxDpd12: 0, status: 'Active', classification: 'Standard', dataDate: '2026-08-31', history: '..............0000000000', disputed: 'DSP-2026-0412' },
      { loanId: 'SMF-LN-33019', mfiId: 'MFI-005', product: 'Agriculture loan', role: 'Borrower', disbursed: '2025-06-20', amount: 800_000, tenor: 15, rate: 26, frequency: 'Monthly', outstanding: 410_000, dpd: 12, maxDpd12: 18, status: 'Active', classification: 'Watch', dataDate: '2026-08-25', history: '.........000000100001001' },
      { loanId: 'PGMF-LN-104552', mfiId: 'MFI-001', product: 'Group loan', role: 'Borrower', disbursed: '2025-03-10', amount: 900_000, tenor: 12, rate: 28, frequency: 'Fortnightly', outstanding: 0, dpd: 0, maxDpd12: 0, status: 'Closed', classification: 'Closed', closedOn: '2026-03-28', dataDate: '2026-08-31', history: '......000000000000C.....' },
      { loanId: 'VFM-LN-20417', mfiId: 'MFI-003', product: 'Education loan', role: 'Borrower', disbursed: '2023-06-01', amount: 600_000, tenor: 12, rate: 24, frequency: 'Monthly', outstanding: 0, dpd: 0, maxDpd12: 0, status: 'Closed', classification: 'Closed', closedOn: '2024-06-05', dataDate: '2024-06-30', history: '........................' },
    ],
    guarantees: [
      { guaranteeFor: 'Group PGMF-GRP-5521 (member Ma Khin Sandar)', mfiId: 'MFI-001', amount: 300_000, status: 'Active', dataDate: '2026-08-31' },
    ],
  },
  {
    borrowerId: 'BRW-003318', nameEn: 'U Aung Aung', nameMm: 'ဦးအောင်အောင်', nrc: '14/PATHEIN(N)118412', previousNrc: '14/PATHAYA(N)118412',
    dob: '1979-02-03', gender: 'Male', fatherName: 'U Hla Maung', phone: '+959250118877', township: 'Pathein', region: 'Ayeyarwady',
    address: 'Ward 3, Strand Road, Pathein', occupation: 'Rice farmer', householdSize: 6,
    loans: [
      { loanId: 'VFM-LN-31022', mfiId: 'MFI-003', product: 'Agriculture loan', role: 'Borrower', disbursed: '2026-05-10', amount: 1_500_000, tenor: 9, rate: 26, frequency: 'Bullet', outstanding: 1_500_000, dpd: 0, maxDpd12: 0, status: 'Active', classification: 'Standard', dataDate: '2026-08-31', history: '....................0000' },
      { loanId: 'PGMF-LN-099310', mfiId: 'MFI-001', product: 'Agriculture loan', role: 'Borrower', disbursed: '2024-06-01', amount: 1_000_000, tenor: 12, rate: 28, frequency: 'Monthly', outstanding: 0, dpd: 0, maxDpd12: 0, status: 'Closed', classification: 'Closed', closedOn: '2025-06-12', dataDate: '2025-06-30', history: '00000000C...............' },
    ],
    guarantees: [],
  },
  {
    borrowerId: 'BRW-003902', nameEn: 'Ko Aung Aung', nameMm: 'ကိုအောင်အောင်', nrc: '12/LAMANA(N)402917', previousNrc: null,
    dob: '1992-11-20', gender: 'Male', fatherName: 'U Win Naing', phone: '+959799402917', township: 'Hlaingthaya', region: 'Yangon',
    address: 'Block 12, Ward 18, Hlaingthaya, Yangon', occupation: 'Garment factory worker', householdSize: 4,
    loans: [
      { loanId: 'YWEF-LN-7719', mfiId: 'MFI-012', product: 'Individual loan', role: 'Borrower', disbursed: '2025-09-01', amount: 700_000, tenor: 12, rate: 28, frequency: 'Monthly', outstanding: 150_000, dpd: 45, maxDpd12: 45, status: 'Active', classification: 'Substandard', dataDate: '2026-08-31', history: '............000011122222' },
      { loanId: 'GDF-LN-11820', mfiId: 'MFI-007', product: 'Emergency loan', role: 'Borrower', disbursed: '2026-02-14', amount: 300_000, tenor: 6, rate: 28, frequency: 'Monthly', outstanding: 90_000, dpd: 31, maxDpd12: 31, status: 'Active', classification: 'Substandard', dataDate: '2026-08-20', history: '.................0001122' },
      { loanId: 'PGMF-LN-150234', mfiId: 'MFI-001', product: 'Group loan', role: 'Borrower', disbursed: '2026-06-05', amount: 500_000, tenor: 12, rate: 28, frequency: 'Fortnightly', outstanding: 420_000, dpd: 0, maxDpd12: 0, status: 'Active', classification: 'Standard', dataDate: '2026-08-31', history: '.....................000' },
    ],
    guarantees: [{ guaranteeFor: 'Group YWEF-GRP-0912', mfiId: 'MFI-012', amount: 200_000, status: 'Active', dataDate: '2026-08-31' }],
  },
  {
    borrowerId: 'BRW-004777', nameEn: 'U Aung Aung', nameMm: 'ဦးအောင်အောင်', nrc: '5/MAYANA(N)077120', previousNrc: null,
    dob: '1965-07-08', gender: 'Male', fatherName: 'U Tin', phone: '+959440077120', township: 'Monywa', region: 'Sagaing',
    address: 'Bogyoke Road, Monywa', occupation: 'Tailor', householdSize: 3,
    loans: [
      { loanId: 'PGMF-LN-088120', mfiId: 'MFI-001', product: 'SME loan', role: 'Borrower', disbursed: '2025-10-01', amount: 3_000_000, tenor: 24, rate: 26, frequency: 'Monthly', outstanding: 2_100_000, dpd: 0, maxDpd12: 0, status: 'Active', classification: 'Standard', dataDate: '2026-08-31', history: '.............00000000000' },
    ],
    guarantees: [],
  },
];

/** Inquiries by other institutions in the last 12 months (portal-private extract). */
export const OTHER_INQUIRIES = [
  { borrowerId: 'BRW-003902', mfiId: 'MFI-012', purpose: 'NL', at: '2026-07-02' },
  { borrowerId: 'BRW-003902', mfiId: 'MFI-007', purpose: 'NL', at: '2026-02-10' },
  { borrowerId: 'BRW-003902', mfiId: 'MFI-004', purpose: 'NL', at: '2026-08-28' },
  { borrowerId: 'BRW-003318', mfiId: 'MFI-003', purpose: 'NL', at: '2026-05-02' },
];

export const findByNrc = (nrc) => BORROWERS.find((b) => b.nrc.toUpperCase() === nrc.toUpperCase() || b.previousNrc?.toUpperCase() === nrc.toUpperCase());
export const findById = (id) => BORROWERS.find((b) => b.borrowerId.toUpperCase() === id.trim().toUpperCase());

/**
 * A borrower's complete file: registry record + loans reported since the last registry load
 * (e.g. a loan disbursed through the online application flow). A registered citizen with no
 * reported loans gets an empty file — a "no-hit", which is never a low score.
 */
export function getBorrowerFile(borrowerId, { reportedLoans = [], accounts = [] } = {}) {
  const base = BORROWERS.find((b) => b.borrowerId === borrowerId);
  const account = accounts.find((a) => a.borrowerId === borrowerId);
  if (!base && !account) return null;
  const extra = reportedLoans.filter((l) => l.borrowerId === borrowerId);
  const record = base ?? {
    borrowerId, nameEn: account.name, nameMm: account.nameMm ?? '', nrc: account.nrc, previousNrc: null,
    dob: account.dob ?? '', gender: account.gender ?? '', fatherName: account.fatherName ?? '', phone: account.phone,
    township: account.township ?? '', region: account.region ?? '', address: account.address ?? '', occupation: account.occupation ?? '',
    householdSize: null, loans: [], guarantees: [],
  };
  return { ...record, loans: [...extra, ...record.loans], noHit: record.loans.length + extra.length === 0 && record.guarantees.length === 0 };
}
