import { useMemo, useState } from 'react';
import clsx from 'clsx';
import { BellRing, CheckCircle2, Clock, Download, Megaphone, Plus } from 'lucide-react';
import { Alert, Badge, Button, Card, CardBody, CardHeader, DataTable, PageHeader, StatCard, useToast } from '@/components/ui';
import { AS_OF } from '@/data/kpis';
import { formatDate } from '@/lib/format';
import { useAdmin } from '../../lib/useAdmin';
import { useAdminCollection } from '../../context/AdminStore';
import { downloadCsv } from '../../lib/csv';
import { nowStamp, today } from '../../lib/time';
import { NOTICES } from '../../data/cmsExtras';
import NoticeCreateModal from './extras/NoticeCreateModal';
import { ackRows, targetLabel } from './extras/noticeUtils';

const STATUS_TONE = { Acknowledged: 'green', Read: 'blue', Unread: 'slate', Overdue: 'red' };

export default function TargetedNotices() {
  const { user, can, audit, requestApproval, store } = useAdmin('cms.notices');
  const readOnly = !can('update');
  const toast = useToast();
  const [notices, api] = useAdminCollection('cmsNotices', NOTICES);
  const [selectedId, setSelectedId] = useState(notices[0]?.id);
  const [creating, setCreating] = useState(false);
  const now = today();
  const institutions = store.institutions;

  const summary = useMemo(() => notices.map((n) => {
    const rows = ackRows(n, institutions, now);
    return { ...n, rows, total: rows.length, acked: rows.filter((r) => r.status === 'Acknowledged').length, overdue: rows.filter((r) => r.overdue).length };
  }), [notices, institutions, now]);

  const selected = summary.find((n) => n.id === selectedId) ?? summary[0];
  const sent = summary.filter((n) => n.status !== 'Awaiting approval');
  const totals = sent.reduce((s, n) => ({ total: s.total + n.total, acked: s.acked + n.acked, overdue: s.overdue + n.overdue }), { total: 0, acked: 0, overdue: 0 });

  const create = (form) => {
    const id = `TN-${2032 + notices.length}`;
    const item = { id, title: form.title, body: form.body, tiers: form.tiers, regions: form.regions, due: form.due, sentAt: '—', sentBy: user?.name, status: 'Awaiting approval', acks: {} };
    api.add(item);
    requestApproval({
      type: 'Targeted notice',
      summary: `${id} · ${form.title} → ${form.recipients} MFIs (${targetLabel(item)})`,
      checkerRole: 'adm_publisher',
      payload: {
        diff: [{ field: 'Audience', from: '—', to: `${targetLabel(item)} (${form.recipients} MFIs)` }, { field: 'Acknowledge by', from: '—', to: form.due }],
        effect: { target: 'admin', collection: 'cmsNotices', op: 'patch', id, changes: { status: 'Sent', sentAt: nowStamp() } },
      },
    });
    setSelectedId(id);
    toast(`${id} submitted — sent to MFIs once a Publisher approves`, 'success');
  };

  const remind = () => {
    const pending = selected.rows.filter((r) => r.status !== 'Acknowledged');
    api.patch(selected.id, { lastReminder: nowStamp(), reminders: (selected.reminders ?? 0) + 1 });
    audit('NOTICE_REMINDER_SENT', `${selected.id} → ${pending.length} MFIs`, { purpose: pending.map((r) => r.short).join(', ') });
    toast(`Reminder sent to ${pending.length} MFI${pending.length === 1 ? '' : 's'} (portal inbox + email)`, 'success');
  };

  const exportReport = () => {
    downloadCsv(`${selected.id}-acknowledgements.csv`, selected.rows, [
      { key: 'mfi', header: 'MFI' }, { key: 'tier', header: 'Tier' }, { key: 'region', header: 'Region' },
      { key: 'readAt', header: 'Read at' }, { key: 'by', header: 'Acknowledged by' }, { key: 'ackAt', header: 'Acknowledged at' }, { key: 'status', header: 'Status' },
    ]);
    audit('NOTICE_ACK_REPORT_EXPORT', selected.id);
  };

  const columns = [
    { key: 'mfi', header: 'MFI', sortable: true, render: (r) => <div><p className={clsx('font-medium', r.overdue ? 'text-red-700' : 'text-slate-900')}>{r.mfi}</p><p className="text-xs text-slate-500">{r.tier} · {r.region}</p></div> },
    { key: 'readAt', header: 'Read at', sortable: true },
    { key: 'by', header: 'Acknowledged by' },
    { key: 'ackAt', header: 'Acknowledged at', sortable: true },
    { key: 'status', header: 'Status', sortable: true, render: (r) => <Badge tone={STATUS_TONE[r.status]}>{r.status}</Badge> },
  ];

  const pct = selected && selected.total ? Math.round((selected.acked / selected.total) * 100) : 0;
  const awaiting = selected?.status === 'Awaiting approval';

  return (
    <div className="space-y-6">
      <PageHeader
        title="Targeted notices"
        subtitle="Notices to MFI groups by tier and region, with mandatory read receipt and acknowledgement tracking."
        actions={<Button icon={Plus} disabled={!can('create')} onClick={() => setCreating(true)}>New notice</Button>}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Notices sent" value={sent.length} icon={Megaphone} definition="Targeted notices approved and delivered to MFI portal inboxes." asOf={AS_OF} />
        <StatCard label="Acknowledgement rate" value={`${totals.total ? Math.round((totals.acked / totals.total) * 100) : 0}%`} icon={CheckCircle2} tone="green" definition="Acknowledged recipients ÷ all targeted recipients, across sent notices." asOf={AS_OF} />
        <StatCard label="Overdue acknowledgements" value={totals.overdue} icon={Clock} tone="red" definition="Recipients who have not acknowledged by the notice due date." asOf={AS_OF} />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <Card>
          <CardHeader icon={Megaphone} title="Notices" subtitle="Select a notice to see its acknowledgement report" />
          <ul className="divide-y divide-slate-100">
            {summary.map((n) => (
              <li key={n.id}>
                <button
                  type="button"
                  onClick={() => setSelectedId(n.id)}
                  aria-current={selected?.id === n.id}
                  className={clsx('w-full px-5 py-3.5 text-left transition hover:bg-slate-50', selected?.id === n.id && 'bg-primary-50/60 ring-1 ring-inset ring-primary-200')}
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-medium text-slate-900">{n.title}</p>
                    {n.status === 'Awaiting approval' ? <Badge tone="amber">Awaiting approval</Badge> : <Badge tone={n.overdue ? 'red' : 'green'}>{n.acked}/{n.total}</Badge>}
                  </div>
                  <p className="mt-1 text-xs text-slate-500">{n.id} · {targetLabel(n)} · due {formatDate(n.due)}</p>
                </button>
              </li>
            ))}
          </ul>
        </Card>

        {selected && (
          <Card className="xl:col-span-2">
            <CardHeader
              icon={BellRing}
              title={selected.title}
              subtitle={`${selected.id} · ${targetLabel(selected)} · sent ${selected.sentAt} by ${selected.sentBy}`}
              action={(
                <div className="flex flex-col items-end gap-2 sm:flex-row">
                  <Button size="sm" variant="outline" icon={Download} disabled={!can('export')} onClick={exportReport}>CSV</Button>
                  <Button size="sm" variant="warm" icon={BellRing} disabled={readOnly || awaiting || selected.acked === selected.total} onClick={remind}>Send reminder</Button>
                </div>
              )}
            />
            <CardBody className="space-y-4">
              <p className="text-sm text-slate-700">{selected.body}</p>
              {awaiting && <Alert tone="warning">This notice is waiting for Publisher approval and has not been delivered yet.</Alert>}
              <div>
                <div className="mb-1.5 flex items-center justify-between text-xs">
                  <span className="font-medium text-slate-700">{selected.acked} of {selected.total} MFIs acknowledged</span>
                  <span className="text-slate-500">Due {formatDate(selected.due)}{selected.lastReminder && ` · last reminder ${selected.lastReminder}`}</span>
                </div>
                <div className="h-2.5 overflow-hidden rounded-full bg-slate-100" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct} aria-label="Acknowledgement progress">
                  <div className={clsx('h-full rounded-full', selected.overdue ? 'bg-warm' : 'bg-teal-600')} style={{ width: `${pct}%` }} />
                </div>
                {selected.overdue > 0 && <p className="mt-1.5 text-xs font-medium text-red-600">{selected.overdue} MFI{selected.overdue === 1 ? '' : 's'} overdue — highlighted below.</p>}
              </div>
            </CardBody>
            <div className="border-t border-slate-100 [&_tr:has(.bg-red-50)]:bg-red-50/60">
              <DataTable columns={columns} rows={selected.rows} searchKeys={['mfi', 'region', 'status']} dense pageSize={8} />
            </div>
          </Card>
        )}
      </div>

      <NoticeCreateModal open={creating} onClose={() => setCreating(false)} onSubmit={create} institutions={institutions} maker={user?.name} minDue={now} />
    </div>
  );
}
