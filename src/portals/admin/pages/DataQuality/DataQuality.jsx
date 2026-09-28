import { useState } from 'react';
import { AlertTriangle, Database, FileWarning, Gauge } from 'lucide-react';
import { PageHeader, StatCard, Tabs } from '@/components/ui';
import { formatNumber } from '@/lib/format';
import { useAdminCollection } from '../../context/AdminStore';
import PendingApprovals from '../../components/PendingApprovals';
import { BATCHES, RECON, REJECTS } from '../../data/dataQuality';
import BatchMonitor from './components/BatchMonitor';
import SchemaVersions from './components/SchemaVersions';
import DqRuleEditor from './components/DqRuleEditor';
import RejectQueue from './components/RejectQueue';
import Reconciliation from './components/Reconciliation';

const AS_OF_NOW = '24 Sep 2026 10:00';

export default function DataQuality() {
  const [batches, batchApi] = useAdminCollection('dqBatches', BATCHES);
  const [tab, setTab] = useState('batches');

  const current = batches.filter((b) => b.period === 'Aug 2026');
  const scored = current.filter((b) => b.dq != null);
  const avgDq = scored.length ? (scored.reduce((s, b) => s + b.dq, 0) / scored.length).toFixed(1) : '—';
  const rejectedRows = current.filter((b) => b.dq != null).reduce((s, b) => s + (b.rows - b.accepted), 0);
  const problem = current.filter((b) => ['Failed', 'Rejected'].includes(b.status)).length;

  const tabs = [
    { id: 'batches', label: 'Batch monitor', count: batches.length },
    { id: 'schema', label: 'Schema versions' },
    { id: 'rules', label: 'DQ rules' },
    { id: 'rejects', label: 'Reject queue', count: REJECTS.length },
    { id: 'recon', label: 'Reconciliation', count: RECON.length },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Data quality & ingestion"
        subtitle="Monitor MFI submissions across the sector, manage schema versions and validation rules, work the reject queue and reconcile control totals."
      />

      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <StatCard label="Batches this cycle" value={`${current.length}`} icon={Database} definition="Batches received for reporting period Aug 2026 (all statuses)" asOf={AS_OF_NOW} />
        <StatCard label="Average DQ score" value={`${avgDq}%`} icon={Gauge} tone="teal" definition="Accepted rows ÷ received rows, weighted by critical-field completeness — mean over validated batches" asOf={AS_OF_NOW} />
        <StatCard label="Rejected rows" value={formatNumber(rejectedRows)} icon={FileWarning} tone="warm" definition="Rows failing an error-severity rule in validated batches this cycle; returned to MFIs for correction" asOf={AS_OF_NOW} />
        <StatCard label="Failed / rejected batches" value={problem} icon={AlertTriangle} tone="red" definition="Batches with status Failed (technical) or Rejected (DQ below 80% threshold)" asOf={AS_OF_NOW} />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="space-y-4 xl:col-span-2">
          <Tabs tabs={tabs} value={tab} onChange={setTab} />
          {tab === 'batches' && <BatchMonitor batches={batches} api={batchApi} />}
          {tab === 'schema' && <SchemaVersions />}
          {tab === 'rules' && <DqRuleEditor />}
          {tab === 'rejects' && <RejectQueue />}
          {tab === 'recon' && <Reconciliation />}
        </div>
        <div className="space-y-6">
          <PendingApprovals moduleLabel="Data quality" />
        </div>
      </div>
    </div>
  );
}
