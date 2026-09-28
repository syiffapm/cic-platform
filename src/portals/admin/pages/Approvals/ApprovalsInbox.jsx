import { useMemo, useState } from 'react';
import { CheckCircle2, Clock, Inbox, UserCheck, XCircle } from 'lucide-react';
import {
  Alert, Badge, Button, Card, CardHeader, DataTable, MakerCheckerBanner, PageHeader, Select, StatCard, Tabs, useToast,
} from '@/components/ui';
import { usePermissions } from '@/lib/rbac';
import FocusBanner, { useFocusParam } from '@/portals/government/components/FocusBanner';
import { useStore } from '@/context/StoreContext';
import { roleName } from '@/data/roles';
import DecisionModal from '../../components/DecisionModal';
import { blockReason, useApprovalDecision } from '../../lib/useApprovals';
import { today } from '../../lib/time';

const moduleName = (m) => m.replace(/^(Admin|Government) · /, '');
/** Items decided in this inbox: any request whose checker is a CIC platform role. */
const isPlatform = (a) => (a.checkerRole ?? '').startsWith('adm_') || a.module.startsWith('Admin');

/** SEC-03 checker inbox: every maker-checker request raised anywhere in the console. */
export default function ApprovalsInbox() {
  const { user, can } = usePermissions('gov');
  const canApprove = can('adm.approvals', 'approve');
  const { approvals } = useStore();
  const decide = useApprovalDecision();
  const toast = useToast();
  const [tab, setTab] = useState('pending');
  const [moduleFilter, setModuleFilter] = useState('');
  const [active, setActive] = useState(null);
  const [focus, clearFocus] = useFocusParam();

  const adminItems = useMemo(() => approvals.filter(isPlatform), [approvals]);
  const external = approvals.filter((a) => !isPlatform(a) && a.status === 'Pending');
  const pending = adminItems.filter((a) => a.status === 'Pending');
  const mine = pending.filter((a) => a.maker === user?.name);
  const actionable = pending.filter((a) => !blockReason(a, user, canApprove));
  const decided = adminItems.filter((a) => a.status !== 'Pending');
  const decidedToday = decided.filter((a) => (a.decidedAt ?? '').startsWith(today()));

  const source = { pending, actionable, mine, decided }[tab];
  const filtered = moduleFilter ? source.filter((a) => a.module === moduleFilter) : source;
  const rows = focus ? adminItems.filter((a) => a.id === focus) : filtered;
  const modules = [...new Set(adminItems.map((a) => a.module))].map((m) => ({ value: m, label: moduleName(m) }));

  const confirm = (comment) => {
    const res = decide(active.approval, active.decision, comment);
    toast(res.ok ? `${active.approval.id} ${res.status.toLowerCase()}${res.status === 'Approved' ? ' — change applied' : ''}` : res.reason, res.ok ? 'success' : 'danger');
    setActive(null);
  };

  const columns = [
    { key: 'id', header: 'Request', sortable: true, render: (a) => <span className="font-mono text-xs text-slate-600">{a.id}</span> },
    {
      key: 'summary',
      header: 'Change',
      render: (a) => (
        <div className="min-w-[260px]">
          <p className="font-medium text-slate-800">{a.summary}</p>
          <p className="text-[11px] text-slate-500">{a.type} · {moduleName(a.module)}</p>
          {a.payload?.diff?.length > 0 && (
            <p className="mt-1 text-[11px] text-slate-500">
              {a.payload.diff.slice(0, 2).map((d) => `${d.field}: ${d.from} → ${d.to}`).join(' · ')}
              {a.payload.diff.length > 2 && ` · +${a.payload.diff.length - 2} more`}
            </p>
          )}
        </div>
      ),
    },
    { key: 'maker', header: 'Maker', sortable: true, render: (a) => <div><p className="text-sm">{a.maker}</p><p className="text-[11px] text-slate-500">{roleName(a.makerRole)}</p></div> },
    { key: 'checkerRole', header: 'Checker role', render: (a) => <span className="text-xs">{roleName(a.checkerRole)}</span> },
    { key: 'createdAt', header: 'Raised', sortable: true, render: (a) => <span className="whitespace-nowrap text-xs">{a.createdAt}</span> },
  ];

  const pendingColumns = [
    ...columns,
    {
      key: 'actions',
      header: <span className="relative"><span className="sr-only">Actions</span></span>,
      render: (a) => {
        const reason = blockReason(a, user, canApprove);
        return (
          <div className="flex flex-col items-end gap-1">
            <div className="flex gap-1.5">
              <Button size="sm" variant="success" icon={CheckCircle2} disabled={!!reason} onClick={() => setActive({ approval: a, decision: 'approve' })} aria-label={`Approve ${a.id}`}>Approve</Button>
              <Button size="sm" variant="outline" icon={XCircle} disabled={!!reason} onClick={() => setActive({ approval: a, decision: 'reject' })} aria-label={`Reject ${a.id}`}>Reject</Button>
            </div>
            {reason && <span className="max-w-[220px] text-right text-[11px] text-amber-700">{reason}</span>}
          </div>
        );
      },
    },
  ];

  const decidedColumns = [
    ...columns,
    { key: 'status', header: 'Decision', render: (a) => <Badge status={a.status} /> },
    { key: 'checker', header: 'Checker', render: (a) => <div><p className="text-sm">{a.checker ?? '—'}</p><p className="text-[11px] text-slate-500">{a.decidedAt}</p></div> },
    { key: 'comment', header: 'Comment', render: (a) => <span className="text-xs text-slate-600">{a.comment || '—'}</span> },
  ];

  return (
    <>
      <PageHeader
        title="Approvals inbox"
        subtitle="Every sensitive platform change — users and roles, content publishing, rules, identity merges, master data, configuration — waits here for a second, independent approver."
        breadcrumbs={[{ label: 'Platform administration', to: '/gov/admin' }, { label: 'Approvals' }]}
      />

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Pending (platform)" value={pending.length} icon={Inbox} tone="warm" definition="Maker-checker requests raised in Content management and Platform administration and not yet decided." asOf="live" />
        <StatCard label="You can decide" value={actionable.length} icon={UserCheck} tone="navy" definition="Pending requests where you hold the checker role and are not the maker." asOf="live" />
        <StatCard label="Raised by you" value={mine.length} icon={Clock} tone="violet" definition="Your own pending requests — another user must approve them." asOf="live" />
        <StatCard label="Decided today" value={decidedToday.length} icon={CheckCircle2} tone="green" definition="Requests approved or rejected since 00:00 MMT today." asOf="live" />
      </div>

      <div className="mb-5">
        <MakerCheckerBanner
          maker={user?.name}
          note="You cannot approve a request you raised yourself, and only the named checker role (or the Super Administrator for console items) may decide. Approved changes are applied immediately and every decision is written to the hash-chained audit log."
        />
      </div>

      {!canApprove && (
        <Alert tone="info" className="mb-5" title="View only">Your role can review all requests and decisions but cannot approve or reject.</Alert>
      )}

      <Card>
        <div className="px-4 pt-3">
          <FocusBanner id={focus} onClear={clearFocus} className="mb-3" />
          <Tabs
            value={tab}
            onChange={setTab}
            tabs={[
              { id: 'pending', label: 'All pending', count: pending.length },
              { id: 'actionable', label: 'Awaiting me', count: actionable.length },
              { id: 'mine', label: 'Raised by me', count: mine.length },
              { id: 'decided', label: 'History', count: decided.length },
            ]}
          />
        </div>
        <DataTable
          columns={tab === 'decided' && !focus ? decidedColumns : pendingColumns}
          rows={rows}
          searchKeys={['id', 'summary', 'type', 'maker', 'module']}
          emptyTitle={tab === 'actionable' ? 'Nothing is waiting for your decision' : 'No requests'}
          toolbar={(
            <Select
              aria-label="Filter by module"
              className="w-56"
              value={moduleFilter}
              onChange={(e) => setModuleFilter(e.target.value)}
              placeholder="All modules"
              options={modules}
            />
          )}
        />
      </Card>

      {external.length > 0 && (
        <Card className="mt-6">
          <CardHeader title="Requests decided in Supervision" subtitle="Shown for oversight only — e.g. licence status changes are approved by the Director (Central Bank)." />
          <ul className="divide-y divide-slate-100">
            {external.map((a) => (
              <li key={a.id} className="flex flex-col gap-1 px-5 py-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-800">{a.summary}</p>
                  <p className="text-[11px] text-slate-500">{a.id} · {a.module} · maker {a.maker} · checker {roleName(a.checkerRole)}</p>
                </div>
                <Badge status="Pending" />
              </li>
            ))}
          </ul>
        </Card>
      )}

      <DecisionModal approval={active?.approval} decision={active?.decision} onClose={() => setActive(null)} onConfirm={confirm} />
    </>
  );
}
