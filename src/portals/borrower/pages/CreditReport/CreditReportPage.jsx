import { useEffect, useRef } from 'react';
import { Building2, Eye, FileDown, Flag } from 'lucide-react';
import { Alert, Card, CardBody, CardHeader, PageHeader, StatCard } from '@/components/ui';
import { formatDate, formatMMK } from '@/lib/format';
import { AuditFootnote, ButtonLink } from '../../components/Common';
import LoanCard from '../../components/LoanCard';
import NextSteps from '../../components/NextSteps';
import { RepaymentLegend } from '../../components/RepaymentGrid';
import { GetReportCard, validityText } from '../../components/ReportRequestCards';
import { GuaranteesBlock, IdentityBlock, NoHitResult } from '../../components/ReportSections';
import ScoreCard from '../../components/ScoreCard';
import { isOpenDispute, mfiName, useBorrower, useBorrowerAudit, useOwnDisputes } from '../../lib/borrower';
import { useMyFile } from '../../lib/myFile';
import { useReportRequests } from '../../lib/reports';

/**
 * My credit report: the issued report snapshot (score, loans by lender, guarantees, dispute flags), exactly
 * as CIC approved it. Without a valid report the citizen is sent to request one.
 */
export default function CreditReportPage() {
  const user = useBorrower();
  const audit = useBorrowerAudit();
  const disputes = useOwnDisputes();
  const { file } = useMyFile();
  const state = useReportRequests();
  const r = state.snapshot;
  const logged = useRef(null);

  useEffect(() => {
    if (!user || !r || logged.current === r.reportId) return;
    logged.current = r.reportId;
    audit('OWN_REPORT_VIEW', r.reportId);
  }, [audit, user, r]);

  if (!file) {
    return (
      <div>
        <PageHeader title="My credit report" />
        <Alert tone="warning" title="We could not open your file">Your account is not linked to a CIC file yet. Please call the helpdesk on 1800 242 242 with your NRC.</Alert>
      </div>
    );
  }

  if (!r) {
    return (
      <div>
        <PageHeader title="My credit report" subtitle="Your report is issued on request, after CIC has validated the data and an officer has approved it." />
        <GetReportCard state={state} />
        <AuditFootnote action="Each view of your report" />
      </div>
    );
  }

  const loans = r.loanViews;
  const byMfi = loans.reduce((acc, l) => ({ ...acc, [l.mfiId]: [...(acc[l.mfiId] ?? []), l] }), {});
  const disputeFor = (loanId) => disputes.find((d) => d.loanId === loanId && isOpenDispute(d)) ?? disputes.find((d) => d.loanId === loanId);

  return (
    <div>
      <PageHeader
        title="My credit report"
        subtitle={`This is what a lender sees when you give consent. Report ${r.reportId}, issued ${formatDate(r.generatedAt)}. ${validityText(r.validUntil)}.`}
        actions={<><ButtonLink to="/borrower/report/print" variant="outline" icon={FileDown}>Download PDF</ButtonLink><ButtonLink to="/borrower/disputes/new" variant="warm">Something wrong? File a dispute</ButtonLink></>}
      />

      <div className="space-y-6">
        {state.correctedDispute && (
          <Alert tone="success" title="Your record was corrected — request an updated report (free)">
            Dispute {state.correctedDispute.id} was resolved after this report was issued, so this report still shows the old data.{' '}
            <ButtonLink to="/borrower/requests/new?purpose=corrected" size="sm" variant="warm" className="mt-2">Request an updated report</ButtonLink>
          </Alert>
        )}

        <ScoreCard report={r} dataAsOf={r.dataAsOf} showLink={false} />

        {!r.noHit && (
          <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
            <StatCard label="Active loans" value={r.activeCount} icon={Building2} tone="navy" definition={`With ${r.lenders} lender(s).`} asOf={formatDate(r.dataAsOf)} />
            <StatCard label="Total owed" value={formatMMK(r.exposure, { compact: true })} icon={FileDown} tone="warm" definition="Sum of balances on active loans, excluding guarantees." asOf={formatDate(r.dataAsOf)} />
            <StatCard label="Checks in last 12 months" value={r.inquiriesCount} icon={Eye} tone="teal" definition="Credit checks made by lenders with your consent." asOf={formatDate(r.generatedAt)} />
            <StatCard label="Records under dispute" value={r.disputeFlags.length} icon={Flag} tone={r.disputeFlags.length ? 'violet' : 'green'} definition="Shown to lenders with a “disputed” flag, never scored." asOf={formatDate(r.generatedAt)} />
          </div>
        )}

        <NextSteps state={state} compact />

        <IdentityBlock file={file} />

        {r.noHit ? <NoHitResult /> : (
          <Card>
            <CardHeader title="My loans, grouped by lender" subtitle={`Based on information your lenders sent up to ${formatDate(r.dataAsOf)}. Each loan shows when its lender last updated it.`} icon={Building2} />
            <CardBody className="space-y-6">
              <RepaymentLegend />
              {Object.entries(byMfi).map(([mfiId, list]) => (
                <section key={mfiId} aria-labelledby={`mfi-${mfiId}`}>
                  <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2 border-b border-slate-100 pb-2">
                    <h3 id={`mfi-${mfiId}`} className="text-sm font-bold text-primary">{mfiName(mfiId)}</h3>
                    <p className="text-xs text-slate-500">{list.length} loan{list.length > 1 ? 's' : ''} · owed {formatMMK(list.reduce((s, l) => s + l.balance, 0))}</p>
                  </div>
                  <div className="space-y-3">
                    {list.map((l) => <LoanCard key={l.id} loan={l} dispute={disputeFor(l.id)} sourceName={mfiName(l.mfiId)} />)}
                  </div>
                </section>
              ))}
            </CardBody>
          </Card>
        )}

        {!r.noHit && <GuaranteesBlock guarantees={r.guaranteeViews} />}

        <Alert tone="info" title="Who decides on my loan?">
          CIC does not approve or refuse loans. Each lender decides using this report, the same CIC grade you see here, and its own checks.
        </Alert>
      </div>

      <AuditFootnote action="Each view and download of your report" />
    </div>
  );
}
