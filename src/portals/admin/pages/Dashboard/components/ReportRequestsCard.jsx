import { Link } from 'react-router-dom';
import { CheckCircle2, ClipboardCheck, FileCheck2, Timer, XCircle } from 'lucide-react';
import { Card, CardBody, CardHeader } from '@/components/ui';
import { formatHours, requestStats } from '../../ReportRequests/components/requestUtils';

/** Personal credit report requests: queue KPIs for the operations dashboard. Counts only. */
export default function ReportRequestsCard({ requests = [], canOpen }) {
  const now = new Date();
  const s = requestStats(requests, now);
  const asOf = now.toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
  const tiles = [
    { label: 'Pending review', value: s.pendingReview, sub: s.overdue ? `${s.overdue} past 1 working day` : 'All within target', icon: ClipboardCheck, tone: s.overdue ? 'text-red-700' : 'text-amber-700', def: 'Validated requests waiting for an officer decision' },
    { label: 'Issued today', value: s.issuedToday, sub: `${s.issuedWeek} this week`, icon: CheckCircle2, tone: 'text-emerald-700', def: 'Reports approved and issued, by decision date (week starts Monday)' },
    { label: 'Average time to issue', value: formatHours(s.avgHours), sub: 'Target 1 working day', icon: Timer, tone: 'text-teal-700', def: 'Mean time from submission to approval for issued reports' },
    { label: 'Rejected', value: s.rejected, sub: `${s.issuedTotal} issued in total`, icon: XCircle, tone: 'text-red-700', def: 'Requests declined with a reason sent to the citizen' },
  ];
  return (
    <Card>
      <CardHeader icon={FileCheck2} title="Personal credit report requests" subtitle={`Citizens' own report requests — validated, approved and issued by CIC · as of ${asOf}`}
        action={canOpen && <Link to="/gov/admin/report-requests" className="text-xs font-medium text-primary hover:underline">Open the queue →</Link>} />
      <CardBody className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {tiles.map((t) => (
          <div key={t.label} className="rounded-lg border border-slate-100 p-3" title={t.def}>
            <p className="flex items-center gap-1.5 text-[11px] font-medium text-slate-500"><t.icon className={`h-3.5 w-3.5 ${t.tone}`} aria-hidden="true" />{t.label}</p>
            <p className="mt-1 text-2xl font-bold text-slate-900">{t.value}</p>
            <p className="mt-0.5 text-[11px] text-slate-500">{t.sub}</p>
            <p className="mt-1 text-[11px] leading-snug text-slate-500">{t.def}</p>
          </div>
        ))}
      </CardBody>
    </Card>
  );
}
