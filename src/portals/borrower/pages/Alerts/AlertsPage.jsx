import clsx from 'clsx';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, Bell, CheckCheck, Eye, FilePlus2, FileSearch, Gavel } from 'lucide-react';
import { Button, Card, CardBody, CardHeader, EmptyState, PageHeader, Tabs, useToast } from '@/components/ui';
import { formatDateTime } from '@/lib/format';
import { ALERT_TYPES, DEFAULT_PREFS } from '../../data/portalMock';
import { AuditFootnote } from '../../components/Common';
import { useBorrowerAudit, usePersistentState } from '../../lib/borrower';
import { useAllAlerts } from '../../lib/reports';

const ICONS = { inquiry: [Eye, 'bg-blue-50 text-blue-600'], loan: [FilePlus2, 'bg-teal-50 text-teal-600'], delinquency: [AlertTriangle, 'bg-amber-50 text-amber-600'], dispute: [Gavel, 'bg-violet-50 text-violet-600'], report: [FileSearch, 'bg-emerald-50 text-emerald-700'] };
const CHANNELS = [{ id: 'sms', label: 'SMS' }, { id: 'email', label: 'Email' }, { id: 'inapp', label: 'In-app' }];

/** Alert feed + channel preferences. */
export default function AlertsPage() {
  const [alerts, markRead] = useAllAlerts();
  const [prefs, setPrefs] = usePersistentState('alertPrefs', DEFAULT_PREFS);
  const [tab, setTab] = useState('all');
  const audit = useBorrowerAudit();
  const toast = useToast();

  const unread = alerts.filter((a) => !a.read).length;
  const shown = tab === 'unread' ? alerts.filter((a) => !a.read) : alerts;

  const toggle = (type, ch) => {
    const cur = prefs[type]?.[ch] ?? DEFAULT_PREFS[type]?.[ch];
    setPrefs((p) => ({ ...p, [type]: { ...(DEFAULT_PREFS[type] ?? {}), ...p[type], [ch]: !cur } }));
    audit('ALERT_PREFERENCE_CHANGE', `${type}.${ch}`, { purpose: cur ? 'Turned off' : 'Turned on' });
  };

  return (
    <div>
      <PageHeader
        title="Alerts"
        subtitle="We tell you when something changes on your credit file, so you can act quickly if it looks wrong."
        actions={unread > 0 && <Button variant="outline" icon={CheckCheck} onClick={() => markRead('all')}>Mark all as read</Button>}
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        <Card>
          <div className="px-4 pt-2">
            <Tabs tabs={[{ id: 'all', label: 'All', count: alerts.length }, { id: 'unread', label: 'Unread', count: unread }]} value={tab} onChange={setTab} />
          </div>
          <ul className="divide-y divide-slate-100">
            {shown.map((a) => {
              const [Icon, cls] = ICONS[a.type] ?? ICONS.inquiry;
              return (
                <li key={a.id} className={clsx('flex gap-3 px-5 py-4', !a.read && 'bg-amber-50/40')}>
                  <span className={clsx('flex h-9 w-9 shrink-0 items-center justify-center rounded-lg', cls)}><Icon className="h-4 w-4" aria-hidden="true" /></span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-slate-800">
                      {!a.read && <span className="sr-only">Unread: </span>}{a.title}
                    </p>
                    <p className="mt-0.5 text-xs text-slate-600">{a.body}</p>
                    <div className="mt-1.5 flex flex-wrap items-center gap-3 text-[11px]">
                      <span className="text-slate-500">{formatDateTime(a.at)}</span>
                      <Link to={a.link} onClick={() => markRead(a.id)} className="inline-flex min-h-[24px] items-center font-semibold text-primary hover:underline">View details</Link>
                      {!a.read && <button type="button" onClick={() => markRead(a.id)} className="inline-flex min-h-[24px] items-center text-slate-600 hover:text-slate-900">Mark as read</button>}
                    </div>
                  </div>
                  {!a.read && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-warm" aria-hidden="true" />}
                </li>
              );
            })}
            {shown.length === 0 && <li><EmptyState compact icon={Bell} title={tab === 'unread' ? 'You have read every alert' : 'No alerts yet'} description={tab === 'unread' ? 'New alerts appear here when a lender checks your report, a loan is reported or a case changes.' : 'We will alert you here and by SMS when a lender checks your report, a loan is reported or a case changes.'} /></li>}
          </ul>
        </Card>

        <Card>
          <CardHeader title="How should we tell you?" subtitle="Choose a channel for each type of alert." />
          <CardBody className="space-y-5">
            {ALERT_TYPES.map((t) => (
              <fieldset key={t.id}>
                <legend className="text-sm font-medium text-slate-800">{t.label}</legend>
                <p className="text-xs text-slate-500">{t.description}</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {CHANNELS.map((c) => {
                    const on = prefs[t.id]?.[c.id] ?? DEFAULT_PREFS[t.id]?.[c.id];
                    return (
                      <button
                        key={c.id}
                        type="button"
                        role="switch"
                        aria-checked={!!on}
                        aria-label={`${t.label} by ${c.label}`}
                        onClick={() => toggle(t.id, c.id)}
                        className={clsx('rounded-full px-3 py-1 text-xs font-medium ring-1 ring-inset transition-colors', on ? 'bg-primary text-white ring-primary' : 'bg-white text-slate-500 ring-slate-300 hover:ring-primary-300')}
                      >
                        {on ? '✓ ' : ''}{c.label}
                      </button>
                    );
                  })}
                </div>
              </fieldset>
            ))}
            <p className="rounded-lg bg-slate-50 p-3 text-[11px] text-slate-500">SMS goes to your verified mobile. Security alerts (new sign-in, password change) are always sent and cannot be turned off.</p>
            <Button variant="outline" className="w-full" onClick={() => toast('Alert preferences saved.', 'success')}>Save preferences</Button>
          </CardBody>
        </Card>
      </div>

      <AuditFootnote action="Changing alert settings" />
    </div>
  );
}
