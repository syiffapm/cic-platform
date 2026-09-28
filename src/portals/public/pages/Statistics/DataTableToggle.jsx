/** Accessible table alternative for a chart, collapsed by default. */
export default function DataTableToggle({ title, columns, rows }) {
  return (
    <details className="rounded-xl border border-slate-200 bg-white shadow-sm">
      <summary className="cursor-pointer px-5 py-3 text-sm font-semibold text-slate-800">{title}</summary>
      <div className="overflow-x-auto border-t border-slate-100">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs text-slate-600">
            <tr>{columns.map((c) => <th key={c.key} scope="col" className="whitespace-nowrap px-4 py-2.5 font-semibold">{c.header}</th>)}</tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((r, i) => (
              <tr key={i}>{columns.map((c, j) => (j === 0
                ? <th key={c.key} scope="row" className="whitespace-nowrap px-4 py-2 font-medium text-slate-800">{r[c.key]}</th>
                : <td key={c.key} className="px-4 py-2 tabular-nums text-slate-600">{r[c.key]}</td>))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </details>
  );
}
