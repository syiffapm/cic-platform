import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { AlertTriangle, CheckCircle2, Download, FileWarning, Inbox, Loader2, Trash2 } from 'lucide-react';
import { Alert, Badge, Card, CardBody, CardHeader, DataTable, PageHeader, StatCard, useToast } from '@/components/ui';
import { useStore } from '@/context/StoreContext';
import { formatNumber } from '@/lib/format';
import { errorsFor } from '../../data/batches';
import { nowStamp, patchIn, useMfi, useTenant } from '../../components/MfiState';
import BatchStatus from '../../components/BatchStatus';
import TenantDenied from '../../components/TenantDenied';
import PipelineStatus from '../../components/PipelineStatus';
import { ApprovalPanel, ATTESTATION, ReceiptCard, ReconciliationPanel } from '../../components/BatchPanels';
import { downloadFile, toCsv } from '../../components/download';
import { receiptExtra, usePipeline } from '../../components/pipeline';
import { PermButton, ViewOnlyBanner } from '../../components/access';
import ConfirmDialog from '../../components/ConfirmDialog';

const PROCESSING = ['Uploaded', 'Validating', 'Approved', 'Identity resolution'];
/** Batches not yet signed off can be withdrawn by a user with delete rights; nothing from them was loaded. */
const WITHDRAWABLE = ['Awaiting approval', 'Rejected by checker', 'Validation failed'];

/** Batch validation report, reconciliation, maker-checker and receipt. */
export default function BatchDetail() {
  const { batchId } = useParams();
  const { user, tenant, can } = useTenant();
  const { batches, update } = useMfi();
  const [withdrawing, setWithdrawing] = useState(false);
  const { logAudit } = useStore();
  const runPipeline = usePipeline();
  const toast = useToast();

  // Tenant isolation: a batch ID from another tenant resolves to "not found", exactly as the API would answer.
  const batch = batches.find((b) => b.id === batchId && b.tenant === tenant);
  const errors = useMemo(() => (batch && batch.received ? errorsFor(batch) : []), [batch]);

  if (!batch) {
    return <TenantDenied module="Submission" resource={`Batch ${batchId}`} crossTenant={batches.some((b) => b.id === batchId)} backTo="/mfi/submissions" backLabel="Back to submissions" />;
  }

  const actor = { actor: user.name, role: user.role, tenant };

  const approve = ({ signature, comment }) => {
    if (!can('mfi.submissions', 'approve') || batch.uploadedBy === user.id) return;
    const at = nowStamp();
    update('batches', patchIn(batch.id, { status: 'Approved', approvedBy: user.name, approvedAt: at, attestation: { text: ATTESTATION, signature, comment, at } }));
    logAudit({ ...actor, action: 'BATCH_APPROVE', module: 'Submission', target: batch.id, purpose: 'Attestation signed', outcome: 'Success' });
    runPipeline(batch.id, [
      { status: 'Identity resolution', delay: 1500 },
      { status: 'Loaded', delay: 2500, extra: receiptExtra(batch) },
    ]);
    toast('Batch approved and attestation signed — loading started', 'success');
  };

  const returnToMaker = (comment) => {
    if (!can('mfi.submissions', 'approve')) return;
    update('batches', patchIn(batch.id, { status: 'Rejected by checker', returnedBy: user.name, returnComment: comment }));
    logAudit({ ...actor, action: 'BATCH_RETURN', module: 'Submission', target: batch.id, outcome: 'Returned to maker' });
    toast('Batch returned to maker', 'warning');
  };

  const downloadErrors = () => {
    downloadFile(`${batch.id}-errors.csv`, toCsv(errors, [
      { key: 'row', header: 'Row' }, { key: 'loanId', header: 'Loan ID' }, { key: 'field', header: 'Field' }, { key: 'code', header: 'Code' },
      { key: 'severity', header: 'Severity' }, { key: 'value', header: 'Value' }, { key: 'message', header: 'Message' },
    ]));
    logAudit({ ...actor, action: 'VALIDATION_REPORT_DOWNLOAD', module: 'Submission', target: batch.id, outcome: 'Success' });
  };

  const withdraw = () => {
    update('batches', patchIn(batch.id, { status: 'Withdrawn', withdrawnBy: user.name, withdrawnAt: nowStamp() }));
    logAudit({ ...actor, action: 'BATCH_WITHDRAW', module: 'Submission', target: batch.id, outcome: 'Success' });
    toast(`Batch ${batch.id} withdrawn — kept for audit, nothing was loaded`, 'warning');
    setWithdrawing(false);
  };

  const processing = PROCESSING.includes(batch.status);

  return (
    <div className="space-y-6">
      <PageHeader
        title={batch.id}
        subtitle={`${batch.fileName} · period ${batch.period} · schema ${batch.schema} · ${batch.channel} · uploaded ${batch.uploadedAt} by ${batch.uploadedByName}`}
        breadcrumbs={[{ label: 'Submissions', to: '/mfi/submissions' }, { label: batch.id }]}
        actions={(
          <div className="flex items-center gap-2">
            <BatchStatus status={batch.status} />
            {WITHDRAWABLE.includes(batch.status) && <PermButton hide feature="mfi.submissions" action="delete" what="withdraw batches" size="sm" variant="outline" icon={Trash2} className="text-red-700" onClick={() => setWithdrawing(true)}>Withdraw batch</PermButton>}
          </div>
        )}
      />
      <ViewOnlyBanner feature="mfi.submissions" />

      <Card>
        <CardBody className="space-y-3">
          <PipelineStatus status={batch.status} />
          {processing && <p className="flex items-center gap-2 text-xs text-slate-500"><Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" /> Processing — this page updates automatically.</p>}
          {batch.resubmissionOf && <p className="text-xs text-slate-500">Resubmission of <Link className="font-medium text-primary hover:underline" to={`/mfi/submissions/${batch.resubmissionOf}`}>{batch.resubmissionOf}</Link> — loans upserted by loan ID, no duplicates created.</p>}
        </CardBody>
      </Card>

      {batch.status === 'Validation failed' && (
        <Alert tone="danger" title="Validation failed — batch rejected">
          {formatNumber(batch.rejected)} rows failed schema or rule checks and totals do not reconcile. Nothing from this batch was loaded. Download the error report, fix the file and upload it again for period {batch.period}.
        </Alert>
      )}
      {batch.status === 'Withdrawn' && <Alert tone="info" title={`Withdrawn by ${batch.withdrawnBy ?? 'the institution'}${batch.withdrawnAt ? ` · ${batch.withdrawnAt}` : ''}`}>Nothing from this batch was loaded. It is kept for audit.</Alert>}
      {batch.status === 'Rejected by checker' && <Alert tone="warning" title={`Returned to maker by ${batch.returnedBy}`}>{batch.returnComment}</Alert>}

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatCard label="Received" value={batch.received ? formatNumber(batch.received) : '…'} icon={Inbox} tone="navy" definition="Rows read from the file." />
        <StatCard label="Accepted" value={batch.received ? formatNumber(batch.accepted) : '…'} icon={CheckCircle2} tone="green" definition="Rows passing all error-level rules (may still carry warnings)." />
        <StatCard label="Rejected" value={batch.received ? formatNumber(batch.rejected) : '…'} icon={FileWarning} tone="red" definition="Rows with at least one error code; not loaded." />
        <StatCard label="Warnings" value={batch.received ? formatNumber(batch.warnings) : '…'} icon={AlertTriangle} tone="warm" definition="Accepted rows with data-quality warnings that lower the DQ score." />
      </div>

      {batch.status === 'Loaded' && batch.receiptNo && <ReceiptCard batch={batch} />}

      <div className="grid gap-6 xl:grid-cols-2 [&>*]:min-w-0">
        <ReconciliationPanel batch={batch} />
        {batch.status === 'Awaiting approval' && <ApprovalPanel batch={batch} user={user} canApprove={can('mfi.submissions', 'approve')} onApprove={approve} onReturn={returnToMaker} />}
        {batch.attestation && (
          <Card>
            <CardHeader title="Attestation" subtitle={`Signed by ${batch.attestation.signature} · ${batch.attestation.at}`} />
            <CardBody className="text-xs text-slate-600">{batch.attestation.text}{batch.attestation.comment && <p className="mt-2 text-slate-500">Comment: {batch.attestation.comment}</p>}</CardBody>
          </Card>
        )}
      </div>

      <Card>
        <CardHeader
          title="Row-level validation report"
          subtitle={errors.length ? `Showing first ${errors.length} of ${formatNumber(batch.rejected + batch.warnings)} issues — download the errors CSV for the full list` : 'Available once validation completes'}
          action={errors.length > 0 && <PermButton feature="mfi.submissions" action="export" what="export validation reports" size="sm" variant="outline" icon={Download} onClick={downloadErrors}>Download errors CSV</PermButton>}
        />
        <DataTable
          dense
          rows={errors}
          searchKeys={['code', 'field', 'loanId', 'message']}
          emptyTitle={batch.received ? 'No issues' : 'Validation in progress'}
          columns={[
            { key: 'row', header: 'Row', sortable: true },
            { key: 'loanId', header: 'Loan ID', className: 'font-mono text-xs' },
            { key: 'field', header: 'Field', className: 'font-mono text-xs' },
            { key: 'code', header: 'Code', sortable: true, render: (r) => <Badge tone={r.severity === 'Error' ? 'red' : 'amber'}>{r.code}</Badge> },
            { key: 'value', header: 'Value', render: (r) => (r.value ? <span className="font-mono text-xs">{r.value}</span> : <span className="text-xs text-slate-500">(empty)</span>) },
            { key: 'message', header: 'Message' },
          ]}
        />
      </Card>

      <ConfirmDialog
        open={withdrawing}
        onClose={() => setWithdrawing(false)}
        title={`Withdraw ${batch.id}?`}
        subtitle={`${batch.fileName} · period ${batch.period}`}
        confirmLabel="Withdraw batch"
        confirmIcon={Trash2}
        onConfirm={withdraw}
      >
        <p>The batch will not be loaded to the registry and can no longer be signed off.</p>
        <p className="text-xs text-slate-500">It stays in the list with status Withdrawn for audit. Upload a new file for period {batch.period} when ready.</p>
      </ConfirmDialog>
    </div>
  );
}
