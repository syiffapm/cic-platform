import clsx from 'clsx';
import { Layers } from 'lucide-react';
import { Badge, Card, CardHeader } from '@/components/ui';
import { FAMILIES } from '../../../data/rules';

export const RULE_STATUS_TONE = { Active: 'green', Draft: 'slate', Superseded: 'amber', 'Rolled back': 'red', Retired: 'slate' };

/** Rule sets grouped by family, newest version first. */
export default function RuleSetList({ sets, selectedId, onSelect, pendingFor }) {
  return (
    <Card>
      <CardHeader icon={Layers} title="Rule sets" subtitle="Select a version" />
      <div className="divide-y divide-slate-100">
        {Object.entries(FAMILIES).map(([key, fam]) => (
          <section key={key} aria-label={fam.label} className="py-2">
            <h3 className="px-5 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-500">{fam.label}</h3>
            <ul>
              {sets.filter((s) => s.family === key).sort((a, b) => b.id.localeCompare(a.id)).map((s) => (
                <li key={s.id}>
                  <button
                    type="button"
                    onClick={() => onSelect(s.id)}
                    aria-current={s.id === selectedId ? 'true' : undefined}
                    className={clsx('flex w-full items-center justify-between gap-2 px-5 py-2 text-left hover:bg-slate-50', s.id === selectedId && 'bg-primary-50/60 ring-1 ring-inset ring-primary-200')}
                  >
                    <span>
                      <span className="block font-mono text-sm font-semibold text-slate-800">{s.id}</span>
                      <span className="block text-[11px] text-slate-500">{s.effectiveFrom ? `From ${s.effectiveFrom}` : 'Not activated'}</span>
                    </span>
                    <span className="flex flex-col items-end gap-1">
                      <Badge tone={RULE_STATUS_TONE[s.status]}>{s.status}</Badge>
                      {pendingFor(s.id) && <Badge tone="violet">Pending</Badge>}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </Card>
  );
}
