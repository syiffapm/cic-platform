import { useRef, useState } from 'react';
import { FileUp, Plus, Send, Trash2 } from 'lucide-react';
import { Alert, Badge, Button, Card, CardBody, CardHeader, DataTable, Input, PageHeader, Select, Tabs, useToast } from '@/components/ui';
import { useStore } from '@/context/StoreContext';
import { TOWNSHIPS } from '@/data/reference';
import { formatMMK, formatNumber } from '@/lib/format';
import { nowStamp, useMfi, useTenant } from '../../components/MfiState';
import { downloadFile, parseCsv } from '../../components/download';
import { ViewOnlyBanner } from '../../components/access';

const TOWNSHIP_NAMES = TOWNSHIPS.map((t) => t.name);
const PERIODS = ['2026 Q3', '2026 Q2'];

/** Validation rules for one census row; returns { errors, warnings }. */
function validate(r) {
  const errors = []; const warnings = [];
  if (!TOWNSHIP_NAMES.includes(r.township)) errors.push(`Township “${r.township || '(blank)'}” is not in the reference list`);
  if (!Number.isInteger(r.households) || r.households <= 0) errors.push('Households must be a whole number above 0');
  if (!Number.isInteger(r.women) || r.women < 0) errors.push('Women borrowers must be a whole number, 0 or more');
  else if (r.women > r.households) warnings.push('Women borrowers exceed households — check for multiple borrowers per household');
  if (!(r.avgLoan >= 50_000 && r.avgLoan <= 50_000_000)) errors.push('Average loan size must be between 50,000 and 50,000,000 MMK');
  return { errors, warnings };
}
const toRow = (township, households, women, avgLoan) => ({ township: township.trim(), households: Number(households), women: Number(women), avgLoan: Number(avgLoan) });

/** Census data input — CSV or manual, validated and versioned. */
export default function Census() {
  const { user, tenant, can } = useTenant();
  const { census, update } = useMfi();
  const { logAudit } = useStore();
  const toast = useToast();
  const fileRef = useRef(null);
  const [mode, setMode] = useState('manual');
  const [period, setPeriod] = useState(PERIODS[0]);
  const [rows, setRows] = useState([]);
  const [form, setForm] = useState({ township: '', households: '', women: '', avgLoan: '' });
  const [selected, setSelected] = useState(null);

  const own = census.filter((c) => c.tenant === tenant);
  const checked = rows.map((r) => ({ ...r, ...validate(r) }));
  const errorCount = checked.reduce((s, r) => s + r.errors.length, 0);
  const canSubmit = can('mfi.census', 'create');

  const onFile = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => {
      const { rows: data } = parseCsv(String(reader.result));
      setRows(data.map(([t, h, w, a]) => toRow(t ?? '', h, w, a)));
      toast(`${data.length} rows read from ${f.name}`, 'info');
    };
    reader.readAsText(f);
  };

  const addManual = () => {
    setRows((r) => [...r, toRow(form.township, form.households, form.women, form.avgLoan)]);
    setForm({ township: '', households: '', women: '', avgLoan: '' });
  };

  const submit = () => {
    const prior = own.filter((c) => c.period === period);
    const version = prior.length + 1;
    const id = `CEN-PGMF-${period.replace(' ', '')}-v${version}`;
    update('census', (list) => [
      { id, tenant, period, version, submittedBy: user.name, submittedAt: nowStamp(), method: mode === 'csv' ? 'CSV' : 'Manual', status: 'Accepted', rows },
      ...list.map((c) => (c.tenant === tenant && c.period === period && c.status === 'Accepted' ? { ...c, status: 'Superseded' } : c)),
    ]);
    logAudit({ actor: user.name, role: user.role, tenant, action: 'CENSUS_SUBMIT', module: 'Census', target: id, outcome: 'Success' });
    toast(`Census ${period} saved as version ${version}`, 'success');
    setRows([]);
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Census data" subtitle="Quarterly outreach figures per township. Each submission is validated and stored as a new version; earlier versions are kept." />
      <ViewOnlyBanner feature="mfi.census" />

      {canSubmit && (
        <Card>
          <CardHeader title="New census submission" action={<Select aria-label="Period" value={period} onChange={(e) => setPeriod(e.target.value)} options={PERIODS} />} />
          <Tabs className="px-4" value={mode} onChange={setMode} tabs={[{ id: 'manual', label: 'Manual entry' }, { id: 'csv', label: 'CSV upload' }]} />
          <CardBody className="space-y-4">
            {mode === 'manual' ? (
              <div className="grid items-end gap-3 sm:grid-cols-2 lg:grid-cols-5">
                <Select label="Township" value={form.township} onChange={(e) => setForm({ ...form, township: e.target.value })} placeholder="Select…" options={TOWNSHIP_NAMES} />
                <Input label="Households" type="number" value={form.households} onChange={(e) => setForm({ ...form, households: e.target.value })} />
                <Input label="Women borrowers" type="number" value={form.women} onChange={(e) => setForm({ ...form, women: e.target.value })} />
                <Input label="Avg loan size (MMK)" type="number" value={form.avgLoan} onChange={(e) => setForm({ ...form, avgLoan: e.target.value })} />
                <Button variant="outline" icon={Plus} onClick={addManual} disabled={!form.township}>Add row</Button>
              </div>
            ) : (
              <div className="flex flex-wrap items-center gap-2">
                <Button variant="outline" icon={FileUp} onClick={() => fileRef.current?.click()}>Choose CSV</Button>
                <input ref={fileRef} type="file" accept=".csv" className="sr-only" onChange={onFile} aria-label="Census CSV file" />
                <Button variant="ghost" onClick={() => downloadFile('census-template.csv', 'township,households,women_borrowers,avg_loan_size_mmk\nPathein,5330,4950,850000\n')}>Download template</Button>
                <span className="text-[11px] text-slate-500">Columns: township, households, women_borrowers, avg_loan_size_mmk</span>
              </div>
            )}

            {checked.length > 0 && (
              <>
                <ul className="divide-y divide-slate-100 rounded-lg border border-slate-200 sm:hidden">
                  {checked.map((r, i) => (
                    <li key={i} className="space-y-1 px-3 py-2.5 text-xs">
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-sm font-medium text-slate-800">{r.township || '—'}</span>
                        <Button size="icon" variant="ghost" icon={Trash2} aria-label={`Remove row ${i + 1}`} onClick={() => setRows((rs) => rs.filter((_, j) => j !== i))} />
                      </div>
                      <p className="text-slate-600">{formatNumber(r.households || 0)} households · {formatNumber(r.women || 0)} women · avg {formatMMK(r.avgLoan || 0)}</p>
                      {r.errors.map((e) => <p key={e} className="text-red-700">{e}</p>)}
                      {r.warnings.map((w) => <p key={w} className="text-amber-700">{w}</p>)}
                      {!r.errors.length && !r.warnings.length && <Badge tone="green">Valid</Badge>}
                    </li>
                  ))}
                </ul>
                <div className="hidden overflow-x-auto rounded-lg border border-slate-200 scrollbar-thin sm:block" tabIndex={0} role="region" aria-label="Rows to submit">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 text-[11px] uppercase text-slate-500">
                      <tr>{['Township', 'Households', 'Women borrowers', 'Avg loan', 'Validation', ''].map((h) => <th key={h} scope="col" className="px-3 py-2">{h}</th>)}</tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {checked.map((r, i) => (
                        <tr key={i}>
                          <td className="px-3 py-2">{r.township || '—'}</td>
                          <td className="px-3 py-2">{formatNumber(r.households || 0)}</td>
                          <td className="px-3 py-2">{formatNumber(r.women || 0)}</td>
                          <td className="px-3 py-2">{formatMMK(r.avgLoan || 0)}</td>
                          <td className="px-3 py-2 text-xs">
                            {r.errors.map((e) => <p key={e} className="text-red-700">{e}</p>)}
                            {r.warnings.map((w) => <p key={w} className="text-amber-700">{w}</p>)}
                            {!r.errors.length && !r.warnings.length && <Badge tone="green">Valid</Badge>}
                          </td>
                          <td className="px-3 py-2 text-right"><Button size="icon" variant="ghost" icon={Trash2} aria-label={`Remove row ${i + 1}`} onClick={() => setRows((rs) => rs.filter((_, j) => j !== i))} /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {errorCount > 0 && <Alert tone="danger">{errorCount} validation error(s). Fix or remove the rows before submitting.</Alert>}
                <div className="flex justify-end"><Button icon={Send} disabled={errorCount > 0} onClick={submit}>Submit {period} (new version)</Button></div>
              </>
            )}
          </CardBody>
        </Card>
      )}

      <Card>
        <CardHeader title="Submitted versions" subtitle="Select a version to see its rows" />
        <DataTable
          rows={own}
          onRowClick={setSelected}
          columns={[
            { key: 'id', header: 'Version', className: 'font-mono text-xs' },
            { key: 'period', header: 'Period' },
            { key: 'method', header: 'Method' },
            { key: 'submittedAt', header: 'Submitted', render: (c) => <>{c.submittedAt}<span className="block text-[11px] text-slate-500">{c.submittedBy}</span></> },
            { key: 'rows', header: 'Townships', render: (c) => c.rows.length },
            { key: 'status', header: 'Status', render: (c) => <Badge tone={c.status === 'Accepted' ? 'green' : 'slate'}>{c.status}</Badge> },
          ]}
        />
        {selected && (
          <CardBody className="border-t border-slate-100">
            <p className="mb-2 text-xs font-semibold text-slate-700">{selected.id}{selected.note && <span className="font-normal text-slate-500"> — {selected.note}</span>}</p>
            <ul className="grid gap-2 text-xs sm:grid-cols-2">
              {selected.rows.map((r) => <li key={r.township} className="rounded-lg bg-slate-50 px-3 py-2">{r.township}: {formatNumber(r.households)} households · {formatNumber(r.women)} women · avg {formatMMK(r.avgLoan)}</li>)}
            </ul>
          </CardBody>
        )}
      </Card>
    </div>
  );
}
