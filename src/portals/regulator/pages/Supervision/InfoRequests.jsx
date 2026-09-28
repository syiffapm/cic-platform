import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCheck, Send } from 'lucide-react';
import { useSession } from '@/context/AuthContext';
import { useStore } from '@/context/StoreContext';
import { formatDate, slaDaysLeft } from '@/lib/format';
import { usePermissions } from '@/lib/rbac';
import { ScopeChip } from '@/portals/government/components/FeatureGuard';
import { useRegionScope } from '@/portals/government/lib/access';
import { Alert, Badge, Button, Card, DataTable, Input, Modal, PageHeader, Select, StatCard, Tabs, Textarea } from '@/components/ui';
import { MfiLink, useInstitutionMap } from '../../components/common';
import { useRegulator } from '../../lib/RegulatorStore';
import { TODAY, addDays } from '../../lib/util';

const effectiveStatus = (r) => (r.status === 'Answered' ? 'Answered' : slaDaysLeft(r.dueAt) < 0 ? 'Overdue' : 'Sent');

function CreateModal({ open, onClose }) {
  const user = useSession('gov');
  const { institutions: allInst, logAudit } = useStore();
  const { filterByRegion } = useRegionScope();
  const institutions = filterByRegion(allInst);
  const { add, infoRequests, cases } = useRegulator();
  const [f, setF] = useState({ mfiId: '', subject: '', detail: '', dueAt: addDays(TODAY, 14), caseId: '' });
  const [err, setErr] = useState('');
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const submit = () => {
    if (!f.mfiId || f.subject.trim().length < 5) return setErr('Choose an institution and describe the request.');
    if (f.dueAt < TODAY) return setErr('Due date cannot be in the past.');
    const id = `IR-2026-${120 + infoRequests.length + 1}`;
    add('infoRequests', { id, mfiId: f.mfiId, caseId: f.caseId || null, subject: f.subject.trim(), detail: f.detail.trim(), sentAt: TODAY, dueAt: f.dueAt, status: 'Sent', sentBy: user.name, answeredAt: null });
    logAudit({ actor: user.name, role: user.role, tenant: 'CBM', action: 'INFO_REQUEST_SEND', module: 'Supervision', target: `${id} / ${f.mfiId}`, outcome: 'Success' });
    setF({ mfiId: '', subject: '', detail: '', dueAt: addDays(TODAY, 14), caseId: '' });
    setErr('');
    onClose();
  };
  const mfiCases = cases.filter((c) => c.mfiId === f.mfiId && c.stage < 5);
  return (
    <Modal open={open} onClose={onClose} title="New information request" subtitle="Delivered to the MFI's compliance inbox in the MFI Member Portal" footer={<><Button variant="outline" onClick={onClose}>Cancel</Button><Button icon={Send} onClick={submit}>Send request</Button></>}>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Select label="Institution" required value={f.mfiId} onChange={set('mfiId')} placeholder="Select…" options={institutions.filter((i) => i.status !== 'Revoked').map((i) => ({ value: i.id, label: `${i.short} — ${i.name}` }))} />
        <Input label="Due date" type="date" required value={f.dueAt} min={TODAY} onChange={set('dueAt')} />
        <Input className="sm:col-span-2" label="Subject" required value={f.subject} onChange={set('subject')} />
        <Textarea className="sm:col-span-2" label="Details" rows={3} value={f.detail} onChange={set('detail')} />
        <Select className="sm:col-span-2" label="Link to case (optional)" value={f.caseId} onChange={set('caseId')} placeholder="No case" options={mfiCases.map((c) => ({ value: c.id, label: `${c.id} — ${c.title}` }))} />
        {err && <Alert tone="danger" className="sm:col-span-2">{err}</Alert>}
      </div>
    </Modal>
  );
}

export default function InfoRequests() {
  const user = useSession('gov');
  const { logAudit } = useStore();
  const { infoRequests: allRequests, patch } = useRegulator();
  const { filterByMfi } = useRegionScope();
  const infoRequests = filterByMfi(allRequests);
  const { can } = usePermissions('gov');
  const insts = useInstitutionMap();
  const [tab, setTab] = useState('all');
  const [open, setOpen] = useState(false);

  const all = useMemo(() => infoRequests.map((r) => ({ ...r, eff: effectiveStatus(r), mfiName: insts[r.mfiId]?.name })), [infoRequests, insts]);
  const rows = tab === 'all' ? all : all.filter((r) => r.eff === tab);
  const count = (s) => all.filter((r) => r.eff === s).length;

  const markAnswered = (r) => {
    patch('infoRequests', r.id, { status: 'Answered', answeredAt: TODAY });
    logAudit({ actor: user.name, role: user.role, tenant: 'CBM', action: 'INFO_REQUEST_ANSWERED', module: 'Supervision', target: r.id, outcome: 'Success' });
  };

  const columns = [
    { key: 'id', header: 'Request', sortable: true, render: (r) => <><p className="font-mono text-xs text-slate-500">{r.id}</p><p className="max-w-xs font-medium text-slate-900">{r.subject}</p></> },
    { key: 'mfiId', header: 'MFI', render: (r) => <MfiLink inst={insts[r.mfiId]} id={r.mfiId} /> },
    { key: 'caseId', header: 'Case', render: (r) => (r.caseId ? <Link to={`/gov/cases/${r.caseId}`} className="font-mono text-xs text-primary hover:underline">{r.caseId}</Link> : <span className="text-slate-500">—</span>) },
    { key: 'sentAt', header: 'Sent', sortable: true, render: (r) => <span className="text-xs">{formatDate(r.sentAt)}<br /><span className="text-slate-500">{r.sentBy}</span></span> },
    { key: 'dueAt', header: 'Due', sortable: true, render: (r) => <span className="text-xs">{formatDate(r.dueAt)}</span> },
    { key: 'eff', header: 'Status', sortable: true, render: (r) => <><Badge status={r.eff}>{r.eff}</Badge>{r.answeredAt && <p className="mt-0.5 text-[11px] text-slate-500">{formatDate(r.answeredAt)}</p>}</> },
    { key: 'act', header: <span className="relative"><span className="sr-only">Actions</span></span>, render: (r) => r.eff !== 'Answered' && can('gov.infoRequests', 'update') && <Button size="sm" variant="ghost" icon={CheckCheck} onClick={() => markAnswered(r)}>Mark answered</Button> },
  ];

  return (
    <div>
      <PageHeader
        title="Information requests"
        subtitle="Formal requests to MFIs with due dates. Overdue requests feed the MFI's compliance record and can trigger a case."
        actions={<><ScopeChip />{can('gov.infoRequests', 'create') && <Button icon={Send} onClick={() => setOpen(true)}>New request</Button>}</>}
      />
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Awaiting response" value={count('Sent')} tone="navy" definition="Sent, not answered, not yet due" />
        <StatCard label="Overdue" value={count('Overdue')} tone="red" definition="Not answered by the due date" />
        <StatCard label="Answered" value={count('Answered')} tone="green" definition="MFI response received" />
      </div>
      <Card>
        <Tabs className="px-4" value={tab} onChange={setTab} tabs={[{ id: 'all', label: 'All', count: all.length }, { id: 'Sent', label: 'Sent', count: count('Sent') }, { id: 'Overdue', label: 'Overdue', count: count('Overdue') }, { id: 'Answered', label: 'Answered', count: count('Answered') }]} />
        <DataTable columns={columns} rows={rows} searchKeys={['id', 'subject', 'mfiName', 'caseId']} />
      </Card>
      <CreateModal open={open} onClose={() => setOpen(false)} />
    </div>
  );
}
