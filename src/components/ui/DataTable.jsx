import clsx from 'clsx';
import { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Search } from 'lucide-react';
import EmptyState from './EmptyState';

/**
 * Generic table.
 * columns: [{ key, header, render?: (row) => node, className?, sortable? }]
 * searchKeys: row keys matched by the built-in search box (omit to hide the box)
 */
export default function DataTable({ columns, rows, searchKeys, pageSize = 10, onRowClick, toolbar, emptyTitle = 'No records found', dense = false, rowKey = 'id' }) {
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(0);
  const [sort, setSort] = useState(null);

  const filtered = useMemo(() => {
    let out = rows;
    if (query && searchKeys) {
      const q = query.toLowerCase();
      out = out.filter((r) => searchKeys.some((k) => String(r[k] ?? '').toLowerCase().includes(q)));
    }
    if (sort) {
      out = [...out].sort((a, b) => {
        const av = a[sort.key]; const bv = b[sort.key];
        const cmp = typeof av === 'number' && typeof bv === 'number' ? av - bv : String(av).localeCompare(String(bv));
        return sort.dir === 'asc' ? cmp : -cmp;
      });
    }
    return out;
  }, [rows, query, searchKeys, sort]);

  const pages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const current = Math.min(page, pages - 1);
  const visible = filtered.slice(current * pageSize, current * pageSize + pageSize);

  const toggleSort = (key) => setSort((s) => (s?.key === key ? { key, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'asc' }));

  return (
    <div>
      {(searchKeys || toolbar) && (
        <div className="flex flex-col gap-3 border-b border-slate-100 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          {searchKeys ? (
            <label className="relative block w-full sm:max-w-xs">
              <span className="sr-only">Search</span>
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" aria-hidden="true" />
              <input
                value={query}
                onChange={(e) => { setQuery(e.target.value); setPage(0); }}
                placeholder="Search…"
                className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-3 text-sm focus:border-primary-300 focus:bg-white"
              />
            </label>
          ) : <span />}
          {toolbar && <div className="flex flex-wrap items-center gap-2">{toolbar}</div>}
        </div>
      )}
      {/* Phones: each row becomes a card (no sideways scrolling). */}
      <ul className="divide-y divide-slate-100 sm:hidden">
        {visible.map((row, i) => (
          <li key={row[rowKey] ?? i}>
            <div className="space-y-1.5 px-4 py-3">
              {columns.map((c, ci) => {
                const content = c.render ? c.render(row) : row[c.key];
                if (content === null || content === undefined || content === '') return null;
                return ci === 0 ? (
                  <div key={c.key} className="text-sm font-medium text-slate-900">{content}</div>
                ) : (
                  <div key={c.key} className="flex items-start justify-between gap-3 text-xs">
                    {c.header ? <span className="shrink-0 text-slate-500">{c.header}</span> : <span />}
                    <span className="min-w-0 text-right text-slate-700">{content}</span>
                  </div>
                );
              })}
              {onRowClick && (
                <div className="pt-1 text-right">
                  <button type="button" onClick={() => onRowClick(row)} className="inline-flex min-h-[32px] items-center rounded-md px-3 text-xs font-semibold text-primary hover:bg-primary-50">Open →</button>
                </div>
              )}
            </div>
          </li>
        ))}
      </ul>
      {visible.length === 0 && <div className="sm:hidden"><EmptyState title={emptyTitle} compact /></div>}
      <div className="relative hidden overflow-x-auto scrollbar-thin sm:block" tabIndex={0} role="region" aria-label="Table — scroll horizontally for more columns">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-[11px] uppercase tracking-wide text-slate-500">
            <tr>
              {columns.map((c) => (
                <th key={c.key} scope="col" className={clsx('whitespace-nowrap px-4 py-2.5 font-semibold', c.className)}>
                  {c.sortable ? (
                    <button type="button" onClick={() => toggleSort(c.key)} className="inline-flex items-center gap-1 uppercase hover:text-primary">
                      {c.header}{sort?.key === c.key ? (sort.dir === 'asc' ? ' ↑' : ' ↓') : ''}
                    </button>
                  ) : c.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {visible.map((row, i) => (
              <tr
                key={row[rowKey] ?? i}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                className={clsx('bg-white', onRowClick && 'cursor-pointer hover:bg-primary-50/40')}
              >
                {columns.map((c) => (
                  <td key={c.key} className={clsx('px-4 text-slate-700', dense ? 'py-2' : 'py-3', c.className)}>
                    {c.render ? c.render(row) : row[c.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        {visible.length === 0 && <EmptyState title={emptyTitle} compact />}
      </div>
      {filtered.length > pageSize && (
        <div className="flex items-center justify-between border-t border-slate-100 px-4 py-2.5 text-xs text-slate-500">
          <span>{current * pageSize + 1}–{Math.min(filtered.length, (current + 1) * pageSize)} of {filtered.length}</span>
          <div className="flex gap-1">
            <button type="button" aria-label="Previous page" disabled={current === 0} onClick={() => setPage(current - 1)} className="rounded p-1 hover:bg-slate-100 disabled:opacity-40"><ChevronLeft className="h-4 w-4" /></button>
            <button type="button" aria-label="Next page" disabled={current >= pages - 1} onClick={() => setPage(current + 1)} className="rounded p-1 hover:bg-slate-100 disabled:opacity-40"><ChevronRight className="h-4 w-4" /></button>
          </div>
        </div>
      )}
    </div>
  );
}
