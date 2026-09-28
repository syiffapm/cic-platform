import { Flag } from 'lucide-react';
import { Badge, Card, CardHeader, useToast } from '@/components/ui';
import { roleName } from '@/data/roles';
import { useAdminCollection } from '../../../context/AdminStore';
import { FEATURE_FLAGS } from '../../../data/system';

/** Feature flags (ADM-13). A toggle never flips directly; it raises a maker-checker request. */
export default function FeatureFlagsCard({ role, readOnly, requestApproval, approvals }) {
  const toast = useToast();
  const [flags] = useAdminCollection('featureFlags', FEATURE_FLAGS);
  const checkerRole = role === 'adm_super' ? 'adm_security' : 'adm_super';
  const pendingFor = (id) => approvals.find((a) => a.status === 'Pending' && a.payload?.flagId === id);

  const request = (f) => {
    const to = !f.enabled;
    const a = requestApproval({
      type: 'Feature flag',
      summary: `${to ? 'Enable' : 'Disable'} feature flag “${f.name}” (${f.id})`,
      checkerRole,
      payload: { flagId: f.id, diff: [{ field: f.name, from: f.enabled ? 'On' : 'Off', to: to ? 'On' : 'Off' }], effect: { target: 'admin', collection: 'featureFlags', op: 'patch', id: f.id, changes: { enabled: to } } },
    });
    toast(`${a.id} submitted — flag changes after ${roleName(checkerRole)} approves`, 'info');
  };

  return (
    <Card>
      <CardHeader icon={Flag} title="Feature flags" subtitle={`Changes require approval by ${roleName(checkerRole)}`} />
      <ul className="divide-y divide-slate-100">
        {flags.map((f) => {
          const pending = pendingFor(f.id);
          return (
            <li key={f.id} className="flex flex-col gap-2 px-5 py-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <p className="text-sm font-medium text-slate-800">{f.name} <span className="font-mono text-[11px] font-normal text-slate-500">{f.id}</span></p>
                <p className="text-xs text-slate-500">{f.description} · Scope: {f.scope}</p>
                {pending && <p className="mt-1 text-[11px] text-amber-700">{pending.id} pending: {pending.payload.diff[0].from} → {pending.payload.diff[0].to}</p>}
              </div>
              <div className="flex shrink-0 items-center gap-3">
                <Badge tone={f.enabled ? 'green' : 'slate'}>{f.enabled ? 'On' : 'Off'}</Badge>
                <button
                  type="button"
                  role="switch"
                  aria-checked={f.enabled}
                  aria-label={`Request to ${f.enabled ? 'disable' : 'enable'} ${f.name}`}
                  disabled={readOnly || !!pending}
                  onClick={() => request(f)}
                  className={`relative h-6 w-11 rounded-full transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${f.enabled ? 'bg-primary' : 'bg-slate-300'}`}
                >
                  <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${f.enabled ? 'translate-x-5' : 'translate-x-0.5'}`} />
                </button>
              </div>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}
