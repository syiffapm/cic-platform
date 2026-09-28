import { useState } from 'react';
import { CheckCircle2, Eye, Undo2 } from 'lucide-react';
import { useSession } from '@/context/AuthContext';
import { useStore } from '@/context/StoreContext';
import { formatDate } from '@/lib/format';
import { usePermissions } from '@/lib/rbac';
import { Alert, Badge, Button, Card, CardHeader, DataTable, EmptyState, MakerCheckerBanner, Modal, PageHeader, StatCard, Textarea, useToast } from '@/components/ui';
import { useRegulator } from '../../lib/RegulatorStore';
import { TODAY } from '../../lib/util';

export default function PublicationApproval() {
  const user = useSession('gov');
  const { can } = usePermissions('gov');
  const canApprove = can('gov.publicationApproval', 'approve');
  const { announcements, patch: patchStore, logAudit } = useStore();
  const { statReleases, patch: patchReg } = useRegulator();
  const toast = useToast();
  const [preview, setPreview] = useState(null);
  const [comment, setComment] = useState('');

  const notices = announcements.map((a) => ({ key: `n-${a.id}`, id: a.id, kind: 'Notice', title: a.title.en, body: a.body?.en, classification: a.classification, author: a.author, date: a.createdAt ?? a.publishedAt, status: a.status, approver: a.approver, publishedAt: a.publishedAt, category: a.category }));
  const stats = statReleases.map((s) => ({ key: `s-${s.id}`, id: s.id, kind: 'Statistics', title: s.title, body: `Contents: ${s.items}. Embargo until ${formatDate(s.embargo)}.`, classification: 'Public', author: s.preparedBy, date: s.preparedAt, status: s.status, approver: s.approver, publishedAt: s.publishedAt, category: 'Statistics' }));
  const all = [...stats, ...notices];
  const queue = all.filter((x) => x.status === 'In review');
  const done = all.filter((x) => x.status === 'Published' && x.approver && (x.kind === 'Statistics' || ['Statistics', 'Enforcement', 'Supervision'].includes(x.category))).slice(0, 8);

  const decide = (item, approve) => {
    if (!canApprove) return;
    if (item.author === user.name) { toast('You cannot approve an item you prepared.', 'danger'); return; }
    const changes = approve ? { status: 'Published', publishedAt: TODAY, approver: user.name } : { status: 'Draft', reviewComment: comment.trim() || 'Returned by Director' };
    if (item.kind === 'Statistics') patchReg('statReleases', item.id, changes);
    else patchStore('announcements', item.id, changes);
    logAudit({ actor: user.name, role: user.role, tenant: 'CBM', action: approve ? 'PUBLICATION_APPROVE' : 'PUBLICATION_RETURN', module: 'Publication approval', target: `${item.id} (${item.classification})`, purpose: comment.trim() || '—', outcome: 'Success' });
    toast(approve ? `${item.id} published to the ${item.classification === 'Public' ? 'Public Portal' : `${item.classification} audience`}` : `${item.id} returned to author`, approve ? 'success' : 'info');
    setPreview(null); setComment('');
  };

  const columns = [
    { key: 'title', header: 'Item', render: (r) => <><p className="font-mono text-[11px] text-slate-500">{r.id}</p><p className="max-w-md font-medium text-slate-900">{r.title}</p></> },
    { key: 'kind', header: 'Type', sortable: true, render: (r) => <Badge tone={r.kind === 'Statistics' ? 'teal' : 'navy'}>{r.kind}</Badge> },
    { key: 'classification', header: 'Audience', render: (r) => <Badge tone={r.classification === 'Public' ? 'green' : 'violet'}>{r.classification}</Badge> },
    { key: 'author', header: 'Prepared by', sortable: true, render: (r) => <span className="text-xs">{r.author}{r.date && <><br /><span className="text-slate-500">{formatDate(r.date)}</span></>}</span> },
    { key: 'act', header: <span className="relative"><span className="sr-only">Actions</span></span>, render: (r) => <Button size="sm" variant="outline" icon={Eye} onClick={() => setPreview(r)}>Review</Button> },
  ];

  const own = preview && preview.author === user.name;

  return (
    <div>
      <PageHeader
        title="Publication approval"
        subtitle="The Director approves statistics and notices before they reach the Public Portal. Approval publishes immediately with approver name and date."
      />
      <MakerCheckerBanner checker="Governor / Director" note="Items are prepared by analysts, supervisors or CMS editors. You cannot approve an item you prepared yourself." />
      <div className="my-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Awaiting approval" value={queue.length} tone="warm" definition="Statistics releases and notices with status In review" />
        <StatCard label="Statistics releases queued" value={queue.filter((q) => q.kind === 'Statistics').length} tone="teal" definition="Statistical outputs queued for public release" />
        <StatCard label="Notices queued" value={queue.filter((q) => q.kind === 'Notice').length} tone="navy" definition="Announcements submitted for approval from any portal" />
      </div>
      <Card>
        <CardHeader title="Queue" subtitle="Oldest first" />
        {queue.length ? <DataTable columns={columns} rows={queue} rowKey="key" /> : <EmptyState compact title="Nothing awaiting approval" />}
      </Card>
      <Card className="mt-6">
        <CardHeader title="Recently approved" />
        <DataTable dense rowKey="key" rows={done} columns={[
          { key: 'title', header: 'Item', render: (r) => <span className="font-medium text-slate-800">{r.title}</span> },
          { key: 'kind', header: 'Type' },
          { key: 'approver', header: 'Approved by' },
          { key: 'publishedAt', header: 'Published', render: (r) => formatDate(r.publishedAt) },
        ]} />
      </Card>

      <Modal
        open={!!preview}
        onClose={() => { setPreview(null); setComment(''); }}
        size="lg"
        title={preview?.title}
        subtitle={preview && `${preview.id} · ${preview.kind} · ${preview.classification} · prepared by ${preview.author}`}
        footer={preview && !own && canApprove && <>
          <Button variant="outline" icon={Undo2} onClick={() => decide(preview, false)}>Return to author</Button>
          <Button variant="success" icon={CheckCircle2} onClick={() => decide(preview, true)}>Approve & publish</Button>
        </>}
      >
        {preview && (
          <div className="space-y-4">
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm leading-relaxed text-slate-700">{preview.body}</div>
            {preview.classification === 'Public' && <Alert tone="warning" title="Public release">Check for borrower-identifiable or embargoed prudential data before approving.</Alert>}
            {own ? <Alert tone="danger" title="Maker-checker">You prepared this item; another Director must approve it.</Alert>
              : canApprove && <Textarea label="Comment (required only when returning)" rows={2} value={comment} onChange={(e) => setComment(e.target.value)} />}
          </div>
        )}
      </Modal>
    </div>
  );
}
