import { Link } from 'react-router-dom';
import { groupCoverage, groupedFeatures } from './rbacModel';

/** Navy ramp by share of actions granted; light cells use navy text, dark cells white (both ≥ 4.5:1). */
function cellStyle(share) {
  if (!share) return { background: 'rgb(248 250 252)', color: 'rgb(100 116 139)' };
  const alpha = share <= 0.5 ? 0.06 + share * 0.6 : 0.72 + (share - 0.5) * 0.56;
  return { background: `hsl(214 45% 22% / ${alpha.toFixed(2)})`, color: share > 0.5 ? '#fff' : 'hsl(214 45% 22%)' };
}

const LEGEND = [0, 0.25, 0.5, 0.75, 1];

/** Roles × feature groups: how much of each group every role can do. */
export default function PermissionHeatmap({ roles, portal }) {
  const groups = groupedFeatures(portal);
  return (
    <div className="space-y-3 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
        <p>Each cell shows the share of available actions (create, read, update, delete, approve, export) a role holds across the features of a group. Hover a cell for detail.</p>
        <div className="flex items-center gap-1" aria-hidden="true">
          <span>None</span>
          {LEGEND.map((s) => <span key={s} className="h-3 w-6 rounded-sm border border-slate-200" style={cellStyle(s)} />)}
          <span>Full</span>
        </div>
      </div>
      <div className="overflow-x-auto scrollbar-thin" tabIndex={0} role="region" aria-label="Permission overview — scroll sideways for more groups">
        <table className="w-full border-separate border-spacing-1 text-xs">
          <caption className="sr-only">Share of actions granted per role and feature group</caption>
          <thead>
            <tr>
              <th scope="col" className="sticky left-0 z-10 bg-white px-2 py-1 text-left font-semibold text-slate-500">Role</th>
              {groups.map((g) => (
                <th key={g.name} scope="col" className="min-w-[88px] px-1 py-1 text-center align-bottom font-semibold leading-tight text-slate-600">
                  {g.name}<span className="block text-[11px] font-normal text-slate-500">{g.features.length} features</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {roles.map((r) => (
              <tr key={r.id}>
                <th scope="row" className="sticky left-0 z-10 max-w-[220px] bg-white px-2 py-1 text-left font-medium text-slate-800">
                  <Link to={`/gov/admin/access/roles/${r.id}`} className="hover:text-primary hover:underline">{r.name}</Link>
                  {r.status === 'Disabled' && <span className="ml-1 text-[11px] font-normal text-red-600">(disabled)</span>}
                </th>
                {groupCoverage(r.permissions, portal).map((c) => {
                  const pct = Math.round((c.share ?? 0) * 100);
                  const label = `${r.name}, ${c.group}: ${pct}% of actions across ${c.features} of ${c.of} features`;
                  return (
                    <td key={c.group} title={label} aria-label={label} className="h-8 rounded text-center font-semibold tabular-nums" style={cellStyle(c.share)}>
                      {pct ? `${pct}%` : '—'}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
