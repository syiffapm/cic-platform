import { Link } from 'react-router-dom';
import { ClipboardList } from 'lucide-react';
import { Badge, Card, CardHeader, EmptyState } from '@/components/ui';
import { useStore } from '@/context/StoreContext';
import { formatMMK } from '@/lib/format';
import AppSlaBadge from './AppSlaBadge';
import { OPEN_STATUSES, decisionSla, isoDate, statusTone } from './appUtils';

function Figure({ label, value, hint }) {
  return (
    <div className="px-3 py-4 sm:px-5">
      <p className="text-xs font-medium text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-bold text-slate-900">{value}</p>
      <p className="text-[11px] text-slate-500">{hint}</p>
    </div>
  );
}

/** Dashboard summary of the loan application inbox. */
export default function ApplicationsWidget({ tenant }) {
  const { loanApplications } = useStore();
  const own = loanApplications.filter((a) => a.mfiId === tenant);
  const today = isoDate();
  const open = own.filter((a) => OPEN_STATUSES.includes(a.status)).sort((a, b) => decisionSla(a).left - decisionSla(b).left);
  const decided = own.filter((a) => a.decision?.at?.startsWith(today.slice(0, 7)) && ['Approved', 'Rejected'].includes(a.decision.outcome));
  const rate = decided.length ? `${Math.round((decided.filter((a) => a.decision.outcome === 'Approved').length / decided.length) * 100)}%` : '—';

  return (
    <Card>
      <CardHeader title="Loan applications" subtitle="Online and branch applications with digital consent · decide within 3 working days" icon={ClipboardList}
        action={<Link to="/mfi/credit/applications" className="text-xs font-medium text-primary hover:underline">Open inbox</Link>} />
      <div className="grid gap-6 lg:grid-cols-5 [&>*]:min-w-0">
        <div className="grid grid-cols-3 divide-x divide-slate-100 lg:col-span-2 lg:grid-cols-1 lg:divide-x-0 lg:divide-y [&>*]:min-w-0">
          <Figure label="New today" value={own.filter((a) => a.submittedAt.startsWith(today)).length} hint={`Received ${today}`} />
          <Figure label="Awaiting decision" value={open.length} hint="Submitted or in credit check" />
          <Figure label="Approval rate this month" value={rate} hint={`${decided.length} decision(s) this month`} />
        </div>
        <ul className="divide-y divide-slate-100 border-t border-slate-100 lg:col-span-3 lg:border-l lg:border-t-0">
          {open.length === 0 && <li><EmptyState compact title="No applications awaiting a decision" /></li>}
          {open.slice(0, 4).map((a) => (
            <li key={a.id}>
              <Link to={`/mfi/applications/${a.id}`} className="flex items-center justify-between gap-3 px-5 py-3 hover:bg-slate-50 focus-visible:bg-slate-50">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-slate-800">{a.applicant.name} · {formatMMK(a.amount)}</p>
                  <p className="truncate text-[11px] text-slate-500"><span className="font-mono">{a.id}</span> · {a.product} · {a.channel} · <Badge tone={statusTone(a.status)}>{a.status}</Badge></p>
                </div>
                <AppSlaBadge app={a} />
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </Card>
  );
}
