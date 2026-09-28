import { useState } from 'react';
import { ClipboardCheck, FileSearch, Inbox, Siren } from 'lucide-react';
import { PageHeader, StatCard, Tabs } from '@/components/ui';
import { useInitialParam } from '@/portals/government/components/FocusBanner';
import { slaDaysLeft } from '@/lib/format';
import { useAdminCollection } from '../../context/AdminStore';
import { BREACHES, DPIAS, DSRS, POLICIES, RETENTION } from '../../data/compliance';
import { DASH_AS_OF } from '../../data/ops';
import { useAdmin } from '../../lib/useAdmin';
import BreachTab from './components/BreachTab';
import DsrTab from './components/DsrTab';
import { DpiaTab, PoliciesTab, RetentionTab } from './components/RecordsTabs';

export default function Compliance() {
  const { readOnly, can, piiUnmasked, nrc, audit } = useAdmin('adm.compliance');
  const [tab, setTab] = useState(useInitialParam('tab', ['dsr', 'retention', 'breach', 'dpia', 'policies'], 'dsr'));
  const [dsrs] = useAdminCollection('dsrs', DSRS);
  const [breaches] = useAdminCollection('breaches', BREACHES);

  const openDsr = dsrs.filter((r) => r.status !== 'Completed');
  const overdueDsr = openDsr.filter((r) => slaDaysLeft(r.due) < 0).length;
  const openBreaches = breaches.filter((b) => !b.regulatorNotified && b.status !== 'Closed').length;
  const ack = POLICIES.reduce((s, p) => s + p.acknowledged, 0) / POLICIES.reduce((s, p) => s + p.total, 0);

  const tabs = [
    { id: 'dsr', label: 'Data subject requests', count: openDsr.length },
    { id: 'retention', label: 'Retention schedule', count: RETENTION.length },
    { id: 'breach', label: 'Breach register', count: openBreaches || undefined },
    { id: 'dpia', label: 'DPIA records', count: DPIAS.length },
    { id: 'policies', label: 'Policy acknowledgements' },
  ];

  return (
    <div>
      <PageHeader
        title="Compliance & data protection"
        subtitle="DPO workspace: data subject rights, retention, breach notification, impact assessments and staff policy attestations."
      />
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Open data subject requests" value={openDsr.length} icon={Inbox} tone="navy" delta={overdueDsr ? `${overdueDsr} overdue` : 'None overdue'}
          definition="Access, rectification, closure and objection requests not yet completed; statutory response time 30 days" asOf={DASH_AS_OF} />
        <StatCard label="Breaches awaiting notification" value={openBreaches} icon={Siren} tone={openBreaches ? 'red' : 'green'}
          definition="Registered personal-data breaches not yet notified to the regulator (72-hour clock)" asOf={DASH_AS_OF} />
        <StatCard label="DPIAs in review / expired" value={DPIAS.filter((d) => d.status !== 'Approved').length} icon={FileSearch} tone="warm"
          definition="Impact assessments not currently approved and in force" asOf={DASH_AS_OF} />
        <StatCard label="Policy acknowledgement" value={`${Math.round(ack * 100)}%`} icon={ClipboardCheck} tone="teal"
          definition="Staff acknowledgements ÷ required acknowledgements across all current policies" asOf={DASH_AS_OF} />
      </div>
      <Tabs tabs={tabs} value={tab} onChange={setTab} className="mb-6" />
      {tab === 'dsr' && <DsrTab readOnly={!can('update')} piiUnmasked={piiUnmasked} nrc={nrc} audit={audit} />}
      {tab === 'retention' && <RetentionTab />}
      {tab === 'breach' && <BreachTab readOnly={!can('update')} canCreate={can('create')} audit={audit} />}
      {tab === 'dpia' && <DpiaTab />}
      {tab === 'policies' && <PoliciesTab readOnly={readOnly} audit={audit} />}
    </div>
  );
}
