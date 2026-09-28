import { useEffect, useMemo, useRef, useState } from 'react';
import clsx from 'clsx';
import { FileText, Image, Loader2, Search, ShieldAlert, ShieldCheck, Trash2, Upload } from 'lucide-react';
import { Badge, Button, Card, EmptyState, PageHeader, StatCard, Tabs, useToast } from '@/components/ui';
import { AS_OF } from '@/data/kpis';
import ConfirmReasonModal from '@/portals/government/components/ConfirmReasonModal';
import { useAdmin } from '../../lib/useAdmin';
import { useAdminCollection } from '../../context/AdminStore';
import { nowStamp } from '../../lib/time';
import { MEDIA, MEDIA_LIMITS } from '../../data/cmsExtras';
import MediaUploadModal from './extras/MediaUploadModal';

const SCAN = {
  Clean: { tone: 'green', icon: ShieldCheck },
  Scanning: { tone: 'blue', icon: Loader2 },
  Quarantined: { tone: 'red', icon: ShieldAlert },
};

const THUMB = {
  image: 'from-primary-700 via-primary-500 to-teal-500',
  pdf: 'from-red-700 via-red-500 to-amber-400',
};

function MediaCard({ item, readOnly, onDelete }) {
  const scan = SCAN[item.scan] ?? SCAN.Clean;
  const ScanIcon = scan.icon;
  const TypeIcon = item.type === 'pdf' ? FileText : Image;
  return (
    <Card className="flex flex-col overflow-hidden">
      <div className={clsx('relative flex h-32 items-center justify-center bg-gradient-to-br', THUMB[item.type])} role="img" aria-label={item.altEn}>
        <TypeIcon className="h-10 w-10 text-white/85" aria-hidden="true" />
        <span className="absolute left-2 top-2 rounded bg-black/30 px-1.5 py-0.5 text-[11px] font-semibold uppercase text-white">{item.type}</span>
      </div>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <div className="flex items-start justify-between gap-2">
          <p className="break-all text-sm font-semibold text-slate-900">{item.name}</p>
          <Badge tone={scan.tone}><ScanIcon className={clsx('h-3 w-3', item.scan === 'Scanning' && 'animate-spin')} aria-hidden="true" />{item.scan === 'Scanning' ? 'Scanning…' : item.scan}</Badge>
        </div>
        <p className="text-xs text-slate-500">{item.sizeMb} MB · {item.uploadedBy} · {item.uploadedAt}</p>
        <dl className="space-y-1 text-xs">
          <div><dt className="inline font-medium text-slate-600">Alt EN: </dt><dd className="inline text-slate-700">{item.altEn}</dd></div>
          <div><dt className="inline font-medium text-slate-600">Alt MM: </dt><dd className="inline text-slate-700" lang="my">{item.altMm}</dd></div>
        </dl>
        <div className="mt-auto flex items-center justify-between gap-2 border-t border-slate-100 pt-3">
          <span className={clsx('text-xs font-medium', item.usage > 0 ? 'text-primary' : 'text-slate-500')}>
            {item.usage > 0 ? `Used on ${item.usage} page${item.usage > 1 ? 's' : ''}` : 'Not used'}
          </span>
          <Button size="sm" variant="ghost" icon={Trash2} disabled={readOnly} onClick={() => onDelete(item)} aria-label={`Delete ${item.name}`}>Delete</Button>
        </div>
      </div>
    </Card>
  );
}

export default function MediaLibrary() {
  const { user, can, audit } = useAdmin('cms.media');
  const toast = useToast();
  const [items, api] = useAdminCollection('cmsMedia', MEDIA);
  const [type, setType] = useState('all');
  const [query, setQuery] = useState('');
  const [uploading, setUploading] = useState(false);
  const [confirm, setConfirm] = useState(null);
  const timers = useRef([]);

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  // Any file left "Scanning" by a previous visit finishes its scan (runs once on mount).
  useEffect(() => {
    items.filter((m) => m.scan === 'Scanning').forEach((m) => {
      timers.current.push(setTimeout(() => api.patch(m.id, { scan: 'Clean' }), 2500));
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const rows = useMemo(() => items.filter((m) => (type === 'all' || m.type === type)
    && (!query || `${m.name} ${m.altEn} ${m.altMm}`.toLowerCase().includes(query.toLowerCase()))), [items, type, query]);

  const upload = (file) => {
    const id = `MED-${1049 + items.length}`;
    api.add({ id, ...file, scan: 'Scanning', usage: 0, uploadedBy: user?.name, uploadedAt: nowStamp() });
    audit('MEDIA_UPLOAD', `${id} · ${file.name} (${file.sizeMb} MB)`, { outcome: 'Queued for virus scan' });
    toast(`${file.name} uploaded — virus scan in progress`, 'info');
    timers.current.push(setTimeout(() => {
      api.patch(id, { scan: 'Clean' });
      audit('MEDIA_SCAN_CLEAN', `${id} · ${file.name}`);
      toast(`${file.name} scanned: clean`, 'success');
    }, 3000));
  };

  const askDelete = (item) => {
    if (item.usage > 0) {
      audit('MEDIA_DELETE_BLOCKED', `${item.id} · ${item.name}`, { outcome: 'Denied', purpose: `In use on ${item.usage} page(s)` });
      toast(`Cannot delete ${item.name}: it is used on ${item.usage} page(s). Remove it from those pages first.`, 'danger');
      return;
    }
    setConfirm(item);
  };

  const doDelete = (reason) => {
    api.remove(confirm.id);
    audit('MEDIA_DELETE', `${confirm.id} · ${confirm.name}`, { purpose: reason });
    toast(`${confirm.name} deleted`, 'success');
    setConfirm(null);
  };

  const count = (t) => items.filter((m) => t === 'all' || m.type === t).length;
  const totalMb = items.reduce((s, m) => s + m.sizeMb, 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Media library"
        subtitle="Images and PDF documents used across the Public portal — virus-scanned, alt-text mandatory, usage tracked."
        actions={<Button icon={Upload} disabled={!can('create')} onClick={() => setUploading(true)}>Upload media</Button>}
      />

      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <StatCard label="Media files" value={items.length} icon={Image} definition="Images and PDFs stored in the CMS media library." asOf={AS_OF} />
        <StatCard label="Storage used" value={`${totalMb.toFixed(1)} MB`} icon={FileText} tone="teal" definition={`Sum of file sizes. Limits: images ${MEDIA_LIMITS.image} MB, PDFs ${MEDIA_LIMITS.pdf} MB per file.`} asOf={AS_OF} />
        <StatCard label="Quarantined" value={items.filter((m) => m.scan === 'Quarantined').length} icon={ShieldAlert} tone="red" definition="Files the antivirus engine flagged; they cannot be inserted into content." asOf={AS_OF} />
        <StatCard label="Unused files" value={items.filter((m) => m.usage === 0).length} icon={Trash2} tone="warm" definition="Files not referenced by any page, service or notice — candidates for clean-up." asOf={AS_OF} />
      </div>

      <Card>
        <div className="flex flex-col gap-3 px-4 pt-2 lg:flex-row lg:items-end lg:justify-between">
          <Tabs
            value={type}
            onChange={setType}
            tabs={[{ id: 'all', label: 'All', count: count('all') }, { id: 'image', label: 'Images', count: count('image') }, { id: 'pdf', label: 'PDFs', count: count('pdf') }]}
            className="border-b-0"
          />
          <label className="relative mb-2 block w-full lg:max-w-xs">
            <span className="sr-only">Search media</span>
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" aria-hidden="true" />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search filename or alt text…" className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-3 text-sm focus:border-primary-300 focus:bg-white" />
          </label>
        </div>
      </Card>

      {rows.length === 0 ? (
        <Card><EmptyState title="No media matches your filters" /></Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {rows.map((m) => <MediaCard key={m.id} item={m} readOnly={!can('delete')} onDelete={askDelete} />)}
        </div>
      )}

      <MediaUploadModal open={uploading} onClose={() => setUploading(false)} onUpload={upload} />

      <ConfirmReasonModal
        open={!!confirm}
        title="Delete media file?"
        subtitle={confirm?.name}
        body={<p>This file is not used on any page. Deleting it is permanent.</p>}
        confirmLabel="Delete"
        reasonLabel="Reason for deletion"
        onCancel={() => setConfirm(null)}
        onConfirm={doDelete}
      />
    </div>
  );
}
