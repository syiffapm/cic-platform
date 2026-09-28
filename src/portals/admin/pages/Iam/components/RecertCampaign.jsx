import { ClipboardCheck } from 'lucide-react';
import { Badge, Card, CardHeader } from '@/components/ui';
import { formatDate } from '@/lib/format';
import { RECERT_CAMPAIGN } from '../../../data/iam';

/** Access recertification campaign progress (every 6 months, ADM-03). */
export default function RecertCampaign({ months }) {
  const c = RECERT_CAMPAIGN;
  const total = c.managers.reduce((s, m) => s + m.total, 0);
  const certified = c.managers.reduce((s, m) => s + m.certified, 0);
  const revoked = c.managers.reduce((s, m) => s + m.revoked, 0);
  const pct = Math.round((certified / total) * 100);
  const daysLeft = Math.ceil((new Date(c.due) - new Date('2026-09-25')) / 86400000);

  return (
    <Card>
      <CardHeader icon={ClipboardCheck} title={`Campaign ${c.id}`} subtitle={`${c.scope} · every ${months} months`}
        action={<Badge tone={daysLeft < 14 ? 'amber' : 'blue'}>Due {formatDate(c.due)} · {daysLeft} d left</Badge>} />
      <div className="space-y-4 p-5">
        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="rounded-lg bg-slate-50 p-3"><p className="text-xl font-bold text-slate-900">{pct}%</p><p className="text-[11px] text-slate-500">Certified</p></div>
          <div className="rounded-lg bg-slate-50 p-3"><p className="text-xl font-bold text-slate-900">{total - certified}</p><p className="text-[11px] text-slate-500">Awaiting review</p></div>
          <div className="rounded-lg bg-slate-50 p-3"><p className="text-xl font-bold text-red-600">{revoked}</p><p className="text-[11px] text-slate-500">Access revoked</p></div>
        </div>
        <ul className="space-y-3">
          {c.managers.map((m) => {
            const p = Math.round((m.certified / m.total) * 100);
            return (
              <li key={m.manager}>
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-slate-700">{m.manager}</span>
                  <span className="text-slate-500">{m.certified}/{m.total} · {m.revoked} revoked</span>
                </div>
                <div className="mt-1 h-2 rounded-full bg-slate-100" role="progressbar" aria-valuenow={p} aria-valuemin={0} aria-valuemax={100} aria-label={`${m.manager} progress`}>
                  <div className={`h-2 rounded-full ${p === 100 ? 'bg-emerald-500' : p < 50 ? 'bg-amber-500' : 'bg-teal-600'}`} style={{ width: `${p}%` }} />
                </div>
              </li>
            );
          })}
        </ul>
        <p className="text-[11px] text-slate-500">Accounts not certified by the due date are disabled automatically and the manager is notified.</p>
      </div>
    </Card>
  );
}
