import { CalendarClock, ShieldCheck } from 'lucide-react';
import { Alert, Card, CardBody, CardHeader, Input, Select, Toggle } from '@/components/ui';
import { CATEGORIES, CLASSIFICATIONS, CONTENT_TYPES } from '../../../data/cms';

/** Type, classification (CMS-05 / AC07), category, schedule, expiry and pin (CMS-07). */
export default function ItemSettings({ draft, onChange, disabled, isNew }) {
  const cls = CLASSIFICATIONS.find((c) => c.value === draft.classification);
  const set = (k) => (e) => onChange({ [k]: e.target.value || null });

  return (
    <>
      <Card>
        <CardHeader title="Classification & audience" icon={ShieldCheck} />
        <CardBody className="space-y-3">
          <Select label="Content type" value={draft.type} disabled={disabled || !isNew} onChange={set('type')}
            options={CONTENT_TYPES.map((t) => ({ value: t.id, label: t.label }))}
            hint={!isNew ? 'Type is fixed once the item is created.' : draft.type === 'announcement' ? 'Announcements are delivered to portals through the shared notice API.' : undefined} />
          <Select label="Classification" required value={draft.classification} disabled={disabled} onChange={set('classification')}
            options={CLASSIFICATIONS.map((c) => ({ value: c.value, label: c.label }))} hint={cls?.help} />
          <Alert tone={draft.classification === 'Public' ? 'info' : 'warning'}>
            Classification is enforced by the content API, not only the UI: every portal reads notices through
            {' '}<code className="rounded bg-white/60 px-1 font-mono text-[11px]">announcementsFor(audience)</code>, so
            {draft.classification === 'Public'
              ? ' this item will be visible to anyone once published.'
              : ` a ${draft.classification} item never appears in the public website or public API.`}
          </Alert>
          <Select label="Category" value={draft.category ?? ''} disabled={disabled} onChange={set('category')} placeholder="Select category" options={CATEGORIES} />
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Schedule & placement" icon={CalendarClock} />
        <CardBody className="space-y-3">
          <Input label="Publish at" type="datetime-local" value={draft.scheduleAt ?? ''} disabled={disabled} onChange={set('scheduleAt')}
            hint="Optional. If set in the future, approval moves the item to Scheduled and it goes live automatically." />
          <Input label="Expires on" type="date" value={draft.expiresAt ?? ''} disabled={disabled} onChange={set('expiresAt')}
            min={draft.scheduleAt ? draft.scheduleAt.slice(0, 10) : undefined}
            hint="Optional. The item is archived automatically at 00:00 on this date." />
          <div className={disabled ? 'pointer-events-none opacity-60' : undefined} aria-disabled={disabled}>
            <Toggle label="Pinned / featured" description="Shown first in lists and on the landing page." checked={!!draft.pinned}
              onChange={(v) => !disabled && onChange({ pinned: v })} />
          </div>
        </CardBody>
      </Card>
    </>
  );
}
