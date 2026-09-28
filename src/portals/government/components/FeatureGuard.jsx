import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Eye, MapPin, ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui';
import { useStore } from '@/context/StoreContext';
import { featureById } from '@/data/rbac';
import { useGovAccess, useRegionScope } from '../lib/access';
import { LandingWork } from './MyWork';

/** Grey banner for roles that can open a module but not change anything in it. */
export function ViewOnlyBanner({ note }) {
  return (
    <div role="status" className="mb-5 flex items-start gap-3 rounded-lg border border-slate-300 bg-slate-100 px-4 py-3 text-sm text-slate-700">
      <Eye className="mt-0.5 h-4 w-4 shrink-0 text-slate-500" aria-hidden="true" />
      <div>
        <p className="font-semibold">View only — your role can read this module</p>
        <p className="text-xs text-slate-600">{note ?? 'Create, edit, delete and approve actions are not available to your role. Everything you open is recorded in the audit log.'}</p>
      </div>
    </div>
  );
}

/** Small chip shown on lists that are narrowed to the user's assigned regions. */
export function ScopeChip({ className = '' }) {
  const { regions, label } = useRegionScope();
  if (!regions) return null;
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border border-violet-200 bg-violet-50 px-2.5 py-1 text-xs font-medium text-violet-800 ${className}`}>
      <MapPin className="h-3.5 w-3.5" aria-hidden="true" /> Scope: {label}
    </span>
  );
}

/** Access-denied screen; the attempt is written to the audit log once. */
export function AccessDenied({ feature }) {
  const { user, role } = useGovAccess();
  const { logAudit } = useStore();
  const logged = useRef(false);
  const label = featureById(feature)?.label ?? 'this module';

  useEffect(() => {
    if (user && !logged.current) {
      logged.current = true;
      logAudit({ actor: user.name, role: user.role, tenant: role?.org ?? 'Government', ip: user.ip, action: 'ACCESS_DENIED', module: label, target: window.location.pathname, outcome: 'Denied' });
    }
  }, [user, role, label, logAudit]);

  return (
    <div className="mx-auto flex max-w-lg flex-col items-center py-20 text-center">
      <div className="rounded-full bg-red-50 p-4 text-red-600"><ShieldAlert className="h-8 w-8" aria-hidden="true" /></div>
      <h1 className="mt-4 text-xl font-bold text-slate-900">Access denied</h1>
      <p className="mt-2 text-sm text-slate-600">
        Your role <b>{role?.name ?? user?.roleName ?? '—'}</b> is not permitted to open <b>{label}</b>.
        This attempt has been recorded in the audit log.
      </p>
      <Link to="/gov" className="mt-6"><Button variant="outline">Back to my home page</Button></Link>
    </div>
  );
}

/**
 * Route guard: the role must be able to read `feature`. Roles with read / export only see a
 * view-only banner above the page (hide it with banner={false}). On the role's own landing page
 * the page starts with the user's work queue.
 */
export default function FeatureGuard({ feature, banner = true, children }) {
  const { can, readOnly } = useGovAccess();
  if (!can(feature, 'read')) return <AccessDenied feature={feature} />;
  return (
    <>
      {feature !== 'adm.operations' && <LandingWork feature={feature} />}
      {banner && readOnly(feature) && <ViewOnlyBanner />}
      {children}
    </>
  );
}
