import { useState } from 'react';
import { FilePlus2, Send } from 'lucide-react';
import { useSession } from '@/context/AuthContext';
import { useStore } from '@/context/StoreContext';
import { CLASSIFICATIONS } from '@/data/reference';
import { formatDate } from '@/lib/format';
import { usePermissions } from '@/lib/rbac';
import { Alert, Badge, Button, Card, CardBody, CardHeader, DataTable, EmptyState, Input, Modal, PageHeader, Select, Tabs, Textarea, useToast } from '@/components/ui';
import { TODAY } from '../../lib/util';

const CLASS_HELP = {
  Public: 'Public Portal, Borrower Portal and all authenticated portals',
  'MFI-only': 'MFI Member Portal and regulators — never public',
  'Regulator-only': 'Government Portal only',
  Internal: 'CIC / CBM staff consoles only',
};
const CLASS_TONE = { Public: 'green', 'MFI-only': 'blue', 'Regulator-only': 'violet', Internal: 'slate' };
const EMPTY = { titleEn: '', titleMm: '', body: '', category: 'Regulation', classification: 'Public', attachment: '' };

export default function Announcements() {
  const user = useSession('gov');
  const { can } = usePermissions('gov');
  const { announcements, announcementsFor, add, patch, logAudit } = useStore();
  const toast = useToast();
  const [tab, setTab] = useState('mine');
  const [open, setOpen] = useState(false);
  const [f, setF] = useState(EMPTY);
  const [err, setErr] = useState('');
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  const visible = announcementsFor('regulator');
  const mine = announcements.filter((a) => a.author === user?.name && a.status !== 'Published');

  const save = (status) => {
    if (f.titleEn.trim().length < 8 || f.body.trim().length < 20) return setErr('Title (≥ 8 chars) and body (≥ 20 chars) are required.');
    const max = Math.max(32, ...announcements.map((a) => Number(a.id.match(/^ANN-2026-(\d+)$/)?.[1] ?? 0)));
    const id = `ANN-2026-${String(max + 1).padStart(3, '0')}`;
    add('announcements', {
      id, title: { en: f.titleEn.trim(), mm: f.titleMm.trim() }, body: { en: f.body.trim(), mm: '' }, category: f.category, classification: f.classification,
      status, publishedAt: null, author: user.name, authorPortal: 'regulator', approver: null, attachment: f.attachment.trim() || null, pinned: false, mandatory: false, createdAt: TODAY,
    });
    logAudit({ actor: user.name, role: user.role, tenant: 'CBM', action: status === 'In review' ? 'CONTENT_SUBMIT_REVIEW' : 'CONTENT_DRAFT', module: 'Announcements', target: `${id} (${f.classification})`, outcome: 'Success' });
    toast(status === 'In review' ? `${id} submitted for CMS approval` : `${id} saved as draft`, 'success');
    setF(EMPTY); setErr(''); setOpen(false); setTab('mine');
  };

  const submitDraft = (a) => {
    patch('announcements', a.id, { status: 'In review' });
    logAudit({ actor: user.name, role: user.role, tenant: 'CBM', action: 'CONTENT_SUBMIT_REVIEW', module: 'Announcements', target: a.id, outcome: 'Success' });
    toast(`${a.id} submitted for approval`, 'success');
  };

  const cols = (withAction) => [
    { key: 'id', header: 'Notice', render: (r) => <><p className="font-mono text-[11px] text-slate-500">{r.id}</p><p className="max-w-md font-medium text-slate-900">{r.title.en}</p>{r.title.mm && <p className="text-xs text-slate-500" lang="my">{r.title.mm}</p>}</> },
    { key: 'category', header: 'Category', sortable: true },
    { key: 'classification', header: 'Classification', sortable: true, render: (r) => <Badge tone={CLASS_TONE[r.classification]}>{r.classification}</Badge> },
    { key: 'status', header: 'Status', sortable: true, render: (r) => <Badge status={r.status}>{r.status}</Badge> },
    { key: 'publishedAt', header: withAction ? 'Author' : 'Published', sortable: true, render: (r) => <span className="text-xs">{withAction ? r.author : formatDate(r.publishedAt)}{!withAction && r.approver && <><br /><span className="text-slate-500">approved by {r.approver}</span></>}</span> },
    ...(withAction ? [{ key: 'act', header: <span className="relative"><span className="sr-only">Actions</span></span>, render: (r) => r.status === 'Draft' && can('gov.announcements', 'update') && <Button size="sm" variant="outline" icon={Send} onClick={() => submitDraft(r)}>Submit</Button> }] : []),
  ];

  return (
    <div>
      <PageHeader
        title="Announcements"
        subtitle="Draft supervisory notices with a classification. Nothing is published from here: drafts go to the CMS approval queue and, for statistics, to Director publication approval."
        actions={can('gov.announcements', 'create') && <Button icon={FilePlus2} onClick={() => setOpen(true)}>New notice</Button>}
      />
      <Card>
        <Tabs className="px-4" value={tab} onChange={setTab} tabs={[{ id: 'mine', label: 'My drafts & submissions', count: mine.length }, { id: 'all', label: 'Published — visible to regulators', count: visible.length }]} />
        {tab === 'mine'
          ? (mine.length ? <DataTable columns={cols(true)} rows={mine} searchKeys={['id', 'category']} /> : <EmptyState compact title="No drafts" description="Create a notice to start the approval workflow." />)
          : <DataTable columns={cols(false)} rows={visible} searchKeys={['id', 'category', 'classification']} />}
      </Card>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        size="lg"
        title="New notice"
        subtitle="Classification controls which portals may ever receive this notice (enforced server-side)"
        footer={<><Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button><Button variant="outline" onClick={() => save('Draft')}>Save draft</Button><Button icon={Send} onClick={() => save('In review')}>Submit for CMS approval</Button></>}
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input className="sm:col-span-2" label="Title (English)" required value={f.titleEn} onChange={set('titleEn')} />
          <Input className="sm:col-span-2" label="Title (Myanmar)" value={f.titleMm} onChange={set('titleMm')} lang="my" hint="Unicode only — Zawgyi is rejected at publication" />
          <Textarea className="sm:col-span-2" label="Body (English)" required rows={5} value={f.body} onChange={set('body')} />
          <Select label="Category" value={f.category} onChange={set('category')} options={['Regulation', 'Supervision', 'Statistics', 'Enforcement', 'Operations', 'Consumer protection']} />
          <Select label="Classification" required value={f.classification} onChange={set('classification')} options={CLASSIFICATIONS} hint={CLASS_HELP[f.classification]} />
          <Input className="sm:col-span-2" label="Attachment file name (optional)" value={f.attachment} onChange={set('attachment')} placeholder="e.g. FRD-Circular-12-2026.pdf" />
          {err && <Alert tone="danger" className="sm:col-span-2">{err}</Alert>}
        </div>
      </Modal>

      <Card className="mt-6">
        <CardHeader title="How publishing works" />
        <CardBody>
          <ol className="grid grid-cols-1 gap-3 text-xs text-slate-600 sm:grid-cols-4">
            {['Regulator drafts notice with classification', 'Submitted → status “In review”', 'CMS publisher / Director approves (different user)', 'Published only to audiences its classification allows'].map((s, i) => (
              <li key={s} className="flex gap-2 rounded-lg bg-slate-50 p-3"><span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary text-[11px] font-bold text-white">{i + 1}</span>{s}</li>
            ))}
          </ol>
        </CardBody>
      </Card>
    </div>
  );
}
