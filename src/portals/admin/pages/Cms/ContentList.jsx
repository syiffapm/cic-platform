import clsx from 'clsx';
import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CalendarClock, CheckCircle2, FilePlus2, Languages, Pin, Send } from 'lucide-react';
import { Badge, Button, Card, DataTable, PageHeader, Select, StatCard } from '@/components/ui';
import { useAdmin } from '../../lib/useAdmin';
import { today } from '../../lib/time';
import { CLASSIFICATION_TONES, CONTENT_TYPES, WORKFLOW, typeLabel } from '../../data/cms';
import { useCmsItems } from './useCmsItems';
import { translationStatus } from './components/cmsLogic';

export default function ContentList() {
  const navigate = useNavigate();
  const { can } = useAdmin('cms.content');
  const canCreate = can('create');
  const { items } = useCmsItems();
  const [type, setType] = useState('all');
  const [status, setStatus] = useState('');

  const rows = useMemo(() => items.map((x) => ({
    ...x,
    titleEn: x.title?.en ?? '',
    typeName: typeLabel(x.type),
    tr: translationStatus(x),
    editor: x.lastEditor ?? x.author,
  })), [items]);

  const counts = useMemo(() => Object.fromEntries(CONTENT_TYPES.map((t) => [t.id, rows.filter((r) => r.type === t.id).length])), [rows]);
  const visible = rows.filter((r) => (type === 'all' || r.type === type) && (!status || r.status === status));

  const kpi = {
    published: rows.filter((r) => r.status === 'Published').length,
    review: rows.filter((r) => r.status === 'In review').length,
    scheduled: rows.filter((r) => r.status === 'Scheduled').length,
    gaps: rows.filter((r) => r.tr.id !== 'complete' && r.status !== 'Archived').length,
  };
  const asOf = `Live · ${today()}`;

  const columns = [
    {
      key: 'titleEn', header: 'Title', sortable: true, className: 'min-w-[260px]',
      render: (r) => (
        <div>
          <Link to={`/gov/admin/cms/edit/${r.id}`} onClick={(e) => e.stopPropagation()} className="font-medium text-slate-900 hover:text-primary hover:underline">
            {r.titleEn || <span className="italic text-slate-500">Untitled</span>}
          </Link>
          <p className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[11px] text-slate-500">
            <span className="font-mono">{r.id}</span>
            {r.tr.id !== 'complete' && <Badge tone={r.tr.tone}><Languages className="h-3 w-3" aria-hidden="true" />{r.tr.label}</Badge>}
          </p>
        </div>
      ),
    },
    { key: 'typeName', header: 'Type', sortable: true },
    { key: 'classification', header: 'Classification', sortable: true, render: (r) => <Badge tone={CLASSIFICATION_TONES[r.classification]}>{r.classification}</Badge> },
    {
      key: 'status', header: 'Status', sortable: true,
      render: (r) => (
        <div>
          <Badge status={r.status} tone={r.status === 'Approved' ? 'teal' : undefined} />
          {r.status === 'Scheduled' && r.scheduleAt && <p className="mt-0.5 text-[11px] text-slate-500">{r.scheduleAt.replace('T', ' ')}</p>}
        </div>
      ),
    },
    { key: 'author', header: 'Author', sortable: true },
    { key: 'editor', header: 'Last editor', sortable: true },
    { key: 'updatedAt', header: 'Updated', sortable: true, render: (r) => <span className="whitespace-nowrap text-xs text-slate-600">{r.updatedAt}</span> },
    { key: 'pinned', header: 'Pinned', render: (r) => (r.pinned ? <Pin className="h-4 w-4 text-amber-700" aria-label="Pinned" /> : <span className="text-slate-500">—</span>) },
  ];

  const newHref = type !== 'all' ? `/gov/admin/cms/new?type=${type}` : '/gov/admin/cms/new';

  return (
    <div>
      <PageHeader
        title="Content"
        subtitle="All bilingual content that feeds the public website, borrower, MFI and Government portals. Editors draft; a different publisher approves and publishes."
        breadcrumbs={[{ label: 'Content management' }, { label: 'Pages, news & FAQ' }]}
        actions={(
          <Button icon={FilePlus2} disabled={!canCreate} onClick={() => navigate(newHref)}
            title={canCreate ? undefined : can('approve') ? 'Publishers approve content; editors create it' : 'Your role cannot create content'}>
            New content
          </Button>
        )}
      />

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Published" value={kpi.published} icon={CheckCircle2} tone="green" definition="Items currently live for their audience (any classification)." asOf={asOf} />
        <StatCard label="In review" value={kpi.review} icon={Send} tone="warm" definition="Submitted by an editor, awaiting a publisher's decision." asOf={asOf} />
        <StatCard label="Scheduled" value={kpi.scheduled} icon={CalendarClock} tone="teal" definition="Approved items that go live automatically at their publish time." asOf={asOf} />
        <StatCard label="Translation gaps" value={kpi.gaps} icon={Languages} tone="red" definition="Non-archived items whose Myanmar text is missing or older than the English text." asOf={asOf} />
      </div>

      <Card>
        <div className="flex flex-col gap-3 border-b border-slate-100 p-4 lg:flex-row lg:items-center lg:justify-between">
          <div role="group" aria-label="Filter by content type" className="flex flex-wrap gap-1.5">
            {[{ id: 'all', label: 'All types' }, ...CONTENT_TYPES].map((t) => {
              const active = type === t.id;
              return (
                <button key={t.id} type="button" aria-pressed={active} onClick={() => setType(t.id)}
                  className={clsx('inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors',
                    active ? 'border-primary bg-primary text-white' : 'border-slate-200 bg-white text-slate-600 hover:border-primary-300 hover:text-primary')}>
                  {t.label}
                  <span className={clsx('rounded-full px-1.5 text-[11px]', active ? 'bg-white/20' : 'bg-slate-100 text-slate-700')}>{t.id === 'all' ? rows.length : counts[t.id]}</span>
                </button>
              );
            })}
          </div>
          <Select aria-label="Filter by status" className="lg:w-48" value={status} onChange={(e) => setStatus(e.target.value)} placeholder="All statuses" options={WORKFLOW} />
        </div>
        <div className="p-4">
          <DataTable columns={columns} rows={visible} searchKeys={['titleEn', 'id', 'author', 'editor']} pageSize={12}
            onRowClick={(r) => navigate(`/gov/admin/cms/edit/${r.id}`)} emptyTitle="No content matches these filters" />
        </div>
      </Card>
    </div>
  );
}
