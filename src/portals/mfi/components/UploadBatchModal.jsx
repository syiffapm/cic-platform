import { useState } from 'react';
import { Download, Upload } from 'lucide-react';
import { Alert, Button, Input, Modal, Select } from '@/components/ui';
import { formatMMK } from '@/lib/format';
import { SCHEMA_VERSIONS } from '../data/batches';

const FORMATS = { csv: 'CSV', xlsx: 'XLSX', xml: 'XML' };

/** Batch upload with schema version, period and control totals for reconciliation. */
export default function UploadBatchModal({ open, onClose, onSubmit, duplicate, onTemplate }) {
  const [file, setFile] = useState(null);
  const [schema, setSchema] = useState('v3.2');
  const [period, setPeriod] = useState('2026-08');
  const [batchId, setBatchId] = useState('');
  const [records, setRecords] = useState('');
  const [outstanding, setOutstanding] = useState('');

  const ext = file?.name.split('.').pop().toLowerCase();
  const format = FORMATS[ext];
  const valid = file && format && period && Number(records) > 0 && Number(outstanding) > 0;

  const submit = () => onSubmit({ fileName: file.name, format, schema, period, batchId: batchId.trim(), control: { records: Number(records), outstanding: Number(outstanding), licenceNo: 'MFI-0001/2012' } });

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      title="Upload submission batch"
      subtitle="Files are validated against the selected schema, then wait for checker approval before loading."
      footer={<><Button variant="outline" onClick={onClose}>Cancel</Button><Button icon={Upload} disabled={!valid} onClick={submit}>Upload and validate</Button></>}
    >
      <div className="space-y-5">
        {duplicate && (
          <Alert tone="warning" title="Duplicate batch detected — no new loans created (idempotent)">
            {duplicate.reason} The original batch <b>{duplicate.existing.id}</b> ({duplicate.existing.status}) is unchanged and no records were loaded twice.
          </Alert>
        )}
        <div className="flex flex-wrap items-end gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
          <Select label="Schema version" value={schema} onChange={(e) => setSchema(e.target.value)} options={SCHEMA_VERSIONS} className="min-w-[16rem] flex-1" />
          <Button variant="outline" icon={Download} onClick={() => onTemplate(schema)}>Download {schema} template</Button>
          <p className="w-full text-[11px] text-slate-500">Header row only, one loan per line. Control totals (record count, sum outstanding, period, licence no.) go in the form below, not in the file.</p>
        </div>
        {schema === 'v3.1' && <Alert tone="warning">Schema v3.1 is deprecated and will be rejected after the October cut-off. Switch to v3.2 (adds guarantor NRC and household size).</Alert>}

        <label className="block space-y-1.5">
          <span className="block text-xs font-medium text-slate-700">Batch file (CSV, XLSX or XML)<span className="text-red-500" aria-hidden="true"> *</span></span>
          <input
            type="file" accept=".csv,.xlsx,.xml"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="block w-full rounded-lg border border-dashed border-slate-300 bg-white p-3 text-sm text-slate-600 file:mr-3 file:rounded-md file:border-0 file:bg-primary file:px-3 file:py-2 file:text-xs file:font-medium file:text-white"
          />
          {file && !format && <p role="alert" className="text-[11px] font-medium text-red-600">Unsupported file type — use .csv, .xlsx or .xml</p>}
          <p className="text-[11px] text-slate-500">Maximum 50 MB. A file already received for the same period is recognised by its checksum and is not processed twice.</p>
        </label>

        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="Reporting period" type="month" required value={period} onChange={(e) => setPeriod(e.target.value)} />
          <Input label="Batch ID / idempotency key (optional)" value={batchId} onChange={(e) => setBatchId(e.target.value)} placeholder="Derived from period + file if blank" />
          <Input label="Control total — record count" type="number" min="1" required value={records} onChange={(e) => setRecords(e.target.value)} placeholder="48210" />
          <Input label="Control total — sum outstanding (MMK)" type="number" min="1" required value={outstanding} onChange={(e) => setOutstanding(e.target.value)} placeholder="61284550000" hint={outstanding ? formatMMK(Number(outstanding)) : undefined} />
        </div>
      </div>
    </Modal>
  );
}
