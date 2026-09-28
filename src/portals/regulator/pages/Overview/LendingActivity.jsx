import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Banknote, Clock, FileSearch, Globe, Percent, Scale, UserPlus, UsersRound } from 'lucide-react';
import { useSession } from '@/context/AuthContext';
import { useStore } from '@/context/StoreContext';
import { formatNumber } from '@/lib/format';
import { Alert, Badge, Card, CardBody, CardHeader, PageHeader, StatCard } from '@/components/ui';
import { ExportButtons } from '../../components/common';
import useLendingData from '../../components/lending/useLendingData';
import { AdoptionChart, ApprovalChart, ChannelChart, DecisionTimeChart, DeclineReasonsChart, DisbursedChart } from '../../components/lending/LendingCharts';
import ReportRequestsPanel from '../../components/lending/ReportRequestsPanel';
import { LENDING_AS_OF, VERIFICATION_SPLIT } from '../../data/lending';
import { downloadCsv } from '../../lib/util';

const PERIODS = [['3m', '3 months'], ['6m', '6 months'], ['12m', '12 months']];
const STATUS_TONE = { Submitted: 'blue', 'Credit check': 'violet', Approved: 'green', Rejected: 'red', Disbursed: 'teal', Withdrawn: 'slate' };

export default function LendingActivity() {
  const user = useSession('gov');
  const { logAudit } = useStore();
  const [period, setPeriod] = useState('12m');
  const { months, kpis, declines, byRegion, byMfi, pipeline } = useLendingData(period);
  const periodLabel = PERIODS.find(([id]) => id === period)[1];

  const tiles = [
    { label: `Applications (${periodLabel})`, value: formatNumber(kpis.applications), icon: FileSearch, tone: 'navy', definition: 'Loan applications received by all reporting MFIs, online and at branches.' },
    { label: 'Applied online', value: `${kpis.onlineShare}%`, icon: Globe, tone: 'teal', delta: kpis.onlineDelta, deltaLabel: 'vs previous month', definition: 'Share of last month\'s applications made through the Borrower portal with digital consent.' },
    { label: 'Approval rate', value: `${kpis.approvalRate}%`, icon: Percent, tone: 'green', definition: 'Approved ÷ (approved + declined) over the period. Withdrawn and pending applications are excluded.' },
    { label: 'Median time to decision', value: `${kpis.daysOnline} / ${kpis.daysBranch} d`, icon: Clock, tone: 'warm', definition: 'Median days from application to the MFI decision last month — online / branch.' },
    { label: `Disbursed (${periodLabel})`, value: `${formatNumber(kpis.disbursedBn)} bn MMK`, icon: Banknote, tone: 'navy', definition: 'Principal of new loans disbursed from approved applications, as reported to the registry.' },
    { label: 'Applicants with ≥ 3 active loans', value: `${kpis.multiShare}%`, icon: UsersRound, tone: 'violet', definition: `Share of last month's applicants who already held 3 or more active loans across MFIs (over-indebtedness signal). ${formatNumber(kpis.multiApps)} applications in the period.` },
    { label: `Citizen accounts (+${formatNumber(kpis.newAccounts)} last month)`, value: formatNumber(kpis.accounts), icon: UserPlus, tone: 'teal', definition: 'Borrower portal accounts with verified identity.' },
    { label: 'Disputes filed online', value: formatNumber(kpis.disputesFiled), icon: Scale, tone: 'red', definition: `Disputes filed by citizens through the Borrower portal last month. Own credit report views: ${formatNumber(kpis.reportViews)}.` },
  ];

  const exportCsv = () => {
    downloadCsv(`lending-activity-${period}-${LENDING_AS_OF.replace(/ /g, '')}.csv`, [
      ...months.map((m) => ({ section: 'Monthly', item: m.month, online: m.online, branch: m.branch, approvalRate: m.approvalRate, daysOnline: m.daysOnline, daysBranch: m.daysBranch, disbursedBn: m.disbursedBn, multiShare: m.multiShare })),
      ...declines.map((d) => ({ section: 'Decline reason', item: d.label, online: '', branch: '', approvalRate: '', daysOnline: '', daysBranch: '', disbursedBn: '', multiShare: d.count })),
    ]);
    logAudit({ actor: user.name, role: user.role, tenant: 'CBM', action: 'REPORT_EXPORT', module: 'Lending activity', target: `Aggregates ${period}`, outcome: 'Success' });
  };

  return (
    <div>
      <PageHeader
        title="Lending activity"
        subtitle={`How citizens apply for and receive microfinance loans — online and at branches. Aggregated figures only; no names or NRCs. As of ${LENDING_AS_OF}.`}
        actions={(
          <>
            <div role="group" aria-label="Period" className="flex rounded-lg border border-slate-200 bg-white p-0.5 text-xs">
              {PERIODS.map(([id, label]) => (
                <button key={id} type="button" aria-pressed={period === id} onClick={() => setPeriod(id)}
                  className={`rounded-md px-2.5 py-1 font-medium ${period === id ? 'bg-primary text-white' : 'text-slate-600 hover:bg-slate-100'}`}>{label}</button>
              ))}
            </div>
            <ExportButtons onCsv={exportCsv} />
          </>
        )}
      />

      <section aria-label="Lending indicators" className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        {tiles.map((t) => <StatCard key={t.label} {...t} asOf={LENDING_AS_OF} />)}
      </section>

      <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-2">
        <ChannelChart data={months} />
        <ApprovalChart data={months} />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-2">
        <DeclineReasonsChart data={declines} />
        <DecisionTimeChart data={months} />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="xl:col-span-2"><DisbursedChart byRegion={byRegion} byMfi={byMfi} /></div>
        <Card>
          <CardHeader title="Live application pipeline" subtitle="Applications currently tracked through the platform, by status" />
          <CardBody className="space-y-3 text-sm">
            <ul className="space-y-1.5">
              {pipeline.byStatus.map((s) => (
                <li key={s.status} className="flex items-center justify-between"><Badge tone={STATUS_TONE[s.status]}>{s.status}</Badge><span className="font-semibold text-slate-800">{s.count}</span></li>
              ))}
            </ul>
            <p className="border-t border-slate-100 pt-3 text-xs text-slate-600">Channel: <b>{pipeline.online}</b> online · <b>{pipeline.branch}</b> branch-assisted</p>
            {pipeline.allMulti > 0 && (
              <Alert tone="warning">{pipeline.allMulti} of {pipeline.total} applications come from borrowers already holding 3 or more active loans{pipeline.openMulti ? ` (${pipeline.openMulti} still awaiting a decision)` : ''}.</Alert>
            )}
            <Link to="/gov/over-indebtedness" className="inline-block text-xs font-medium text-primary hover:underline">Over-indebtedness monitor →</Link>
          </CardBody>
        </Card>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="xl:col-span-2"><AdoptionChart data={months} /></div>
        <Card>
          <CardHeader title="How citizens verify their identity" subtitle="Share of registered accounts by verification method" />
          <CardBody className="space-y-3">
            {VERIFICATION_SPLIT.map((v) => (
              <div key={v.method}>
                <div className="flex justify-between text-xs"><span className="text-slate-700">{v.method}</span><span className="font-semibold text-slate-900">{v.pct}%</span></div>
                <div className="mt-1 h-2 rounded-full bg-slate-100"><div className="h-2 rounded-full bg-primary" style={{ width: `${v.pct}%` }} /></div>
              </div>
            ))}
            <p className="pt-1 text-[11px] text-slate-500">As of {LENDING_AS_OF}. Registered accounts can see their own report, who viewed it, apply for loans and file disputes.</p>
          </CardBody>
        </Card>
      </div>

      <section aria-label="Personal credit report requests" className="mt-6">
        <ReportRequestsPanel />
      </section>
    </div>
  );
}
