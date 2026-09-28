import { useMemo, useState } from 'react';
import { Bookmark, BookmarkPlus, Download, FilterX, X } from 'lucide-react';
import { Badge, Button, Card, CardBody, DataTable, Input, Select, useToast } from '@/components/ui';
import { downloadCsv } from '../../../lib/csv';
import { useAdmin } from '../../../lib/useAdmin';
import IntegrityCheck from './IntegrityCheck';

const EMPTY = { actor: '', module: '', outcome: '', from: '', to: '', q: '', preset: '' };
const OUTCOME_TONE = { Success: 'green', Denied: 'red', 'Pending approval': 'amber', Failed: 'red' };
const PRIVILEGED = /CONFIG|ROLE|KEY|POLICY|BREAK|APPROVAL|USER_|FLAG|RETENTION/;
const STORAGE = 'cic.admin.auditSavedSearches';

const loadSaved = () => { try { return JSON.parse(localStorage.getItem(STORAGE)) ?? []; } catch { return []; } };
const persist = (list) => { try { localStorage.setItem(STORAGE, JSON.stringify(list)); } catch { /* storage unavailable */ } };

const COLUMNS_CSV = ['id', 'at', 'actor', 'role', 'tenant', 'action', 'module', 'target', 'purpose', 'outcome', 'ip', 'hash'].map((key) => ({ key, header: key }));

/** ADM-12 audit log: filters, saved searches, CSV export, hash-chain check. */
export default function AuditLogTab({ auditLog, audit, maskBorrower }) {
  const { can } = useAdmin('adm.audit');
  const toast = useToast();
  const [f, setF] = useState(EMPTY);
  const [saved, setSaved] = useState(loadSaved);
  const [saveName, setSaveName] = useState('');
  const set = (k) => (e) => setF((cur) => ({ ...cur, [k]: e.target.value, preset: '' }));

  const latestDay = useMemo(() => auditLog.reduce((m, e) => (e.at.slice(0, 10) > m ? e.at.slice(0, 10) : m), ''), [auditLog]);
  const presets = [
    { id: 'denied-today', name: 'Denied access today', filter: { ...EMPTY, outcome: 'Denied', from: latestDay, to: latestDay, preset: 'denied-today' } },
    { id: 'privileged', name: 'Privileged actions', filter: { ...EMPTY, preset: 'privileged' } },
    { id: 'cross-tenant', name: 'Cross-tenant attempts', filter: { ...EMPTY, preset: 'cross-tenant' } },
  ];

  const actors = useMemo(() => [...new Set(auditLog.map((e) => e.actor))].sort(), [auditLog]);
  const modules = useMemo(() => [...new Set(auditLog.map((e) => e.module))].sort(), [auditLog]);
  const outcomes = useMemo(() => [...new Set(auditLog.map((e) => e.outcome))].sort(), [auditLog]);

  const rows = useMemo(() => auditLog.filter((e) => {
    const day = e.at.slice(0, 10);
    if (f.actor && e.actor !== f.actor) return false;
    if (f.module && e.module !== f.module) return false;
    if (f.outcome && e.outcome !== f.outcome) return false;
    if (f.from && day < f.from) return false;
    if (f.to && day > f.to) return false;
    if (f.preset === 'privileged' && !(['adm_super', 'adm_security'].includes(e.role) || PRIVILEGED.test(e.action))) return false;
    if (f.preset === 'cross-tenant' && !/CROSS_TENANT/.test(e.action)) return false;
    if (f.q) {
      const q = f.q.toLowerCase();
      if (!Object.values(e).some((v) => String(v).toLowerCase().includes(q))) return false;
    }
    return true;
  }).map((e) => (maskBorrower ? { ...e, target: String(e.target).replace(/BRW-\d+/g, 'BRW-••••••') } : e)), [auditLog, f, maskBorrower]);

  const saveCurrent = () => {
    if (!saveName.trim()) return;
    const next = [...saved, { id: `S-${Date.now()}`, name: saveName.trim(), filter: f }];
    setSaved(next); persist(next); setSaveName('');
    toast(`Saved search “${saveName.trim()}”`, 'success');
  };
  const removeSaved = (id) => { const next = saved.filter((s) => s.id !== id); setSaved(next); persist(next); };

  const exportCsv = () => {
    downloadCsv(`cic-audit-extract-${latestDay || 'all'}.csv`, rows, COLUMNS_CSV);
    audit('AUDIT_EXPORT', `${rows.length} entries`, { purpose: 'Audit trail extract' });
    toast(`Exported ${rows.length} entries — export logged`, 'success');
  };

  const columns = [
    { key: 'at', header: 'Time', sortable: true, className: 'whitespace-nowrap font-mono text-xs' },
    { key: 'actor', header: 'Actor', sortable: true, className: 'whitespace-nowrap' },
    { key: 'role', header: 'Role', className: 'text-xs' },
    { key: 'tenant', header: 'Tenant', sortable: true, className: 'text-xs' },
    { key: 'action', header: 'Action', render: (r) => <span className="font-mono text-xs font-semibold text-primary">{r.action}</span> },
    { key: 'module', header: 'Module', className: 'whitespace-nowrap text-xs' },
    { key: 'target', header: 'Target', className: 'text-xs' },
    { key: 'purpose', header: 'Purpose', className: 'text-xs' },
    { key: 'outcome', header: 'Outcome', sortable: true, render: (r) => <Badge tone={OUTCOME_TONE[r.outcome] ?? 'slate'}>{r.outcome}</Badge> },
    { key: 'ip', header: 'IP', className: 'font-mono text-xs' },
    { key: 'hash', header: 'Hash', className: 'font-mono text-[11px] text-slate-500' },
  ];

  const chip = (active) => `inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium ${active ? 'border-primary bg-primary text-white' : 'border-slate-200 bg-white text-slate-700 hover:border-primary-300'}`;

  return (
    <div className="space-y-6">
      <Card><CardBody><IntegrityCheck entryCount={12_409 + auditLog.length} audit={audit} /></CardBody></Card>

      <Card>
        <CardBody className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Saved searches</span>
            {presets.map((p) => (
              <button key={p.id} type="button" className={chip(f.preset === p.id)} aria-pressed={f.preset === p.id} onClick={() => setF(p.filter)}>
                <Bookmark className="h-3 w-3" aria-hidden="true" />{p.name}
              </button>
            ))}
            {saved.map((s) => (
              <span key={s.id} className={chip(false)}>
                <button type="button" onClick={() => setF(s.filter)} className="inline-flex items-center gap-1.5"><Bookmark className="h-3 w-3" aria-hidden="true" />{s.name}</button>
                <button type="button" aria-label={`Delete saved search ${s.name}`} onClick={() => removeSaved(s.id)} className="text-slate-500 hover:text-red-600"><X className="h-3 w-3" /></button>
              </span>
            ))}
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            <Select label="Actor" value={f.actor} onChange={set('actor')} options={actors} placeholder="All actors" />
            <Select label="Module" value={f.module} onChange={set('module')} options={modules} placeholder="All modules" />
            <Select label="Outcome" value={f.outcome} onChange={set('outcome')} options={outcomes} placeholder="All outcomes" />
            <Input label="From" type="date" value={f.from} onChange={set('from')} />
            <Input label="To" type="date" value={f.to} onChange={set('to')} />
            <Input label="Search" placeholder="Action, target, IP, hash…" value={f.q} onChange={set('q')} />
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
            <Input label="Save current filter as" placeholder="e.g. MFI-002 failed logins" value={saveName} onChange={(e) => setSaveName(e.target.value)} className="sm:w-72" />
            <Button variant="outline" icon={BookmarkPlus} onClick={saveCurrent} disabled={!saveName.trim()}>Save search</Button>
            <Button variant="ghost" icon={FilterX} onClick={() => setF(EMPTY)}>Clear filters</Button>
          </div>
        </CardBody>
      </Card>

      <Card>
        <DataTable
          columns={columns}
          rows={rows}
          pageSize={12}
          dense
          toolbar={(
            <>
              <span className="text-xs text-slate-500">{rows.length} of {auditLog.length} entries</span>
              <Button size="sm" variant="outline" icon={Download} onClick={exportCsv} disabled={!rows.length || !can('export')}>Export CSV</Button>
            </>
          )}
        />
      </Card>
    </div>
  );
}
