/** Downloads rows as a CSV file (ADM-12 export). columns: [{ key, header }] */
export function downloadCsv(filename, rows, columns) {
  const cols = columns ?? Object.keys(rows[0] ?? {}).map((key) => ({ key, header: key }));
  const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const csv = [cols.map((c) => esc(c.header)).join(','), ...rows.map((r) => cols.map((c) => esc(r[c.key])).join(','))].join('\n');
  const url = URL.createObjectURL(new Blob([`﻿${csv}`], { type: 'text/csv;charset=utf-8' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
