import { useMemo, useState } from 'react';
import { Eye, Globe, LayoutGrid, Pencil } from 'lucide-react';
import { Alert, Badge, Button, Card, CardHeader, DataTable, PageHeader, Select, StatCard, useToast } from '@/components/ui';
import { SERVICES } from '@/data/services';
import { AS_OF } from '@/data/kpis';
import { useAdmin } from '../../lib/useAdmin';
import { useAdminCollection } from '../../context/AdminStore';
import PendingApprovals from '../../components/PendingApprovals';
import ServiceEditModal, { serviceStage } from './components/ServiceEditModal';
import ServiceCardPreview from './components/ServiceCardPreview';

const FIELDS = ['title.en', 'title.mm', 'summary', 'eligibility', 'fee', 'sla', 'channel', 'priority', 'showOnPublic', 'steps', 'documents'];
const get = (o, path) => {
  const v = path.split('.').reduce((x, k) => x?.[k], o);
  return Array.isArray(v) ? v.join(' | ') : String(v ?? '');
};

export default function ServiceCatalogue() {
  const { user, readOnly, store, requestApproval } = useAdmin('services');
  const toast = useToast();
  const [stored] = useAdminCollection('services', SERVICES);
  const services = useMemo(() => stored.map((s) => ({ ...s, priority: serviceStage(s.priority) })), [stored]);
  const [editing, setEditing] = useState(null);
  const [previewId, setPreviewId] = useState('S2');
  const [stage, setStage] = useState('');

  const pendingIds = useMemo(() => new Set(store.approvals
    .filter((a) => a.status === 'Pending' && a.payload?.effect?.collection === 'services')
    .map((a) => a.payload.effect.id)), [store.approvals]);

  const rows = services.filter((s) => !stage || s.priority === stage).map((s) => ({ ...s, titleEn: s.title.en, status: s.status ?? 'Published' }));
  const preview = services.find((s) => s.id === previewId) ?? services[0];

  const submit = (form) => {
    const orig = services.find((s) => s.id === form.id);
    const diff = FIELDS.map((f) => ({ field: f === 'priority' ? 'service status' : f, from: get(orig, f), to: get(form, f) })).filter((d) => d.from !== d.to);
    if (!diff.length) { toast('No changes to submit', 'info'); return; }
    const { id, ...changes } = form;
    const a = requestApproval({
      type: 'Service catalogue change', checkerRole: 'adm_publisher', summary: `Update ${id} · ${form.title.en} (${diff.length} field${diff.length > 1 ? 's' : ''})`,
      payload: { diff, effect: { target: 'admin', collection: 'services', op: 'patch', id, changes: { ...changes, updatedAt: new Date().toISOString().slice(0, 10), updatedBy: user?.name } } },
    });
    setEditing(null);
    toast(`${a.id} sent to Content Publisher`, 'success');
  };

  const columns = [
    { key: 'id', header: 'ID', sortable: true, className: 'font-mono text-xs' },
    { key: 'titleEn', header: 'Title (EN / MM)', sortable: true, render: (s) => (
      <div className="min-w-[14rem]"><p className="font-medium text-slate-800">{s.title.en}</p><p lang="my" className="text-xs leading-relaxed text-slate-500">{s.title.mm}</p></div>
    ) },
    { key: 'audience', header: 'Audience' },
    { key: 'showOnPublic', header: 'Public Portal', render: (s) => (s.showOnPublic ? <Badge tone="green">Listed</Badge> : <Badge tone="slate">Portal only</Badge>) },
    { key: 'channel', header: 'Channel', className: 'whitespace-nowrap' },
    { key: 'fee', header: 'Fee' },
    { key: 'sla', header: 'SLA', render: (s) => <span className="text-xs">{s.sla}</span> },
    { key: 'priority', header: 'Service status', sortable: true, render: (s) => <Badge tone={{ Live: 'green', Pilot: 'amber', Planned: 'slate' }[s.priority]}>{s.priority}</Badge> },
    { key: 'status', header: 'Catalogue entry', render: (s) => (
      <div className="space-y-1"><Badge status={s.status} />{pendingIds.has(s.id) && <Badge tone="violet">Change pending</Badge>}</div>
    ) },
    { key: 'actions', header: <span className="relative"><span className="sr-only">Actions</span></span>, render: (s) => (
      <div className="flex justify-end gap-1">
        <Button size="icon" variant="ghost" aria-label={`Preview ${s.id}`} onClick={() => setPreviewId(s.id)}><Eye className="h-4 w-4" /></Button>
        <Button size="sm" variant="outline" icon={Pencil} disabled={readOnly || pendingIds.has(s.id)} onClick={() => setEditing(s)}>Edit</Button>
      </div>
    ) },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Service catalogue" subtitle="All CIC services in English and Myanmar, with their operational status" />

      <Alert tone="info" title="Feeds Public service cards">
        This catalogue is the single source for the Public portal's Services page and home-page cards. Edits go live only after a Content Publisher approves them.
      </Alert>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Services published" value={services.length} icon={LayoutGrid} tone="navy" definition="Services in the catalogue with status Published (visible on the Public portal)." asOf={AS_OF} />
        <StatCard label="Live services" value={services.filter((s) => s.priority === 'Live').length} icon={Globe} tone="warm" definition={`Services in production for citizens, MFIs or the regulator. Pilot: ${services.filter((s) => s.priority === 'Pilot').length}.`} asOf={AS_OF} />
        <StatCard label="Changes awaiting publisher" value={pendingIds.size} icon={Pencil} tone="violet" definition="Pending maker-checker requests against catalogue entries." asOf={AS_OF} />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <Card>
          <CardHeader title="Services" subtitle="Click the eye icon to preview the public card" />
          <DataTable columns={columns} rows={rows} searchKeys={['id', 'titleEn', 'audience', 'channel']} pageSize={13}
            toolbar={<Select aria-label="Filter by service status" value={stage} onChange={(e) => setStage(e.target.value)} placeholder="All statuses" options={['Live', 'Pilot', 'Planned']} />} />
        </Card>
        <div className="space-y-4">
          <Card>
            <CardHeader icon={Eye} title="Public card preview" subtitle={`${preview.id} as shown on the public website`} />
            <div className="space-y-3 bg-slate-50 p-4">
              <ServiceCardPreview service={preview} lang="en" />
              <ServiceCardPreview service={preview} lang="mm" />
            </div>
          </Card>
          <PendingApprovals moduleLabel="Service catalogue" />
        </div>
      </div>

      <ServiceEditModal service={editing} onClose={() => setEditing(null)} onSubmit={submit} maker={user?.name} readOnly={readOnly} />
    </div>
  );
}
