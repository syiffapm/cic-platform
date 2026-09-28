/**
 * Township-level aggregates from the DWH (anonymised). Drives the executive heat-map (GOV-01),
 * over-indebtedness monitor (GOV-09) and census map (GOV-14).
 * borrowers in persons; portfolio in MMK billions; avgLoan in MMK; womenPct share of borrowers.
 * lat/lng place each township on the regional map.
 */
export const TOWNSHIP_STATS = [
  { code: 'MYITKYINA', lat: 25.383, lng: 97.396, name: 'Myitkyina', region: 'Kachin', col: 4, row: 0, borrowers: 14200, portfolio: 16.1, par30: 4.6, womenPct: 71, avgLoan: 1_134_000, multi: 820, highDti: 610 },
  { code: 'MONYWA', lat: 22.108, lng: 95.136, name: 'Monywa', region: 'Sagaing', col: 2, row: 1, borrowers: 52400, portfolio: 49.8, par30: 7.4, womenPct: 84, avgLoan: 950_000, multi: 5_210, highDti: 3_980 },
  { code: 'SHWEBO', lat: 22.568, lng: 95.698, name: 'Shwebo', region: 'Sagaing', col: 3, row: 1, borrowers: 34600, portfolio: 30.2, par30: 6.3, womenPct: 82, avgLoan: 873_000, multi: 2_940, highDti: 2_120 },
  { code: 'PAKOKKU', lat: 21.332, lng: 95.086, name: 'Pakokku', region: 'Magway', col: 1, row: 2, borrowers: 28300, portfolio: 27.4, par30: 5.9, womenPct: 86, avgLoan: 968_000, multi: 2_310, highDti: 1_760 },
  { code: 'CHANAYETHAZAN', lat: 21.975, lng: 96.083, name: 'Chanayethazan', region: 'Mandalay', col: 3, row: 2, borrowers: 98400, portfolio: 121.6, par30: 3.0, womenPct: 74, avgLoan: 1_236_000, multi: 6_020, highDti: 4_110 },
  { code: 'PYINOOLWIN', lat: 22.034, lng: 96.456, name: 'Pyin Oo Lwin', region: 'Mandalay', col: 4, row: 2, borrowers: 31200, portfolio: 36.8, par30: 2.8, womenPct: 72, avgLoan: 1_179_000, multi: 1_440, highDti: 980 },
  { code: 'LASHIO', lat: 22.936, lng: 97.749, name: 'Lashio', region: 'Shan', col: 5, row: 2, borrowers: 12100, portfolio: 13.3, par30: 4.9, womenPct: 68, avgLoan: 1_099_000, multi: 700, highDti: 540 },
  { code: 'MAGWAY', lat: 20.15, lng: 94.932, name: 'Magway', region: 'Magway', col: 1, row: 3, borrowers: 61800, portfolio: 58.1, par30: 5.6, womenPct: 88, avgLoan: 940_000, multi: 4_870, highDti: 3_640 },
  { code: 'MEIKTILA', lat: 20.877, lng: 95.858, name: 'Meiktila', region: 'Mandalay', col: 3, row: 3, borrowers: 44100, portfolio: 45.2, par30: 3.6, womenPct: 81, avgLoan: 1_025_000, multi: 2_780, highDti: 1_930 },
  { code: 'TAUNGGYI', lat: 20.789, lng: 97.038, name: 'Taunggyi', region: 'Shan', col: 4, row: 3, borrowers: 36800, portfolio: 44.7, par30: 3.9, womenPct: 69, avgLoan: 1_215_000, multi: 1_980, highDti: 1_450 },
  { code: 'LOIKAW', lat: 19.674, lng: 97.209, name: 'Loikaw', region: 'Kayah', col: 5, row: 3, borrowers: 6400, portfolio: 5.9, par30: 5.1, womenPct: 73, avgLoan: 922_000, multi: 310, highDti: 260 },
  { code: 'SITTWE', lat: 20.146, lng: 92.898, name: 'Sittwe', region: 'Rakhine', col: 0, row: 3, borrowers: 9800, portfolio: 8.2, par30: 8.4, womenPct: 79, avgLoan: 837_000, multi: 690, highDti: 720 },
  { code: 'NAYPYITAW', lat: 19.745, lng: 96.129, name: 'Zabuthiri', region: 'Nay Pyi Taw', col: 3, row: 4, borrowers: 22600, portfolio: 26.9, par30: 2.5, womenPct: 70, avgLoan: 1_190_000, multi: 910, highDti: 640 },
  { code: 'TAUNGOO', lat: 18.94, lng: 96.434, name: 'Taungoo', region: 'Bago', col: 3, row: 5, borrowers: 38400, portfolio: 36.1, par30: 3.8, womenPct: 83, avgLoan: 940_000, multi: 2_510, highDti: 1_870 },
  { code: 'PYAY', lat: 18.824, lng: 95.222, name: 'Pyay', region: 'Bago', col: 2, row: 5, borrowers: 33900, portfolio: 31.0, par30: 4.2, womenPct: 85, avgLoan: 914_000, multi: 2_380, highDti: 1_690 },
  { code: 'HINTHADA', lat: 17.648, lng: 95.468, name: 'Hinthada', region: 'Ayeyarwady', col: 1, row: 6, borrowers: 47300, portfolio: 41.5, par30: 9.1, womenPct: 87, avgLoan: 877_000, multi: 4_960, highDti: 4_210 },
  { code: 'BAGO', lat: 17.335, lng: 96.481, name: 'Bago', region: 'Bago', col: 3, row: 6, borrowers: 57200, portfolio: 64.4, par30: 3.3, womenPct: 80, avgLoan: 1_126_000, multi: 3_310, highDti: 2_260 },
  { code: 'HPAAN', lat: 16.89, lng: 97.633, name: 'Hpa-An', region: 'Kayin', col: 4, row: 6, borrowers: 16900, portfolio: 15.2, par30: 5.4, womenPct: 77, avgLoan: 899_000, multi: 1_120, highDti: 910 },
  { code: 'PATHEIN', lat: 16.779, lng: 94.732, name: 'Pathein', region: 'Ayeyarwady', col: 0, row: 7, borrowers: 71600, portfolio: 68.9, par30: 4.4, womenPct: 86, avgLoan: 962_000, multi: 5_480, highDti: 4_020 },
  { code: 'HLAINGTHAYA', lat: 16.87, lng: 96.066, name: 'Hlaingthaya', region: 'Yangon', col: 2, row: 7, borrowers: 104300, portfolio: 118.2, par30: 3.4, womenPct: 78, avgLoan: 1_133_000, multi: 9_860, highDti: 7_410 },
  { code: 'KAMAYUT', lat: 16.823, lng: 96.133, name: 'Kamayut', region: 'Yangon', col: 3, row: 7, borrowers: 61200, portfolio: 96.4, par30: 1.9, womenPct: 66, avgLoan: 1_575_000, multi: 3_120, highDti: 2_010 },
  { code: 'OUKAMA', lat: 16.908, lng: 96.18, name: 'Okkalapa North', region: 'Yangon', col: 4, row: 7, borrowers: 88500, portfolio: 104.7, par30: 2.7, womenPct: 75, avgLoan: 1_183_000, multi: 7_240, highDti: 5_330 },
  { code: 'MAWLAMYINE', lat: 16.491, lng: 97.628, name: 'Mawlamyine', region: 'Mon', col: 4, row: 8, borrowers: 37900, portfolio: 31.0, par30: 5.8, womenPct: 81, avgLoan: 818_000, multi: 2_770, highDti: 2_340 },
  { code: 'DAWEI', lat: 14.083, lng: 98.195, name: 'Dawei', region: 'Tanintharyi', col: 4, row: 9, borrowers: 21800, portfolio: 18.0, par30: 4.8, womenPct: 76, avgLoan: 826_000, multi: 1_230, highDti: 1_040 },
];

/** Region filter options for Overview — only regions that report through at least one township. */
export const TOWNSHIP_REGIONS = [...new Set(TOWNSHIP_STATS.map((t) => t.region))];

/** Census refresh schedule (GOV-14). */
export const CENSUS_SCHEDULE = [
  { dataset: 'Township outreach (borrowers, portfolio)', source: 'Credit registry → DWH', frequency: 'Monthly, 10th', lastRefresh: '2026-09-10 02:15', nextRefresh: '2026-10-10 02:00' },
  { dataset: 'Gender split', source: 'Identity resolution', frequency: 'Monthly, 10th', lastRefresh: '2026-09-10 02:40', nextRefresh: '2026-10-10 02:30' },
  { dataset: 'Population denominators', source: 'DoP Census 2024 projection', frequency: 'Annual', lastRefresh: '2026-02-01 00:00', nextRefresh: '2027-02-01 00:00' },
  { dataset: 'Township boundaries', source: 'MIMU P-codes v9.4', frequency: 'On change', lastRefresh: '2025-11-18 10:00', nextRefresh: '—' },
];
