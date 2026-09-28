import { useState } from 'react';
import { BellRing, CheckCircle2, Mail, MessageSquare, Pencil, Smartphone, XCircle } from 'lucide-react';
import { Badge, Button, Card, CardHeader, DataTable, PageHeader, Select, StatCard, Tabs, useToast } from '@/components/ui';
import { AS_OF } from '@/data/kpis';
import { useAdmin } from '../../lib/useAdmin';
import { useAdminCollection } from '../../context/AdminStore';
import PendingApprovals from '../../components/PendingApprovals';
import { CHANNELS, DELIVERY_LOG, EVENTS, OPT_OUTS, TEMPLATE_SEED } from '../../data/notifications';
import TemplateEditor, { render } from './components/TemplateEditor';
import { DeliveryLog, OptOutList, outboxToLog } from './components/DeliveryPanels';

const CHANNEL_ICON = { Email: Mail, SMS: MessageSquare, 'In-app': Smartphone };
const eventLabel = (id) => EVENTS.find((e) => e.id === id)?.label ?? id;

export default function NotificationTemplates() {
  const { user, readOnly, store, audit, requestApproval } = useAdmin('notifications');
  const toast = useToast();
  const [templates] = useAdminCollection('notificationTemplates', TEMPLATE_SEED);
  const [log, setLog] = useState(DELIVERY_LOG);
  const [tab, setTab] = useState('templates');
  const [channel, setChannel] = useState('');
  const [editing, setEditing] = useState(null);

  const pendingIds = new Set(store.approvals.filter((a) => a.status === 'Pending' && a.payload?.effect?.collection === 'notificationTemplates').map((a) => a.payload.effect.id));
  const rows = templates.filter((t) => !channel || t.channel === channel).map((t) => ({ ...t, eventLabel: eventLabel(t.event), mandatory: t.mandatory ?? EVENTS.find((e) => e.id === t.event)?.mandatory }));
  const fullLog = [...outboxToLog(store.outbox), ...log];
  const delivered = fullLog.filter((l) => l.status === 'Delivered').length;
  const failed = fullLog.filter((l) => l.status === 'Failed').length;

  const submit = (form) => {
    const diff = ['subject', 'en', 'mm'].filter((k) => (form[k] ?? '') !== (editing[k] ?? '')).map((k) => ({ field: k === 'en' ? 'Body (EN)' : k === 'mm' ? 'Body (MM)' : 'Subject', from: editing[k] ?? '—', to: form[k] }));
    const a = requestApproval({
      type: 'Notification template', checkerRole: 'adm_publisher', summary: `Update template ${form.id} · ${eventLabel(form.event)} (${form.channel})`,
      payload: { diff, effect: { target: 'admin', collection: 'notificationTemplates', op: 'patch', id: form.id, changes: { subject: form.subject, en: form.en, mm: form.mm, version: editing.version + 1, updatedAt: new Date().toISOString().slice(0, 10), updatedBy: user?.name } } },
    });
    setEditing(null);
    toast(`${a.id} sent to Content Publisher`, 'success');
  };

  const retry = (r) => {
    audit('NOTIFICATION_RETRY', `${r.id} · ${r.template}`, { outcome: 'Queued' });
    setLog((l) => l.map((x) => (x.id === r.id ? { ...x, status: 'Retrying', retries: x.retries + 1, error: 'Manual retry queued' } : x)));
    toast(`${r.id} queued for retry`, 'info');
  };

  const columns = [
    { key: 'id', header: 'ID', className: 'font-mono text-xs' },
    { key: 'eventLabel', header: 'Event', sortable: true, render: (t) => (
      <div><p className="font-medium text-slate-800">{t.eventLabel}</p>{t.mandatory && <Badge tone="red" className="mt-1">Mandatory</Badge>}</div>
    ) },
    { key: 'channel', header: 'Channel', sortable: true, render: (t) => {
      const Icon = CHANNEL_ICON[t.channel];
      return <span className="inline-flex items-center gap-1.5 text-sm"><Icon className="h-4 w-4 text-slate-500" aria-hidden="true" />{t.channel}</span>;
    } },
    { key: 'en', header: 'Preview (EN)', render: (t) => <p className="line-clamp-2 max-w-md text-xs text-slate-600">{render(t.en)}</p> },
    { key: 'version', header: 'Ver.', className: 'text-center' },
    { key: 'status', header: 'Status', render: (t) => (
      <div className="space-y-1"><Badge status={t.status} />{pendingIds.has(t.id) && <Badge tone="violet">Change pending</Badge>}</div>
    ) },
    { key: 'act', header: <span className="relative"><span className="sr-only">Actions</span></span>, render: (t) => (
      <Button size="sm" variant="outline" icon={Pencil} disabled={readOnly || pendingIds.has(t.id)} onClick={() => setEditing(t)}>Edit</Button>
    ) },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Notification templates" subtitle="Bilingual email, SMS and in-app messages with delivery monitoring and opt-outs" />

      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <StatCard label="Templates" value={templates.length} icon={BellRing} tone="navy" definition="Published EN/MM templates across email, SMS and in-app." asOf={AS_OF} />
        <StatCard label="Delivered (last 24 h)" value={delivered} icon={CheckCircle2} tone="green" definition="Messages confirmed delivered by the provider in the log window." asOf={AS_OF} />
        <StatCard label="Failed after retries" value={failed} icon={XCircle} tone="red" definition="Messages that failed after the maximum of 3 retries." asOf={AS_OF} />
        <StatCard label="Opt-outs" value={OPT_OUTS.length} icon={MessageSquare} tone="warm" definition="Recipients who opted out of at least one optional category." asOf={AS_OF} />
      </div>

      <Card>
        <Tabs className="px-4" value={tab} onChange={setTab} tabs={[
          { id: 'templates', label: 'Templates', count: templates.length },
          { id: 'log', label: 'Delivery log', count: fullLog.length },
          { id: 'optout', label: 'Opt-outs', count: OPT_OUTS.length },
        ]} />
        {tab === 'templates' && (
          <DataTable columns={columns} rows={rows} searchKeys={['id', 'eventLabel', 'en', 'mm']} pageSize={12}
            toolbar={<Select aria-label="Filter by channel" value={channel} onChange={(e) => setChannel(e.target.value)} placeholder="All channels" options={CHANNELS} />} />
        )}
        {tab === 'log' && <DeliveryLog rows={fullLog} templates={rows} readOnly={readOnly} onRetry={retry} />}
        {tab === 'optout' && <OptOutList rows={OPT_OUTS} />}
      </Card>

      <PendingApprovals moduleLabel="Notification templates" />

      <TemplateEditor template={editing} eventLabel={editing ? eventLabel(editing.event) : ''} onClose={() => setEditing(null)} onSubmit={submit} maker={user?.name} readOnly={readOnly} />
    </div>
  );
}
