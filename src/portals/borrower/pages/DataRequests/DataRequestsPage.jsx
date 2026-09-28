import clsx from 'clsx';
import { useState } from 'react';
import { Download, PencilLine, Send, UserX } from 'lucide-react';
import { Alert, Badge, Button, Card, CardBody, CardHeader, DataTable, Modal, PageHeader, Textarea, useToast } from '@/components/ui';
import { formatDate } from '@/lib/format';
import { AuditFootnote } from '../../components/Common';
import EvidenceUpload from '../../components/EvidenceUpload';
import { addDays, isoDate, useBorrowerAudit, useOwnState } from '../../lib/borrower';

const TYPES = [
  { id: 'Access', icon: Download, title: 'Get a copy of my data', text: 'Everything CIC holds about you: identity, loans, who viewed, consents and audit entries about you.' },
  { id: 'Rectification', icon: PencilLine, title: 'Correct my personal details', text: 'Name spelling, address or phone. For a wrong loan, file a dispute instead — it goes straight to the lender.' },
  { id: 'Account closure', icon: UserX, title: 'Close my portal account', text: 'Deletes your login. Your credit record stays, because lenders must report it by law.' },
];

/** Data subject requests tracked by the DPO. */
export default function DataRequestsPage() {
  const [requests, setRequests] = useOwnState('dataRequests');
  const [type, setType] = useState('Access');
  const [details, setDetails] = useState('');
  const [files, setFiles] = useState([]);
  const [confirmClose, setConfirmClose] = useState(false);
  const audit = useBorrowerAudit();
  const toast = useToast();

  const needsText = type !== 'Access';
  const valid = !needsText || details.trim().length >= 10;

  const doSubmit = () => {
    const now = new Date();
    const next = Math.max(0, ...requests.map((r) => Number(r.id.split('-').pop()) || 0)) + 1;
    const id = `DSR-2026-${String(next).padStart(4, '0')}`;
    const summary = details.trim() || 'Copy of all personal data CIC holds about me';
    setRequests((list) => [{ id, type, summary, submittedAt: isoDate(now), dueAt: isoDate(addDays(now, 30)), status: 'Submitted', dpoNote: 'Received by the Data Protection Officer. We will reply within 30 days.', files: files.map((f) => f.name) }, ...list]);
    audit('DSR_SUBMIT', id, { purpose: type });
    toast(`Request ${id} sent to the Data Protection Officer.`, 'success');
    setDetails(''); setFiles([]); setConfirmClose(false);
  };

  const submit = (e) => {
    e.preventDefault();
    if (!valid) return;
    if (type === 'Account closure') setConfirmClose(true);
    else doSubmit();
  };

  const columns = [
    { key: 'id', header: 'Request', render: (r) => <span className="font-mono text-xs font-semibold">{r.id}</span> },
    { key: 'type', header: 'Type', render: (r) => <Badge tone={r.type === 'Account closure' ? 'red' : r.type === 'Access' ? 'blue' : 'violet'}>{r.type}</Badge> },
    { key: 'summary', header: 'Details', render: (r) => <span className="text-xs">{r.summary}</span> },
    { key: 'submittedAt', header: 'Sent', render: (r) => formatDate(r.submittedAt) },
    { key: 'dueAt', header: 'Reply due', render: (r) => formatDate(r.dueAt) },
    { key: 'status', header: 'Status', render: (r) => <div><Badge status={r.status} /><p className="mt-1 max-w-[220px] text-[11px] text-slate-500">{r.dpoNote}</p></div> },
  ];

  return (
    <div>
      <PageHeader
        title="My data requests"
        subtitle="You have the right to see, correct, or stop using the personal data CIC holds about you. Each request is handled by CIC's Data Protection Officer (DPO) within 30 days."
      />

      <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
        <Card>
          <CardHeader title="New request" />
          <CardBody>
            <form onSubmit={submit} className="space-y-4" noValidate>
              <fieldset className="space-y-2">
                <legend className="mb-1 text-xs font-medium text-slate-700">What do you want to do?</legend>
                {TYPES.map((t) => (
                  <label key={t.id} className={clsx('flex cursor-pointer gap-3 rounded-lg border p-3', type === t.id ? 'border-primary bg-primary-50/60 ring-1 ring-primary' : 'border-slate-200 hover:border-primary-200')}>
                    <input type="radio" name="dsr" value={t.id} checked={type === t.id} onChange={() => setType(t.id)} className="mt-1 accent-[hsl(214_45%_22%)]" />
                    <t.icon className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                    <span>
                      <span className="block text-sm font-semibold text-slate-800">{t.title}</span>
                      <span className="block text-xs text-slate-500">{t.text}</span>
                    </span>
                  </label>
                ))}
              </fieldset>
              <Textarea
                label={type === 'Access' ? 'Anything specific? (optional)' : type === 'Rectification' ? 'What should be corrected?' : 'Why are you closing your account? (at least 10 characters)'}
                rows={3}
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                required={needsText}
                hint={type === 'Rectification' ? 'Write the current (wrong) value and the correct value.' : undefined}
              />
              {type === 'Rectification' && <EvidenceUpload label="Supporting document" files={files} onChange={setFiles} hint="e.g. household list or ward certificate. PDF or JPG, up to 5 MB." />}
              <Button type="submit" icon={Send} className="w-full" disabled={!valid || files.some((f) => f.scan !== 'clean')}>Send to DPO</Button>
            </form>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Request history" subtitle="Status is updated by the DPO" />
          <DataTable columns={columns} rows={requests} emptyTitle="You have not asked CIC to copy or correct your data" />
        </Card>
      </div>

      <Modal
        open={confirmClose}
        onClose={() => setConfirmClose(false)}
        title="Close your portal account?"
        size="sm"
        footer={<><Button variant="outline" onClick={() => setConfirmClose(false)}>Keep my account</Button><Button variant="danger" onClick={doSubmit}>Request closure</Button></>}
      >
        <Alert tone="warning">Closing your account removes your login, alerts and representatives. Your credit record is <strong>not</strong> deleted — licensed lenders must keep reporting your loans by law, and you can register again at any time.</Alert>
      </Modal>

      <AuditFootnote action="Every request" />
    </div>
  );
}
