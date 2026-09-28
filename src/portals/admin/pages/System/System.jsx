import { useState } from 'react';
import { PageHeader, Tabs } from '@/components/ui';
import { useInitialParam } from '@/portals/government/components/FocusBanner';
import PendingApprovals from '../../components/PendingApprovals';
import { useAdmin } from '../../lib/useAdmin';
import ApiClientsCard from './components/ApiClientsCard';
import BackupCard from './components/BackupCard';
import ConfigCard from './components/ConfigCard';
import FeatureFlagsCard from './components/FeatureFlagsCard';
import JobsCard from './components/JobsCard';

const TABS = [
  { id: 'config', label: 'Configuration' },
  { id: 'jobs', label: 'Job scheduler' },
  { id: 'backup', label: 'Backup & restore' },
  { id: 'flags', label: 'Feature flags' },
  { id: 'clients', label: 'API clients' },
];

export default function System() {
  const { user, role, store, readOnly, audit, requestApproval } = useAdmin('system');
  const [tab, setTab] = useState(useInitialParam('tab', TABS.map((t) => t.id), 'config'));
  const shared = { role, readOnly, requestApproval, approvals: store.approvals };

  return (
    <div>
      <PageHeader
        title="System configuration, jobs & backup"
        subtitle="Platform settings under dual control, scheduled jobs, backup and restore evidence, feature flags and API clients."
      />
      <Tabs tabs={TABS} value={tab} onChange={setTab} className="mb-6" />
      {tab === 'config' && (
        <div className="space-y-6">
          <ConfigCard user={user} {...shared} />
          <PendingApprovals moduleLabel="Admin · System" title="System change requests" />
        </div>
      )}
      {tab === 'jobs' && <JobsCard readOnly={readOnly} audit={audit} />}
      {tab === 'backup' && <BackupCard />}
      {tab === 'flags' && <FeatureFlagsCard {...shared} />}
      {tab === 'clients' && <ApiClientsCard {...shared} />}
    </div>
  );
}
