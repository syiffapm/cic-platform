import clsx from 'clsx';
import { useEffect, useRef } from 'react';
import { ACTIONS } from '@/data/rbac';
import { columnState, groupedFeatures, toggleCell, toggleColumn, toggleRow } from './rbacModel';

/** Native checkbox with indeterminate support. */
function Box({ checked, indeterminate, disabled, label, onChange, className }) {
  const ref = useRef(null);
  useEffect(() => { if (ref.current) ref.current.indeterminate = !!indeterminate && !checked; }, [indeterminate, checked]);
  return (
    <input ref={ref} type="checkbox" checked={checked} disabled={disabled} aria-label={label} onChange={onChange}
      className={clsx('h-4 w-4 cursor-pointer rounded border-slate-300 accent-[hsl(214_45%_22%)] disabled:cursor-not-allowed', className)} />
  );
}

/**
 * Feature × action matrix. `perms` is the draft, `saved` the approved version (changed cells are
 * highlighted). Choosing any action also grants Read; removing Read clears the row.
 */
export default function PermissionMatrix({ portal, perms, saved, readOnly, onChange }) {
  const groups = groupedFeatures(portal);
  return (
    <div className="space-y-5">
      {groups.map((g) => (
        <div key={g.name} className="overflow-x-auto rounded-lg border border-slate-200 scrollbar-thin" tabIndex={0} role="region" aria-label={`${g.name} permissions — scroll sideways on small screens`}>
          <table className="w-full min-w-[720px] text-sm">
            <caption className="sr-only">{g.name} permissions</caption>
            <thead className="bg-slate-50 text-[11px] uppercase tracking-wide text-slate-500">
              <tr>
                <th scope="col" className="px-3 py-2 text-left font-semibold normal-case tracking-normal">
                  <span className="text-sm text-primary">{g.name}</span>
                </th>
                <th scope="col" className="w-14 px-2 py-2 text-center font-semibold">All</th>
                {ACTIONS.map((a) => {
                  const st = columnState(perms, g.features, a.key);
                  return (
                    <th key={a.key} scope="col" className="w-20 px-2 py-2 text-center font-semibold">
                      <span className="block">{a.label}</span>
                      {st.eligible > 0 && !readOnly && (
                        <Box className="mt-1" checked={st.all} indeterminate={st.on > 0} label={`${g.name} — ${a.label} for all features`}
                          onChange={() => onChange(toggleColumn(perms, g.features, a.key))} />
                      )}
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {g.features.map((f) => {
                const cur = perms[f.id] ?? '';
                const was = saved[f.id] ?? '';
                const rowChanged = cur !== was;
                return (
                  <tr key={f.id} className={clsx(rowChanged ? 'bg-amber-50/40' : 'bg-white')}>
                    <th scope="row" className="px-3 py-2 text-left font-normal">
                      <span className="text-slate-800">{f.label}</span>
                      {!cur && <span className="ml-2 text-[11px] text-slate-500">No access</span>}
                    </th>
                    <td className="px-2 py-2 text-center">
                      <Box checked={cur.length === f.actions.length} indeterminate={cur.length > 0} disabled={readOnly}
                        label={`${f.label} — all actions`} onChange={() => onChange(toggleRow(perms, f))} />
                    </td>
                    {ACTIONS.map((a) => {
                      if (!f.actions.includes(a.key)) {
                        return <td key={a.key} className="px-2 py-2 text-center text-slate-500" aria-label={`${a.label} not applicable`}>—</td>;
                      }
                      const on = cur.includes(a.key);
                      const changed = on !== was.includes(a.key);
                      return (
                        <td key={a.key} className="px-2 py-1.5 text-center">
                          <span className={clsx('inline-flex h-7 w-7 items-center justify-center rounded-md',
                            changed && (on ? 'bg-emerald-100 ring-1 ring-emerald-400' : 'bg-red-100 ring-1 ring-red-300'))}>
                            <Box checked={on} disabled={readOnly} label={`${f.label} — ${a.label}${changed ? (on ? ' (added)' : ' (removed)') : ''}`}
                              onChange={() => onChange(toggleCell(perms, f, a.key))} />
                          </span>
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  );
}
