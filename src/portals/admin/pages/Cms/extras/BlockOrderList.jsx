import { useState } from 'react';
import clsx from 'clsx';
import { ArrowDown, ArrowUp, Eye, EyeOff, GripVertical, Lock } from 'lucide-react';

/**
 * CMS-09 landing block ordering. Two equivalent inputs: HTML5 drag-and-drop on each row,
 * and keyboard-accessible up/down buttons. Locked blocks (header/footer) stay pinned.
 */
export default function BlockOrderList({ blocks, onChange, readOnly, baseline }) {
  const [dragId, setDragId] = useState(null);
  const [dropIndex, setDropIndex] = useState(null);
  const [live, setLive] = useState('');
  const basePos = Object.fromEntries(baseline.map((b, i) => [b.id, i]));

  const movable = (i) => !blocks[i]?.locked;
  const canSwap = (i, j) => j >= 0 && j < blocks.length && movable(i) && movable(j);

  const move = (from, to) => {
    if (from === to || readOnly) return;
    const next = [...blocks];
    const [item] = next.splice(from, 1);
    const target = from < to ? to - 1 : to;
    next.splice(target, 0, item);
    // Pinned blocks (header, footer) must keep their position.
    if (blocks.some((b, idx) => b.locked && next[idx]?.id !== b.id)) return;
    onChange(next);
    setLive(`${item.label} moved to position ${target + 1} of ${next.length}`);
  };

  const swap = (i, j) => {
    if (!canSwap(i, j) || readOnly) return;
    const next = [...blocks];
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
    setLive(`${next[j].label} moved to position ${j + 1} of ${next.length}`);
  };

  const toggle = (id) => {
    if (readOnly) return;
    onChange(blocks.map((b) => (b.id === id ? { ...b, visible: !b.visible } : b)));
  };

  const onDragOver = (e, i) => {
    if (!dragId) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    const rect = e.currentTarget.getBoundingClientRect();
    setDropIndex(e.clientY - rect.top > rect.height / 2 ? i + 1 : i);
  };

  const onDrop = (e) => {
    e.preventDefault();
    const from = blocks.findIndex((b) => b.id === dragId);
    if (from >= 0 && dropIndex !== null) move(from, dropIndex);
    setDragId(null);
    setDropIndex(null);
  };

  return (
    <div>
      <p className="sr-only" aria-live="polite">{live}</p>
      <ol className="space-y-1.5" onDragLeave={(e) => { if (!e.currentTarget.contains(e.relatedTarget)) setDropIndex(null); }}>
        {blocks.map((b, i) => {
          const moved = basePos[b.id] !== i;
          return (
            <li key={b.id} className="relative">
              {dropIndex === i && <div className="absolute -top-1 left-0 right-0 h-1 rounded-full bg-warm" aria-hidden="true" />}
              <div
                draggable={!readOnly && !b.locked}
                onDragStart={(e) => { setDragId(b.id); e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain', b.id); }}
                onDragEnd={() => { setDragId(null); setDropIndex(null); }}
                onDragOver={(e) => onDragOver(e, i)}
                onDrop={onDrop}
                className={clsx(
                  'flex items-center gap-3 rounded-lg border bg-white px-3 py-2.5 transition',
                  dragId === b.id ? 'border-warm opacity-50' : 'border-slate-200',
                  !b.visible && 'bg-slate-50',
                  !readOnly && !b.locked && 'cursor-grab active:cursor-grabbing',
                )}
              >
                {b.locked
                  ? <Lock className="h-4 w-4 shrink-0 text-slate-500" aria-label="Pinned position" />
                  : <GripVertical className="h-4 w-4 shrink-0 text-slate-500" aria-hidden="true" />}
                <span className={clsx('flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold', moved ? 'bg-warm text-white' : 'bg-primary-50 text-primary')}>{i + 1}</span>
                <div className="min-w-0 flex-1">
                  <p className={clsx('text-sm font-medium', b.visible ? 'text-slate-900' : 'text-slate-500 line-through')}>{b.label}</p>
                  <p className="truncate text-xs text-slate-500">{b.detail}</p>
                </div>
                {moved && <span className="hidden text-[11px] font-medium text-amber-700 sm:inline">was #{basePos[b.id] + 1}</span>}
                <div className="flex shrink-0 items-center gap-0.5">
                  <button type="button" onClick={() => swap(i, i - 1)} disabled={readOnly || !canSwap(i, i - 1)} aria-label={`Move ${b.label} up`} className="rounded p-1.5 text-slate-500 hover:bg-slate-100 disabled:opacity-30"><ArrowUp className="h-4 w-4" /></button>
                  <button type="button" onClick={() => swap(i, i + 1)} disabled={readOnly || !canSwap(i, i + 1)} aria-label={`Move ${b.label} down`} className="rounded p-1.5 text-slate-500 hover:bg-slate-100 disabled:opacity-30"><ArrowDown className="h-4 w-4" /></button>
                  <button type="button" onClick={() => toggle(b.id)} disabled={readOnly || b.locked} aria-pressed={b.visible} aria-label={`${b.visible ? 'Hide' : 'Show'} ${b.label}`} className="rounded p-1.5 text-slate-500 hover:bg-slate-100 disabled:opacity-30">
                    {b.visible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              {dropIndex === blocks.length && i === blocks.length - 1 && <div className="absolute -bottom-1 left-0 right-0 h-1 rounded-full bg-warm" aria-hidden="true" />}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
