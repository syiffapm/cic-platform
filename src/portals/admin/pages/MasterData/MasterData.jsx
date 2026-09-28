import { useState } from 'react';
import { Building2, Eye, Globe, ShieldCheck } from 'lucide-react';
import { Alert, PageHeader, StatCard, Tabs } from '@/components/ui';
import { AS_OF } from '@/data/kpis';
import { useStore } from '@/context/StoreContext';
import PendingApprovals from '../../components/PendingApprovals';
import { REFERENCE_TABLES } from '../../data/masterData';
import InstitutionsTab from './components/InstitutionsTab';
import ReferenceTab from './components/ReferenceTab';

const TABS = [
  { id: 'institutions', label: 'Institutions' },
  ...Object.entries(REFERENCE_TABLES).map(([id, t]) => ({ id, label: t.label })),
];

export default function MasterData() {
  const { institutions } = useStore();
  const [tab, setTab] = useState('institutions');
  const licensed = institutions.filter((i) => i.status === 'Licensed').length;
  const published = institutions.filter((i) => i.publish).length;
  const watch = institutions.filter((i) => ['Under Review', 'Suspended'].includes(i.status)).length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Master data"
        subtitle="Institution master and reference tables shared by every portal. One record per MFI drives the public directory, regulator views and ingestion validation."
      />

      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <StatCard label="Institutions in master" value={institutions.length} icon={Building2} definition="Records in the Institution Master, all statuses" asOf={AS_OF} />
        <StatCard label="Licensed" value={licensed} icon={ShieldCheck} tone="green" definition="Institutions whose current licence status is Licensed (set by the CBM Licensing Officer)" asOf={AS_OF} />
        <StatCard label="Published to directory" value={published} icon={Globe} tone="teal" definition="Institutions with the publish flag on — visible in the public MFI directory" asOf={AS_OF} />
        <StatCard label="Under review / suspended" value={watch} icon={Eye} tone="warm" definition="Institutions with licence status Under Review or Suspended" asOf={AS_OF} />
      </div>

      <Alert tone="info" title="Licence status is owned by the regulator">
        Licence status changes are made by the Licensing Officer in the Government Portal (Supervision → Institution register) with executive approval. Here you maintain tier, publish flag and reference data; each change needs a checker.
      </Alert>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="space-y-4 xl:col-span-2">
          <Tabs tabs={TABS} value={tab} onChange={setTab} />
          {tab === 'institutions' ? <InstitutionsTab /> : <ReferenceTab key={tab} config={REFERENCE_TABLES[tab]} />}
        </div>
        <div className="space-y-6">
          <PendingApprovals moduleLabel="Master data" />
        </div>
      </div>
    </div>
  );
}
