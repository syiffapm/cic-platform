import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Download, Printer } from 'lucide-react';
import { useStore } from '@/context/StoreContext';
import { Badge, Button } from '@/components/ui';
import { slaDaysLeft } from '@/lib/format';
import { useCurrentFeature, useGovAccess } from '@/portals/government/lib/access';

/** id → institution map from the shared Institution Master. */
export function useInstitutionMap() {
  const { institutions } = useStore();
  return useMemo(() => Object.fromEntries(institutions.map((i) => [i.id, i])), [institutions]);
}

export function MfiLink({ inst, id }) {
  if (!inst) return <span className="text-slate-500">{id ?? '—'}</span>;
  return (
    <Link to={`/gov/mfi/${inst.id}`} onClick={(e) => e.stopPropagation()} className="font-medium text-primary hover:underline">
      {inst.short}
      <span className="block text-[11px] font-normal text-slate-500">{inst.name}</span>
    </Link>
  );
}

/** SLA chip: breached (< 0 days), at risk (≤ 3 days), ok. */
export function slaState(due, done = false) {
  if (done || !due) return { label: 'Met', tone: 'green', days: null };
  const d = slaDaysLeft(due);
  if (d < 0) return { label: `Breached ${-d}d`, tone: 'red', days: d, key: 'breached' };
  if (d <= 3) return { label: `At risk · ${d}d left`, tone: 'amber', days: d, key: 'risk' };
  return { label: `${d}d left`, tone: 'green', days: d, key: 'ok' };
}

export function SlaChip({ due, done }) {
  const s = slaState(due, done);
  return <Badge tone={s.tone}>{s.label}</Badge>;
}

/** PDF / spreadsheet export; shown only to roles with the Export right on the page's feature. */
export function ExportButtons({ onCsv, label = 'XLSX', feature }) {
  const current = useCurrentFeature();
  const { can } = useGovAccess();
  if (!can(feature ?? current, 'export')) return null;
  return (
    <>
      <Button variant="outline" size="sm" icon={Printer} onClick={() => window.print()}>Export PDF</Button>
      {onCsv && <Button variant="outline" size="sm" icon={Download} onClick={onCsv}>Export {label}</Button>}
    </>
  );
}

export function SeverityBadge({ severity }) {
  const tone = { Critical: 'red', High: 'red', Medium: 'amber', Low: 'blue' }[severity] ?? 'slate';
  return <Badge tone={tone}>{severity}</Badge>;
}

/** Small label/value list used on detail pages. */
export function DefList({ items, cols = 2 }) {
  return (
    <dl className={{ 1: 'grid gap-y-3', 2: 'grid gap-x-6 gap-y-3 sm:grid-cols-2', 3: 'grid gap-x-6 gap-y-3 sm:grid-cols-3' }[cols]}>
      {items.map(([k, v]) => (
        <div key={k}>
          <dt className="text-[11px] font-medium uppercase tracking-wide text-slate-500">{k}</dt>
          <dd className="mt-0.5 text-sm text-slate-800">{v ?? '—'}</dd>
        </div>
      ))}
    </dl>
  );
}
