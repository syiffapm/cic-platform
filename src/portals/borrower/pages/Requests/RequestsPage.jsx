import { Link } from 'react-router-dom';
import { ChevronRight, FileSearch, Plus } from 'lucide-react';
import { Card, CardBody, CardHeader, EmptyState, PageHeader } from '@/components/ui';
import { formatDate, formatDateTime, formatMMK } from '@/lib/format';
import { AuditFootnote, ButtonLink } from '../../components/Common';
import { GetReportCard, OpenRequestCard, RequestStatusBadge } from '../../components/ReportRequestCards';
import { useReportRequests } from '../../lib/reports';

/** My report requests: every request with its status, newest first. */
export default function RequestsPage() {
  const state = useReportRequests();
  const { requests, open, current, canRequest, correctedDispute } = state;

  return (
    <div>
      <PageHeader
        title="My report requests"
        subtitle="Each credit report is validated by CIC and approved by an officer before it is issued. Follow your requests here."
        actions={canRequest || correctedDispute ? <ButtonLink to={correctedDispute ? '/borrower/requests/new?purpose=corrected' : '/borrower/requests/new'} icon={Plus}>New request</ButtonLink> : null}
      />

      <div className="space-y-6">
        {open && <OpenRequestCard request={open} />}
        {!open && !current && <GetReportCard state={state} compact />}

        <Card>
          <CardHeader title="All requests" subtitle="Tap a request to see its checks, timeline and result." icon={FileSearch} />
          {requests.length === 0 ? (
            <CardBody><EmptyState title="You have not requested a report yet" description="Request your credit report to see your CIC score and every loan lenders have reported." action={<ButtonLink to="/borrower/requests/new" icon={Plus}>Request my credit report</ButtonLink>} /></CardBody>
          ) : (
            <ul className="divide-y divide-slate-100">
              {requests.map((r) => (
                <li key={r.id}>
                  <Link to={`/borrower/requests/${r.id}`} className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 hover:bg-slate-50">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-900"><span className="font-mono">{r.id}</span> · {r.purpose}</p>
                      <p className="text-xs text-slate-500">
                        Requested {formatDateTime(r.submittedAt)} · {r.fee ? formatMMK(r.fee) : 'Free'}
                        {r.result && <> · report {r.result.reportId}, valid until {formatDate(r.result.validUntil)}</>}
                      </p>
                    </div>
                    <span className="flex items-center gap-2">
                      <RequestStatusBadge status={r.status === 'Ready' && r.result && r.result.validUntil < state.today ? 'Expired' : r.status} />
                      <ChevronRight className="h-4 w-4 text-slate-500" aria-hidden="true" />
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <AuditFootnote action="Each request" />
    </div>
  );
}
