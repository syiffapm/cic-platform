import { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import clsx from 'clsx';
import { Eye, Lock, ShieldCheck, X } from 'lucide-react';
import { Alert, Button, EmptyState } from '@/components/ui';
import { useStore } from '@/context/StoreContext';
import { usePermissions, describeActions } from '@/lib/rbac';
import { FEATURES, featureById } from '@/data/rbac';
import { INSTITUTIONS } from '@/data/institutions';

/**
 * Access control for the MFI portal. Every check reads the live permission matrix managed by CIC and the
 * Central Bank (Government Portal → Roles & permissions). UI checks only — the API enforces the same matrix.
 */
export const useAccess = () => usePermissions('mfi');

export const MFI_FEATURES = FEATURES.filter((f) => f.portal === 'mfi');
const CHANGE_ACTIONS = ['create', 'update', 'delete', 'approve'];

/** Tooltip text for a missing permission, e.g. denied('delete API keys') → "Your role cannot delete API keys." */
export const denied = (what) => `Your role cannot ${what}.`;

/**
 * Button bound to a permission. Allowed → normal button (or link when `to` is set).
 * Not allowed → hidden (`hide`) or disabled with a tooltip "Your role cannot …".
 */
export function PermButton({ feature, action, what, hide, to, disabled, className, ...props }) {
  const { can } = useAccess();
  const ok = can(feature, action);
  if (!ok && hide) return null;
  if (!ok) {
    const tip = denied(what);
    return (
      <span className="inline-flex cursor-not-allowed" title={tip}>
        <Button {...props} className={clsx(className, 'pointer-events-none')} disabled aria-disabled="true" aria-label={props['aria-label'] ? `${props['aria-label']} — ${tip}` : undefined} />
        <span className="sr-only">{tip}</span>
      </span>
    );
  }
  const btn = <Button {...props} className={className} disabled={disabled} />;
  return to ? <Link to={to} tabIndex={-1} className="inline-flex">{btn}</Link> : btn;
}

/** "View only" banner for a page whose feature the role can read but not change. */
export function ViewOnlyBanner({ feature, children }) {
  const { can, role } = useAccess();
  const f = featureById(feature);
  if (!f || !can(feature, 'read')) return null;
  const changeable = CHANGE_ACTIONS.some((a) => f.actions.includes(a[0].toUpperCase()) && can(feature, a));
  if (changeable) return null;
  return (
    <Alert tone="info" title="View only">
      {children ?? `Your role (${role?.name ?? 'current role'}) can view ${f.label.toLowerCase()} but cannot make changes here.`}
      {can(feature, 'export') && ' You can still download and export.'}
    </Alert>
  );
}

/** Route guard: renders the page only if the role can read its feature; otherwise records ACCESS_DENIED. */
export function FeatureGate({ feature, children }) {
  const { can, role, user } = useAccess();
  const { logAudit } = useStore();
  const { pathname } = useLocation();
  const allowed = can(feature, 'read');
  const logged = useRef(null);

  useEffect(() => {
    if (allowed || !user || logged.current === pathname) return;
    logged.current = pathname;
    logAudit({ actor: user.name, role: user.role, tenant: user.tenant, action: 'ACCESS_DENIED', module: featureById(feature)?.label ?? feature, target: pathname, purpose: '—', outcome: 'Denied' });
  }, [allowed, feature, logAudit, pathname, user]);

  if (allowed) return children;
  const disabled = role?.status === 'Disabled';
  const label = featureById(feature)?.label ?? 'this module';
  return (
    <EmptyState
      icon={Lock}
      title="You do not have access to this page"
      description={disabled
        ? `Your role (${role?.name}) is currently disabled by CIC. Contact your MFI Administrator or the CIC helpdesk.`
        : `Your role (${role?.name ?? user?.roleName ?? 'unassigned'}) does not include ${label.toLowerCase()}. Ask your MFI Administrator if you need access. This attempt has been recorded in the audit trail.`}
      action={can('mfi.dashboard', 'read') && <Link to="/mfi"><Button variant="outline">Back to dashboard</Button></Link>}
    />
  );
}

/** One row per feature the role can read, with the allowed actions. */
export function AccessList({ permissions, compact }) {
  const rows = MFI_FEATURES.filter((f) => (permissions?.[f.id] ?? '').includes('R'));
  if (!rows.length) return <p className="text-xs text-slate-500">No access to any module.</p>;
  return (
    <ul className={clsx('divide-y divide-slate-100', compact ? 'text-[11px]' : 'text-xs')}>
      {rows.map((f) => (
        <li key={f.id} className="flex items-start justify-between gap-3 py-1.5">
          <span className="text-slate-700">{f.label}</span>
          <span className="shrink-0 text-right text-slate-500">{describeActions(permissions[f.id])}</span>
        </li>
      ))}
    </ul>
  );
}

/** Header chip: role, institution and what the signed-in user can do. */
export function AccessChip() {
  const { role, user, scope } = useAccess();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const institution = INSTITUTIONS.find((i) => i.id === user?.tenant);

  useEffect(() => {
    if (!open) return undefined;
    const close = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    const esc = (e) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', close);
    document.addEventListener('keydown', esc);
    return () => { document.removeEventListener('mousedown', close); document.removeEventListener('keydown', esc); };
  }, [open]);

  if (!user) return null;
  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-label={`Your access — ${role?.name ?? user.roleName ?? 'role'}`}
        title={role?.name ?? user.roleName}
        className="flex items-center gap-1.5 rounded-full border border-teal-200 bg-teal-50 p-2 text-[11px] font-medium text-teal-800 hover:bg-teal-100 sm:px-2.5 sm:py-1"
      >
        <ShieldCheck className="h-4 w-4 text-teal-700 sm:h-3.5 sm:w-3.5" aria-hidden="true" />
        <span className="hidden sm:inline">Your access</span>
      </button>
      {open && (
        <div role="dialog" aria-label="Your access" className="absolute right-0 z-30 mt-2 w-[22rem] max-w-[calc(100vw-2rem)] rounded-xl border border-slate-200 bg-white p-4 shadow-xl">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-sm font-semibold text-slate-800">{role?.name ?? user.roleName}</p>
              <p className="text-[11px] text-slate-500">{institution?.name ?? user.tenant} · {user.tenant}</p>
            </div>
            <button type="button" onClick={() => setOpen(false)} className="rounded p-1 text-slate-500 hover:bg-slate-100" aria-label="Close"><X className="h-4 w-4" /></button>
          </div>
          {role?.status === 'Disabled' && <Alert tone="danger" className="mt-3">This role is currently disabled by CIC.</Alert>}
          {role?.description && <p className="mt-2 text-xs text-slate-600">{role.description}</p>}
          {scope?.data && <p className="mt-2 flex items-center gap-1.5 text-[11px] text-slate-500"><Eye className="h-3.5 w-3.5" aria-hidden="true" /> Data: {scope.data}</p>}
          <p className="mt-3 text-[11px] font-semibold uppercase tracking-wide text-slate-500">What you can do</p>
          <div className="mt-1 max-h-64 overflow-y-auto pr-1 scrollbar-thin">
            <AccessList permissions={role?.status === 'Disabled' ? {} : role?.permissions} compact />
          </div>
          <p className="mt-3 border-t border-slate-100 pt-2 text-[11px] text-slate-500">Roles and permissions are set by CIC and the Central Bank. Your MFI Administrator assigns them.</p>
        </div>
      )}
    </div>
  );
}
