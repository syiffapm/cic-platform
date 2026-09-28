import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FolderPlus } from 'lucide-react';
import { useSession } from '@/context/AuthContext';
import { useStore } from '@/context/StoreContext';
import { formatDate, maskPhone } from '@/lib/format';
import { usePermissions } from '@/lib/rbac';
import { ScopeChip } from '@/portals/government/components/FeatureGuard';
import { useRegionScope } from '@/portals/government/lib/access';
import { Alert, Badge, Button, Card, DataTable, Modal, PageHeader, Select, Tabs, useToast } from '@/components/ui';
import { DefList, MfiLink, SlaChip, useInstitutionMap } from '../../components/common';
import useCaseActions from '../../lib/useCaseActions';
import { useRegulator } from '../../lib/RegulatorStore';
import { CASE_OWNERS } from '../../data/cases';

const STATUSES = ['Open', 'Investigating', 'Awaiting MFI', 'Escalated', 'Resolved', 'Closed'];
const DONE = ['Resolved', 'Closed'];

export default function Complaints() {
  const user = useSession('gov');
  const { can } = usePermissions('gov');
  const canUpdate = can('gov.complaints', 'update');
  const { filterByMfi } = useRegionScope();
  const { grievances: allGrievances, patch, logAudit } = useStore();
  const grievances = filterByMfi(allGrievances);
  const { cases } = useRegulator();
  const { openCase } = useCaseActions();
  const insts = useInstitutionMap();
  const navigate = useNavigate();
  const toast = useToast();
  const [cat, setCat] = useState('all');
  const [sel, setSel] = useState(null);

  const categories = useMemo(() => [...new Set(grievances.map((g) => g.category))], [grievances]);
  const rows = (cat === 'all' ? grievances : grievances.filter((g) => g.category === cat)).map((g) => ({ ...g, mfiName: insts[g.mfiId]?.name ?? '', linkedCase: cases.find((c) => c.sourceRef === g.id)?.id }));
  const current = sel && grievances.find((g) => g.id === sel);

  const update = (g, changes, action) => {
    patch('grievances', g.id, changes);
    logAudit({ actor: user.name, role: user.role, tenant: 'CBM', action, module: 'Consumer Protection', target: `${g.id}: ${JSON.stringify(changes)}`, outcome: 'Success' });
    toast(`${g.id} updated`, 'success');
  };

  const toCase = (g) => {
    const id = openCase({ title: `Complaint — ${g.subject}`, mfiId: g.mfiId, source: 'Complaint', sourceRef: g.id, severity: 'Medium', summary: g.description ?? g.subject });
    patch('grievances', g.id, { status: g.status === 'Open' ? 'Investigating' : g.status });
    navigate(`/gov/cases/${id}`);
  };

  const columns = [
    { key: 'id', header: 'Complaint', sortable: true, render: (r) => <><p className="font-mono text-xs text-slate-700">{r.id}</p><p className="max-w-xs text-sm font-medium text-slate-900">{r.subject}</p></> },
    { key: 'category', header: 'Category', sortable: true, render: (r) => <Badge tone={r.category === 'Unlicensed lender' ? 'red' : r.category === 'MFI conduct' ? 'violet' : 'slate'}>{r.category}</Badge> },
    { key: 'mfiName', header: 'Linked MFI', render: (r) => (r.mfiId ? <MfiLink inst={insts[r.mfiId]} id={r.mfiId} /> : <span className="text-xs text-slate-500">Not linked</span>) },
    { key: 'channel', header: 'Channel', sortable: true, render: (r) => <span className="text-xs">{r.channel}<br /><span className="text-slate-500">{formatDate(r.createdAt)}</span></span> },
    { key: 'assignee', header: 'Assignee', sortable: true, render: (r) => r.assignee ?? <Badge tone="amber">Unassigned</Badge> },
    { key: 'status', header: 'Status', sortable: true, render: (r) => <Badge status={r.status}>{r.status}</Badge> },
    { key: 'sla', header: 'SLA', sortable: true, render: (r) => <SlaChip due={r.sla} done={DONE.includes(r.status)} /> },
  ];

  return (
    <div>
      <PageHeader
        title="Complaint register"
        subtitle="Complaints from the Public Portal grievance form, hotline and walk-in channels — categorised, linked to the MFI and worked to closure."
        actions={<ScopeChip />}
      />
      <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {categories.map((c) => {
          const list = grievances.filter((g) => g.category === c);
          return (
            <button key={c} type="button" onClick={() => setCat(c)} className="rounded-xl border border-slate-200 bg-white p-4 text-left shadow-sm hover:border-primary-300">
              <p className="text-xs font-medium text-slate-500">{c}</p>
              <p className="mt-1 text-2xl font-bold text-slate-900">{list.length}</p>
              <p className="text-[11px] text-slate-500">{list.filter((g) => !DONE.includes(g.status)).length} open</p>
            </button>
          );
        })}
      </div>
      <Card>
        <Tabs className="px-4" value={cat} onChange={setCat} tabs={[{ id: 'all', label: 'All', count: grievances.length }, ...categories.map((c) => ({ id: c, label: c, count: grievances.filter((g) => g.category === c).length }))]} />
        <DataTable columns={columns} rows={rows} searchKeys={['id', 'subject', 'mfiName', 'assignee']} onRowClick={(r) => setSel(r.id)} />
      </Card>

      <Modal open={!!current} onClose={() => setSel(null)} size="lg" title={current ? `${current.id} · ${current.category}` : ''} subtitle={current ? `${current.channel} · received ${formatDate(current.createdAt)} · SLA ${formatDate(current.sla)}` : ''}>
        {current && (
          <div className="space-y-4">
            <p className="rounded-lg bg-slate-50 p-3 text-sm text-slate-700">{current.description ?? current.subject}</p>
            <DefList items={[
              ['Linked MFI', current.mfiId ? insts[current.mfiId]?.name : 'Not linked'],
              ['Contact', [current.contactEmail && current.contactEmail.replace(/^(.).*(@.*)$/, '$1•••$2'), current.contactPhone && maskPhone(current.contactPhone)].filter(Boolean).join(' · ') || 'Anonymous'],
            ]} />
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <Select label="Link to MFI" value={current.mfiId ?? ''} disabled={!canUpdate} onChange={(e) => update(current, { mfiId: e.target.value || null }, 'COMPLAINT_LINK_MFI')} placeholder="Not linked" options={Object.values(insts).map((i) => ({ value: i.id, label: i.short }))} />
              <Select label="Assignee" value={current.assignee ?? ''} disabled={!canUpdate} onChange={(e) => update(current, { assignee: e.target.value || null }, 'COMPLAINT_ASSIGN')} placeholder="Unassigned" options={[...new Set([...CASE_OWNERS, ...(current.assignee ? [current.assignee] : [])])]} />
              <Select label="Status" value={current.status} disabled={!canUpdate} onChange={(e) => update(current, { status: e.target.value }, 'COMPLAINT_STATUS')} options={[...new Set([...STATUSES, current.status])]} />
            </div>
            {cases.find((c) => c.sourceRef === current.id)
              ? <Alert tone="info" title="Linked case">This complaint is worked under {cases.find((c) => c.sourceRef === current.id).id}.</Alert>
              : current.mfiId && can('gov.cases', 'create') && <Button icon={FolderPlus} variant="outline" onClick={() => toCase(current)}>Open supervisory case</Button>}
          </div>
        )}
      </Modal>
    </div>
  );
}
