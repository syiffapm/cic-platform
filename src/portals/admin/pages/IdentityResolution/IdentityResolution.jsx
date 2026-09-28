import { useState } from 'react';
import { useFocusParam } from '@/portals/government/components/FocusBanner';
import { CheckCircle2, GitMerge, Hourglass, Users } from 'lucide-react';
import { Alert, PageHeader, StatCard } from '@/components/ui';
import { useStore } from '@/context/StoreContext';
import { useAdminCollection } from '../../context/AdminStore';
import PendingApprovals from '../../components/PendingApprovals';
import { IDENTITY_PAIRS } from '../../data/identity';
import PairQueue from './components/PairQueue';
import PairDetail from './components/PairDetail';

const AS_OF_NOW = '24 Sep 2026 03:10';

export default function IdentityResolution() {
  const [stored, api] = useAdminCollection('identityPairs', IDENTITY_PAIRS);
  const { approvals } = useStore();
  // A checker rejection sends the pair back to the steward queue.
  const pairs = stored.map((p) => {
    const apr = p.approvalId && approvals.find((a) => a.id === p.approvalId);
    if (apr && apr.status === 'Approved' && !p.checker) return { ...p, checker: apr.checker };
    return apr && p.status === 'Pending checker' && apr.status === 'Rejected'
      ? { ...p, status: 'Open', rejectedNote: `${apr.id} (${p.decision}) was rejected by ${apr.checker ?? 'the checker'}${apr.comment ? `: “${apr.comment}”` : ''}. Review again.` }
      : p;
  });
  const [focus] = useFocusParam();
  const [selectedId, setSelectedId] = useState(focus ?? IDENTITY_PAIRS[0].id);
  const selected = pairs.find((p) => p.id === selectedId) ?? pairs[0];

  const open = pairs.filter((p) => p.status === 'Open').length;
  const pending = pairs.filter((p) => p.status === 'Pending checker').length;
  const resolved = pairs.filter((p) => ['Merged', 'Not same person', 'Split'].includes(p.status)).length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Identity resolution"
        subtitle="Review candidate borrower matches produced by the nightly match run. Decide merge, not-same-person or split; a second authorised user approves before any record changes."
      />

      <Alert tone="warning" title="Similar identities are never auto-merged — every merge/split needs a steward decision and a checker approval">
        Only exact deterministic matches (same normalised NRC and DOB) are linked automatically. Probabilistic matches wait here.
        Remember: <b>no-hit ≠ low risk</b> — an unmatched borrower is reported as &quot;no record found&quot;, never as a good credit history.
      </Alert>

      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <StatCard label="Open candidate pairs" value={open} icon={Users} tone="warm" definition="Pairs above the 65% similarity threshold awaiting a steward decision" asOf={AS_OF_NOW} />
        <StatCard label="Pending checker" value={pending} icon={Hourglass} tone="violet" definition="Steward decision recorded; waiting for checker approval — records unchanged" asOf={AS_OF_NOW} />
        <StatCard label="Resolved (30 days)" value={resolved} icon={CheckCircle2} tone="green" definition="Pairs merged, split or confirmed as different people in the last 30 days" asOf={AS_OF_NOW} />
        <StatCard label="Auto-merges" value="0" icon={GitMerge} tone="navy" definition="Merges applied without human decision — must always be zero" asOf={AS_OF_NOW} />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-5">
        <div className="space-y-6 xl:col-span-2">
          <PairQueue pairs={pairs} selectedId={selected?.id} onSelect={setSelectedId} />
          <PendingApprovals moduleLabel="Identity resolution" />
        </div>
        <div className="xl:col-span-3">
          {selected && <PairDetail pair={selected} api={api} />}
        </div>
      </div>
    </div>
  );
}
