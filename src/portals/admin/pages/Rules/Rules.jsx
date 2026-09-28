import { useState } from 'react';
import { FileCheck2, FlaskConical, Scale, ShieldCheck } from 'lucide-react';
import { PageHeader, StatCard } from '@/components/ui';
import { useStore } from '@/context/StoreContext';
import { useAdminCollection } from '../../context/AdminStore';
import PendingApprovals from '../../components/PendingApprovals';
import { RULE_SETS } from '../../data/rules';
import RuleSetList from './components/RuleSetList';
import RuleSetDetail from './components/RuleSetDetail';

const AS_OF_NOW = '24 Sep 2026';

export default function Rules() {
  const [sets, api] = useAdminCollection('ruleSets', RULE_SETS);
  const { approvals } = useStore();
  const [selectedId, setSelectedId] = useState('GR-2026.3');
  const selected = sets.find((s) => s.id === selectedId) ?? sets[0];

  const pendingFor = (id) => approvals.find((a) => a.status === 'Pending' && a.payload?.ruleSetId === id);
  const active = sets.filter((s) => s.status === 'Active');
  const drafts = sets.filter((s) => s.status === 'Draft').length;
  const pendingCount = approvals.filter((a) => a.status === 'Pending' && a.module.includes('Rules')).length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Rules & scoring"
        subtitle="Versioned rule sets for credit grade, early warning and over-indebtedness. Back-test a candidate on a historical cohort, submit for activation with an effective date, and roll back if needed."
      />

      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <StatCard label="Active rule sets" value={active.length} icon={ShieldCheck} tone="green" definition="One active version per family; its ID is stamped on every report and inquiry" asOf={AS_OF_NOW} />
        <StatCard label="Active grade version" value={active.find((s) => s.family === 'grade')?.id ?? '—'} icon={Scale} definition="Grade rule set currently used for new credit reports" asOf={AS_OF_NOW} />
        <StatCard label="Drafts in test" value={drafts} icon={FlaskConical} tone="warm" definition="Candidate versions not yet submitted or approved" asOf={AS_OF_NOW} />
        <StatCard label="Awaiting approval" value={pendingCount} icon={FileCheck2} tone="violet" definition="Activation or rollback requests pending a checker (Super Administrator)" asOf={AS_OF_NOW} />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-4">
        <div className="space-y-6 xl:col-span-1">
          <RuleSetList sets={sets} selectedId={selected?.id} onSelect={setSelectedId} pendingFor={pendingFor} />
        </div>
        <div className="space-y-6 xl:col-span-3">
          {selected && <RuleSetDetail set={selected} sets={sets} api={api} pending={pendingFor(selected.id)} />}
          <PendingApprovals moduleLabel="Rules & scoring" />
        </div>
      </div>
    </div>
  );
}
