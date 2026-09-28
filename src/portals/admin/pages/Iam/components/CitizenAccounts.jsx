import { useMemo, useState } from 'react';
import { Fingerprint, Lock, UserCheck, Users } from 'lucide-react';
import { Badge, Button, Card, CardHeader, DataTable, Select, StatCard, useToast } from '@/components/ui';
import { ACCOUNTS as SEED_ACCOUNTS } from '@/data/seed';
import { roleName } from '@/data/roles';
import { formatNumber, maskNrc, maskPhone } from '@/lib/format';
import { useAdmin } from '../../../lib/useAdmin';
import { useAdminCollection } from '../../../context/AdminStore';
import { CITIZEN_ACCOUNT_SEED, CITIZEN_AS_OF, CITIZEN_OPS } from '../../../data/citizens';

const STATUS_TONE = { Active: 'green', Locked: 'red', 'Pending verification': 'amber' };
const STATUSES = ['Active', 'Locked', 'Pending verification'];

/** Borrower portal (citizen realm) accounts: masked identifiers, unlock and MFA reset via maker-checker. */
export default function CitizenAccounts() {
  const { user, role, readOnly, store, requestApproval } = useAdmin('iam');
  const toast = useToast();
  const [extra] = useAdminCollection('citizenAccounts', CITIZEN_ACCOUNT_SEED);
  const [status, setStatus] = useState('');
  const checkerRole = role === 'adm_security' ? 'adm_super' : 'adm_security';

  const all = useMemo(() => [
    ...(store.accounts ?? []).map((a) => ({ lastLogin: '—', mfa: 'SMS OTP', failedLogins: 0, ...a, source: 'store' })),
    ...extra.map((a) => ({ ...a, source: 'admin' })),
  ], [store.accounts, extra]);

  const pendingIds = useMemo(() => new Set(store.approvals
    .filter((a) => a.status === 'Pending' && a.payload?.effect?.collection && ['accounts', 'citizenAccounts'].includes(a.payload.effect.collection))
    .map((a) => a.payload.effect.id)), [store.approvals]);

  const rows = all.filter((a) => !status || a.status === status)
    .map((a) => ({ ...a, nrcMasked: maskNrc(a.nrc), phoneMasked: maskPhone(a.phone) }));

  const effect = (a, changes) => ({ target: a.source, collection: a.source === 'store' ? 'accounts' : 'citizenAccounts', op: 'patch', id: a.id, changes });

  const request = (a, type, summary, diff, changes) => {
    const ap = requestApproval({ type, checkerRole, summary, payload: { diff, effect: effect(a, changes) } });
    toast(`${ap.id} sent to ${roleName(checkerRole)} for approval`, 'success');
  };

  const unlock = (a) => request(a, 'Citizen account unlock', `Unlock citizen account ${a.id} (${maskNrc(a.nrc)})`,
    [{ field: 'Status', from: a.status, to: 'Active' }, { field: 'Failed sign-ins', from: String(a.failedLogins), to: '0' }],
    { status: 'Active', failedLogins: 0 });

  const resetMfa = (a) => request(a, 'Citizen MFA reset', `Reset second factor for citizen account ${a.id} (${maskNrc(a.nrc)})`,
    [{ field: 'Second factor', from: a.mfa, to: 'Re-enrol at next sign-in (OTP to phone on record)' }],
    { mfa: 'Re-enrol at next sign-in' });

  const columns = [
    { key: 'id', header: 'Account', sortable: true, render: (a) => (
      <div><p className="whitespace-nowrap font-mono text-xs font-semibold text-slate-800">{a.id}</p><p className="whitespace-nowrap text-[11px] text-slate-500">{a.borrowerId}</p></div>
    ) },
    { key: 'nrcMasked', header: 'NRC', render: (a) => <span className="font-mono text-xs">{a.nrcMasked}</span> },
    { key: 'phoneMasked', header: 'Phone', render: (a) => <span className="font-mono text-xs">{a.phoneMasked}</span> },
    { key: 'township', header: 'Township', render: (a) => <span className="text-xs">{a.township}{a.region ? `, ${a.region}` : ''}</span> },
    { key: 'verifiedVia', header: 'Verification', render: (a) => <span className="text-xs text-slate-600">{a.verifiedVia}</span> },
    { key: 'lastLogin', header: 'Last sign-in', sortable: true, className: 'whitespace-nowrap text-xs' },
    { key: 'status', header: 'Status', sortable: true, render: (a) => (
      <div className="space-y-1">
        <Badge tone={STATUS_TONE[a.status] ?? 'slate'}>{a.status}</Badge>
        {pendingIds.has(a.id) && <Badge tone="violet">Change pending</Badge>}
        {a.mfa?.startsWith('Re-enrol') && <p className="text-[11px] text-slate-500">MFA reset — re-enrol at next sign-in</p>}
      </div>
    ) },
    { key: 'actions', header: <span className="relative"><span className="sr-only">Actions</span></span>, render: (a) => (
      <div className="flex justify-end gap-1.5 whitespace-nowrap">
        {a.status === 'Locked' && <Button size="sm" variant="teal" disabled={readOnly || pendingIds.has(a.id)} onClick={() => unlock(a)} aria-label={`Unlock ${a.id}`}>Unlock</Button>}
        {a.status !== 'Pending verification' && <Button size="sm" variant="outline" disabled={readOnly || pendingIds.has(a.id)} onClick={() => resetMfa(a)} aria-label={`Reset MFA for ${a.id}`}>Reset MFA</Button>}
        {a.status === 'Pending verification' && <span className="text-[11px] text-slate-500">Awaiting identity check</span>}
      </div>
    ) },
  ];

  const liveNew = Math.max(0, (store.accounts?.length ?? 0) - SEED_ACCOUNTS.length);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <StatCard label={`Citizen accounts (+${formatNumber(CITIZEN_OPS.newThisWeek + liveNew)} this week)`} value={formatNumber(CITIZEN_OPS.totalAccounts + liveNew)} icon={Users} tone="navy" definition="Borrower portal accounts, verified and pending, excluding closed accounts." asOf={CITIZEN_AS_OF} />
        <StatCard label="Pending verification" value={formatNumber(CITIZEN_OPS.pendingVerification)} icon={Fingerprint} tone="warm" definition="Registrations waiting for eKYC review or a walk-in identity check." asOf={CITIZEN_AS_OF} />
        <StatCard label="Locked" value={formatNumber(CITIZEN_OPS.locked)} icon={Lock} tone="red" definition="Accounts locked after 5 failed sign-ins or OTP attempts. Unlock needs a second approver." asOf={CITIZEN_AS_OF} />
        <StatCard label="Needing attention (listed)" value={all.filter((a) => a.status !== 'Active').length} icon={UserCheck} tone="violet" definition="Accounts in the list below that are locked or pending verification." asOf={CITIZEN_AS_OF} />
      </div>
      <Card>
        <CardHeader title="Citizen accounts" subtitle="Recently active and flagged accounts. NRC and phone are always masked here; full identity checks are done in the helpdesk." />
        <DataTable columns={columns} rows={rows} searchKeys={['id', 'borrowerId', 'township', 'status']} pageSize={10}
          toolbar={<Select aria-label="Filter by status" value={status} onChange={(e) => setStatus(e.target.value)} placeholder="All statuses" options={STATUSES} />} />
      </Card>
      <p className="text-[11px] text-slate-500">Requests raised by {user?.name} are approved by a {roleName(checkerRole)}. Every request and decision is written to the audit log.</p>
    </div>
  );
}
