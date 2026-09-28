/** Client-side file helpers (CSV export and import). */
export function downloadFile(name, content, type = 'text/csv;charset=utf-8') {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

const esc = (v) => {
  const s = String(v ?? '');
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

/** columns: [{ key, header }] */
export function toCsv(rows, columns) {
  return [columns.map((c) => esc(c.header)).join(','), ...rows.map((r) => columns.map((c) => esc(r[c.key])).join(','))].join('\n');
}

/** Very small CSV reader for portal uploads (no quoted commas). */
export function parseCsv(text) {
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  if (!lines.length) return { header: [], rows: [] };
  const header = lines[0].split(',').map((h) => h.trim().toLowerCase());
  return { header, rows: lines.slice(1).map((l) => l.split(',').map((c) => c.trim())) };
}
