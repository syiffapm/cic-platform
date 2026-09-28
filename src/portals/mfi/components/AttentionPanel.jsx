import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import clsx from 'clsx';
import { AlertOctagon, Banknote, ChevronRight, ClipboardList, FileStack, Megaphone, MessageSquareWarning, CheckCircle2, UserCheck } from 'lucide-react';
import { Badge, Button, Card, CardHeader } from '@/components/ui';
import { useStore } from '@/context/StoreContext';
import { useI18n } from '@/i18n/I18nContext';
import { formatMMK, slaDaysLeft } from '@/lib/format';
import { useMfi, useTenant } from './MfiState';
import { OPEN } from './disputeUtils';
import { OPEN_STATUSES, decisionSla } from './applications/appUtils';

const SHOW = 6;
const KIND = {
  application: { icon: ClipboardList, label: 'Loan application' },
  second: { icon: UserCheck, label: 'Second approval' },
  disburse: { icon: Banknote, label: 'Ready to disburse' },
  batch: { icon: FileStack, label: 'Batch sign-off' },
  resubmit: { icon: FileStack, label: 'Batch to fix' },
  dispute: { icon: MessageSquareWarning, label: 'Dispute' },
  notice: { icon: Megaphone, label: 'Mandatory notice' },
};

const plural = (n, w) => `${n} ${w}${n === 1 ? '' : 's'}`;

/** Urgency badge from days left (negative = overdue). `unit` is "working day" for applications, "day" otherwise. */
function urgency(left, unit = 'day') {
  if (left == null) return null;
  if (left < 0) return { tone: 'red', text: `Overdue ${plural(Math.abs(left), unit)}` };
  if (left === 0) return { tone: 'red', text: 'Due today' };
  if (left <= 2) return { tone: 'amber', text: `${plural(left, unit)} left` };
  return { tone: 'green', text: `${plural(left, unit)} left` };
}

/**
 * Everything the signed-in user should act on now, most urgent first. Each item is gated by the role's
 * permission to act (not just to read), so a viewer never sees work they cannot do.
 */
export function useAttentionItems() {
  const { user, tenant, can } = useTenant();
  const { batches, reads } = useMfi();
  const { disputes, loanApplications, announcementsFor } = useStore();
  const { bi } = useI18n();

  return useMemo(() => {
    const items = [];
    const apps = loanApplications.filter((a) => a.mfiId === tenant);

    if (can('mfi.applications', 'update')) {
      apps.filter((a) => OPEN_STATUSES.includes(a.status) && !a.pendingApproval).forEach((a) => {
        const { due, left } = decisionSla(a);
        if (left > 1) return;
        items.push({
          id: a.id, kind: 'application', left, badge: urgency(left, 'working day'), to: `/mfi/applications/${a.id}`,
          title: `${a.applicant.name} · ${formatMMK(a.amount)}`, detail: `${a.id} · ${a.status} · decide by ${due}`, cta: 'Decide',
        });
      });
    }
    if (can('mfi.applications', 'approve')) {
      apps.filter((a) => a.pendingApproval && a.pendingApproval.makerId !== user?.id).forEach((a) => {
        const { left } = decisionSla(a);
        items.push({
          id: `${a.id}-2nd`, kind: 'second', left, badge: urgency(left, 'working day'), to: `/mfi/applications/${a.id}`,
          title: `${a.applicant.name} · ${formatMMK(a.pendingApproval.approvedAmount)}`, detail: `${a.id} · recommended by ${a.pendingApproval.by}`, cta: 'Review',
        });
      });
      apps.filter((a) => a.status === 'Approved').forEach((a) => {
        items.push({
          id: `${a.id}-disb`, kind: 'disburse', left: null, badge: { tone: 'teal', text: 'Approved' }, to: `/mfi/applications/${a.id}`,
          title: `${a.applicant.name} · ${formatMMK(a.decision?.approvedAmount ?? a.amount)}`, detail: `${a.id} · approved ${a.decision?.at ?? ''}`, cta: 'Disburse',
        });
      });
    }

    const own = batches.filter((b) => b.tenant === tenant);
    if (can('mfi.submissions', 'approve')) {
      own.filter((b) => b.status === 'Awaiting approval' && b.uploadedBy !== user?.id).forEach((b) => {
        const waited = Math.max(0, -slaDaysLeft(b.uploadedAt.slice(0, 10)));
        items.push({
          id: b.id, kind: 'batch', left: 1 - waited, badge: { tone: waited >= 1 ? 'red' : 'amber', text: waited ? `Waiting ${plural(waited, 'day')}` : 'Uploaded today' },
          to: `/mfi/submissions/${b.id}`, title: `Sign off ${b.id}`, detail: `${b.fileName} · uploaded by ${b.uploadedByName}`, cta: 'Sign off',
        });
      });
    }
    if (can('mfi.submissions', 'create')) {
      own.filter((b) => ['Validation failed', 'Rejected by checker'].includes(b.status))
        .filter((b) => !own.some((x) => x.period === b.period && x.uploadedAt > b.uploadedAt))
        .forEach((b) => items.push({
          id: b.id, kind: 'resubmit', left: null, badge: { tone: 'red', text: b.status }, to: `/mfi/submissions/${b.id}`,
          title: `Fix and resubmit ${b.period} data`, detail: `${b.id} · ${b.fileName}`, cta: 'Open report',
        }));
    }

    if (can('mfi.disputes', 'update')) {
      disputes.filter((d) => d.mfiId === tenant && OPEN.includes(d.status)).forEach((d) => {
        const left = slaDaysLeft(d.mfiDueAt);
        items.push({
          id: d.id, kind: 'dispute', left, badge: urgency(left), to: `/mfi/disputes/${d.id}`,
          title: `Respond to ${d.id}`, detail: `${d.borrowerName} · loan ${d.loanId} · response due ${d.mfiDueAt}`, cta: 'Respond',
        });
      });
    }

    if (can('mfi.announcements', 'update')) {
      announcementsFor('mfi').filter((n) => n.mandatory && !reads[`${user?.id}:${n.id}`]).forEach((n) => items.push({
        id: n.id, kind: 'notice', left: null, badge: { tone: 'violet', text: 'Acknowledge' }, to: '/mfi/resources/announcements',
        title: bi(n.title), detail: `${n.id} · published ${n.publishedAt}`, cta: 'Acknowledge',
      }));
    }

    // Deadlines first (overdue → due soonest), then items without a deadline in their listed order.
    return items.sort((a, b) => (a.left ?? 99) - (b.left ?? 99));
  }, [loanApplications, disputes, batches, reads, announcementsFor, tenant, user?.id, can, bi]);
}

/** Dashboard block "Needs your attention": direct links to the work that is due. */
export default function AttentionPanel() {
  const items = useAttentionItems();
  const [all, setAll] = useState(false);
  const overdue = items.filter((i) => i.badge?.tone === 'red').length;
  const shown = all ? items : items.slice(0, SHOW);

  return (
    <Card className={clsx(overdue > 0 && 'border-red-200')}>
      <CardHeader
        title="Needs your attention"
        subtitle={items.length ? `${plural(items.length, 'item')} you can act on${overdue ? ` · ${overdue} overdue or due today` : ''} · most urgent first` : 'Only work your role can act on is listed here'}
        icon={AlertOctagon}
      />
      {items.length === 0 ? (
        <div className="flex items-center gap-3 px-5 py-6 text-sm text-slate-600">
          <span className="rounded-full bg-emerald-50 p-2 text-emerald-700"><CheckCircle2 className="h-5 w-5" aria-hidden="true" /></span>
          <span><b className="text-slate-800">You are all caught up.</b> New applications, batches, disputes and mandatory notices appear here when they need you.</span>
        </div>
      ) : (
        <>
          <ul className="divide-y divide-slate-100">
            {shown.map((i) => {
              const { icon: Icon, label } = KIND[i.kind];
              return (
                <li key={i.id}>
                  <Link to={i.to} className="group flex items-center gap-3 px-4 py-3 hover:bg-slate-50 focus-visible:bg-slate-50 sm:px-5">
                    <span className="hidden rounded-lg bg-primary-50 p-2 text-primary sm:block"><Icon className="h-4 w-4" aria-hidden="true" /></span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-[11px] font-semibold uppercase tracking-wide text-slate-500">{label}</span>
                      <span className="block truncate text-sm font-medium text-slate-900">{i.title}</span>
                      <span className="block truncate text-[11px] text-slate-500">{i.detail}</span>
                    </span>
                    <span className="flex shrink-0 flex-col items-end gap-1">
                      {i.badge && <Badge tone={i.badge.tone}>{i.badge.text}</Badge>}
                      <span className="inline-flex items-center text-xs font-medium text-primary group-hover:underline">{i.cta}<ChevronRight className="h-3.5 w-3.5" aria-hidden="true" /></span>
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
          {items.length > SHOW && (
            <div className="border-t border-slate-100 px-5 py-2.5 text-right">
              <Button variant="ghost" size="sm" onClick={() => setAll((v) => !v)} aria-expanded={all}>{all ? 'Show fewer' : `Show all ${items.length}`}</Button>
            </div>
          )}
        </>
      )}
    </Card>
  );
}
