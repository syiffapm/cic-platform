import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Brain, FolderPlus, ThumbsDown, ThumbsUp } from 'lucide-react';
import { useSession } from '@/context/AuthContext';
import { useStore } from '@/context/StoreContext';
import { usePermissions } from '@/lib/rbac';
import { useInstitutionMap } from '../../components/common';
import { Alert, Badge, Button, Card, CardBody, PageHeader } from '@/components/ui';
import { AI_INSIGHTS } from '../../data/riskData';
import useCaseActions from '../../lib/useCaseActions';

/** AI insights (GOV-20, option). Every card explains its drivers; a human decides whether to act. */
export default function AiInsights() {
  const user = useSession('gov');
  const { logAudit } = useStore();
  const insts = useInstitutionMap();
  const { openCase } = useCaseActions();
  const navigate = useNavigate();
  const [feedback, setFeedback] = useState({});
  const { can } = usePermissions('gov');
  const canCase = can('gov.cases', 'create');

  const rate = (id, v) => {
    setFeedback((f) => ({ ...f, [id]: v }));
    logAudit({ actor: user.name, role: user.role, tenant: 'CBM', action: 'AI_INSIGHT_FEEDBACK', module: 'AI insights', target: `${id}: ${v}`, outcome: 'Success' });
  };

  const toCase = (ins) => {
    const inst = Object.values(insts).find((i) => i.short === ins.mfis[0]);
    const id = openCase({ title: ins.title, mfiId: inst?.id, source: 'AI insight', sourceRef: ins.id, severity: ins.score > 0.85 ? 'High' : 'Medium', summary: ins.finding });
    navigate(`/gov/cases/${id}`);
  };

  return (
    <div>
      <PageHeader
        title="AI insights"
        subtitle="Machine-generated anomaly and over-indebtedness signals with explanations. Signals never trigger action by themselves."
      />
      <Alert tone="info" className="mb-6" title="Decision support only">
        Models run monthly on anonymised aggregates. Each insight lists its drivers and model version so a supervisor can judge it; feedback is used to retune the models.
      </Alert>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 xl:grid-cols-3">
        {AI_INSIGHTS.map((ins) => (
          <Card key={ins.id} className="flex flex-col">
            <CardBody className="flex flex-1 flex-col">
              <div className="flex items-start justify-between gap-3">
                <div className="rounded-lg bg-violet-50 p-2 text-violet-600"><Brain className="h-5 w-5" aria-hidden="true" /></div>
                <div className="text-right">
                  <Badge tone="violet">{ins.kind}</Badge>
                  <p className="mt-1 text-[11px] text-slate-500">Anomaly score <b className="text-slate-800">{ins.score.toFixed(2)}</b></p>
                </div>
              </div>
              <h2 className="mt-3 text-sm font-semibold text-slate-900">{ins.title}</h2>
              <p className="mt-1 text-sm text-slate-600">{ins.finding}</p>
              <div className="mt-4 rounded-lg bg-slate-50 p-3">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Why the model flagged this</p>
                <dl className="mt-2 space-y-1.5 text-xs">
                  {ins.drivers.map(([k, v]) => (
                    <div key={k} className="flex justify-between gap-3"><dt className="text-slate-600">{k}</dt><dd className="font-semibold text-slate-900">{v}</dd></div>
                  ))}
                </dl>
                <p className="mt-2 border-t border-slate-200 pt-2 text-[11px] text-slate-500">{ins.model} · confidence {ins.confidence} · MFIs: {ins.mfis.join(', ')}</p>
              </div>
              <div className="mt-auto flex flex-wrap items-center gap-2 pt-4">
                {canCase && <Button size="sm" icon={FolderPlus} onClick={() => toCase(ins)}>Open case</Button>}
                <Button size="sm" variant={feedback[ins.id] === 'useful' ? 'success' : 'ghost'} icon={ThumbsUp} onClick={() => rate(ins.id, 'useful')} aria-pressed={feedback[ins.id] === 'useful'}>Useful</Button>
                <Button size="sm" variant={feedback[ins.id] === 'not useful' ? 'danger' : 'ghost'} icon={ThumbsDown} onClick={() => rate(ins.id, 'not useful')} aria-pressed={feedback[ins.id] === 'not useful'}>Not useful</Button>
              </div>
            </CardBody>
          </Card>
        ))}
      </div>
    </div>
  );
}
