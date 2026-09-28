import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Download, FileCheck2, Upload } from 'lucide-react';
import { Alert, Button, Card, CardHeader, DataTable, MakerCheckerBanner, PageHeader, StatCard, useToast } from '@/components/ui';
import { useStore } from '@/context/StoreContext';
import { formatNumber } from '@/lib/format';
import { useMfi, useTenant, nowStamp } from '../../components/MfiState';
import BatchStatus from '../../components/BatchStatus';
import PipelineStatus from '../../components/PipelineStatus';
import UploadBatchModal from '../../components/UploadBatchModal';
import { templateCsv, usePipeline } from '../../components/pipeline';
import { downloadFile } from '../../components/download';
import { PermButton, ViewOnlyBanner } from '../../components/access';
import BulkSignOffDialog from '../../components/BulkSignOffDialog';
import { ATTESTATION } from '../../components/BatchPanels';
import { receiptExtra } from '../../components/pipeline';
import { STRONG } from '../../components/buttonTones';

const reconciled = (b) => !!b.computed && b.computed.records === b.control.records && b.computed.outstanding === b.control.outstanding;

/** Submission batches. */
export default function SubmissionList() {
  const { user, tenant, institution, can } = useTenant();
  const { batches, update } = useMfi();
  const { logAudit } = useStore();
  const runPipeline = usePipeline();
  const toast = useToast();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [duplicate, setDuplicate] = useState(null);
  const [selected, setSelected] = useState([]);
  const [signing, setSigning] = useState(false);

  const own = batches.filter((b) => b.tenant === tenant);
  const short = institution?.short ?? 'PGMF';

  const onSubmit = (p) => {
    const derivedId = p.batchId || null;
    const existing = own.find((b) => (derivedId && b.id === derivedId) || (b.period === p.period && b.fileName === p.fileName));
    if (existing) {
      const reason = existing.id === derivedId ? `Batch ID ${derivedId} was already received.` : `The file “${p.fileName}” for period ${p.period} was already received.`;
      setDuplicate({ existing, reason });
      logAudit({ actor: user.name, role: user.role, tenant, action: 'BATCH_UPLOAD_DUPLICATE', module: 'Submission', target: existing.id, outcome: 'Idempotent — no new records' });
      toast('Duplicate batch detected — no new loans created', 'warning');
      return;
    }
    const stamp = nowStamp();
    const prefix = `BAT-${short}-${stamp.slice(0, 7)}-`;
    const letter = String.fromCharCode(65 + own.filter((b) => b.id.startsWith(prefix)).length);
    const id = derivedId || `${prefix}${letter}`;
    const fail = /error|fail/i.test(p.fileName);
    const rec = p.control.records;
    const rejected = fail ? Math.round(rec * 0.074) : Math.round(rec * 0.0022);
    const batch = {
      id, tenant, period: p.period, fileName: p.fileName, format: p.format, schema: p.schema, channel: 'Portal',
      uploadedBy: user.id, uploadedByName: user.name, uploadedAt: stamp, status: 'Uploaded',
      received: 0, accepted: 0, rejected: 0, warnings: 0, control: p.control, computed: null,
    };
    update('batches', (list) => [batch, ...list]);
    logAudit({ actor: user.name, role: user.role, tenant, action: 'BATCH_UPLOAD', module: 'Submission', target: id, outcome: 'Success' });
    runPipeline(id, [
      { status: 'Validating', delay: 900 },
      {
        status: fail ? 'Validation failed' : 'Awaiting approval',
        delay: 2600,
        extra: {
          received: rec, accepted: rec - rejected, rejected, warnings: Math.round(rec * (p.schema === 'v3.1' ? 0.011 : 0.0045)),
          computed: { records: rec, outstanding: fail ? Math.round(p.control.outstanding * 0.953) : p.control.outstanding },
        },
      },
    ]);
    setDuplicate(null);
    setOpen(false);
    toast(`Batch ${id} uploaded — validation started`, 'info');
    navigate(`/mfi/submissions/${id}`);
  };

  /** The template is a read-only resource (no borrower data), so anyone who can open this page may download it. */
  const downloadTemplate = (schema = 'v3.2') => {
    downloadFile(`cic-submission-template-${schema}.csv`, templateCsv(schema));
    logAudit({ actor: user.name, role: user.role, tenant, action: 'TEMPLATE_DOWNLOAD', module: 'Submission', target: `cic-submission-template-${schema}.csv`, outcome: 'Success' });
  };

  const count = (s) => own.filter((b) => b.status === s).length;

  // Checker bulk sign-off: only batches awaiting approval, reconciled, and not uploaded by the signed-in user.
  const checker = can('mfi.submissions', 'approve');
  const signable = (b) => checker && b.status === 'Awaiting approval' && b.uploadedBy !== user.id && reconciled(b);
  const eligible = own.filter(signable);
  const chosen = eligible.filter((b) => selected.includes(b.id));
  const toggle = (id) => setSelected((ids) => (ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]));
  const allOn = eligible.length > 0 && chosen.length === eligible.length;

  const signOff = ({ signature, comment }) => {
    const at = nowStamp();
    const done = [];
    chosen.forEach((b) => {
      // Re-checked per batch at the moment of signing (status may have changed; maker ≠ checker).
      const cur = batches.find((x) => x.id === b.id);
      if (!cur || !signable(cur)) return;
      update('batches', (list) => list.map((x) => (x.id === cur.id ? { ...x, status: 'Approved', approvedBy: user.name, approvedAt: at, attestation: { text: ATTESTATION, signature, comment, at, bulk: chosen.length } } : x)));
      logAudit({ actor: user.name, role: user.role, tenant, action: 'BATCH_APPROVE', module: 'Submission', target: cur.id, purpose: `Attestation signed (bulk sign-off of ${chosen.length})`, outcome: 'Success' });
      runPipeline(cur.id, [{ status: 'Identity resolution', delay: 1500 }, { status: 'Loaded', delay: 2500, extra: receiptExtra(cur) }]);
      done.push(cur.id);
    });
    setSelected([]);
    toast(`${done.length} batch${done.length === 1 ? '' : 'es'} approved and signed — loading started`, 'success');
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Data submissions"
        subtitle="Upload monthly and daily batches, follow validation, approval and loading, and download submission receipts."
        actions={(
          <>
            <Button variant="outline" icon={Download} onClick={() => downloadTemplate('v3.2')}>Download template (v3.2)</Button>
            <PermButton feature="mfi.submissions" action="create" what="upload batches" icon={Upload} onClick={() => { setDuplicate(null); setOpen(true); }}>Upload batch</PermButton>
          </>
        )}
      />

      {can('mfi.submissions', 'approve') && !can('mfi.submissions', 'create') && <Alert tone="info" title="You review and sign off batches">Your role approves batches and signs the attestation but cannot upload (segregation of duties). Select the batches awaiting approval below to sign them off together, or open one to review it first.</Alert>}
      <ViewOnlyBanner feature="mfi.submissions" />
      <MakerCheckerBanner maker={`Data Submitter (${institution?.short})`} checker="MFI Data Approver" note="Every batch needs approval by a checker who did not upload it before it is loaded to the registry." />

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatCard label="Awaiting approval" value={count('Awaiting approval')} tone="warm" definition="Batches validated and waiting for the checker's attestation." />
        <StatCard label="In processing" value={count('Validating') + count('Uploaded') + count('Approved') + count('Identity resolution')} tone="navy" definition="Batches currently in validation, identity resolution or loading." />
        <StatCard label="Validation failed" value={count('Validation failed')} tone="red" definition="Batches rejected by schema or rule validation. Fix the file and resubmit." />
        <StatCard label="Loaded (with receipt)" value={count('Loaded')} tone="green" definition="Batches loaded to the registry, reconciled and receipted." />
      </div>

      <Card>
        <CardHeader title="Batches" subtitle={`${own.length} batches for ${institution?.name} (tenant ${tenant})`} />
        {checker && (
          <div className="flex flex-col gap-3 border-b border-slate-100 bg-amber-50/40 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            {eligible.length ? (
              <label className="flex items-center gap-2.5 text-sm text-slate-700">
                <input type="checkbox" checked={allOn} onChange={() => setSelected(allOn ? [] : eligible.map((b) => b.id))} className="h-4 w-4 rounded border-slate-300 accent-[hsl(214_45%_22%)]" />
                Select all {eligible.length} awaiting your sign-off
              </label>
            ) : <p className="text-sm text-slate-600">No batches are waiting for your sign-off.</p>}
            <PermButton feature="mfi.submissions" action="approve" what="sign off batches" variant="success" className={STRONG.success} icon={FileCheck2} disabled={!chosen.length} onClick={() => setSigning(true)}>
              Sign off {chosen.length || ''} selected
            </PermButton>
          </div>
        )}
        <DataTable
          rows={own}
          searchKeys={['id', 'fileName', 'period', 'status']}
          onRowClick={checker ? undefined : (r) => navigate(`/mfi/submissions/${r.id}`)}
          emptyTitle="No batches yet — upload your first monthly file"
          columns={[
            {
              key: 'id', header: 'Batch', sortable: true, render: (r) => (checker ? (
                <span className="flex items-start gap-2.5">
                  {signable(r)
                    ? <input type="checkbox" checked={selected.includes(r.id)} onChange={() => toggle(r.id)} aria-label={`Select ${r.id} for sign-off`} className="mt-0.5 h-4 w-4 shrink-0 rounded border-slate-300 accent-[hsl(214_45%_22%)]" />
                    : <span className="w-4 shrink-0" aria-hidden="true" />}
                  <span className="min-w-0">
                    <Link to={`/mfi/submissions/${r.id}`} className="break-all font-mono text-xs font-semibold text-primary underline-offset-2 hover:underline">{r.id}</Link>
                    <span className="block text-[11px] text-slate-500">{r.fileName}</span>
                    {r.status === 'Awaiting approval' && r.uploadedBy === user.id && <span className="block text-[11px] text-amber-700">You uploaded this batch — another checker must sign it</span>}
                  </span>
                </span>
              ) : <><span className="break-all font-mono text-xs font-semibold text-primary">{r.id}</span><span className="block text-[11px] text-slate-500">{r.fileName}</span></>),
            },
            { key: 'period', header: 'Period', sortable: true },
            { key: 'schema', header: 'Schema', render: (r) => <>{r.schema} · {r.format}</> },
            { key: 'uploadedAt', header: 'Uploaded', sortable: true, render: (r) => <>{r.uploadedAt}<span className="block text-[11px] text-slate-500">{r.uploadedByName}</span></> },
            { key: 'received', header: 'Rows', render: (r) => (r.received ? <>{formatNumber(r.received)}<span className="block text-[11px] text-red-600">{formatNumber(r.rejected)} rejected</span></> : '—') },
            { key: 'status', header: 'Status', render: (r) => <div className="space-y-1.5"><BatchStatus status={r.status} /><PipelineStatus status={r.status} compact /></div> },
          ]}
        />
      </Card>

      <BulkSignOffDialog open={signing} batches={chosen} user={user} onClose={() => setSigning(false)} onConfirm={signOff} />
      <UploadBatchModal open={open && can('mfi.submissions', 'create')} onClose={() => setOpen(false)} onSubmit={onSubmit} duplicate={duplicate} onTemplate={downloadTemplate} />
    </div>
  );
}
