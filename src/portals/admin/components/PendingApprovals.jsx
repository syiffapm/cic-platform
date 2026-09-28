import { useState } from 'react';
import { Link } from 'react-router-dom';
import { UserCheck } from 'lucide-react';
import { Badge, Button, Card, CardHeader, EmptyState, useToast } from '@/components/ui';
import { usePermissions } from '@/lib/rbac';
import { useStore } from '@/context/StoreContext';
import { roleName } from '@/data/roles';
import { blockReason, useApprovalDecision } from '../lib/useApprovals';
import DecisionModal from './DecisionModal';

/** Pending maker-checker requests for one module (match on approval.module containing `moduleLabel`). */
export default function PendingApprovals({ moduleLabel, title = 'Pending approvals', limit = 5 }) {
  const { approvals } = useStore();
  const { user, can } = usePermissions('gov');
  const canApprove = can('adm.approvals', 'approve');
  const decide = useApprovalDecision();
  const toast = useToast();
  const [active, setActive] = useState(null);
  const items = approvals.filter((a) => a.status === 'Pending' && (!moduleLabel || a.module.includes(moduleLabel))).slice(0, limit);

  const confirm = (comment) => {
    const res = decide(active.approval, active.decision, comment);
    toast(res.ok ? `${active.approval.id} ${res.status.toLowerCase()}` : res.reason, res.ok ? 'success' : 'danger');
    setActive(null);
  };

  return (
    <Card>
      <CardHeader icon={UserCheck} title={title} subtitle="Maker-checker queue" action={<Link to="/gov/admin/approvals" className="text-xs font-medium text-primary hover:underline">Open inbox</Link>} />
      {items.length === 0 ? (
        <EmptyState compact icon={UserCheck} title="No pending requests" description="Changes raised here appear until a second person decides them." />
      ) : (
        <ul className="divide-y divide-slate-100">
          {items.map((a) => {
            const reason = blockReason(a, user, canApprove);
            return (
              <li key={a.id} className="flex flex-col gap-2 px-5 py-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-slate-800">{a.summary}</p>
                  <p className="text-[11px] text-slate-500">{a.id} · {a.type} · by {a.maker} · checker {roleName(a.checkerRole)}</p>
                  {reason && <p className="mt-0.5 text-[11px] text-amber-700">{reason}</p>}
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <Badge status="Pending" />
                  <Button size="sm" variant="success" disabled={!!reason} onClick={() => setActive({ approval: a, decision: 'approve' })}>Approve</Button>
                  <Button size="sm" variant="outline" disabled={!!reason} onClick={() => setActive({ approval: a, decision: 'reject' })}>Reject</Button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
      <DecisionModal approval={active?.approval} decision={active?.decision} onClose={() => setActive(null)} onConfirm={confirm} />
    </Card>
  );
}
