import clsx from 'clsx';
import { ChevronDown } from 'lucide-react';
import { useStore } from '@/context/StoreContext';
import { AccessList } from './access';

/** Active MFI role templates, as currently published by CIC / Central Bank. */
export function useMfiRoles() {
  const { roles = [] } = useStore();
  const all = roles.filter((r) => r.portal === 'mfi');
  return { all, active: all.filter((r) => r.status !== 'Disabled'), nameOf: (id) => all.find((r) => r.id === id)?.name ?? id };
}

/** Radio list of role templates with their description and an expandable "What this role can do". */
export default function RolePicker({ value, onChange, label = 'Role', current }) {
  const { active } = useMfiRoles();
  return (
    <fieldset className="space-y-2">
      <legend className="text-xs font-medium text-slate-700">{label}</legend>
      <p className="text-[11px] text-slate-500">Roles and their permissions are set by CIC and the Central Bank. You assign them to your staff.</p>
      <div className="max-h-[22rem] space-y-2 overflow-y-auto pr-1 scrollbar-thin">
        {active.map((r) => {
          const selected = value === r.id;
          return (
            <div key={r.id} className={clsx('rounded-lg border p-3', selected ? 'border-primary bg-primary-50/60 ring-1 ring-primary' : 'border-slate-200')}>
              <label className="flex cursor-pointer items-start gap-3">
                <input type="radio" name="mfi-role" className="mt-1 h-4 w-4 accent-[hsl(var(--primary))]" checked={selected} onChange={() => onChange(r.id)} />
                <span className="flex-1">
                  <span className="block text-sm font-semibold text-slate-800">
                    {r.name}
                    {current === r.id && <span className="ml-2 rounded bg-slate-100 px-1.5 py-0.5 text-[11px] font-medium text-slate-500">Current</span>}
                  </span>
                  <span className="block text-xs text-slate-500">{r.description}</span>
                </span>
              </label>
              <details className="group mt-2 pl-7">
                <summary className="flex cursor-pointer list-none items-center gap-1 text-[11px] font-medium text-primary">
                  <ChevronDown className="h-3.5 w-3.5 transition-transform group-open:rotate-180" aria-hidden="true" /> What this role can do
                </summary>
                <div className="mt-1 rounded-md bg-white px-2">
                  <AccessList permissions={r.permissions} compact />
                  {r.scope?.data && <p className="border-t border-slate-100 py-1.5 text-[11px] text-slate-500">Data: {r.scope.data}</p>}
                </div>
              </details>
            </div>
          );
        })}
      </div>
    </fieldset>
  );
}
