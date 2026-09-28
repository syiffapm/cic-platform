import clsx from 'clsx';
import { useState } from 'react';
import { BellRing, ChevronLeft, ChevronRight, Flag } from 'lucide-react';
import { Alert, Badge, Button, Card, CardBody, CardHeader, DataTable, PageHeader, Toggle, useToast } from '@/components/ui';
import { formatDate } from '@/lib/format';
import { SUBMISSION_HISTORY } from '../../data/census';
import { useMfi, useTenant } from '../../components/MfiState';

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const TODAY = '2026-09-24';
const KIND = {
  cutoff: 'bg-red-600 text-white',
  reminder: 'bg-amber-100 text-amber-900',
  upload: 'bg-teal-50 text-teal-800 ring-1 ring-teal-200',
  notice: 'bg-blue-50 text-blue-800 ring-1 ring-blue-200',
};

const iso = (y, m, d) => `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
const monthName = (y, m) => new Date(y, m, 1).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });

/** Phones: the month's events as a list under the compact grid (labels do not fit in a 7-column grid). */
function MonthAgenda({ days, eventsFor, y, m }) {
  const items = Array.from({ length: days }, (_, i) => i + 1).flatMap((d) => eventsFor(d).map((e) => ({ ...e, d })));
  return (
    <div className="mt-4 sm:hidden">
      <h4 className="text-xs font-semibold text-slate-700">This month</h4>
      {items.length === 0 ? <p className="mt-1 text-xs text-slate-500">No cut-offs, reminders or uploads this month.</p> : (
        <ul className="mt-2 space-y-1.5">
          {items.map((e) => (
            <li key={`${e.d}-${e.label}`} className="flex items-center gap-2 text-xs">
              <span className="w-14 shrink-0 font-medium text-slate-600">{formatDate(iso(y, m, e.d), { year: undefined })}</span>
              <span className={clsx('min-w-0 truncate rounded px-1.5 py-0.5 font-medium', KIND[e.kind])}>{e.label}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/** Submission calendar with cut-off (7th), reminders and late flags. */
export default function Calendar() {
  const { tenant } = useTenant();
  const { batches } = useMfi();
  const toast = useToast();
  const [cursor, setCursor] = useState({ y: 2026, m: 8 });
  const [reminders, setReminders] = useState({ t5: true, t1: true, sms: false });

  const { y, m } = cursor;
  const first = new Date(y, m, 1);
  const offset = (first.getDay() + 6) % 7;
  const days = new Date(y, m + 1, 0).getDate();
  const prevLabel = new Date(y, m - 1, 1).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' });

  const eventsFor = (d) => {
    const date = iso(y, m, d);
    const ev = [];
    if (d === 7) ev.push({ kind: 'cutoff', label: `Cut-off · ${prevLabel} data` });
    if (d === 2 && reminders.t5) ev.push({ kind: 'reminder', label: 'Reminder T-5' });
    if (d === 6 && reminders.t1) ev.push({ kind: 'reminder', label: 'Reminder T-1' });
    batches.filter((b) => b.tenant === tenant && b.uploadedAt.startsWith(date)).forEach((b) => ev.push({ kind: 'upload', label: `${b.id.split('-').slice(-1)[0]} · ${b.status}` }));
    if (date === '2026-09-28') ev.push({ kind: 'notice', label: 'Maintenance 22:00' });
    if (date === '2026-10-10') ev.push({ kind: 'notice', label: 'Flood-area extension ends' });
    return ev;
  };

  const move = (delta) => setCursor(({ y: yy, m: mm }) => {
    const d = new Date(yy, mm + delta, 1);
    return { y: d.getFullYear(), m: d.getMonth() };
  });

  const cells = [...Array(offset).fill(null), ...Array.from({ length: days }, (_, i) => i + 1)];

  return (
    <div className="space-y-6">
      <PageHeader title="Submission calendar" subtitle="Monthly data is due by the 7th calendar day after month end. Daily API submissions are encouraged." breadcrumbs={[{ label: 'Submissions', to: '/mfi/submissions' }, { label: 'Calendar' }]} />

      <Alert tone="info" title="Next cut-off: 07 Oct 2026 (September 2026 data)">Branches in Ayeyarwady flood-affected townships may submit September data until 10 Oct 2026 without a late flag (ANN-2026-028).</Alert>

      <div className="grid gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader
            title={monthName(y, m)}
            action={(
              <div className="flex gap-1">
                <Button variant="ghost" size="icon" aria-label="Previous month" onClick={() => move(-1)}><ChevronLeft className="h-4 w-4" /></Button>
                <Button variant="ghost" size="icon" aria-label="Next month" onClick={() => move(1)}><ChevronRight className="h-4 w-4" /></Button>
              </div>
            )}
          />
          <CardBody>
            <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-semibold uppercase text-slate-500" aria-hidden="true">
              {WEEKDAYS.map((w) => <div key={w} className="py-1">{w}</div>)}
            </div>
            <ol className="grid grid-cols-7 gap-1">
              {cells.map((d, i) => {
                if (!d) return <li key={`e${i}`} aria-hidden="true" />;
                const ev = eventsFor(d);
                const isToday = iso(y, m, d) === TODAY;
                return (
                  <li key={d} className={clsx('min-h-[52px] rounded-lg border p-1.5 text-left sm:min-h-[78px]', isToday ? 'border-warm bg-amber-50/40' : 'border-slate-100 bg-white')}>
                    <span className={clsx('text-xs font-semibold', isToday ? 'text-primary' : 'text-slate-600')}>{d}{isToday && <span className="sr-only"> (today)</span>}</span>
                    <ul className="mt-1 hidden space-y-0.5 sm:block">
                      {ev.map((e) => <li key={e.label} className={clsx('truncate rounded px-1 py-0.5 text-[11px] font-medium', KIND[e.kind])} title={e.label}>{e.label}</li>)}
                    </ul>
                    {ev.length > 0 && (
                      <span className="mt-1 flex flex-wrap gap-0.5 sm:hidden" aria-hidden="true">
                        {ev.map((e) => <span key={e.label} className={clsx('h-2 w-2 rounded-full', KIND[e.kind])} />)}
                      </span>
                    )}
                  </li>
                );
              })}
            </ol>
            <MonthAgenda days={days} eventsFor={eventsFor} y={y} m={m} />
            <ul className="mt-4 flex flex-wrap gap-3 text-[11px] text-slate-600">
              {[['cutoff', 'Cut-off'], ['reminder', 'Reminder'], ['upload', 'Your uploads'], ['notice', 'CIC notice']].map(([k, l]) => (
                <li key={k} className="flex items-center gap-1.5"><span className={clsx('h-3 w-3 rounded', KIND[k])} />{l}</li>
              ))}
            </ul>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Reminders" subtitle="Sent to data submitters and checkers" icon={BellRing} />
          <CardBody className="space-y-4">
            <Toggle label="Email 5 days before cut-off" checked={reminders.t5} onChange={(v) => setReminders((r) => ({ ...r, t5: v }))} />
            <Toggle label="Email 1 day before cut-off" checked={reminders.t1} onChange={(v) => setReminders((r) => ({ ...r, t1: v }))} />
            <Toggle label="SMS on cut-off day if not submitted" checked={reminders.sms} onChange={(v) => setReminders((r) => ({ ...r, sms: v }))} />
            <Button variant="outline" size="sm" onClick={() => toast('Reminder preferences saved', 'success')}>Save preferences</Button>
          </CardBody>
        </Card>
      </div>

      <Card>
        <CardHeader title="Late-submission flags" subtitle="On-time status is published in the MFI health scorecard" icon={Flag} />
        <DataTable
          rows={SUBMISSION_HISTORY.map((h) => ({ ...h, id: h.period }))}
          columns={[
            { key: 'period', header: 'Period' },
            { key: 'due', header: 'Cut-off', render: (r) => formatDate(r.due) },
            { key: 'submitted', header: 'Submitted', render: (r) => formatDate(r.submitted) },
            { key: 'flag', header: 'Flag', render: (r) => <Badge tone={r.flag.startsWith('Late') ? 'red' : 'green'}>{r.flag}</Badge> },
            { key: 'note', header: 'Note', className: 'text-xs text-slate-500', render: (r) => r.note ?? '—' },
          ]}
        />
      </Card>
    </div>
  );
}
