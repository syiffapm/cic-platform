import { useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { Alert, Badge, Button, DataTable, Select } from '@/components/ui';
import { maskPhone } from '@/lib/format';
import { CHANNELS } from '../../../data/notifications';

/** Recipients are always masked in notification logs (PII minimisation). */
export function maskRecipient(r) {
  if (!r) return '';
  if (r.includes('@')) {
    const [local, domain] = r.split('@');
    return `${local.slice(0, 2)}•••@${domain}`;
  }
  if (r.startsWith('+')) return maskPhone(r);
  return r; // in-app: borrower / tenant id
}

const STATUS_TONE = { Delivered: 'green', Failed: 'red', Retrying: 'amber' };

const KIND_LABEL = { credentials: 'Account sign-in details', 'report-ready': 'Credit report ready', 'report-rejected': 'Credit report request rejected' };
const KIND_REF = { credentials: 'Account registration', 'report-ready': 'Report request', 'report-rejected': 'Report request' };
const pad = (n) => String(n).padStart(2, '0');
const stamp = (iso) => { const d = new Date(iso); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`; };

/** Messages sent by platform workflows (store outbox) in delivery-log shape. Message bodies are never shown. */
export const outboxToLog = (outbox = []) => outbox.map((m) => ({
  id: m.id, at: stamp(m.sentAt), recipient: m.to, channel: m.channel, template: m.requestId ?? KIND_REF[m.kind] ?? m.kind,
  templateLabel: KIND_LABEL[m.kind] ?? m.kind, status: m.status ?? 'Delivered', retries: 0,
  provider: m.channel === 'Email' ? 'SES (ap-southeast-1)' : 'MPT SMS Gateway',
}));

export function DeliveryLog({ rows, templates, readOnly, onRetry }) {
  const [channel, setChannel] = useState('');
  const [status, setStatus] = useState('');
  const data = rows.filter((r) => (!channel || r.channel === channel) && (!status || r.status === status))
    .map((r) => ({ ...r, masked: maskRecipient(r.recipient), templateLabel: r.templateLabel ?? templates.find((t) => t.id === r.template)?.eventLabel ?? r.template }));
  const columns = [
    { key: 'at', header: 'Time', sortable: true, className: 'whitespace-nowrap text-xs' },
    { key: 'masked', header: 'Recipient', render: (r) => <span className="font-mono text-xs">{r.masked}</span> },
    { key: 'channel', header: 'Channel', render: (r) => <Badge tone="navy">{r.channel}</Badge> },
    { key: 'templateLabel', header: 'Template', render: (r) => <div><p className="text-sm">{r.templateLabel}</p><p className="font-mono text-[11px] text-slate-500">{r.template}</p></div> },
    { key: 'status', header: 'Status', sortable: true, render: (r) => <div><Badge tone={STATUS_TONE[r.status]}>{r.status}</Badge>{r.error && <p className="mt-0.5 text-[11px] text-red-600">{r.error}</p>}</div> },
    { key: 'retries', header: 'Retries', sortable: true, className: 'text-center' },
    { key: 'provider', header: 'Provider', className: 'text-xs' },
    { key: 'act', header: <span className="relative"><span className="sr-only">Actions</span></span>, render: (r) => r.status === 'Failed' && (
      <Button size="sm" variant="outline" icon={RefreshCw} disabled={readOnly} onClick={() => onRetry(r)}>Retry</Button>
    ) },
  ];
  return (
    <>
      <DataTable columns={columns} rows={data} searchKeys={['masked', 'template', 'provider', 'id']} pageSize={10} dense
        toolbar={(
          <>
            <Select aria-label="Filter by channel" value={channel} onChange={(e) => setChannel(e.target.value)} placeholder="All channels" options={CHANNELS} />
            <Select aria-label="Filter by status" value={status} onChange={(e) => setStatus(e.target.value)} placeholder="All statuses" options={['Delivered', 'Retrying', 'Failed']} />
          </>
        )} />
      <p className="border-t border-slate-100 px-4 py-2.5 text-[11px] text-slate-500">Retry policy: 3 attempts with exponential back-off (1, 5, 15 min); SMS falls back to a second aggregator after 2 failures. Recipients are masked in this log.</p>
    </>
  );
}

export function OptOutList({ rows }) {
  const data = rows.map((r) => ({ ...r, masked: maskRecipient(r.recipient) }));
  const columns = [
    { key: 'masked', header: 'Recipient', render: (r) => <span className="font-mono text-xs">{r.masked}</span> },
    { key: 'channel', header: 'Channel', render: (r) => <Badge tone="navy">{r.channel}</Badge> },
    { key: 'category', header: 'Opted out of' },
    { key: 'date', header: 'Date', sortable: true },
    { key: 'reason', header: 'Reason' },
  ];
  return (
    <div>
      <div className="p-4">
        <Alert tone="info" title="Mandatory and security messages cannot be opted out">
          OTP codes, batch rejections, invoices and legally required dispute notices are always delivered. Opt-outs apply only to optional alerts and notices.
        </Alert>
      </div>
      <DataTable columns={columns} rows={data} searchKeys={['masked', 'category', 'reason']} dense />
    </div>
  );
}
