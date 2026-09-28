import { Link } from 'react-router-dom';
import { Activity } from 'lucide-react';
import { Badge, Card, CardHeader } from '@/components/ui';

const OUTCOME_TONE = { Success: 'green', Denied: 'red', 'Pending approval': 'amber', Failed: 'red' };

/** Latest audit entries (live from the shared hash-chained log). Borrower targets are masked for roles without PII access. */
export default function AuditFeed({ entries, maskBorrower, limit = 8 }) {
  const rows = entries.slice(0, limit);
  const target = (t) => (maskBorrower && /BRW-/.test(String(t)) ? String(t).replace(/BRW-\d+/g, 'BRW-••••••') : t);
  return (
    <Card>
      <CardHeader
        icon={Activity}
        title="Live audit feed"
        subtitle={`Latest ${rows.length} entries · hash-chained`}
        action={<Link to="/gov/admin/audit" className="text-xs font-medium text-primary hover:underline">Open audit log</Link>}
      />
      <ul className="divide-y divide-slate-100" aria-live="polite">
        {rows.map((e) => (
          <li key={e.id} className="flex flex-col gap-1 px-5 py-2.5 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <p className="truncate text-sm text-slate-800">
                <span className="font-mono text-xs font-semibold text-primary">{e.action}</span>
                <span className="text-slate-500"> · </span>{e.module}<span className="text-slate-500"> → </span>{target(e.target)}
              </p>
              <p className="text-[11px] text-slate-500">{e.at} · {e.actor} ({e.role}) · {e.tenant} · <span className="font-mono">{e.ip}</span></p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <span className="hidden font-mono text-[11px] text-slate-500 md:inline">{e.hash}</span>
              <Badge tone={OUTCOME_TONE[e.outcome] ?? 'slate'}>{e.outcome}</Badge>
            </div>
          </li>
        ))}
      </ul>
    </Card>
  );
}
