/**
 * Admin Operations / Content / Business dashboard mock data (§9 Admin dashboards, ADM-01).
 * All figures are aggregates — no borrower-level data is exposed on the console dashboards.
 */
import { SECTOR_TREND } from '@/data/kpis';

export const DASH_AS_OF = '25 Sep 2026 09:00';

/** Reports issued per day, last 30 days (26 Aug – 24 Sep 2026). Weekends are lower. */
export const DAILY_REPORTS = Array.from({ length: 30 }, (_, i) => {
  const d = new Date(Date.UTC(2026, 7, 26 + i));
  const dow = d.getUTCDay();
  const base = dow === 0 ? 610 : dow === 6 ? 880 : 1720;
  const wobble = Math.round(Math.sin(i * 1.7) * 140 + (i % 5) * 22);
  return { label: `${d.getUTCDate()} ${d.toLocaleString('en-GB', { month: 'short', timeZone: 'UTC' })}`, reports: base + wobble, failed: Math.max(0, Math.round((base + wobble) * 0.006)) };
});

/** Monthly report volume, derived from SECTOR_TREND inquiries (thousands). */
export const MONTHLY_REPORTS = SECTOR_TREND.map((m) => ({ label: m.month, reports: Math.round(m.inquiries * 1000), failed: Math.round(m.inquiries * 6) }));

export const OPS_KPIS = {
  reportsToday: 1_684,
  reportsYesterday: 1_812,
  inquiryVolumeMonth: 48_210,
  billedMonth: 385_680_000,
  collectedMonth: 341_220_000,
};

export const SYSTEM_HEALTH = [
  { id: 'uptime', label: 'Uptime (30 days)', value: '99.95%', target: '≥ 99.9%', ok: true, definition: 'Minutes available ÷ minutes in period, excluding announced maintenance windows' },
  { id: 'p95', label: 'API p95 latency', value: '412 ms', target: '≤ 800 ms', ok: true, definition: '95th percentile response time of inquiry API calls in the last hour' },
  { id: 'queue', label: 'Queue depth', value: '37', target: '≤ 200', ok: true, definition: 'Messages waiting in ingestion + report-generation queues right now' },
  { id: 'jobs', label: 'Job failures (24 h)', value: '2', target: '0', ok: false, definition: 'Scheduled jobs that ended in failure during the last 24 hours' },
];

export const INCIDENTS = [
  { id: 'INC-2026-044', title: 'Nightly report generation slow (p95 3.1 s)', severity: 'Medium', status: 'Investigating', opened: '2026-09-25 02:40', owner: 'Ko Htet Naing' },
  { id: 'INC-2026-043', title: 'SMS gateway delivery delays (Ooredoo route)', severity: 'Low', status: 'Open', opened: '2026-09-24 16:05', owner: 'Ma Hsu Lai' },
  { id: 'INC-2026-041', title: 'EWS recompute job failed — timeout on MFI-004 batch', severity: 'High', status: 'Open', opened: '2026-09-24 05:12', owner: 'Ko Pyae Sone' },
];

export const BACKUP_SUMMARY = { last: '2026-09-25 08:30', frequency: 'Hourly', rpoAchieved: '28 min', rpoTarget: '1 h', lastRestoreTest: '2026-07-14', rtoAchieved: '2 h 41 min' };

/** Content dashboard (CMS-16). */
export const TOP_PAGES = [
  { page: '/check-my-report', views: 18_420 },
  { page: '/services/credit-report', views: 12_310 },
  { page: '/mfi-directory', views: 9_870 },
  { page: '/faq', views: 7_245 },
  { page: '/statistics', views: 5_190 },
  { page: '/news/ANN-2026-031', views: 3_804 },
];

export const NO_RESULT_SEARCHES = [
  { term: 'ချေးငွေ ပြန်ဆပ်', count: 214, lang: 'MM' },
  { term: 'loan calculator', count: 162, lang: 'EN' },
  { term: 'Zawgyi font', count: 97, lang: 'EN' },
  { term: 'မှတ်ပုံတင် ပြောင်း', count: 81, lang: 'MM' },
  { term: 'credit score free', count: 64, lang: 'EN' },
];

/** Business dashboard. */
export const INQUIRIES_BY_MFI = [
  { mfi: 'PGMF', inquiries: 17_840 }, { mfi: 'AMM', inquiries: 8_120 }, { mfi: 'VFM', inquiries: 7_460 },
  { mfi: 'MAHA', inquiries: 4_310 }, { mfi: 'SMF', inquiries: 3_280 }, { mfi: 'SHCF', inquiries: 2_150 },
  { mfi: 'YWEF', inquiries: 1_960 }, { mfi: 'MCM', inquiries: 1_120 }, { mfi: 'Others', inquiries: 1_970 },
];

export const INQUIRIES_BY_PURPOSE = [
  { code: 'NL', label: 'New loan', value: 27_480 },
  { code: 'RV', label: 'Review', value: 13_020 },
  { code: 'CL', label: 'Collection', value: 3_370 },
  { code: 'GR', label: 'Guarantor', value: 4_340 },
];

/** Revenue billed vs collected by month (MMK millions). */
export const REVENUE = SECTOR_TREND.map((m, i) => {
  const billed = Math.round(m.inquiries * 8);
  return { month: m.month, billed, collected: Math.round(billed * (i === 11 ? 0.885 : 0.93 + (i % 3) * 0.02)) };
});
