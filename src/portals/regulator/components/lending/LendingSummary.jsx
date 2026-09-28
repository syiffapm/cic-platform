import { Link } from 'react-router-dom';
import { ArrowRight, TrendingUp } from 'lucide-react';
import { formatNumber } from '@/lib/format';
import { Card, CardBody, CardHeader } from '@/components/ui';
import { LENDING_AS_OF } from '../../data/lending';
import useLendingData from './useLendingData';
import { useReportRequestAggregates } from './ReportRequestsPanel';

/** Compact "Citizen & lending activity" section for the Executive dashboard. */
export default function LendingSummary({ canOpen = true }) {
  const { kpis, declines } = useLendingData('12m');
  const rr = useReportRequestAggregates();
  const top = [...declines].sort((a, b) => b.count - a.count)[0];
  const items = [
    ['Applications, 12 months', formatNumber(kpis.applications)],
    ['Applied online (last month)', `${kpis.onlineShare}%`],
    ['Approval rate', `${kpis.approvalRate}%`],
    ['Median days to decision (online / branch)', `${kpis.daysOnline} / ${kpis.daysBranch}`],
    ['Applicants with ≥ 3 active loans', `${kpis.multiShare}%`],
    ['Registered citizen accounts', formatNumber(kpis.accounts)],
    ['Own credit report views (last month)', formatNumber(kpis.reportViews)],
    ['Disputes filed online (last month)', formatNumber(kpis.disputesFiled)],
  ];
  return (
    <Card>
      <CardHeader
        icon={TrendingUp}
        title="Citizen & lending activity"
        subtitle={`Loan applications and borrower self-service — aggregated, as of ${LENDING_AS_OF}`}
        action={canOpen && <Link to="/gov/lending" className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline">Lending activity <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" /></Link>}
      />
      <CardBody>
        <dl className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2 xl:grid-cols-4">
          {items.map(([k, v]) => (
            <div key={k}>
              <dt className="text-[11px] text-slate-500">{k}</dt>
              <dd className="mt-0.5 text-lg font-semibold text-slate-900">{v}</dd>
            </div>
          ))}
        </dl>
        <p className="mt-4 text-xs text-slate-600">Most common decline reason: <b>{top.label}</b> ({top.pct}% of declines).</p>
        <p className="mt-1 text-xs text-slate-600">Personal credit report requests, 12 months: <b>{formatNumber(rr.requested)}</b> requested · <b>{formatNumber(rr.issued)}</b> issued · <b>{formatNumber(rr.rejected)}</b> rejected · median <b>{rr.lastMedian} h</b> to issue last month{rr.live.requested ? ` · ${rr.live.requested} since 1 Sep (${rr.live.open} awaiting CIC)` : ''}.</p>
      </CardBody>
    </Card>
  );
}
