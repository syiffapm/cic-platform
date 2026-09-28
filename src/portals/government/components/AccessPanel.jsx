import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown, KeyRound, MapPin } from 'lucide-react';
import { Badge } from '@/components/ui';
import { ACTIONS, FEATURES } from '@/data/rbac';
import { describeActions } from '@/lib/rbac';
import { useGovAccess } from '../lib/access';
import { GROUP_ORDER } from '../navigation';

/** Letters granted to the role on a feature, e.g. "CRU". */
const lettersFor = (role, id) => role?.permissions?.[id] ?? '';

function PermissionSummary({ role, compact }) {
  const groups = GROUP_ORDER.map((g) => ({
    label: g,
    items: FEATURES.filter((f) => f.portal === 'gov' && f.group === g && lettersFor(role, f.id).includes('R')),
  })).filter((g) => g.items.length);
  if (!groups.length) return <p className="text-xs text-slate-500">No modules assigned.</p>;
  return (
    <div className={compact ? 'space-y-2.5' : 'grid gap-4 md:grid-cols-2 xl:grid-cols-3'}>
      {groups.map((g) => (
        <div key={g.label}>
          <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">{g.label}</p>
          <ul className="mt-1 space-y-0.5">
            {g.items.map((f) => {
              const letters = lettersFor(role, f.id);
              return (
                <li key={f.id} className="flex items-center justify-between gap-2 text-xs text-slate-700">
                  <span className="truncate">{f.label}</span>
                  <span className="flex shrink-0 gap-0.5" title={describeActions(letters)} aria-label={describeActions(letters)}>
                    {ACTIONS.filter((a) => f.actions.includes(a.key)).map((a) => (
                      <span key={a.key} className={`w-4 rounded text-center font-mono text-[11px] font-semibold ${letters.includes(a.key) ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-50 text-slate-500 line-through'}`}>{a.key}</span>
                    ))}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </div>
  );
}

function AccessDetails({ compact = false }) {
  const { role, scope, piiUnmasked } = useGovAccess();
  if (!role) return <p className="text-xs text-slate-500">Your role is not active. Contact the security administrator.</p>;
  const regions = Array.isArray(scope.regions) ? scope.regions : null;
  return (
    <div className="space-y-3 text-sm">
      <div className="flex flex-wrap items-center gap-1.5">
        <Badge tone={piiUnmasked ? 'amber' : 'teal'}>{piiUnmasked ? 'Personal data visible — every view logged' : 'Personal data masked'}</Badge>
        {regions
          ? <Badge tone="violet"><MapPin className="mr-1 inline h-3 w-3" aria-hidden="true" />{regions.join(', ')}</Badge>
          : <Badge tone="slate">{scope.regions ?? 'All regions'}</Badge>}
      </div>
      <p className="text-xs text-slate-700"><b>Data scope:</b> {scope.data ?? '—'}</p>
      {!compact && role.description && <p className="text-xs text-slate-600">{role.description}</p>}
      <div>
        <p className="mb-1.5 text-[11px] text-slate-500">
          {ACTIONS.map((a) => `${a.key} ${a.label.toLowerCase()}`).join(' · ')}
        </p>
        <PermissionSummary role={role} compact={compact} />
      </div>
      <p className="text-[11px] text-slate-500">Menu items outside your role are hidden and attempts to open them are logged. Changes are approved by a second person.</p>
    </div>
  );
}

/** Header button + popover ("Your access"). */
export function AccessPopover() {
  const { user, role, can } = useGovAccess();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const buttonRef = useRef(null);
  const panelRef = useRef(null);

  // Other pages can open the popover (e.g. the "Your access" link on the operations dashboard).
  useEffect(() => {
    const onOpen = () => { setOpen(true); window.scrollTo({ top: 0, behavior: 'smooth' }); setTimeout(() => panelRef.current?.focus(), 50); };
    window.addEventListener('gov:open-access', onOpen);
    return () => window.removeEventListener('gov:open-access', onOpen);
  }, []);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => { if (e.key === 'Escape') { setOpen(false); buttonRef.current?.focus(); } };
    const onClick = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('keydown', onKey);
    document.addEventListener('mousedown', onClick);
    return () => { document.removeEventListener('keydown', onKey); document.removeEventListener('mousedown', onClick); };
  }, [open]);

  if (!user) return null;
  return (
    <div className="relative" ref={ref}>
      <button ref={buttonRef} type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open} aria-haspopup="dialog" aria-label={`Your access — ${role?.name ?? user.roleName ?? 'role'}`}
        className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50">
        <KeyRound className="h-3.5 w-3.5 text-teal-700" aria-hidden="true" />
        <span className="hidden sm:inline">Your access</span>
        <ChevronDown className="h-3.5 w-3.5 text-slate-500" aria-hidden="true" />
      </button>
      {open && (
        <div ref={panelRef} tabIndex={-1} role="dialog" aria-label="Your access" className="outline-none absolute right-0 z-30 mt-2 max-h-[75vh] w-[24rem] max-w-[calc(100vw-2rem)] overflow-y-auto rounded-xl border border-slate-200 bg-white p-4 shadow-xl">
          <p className="text-sm font-semibold text-slate-900">{role?.name ?? user.roleName}</p>
          <p className="mb-3 text-[11px] text-slate-500">
            {role?.org ?? 'Government'}
            {can('adm.roles', 'read') && <> · <Link to="/gov/admin/access/roles" onClick={() => setOpen(false)} className="font-medium text-primary hover:underline">Roles & permissions</Link></>}
          </p>
          <AccessDetails compact />
        </div>
      )}
    </div>
  );
}
