import { Clock } from 'lucide-react';
import { Badge } from '@/components/ui';
import { OPEN_STATUSES, decisionSla } from './appUtils';

/** Decision service standard: 3 working days from submission. Closed once a decision is recorded. */
export default function AppSlaBadge({ app }) {
  if (!OPEN_STATUSES.includes(app.status)) return <span className="text-[11px] text-slate-500">Decided</span>;
  const { due, left } = decisionSla(app);
  const tone = left < 0 ? 'red' : left <= 1 ? 'amber' : 'green';
  const text = left < 0 ? `Overdue ${Math.abs(left)} working day${left === -1 ? '' : 's'}` : left === 0 ? 'Due today' : `${left} working day${left === 1 ? '' : 's'} left`;
  return (
    <span className="inline-flex flex-col">
      <Badge tone={tone}><Clock className="h-3 w-3" aria-hidden="true" /> {text}</Badge>
      <span className="mt-0.5 text-[11px] text-slate-500">by {due}</span>
    </span>
  );
}
