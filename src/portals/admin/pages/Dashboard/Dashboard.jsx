import { useMemo, useState } from 'react';
import { Alert, PageHeader, Tabs } from '@/components/ui';
import { useAdmin } from '../../lib/useAdmin';
import BusinessTab from './components/BusinessTab';
import ContentTab from './components/ContentTab';
import OperationsTab from './components/OperationsTab';
import SecurityTab from './components/SecurityTab';
import MyWork from '@/portals/government/components/MyWork';

/** Which dashboards each role sees (any readable feature unlocks the tab) — all figures are aggregated. */
const TABS = [
  { id: 'operations', label: 'Operations', features: null },
  { id: 'security', label: 'Security', features: ['adm.audit'] },
  { id: 'content', label: 'Content', features: ['cms.content', 'cms.analytics', 'cms.notifications'] },
  { id: 'business', label: 'Business', features: ['adm.billing', 'adm.masterData'] },
];

export default function Dashboard() {
  const { store, piiUnmasked, can } = useAdmin('adm.operations');
  const tabs = useMemo(() => TABS.filter((t) => !t.features || t.features.some((f) => can('read', f))), [can]);
  const [tab, setTab] = useState('operations');
  const hidden = TABS.length - tabs.length;

  return (
    <div>
      <PageHeader
        title="Operations dashboard"
        subtitle="Citizen accounts and applications, platform health, report volume, security, content and business KPIs for the CIC back office."
      />
      <MyWork title="Needs your action" limit={10} accessLink />

      <Tabs tabs={tabs} value={tab} onChange={setTab} className="mb-6" />
      {hidden > 0 && tab === 'operations' && (
        <Alert tone="info" className="mb-6">
          {hidden} dashboard{hidden > 1 ? 's are' : ' is'} not available for your role. Figures are aggregated; borrower identifiers are masked for roles without PII access.
        </Alert>
      )}

      {tab === 'operations' && <OperationsTab store={store} maskBorrower={!piiUnmasked} links={{ iam: can('read', 'adm.users'), helpdesk: can('read', 'adm.helpdesk'), reportRequests: can('read', 'adm.reportRequests') }} />}
      {tab === 'security' && <SecurityTab />}
      {tab === 'content' && <ContentTab announcements={store.announcements} />}
      {tab === 'business' && <BusinessTab institutions={store.institutions} />}
    </div>
  );
}
