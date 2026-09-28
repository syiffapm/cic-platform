import { useMemo, useState } from 'react';
import clsx from 'clsx';
import { Download, Languages, RotateCcw, Search, Send } from 'lucide-react';
import { Alert, Badge, Button, Card, CardBody, CardHeader, Checkbox, MakerCheckerBanner, PageHeader, Select, useToast } from '@/components/ui';
import en from '@/i18n/en';
import mm from '@/i18n/mm';
import { looksLikeZawgyi } from '@/lib/nrc';
import { useAdmin } from '../../lib/useAdmin';
import { useAdminObject } from '../../context/AdminStore';
import { downloadJson, flatten, unflatten } from './extras/i18nUtils';

const EN = flatten(en);
const MM = flatten(mm);
const KEYS = Object.keys(EN);
const NAMESPACES = [...new Set(KEYS.map((k) => k.split('.')[0]))];
const STATUS_TONE = { Translated: 'green', Missing: 'red', Edited: 'violet', 'Same as EN': 'amber' };

export default function Translations() {
  const { user, can, audit, requestApproval } = useAdmin('cms.translations');
  const readOnly = !can('update');
  const toast = useToast();
  // Approved overrides (applied by the checker) layered over the shipped mm.js bundle.
  const [approved] = useAdminObject('cmsTranslations', {});
  const [edits, setEdits] = useState({});
  const [ns, setNs] = useState('all');
  const [query, setQuery] = useState('');
  const [missingOnly, setMissingOnly] = useState(false);

  const base = (k) => approved[k] ?? MM[k] ?? '';

  const rows = useMemo(() => KEYS.map((key) => {
    const current = edits[key] ?? base(key);
    const edited = key in edits && edits[key] !== base(key);
    const status = edited ? 'Edited' : !current.trim() ? 'Missing' : current === EN[key] && !/^[A-Z0-9 ]+$/.test(current) ? 'Same as EN' : 'Translated';
    return { key, ns: key.split('.')[0], en: String(EN[key]), mm: current, status };
  }), [edits, approved]); // eslint-disable-line react-hooks/exhaustive-deps

  const visible = rows.filter((r) => (ns === 'all' || r.ns === ns)
    && (!missingOnly || r.status === 'Missing' || r.status === 'Same as EN')
    && (!query || `${r.key} ${r.en} ${r.mm}`.toLowerCase().includes(query.toLowerCase())));

  const completion = NAMESPACES.map((n) => {
    const list = rows.filter((r) => r.ns === n);
    const done = list.filter((r) => r.mm.trim() && r.status !== 'Same as EN').length;
    return { ns: n, total: list.length, done, pct: Math.round((done / list.length) * 100) };
  });
  const changed = rows.filter((r) => r.status === 'Edited');
  const zawgyi = changed.filter((r) => looksLikeZawgyi(r.mm));

  const exportJson = () => {
    const merged = Object.fromEntries(rows.filter((r) => r.mm.trim()).map((r) => [r.key, r.mm]));
    downloadJson('mm.json', unflatten(merged));
    audit('TRANSLATIONS_EXPORT', `mm.json (${Object.keys(merged).length} keys)`);
    toast('mm.json downloaded', 'success');
  };

  const submit = () => {
    if (zawgyi.length) { toast(`${zawgyi.length} string(s) look like Zawgyi — convert to Unicode first`, 'danger'); return; }
    const changes = Object.fromEntries(changed.map((r) => [r.key, r.mm]));
    const apr = requestApproval({
      type: 'UI translations',
      summary: `${changed.length} Myanmar UI string${changed.length === 1 ? '' : 's'} (${[...new Set(changed.map((r) => r.ns))].join(', ')})`,
      checkerRole: 'adm_publisher',
      payload: {
        diff: changed.map((r) => ({ field: r.key, from: base(r.key) || '(missing)', to: r.mm })),
        effect: { target: 'admin', collection: 'cmsTranslations', op: 'set', changes },
      },
    });
    setEdits({});
    toast(`${apr.id}: translations sent to a Publisher`, 'success');
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="UI translations"
        subtitle="English ↔ Myanmar (Unicode) interface strings for all five portals. Content translations are managed per item in the content editor."
        actions={(
          <div className="flex gap-2">
            <Button variant="outline" icon={Download} disabled={!can('export')} onClick={exportJson}>Export JSON</Button>
            <Button icon={Send} disabled={readOnly || changed.length === 0} onClick={submit}>Submit translations{changed.length ? ` (${changed.length})` : ''}</Button>
          </div>
        )}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {completion.map((c) => (
          <button key={c.ns} type="button" onClick={() => setNs(ns === c.ns ? 'all' : c.ns)} aria-pressed={ns === c.ns} className={clsx('rounded-xl border bg-white p-4 text-left shadow-sm hover:border-primary-300', ns === c.ns ? 'border-primary ring-2 ring-primary-200' : 'border-slate-200')}>
            <p className="font-mono text-xs font-semibold text-slate-700">{c.ns}</p>
            <p className={clsx('mt-1 text-xl font-bold', c.pct === 100 ? 'text-emerald-700' : c.pct >= 70 ? 'text-amber-700' : 'text-red-600')}>{c.pct}%</p>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100"><div className={clsx('h-full', c.pct === 100 ? 'bg-emerald-500' : 'bg-warm')} style={{ width: `${c.pct}%` }} /></div>
            <p className="mt-1 text-[11px] text-slate-500">{c.done}/{c.total} strings</p>
          </button>
        ))}
      </div>

      <Card>
        <CardHeader icon={Languages} title="Strings" subtitle={`${visible.length} of ${rows.length} keys · source: src/i18n/en.js & mm.js + approved overrides`} />
        <CardBody className="space-y-3 border-b border-slate-100">
          <div className="flex flex-col gap-3 md:flex-row md:items-end">
            <label className="relative block w-full md:max-w-xs">
              <span className="sr-only">Search strings</span>
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" aria-hidden="true" />
              <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search key or text…" className="h-10 w-full rounded-lg border border-slate-300 pl-9 pr-3 text-sm" />
            </label>
            <Select className="md:w-48" label="Namespace" value={ns} onChange={(e) => setNs(e.target.value)} options={[{ value: 'all', label: 'All namespaces' }, ...NAMESPACES]} />
            <Checkbox className="md:pb-2.5" label="Missing / untranslated only" checked={missingOnly} onChange={(e) => setMissingOnly(e.target.checked)} />
            {changed.length > 0 && <Button className="md:ml-auto" variant="ghost" icon={RotateCcw} onClick={() => setEdits({})}>Discard edits</Button>}
          </div>
          {changed.length > 0 && <MakerCheckerBanner maker={user?.name} checker="CMS Publisher (adm_publisher)" note={`${changed.length} edited string(s) will be applied to all portals after a Publisher approves.`} />}
          {zawgyi.length > 0 && <Alert tone="danger">Zawgyi encoding detected in: {zawgyi.map((r) => r.key).join(', ')}</Alert>}
        </CardBody>
        <div className="overflow-x-auto scrollbar-thin" tabIndex={0} role="region" aria-label="Translation table">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="bg-slate-50 text-[11px] uppercase tracking-wide text-slate-500">
              <tr>
                <th scope="col" className="px-4 py-2.5">Key</th>
                <th scope="col" className="px-4 py-2.5">English</th>
                <th scope="col" className="w-2/5 px-4 py-2.5">Myanmar</th>
                <th scope="col" className="px-4 py-2.5">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {visible.map((r) => (
                <tr key={r.key} className={clsx(r.status === 'Missing' && 'bg-red-50/60', r.status === 'Same as EN' && 'bg-amber-50/60')}>
                  <td className="px-4 py-2 font-mono text-xs text-slate-600">{r.key}</td>
                  <td className="px-4 py-2 text-slate-800">{r.en}</td>
                  <td className="px-4 py-2">
                    <input
                      lang="my"
                      aria-label={`Myanmar text for ${r.key}`}
                      value={r.mm}
                      disabled={readOnly}
                      placeholder="Missing — falls back to English"
                      onChange={(e) => setEdits((s) => ({ ...s, [r.key]: e.target.value }))}
                      className={clsx('h-9 w-full rounded-lg border bg-white px-2.5 text-sm disabled:bg-slate-50', r.status === 'Missing' ? 'border-red-300' : r.status === 'Edited' ? 'border-violet-400' : 'border-slate-300')}
                    />
                  </td>
                  <td className="px-4 py-2"><Badge tone={STATUS_TONE[r.status]}>{r.status}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
          {visible.length === 0 && <p className="px-4 py-8 text-center text-sm text-slate-500">No strings match your filters.</p>}
        </div>
      </Card>
    </div>
  );
}
