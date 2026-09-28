import clsx from 'clsx';
import { useState } from 'react';
import { GitCompare, History, RotateCcw } from 'lucide-react';
import { Badge, Button, Card, CardBody, CardHeader, Modal } from '@/components/ui';
import { snapshotOf } from '../../../data/cms';
import { diffSnapshots } from './cmsLogic';

/** Version history with who/when/note, field diff vs current and restore (CMS-06, AC11). */
export default function VersionHistory({ item, canRestore, restoreReason, onRestore }) {
  const [selected, setSelected] = useState(null);
  const versions = [...(item.versions ?? [])].reverse();
  const latest = versions[0]?.version;
  const diff = selected ? diffSnapshots(selected.snapshot, snapshotOf(item)) : [];

  return (
    <Card>
      <CardHeader title="Version history" subtitle={`${versions.length} version${versions.length === 1 ? '' : 's'} · immutable`} icon={History} />
      <CardBody className="p-0">
        {versions.length === 0 ? (
          <p className="p-5 text-sm text-slate-500">No versions yet — the first save creates version 1.</p>
        ) : (
          <ol className="max-h-80 divide-y divide-slate-100 overflow-y-auto scrollbar-thin" tabIndex={0} role="region" aria-label="Version history">
            {versions.map((v) => (
              <li key={v.version}>
                <button type="button" onClick={() => setSelected(v)}
                  className={clsx('flex w-full items-start gap-3 px-5 py-3 text-left hover:bg-slate-50 focus-visible:bg-slate-50')}
                  aria-label={`Compare version ${v.version} with current`}>
                  <span className="mt-0.5 rounded bg-primary-50 px-1.5 py-0.5 font-mono text-[11px] font-semibold text-primary">v{v.version}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-slate-800">{v.note}</span>
                    <span className="block text-[11px] text-slate-500">{v.by} · {v.at}</span>
                  </span>
                  <span className="flex shrink-0 items-center gap-1.5">
                    {v.version === latest && <Badge tone="green">Current</Badge>}
                    <Badge status={v.snapshot?.status}>{v.snapshot?.status ?? '—'}</Badge>
                    <GitCompare className="h-4 w-4 text-slate-500" aria-hidden="true" />
                  </span>
                </button>
              </li>
            ))}
          </ol>
        )}
      </CardBody>

      <Modal
        open={!!selected}
        onClose={() => setSelected(null)}
        size="lg"
        title={selected ? `Version ${selected.version} vs current` : ''}
        subtitle={selected ? `${selected.note} — ${selected.by}, ${selected.at}` : ''}
        footer={(
          <>
            {!canRestore && restoreReason && <p className="mr-auto self-center text-xs text-slate-500">{restoreReason}</p>}
            <Button variant="ghost" onClick={() => setSelected(null)}>Close</Button>
            <Button icon={RotateCcw} disabled={!canRestore || diff.length === 0}
              onClick={() => { onRestore(selected); setSelected(null); }}>
              Restore this version
            </Button>
          </>
        )}
      >
        {diff.length === 0 ? (
          <p className="text-sm text-slate-600">This version is identical to the current content.</p>
        ) : (
          <div className="space-y-3">
            <p className="text-xs text-slate-500">{diff.length} field{diff.length === 1 ? '' : 's'} differ. Restoring creates a new version with this content and returns the item to Draft for re-approval.</p>
            {diff.map((d) => (
              <div key={d.field} className="rounded-lg border border-slate-200">
                <p className="border-b border-slate-100 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700">{d.label}</p>
                <div className="grid grid-cols-1 gap-px bg-slate-100 sm:grid-cols-2">
                  <div className="bg-red-50/60 px-3 py-2 text-sm">
                    <span className="mb-0.5 block text-[11px] font-semibold uppercase tracking-wide text-red-700">v{selected.version}</span>
                    <del className="whitespace-pre-wrap break-words text-red-800 decoration-red-400">{d.from}</del>
                  </div>
                  <div className="bg-emerald-50/60 px-3 py-2 text-sm">
                    <span className="mb-0.5 block text-[11px] font-semibold uppercase tracking-wide text-emerald-700">Current</span>
                    <ins className="whitespace-pre-wrap break-words text-emerald-800 no-underline">{d.to}</ins>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Modal>
    </Card>
  );
}
