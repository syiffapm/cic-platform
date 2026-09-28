import { useEffect, useMemo, useState } from 'react';
import { KeyRound, RotateCcw, Save, Timer, UserX } from 'lucide-react';
import { Button, Card, CardHeader, Input, MakerCheckerBanner, PageHeader, Select, Toggle, useToast } from '@/components/ui';
import { roleName } from '@/data/roles';
import { useAdmin } from '../../lib/useAdmin';
import { useAdminObject } from '../../context/AdminStore';
import PendingApprovals from '../../components/PendingApprovals';
import { ABAC_SEED, MFA_METHODS, POLICY_SEED, PORTALS, PORTAL_LABELS } from '../../data/iam';
import AbacRules from './components/AbacRules';
import IpAllowList from './components/IpAllowList';
import RecertCampaign from './components/RecertCampaign';

const flatten = (obj, prefix = '') => Object.entries(obj).reduce((acc, [k, v]) => {
  const path = prefix ? `${prefix}.${k}` : k;
  if (v && typeof v === 'object' && !Array.isArray(v)) Object.assign(acc, flatten(v, path));
  else acc[path] = Array.isArray(v) ? v.join(', ') || '(open)' : String(v);
  return acc;
}, {});

const LIMITS = {
  'password.minLength': [12, 64], 'password.history': [5, 24], 'password.expiryDays': [30, 180], 'password.lockoutAttempts': [3, 10],
  'session.idleMinutes': [5, 30], 'session.absoluteHours': [1, 12], dormantDays: [30, 90], recertMonths: [3, 6],
};

export default function Policies() {
  const { user, role, can, requestApproval } = useAdmin('adm.policies');
  const readOnly = !can('update');
  const [abac, setAbac] = useState(ABAC_SEED);
  const toast = useToast();
  const [policy] = useAdminObject('iamPolicy', POLICY_SEED);
  const [draft, setDraft] = useState(policy);
  useEffect(() => setDraft(policy), [policy]);
  const checkerRole = role === 'adm_security' ? 'adm_super' : 'adm_security';

  const diff = useMemo(() => {
    const a = flatten(policy); const b = flatten(draft);
    return Object.keys(b).filter((k) => a[k] !== b[k]).map((k) => ({ field: k, from: a[k], to: b[k] }));
  }, [policy, draft]);

  const errors = Object.fromEntries(Object.entries(LIMITS).map(([path, [min, max]]) => {
    const v = Number(path.split('.').reduce((o, k) => o[k], draft));
    return [path, Number.isNaN(v) || v < min || v > max ? `Allowed ${min}–${max} (baseline policy)` : null];
  }));
  const valid = !Object.values(errors).some(Boolean);

  const setIn = (section, key, v) => setDraft((d) => ({ ...d, [section]: { ...d[section], [key]: v } }));
  const setMfa = (portal, changes) => setDraft((d) => ({ ...d, mfa: { ...d.mfa, [portal]: { ...d.mfa[portal], ...changes } } }));
  const num = (section, key) => ({
    type: 'number', value: draft[section][key], disabled: readOnly,
    onChange: (e) => setIn(section, key, e.target.value === '' ? '' : Number(e.target.value)), error: errors[`${section}.${key}`],
  });

  const save = () => {
    const a = requestApproval({
      type: 'Security policy change', checkerRole, summary: `IAM policy change — ${diff.length} setting(s): ${diff.slice(0, 3).map((d) => d.field).join(', ')}${diff.length > 3 ? '…' : ''}`,
      payload: { diff, effect: { target: 'admin', collection: 'iamPolicy', op: 'set', changes: draft } },
    });
    toast(`${a.id} submitted to ${roleName(checkerRole)} — current policy stays in force until approved`, 'success');
  };

  const addAbac = (form) => {
    const id = `ABAC-${String(abac.length + 1).padStart(2, '0')}`;
    const a = requestApproval({ type: 'ABAC rule', checkerRole, summary: `Add ABAC rule ${id} · ${form.name}`, payload: { rule: { id, ...form } } });
    setAbac((rows) => [...rows, { id, ...form, status: 'Pending' }]);
    toast(`${a.id} submitted to ${roleName(checkerRole)}`, 'success');
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Security policies" subtitle="MFA, passwords, network, sessions, dormancy and recertification for every portal"
        actions={(
          <>
            <Button variant="outline" icon={RotateCcw} disabled={!diff.length} onClick={() => setDraft(policy)}>Discard</Button>
            <Button icon={Save} disabled={readOnly || !diff.length || !valid} onClick={save}>Save changes{diff.length ? ` (${diff.length})` : ''}</Button>
          </>
        )} />

      {diff.length > 0 && (
        <MakerCheckerBanner maker={user?.name} checker={roleName(checkerRole)} note={`${diff.length} unsaved change(s): ${diff.map((d) => `${d.field} ${d.from} → ${d.to}`).slice(0, 4).join('; ')}${diff.length > 4 ? '…' : ''}.`} />
      )}

      <Card>
        <CardHeader icon={KeyRound} title="Multi-factor authentication" subtitle="Enforcement and allowed method per portal" />
        <div className="grid grid-cols-1 gap-4 p-5 md:grid-cols-2">
          {PORTALS.map((p) => (
            <div key={p} className="space-y-3 rounded-lg border border-slate-200 p-4">
              <Toggle label={PORTAL_LABELS[p]} description={draft.mfa[p].enforced ? 'MFA required at every sign-in' : 'MFA optional — not recommended'}
                checked={draft.mfa[p].enforced} onChange={(v) => !readOnly && setMfa(p, { enforced: v })} />
              <Select label="Method" value={draft.mfa[p].method} disabled={readOnly || !draft.mfa[p].enforced} onChange={(e) => setMfa(p, { method: e.target.value })} options={MFA_METHODS[p]} />
            </div>
          ))}
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader icon={KeyRound} title="Password policy" subtitle="Applies to local (non-SSO) accounts" />
          <div className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-2">
            <Input label="Minimum length" {...num('password', 'minLength')} hint="Characters" />
            <Input label="Password history" {...num('password', 'history')} hint="Previous passwords that cannot be reused" />
            <Input label="Expiry (days)" {...num('password', 'expiryDays')} />
            <Input label="Lockout after failed attempts" {...num('password', 'lockoutAttempts')} />
            <div className="sm:col-span-2">
              <Toggle label="Complexity required" description="Upper, lower, digit and symbol; checked against breached-password list"
                checked={draft.password.complexity} onChange={(v) => !readOnly && setIn('password', 'complexity', v)} />
            </div>
          </div>
        </Card>
        <Card>
          <CardHeader icon={Timer} title="Session & dormancy" subtitle="Timeouts and automatic account hygiene" />
          <div className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-2">
            <Input label="Idle timeout (minutes)" {...num('session', 'idleMinutes')} />
            <Input label="Absolute session (hours)" {...num('session', 'absoluteHours')} />
            <Input label="Dormant auto-disable (days)" type="number" value={draft.dormantDays} disabled={readOnly} error={errors.dormantDays}
              onChange={(e) => setDraft({ ...draft, dormantDays: Number(e.target.value) })} hint="Accounts without sign-in are disabled; reactivation needs approval" />
            <Input label="Recertification cycle (months)" type="number" value={draft.recertMonths} disabled={readOnly} error={errors.recertMonths}
              onChange={(e) => setDraft({ ...draft, recertMonths: Number(e.target.value) })} />
            <div className="flex items-start gap-2 rounded-lg bg-slate-50 p-3 text-xs text-slate-600 sm:col-span-2">
              <UserX className="mt-0.5 h-4 w-4 shrink-0 text-slate-500" aria-hidden="true" />
              Nightly job IAM-DORMANT runs at 01:00 and disables accounts idle for more than {draft.dormantDays} days; 2 accounts were disabled in September 2026.
            </div>
          </div>
        </Card>
      </div>

      <IpAllowList value={draft.ipAllow} onChange={(ipAllow) => setDraft({ ...draft, ipAllow })} disabled={readOnly} />

      <AbacRules rules={abac} readOnly={!can('create')} maker={user?.name} checkerRole={checkerRole} onAdd={addAbac} />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <RecertCampaign months={draft.recertMonths} />
        <PendingApprovals moduleLabel="Users, roles & access" title="Pending IAM approvals" />
      </div>
    </div>
  );
}
