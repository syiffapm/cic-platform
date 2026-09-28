import { useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { CheckCircle2, FileText, MessageSquareReply, Paperclip, RefreshCcw, ShieldAlert } from 'lucide-react';
import { Alert, Card, CardBody, CardHeader, EmptyState, PageHeader, Timeline } from '@/components/ui';
import { DISPUTE_REASONS } from '@/data/reference';
import { formatDate } from '@/lib/format';
import { AuditFootnote, ButtonLink, Fact } from '../../components/Common';
import { DisputeBadge, DisputeStepper, SlaCountdown } from '../../components/DisputeStatus';
import { isOpenDispute, mfiName, useBorrowerAudit, useOwnDisputes } from '../../lib/borrower';
import { useMyFile } from '../../lib/myFile';
import { useReportRequests } from '../../lib/reports';

/** Dispute tracker: status stepper, SLA countdown, MFI response, outcome, corrected record, history. */
export default function DisputeDetail() {
  const { id } = useParams();
  const own = useOwnDisputes();
  const audit = useBorrowerAudit();
  const d = own.find((x) => x.id === id);
  const { loans } = useMyFile();
  const reissue = useReportRequests().correctedDispute;
  const logged = useRef(null);

  useEffect(() => {
    if (logged.current === id) return;
    logged.current = id;
    // Looking up someone else's case id is denied and logged.
    audit(d ? 'OWN_DISPUTE_VIEW' : 'DISPUTE_VIEW_DENIED', id, d ? {} : { outcome: 'Denied', purpose: 'Not owned by session borrower' });
  }, [audit, d, id]);

  if (!d) {
    return (
      <div>
        <PageHeader title="Dispute not found" breadcrumbs={[{ label: 'My disputes', to: '/borrower/disputes' }, { label: id }]} />
        <Card><EmptyState icon={ShieldAlert} title="We couldn't find this case in your account" description="You can only see disputes you filed yourself. If you think this is a mistake, contact the CIC helpdesk." action={<ButtonLink to="/borrower/disputes" variant="outline">Back to my disputes</ButtonLink>} /></Card>
      </div>
    );
  }

  const open = isOpenDispute(d);
  const loan = loans.find((l) => l.id === d.loanId);
  const reason = DISPUTE_REASONS.find((r) => r.code === d.reason)?.label ?? d.reason;
  const history = [...(d.history ?? [])].reverse().map((h, i) => ({ title: h.action, time: h.at, actor: h.by, tone: i === 0 && open ? 'current' : 'done' }));
  if (open) history.unshift({ title: d.status === 'Awaiting MFI' ? `Waiting for ${mfiName(d.mfiId)} to reply` : 'Waiting for CIC review', time: `Due ${formatDate(d.status === 'Awaiting MFI' ? d.mfiDueAt : d.dueAt)}`, tone: 'pending' });

  return (
    <div>
      <PageHeader
        title={`Dispute ${d.id}`}
        subtitle={`${reason} · ${mfiName(d.mfiId)}`}
        breadcrumbs={[{ label: 'My disputes', to: '/borrower/disputes' }, { label: d.id }]}
        actions={<DisputeBadge status={d.status} />}
      />

      <Card className="mb-6">
        <CardBody className="space-y-4">
          <DisputeStepper status={d.status} />
          <div className="flex flex-wrap gap-2">
            {d.status === 'Awaiting MFI' && <SlaCountdown dueAt={d.mfiDueAt} label="Lender must reply by" />}
            <SlaCountdown dueAt={d.dueAt} label="Case must close by" closed={!open} />
          </div>
          {d.status === 'Escalated' && <Alert tone="danger" title="Escalated to the Central Bank">The deadline was missed, so your case has been passed to CBM Consumer Protection. They will contact you.</Alert>}
        </CardBody>
      </Card>

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          <Card>
            <CardHeader title="What you told us" icon={FileText} />
            <CardBody className="space-y-4">
              <dl className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                <Fact label="Record" value={<span className="font-mono">{d.loanId}</span>} />
                <Fact label="Filed on" value={formatDate(d.filedAt)} />
                <Fact label="Filed through" value={d.channel === 'Portal 2' ? 'Borrower self-service (online)' : d.channel} />
              </dl>
              <p className="rounded-lg bg-slate-50 p-3 text-sm text-slate-700">&ldquo;{d.description}&rdquo;</p>
              {d.evidence?.length > 0 && (
                <ul className="flex flex-wrap gap-2">
                  {d.evidence.map((f) => (
                    <li key={f} className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 px-2.5 py-1 text-xs text-slate-600">
                      <Paperclip className="h-3 w-3" aria-hidden="true" /> {f} <span className="text-emerald-700">· scan clean</span>
                    </li>
                  ))}
                </ul>
              )}
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Lender's answer" subtitle={mfiName(d.mfiId)} icon={MessageSquareReply} />
            <CardBody>
              {d.mfiResponse ? <p className="text-sm text-slate-700">{d.mfiResponse}</p> : (
                <p className="text-sm text-slate-500">No answer yet. The lender has until <strong>{formatDate(d.mfiDueAt)}</strong> to reply. If they don&apos;t, CIC escalates the case automatically.</p>
              )}
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Outcome" icon={CheckCircle2} />
            <CardBody className="space-y-4">
              {d.outcome ? <Alert tone={d.status === 'Rejected' ? 'warning' : 'success'} title={d.status}>{d.outcome}</Alert> : <p className="text-sm text-slate-500">The final decision will appear here once CIC has reviewed the lender&apos;s answer.</p>}
              {d.outcome && d.reason === 'D04' && loan && (
                <div className="overflow-hidden rounded-lg border border-slate-200 text-xs">
                  <p className="bg-slate-50 px-3 py-2 font-semibold text-slate-700">Corrected record · {loan.id}</p>
                  <table className="w-full text-left">
                    <thead className="text-slate-500"><tr><th className="px-3 py-1.5">Field</th><th>Before</th><th>After</th></tr></thead>
                    <tbody className="divide-y divide-slate-100">
                      <tr><td className="px-3 py-1.5">Status</td><td className="text-red-700 line-through">Active</td><td className="font-semibold text-emerald-700">Closed</td></tr>
                      <tr><td className="px-3 py-1.5">Closed on</td><td>—</td><td className="font-semibold text-emerald-700">{formatDate(loan.closedAt)}</td></tr>
                      <tr><td className="px-3 py-1.5">Balance</td><td className="text-red-700 line-through">240,000 MMK</td><td className="font-semibold text-emerald-700">0 MMK</td></tr>
                    </tbody>
                  </table>
                </div>
              )}
              {d.outcome && d.reason !== 'D04' && d.correction && (
                <p className="text-xs text-slate-600">Corrected record: {d.correction}</p>
              )}
              {d.status === 'Resolved' && (
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-emerald-200 bg-emerald-50 p-3">
                  <p className="text-xs text-emerald-900">
                    {reissue?.id === d.id ? <><strong>Your record was corrected.</strong> Request an updated report so lenders and you see the corrected data — it is free.</> : 'Any report issued after this correction already shows the corrected data.'}
                  </p>
                  {reissue?.id === d.id && <ButtonLink to="/borrower/requests/new?purpose=corrected" size="sm" variant="warm" icon={RefreshCcw}>Request an updated report (free)</ButtonLink>}
                </div>
              )}
            </CardBody>
          </Card>
        </div>

        <Card>
          <CardHeader title="Case history" subtitle="Every step is recorded" />
          <CardBody><Timeline items={history} /></CardBody>
        </Card>
      </div>

      <AuditFootnote action="Opening this case" />
    </div>
  );
}
