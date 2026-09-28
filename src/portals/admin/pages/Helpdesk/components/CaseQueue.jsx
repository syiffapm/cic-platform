import clsx from 'clsx';
import { useState } from 'react';
import { Badge, Card, DataTable, Tabs } from '@/components/ui';
import { useAdmin } from '../../../lib/useAdmin';
import { ASSIGNEES } from '../../../data/helpdesk';

const TYPE_TONE = { Dispute: 'navy', 'Identity verification': 'teal', Grievance: 'amber' };

export function SlaCell({ c }) {
  if (!c.open) return <span className="text-xs text-slate-500">—</span>;
  if (c.breached) return <span className="whitespace-nowrap text-xs font-semibold text-red-700">Breached {Math.abs(c.days)}d</span>;
  return <span className={clsx('whitespace-nowrap text-xs font-medium', c.days <= 2 ? 'text-amber-700' : 'text-slate-700')}>{c.days}d left</span>;
}

/** Unified case table with type filter, assignment and SLA timers. */
export default function CaseQueue({ cases, selectedId, onSelect, onAssign }) {
  const { nrc, phone, readOnly, audit } = useAdmin('helpdesk');
  const [tab, setTab] = useState('all');

  const filters = {
    all: () => true,
    cic: (c) => c.status === 'Pending CIC approval',
    dispute: (c) => c.kind === 'dispute',
    idv: (c) => c.kind === 'idv',
    grievance: (c) => c.kind === 'grievance',
    breached: (c) => c.breached,
  };
  const rows = cases.filter(filters[tab]).sort((a, b) => Number(b.status === 'Pending CIC approval') - Number(a.status === 'Pending CIC approval') || Number(b.open) - Number(a.open) || (a.days ?? 999) - (b.days ?? 999));
  const count = (k) => cases.filter(filters[k]).length;

  const assign = (c, name) => {
    onAssign(c.id, name);
    audit('CASE_ASSIGNED', `${c.id} → ${name}`);
  };

  const columns = [
    {
      key: 'id', header: 'Case',
      render: (c) => (
        <div className="whitespace-nowrap">
          <span className="font-mono text-xs font-semibold text-slate-800">{c.id}</span>
          {c.id === selectedId && <span className="ml-1.5 text-[11px] font-semibold uppercase text-amber-700">Viewing</span>}
          <span className="mt-0.5 block"><Badge tone={TYPE_TONE[c.type]}>{c.type}</Badge></span>
        </div>
      ),
    },
    { key: 'subject', header: 'Subject', render: (c) => <span className="line-clamp-2 min-w-[12rem] text-xs text-slate-700">{c.subject}{c.mfi && <span className="text-slate-500"> · {c.mfi}</span>}</span> },
    {
      key: 'borrower', header: 'Borrower',
      render: (c) => (
        <div className="whitespace-nowrap text-xs">
          <span className="font-medium text-slate-800">{c.borrowerName}</span>
          {c.pii && <span className="block font-mono text-[11px] text-slate-500">{nrc(c.pii.nrc)} · {phone(c.pii.phone)}</span>}
        </div>
      ),
    },
    { key: 'channel', header: 'Channel', render: (c) => <span className="whitespace-nowrap text-xs">{c.channel}</span> },
    {
      key: 'assignee', header: 'Assignee',
      render: (c) => (
        <select
          aria-label={`Assignee for ${c.id}`}
          value={c.assignee}
          disabled={readOnly || !c.open}
          onClick={(e) => e.stopPropagation()}
          onChange={(e) => assign(c, e.target.value)}
          className="h-8 rounded-md border border-slate-200 bg-white px-2 text-xs disabled:bg-slate-50"
        >
          {[...new Set([c.assignee, ...ASSIGNEES])].map((a) => <option key={a}>{a}</option>)}
        </select>
      ),
    },
    { key: 'days', header: 'SLA', sortable: true, render: (c) => <SlaCell c={c} /> },
    { key: 'status', header: 'Status', render: (c) => <Badge status={c.status} tone={c.status === 'Pending CIC approval' ? 'violet' : undefined} /> },
  ];

  return (
    <Card>
      <Tabs
        className="px-3"
        value={tab}
        onChange={setTab}
        tabs={[
          { id: 'all', label: 'All', count: count('all') },
          { id: 'cic', label: 'Pending CIC approval', count: count('cic') },
          { id: 'dispute', label: 'Disputes', count: count('dispute') },
          { id: 'idv', label: 'ID verification', count: count('idv') },
          { id: 'grievance', label: 'Grievances', count: count('grievance') },
          { id: 'breached', label: 'SLA breached', count: count('breached') },
        ]}
      />
      <DataTable
        columns={columns}
        rows={rows}
        dense
        pageSize={8}
        searchKeys={['id', 'subject', 'borrowerName', 'assignee', 'status']}
        onRowClick={(r) => onSelect(r.id)}
      />
    </Card>
  );
}
