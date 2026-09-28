import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FolderPlus } from 'lucide-react';
import { useStore } from '@/context/StoreContext';
import { formatDate } from '@/lib/format';
import { usePermissions } from '@/lib/rbac';
import { ScopeChip } from '@/portals/government/components/FeatureGuard';
import { useRegionScope } from '@/portals/government/lib/access';
import { Alert, Badge, Button, Card, DataTable, Input, Modal, PageHeader, Select, StatCard, Tabs, Textarea } from '@/components/ui';
import { MfiLink, SeverityBadge, SlaChip, slaState, useInstitutionMap } from '../../components/common';
import { useRegulator } from '../../lib/RegulatorStore';
import useCaseActions from '../../lib/useCaseActions';
import { CASE_STAGES } from '../../lib/util';

function NewCaseModal({ open, onClose }) {
  const { institutions: all } = useStore();
  const { filterByRegion } = useRegionScope();
  const institutions = filterByRegion(all);
  const { openCase } = useCaseActions();
  const navigate = useNavigate();
  const [f, setF] = useState({ title: '', mfiId: '', severity: 'Medium', source: 'Examination', sourceRef: '', summary: '' });
  const [err, setErr] = useState('');
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const submit = () => {
    if (!f.title.trim() || !f.mfiId) return setErr('Title and institution are required.');
    const id = openCase({ ...f, sourceRef: f.sourceRef || 'Manual' });
    onClose();
    navigate(`/gov/cases/${id}`);
  };
  return (
    <Modal open={open} onClose={onClose} title="Open supervisory case" footer={<><Button variant="outline" onClick={onClose}>Cancel</Button><Button onClick={submit}>Open case</Button></>}>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Input className="sm:col-span-2" label="Title" required value={f.title} onChange={set('title')} />
        <Select label="Institution" required value={f.mfiId} onChange={set('mfiId')} placeholder="Select…" options={institutions.map((i) => ({ value: i.id, label: `${i.short} — ${i.name}` }))} />
        <Select label="Severity" value={f.severity} onChange={set('severity')} options={['Critical', 'High', 'Medium', 'Low']} />
        <Select label="Origin" value={f.source} onChange={set('source')} options={['Examination', 'Complaint', 'EWS alert', 'Dispute', 'Referral']} />
        <Input label="Origin reference" value={f.sourceRef} onChange={set('sourceRef')} placeholder="e.g. GRV-2026-1102" />
        <Textarea className="sm:col-span-2" label="Summary" rows={3} value={f.summary} onChange={set('summary')} />
        {err && <Alert tone="danger" className="sm:col-span-2">{err}</Alert>}
      </div>
    </Modal>
  );
}

export default function Cases() {
  const { cases: allCases } = useRegulator();
  const { filterByMfi } = useRegionScope();
  const cases = filterByMfi(allCases);
  const { can } = usePermissions('gov');
  const insts = useInstitutionMap();
  const navigate = useNavigate();
  const [tab, setTab] = useState('open');
  const [open, setOpen] = useState(false);

  const openCases = cases.filter((c) => c.stage < 5);
  const rows = (tab === 'open' ? openCases : tab === 'closed' ? cases.filter((c) => c.stage === 5) : cases).map((c) => ({ ...c, mfiName: insts[c.mfiId]?.name }));

  const columns = [
    { key: 'id', header: 'Case', sortable: true, render: (r) => <><p className="font-mono text-xs text-slate-500">{r.id}</p><p className="max-w-xs font-medium text-slate-900">{r.title}</p></> },
    { key: 'mfiId', header: 'MFI', render: (r) => <MfiLink inst={insts[r.mfiId]} id={r.mfiId} /> },
    { key: 'source', header: 'Origin', render: (r) => <><p className="text-xs">{r.source}</p><p className="font-mono text-[11px] text-slate-500">{r.sourceRef}</p></> },
    { key: 'severity', header: 'Severity', sortable: true, render: (r) => <SeverityBadge severity={r.severity} /> },
    { key: 'owner', header: 'Owner', sortable: true },
    { key: 'stage', header: 'Stage', sortable: true, render: (r) => <Badge tone={r.stage === 5 ? 'slate' : 'violet'}>{r.stage + 1}/6 · {CASE_STAGES[r.stage]}</Badge> },
    { key: 'slaDue', header: 'SLA due', sortable: true, render: (r) => <div><p className="text-xs">{formatDate(r.slaDue)}</p><SlaChip due={r.slaDue} done={r.stage === 5} /></div> },
  ];

  return (
    <div>
      <PageHeader
        title="Supervisory cases"
        subtitle="Every EWS alert, complaint cluster or examination finding is worked as a case with an owner, deadline and outcome."
        actions={<><ScopeChip />{can('gov.cases', 'create') && <Button icon={FolderPlus} onClick={() => setOpen(true)}>Open case</Button>}</>}
      />
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Open cases" value={openCases.length} tone="violet" definition="Cases not yet closed" />
        <StatCard label="SLA breached" value={openCases.filter((c) => slaState(c.slaDue).key === 'breached').length} tone="red" definition="Open cases past their SLA due date" />
        <StatCard label="Decisions awaiting approval" value={cases.filter((c) => c.decision?.status === 'Pending approval').length} tone="warm" definition="Proposed decisions pending Director approval (maker-checker)" />
        <StatCard label="Critical / high" value={openCases.filter((c) => ['Critical', 'High'].includes(c.severity)).length} tone="navy" definition="Open cases with severity Critical or High" />
      </div>
      <Card>
        <Tabs className="px-4" value={tab} onChange={setTab} tabs={[{ id: 'open', label: 'Open', count: openCases.length }, { id: 'closed', label: 'Closed', count: cases.length - openCases.length }, { id: 'all', label: 'All', count: cases.length }]} />
        <DataTable columns={columns} rows={rows} searchKeys={['id', 'title', 'mfiName', 'owner', 'sourceRef']} onRowClick={(r) => navigate(`/gov/cases/${r.id}`)} />
      </Card>
      <NewCaseModal open={open} onClose={() => setOpen(false)} />
    </div>
  );
}
