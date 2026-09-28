/** Small helpers private to the Regulator portal. */

/** Deterministic pseudo-random generator so mock series are stable between renders. */
export function seeded(seed) {
  let s = 0;
  for (const ch of String(seed)) s = (s * 31 + ch.charCodeAt(0)) >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

export const round = (n, d = 1) => Math.round(n * 10 ** d) / 10 ** d;

export const median = (arr) => {
  if (!arr.length) return 0;
  const s = [...arr].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};

/** Demo "today" shared with slaDaysLeft in @/lib/format. */
export const TODAY = '2026-09-24';
export const nowStamp = () => {
  const t = new Date().toTimeString().slice(0, 5);
  return `${TODAY} ${t}`;
};

export const addDays = (date, days) => {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
};

/** Download rows as CSV (opens in Excel — the XLSX export of the prototype). */
export function downloadCsv(filename, rows, columns) {
  const cols = columns ?? Object.keys(rows[0] ?? {}).map((k) => ({ key: k, header: k }));
  const esc = (v) => {
    const s = v === null || v === undefined ? '' : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const lines = [cols.map((c) => esc(c.header)).join(','), ...rows.map((r) => cols.map((c) => esc(r[c.key])).join(','))];
  const footer = `\n"Generated ${new Date().toISOString().slice(0, 16).replace('T', ' ')} · CIC Myanmar Government Portal · Confidential"`;
  const blob = new Blob([`﻿${lines.join('\n')}${footer}`], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

/** Case journey (GOV-06). */
export const CASE_STAGES = ['Triage', 'Investigate', 'Request info', 'Decision', 'Action', 'Closed'];
