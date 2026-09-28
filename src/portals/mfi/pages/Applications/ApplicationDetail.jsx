import { useParams } from 'react-router-dom';
import { History } from 'lucide-react';
import { Badge, Card, CardBody, CardHeader, PageHeader, Stepper, Timeline } from '@/components/ui';
import { useStore } from '@/context/StoreContext';
import { useTenant } from '../../components/MfiState';
import { ViewOnlyBanner } from '../../components/access';
import TenantDenied from '../../components/TenantDenied';
import AppSlaBadge from '../../components/applications/AppSlaBadge';
import ApplicantCard from '../../components/applications/ApplicantCard';
import ConsentCard from '../../components/applications/ConsentCard';
import CreditCheckCard from '../../components/applications/CreditCheckCard';
import DecisionCard from '../../components/applications/DecisionCard';
import useApplicationActions from '../../components/applications/useApplicationActions';
import { stageIndex, statusTone } from '../../components/applications/appUtils';
import { useEntitlement } from '../../components/reportAccess/billingPlan';
import { applicantFile } from '../../components/applications/useApplicationActions';

const STEPS = ['Received', 'Consent verified', 'Credit check', 'Decision', 'Disbursed'];

/** One application: applicant, consent evidence, credit check, decision and disbursement. */
export default function ApplicationDetail() {
  const { id } = useParams();
  const { tenant, can } = useTenant();
  const { loanApplications } = useStore();
  const found = loanApplications.find((a) => a.id === id);
  const back = { backTo: '/mfi/credit/applications', backLabel: 'Back to applications' };

  if (!found || found.mfiId !== tenant) {
    return <TenantDenied module="Loan applications" resource={`Application ${id}`} crossTenant={!!found} {...back} />;
  }
  return <Detail app={found} canAct={can('mfi.applications', 'update')} canApprove={can('mfi.applications', 'approve')} />;
}

function Detail({ app, canAct, canApprove }) {
  const actions = useApplicationActions(app);
  const store = useStore();
  const ent = useEntitlement(app.borrowerId);
  const reportReady = !!ent.basic || !!applicantFile(app, store).noHit;
  const history = [...app.history].reverse().map((h, i) => ({ title: h.action, time: h.at, actor: h.by, tone: i === 0 ? 'current' : 'done' }));

  return (
    <div className="space-y-6">
      <PageHeader
        title={`${app.applicant.name} · ${app.id}`}
        subtitle={`${app.product} · submitted ${app.submittedAt} via ${app.channel.toLowerCase()}`}
        breadcrumbs={[{ label: 'Loan applications', to: '/mfi/credit/applications' }, { label: app.id }]}
        actions={(
          <div className="flex items-center gap-2">
            <Badge tone={statusTone(app.status)}>{app.pendingApproval ? 'Awaiting second approver' : app.status}</Badge>
            <AppSlaBadge app={app} />
          </div>
        )}
      />

      <ViewOnlyBanner feature="mfi.applications" />

      {app.status !== 'Withdrawn' && (
        <Card><CardBody className="py-4"><Stepper steps={STEPS} current={stageIndex(app)} /></CardBody></Card>
      )}

      <div className="grid gap-6 lg:grid-cols-3 [&>*]:min-w-0">
        <div className="space-y-6 lg:col-span-2">
          <ApplicantCard app={app} />
          <CreditCheckCard app={app} canAct={canAct} actions={actions} />
          <DecisionCard key={`${app.status}-${!!app.pendingApproval}`} app={app} canAct={canAct} canApprove={canApprove} actions={actions} reportReady={reportReady} />
        </div>
        <div className="space-y-6">
          <ConsentCard app={app} />
          <Card>
            <CardHeader title="Case history" subtitle="Visible to the applicant in plain language" icon={History} />
            <CardBody><Timeline items={history} /></CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}
