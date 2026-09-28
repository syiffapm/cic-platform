import { useParams } from 'react-router-dom';
import { FileText, History } from 'lucide-react';
import { Alert, Badge, Card, CardBody, CardHeader, PageHeader, Timeline, useToast } from '@/components/ui';
import { useStore } from '@/context/StoreContext';
import { formatDate } from '@/lib/format';
import { nowStamp, useTenant } from '../../components/MfiState';
import SlaBadge from '../../components/SlaBadge';
import DisputeResponseForm from '../../components/DisputeResponseForm';
import TenantDenied from '../../components/TenantDenied';
import { OPEN, reasonLabel } from '../../components/disputeUtils';

function Pair({ label, children }) {
  return <div><dt className="text-[11px] text-slate-500">{label}</dt><dd className="text-sm font-medium text-slate-800">{children}</dd></div>;
}

/** Dispute detail: evidence, history, SLA, response and correction. */
export default function DisputeDetail() {
  const { disputeId } = useParams();
  const { user, tenant, can } = useTenant();
  const { disputes, patch, add, logAudit } = useStore();
  const toast = useToast();

  const found = disputes.find((d) => d.id === disputeId);
  const dispute = found && found.mfiId === tenant ? found : null;

  // Missing and other-institution disputes get the same answer; a cross-institution attempt is audited.
  if (!dispute) {
    return <TenantDenied module="Disputes" resource={`Dispute ${disputeId}`} crossTenant={!!found} backTo="/mfi/disputes" backLabel="Back to dispute inbox" />;
  }

  const canRespond = can('mfi.disputes', 'update');
  const isOpen = OPEN.includes(dispute.status);

  const onSubmit = ({ text, evidence, correction }) => {
    const at = nowStamp();
    const by = `${user.name} (${tenant === 'MFI-001' ? 'PGMF' : tenant})`;
    const entries = [{ at, by, action: correction ? `MFI responded and submitted correction: ${correction.field} “${correction.oldValue}” → “${correction.newValue}”` : 'MFI responded — data confirmed as reported' }];
    patch('disputes', dispute.id, (d) => ({
      status: correction ? 'Pending CIC approval' : 'MFI responded',
      mfiResponse: text,
      mfiEvidence: evidence,
      correction: correction ? { ...correction, by: user.name, at } : null,
      history: [...d.history, ...entries],
    }));
    if (correction) {
      add('approvals', {
        id: `APR-${Math.floor(5600 + Math.random() * 300)}`, type: 'Data correction', module: 'MFI · Disputes',
        summary: `${dispute.id}: ${correction.field} “${correction.oldValue}” → “${correction.newValue}” on ${dispute.loanId}`,
        maker: user.name, makerRole: user.role, checkerRole: 'adm_steward', status: 'Pending', createdAt: at,
        payload: {
          disputeId: dispute.id, loanId: dispute.loanId, tenant, ...correction,
          diff: [{ field: correction.field, from: correction.oldValue, to: correction.newValue }],
          effect: {
            target: 'store', collection: 'disputes', op: 'patch', id: dispute.id,
            changes: {
              status: 'Resolved',
              outcome: `Corrected — ${correction.field} changed from “${correction.oldValue}” to “${correction.newValue}”`,
              history: [...dispute.history, ...entries, { at: `${at} (+ CIC review)`, by: 'CIC Data Steward', action: 'Correction approved; new record version created and borrower notified' }],
            },
          },
        },
      });
    }
    logAudit({ actor: user.name, role: user.role, tenant, action: correction ? 'DISPUTE_CORRECTION_SUBMIT' : 'DISPUTE_RESPOND', module: 'Disputes', target: dispute.id, purpose: 'Dispute handling', outcome: correction ? 'Pending approval' : 'Success' });
    toast(correction ? 'Correction submitted to CIC for approval' : 'Response sent', 'success');
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={dispute.id}
        subtitle={`${reasonLabel(dispute.reason)} · filed ${formatDate(dispute.filedAt)} via ${dispute.channel}`}
        breadcrumbs={[{ label: 'Dispute inbox', to: '/mfi/disputes' }, { label: dispute.id }]}
        actions={<div className="flex flex-wrap items-center gap-2"><Badge status={dispute.status} tone={dispute.status === 'Pending CIC approval' ? 'violet' : undefined} /><SlaBadge due={dispute.mfiDueAt} done={!isOpen} /></div>}
      />

      <div className="grid gap-6 lg:grid-cols-3 [&>*]:min-w-0">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader title="Borrower's dispute" icon={FileText} />
            <CardBody className="space-y-4">
              <dl className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                <Pair label="Borrower">{dispute.borrowerName}<span className="block text-[11px] font-normal text-slate-500">{dispute.borrowerId}</span></Pair>
                <Pair label="Loan"><span className="font-mono text-xs">{dispute.loanId}</span></Pair>
                <Pair label="MFI response due">{formatDate(dispute.mfiDueAt)}</Pair>
                <Pair label="Resolution due (CIC)">{formatDate(dispute.dueAt)}</Pair>
              </dl>
              <blockquote className="rounded-lg bg-slate-50 p-3 text-sm text-slate-700">“{dispute.description}”</blockquote>
              <p className="text-xs text-slate-500">Borrower evidence: {dispute.evidence.length ? dispute.evidence.map((e) => <Badge key={e} tone="slate" className="mr-1">{e}</Badge>) : 'none'}</p>
              <p className="text-[11px] text-slate-500">The loan is flagged “under dispute” on every credit report until the case is closed.</p>
            </CardBody>
          </Card>

          {dispute.mfiResponse && (
            <Card>
              <CardHeader title="Your institution's response" />
              <CardBody className="space-y-2 text-sm text-slate-700">
                <p>{dispute.mfiResponse}</p>
                {dispute.correction && <p className="rounded-lg bg-violet-50 p-3 text-xs text-violet-900">Correction: <b>{dispute.correction.field}</b> “{dispute.correction.oldValue}” → “{dispute.correction.newValue}” · submitted by {dispute.correction.by} {dispute.correction.at}</p>}
                {dispute.mfiEvidence?.length > 0 && <p className="text-xs text-slate-500">Evidence: {dispute.mfiEvidence.join(', ')}</p>}
                {dispute.outcome && <Alert tone="success" title="Outcome">{dispute.outcome}</Alert>}
              </CardBody>
            </Card>
          )}

          {isOpen && canRespond && <DisputeResponseForm onSubmit={onSubmit} />}
          {isOpen && !canRespond && <Alert tone="info" title="View only">Your role cannot respond to disputes or submit corrections. A Dispute Officer or MFI Administrator handles the response.</Alert>}
        </div>

        <Card>
          <CardHeader title="Case history" subtitle="Every step is kept for audit" icon={History} />
          <CardBody>
            <Timeline items={dispute.history.map((h, i) => ({ title: h.action, time: h.at, actor: h.by, tone: i === dispute.history.length - 1 && isOpen ? 'current' : 'done' }))} />
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
