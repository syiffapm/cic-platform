import { Layers } from 'lucide-react';
import { Badge, Card, CardHeader } from '@/components/ui';
import { formatDate } from '@/lib/format';
import { SCHEMA_VERSIONS } from '../../../data/dataQuality';

const TONE = { Active: 'green', Deprecated: 'amber', Retired: 'slate' };

/** Submission schema version manager: lifecycle, fields added, MFIs still on each version. */
export default function SchemaVersions() {
  return (
    <Card>
      <CardHeader icon={Layers} title="Submission schema versions" subtitle="MFIs must migrate before a version's sunset date; batches on retired versions are rejected" />
      <ul className="divide-y divide-slate-100">
        {[...SCHEMA_VERSIONS].reverse().map((v) => (
          <li key={v.version} className="grid grid-cols-1 gap-4 px-5 py-4 md:grid-cols-[8rem_1fr_1fr]">
            <div>
              <p className="font-mono text-lg font-semibold text-slate-900">{v.version}</p>
              <Badge tone={TONE[v.status]}>{v.status}</Badge>
              <p className="mt-2 text-[11px] text-slate-500">Released {formatDate(v.released)}</p>
              {v.sunset && <p className="text-[11px] text-slate-500">{v.status === 'Retired' ? 'Retired' : 'Sunset'} {formatDate(v.sunset)}</p>}
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Fields added</p>
              <ul className="mt-1 flex flex-wrap gap-1">
                {v.fieldsAdded.map((f) => <li key={f} className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[11px] text-slate-700">{f}</li>)}
              </ul>
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">MFIs still on this version ({v.mfis.length})</p>
              <ul className="mt-1 flex flex-wrap gap-1">
                {v.mfis.map((m) => <li key={m}><Badge tone={v.status === 'Active' ? 'teal' : v.status === 'Deprecated' ? 'amber' : 'red'}>{m}</Badge></li>)}
              </ul>
              {v.status === 'Deprecated' && <p className="mt-2 text-[11px] text-amber-700">Migration notices sent; batches on {v.version} accepted until {formatDate(v.sunset)}.</p>}
              {v.status === 'Retired' && v.mfis.length > 0 && <p className="mt-2 text-[11px] text-red-700">Still submitting on a retired version — batches are rejected. Escalate to the MFI.</p>}
            </div>
          </li>
        ))}
      </ul>
    </Card>
  );
}
