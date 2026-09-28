import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, CheckCircle2, Search, XCircle } from 'lucide-react';
import { useSession } from '@/context/AuthContext';
import { useStore } from '@/context/StoreContext';
import { AS_OF } from '@/data/kpis';
import { formatDate } from '@/lib/format';
import { usePermissions } from '@/lib/rbac';
import { ScopeChip } from '@/portals/government/components/FeatureGuard';
import FocusBanner, { useFocusParam } from '@/portals/government/components/FocusBanner';
import ConfirmReasonModal from '@/portals/government/components/ConfirmReasonModal';
import { useRegionScope } from '@/portals/government/lib/access';
import { Badge, Button, Card, DataTable, PageHeader, Select, StatCard, Tabs, useToast } from '@/components/ui';
import RulesLibrary from '../../components/ews/RulesLibrary';
import { MfiLink, SeverityBadge, useInstitutionMap } from '../../components/common';
import { ruleById } from '../../data/ews';
import { useRegulator } from '../../lib/RegulatorStore';
import useCaseActions from '../../lib/useCaseActions';

const SEV_ORDER = { Critical: 0, High: 1, Medium: 2, Low: 3 };

export default function EwsAlerts() {
  const user = useSession('gov');
  const { can } = usePermissions('gov');
  const { filterByMfi } = useRegionScope();
  const { logAudit } = useStore();
  const { alerts: allAlerts, rules, patch } = useRegulator();
  const alerts = filterByMfi(allAlerts);
  const { investigateAlert } = useCaseActions();
  const insts = useInstitutionMap();
  const navigate = useNavigate();
  const toast = useToast();
  const [tab, setTab] = useState('queue');
  const [focus, clearFocus] = useFocusParam();
  const [dismissing, setDismissing] = useState(null);
  const [sev, setSev] = useState('');
  const [status, setStatus] = useState('');
  const canOpenCase = can('gov.cases', 'create');
  const canTriage = can('gov.ews', 'update');

  const rows = useMemo(() => alerts
    .filter((a) => (focus ? a.id === focus : (!sev || a.severity === sev) && (!status || a.status === status)))
    .map((a) => ({ ...a, rule: ruleById(a.ruleId), mfiName: insts[a.mfiId]?.name, sevRank: SEV_ORDER[a.severity] }))
    .sort((a, b) => a.sevRank - b.sevRank || b.raisedAt.localeCompare(a.raisedAt)), [alerts, sev, status, insts, focus]);

  const investigate = (a) => {
    const id = investigateAlert(a);
    if (!a.caseId) toast(`Case ${id} opened from ${a.id}`, 'success');
    navigate(`/gov/cases/${id}`);
  };

  const setAlertStatus = (a, s, reason) => {
    patch('alerts', a.id, { status: s, ...(reason ? { note: reason } : {}) });
    logAudit({ actor: user.name, role: user.role, tenant: 'CBM', action: `EWS_ALERT_${s.toUpperCase()}`, module: 'Risk Intelligence', target: a.id, ...(reason ? { purpose: reason } : {}), outcome: 'Success' });
  };

  const columns = [
    { key: 'id', header: 'Alert', sortable: true, render: (r) => <><p className="font-mono text-xs text-slate-700">{r.id}</p><p className="text-[11px] text-slate-500">{formatDate(r.raisedAt)}</p></> },
    { key: 'sevRank', header: 'Severity', sortable: true, render: (r) => <SeverityBadge severity={r.severity} /> },
    { key: 'ruleId', header: 'Rule', sortable: true, render: (r) => <><p className="font-medium text-slate-900">{r.rule?.name}</p><p className="font-mono text-[11px] text-slate-500">{r.ruleId} · {r.ruleVersion}</p></> },
    { key: 'mfiId', header: 'MFI', render: (r) => <><MfiLink inst={insts[r.mfiId]} id={r.mfiId} />{r.township && <p className="text-[11px] text-slate-500">Township: {r.township}</p>}</> },
    {
      key: 'triggered', header: 'Triggered vs threshold', className: 'min-w-[160px]',
      render: (r) => (
        <div>
          <p className="font-mono text-xs"><b className="text-red-700">{r.triggered}</b> <span className="text-slate-500">{r.rule?.operator}</span> {r.threshold}</p>
          <p className="text-[11px] text-slate-500">{r.rule?.metric}</p>
        </div>
      ),
    },
    { key: 'status', header: 'Status', sortable: true, render: (r) => <><Badge status={r.status === 'New' ? 'Open' : r.status === 'Case open' ? 'Investigating' : r.status}>{r.status}</Badge>{r.note && <p className="mt-0.5 max-w-[160px] text-[11px] text-slate-500">{r.note}</p>}</> },
    {
      key: 'actions', header: <span className="relative"><span className="sr-only">Actions</span></span>,
      render: (r) => (
        <div className="flex flex-wrap justify-end gap-1.5">
          {r.caseId
            ? <Button size="sm" variant="outline" icon={ArrowRight} onClick={() => navigate(`/gov/cases/${r.caseId}`)}>{r.caseId}</Button>
            : canOpenCase && r.status !== 'Dismissed' && <Button size="sm" icon={Search} onClick={() => investigate(r)}>Investigate</Button>}
          {canTriage && r.status === 'New' && (
            <>
              <Button size="sm" variant="ghost" icon={CheckCircle2} onClick={() => setAlertStatus(r, 'Acknowledged')} aria-label={`Acknowledge ${r.id}`}>Ack</Button>
              <Button size="sm" variant="ghost" icon={XCircle} onClick={() => setDismissing(r)} aria-label={`Dismiss ${r.id}`}>Dismiss</Button>
            </>
          )}
        </div>
      ),
    },
  ];

  const count = (s) => alerts.filter((a) => a.status === s).length;

  return (
    <div>
      <PageHeader
        title="Early-warning system"
        subtitle={`Alerts raised by versioned EWS rules on the ${AS_OF} data cut. "Investigate" opens a supervisory case with owner and deadline.`}
        actions={<ScopeChip />}
      />
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="New — awaiting triage" value={count('New')} tone="warm" definition="Alerts not yet acknowledged, dismissed or linked to a case" asOf={AS_OF} />
        <StatCard label="Critical / high open" value={alerts.filter((a) => ['Critical', 'High'].includes(a.severity) && a.status !== 'Dismissed').length} tone="red" definition="Non-dismissed alerts with severity Critical or High" asOf={AS_OF} />
        <StatCard label="Linked to a case" value={count('Case open')} tone="violet" definition="Alerts under investigation in a supervisory case" asOf={AS_OF} />
        <StatCard label="Active rules" value={rules.length} tone="navy" definition="EWS rules with an active version" asOf={AS_OF} />
      </div>
      <Tabs className="mb-4" value={tab} onChange={setTab} tabs={[{ id: 'queue', label: 'Alert queue', count: alerts.length }, { id: 'rules', label: 'Rules library', count: rules.length }]} />
      {tab === 'queue' ? (
        <Card>
          {focus && <div className="px-4 pt-3"><FocusBanner id={focus} onClear={clearFocus} className="" /></div>}
          <DataTable
            columns={columns}
            rows={rows}
            searchKeys={['id', 'mfiName', 'ruleId', 'township']}
            toolbar={
              <>
                <Select aria-label="Severity" value={sev} onChange={(e) => setSev(e.target.value)} placeholder="All severities" options={['Critical', 'High', 'Medium', 'Low']} />
                <Select aria-label="Status" value={status} onChange={(e) => setStatus(e.target.value)} placeholder="All statuses" options={['New', 'Acknowledged', 'Case open', 'Dismissed']} />
              </>
            }
          />
          {!canOpenCase && <p className="border-t border-slate-100 px-4 py-2 text-[11px] text-slate-500">Your role can view alerts{canTriage ? ' and triage them' : ''}; opening supervisory cases needs the Create right on Supervisory cases.</p>}
        </Card>
      ) : <RulesLibrary />}
      <ConfirmReasonModal
        open={!!dismissing}
        title="Dismiss this alert?"
        subtitle={dismissing ? `${dismissing.id} · ${insts[dismissing.mfiId]?.short ?? dismissing.mfiId}` : ''}
        body={<p>A dismissed alert leaves the triage queue and cannot be linked to a case. Give the reason supervisors will see.</p>}
        confirmLabel="Dismiss alert"
        reasonLabel="Reason for dismissal"
        onCancel={() => setDismissing(null)}
        onConfirm={(reason) => { setAlertStatus(dismissing, 'Dismissed', reason); setDismissing(null); toast(`${dismissing.id} dismissed`, 'info'); }}
      />
    </div>
  );
}
