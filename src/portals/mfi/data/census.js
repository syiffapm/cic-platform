/** Census data submissions: outreach per township, validated and versioned. */
export const CENSUS_VERSIONS = [
  {
    id: 'CEN-PGMF-2026Q2-v2', tenant: 'MFI-001', period: '2026 Q2', version: 2, submittedBy: 'Ko Thiha Aung', submittedAt: '2026-07-12 10:30', method: 'CSV', status: 'Accepted',
    rows: [
      { township: 'Okkalapa North', households: 4_210, women: 3_880, avgLoan: 780_000 },
      { township: 'Hlaingthaya', households: 6_904, women: 6_120, avgLoan: 690_000 },
      { township: 'Pathein', households: 5_330, women: 4_950, avgLoan: 850_000 },
      { township: 'Monywa', households: 3_120, women: 2_870, avgLoan: 910_000 },
    ],
    note: 'Corrected Pathein household count (v1 double-counted two village tracts).',
  },
  {
    id: 'CEN-PGMF-2026Q2-v1', tenant: 'MFI-001', period: '2026 Q2', version: 1, submittedBy: 'Ko Thiha Aung', submittedAt: '2026-07-08 16:02', method: 'CSV', status: 'Superseded',
    rows: [
      { township: 'Okkalapa North', households: 4_210, women: 3_880, avgLoan: 780_000 },
      { township: 'Hlaingthaya', households: 6_904, women: 6_120, avgLoan: 690_000 },
      { township: 'Pathein', households: 6_010, women: 4_950, avgLoan: 850_000 },
      { township: 'Monywa', households: 3_120, women: 2_870, avgLoan: 910_000 },
    ],
  },
  {
    id: 'CEN-PGMF-2026Q1-v1', tenant: 'MFI-001', period: '2026 Q1', version: 1, submittedBy: 'U Kyaw Zin', submittedAt: '2026-04-10 09:12', method: 'Manual', status: 'Accepted',
    rows: [
      { township: 'Okkalapa North', households: 4_020, women: 3_700, avgLoan: 760_000 },
      { township: 'Hlaingthaya', households: 6_640, women: 5_910, avgLoan: 670_000 },
      { township: 'Pathein', households: 5_150, women: 4_800, avgLoan: 830_000 },
    ],
  },
];

/** Submission calendar history: cut-off is the 7th calendar day after month end. */
export const SUBMISSION_HISTORY = [
  { period: 'Aug 2026', due: '2026-09-07', submitted: '2026-09-05', flag: 'On time', note: 'Initial file received 5 Sep; corrected replacement uploaded 24 Sep, awaiting checker approval' },
  { period: 'Jul 2026', due: '2026-08-07', submitted: '2026-08-06', flag: 'On time', note: 'First file failed validation on 2026-08-05; fixed and resubmitted' },
  { period: 'Jun 2026', due: '2026-07-07', submitted: '2026-07-04', flag: 'On time' },
  { period: 'May 2026', due: '2026-06-07', submitted: '2026-06-05', flag: 'On time' },
  { period: 'Apr 2026', due: '2026-05-07', submitted: '2026-05-06', flag: 'On time' },
  { period: 'Mar 2026', due: '2026-04-07', submitted: '2026-04-09', flag: 'Late', note: 'Late by 2 days — Thingyan holiday; waived by CIC (ticket OPS-1182)' },
  { period: 'Feb 2026', due: '2026-03-07', submitted: '2026-03-05', flag: 'On time' },
];
