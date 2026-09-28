import { Link } from 'react-router-dom';
import { ChevronRight, FileText, HandCoins, Plus, Wallet } from 'lucide-react';
import { Card, CardBody, CardHeader, DataTable, EmptyState, PageHeader, StatCard } from '@/components/ui';
import { formatDate, formatDateTime, formatMMK } from '@/lib/format';
import { AuditFootnote, ButtonLink } from '../../components/Common';
import { AppStatusBadge } from '../../components/LoanApp';
import { mfiName, useOwnApplications } from '../../lib/borrower';
import { useMyFile } from '../../lib/myFile';

/** My loans: online applications and a summary of the active loans on the credit file. */
export default function LoansPage() {
  const apps = useOwnApplications();
  const { loans, dataAsOf } = useMyFile();
  const active = loans.filter((l) => l.status === 'Active');
  const owed = active.reduce((s, l) => s + l.balance, 0);
  const inProgress = apps.filter((a) => ['Submitted', 'Credit check', 'Approved'].includes(a.status));

  return (
    <div>
      <PageHeader
        title="My loans"
        subtitle="Apply online to a licensed MFI, follow your applications, and see the loans you are repaying."
        actions={<ButtonLink to="/borrower/loans/apply" icon={Plus}>Apply for a loan</ButtonLink>}
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
        <StatCard label="Active loans" value={active.length} icon={FileText} tone="navy" definition="Loans you are still repaying, as reported to CIC." asOf={formatDate(dataAsOf)} />
        <StatCard label="Total owed" value={formatMMK(owed, { compact: true })} icon={Wallet} tone="warm" definition="Sum of balances on active loans." asOf={formatDate(dataAsOf)} />
        <StatCard className="col-span-2 sm:col-span-1" label="Applications in progress" value={inProgress.length} icon={HandCoins} tone="teal" definition="Submitted, being checked, or approved and waiting for disbursement." asOf={formatDate(new Date())} />
      </div>

      <Card className="mt-6">
        <CardHeader title="My applications" subtitle="Newest first. Tap one to see its progress." icon={HandCoins} />
        {apps.length === 0 ? (
          <CardBody>
            <EmptyState title="You have not applied online yet" description="Choose a licensed lender, tell them what you need, and give a one-time consent for a credit check." action={<ButtonLink to="/borrower/loans/apply" icon={Plus}>Start an application</ButtonLink>} />
          </CardBody>
        ) : (
          <ul className="divide-y divide-slate-100">
            {apps.map((a) => (
              <li key={a.id}>
                <Link to={`/borrower/loans/${a.id}`} className="flex flex-wrap items-center gap-3 px-5 py-4 hover:bg-slate-50">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-slate-900">{a.product} · {formatMMK(a.amount)} · {a.tenor} months</p>
                    <p className="text-xs text-slate-500">{mfiName(a.mfiId)} · <span className="font-mono">{a.id}</span> · submitted {formatDateTime(a.submittedAt)}</p>
                    {a.loanId && <p className="mt-0.5 text-xs text-teal-700">Loan number {a.loanId}</p>}
                  </div>
                  <AppStatusBadge status={a.status} />
                  <ChevronRight className="h-4 w-4 text-slate-500" aria-hidden="true" />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card className="mt-6">
        <CardHeader title="Loans I am repaying" subtitle={`As reported by lenders up to ${formatDate(dataAsOf)}.`} icon={Wallet} action={<Link to="/borrower/report" className="text-xs font-semibold text-primary hover:underline">Full details in my report</Link>} />
        {active.length === 0 ? <CardBody><EmptyState compact icon={Wallet} title="No active loans on your file" description="Loans appear here after the lender's first monthly update to CIC. If a loan is missing, ask your lender to check your NRC." /></CardBody> : (
          <DataTable
            dense
            rows={active}
            columns={[
              { key: 'lender', header: 'Lender', render: (l) => <span className="font-medium text-slate-800">{mfiName(l.mfiId)}</span> },
              { key: 'loan', header: 'Loan', render: (l) => <span><span className="block">{l.product}</span><span className="font-mono text-[11px] text-slate-500">{l.id}</span></span> },
              { key: 'balance', header: 'Still owed', className: 'text-right', render: (l) => <span className="font-semibold">{formatMMK(l.balance)}</span> },
              { key: 'dpd', header: 'Payments', render: (l) => (l.dpd === 0 ? <span className="text-emerald-700">Up to date</span> : <span className="font-semibold text-red-700">{l.dpd} days late</span>) },
              { key: 'ends', header: 'Ends', render: (l) => formatDate(l.maturityAt) },
            ]}
          />
        )}
      </Card>

      <AuditFootnote action="Opening your loans" />
    </div>
  );
}
