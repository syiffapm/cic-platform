import { Clock } from 'lucide-react';
import { Badge } from '@/components/ui';
import { slaDaysLeft } from '@/lib/format';

/** MFI response SLA (10 working days). Negative = breached. */
export default function SlaBadge({ due, done }) {
  if (done) return <Badge tone="slate">SLA closed</Badge>;
  const d = slaDaysLeft(due);
  const tone = d < 0 ? 'red' : d <= 2 ? 'amber' : 'green';
  const text = d < 0 ? `Breached ${Math.abs(d)} d ago` : d === 0 ? 'Due today' : `${d} day${d === 1 ? '' : 's'} left`;
  return (
    <Badge tone={tone}>
      <Clock className="h-3 w-3" aria-hidden="true" /> {text}
    </Badge>
  );
}
