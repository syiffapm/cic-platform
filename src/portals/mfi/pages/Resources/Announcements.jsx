import clsx from 'clsx';
import { useState } from 'react';
import { CheckCircle2, Megaphone, Paperclip } from 'lucide-react';
import { Badge, Card, CardBody, EmptyState, PageHeader, Tabs, useToast } from '@/components/ui';
import { useStore } from '@/context/StoreContext';
import { useI18n } from '@/i18n/I18nContext';
import { formatDate } from '@/lib/format';
import { nowStamp, useMfi, useTenant } from '../../components/MfiState';
import { PermButton, ViewOnlyBanner } from '../../components/access';

/**
 * Announcements inbox. Notices come only from announcementsFor('mfi') — Regulator-only and Internal
 * items are never delivered. Mandatory notices need an explicit acknowledgement (read receipt).
 */
export default function Announcements() {
  const { user, tenant, can } = useTenant();
  const { announcementsFor, logAudit } = useStore();
  const { reads, update } = useMfi();
  const { bi } = useI18n();
  const toast = useToast();
  const [tab, setTab] = useState('unread');
  const [openId, setOpenId] = useState(null);

  const key = (n) => `${user.id}:${n.id}`;
  const notices = announcementsFor('mfi').slice().sort((a, b) => (b.mandatory - a.mandatory) || b.publishedAt.localeCompare(a.publishedAt));
  const unread = notices.filter((n) => !reads[key(n)]);
  const list = tab === 'unread' ? notices.filter((n) => !reads[key(n)] || n.id === openId) : tab === 'mandatory' ? notices.filter((n) => n.mandatory) : notices;

  const markRead = (n, ack = false) => {
    if (reads[key(n)] || (ack && !can('mfi.announcements', 'update'))) return;
    update('reads', (r) => ({ ...r, [key(n)]: { at: nowStamp(), ack } }));
    if (ack) {
      logAudit({ actor: user.name, role: user.role, tenant, action: 'NOTICE_ACKNOWLEDGE', module: 'Announcements', target: n.id, outcome: 'Success' });
      toast(`Acknowledged ${n.id} — read receipt sent to CIC`, 'success');
    }
  };

  const toggle = (n) => {
    setOpenId((id) => (id === n.id ? null : n.id));
    if (!n.mandatory) markRead(n);
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Announcements" subtitle="Circulars and operational notices for reporting institutions. Mandatory notices require your acknowledgement; CIC sees who has read them." />
      <ViewOnlyBanner feature="mfi.announcements">Your role can read notices but cannot acknowledge mandatory notices on behalf of the institution.</ViewOnlyBanner>
      <Card>
        <Tabs
          className="px-4"
          value={tab}
          onChange={setTab}
          tabs={[{ id: 'unread', label: 'Unread', count: unread.length }, { id: 'mandatory', label: 'Mandatory', count: notices.filter((n) => n.mandatory).length }, { id: 'all', label: 'All', count: notices.length }]}
        />
        {list.length === 0 && <EmptyState compact icon={Megaphone} title="Nothing here" description="You have read every notice in this view." />}
        <ul className="divide-y divide-slate-100">
          {list.map((n) => {
            const r = reads[key(n)];
            const open = openId === n.id;
            return (
              <li key={n.id} className={clsx(!r && 'bg-primary-50/30')}>
                <button type="button" onClick={() => toggle(n)} aria-expanded={open} className="flex w-full items-start gap-3 px-5 py-4 text-left hover:bg-slate-50">
                  <span className={clsx('mt-1.5 h-2 w-2 shrink-0 rounded-full', r ? 'bg-transparent' : 'bg-warm')} aria-hidden="true" />
                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-center gap-1.5">
                      <span className={clsx('text-sm text-slate-900', !r && 'font-semibold')}>{bi(n.title)}</span>
                      {n.mandatory && <Badge tone="red">Mandatory</Badge>}
                      <Badge tone={n.classification === 'MFI-only' ? 'violet' : 'slate'}>{n.classification}</Badge>
                      {!r && <span className="sr-only">(unread)</span>}
                    </span>
                    <span className="mt-0.5 block text-[11px] text-slate-500">{n.id} · {n.category} · published {formatDate(n.publishedAt)}</span>
                  </span>
                </button>
                {open && (
                  <CardBody className="space-y-3 pt-0 pl-10">
                    <p className="text-sm leading-relaxed text-slate-700">{bi(n.body)}</p>
                    {n.attachment && <p className="flex items-center gap-1.5 text-xs text-primary"><Paperclip className="h-3.5 w-3.5" aria-hidden="true" /> {n.attachment}</p>}
                    {n.mandatory && !r && <PermButton feature="mfi.announcements" action="update" what="acknowledge notices on behalf of the institution" size="sm" icon={CheckCircle2} onClick={() => markRead(n, true)}>Acknowledge</PermButton>}
                    {r && <p className="flex items-center gap-1.5 text-[11px] text-emerald-700"><CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" /> {r.ack ? 'Acknowledged' : 'Read'} by {user.name} on {r.at}</p>}
                  </CardBody>
                )}
              </li>
            );
          })}
        </ul>
      </Card>
    </div>
  );
}
