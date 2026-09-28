/** Versioned rule sets (ADM-08). Active version is stamped on every report (AC05 rule version). */
export const FAMILIES = {
  grade: { label: 'Credit grade', bands: ['A', 'B', 'C', 'D', 'E'] },
  ews: { label: 'Early warning (EWS)', bands: ['Green', 'Amber', 'Red'] },
  oi: { label: 'Over-indebtedness', bands: ['Normal', 'Elevated', 'Over-indebted'] },
};

const GR_BASE = [
  { id: 'G01', condition: 'max DPD 12m ≥ 90', points: -120, reason: 'R07' },
  { id: 'G02', condition: 'max DPD 12m between 30 and 89', points: -60, reason: 'R06' },
  { id: 'G03', condition: 'Written-off loan in 36m', points: -150, reason: 'R09' },
  { id: 'G04', condition: 'Active loans across MFIs ≥ 3', points: -40, reason: 'R11' },
  { id: 'G05', condition: 'On-time repayments 12m ≥ 95%', points: 50, reason: 'R02' },
  { id: 'G06', condition: 'Credit history length ≥ 24 months', points: 30, reason: 'R03' },
  { id: 'G07', condition: 'Inquiries in last 90 days ≥ 4', points: -20, reason: 'R12' },
];

export const RULE_SETS = [
  { id: 'GR-2026.1', family: 'grade', status: 'Superseded', effectiveFrom: '2026-01-01', createdBy: 'Ko Pyae Sone', approvedBy: 'U Soe Paing', note: 'Baseline 2026 scorecard', rules: GR_BASE.filter((r) => r.id !== 'G07') },
  { id: 'GR-2026.2', family: 'grade', status: 'Active', effectiveFrom: '2026-05-01', createdBy: 'Ko Pyae Sone', approvedBy: 'U Soe Paing', note: 'Adds inquiry-velocity rule G07', rules: GR_BASE },
  {
    id: 'GR-2026.3', family: 'grade', status: 'Draft', effectiveFrom: null, createdBy: 'Ko Pyae Sone', note: 'Moratorium-aware DPD; stronger multiple-borrowing penalty',
    rules: [
      ...GR_BASE.filter((r) => !['G02', 'G04'].includes(r.id)),
      { id: 'G02', condition: 'max DPD 12m between 30 and 89 (excl. declared moratorium months)', points: -60, reason: 'R06' },
      { id: 'G04', condition: 'Active loans across MFIs ≥ 3', points: -55, reason: 'R11' },
      { id: 'G08', condition: 'Total outstanding ÷ declared monthly income > 6', points: -35, reason: 'R14' },
    ].sort((a, b) => a.id.localeCompare(b.id)),
  },
  {
    id: 'EWS-2026.1', family: 'ews', status: 'Active', effectiveFrom: '2026-03-01', createdBy: 'Ko Pyae Sone', approvedBy: 'U Soe Paing', note: 'Portfolio early warning',
    rules: [
      { id: 'E01', condition: 'DPD rises ≥ 15 days month-on-month', points: 40, reason: 'W03' },
      { id: 'E02', condition: 'New loan from another MFI within 30 days', points: 25, reason: 'W05' },
      { id: 'E03', condition: 'Township flagged by disaster register', points: 20, reason: 'W08' },
    ],
  },
  {
    id: 'EWS-2026.2', family: 'ews', status: 'Draft', effectiveFrom: null, createdBy: 'Ko Pyae Sone', note: 'Adds partial-payment pattern',
    rules: [
      { id: 'E01', condition: 'DPD rises ≥ 15 days month-on-month', points: 40, reason: 'W03' },
      { id: 'E02', condition: 'New loan from another MFI within 30 days', points: 25, reason: 'W05' },
      { id: 'E03', condition: 'Township flagged by disaster register', points: 20, reason: 'W08' },
      { id: 'E04', condition: '≥ 2 partial payments in last 3 instalments', points: 30, reason: 'W06' },
    ],
  },
  {
    id: 'OI-2026.1', family: 'oi', status: 'Active', effectiveFrom: '2026-04-01', createdBy: 'Ko Pyae Sone', approvedBy: 'U Soe Paing', note: 'CBM over-indebtedness guidance 2026',
    rules: [
      { id: 'O01', condition: 'Active loans across MFIs ≥ 4', points: 50, reason: 'I01' },
      { id: 'O02', condition: 'Total instalments ÷ monthly income > 50%', points: 40, reason: 'I02' },
      { id: 'O03', condition: 'Total outstanding > 10,000,000 MMK (micro)', points: 20, reason: 'I03' },
    ],
  },
];

/** Result distribution of each set on the standard test sample (10,000 borrowers, Aug 2026), counts per band. */
export const SAMPLE_DIST = {
  'GR-2026.1': [2410, 3120, 2350, 1310, 810],
  'GR-2026.2': [2280, 3050, 2420, 1380, 870],
  'GR-2026.3': [2360, 2890, 2380, 1470, 900],
  'EWS-2026.1': [8120, 1340, 540],
  'EWS-2026.2': [7890, 1460, 650],
  'OI-2026.1': [8710, 910, 380],
};

export const SAMPLES = [
  { value: 'aug26-10k', label: '10,000 borrowers — Aug 2026 stratified back-test cohort' },
  { value: 'aug26-disaster', label: '2,500 borrowers — flood-affected townships, Aug 2026' },
];

/** Migration summary active → candidate: net borrowers changing band and net shift into the worse half of bands. */
export function migration(before, after) {
  const total = before.reduce((s, b) => s + b, 0);
  const moved = Math.round(before.reduce((s, b, i) => s + Math.abs(b - after[i]), 0) / 2);
  const cut = Math.ceil(before.length / 2);
  const sum = (arr) => arr.slice(cut).reduce((s, v) => s + v, 0);
  return { moved, pct: ((moved / total) * 100).toFixed(1), worse: sum(after) - sum(before), total };
}
