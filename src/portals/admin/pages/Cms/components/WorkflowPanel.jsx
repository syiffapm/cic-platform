import { Archive, CalendarClock, CheckCircle2, Eye, Rocket, Save, Send, Undo2, Workflow } from 'lucide-react';
import { Alert, Badge, Button, Card, CardBody, CardHeader, Stepper } from '@/components/ui';
import { WORKFLOW } from '../../../data/cms';

const ACTIONS = [
  { key: 'save', label: 'Save draft', icon: Save, variant: 'outline', group: 'editor' },
  { key: 'submit', label: 'Submit for review', icon: Send, variant: 'primary', group: 'editor' },
  { key: 'approve', label: 'Approve', icon: CheckCircle2, variant: 'success', group: 'publisher' },
  { key: 'publish', label: 'Publish now', icon: Rocket, variant: 'teal', group: 'publisher' },
  { key: 'schedule', label: 'Schedule', icon: CalendarClock, variant: 'outline', group: 'publisher' },
  { key: 'returnDraft', label: 'Return to draft', icon: Undo2, variant: 'ghost', group: 'publisher' },
  { key: 'archive', label: 'Archive', icon: Archive, variant: 'danger', group: 'publisher' },
];

/**
 * Workflow Draft → In review → Approved → Scheduled → Published → Archived (CMS-04) with
 * role and maker-checker rules (AC11). Disabled actions list their reason.
 */
export default function WorkflowPanel({ item, perms, onAction, onPreview, dirty, isNew, canApprove, userName }) {
  const status = item.status ?? 'Draft';
  const current = WORKFLOW.indexOf(status);
  const blocked = ACTIONS.filter((a) => !perms.actions[a.key].allowed && !/^(Already|Not available)/.test(perms.actions[a.key].reason ?? ''));
  const reasons = [...new Set(blocked.map((a) => perms.actions[a.key].reason))];

  return (
    <Card>
      <CardHeader
        title="Workflow"
        subtitle={isNew ? 'New item — not yet saved' : `Author ${item.author ?? '—'} · last edited by ${item.lastEditor ?? item.author ?? '—'}${item.approver ? ` · approver ${item.approver}` : ''}`}
        icon={Workflow}
        action={<Badge status={status} tone={status === 'Approved' ? 'teal' : undefined} />}
      />
      <CardBody className="space-y-4">
        <div className="overflow-x-auto pb-1" tabIndex={0} role="region" aria-label="Workflow steps">
          <Stepper steps={WORKFLOW} current={current < 0 ? 0 : current} />
        </div>
        {status === 'Scheduled' && item.scheduleAt && (
          <Alert tone="info">Goes live automatically on <b>{item.scheduleAt.replace('T', ' ')}</b>{item.expiresAt ? <> and expires on <b>{item.expiresAt}</b></> : null}.</Alert>
        )}
        {perms.own && canApprove && (
          <Alert tone="danger" title="You cannot approve or publish this item">
            You {item.author === userName ? 'authored' : 'were the last editor of'} this content. Under maker-checker a
            different publisher must approve, schedule, publish or archive it — nobody may approve their own edits.
          </Alert>
        )}
        {dirty && ['Approved', 'Scheduled', 'Published'].includes(status) && (
          <Alert tone="warning">Saving changes to a {status.toLowerCase()} item creates a new draft revision; it must be reviewed and approved again.</Alert>
        )}

        <div className="flex flex-wrap gap-2">
          {ACTIONS.map((a) => {
            const p = perms.actions[a.key];
            const disabled = !p.allowed || (a.key === 'save' && !dirty && !isNew);
            return (
              <Button key={a.key} size="sm" variant={a.variant} icon={a.icon} disabled={disabled}
                title={p.reason ?? (disabled ? 'No unsaved changes' : undefined)} onClick={() => onAction(a.key)}>
                {a.key === 'approve' && perms.futureSchedule ? 'Approve & schedule' : a.label}
              </Button>
            );
          })}
          <Button size="sm" variant="secondary" icon={Eye} onClick={onPreview}>Preview</Button>
        </div>

        {reasons.length > 0 && (
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
            <p className="text-xs font-semibold text-slate-700">Why some actions are unavailable</p>
            <ul className="mt-1.5 list-disc space-y-1 pl-4 text-xs text-slate-600">
              {reasons.map((r) => <li key={r}>{r}</li>)}
            </ul>
          </div>
        )}
      </CardBody>
    </Card>
  );
}
