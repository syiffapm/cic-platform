import { Link } from 'react-router-dom';
import { FileSignature, Fingerprint, UserPlus, Users } from 'lucide-react';
import { Badge, Card, CardBody, CardHeader, StatCard } from '@/components/ui';
import { ACCOUNTS as SEED_ACCOUNTS } from '@/data/seed';
import { formatNumber } from '@/lib/format';
import { useAdminCollection } from '../../../context/AdminStore';
import { ID_TICKETS } from '../../../data/helpdesk';
import { CITIZEN_AS_OF, CITIZEN_OPS } from '../../../data/citizens';

const STATUSES = ['Submitted', 'Credit check', 'Approved', 'Rejected', 'Disbursed', 'Withdrawn'];
const STATUS_TONE = { Submitted: 'blue', 'Credit check': 'violet', Approved: 'green', Rejected: 'red', Disbursed: 'teal', Withdrawn: 'slate' };
const TODAY = '2026-09-25';

/** Citizen journey as operations sees it: accounts, verification queue, applications, consents. Aggregates only. */
export default function CitizenJourneyCard({ store, links = {} }) {
  const [tickets] = useAdminCollection('idTickets', ID_TICKETS);
  const { accounts = [], loanApplications = [] } = store;
  const liveRegistrations = Math.max(0, accounts.length - SEED_ACCOUNTS.length);
  const pendingTickets = tickets.filter((t) => !['Resolved', 'Closed'].includes(t.status)).length;
  const liveConsents = loanApplications.filter((a) => a.consent && a.consent.expiresAt >= TODAY && ['Submitted', 'Credit check'].includes(a.status)).length;
  const byStatus = STATUSES.map((s) => ({ status: s, count: loanApplications.filter((a) => a.status === s).length }));

  return (
    <section aria-label="Citizen journey" className="space-y-4">
      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <StatCard label={`Citizen accounts (+${formatNumber(CITIZEN_OPS.newThisWeek + liveRegistrations)} this week)`} value={formatNumber(CITIZEN_OPS.totalAccounts + liveRegistrations)} icon={Users} tone="navy"
          definition="Borrower portal accounts (verified and pending), excluding closed accounts" asOf={CITIZEN_AS_OF} />
        <StatCard label={`Identity checks pending (${pendingTickets} helpdesk tickets)`} value={formatNumber(CITIZEN_OPS.pendingVerification)} icon={Fingerprint} tone="warm"
          definition="Registrations waiting for eKYC review or a walk-in check; tickets are cases raised to the helpdesk" asOf={CITIZEN_AS_OF} />
        <StatCard label="Loan applications in flight" value={byStatus.filter((s) => ['Submitted', 'Credit check'].includes(s.status)).reduce((a, s) => a + s.count, 0)} icon={UserPlus} tone="teal"
          definition="Applications submitted with digital consent and not yet decided by the MFI" asOf={CITIZEN_AS_OF} />
        <StatCard label="Consents in force" value={formatNumber(CITIZEN_OPS.consentsInForce + liveConsents)} icon={FileSignature} tone="violet"
          definition="Borrower consents that allow an MFI one credit inquiry, not yet used or expired" asOf={CITIZEN_AS_OF} />
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader title="Verification method" subtitle="How citizen accounts were verified at registration"
            action={links.iam && <Link to="/gov/admin/iam/users?tab=citizens" className="text-xs font-medium text-primary hover:underline">Citizen accounts</Link>} />
          <CardBody className="space-y-3">
            {CITIZEN_OPS.verificationSplit.map((v) => (
              <div key={v.method}>
                <div className="flex justify-between text-xs"><span className="text-slate-700">{v.method}</span><span className="font-semibold text-slate-900">{v.pct}%</span></div>
                <div className="mt-1 h-2 rounded-full bg-slate-100"><div className="h-2 rounded-full bg-primary" style={{ width: `${v.pct}%` }} /></div>
              </div>
            ))}
          </CardBody>
        </Card>
        <Card>
          <CardHeader title="Loan applications by status" subtitle="Online and branch applications tracked through the platform"
            action={links.helpdesk && <Link to="/gov/admin/helpdesk" className="text-xs font-medium text-primary hover:underline">Helpdesk</Link>} />
          <CardBody>
            <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {byStatus.map((s) => (
                <li key={s.status} className="flex items-center justify-between rounded-lg border border-slate-100 px-3 py-2">
                  <Badge tone={STATUS_TONE[s.status]}>{s.status}</Badge><span className="text-sm font-semibold text-slate-900">{s.count}</span>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-[11px] text-slate-500">Counts only. Application details are visible to the chosen MFI and the applicant.</p>
          </CardBody>
        </Card>
      </div>
    </section>
  );
}
