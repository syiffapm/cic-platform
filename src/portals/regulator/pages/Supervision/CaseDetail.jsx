import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { useSession } from '@/context/AuthContext';
import { usePermissions } from '@/lib/rbac';
import { useRegionScope } from '@/portals/government/lib/access';
import { useStore } from '@/context/StoreContext';
import { formatDate } from '@/lib/format';
import { Alert, Badge, Button, Card, CardBody, CardHeader, EmptyState, PageHeader, Select, Stepper } from '@/components/ui';
import { DefList, MfiLink, SeverityBadge, SlaChip, useInstitutionMap } from '../../components/common';
import { CaseDocuments, Correspondence } from '../../components/cases/CaseLog';
import { ActionPanel, ClosePanel, DecisionPanel, RequestInfoPanel, StagePanel } from '../../components/cases/CaseWorkflow';
import { CASE_OWNERS } from '../../data/cases';
import { useRegulator } from '../../lib/RegulatorStore';
import { CASE_STAGES, nowStamp } from '../../lib/util';

const sourceLink = (c) => {
  if (c.source === 'EWS alert') return '/gov/ews';
  if (c.source === 'Complaint') return '/gov/complaints';
  if (c.source === 'Dispute') return '/gov/disputes';
  return null;
};

export default function CaseDetail() {
  const { id } = useParams();
  const user = useSession('gov');
  const { can } = usePermissions('gov');
  const { mfiInScope, label: scopeLabel } = useRegionScope();
  const { logAudit } = useStore();
  const { cases, patch } = useRegulator();
  const insts = useInstitutionMap();
  const c = cases.find((x) => x.id === id);

  if (!c) return <EmptyState title="Case not found" description={`No case ${id}.`} action={<Link to="/gov/cases"><Button variant="outline">All cases</Button></Link>} />;
  if (!mfiInScope(c.mfiId)) return <EmptyState title="Outside your regional scope" description={`Case ${id} concerns an institution outside ${scopeLabel}.`} action={<Link to="/gov/cases"><Button variant="outline">All cases</Button></Link>} />;

  const inst = insts[c.mfiId];
  const closed = c.stage === 5;
  const canEdit = can('gov.cases', 'update');
  const blocked = (c.stage === 3 && c.decision?.status !== 'Approved') || c.stage >= 4;
  const blockReason = c.stage === 3 ? 'Decision must be approved first' : c.stage === 4 ? 'Use "Close case" below' : '';

  const move = (delta) => {
    const to = c.stage + delta;
    patch('cases', c.id, (x) => ({ stage: to, correspondence: [...x.correspondence, { at: nowStamp(), from: user.name, to: 'File', channel: 'Note', message: `Stage changed: ${CASE_STAGES[x.stage]} → ${CASE_STAGES[to]}` }] }));
    logAudit({ actor: user.name, role: user.role, tenant: 'CBM', action: 'CASE_STAGE_CHANGE', module: 'Supervision', target: `${c.id}: ${CASE_STAGES[c.stage]} → ${CASE_STAGES[to]}`, outcome: 'Success' });
  };

  const reassign = (owner) => {
    patch('cases', c.id, { owner });
    logAudit({ actor: user.name, role: user.role, tenant: 'CBM', action: 'CASE_ASSIGN', module: 'Supervision', target: `${c.id} → ${owner}`, outcome: 'Success' });
  };

  const link = sourceLink(c);

  return (
    <div>
      <PageHeader
        title={c.title}
        subtitle={c.summary}
        breadcrumbs={[{ label: 'Supervisory cases', to: '/gov/cases' }, { label: c.id }]}
        actions={<><SeverityBadge severity={c.severity} /><SlaChip due={c.slaDue} done={closed} /></>}
      />

      <Card className="mb-6">
        <CardBody>
          <Stepper steps={CASE_STAGES} current={closed ? 6 : c.stage} />
          {!closed && canEdit && (
            <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-4">
              <Button size="sm" variant="outline" icon={ArrowLeft} onClick={() => move(-1)} disabled={c.stage === 0}>Back a stage</Button>
              <Button size="sm" icon={ArrowRight} onClick={() => move(1)} disabled={blocked}>Advance to {CASE_STAGES[c.stage + 1]}</Button>
              {blocked && <span className="text-[11px] text-slate-500">{blockReason}</span>}
            </div>
          )}
          {closed && <Alert tone="success" className="mt-4" title={`Closed ${formatDate(c.closedAt)}`}>{c.closingNote || 'Case closed.'}{c.publishIfPublic ? ' Public notice requested.' : ''}</Alert>}
        </CardBody>
      </Card>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="space-y-6 xl:col-span-2">
          {!closed && c.stage === 2 && <StagePanel title="Request information from the MFI"><RequestInfoPanel c={c} /></StagePanel>}
          {!closed && c.stage >= 3 && <StagePanel title="Decision (requires approval)"><DecisionPanel c={c} /></StagePanel>}
          {!closed && c.stage >= 4 && <StagePanel title="Enforcement action"><ActionPanel c={c} inst={inst} /></StagePanel>}
          {!closed && c.stage === 4 && <StagePanel title="Close case"><ClosePanel c={c} inst={inst} /></StagePanel>}
          {closed && c.decision && (
            <Card><CardHeader title="Outcome" /><CardBody>
              <p className="text-sm text-slate-800">{c.decision.text}</p>
              <p className="mt-1 text-[11px] text-slate-500">Proposed by {c.decision.proposedBy} · approved by {c.decision.approver}</p>
              {c.action && <p className="mt-2 text-sm"><Badge tone="red">{c.action.type}</Badge> <span className="text-xs text-slate-600">{c.action.ref} · {c.action.at}</span></p>}
            </CardBody></Card>
          )}
          <Correspondence c={c} readOnly={closed || !canEdit} />
        </div>
        <div className="space-y-6">
          <Card>
            <CardHeader title="Case details" />
            <CardBody className="space-y-4">
              <DefList cols={1} items={[
                ['Case ID', <span className="font-mono">{c.id}</span>],
                ['Institution', <MfiLink inst={inst} id={c.mfiId} />],
                ['Origin', <>{c.source} · {link ? <Link to={link} className="font-mono text-primary hover:underline">{c.sourceRef}</Link> : <span className="font-mono">{c.sourceRef}</span>}</>],
                ['Opened', formatDate(c.openedAt)],
                ['SLA due', formatDate(c.slaDue)],
              ]} />
              <Select label="Owner" value={c.owner} onChange={(e) => reassign(e.target.value)} disabled={closed || !canEdit} options={[...new Set([...CASE_OWNERS, c.owner])]} />
            </CardBody>
          </Card>
          <CaseDocuments c={c} readOnly={closed || !canEdit} />
        </div>
      </div>
    </div>
  );
}
