import { Lock, Unlock } from 'lucide-react';
import { REPORT_TIERS } from '@/lib/reportAccess';
import { formatDate } from '@/lib/format';
import { PermButton } from '../access';

/** "Unlocked by … on … · valid until … — no charge" for a report the institution already holds. */
export function UnlockedNote({ purchase, self }) {
  if (!purchase) return null;
  const covered = purchase.coveredBy === 'Subscription';
  return (
    <p className="flex flex-wrap items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50/70 px-3 py-2 text-xs text-emerald-900" role="status">
      <Unlock className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
      <span>
        <b>{purchase.tier} report</b> unlocked by {self ? 'you' : purchase.purchasedBy} on {formatDate(purchase.at.slice(0, 10))} · valid until {formatDate(purchase.validUntil)}
        {covered ? ' — included in subscription' : ' — no charge for your colleagues'}
      </span>
    </p>
  );
}

/** Placeholder for Full-only sections while only the Basic report is unlocked. */
export function LockedSection({ onUpgrade, feature, action = 'create' }) {
  return (
    <section className="flex flex-col items-start gap-3 rounded-xl border border-dashed border-primary-200 bg-primary-50/40 p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-3">
        <span className="rounded-lg bg-white p-2 text-primary ring-1 ring-primary-100"><Lock className="h-4 w-4" aria-hidden="true" /></span>
        <div>
          <p className="text-sm font-semibold text-slate-800">Available in the Full report — USD {REPORT_TIERS.Full.price}</p>
          <p className="text-xs text-slate-600">24-month payment history, closed loans, guarantees, inquiry history, grade reason codes, dispute details and the printable PDF.</p>
        </div>
      </div>
      {onUpgrade && (
        <PermButton size="sm" feature={feature} action={action} what="buy credit reports" onClick={onUpgrade} className="shrink-0">Upgrade to Full — USD {REPORT_TIERS.Full.price}</PermButton>
      )}
    </section>
  );
}
