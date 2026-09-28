import { CheckCircle2, AlertTriangle, XCircle, RefreshCw, Database, ListChecks, UserRound } from 'lucide-react';
import { Badge, Button, Card, CardBody, CardHeader } from '@/components/ui';
import { getInstitution } from '@/data/institutions';
import { PURPOSE_CODES } from '@/data/reference';
import { formatMMK } from '@/lib/format';
import { CHECK_LABEL, CHECK_TONE } from './requestUtils';

const ICON = { pass: CheckCircle2, warn: AlertTriangle, fail: XCircle };
const ICON_CLS = { pass: 'text-emerald-700', warn: 'text-amber-700', fail: 'text-red-600' };
const mfi = (id) => getInstitution(id)?.short ?? id;

const Row = ({ k, v }) => (
  <div className="grid grid-cols-3 gap-2 py-1.5 text-sm">
    <dt className="text-slate-500">{k}</dt><dd className="col-span-2 text-slate-800">{v || '—'}</dd>
  </div>
);

/** Who asked, and the account they asked from. */
export function RequesterPanel({ req, account, file, nrc, phone }) {
  return (
    <Card>
      <CardHeader icon={UserRound} title="Requester and account" subtitle="Identity confirmed at registration; the report is released only to this account" />
      <CardBody>
        <dl className="divide-y divide-slate-100">
          <Row k="Name" v={req.name} />
          <Row k="NRC" v={<span className="font-mono text-xs">{nrc(req.nrc)}</span>} />
          <Row k="CIC file" v={<span className="font-mono text-xs">{req.borrowerId}</span>} />
          <Row k="Account" v={account ? <span><span className="font-mono text-xs">{account.id}</span> · <Badge status={account.status}>{account.status}</Badge></span> : 'Branch-assisted request (no online account on record)'} />
          <Row k="Verification method" v={account?.verifiedVia ?? 'Activation code issued at a lender branch'} />
          <Row k="Contact" v={<span className="font-mono text-xs">{phone(account?.phone ?? file?.phone)}{account?.email ? ` · ${account.email.slice(0, 2)}•••@${account.email.split('@')[1]}` : ''}</span>} />
          <Row k="Notify by" v={req.notify} />
          <Row k="Purpose" v={req.purpose} />
          <Row k="Fee" v={req.fee ? `${formatMMK(req.fee)} (paid online)` : 'Free annual report'} />
          <Row k="Submitted" v={req.submittedAt} />
        </dl>
      </CardBody>
    </Card>
  );
}

/** Automated validation results with a re-run action. */
export function ChecksPanel({ checks = [], onRerun, readOnly, locked, mask = (t) => t }) {
  return (
    <Card>
      <CardHeader icon={ListChecks} title="Automated checks" subtitle="Identity, data freshness, disputes, corrections and quota"
        action={!readOnly && !locked && <Button size="sm" variant="outline" icon={RefreshCw} onClick={onRerun}>Re-run validation</Button>} />
      <ul className="divide-y divide-slate-100">
        {checks.map((c) => {
          const Icon = ICON[c.result];
          return (
            <li key={c.id} className="flex items-start gap-3 px-5 py-3">
              <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${ICON_CLS[c.result]}`} aria-hidden="true" />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-medium text-slate-800">{c.label}</p>
                  <Badge tone={CHECK_TONE[c.result]}>{CHECK_LABEL[c.result]}</Badge>
                </div>
                <p className="mt-0.5 text-xs text-slate-600">{mask(c.detail)}</p>
              </div>
            </li>
          );
        })}
        {!checks.length && <li className="px-5 py-4 text-sm text-slate-500">Validation has not run yet.</li>}
      </ul>
    </Card>
  );
}

/** What the report will be built from: lenders, disputes, corrections, recent inquiries. */
export function DataProcessingPanel({ file, openDisputes = [], pendingCorrections = [], recentInquiries = [] }) {
  const lenders = file ? Object.values(file.loans.reduce((acc, l) => {
    const a = acc[l.mfiId] ?? { mfiId: l.mfiId, active: 0, closed: 0, outstanding: 0, last: '' };
    if (l.status === 'Active') { a.active += 1; a.outstanding += l.outstanding ?? 0; } else a.closed += 1;
    if (l.dataDate > a.last) a.last = l.dataDate;
    acc[l.mfiId] = a;
    return acc;
  }, {})).sort((a, b) => b.active - a.active) : [];
  const purpose = (code) => PURPOSE_CODES.find((p) => p.code === code)?.label ?? code;

  return (
    <Card>
      <CardHeader icon={Database} title="Data processing" subtitle="Registry data the report will be generated from" />
      <CardBody className="space-y-5">
        {!file && <p className="text-sm text-red-700">No CIC file is linked to this request.</p>}
        {file?.noHit && <p className="text-sm text-slate-600">No lender has reported a loan under this NRC. The report will state &ldquo;No credit history yet&rdquo;.</p>}
        {lenders.length > 0 && (
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Lenders on file</h3>
            <div className="mt-2 overflow-x-auto" tabIndex={0} role="region" aria-label="Loan records table">
              <table className="w-full text-left text-xs">
                <thead className="text-slate-500"><tr><th scope="col" className="py-1.5 font-medium">Lender</th><th scope="col" className="font-medium">Active</th><th scope="col" className="font-medium">Closed</th><th scope="col" className="font-medium">Outstanding</th><th scope="col" className="font-medium">Last reported</th></tr></thead>
                <tbody className="divide-y divide-slate-100">
                  {lenders.map((l) => (
                    <tr key={l.mfiId}><td className="py-1.5 font-medium text-slate-800">{getInstitution(l.mfiId)?.name ?? l.mfiId}</td><td>{l.active}</td><td>{l.closed}</td><td>{formatMMK(l.outstanding)}</td><td className="font-mono">{l.last}</td></tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Fact title="Open disputes" items={openDisputes.map((d) => `${d.id} · ${mfi(d.mfiId)} · ${d.status}`)} />
          <Fact title="Pending corrections" items={pendingCorrections.map((d) => `${d.id} · awaiting CIC approval`)} />
          <Fact title="Inquiries, last 12 months" items={recentInquiries.map((i) => `${i.at.slice(0, 10)} · ${mfi(i.mfiId)} · ${purpose(i.purpose)}`)} />
        </div>
      </CardBody>
    </Card>
  );
}

function Fact({ title, items }) {
  return (
    <div className="rounded-lg border border-slate-100 bg-slate-50/60 p-3">
      <p className="text-[11px] font-medium text-slate-500">{title}</p>
      <p className="mt-0.5 text-xl font-bold text-slate-900">{items.length}</p>
      {items.length > 0 && <ul className="mt-1 space-y-0.5 text-[11px] text-slate-600">{items.slice(0, 4).map((t) => <li key={t}>{t}</li>)}</ul>}
      {items.length > 4 && <p className="text-[11px] text-slate-500">+{items.length - 4} more</p>}
    </div>
  );
}
