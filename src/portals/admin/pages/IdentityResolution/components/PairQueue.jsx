import clsx from 'clsx';
import { useState } from 'react';
import { Badge, Card, CardHeader, Tabs } from '@/components/ui';
import { Users } from 'lucide-react';

const STATUS_TONE = { Open: 'blue', 'Pending checker': 'violet', Merged: 'green', 'Not same person': 'slate', Split: 'teal' };
const barTone = (s) => (s >= 90 ? 'bg-red-500' : s >= 80 ? 'bg-amber-500' : 'bg-teal-600');

/** Candidate pairs list with similarity bar and matched attribute chips. */
export default function PairQueue({ pairs, selectedId, onSelect }) {
  const [filter, setFilter] = useState('open');
  const shown = pairs
    .filter((p) => (filter === 'open' ? ['Open', 'Pending checker'].includes(p.status) : !['Open', 'Pending checker'].includes(p.status)))
    .sort((a, b) => b.score - a.score);

  return (
    <Card>
      <CardHeader icon={Users} title="Candidate pairs" subtitle="Sorted by similarity score" />
      <Tabs
        className="px-3"
        value={filter}
        onChange={setFilter}
        tabs={[
          { id: 'open', label: 'To review', count: pairs.filter((p) => ['Open', 'Pending checker'].includes(p.status)).length },
          { id: 'done', label: 'Resolved', count: pairs.filter((p) => !['Open', 'Pending checker'].includes(p.status)).length },
        ]}
      />
      <ul className="divide-y divide-slate-100">
        {shown.map((p) => (
          <li key={p.id}>
            <button
              type="button"
              onClick={() => onSelect(p.id)}
              aria-current={p.id === selectedId ? 'true' : undefined}
              className={clsx('w-full px-5 py-3.5 text-left transition-colors hover:bg-slate-50 focus-visible:bg-slate-50', p.id === selectedId && 'bg-primary-50/60 ring-1 ring-inset ring-primary-200')}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-mono text-xs font-semibold text-slate-800">{p.id}</span>
                <Badge tone={STATUS_TONE[p.status]}>{p.status}</Badge>
              </div>
              <p className="mt-1 text-sm text-slate-700">{p.a.nameEn} <span className="text-slate-500">↔</span> {p.b.nameEn}</p>
              <div className="mt-2 flex items-center gap-2">
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100" role="meter" aria-valuenow={p.score} aria-valuemin={0} aria-valuemax={100} aria-label={`Similarity ${p.score}%`}>
                  <div className={clsx('h-full rounded-full', barTone(p.score))} style={{ width: `${p.score}%` }} />
                </div>
                <span className="w-10 text-right text-xs font-semibold text-slate-700">{p.score}%</span>
              </div>
              <div className="mt-2 flex flex-wrap gap-1">
                {p.matched.map((m) => <span key={m} className="rounded-full bg-teal-50 px-2 py-0.5 text-[11px] font-medium text-teal-700 ring-1 ring-inset ring-teal-200">{m}</span>)}
              </div>
            </button>
          </li>
        ))}
        {shown.length === 0 && <li className="px-5 py-6 text-center text-xs text-slate-500">No pairs.</li>}
      </ul>
    </Card>
  );
}
