import { TOWNSHIP_STATS } from './townships';
import { seeded } from '../lib/util';

const MFI_SHORTS = ['PGMF', 'AMM', 'VFM', 'MAHA', 'SMF', 'AHTWIN', 'SHCF', 'MCM', 'TRF', 'YWEF', 'GDF'];

/**
 * Pseudonymised borrower rows for drill-down (GOV-10). The token is a keyed hash of the resolved
 * borrower ID — names and NRC are never shown in the Regulator portal.
 */
export function borrowerRowsFor(townshipCode) {
  const t = TOWNSHIP_STATS.find((x) => x.code === townshipCode);
  if (!t) return [];
  const rnd = seeded(`drill-${townshipCode}`);
  return Array.from({ length: 14 }, (_, i) => {
    const loans = 2 + Math.floor(rnd() * 4);
    const lenders = Array.from({ length: loans }, () => MFI_SHORTS[Math.floor(rnd() * MFI_SHORTS.length)]);
    const income = Math.round((180 + rnd() * 420) * 1000);
    const dti = Math.round(28 + rnd() * 62);
    return {
      id: `PSN-${townshipCode.slice(0, 3)}-${(7310 + i * 37).toString(16).toUpperCase()}`,
      township: t.name,
      activeLoans: loans,
      lenders: [...new Set(lenders)].join(', '),
      outstanding: Math.round(loans * (400 + rnd() * 900)) * 1000,
      monthlyIncomeBand: income < 300000 ? '< 300K' : income < 450000 ? '300–450K' : '> 450K',
      dti,
      maxDpd: [0, 0, 0, 15, 30, 45, 90][Math.floor(rnd() * 7)],
      gender: rnd() < t.womenPct / 100 ? 'F' : 'M',
    };
  }).filter((r) => r.activeLoans >= 3 || r.dti > 50);
}

/**
 * Historical borrower distribution (Aug 2026 DWH snapshot) used by the policy simulator (GOV-19).
 * Buckets by DTI (%) and number of active loans; count = borrowers, portfolio = MMK billions.
 */
export const DTI_DISTRIBUTION = [
  { dti: 10, count: 192_000, portfolio: 168 }, { dti: 20, count: 248_000, portfolio: 231 },
  { dti: 30, count: 226_000, portfolio: 247 }, { dti: 40, count: 181_000, portfolio: 226 },
  { dti: 50, count: 132_000, portfolio: 184 }, { dti: 60, count: 89_000, portfolio: 138 },
  { dti: 70, count: 54_000, portfolio: 92 }, { dti: 80, count: 31_000, portfolio: 58 },
  { dti: 90, count: 18_600, portfolio: 32 }, { dti: 100, count: 12_000, portfolio: 17.5 },
];

export const LOANS_DISTRIBUTION = [
  { loans: 1, count: 872_300, portfolio: 862 }, { loans: 2, count: 249_400, portfolio: 318 },
  { loans: 3, count: 58_600, portfolio: 124 }, { loans: 4, count: 17_300, portfolio: 58 },
  { loans: 5, count: 6_000, portfolio: 31.5 },
];

/** Alt-data coverage (GOV-13, option — inactive). Shares of borrowers with a match, by region. */
export const ALT_DATA_COVERAGE = [
  { region: 'Yangon', telco: 88, utility: 64 }, { region: 'Mandalay', telco: 84, utility: 51 },
  { region: 'Ayeyarwady', telco: 71, utility: 22 }, { region: 'Bago', telco: 76, utility: 31 },
  { region: 'Magway', telco: 69, utility: 18 }, { region: 'Sagaing', telco: 66, utility: 16 },
  { region: 'Shan', telco: 58, utility: 24 }, { region: 'Mon', telco: 74, utility: 35 },
];

export const ALT_DATA_SOURCES = [
  { name: 'Mobile network operator A — airtime top-up & tenure', type: 'Telco', status: 'Pilot live', records: '41,280 consented borrowers', agreement: 'Data-sharing agreement signed 12 Jul 2026 · monthly feed' },
  { name: 'YESC / MESC electricity billing', type: 'Utility', status: 'Pilot live', records: '12,940 consented borrowers', agreement: 'Data-sharing agreement signed 2 Aug 2026 · Yangon and Mandalay only' },
  { name: 'Mobile network operator B — mobile money repayment', type: 'Telco', status: 'Agreement in review', records: '≈ 9M wallets', agreement: 'Draft agreement with CBM Legal' },
  { name: 'Water utility (YCDC)', type: 'Utility', status: 'Onboarding', records: '≈ 0.6M accounts', agreement: 'Technical onboarding; go-live planned Q1 2027' },
];

/** AI insights. Each card carries its drivers and model metadata for explainability. */
export const AI_INSIGHTS = [
  {
    id: 'AI-0091', title: 'Unusual rise in new loans per borrower — Hinthada', kind: 'Over-indebtedness', score: 0.92, mfis: ['VFM', 'GDF', 'PGMF'],
    finding: 'New loans to borrowers who already hold 2+ loans rose 38% in 60 days, 3.1× the township baseline.',
    drivers: [['Share of new loans to multi-borrowers', '+38%'], ['Median DTI of new borrowers', '54% (baseline 41%)'], ['Flood-affected village tracts', '11 of 29']],
    model: 'Isolation forest v1.4 · trained on 24 months · features: 17', confidence: 'High',
  },
  {
    id: 'AI-0088', title: 'Repayment reporting pattern anomaly — Mon Coastal', kind: 'Data integrity', score: 0.81, mfis: ['MCM'],
    finding: '96% of instalments reported as paid exactly on the due date in August (sector median 71%). Possible back-filling.',
    drivers: [['Paid-on-due-date share', '96% vs 71%'], ['Rows modified after cut-off', '1,240'], ['DQ score change', '−3.6 pp']],
    model: 'Benford + distribution drift v2.0', confidence: 'Medium',
  },
  {
    id: 'AI-0085', title: 'PAR30 forecast breach within 90 days — Maha Agriculture', kind: 'Credit risk', score: 0.74, mfis: ['MAHA'],
    finding: 'Forecast PAR30 of 7.2% by November (EWS-R01 threshold 5%). Driven by dry-zone agriculture loans maturing after poor monsoon.',
    drivers: [['Agriculture share of portfolio', '64%'], ['Rainfall anomaly (Magway)', '−31%'], ['Restructured loans', '+2,100 in Q3']],
    model: 'Gradient boosting v3.1 · MAPE 0.6 pp', confidence: 'Medium',
  },
];
