import clsx from 'clsx';
import { Card, CardBody, CardHeader, Input, Textarea } from '@/components/ui';
import { REGIONS } from '@/data/reference';
import { MapPin } from 'lucide-react';

/** Role details and data scope. MFI templates are always limited to the user's own institution. */
export default function ScopeEditor({ role, draft, readOnly, nameLocked, onChange }) {
  const isMfi = role.portal === 'mfi';
  const regions = draft.scope.regions;
  const all = !Array.isArray(regions);
  const setScope = (changes) => onChange({ ...draft, scope: { ...draft.scope, ...changes } });
  const toggleRegion = (r) => {
    const cur = Array.isArray(regions) ? regions : [];
    const next = cur.includes(r) ? cur.filter((x) => x !== r) : [...cur, r];
    setScope({ regions: REGIONS.filter((x) => next.includes(x)) });
  };

  return (
    <Card>
      <CardHeader icon={MapPin} title="Role details & data scope" subtitle="Users can be narrowed further on their own account, never widened." />
      <CardBody className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input label="Role name" value={draft.name} disabled={readOnly || nameLocked} onChange={(e) => onChange({ ...draft, name: e.target.value })}
            hint={nameLocked ? 'System role names are fixed.' : undefined} />
          <Input label="Data scope" value={draft.scope.data ?? ''} disabled={readOnly} onChange={(e) => setScope({ data: e.target.value })}
            hint="What data this role can see, e.g. “Anonymised aggregates only”." />
        </div>
        <Textarea label="Description" rows={2} value={draft.description} disabled={readOnly} onChange={(e) => onChange({ ...draft, description: e.target.value })} />

        {isMfi ? (
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm">
            <p className="text-xs font-medium text-slate-700">Institution scope</p>
            <p className="mt-1 text-slate-800">Own institution <span className="text-slate-500">— fixed for every MFI role template. Branch limits are set by each MFI administrator.</span></p>
          </div>
        ) : (
          <fieldset disabled={readOnly} className="space-y-2">
            <legend className="text-xs font-medium text-slate-700">Regions</legend>
            <div className="flex flex-wrap gap-4 text-sm">
              <label className="flex items-center gap-2">
                <input type="radio" name="region-mode" checked={all} onChange={() => setScope({ regions: 'All regions' })} className="accent-[hsl(214_45%_22%)]" />
                All regions
              </label>
              <label className="flex items-center gap-2">
                <input type="radio" name="region-mode" checked={!all} onChange={() => setScope({ regions: [] })} className="accent-[hsl(214_45%_22%)]" />
                Selected regions only
              </label>
            </div>
            {!all && (
              <div className="flex flex-wrap gap-1.5 pt-1" role="group" aria-label="Regions">
                {REGIONS.map((r) => {
                  const on = regions.includes(r);
                  return (
                    <button key={r} type="button" aria-pressed={on} onClick={() => toggleRegion(r)}
                      className={clsx('rounded-full border px-2.5 py-1 text-xs transition-colors disabled:cursor-not-allowed',
                        on ? 'border-primary bg-primary text-white' : 'border-slate-300 bg-white text-slate-600 hover:border-primary-300')}>
                      {r}
                    </button>
                  );
                })}
              </div>
            )}
            {!all && regions.length === 0 && <p className="text-[11px] font-medium text-red-600">Select at least one region.</p>}
          </fieldset>
        )}
      </CardBody>
    </Card>
  );
}
