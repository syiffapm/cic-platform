import { useRef, useState } from 'react';
import { Download, FileUp, Play } from 'lucide-react';
import { Alert, Badge, Button, Card, CardBody, CardHeader, Checkbox, DataTable, PageHeader, Select, Textarea, useToast } from '@/components/ui';
import { useStore } from '@/context/StoreContext';
import { PURPOSE_CODES } from '@/data/reference';
import { formatMMK } from '@/lib/format';
import { parseNrc } from '@/lib/nrc';
import { findById, findByNrc } from '../../data/borrowers';
import { useTenant } from '../../components/MfiState';
import { buildReport } from '../../components/reportModel';
import { downloadFile, toCsv } from '../../components/download';
import { PermButton, ViewOnlyBanner } from '../../components/access';

/** Near-duplicates that the identity engine cannot resolve to one person. */
const AMBIGUOUS = ['12/LAMANA(N)402971', '14/PATHEIN(N)118421'];
const SAMPLE = ['12/OUKAMA(N)245781', '14/PATHEIN(N)118412', '12/LAMANA(N)402917', '5/MAYANA(N)077120', '12/LAMANA(N)402971', '9/MAHAMA(N)330912', '12/OKM245781'];

const TONE = { Match: 'green', 'No hit': 'slate', 'Multiple candidates': 'violet', 'Invalid NRC': 'red', 'Invalid ID': 'red' };

/** Bulk-upload template: one borrower per line, identified by NRC or CIC borrower ID, plus your own reference. */
const TEMPLATE = ['nrc,borrower_id,reference', '12/OUKAMA(N)245781,,LN-REVIEW-001', ',BRW-004777,LN-REVIEW-002'].join('\n');

/** Reads pasted text or a CSV: with the template header (nrc,borrower_id,reference) or one NRC / borrower ID per line. */
function parseList(text) {
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  if (!lines.length) return [];
  const head = lines[0].toLowerCase().split(',').map((h) => h.trim());
  if (head.includes('nrc') || head.includes('borrower_id')) {
    const at = (k) => head.indexOf(k);
    return lines.slice(1).map((l) => l.split(',').map((c) => c.trim())).map((c) => ({ nrc: c[at('nrc')] ?? '', borrowerId: c[at('borrower_id')] ?? '', reference: at('reference') >= 0 ? c[at('reference')] ?? '' : '' }))
      .filter((r) => r.nrc || r.borrowerId);
  }
  return lines.flatMap((l) => l.split(/[;]+/)).map((v) => v.trim()).filter(Boolean).map((v) => (/^BRW-/i.test(v) ? { nrc: '', borrowerId: v, reference: '' } : { nrc: v, borrowerId: '', reference: '' }));
}

/** Batch inquiry for portfolio review. */
export default function BatchInquiry() {
  const { user, tenant } = useTenant();
  const { inquiries, disputes, logAudit } = useStore();
  const toast = useToast();
  const fileRef = useRef(null);
  const [text, setText] = useState('');
  const [purpose, setPurpose] = useState('RV');
  const [consent, setConsent] = useState(false);
  const [progress, setProgress] = useState(null);
  const [rows, setRows] = useState([]);

  const list = parseList(text);

  const onFile = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => setText(String(reader.result));
    reader.readAsText(f);
  };

  const classify = (entry, i) => {
    const ref = { id: i, reference: entry.reference };
    let b;
    let key;
    if (entry.borrowerId) {
      key = entry.borrowerId.toUpperCase();
      if (!/^BRW-\d{6}$/.test(key)) return { ...ref, nrc: key, result: 'Invalid ID', note: 'Format BRW- followed by 6 digits — not billed' };
      b = findById(key);
    } else {
      const p = parseNrc(entry.nrc);
      if (!p.valid) return { ...ref, nrc: entry.nrc, result: 'Invalid NRC', note: 'Format error — not billed' };
      key = p.normalised;
      if (AMBIGUOUS.includes(key)) return { ...ref, nrc: key, result: 'Multiple candidates', note: 'Needs an individual inquiry by CIC borrower ID' };
      b = findByNrc(key);
    }
    if (!b) return { ...ref, nrc: key, result: 'No hit', note: 'No credit record ≠ low risk' };
    const m = buildReport(b, inquiries, disputes);
    return { ...ref, nrc: entry.borrowerId ? b.nrc : key, result: 'Match', name: b.nameEn, borrowerId: b.borrowerId, grade: m.grade, active: m.active.length, exposure: m.exposure, worstDpd: m.worstDpd, note: m.reasons.map((r) => r.code).join(' ') };
  };

  /** Template is a read-only resource (no borrower data): available to anyone who can open this page. */
  const downloadTemplate = () => {
    downloadFile('batch-inquiry-template.csv', `${TEMPLATE}\n`);
    logAudit({ actor: user.name, role: user.role, tenant, action: 'TEMPLATE_DOWNLOAD', module: 'Inquiry', target: 'batch-inquiry-template.csv', outcome: 'Success' });
  };

  const run = () => {
    setRows([]);
    setProgress(0);
    const total = list.length;
    let done = 0;
    const out = [];
    const timer = setInterval(() => {
      out.push(classify(list[done], done));
      done += 1;
      setProgress(Math.round((done / total) * 100));
      setRows([...out]);
      if (done >= total) {
        clearInterval(timer);
        const billable = out.filter((r) => r.result === 'Match' || r.result === 'No hit').length;
        logAudit({ actor: user.name, role: user.role, tenant, action: 'INQUIRY_BATCH', module: 'Inquiry', target: `${total} borrowers`, purpose, outcome: `${billable} billable` });
        toast(`Batch inquiry complete: ${total} processed, ${billable} billable`, 'success');
      }
    }, 350);
  };

  const counts = rows.reduce((acc, r) => ({ ...acc, [r.result]: (acc[r.result] ?? 0) + 1 }), {});
  const ready = list.length > 0 && list.length <= 5000 && purpose && consent && (progress === null || progress === 100);

  return (
    <div className="space-y-6">
      <PageHeader title="Batch inquiry" subtitle="Upload a list of NRCs or CIC borrower IDs for portfolio review. Each line is processed as an individual, logged inquiry with the chosen purpose." />
      <ViewOnlyBanner feature="mfi.batchInquiry" />

      <Card>
        <CardHeader title="1 · Upload list" subtitle="CSV with columns nrc, borrower_id, reference — or paste one NRC or borrower ID per line." icon={FileUp} />
        <CardBody className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" icon={FileUp} onClick={() => fileRef.current?.click()}>Choose CSV file</Button>
            <input ref={fileRef} type="file" accept=".csv,.txt" className="sr-only" onChange={onFile} aria-label="Borrower list CSV file" />
            <Button variant="ghost" size="sm" onClick={() => setText(`nrc,borrower_id,reference\n${SAMPLE.map((n, i) => `${n},,RV-2026-${String(i + 1).padStart(3, '0')}`).join('\n')}`)}>Load last review list</Button>
            <Button variant="outline" size="sm" icon={Download} onClick={downloadTemplate}>Download CSV template</Button>
            <span className="self-center text-[11px] text-slate-500">NRC or CIC borrower ID per line, max 5,000 lines.</span>
          </div>
          <Textarea label="Borrower list" rows={5} value={text} onChange={(e) => setText(e.target.value)} placeholder={'nrc,borrower_id,reference\n12/OUKAMA(N)245781,,LN-REVIEW-001'} hint={`${list.length} borrower(s) detected${list.length > 5000 ? ' — maximum 5,000 per batch' : ''}`} />
          <div className="grid gap-4 sm:grid-cols-2">
            <Select label="Purpose" required value={purpose} onChange={(e) => setPurpose(e.target.value)} options={PURPOSE_CODES.map((p) => ({ value: p.code, label: `${p.code} — ${p.label}` }))} />
            <Checkbox className="self-end" checked={consent} onChange={(e) => setConsent(e.target.checked)} label="Consent on file for every borrower in this list" description="Portfolio review relies on the consent clause in each loan agreement." />
          </div>
          <div className="flex justify-end">
            <PermButton feature="mfi.batchInquiry" action="create" what="run batch inquiries" icon={Play} disabled={!ready} onClick={run}>Process {list.length || ''} inquiries</PermButton>
          </div>
        </CardBody>
      </Card>

      {progress !== null && (
        <Card>
          <CardHeader title="2 · Results" subtitle={`Purpose ${purpose} · ${rows.length} of ${list.length} processed`} action={rows.length > 0 && progress === 100 && (
            <PermButton feature="mfi.batchInquiry" action="export" what="export inquiry results" variant="outline" size="sm" icon={Download} onClick={() => downloadFile('batch-inquiry-results.csv', toCsv(rows, [
              { key: 'nrc', header: 'NRC' }, { key: 'reference', header: 'Reference' }, { key: 'result', header: 'Result' }, { key: 'borrowerId', header: 'Borrower ID' }, { key: 'name', header: 'Name' },
              { key: 'grade', header: 'Grade' }, { key: 'active', header: 'Active loans' }, { key: 'exposure', header: 'Exposure MMK' }, { key: 'note', header: 'Notes' },
            ]))}>Download results</PermButton>
          )} />
          <CardBody className="space-y-4">
            <div>
              <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100} aria-label="Batch progress">
                <div className="h-full rounded-full bg-teal transition-all" style={{ width: `${progress}%` }} />
              </div>
              <p className="mt-2 flex flex-wrap gap-2 text-xs text-slate-500">
                {progress}% · {Object.entries(counts).map(([k, v]) => <Badge key={k} tone={TONE[k]}>{k}: {v}</Badge>)}
              </p>
            </div>
            {progress === 100 && <Alert tone="info">Invalid NRCs or IDs and ambiguous identities are not billed. “No hit” means no reported loans — it is not a low-risk signal and carries no grade.</Alert>}
          </CardBody>
          <DataTable
            dense
            rows={rows}
            pageSize={10}
            columns={[
              { key: 'nrc', header: 'NRC / ID', className: 'font-mono text-xs', render: (r) => <>{r.nrc}{r.reference && <span className="block font-sans text-[11px] text-slate-500">{r.reference}</span>}</> },
              { key: 'result', header: 'Result', render: (r) => <Badge tone={TONE[r.result]}>{r.result}</Badge> },
              { key: 'name', header: 'Borrower', render: (r) => (r.name ? <>{r.name}<span className="block text-[11px] text-slate-500">{r.borrowerId}</span></> : '—') },
              { key: 'grade', header: 'Grade', render: (r) => r.grade ?? '—' },
              { key: 'active', header: 'Active loans', render: (r) => r.active ?? '—' },
              { key: 'exposure', header: 'Exposure', render: (r) => (r.exposure !== undefined ? formatMMK(r.exposure) : '—') },
              { key: 'note', header: 'Notes / reason codes', className: 'text-xs text-slate-500' },
            ]}
          />
        </Card>
      )}
    </div>
  );
}
