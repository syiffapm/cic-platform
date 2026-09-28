import { useState } from 'react';
import clsx from 'clsx';
import { Lock } from 'lucide-react';
import { Badge, Card, CardHeader, Select } from '@/components/ui';
import { ACTIONS } from '@/data/rbac';
import { describeActions } from '@/lib/rbac';
import { MFI_FEATURES } from './access';
import { useMfiRoles } from './RolePicker';

const actionText = (p) => (p ? ACTIONS.filter((a) => p.includes(a.key)).map((a) => a.label).join(', ') : 'No access');

/** Letters C/R/U/D/A/E for one feature × role; the text alternative lists the granted actions. */
function Cell({ feature, perms }) {
  return (
    <span className="inline-flex gap-0.5">
      <span className="sr-only">{actionText(perms)}</span>
      {ACTIONS.map((a) => (feature.actions.includes(a.key) ? (
        <span
          key={a.key}
          title={a.label}
          aria-hidden="true"
          className={clsx('inline-flex h-5 w-5 items-center justify-center rounded font-mono text-[11px] font-semibold', perms.includes(a.key) ? 'bg-primary text-white' : 'bg-slate-100 text-slate-500')}
        >{a.key}</span>
      ) : null))}
    </span>
  );
}

/** Read-only permission matrix of the MFI role templates (features × C/R/U/D/A/E). Phones show one role at a time. */
export default function RoleMatrix() {
  const { all } = useMfiRoles();
  const [roleId, setRoleId] = useState(all[0]?.id ?? '');
  const picked = all.find((r) => r.id === roleId) ?? all[0];

  return (
    <Card>
      <CardHeader
        title="Role permissions"
        subtitle="Defined by CIC and the Central Bank for every licensed MFI. Contact CIC if your institution needs a change."
        icon={Lock}
        action={<Badge tone="slate">Read-only</Badge>}
      />

      {/* Phones: pick a role, see its permissions as a list. */}
      <div className="space-y-3 px-4 py-3 sm:hidden">
        <Select label="Role" value={picked?.id ?? ''} onChange={(e) => setRoleId(e.target.value)} options={all.map((r) => ({ value: r.id, label: r.status === 'Disabled' ? `${r.name} (disabled)` : r.name }))} />
        {picked?.status === 'Disabled' && <p className="text-xs font-medium text-red-700">Disabled by CIC — users with this role have no access.</p>}
        {picked && (
          <ul className="divide-y divide-slate-100 text-xs">
            {MFI_FEATURES.map((f) => {
              const p = picked.permissions?.[f.id] ?? '';
              return (
                <li key={f.id} className="flex items-start justify-between gap-3 py-2">
                  <span className="font-medium text-slate-700">{f.label}</span>
                  <span className={clsx('text-right', p ? 'text-slate-700' : 'text-slate-500')}>{p ? describeActions(p) : 'No access'}</span>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <div className="relative hidden overflow-x-auto scrollbar-thin sm:block" tabIndex={0} role="region" aria-label="Role permissions table — scroll horizontally for more roles">
        <table className="w-full min-w-[760px] text-left text-xs">
          <thead className="bg-slate-50 text-[11px] text-slate-500">
            <tr>
              <th scope="col" className="sticky left-0 bg-slate-50 px-4 py-2 font-semibold">Feature</th>
              {all.map((r) => (
                <th key={r.id} scope="col" className="px-2 py-2 text-center font-semibold">
                  <span className="block">{r.name}</span>
                  {r.status === 'Disabled' && <span className="block text-[11px] font-normal text-red-700">Disabled</span>}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {MFI_FEATURES.map((f) => (
              <tr key={f.id}>
                <th scope="row" className="sticky left-0 bg-white px-4 py-2 font-medium text-slate-700">{f.label}</th>
                {all.map((r) => (
                  <td key={r.id} className={clsx('px-2 py-2 text-center', r.status === 'Disabled' && 'opacity-40')}>
                    <Cell feature={f} perms={r.permissions?.[f.id] ?? ''} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="border-t border-slate-100 px-4 py-2.5 text-[11px] text-slate-500">
        {ACTIONS.map((a) => `${a.key} ${a.label}`).join(' · ')}. Grey letters are actions the feature supports but the role does not have.
      </p>
    </Card>
  );
}
