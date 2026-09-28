import { useEffect, useMemo, useState } from 'react';
import { ArrowUpRight } from 'lucide-react';
import { useSession } from '@/context/AuthContext';
import { useStore } from '@/context/StoreContext';
import { usePermissions } from '@/lib/rbac';
import { ScopeChip } from '@/portals/government/components/FeatureGuard';
import { useFocusParam } from '@/portals/government/components/FocusBanner';
import { useRegionScope } from '@/portals/government/lib/access';
import { AS_OF } from '@/data/kpis';
import { DISPUTE_REASONS } from '@/data/reference';
import { formatDate } from '@/lib/format';
import { Alert, Badge, Button, Card, DataTable, Modal, PageHeader, Select, StatCard, Textarea, Timeline, useToast } from '@/components/ui';
import { MfiLink, SlaChip, slaState, useInstitutionMap } from '../../components/common';
import { nowStamp, round } from '../../lib/util';

const DONE = ['Resolved', 'Closed', 'Rejected'];
const reasonLabel = (code) => DISPUTE_REASONS.find((r) => r.code === code)?.label ?? code;
const days = (a, b) => Math.max(0, Math.round((new Date(b) - new Date(a)) / 86400000));

function mfiResponseDays(d) {
  const h = d.history?.find((x) => /MFI responded|Correction submitted|correction/i.test(x.action) && !/Dispute filed/.test(x.action));
  if (h) return { days: days(d.filedAt, h.at.slice(0, 10)), pending: false };
  if (d.mfiResponse) return { days: null, pending: false };
  return { days: days(d.filedAt, '2026-09-24'), pending: true };
}

function slaKey(d) {
  if (DONE.includes(d.status)) return 'ok';
  if (d.status === 'Escalated') return 'breached';
  const a = slaState(d.dueAt).key;
  const m = !d.mfiResponse ? slaState(d.mfiDueAt).key : 'ok';
  return a === 'breached' || m === 'breached' ? 'breached' : a === 'risk' || m === 'risk' ? 'risk' : 'ok';
}

export default function DisputeOversight() {
  const user = useSession('gov');
  const { can } = usePermissions('gov');
  const { filterByMfi } = useRegionScope();
  const { disputes: allDisputes, patch, logAudit } = useStore();
  const disputes = filterByMfi(allDisputes);
  const insts = useInstitutionMap();
  const toast = useToast();
  const [f, setF] = useState({ status: '', mfi: '', sla: '' });
  const [sel, setSel] = useState(null);
  const [note, setNote] = useState('');
  const [focus, clearFocus] = useFocusParam();
  // Officers who handle disputes see the borrower's name; everyone else sees the pseudonymous ID only.
  const showNames = can('gov.disputes', 'update');

  const all = useMemo(() => disputes.map((d) => {
    const resp = mfiResponseDays(d);
    return { ...d, mfiName: insts[d.mfiId]?.short, reasonText: reasonLabel(d.reason), slaKey: slaKey(d), respDays: resp.days ?? -1, respPending: resp.pending };
  }), [disputes, insts]);
  const rows = all.filter((d) => (!f.status || d.status === f.status) && (!f.mfi || d.mfiId === f.mfi) && (!f.sla || d.slaKey === f.sla));
  const open = all.filter((d) => !DONE.includes(d.status));
  // Opened from "My work": show that dispute straight away.
  useEffect(() => {
    const d = focus && all.find((x) => x.id === focus);
    if (d) setSel(d);
  }, [focus]); // eslint-disable-line react-hooks/exhaustive-deps
  const closeDetail = () => { setSel(null); setNote(''); if (focus) clearFocus(); };
  const answered = all.filter((d) => !d.respPending && d.respDays >= 0);

  const escalate = () => {
    const d = sel;
    patch('disputes', d.id, (x) => ({ status: 'Escalated', history: [...(x.history ?? []), { at: nowStamp(), by: `${user.name} (CBM)`, action: `Escalated to CBM decision: ${note.trim()}` }] }));
    logAudit({ actor: user.name, role: user.role, tenant: 'CBM', action: 'DISPUTE_ESCALATE', module: 'Consumer Protection', target: d.id, purpose: note.trim(), outcome: 'Success' });
    toast(`${d.id} escalated to CBM decision`, 'success');
    closeDetail();
  };

  const columns = [
    { key: 'id', header: 'Dispute', sortable: true, render: (r) => <><p className="font-mono text-xs text-slate-700">{r.id}</p><p className="text-[11px] text-slate-500">{r.channel} · {formatDate(r.filedAt)}</p></> },
    { key: 'borrowerId', header: 'Borrower', render: (r) => <><p className="font-mono text-xs">{r.borrowerId}</p>{showNames && <p className="text-[11px] text-slate-500">{r.borrowerName}</p>}</> },
    { key: 'mfiName', header: 'MFI', sortable: true, render: (r) => <MfiLink inst={insts[r.mfiId]} id={r.mfiId} /> },
    { key: 'reasonText', header: 'Reason', render: (r) => <span className="text-xs">{r.reason} · {r.reasonText}</span> },
    { key: 'status', header: 'Status', sortable: true, render: (r) => <Badge status={r.status}>{r.status}</Badge> },
    { key: 'respDays', header: 'MFI response', sortable: true, render: (r) => (r.respPending ? <span className="text-xs text-amber-700">Pending · {r.respDays}d</span> : r.respDays >= 0 ? <span className="text-xs">{r.respDays} days</span> : <span className="text-xs text-slate-500">Responded</span>) },
    { key: 'slaKey', header: 'SLA', sortable: true, render: (r) => (r.status === 'Escalated' ? <Badge tone="red">Breached · escalated</Badge> : <SlaChip due={r.respPending ? r.mfiDueAt : r.dueAt} done={DONE.includes(r.status)} />) },
    { key: 'act', header: <span className="relative"><span className="sr-only">Actions</span></span>, render: (r) => <Button size="sm" variant={DONE.includes(r.status) || r.status === 'Escalated' ? 'ghost' : 'outline'} onClick={() => setSel(r)}>{DONE.includes(r.status) || r.status === 'Escalated' ? 'View' : 'Review'}</Button> },
  ];

  const canEscalate = sel && can('gov.disputes', 'update') && !DONE.includes(sel.status) && sel.status !== 'Escalated';

  return (
    <div>
      <PageHeader
        title="Dispute oversight"
        subtitle={`All borrower disputes across MFIs and channels. MFI must respond within 10 working days; CIC resolves within 30 days. As of ${AS_OF}.`}
        actions={<ScopeChip />}
      />
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Open disputes" value={open.length} tone="navy" definition="Disputes not resolved, closed or rejected" asOf={AS_OF} />
        <StatCard label="SLA breached / escalated" value={open.filter((d) => d.slaKey === 'breached').length} tone="red" definition="Open disputes past the MFI response or resolution due date" asOf={AS_OF} />
        <StatCard label="At risk (≤ 3 days)" value={open.filter((d) => d.slaKey === 'risk').length} tone="warm" definition="Open disputes due within 3 days" asOf={AS_OF} />
        <StatCard label="Avg MFI response time" value={answered.length ? `${round(answered.reduce((s, d) => s + d.respDays, 0) / answered.length)} days` : '—'} tone="teal" definition="Days from filing to MFI response, disputes with a response" asOf={AS_OF} />
      </div>
      <Card>
        <DataTable
          columns={columns}
          rows={rows}
          searchKeys={['id', 'borrowerId', 'mfiName', 'loanId']}
          toolbar={
            <>
              <Select aria-label="Status" value={f.status} onChange={(e) => setF({ ...f, status: e.target.value })} placeholder="All statuses" options={[...new Set(all.map((d) => d.status))]} />
              <Select aria-label="MFI" value={f.mfi} onChange={(e) => setF({ ...f, mfi: e.target.value })} placeholder="All MFIs" options={[...new Set(all.map((d) => d.mfiId))].map((id) => ({ value: id, label: insts[id]?.short ?? id }))} />
              <Select aria-label="SLA" value={f.sla} onChange={(e) => setF({ ...f, sla: e.target.value })} placeholder="Any SLA state" options={[{ value: 'breached', label: 'Breached' }, { value: 'risk', label: 'At risk' }, { value: 'ok', label: 'OK' }]} />
            </>
          }
        />
      </Card>

      <Modal
        open={!!sel}
        onClose={closeDetail}
        size="lg"
        title={sel ? `${sel.id} · ${sel.reasonText}` : ''}
        subtitle={sel ? `${insts[sel.mfiId]?.name} · loan ${sel.loanId} · filed ${formatDate(sel.filedAt)}` : ''}
        footer={canEscalate && <><Button variant="outline" onClick={closeDetail}>Close</Button><Button variant="danger" icon={ArrowUpRight} onClick={escalate} disabled={note.trim().length < 10}>Escalate to CBM decision</Button></>}
      >
        {sel && (
          <div className="space-y-4">
            <p className="rounded-lg bg-slate-50 p-3 text-sm text-slate-700">{sel.description}</p>
            {sel.mfiResponse && <Alert tone="info" title="MFI response">{sel.mfiResponse}</Alert>}
            {sel.outcome && <Alert tone="success" title="Outcome">{sel.outcome}</Alert>}
            <Timeline items={(sel.history ?? []).map((h) => ({ title: h.action, time: h.at, actor: h.by }))} />
            {canEscalate && <Textarea label="Escalation note" required rows={2} value={note} onChange={(e) => setNote(e.target.value)} hint="Recorded in the dispute history and audit log (min 10 characters)." />}
          </div>
        )}
      </Modal>
    </div>
  );
}
