import { useState } from 'react';
import { CheckCircle2, UserPlus } from 'lucide-react';
import { Badge, Button, Card, DataTable, Modal, Select, useToast } from '@/components/ui';
import { slaDaysLeft } from '@/lib/format';
import { useAdminCollection } from '../../../context/AdminStore';
import { DPO_STAFF, DSR_TYPES, DSRS } from '../../../data/compliance';

const maskName = (n) => n.split(' ').map((w, i) => (i === 0 ? w : `${w[0]}•••`)).join(' ');

function SlaCell({ row }) {
  if (row.status === 'Completed') return <Badge tone="slate">Closed</Badge>;
  const d = slaDaysLeft(row.due);
  const tone = d < 0 ? 'red' : d <= 5 ? 'amber' : 'green';
  return <Badge tone={tone}>{d < 0 ? `${-d} d overdue` : `${d} d left`}</Badge>;
}

/** Data subject request queue (ADM-14, R12): 30-day statutory SLA. */
export default function DsrTab({ readOnly, piiUnmasked, nrc, audit }) {
  const toast = useToast();
  const [dsrs, api] = useAdminCollection('dsrs', DSRS);
  const [type, setType] = useState('');
  const [assigning, setAssigning] = useState(null);
  const [assignee, setAssignee] = useState(DPO_STAFF[0]);

  const withStatus = dsrs.map((r) => ({ ...r, days: slaDaysLeft(r.due), status: r.status !== 'Completed' && slaDaysLeft(r.due) < 0 ? 'Overdue' : r.status }));
  const rows = withStatus.filter((r) => !type || r.type === type);
  const open = withStatus.filter((r) => r.status !== 'Completed');

  const assign = () => {
    api.patch(assigning.id, { assignee, status: assigning.status === 'New' ? 'In progress' : assigning.status });
    audit('DSR_ASSIGNED', `${assigning.id} → ${assignee}`);
    toast(`${assigning.id} assigned to ${assignee}`, 'success');
    setAssigning(null);
  };
  const complete = (r) => {
    api.patch(r.id, { status: 'Completed', completedAt: new Date().toISOString().slice(0, 10) });
    audit('DSR_COMPLETED', `${r.id} · ${r.type}`, { purpose: 'Data subject request' });
    toast(`${r.id} completed — response letter queued`, 'success');
  };

  const columns = [
    { key: 'id', header: 'Request', sortable: true, render: (r) => <div><p className="font-mono text-xs font-semibold text-primary">{r.id}</p><p className="text-[11px] text-slate-500">{r.channel}</p></div> },
    { key: 'type', header: 'Type', sortable: true, render: (r) => <Badge tone="navy">{r.type}</Badge> },
    { key: 'borrower', header: 'Data subject', render: (r) => <div><p className="text-sm">{piiUnmasked ? r.borrower : maskName(r.borrower)}</p><p className="font-mono text-[11px] text-slate-500">{nrc(r.nrc)}</p></div> },
    { key: 'received', header: 'Received', sortable: true, className: 'whitespace-nowrap text-xs' },
    { key: 'due', header: 'Due (30 d)', sortable: true, className: 'whitespace-nowrap text-xs' },
    { key: 'days', header: 'SLA', sortable: true, render: (r) => <SlaCell row={r} /> },
    { key: 'status', header: 'Status', render: (r) => <Badge status={r.status} /> },
    { key: 'assignee', header: 'Assignee', className: 'text-xs', render: (r) => r.assignee ?? <span className="text-slate-500">Unassigned</span> },
    {
      key: 'actions', header: <span className="relative"><span className="sr-only">Actions</span></span>, render: (r) => (r.status === 'Completed' ? null : (
        <div className="flex gap-1.5">
          <Button size="sm" variant="outline" icon={UserPlus} disabled={readOnly} onClick={() => { setAssigning(r); setAssignee(r.assignee ?? DPO_STAFF[0]); }}>Assign</Button>
          <Button size="sm" variant="success" icon={CheckCircle2} disabled={readOnly || !r.assignee} onClick={() => complete(r)}>Complete</Button>
        </div>
      )),
    },
  ];

  return (
    <Card>
      <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-end sm:justify-between">
        <Select label="Request type" value={type} onChange={(e) => setType(e.target.value)} options={DSR_TYPES} placeholder="All types" className="sm:w-56" />
        <p className="flex flex-wrap gap-2 text-xs text-slate-600">
          <Badge tone="blue">{open.length} open</Badge>
          <Badge tone="amber">{open.filter((r) => r.days >= 0 && r.days <= 5).length} due ≤ 5 d</Badge>
          <Badge tone="red">{open.filter((r) => r.days < 0).length} overdue</Badge>
        </p>
      </div>
      <DataTable columns={columns} rows={rows} pageSize={10} />
      {!piiUnmasked && <p className="border-t border-slate-100 px-4 py-2 text-[11px] text-slate-500">Names and NRCs are masked for your role.</p>}
      <Modal open={!!assigning} onClose={() => setAssigning(null)} title={`Assign ${assigning?.id ?? ''}`} subtitle={assigning ? `${assigning.type} request · due ${assigning.due}` : ''} size="sm"
        footer={<><Button variant="ghost" onClick={() => setAssigning(null)}>Cancel</Button><Button onClick={assign}>Assign</Button></>}>
        <Select label="Assign to" value={assignee} onChange={(e) => setAssignee(e.target.value)} options={DPO_STAFF} />
      </Modal>
    </Card>
  );
}
