import { useState } from 'react';
import { Network, Plus, X } from 'lucide-react';
import { Button, Card, CardHeader } from '@/components/ui';
import { CIDR_RE, PORTALS, PORTAL_LABELS } from '../../../data/iam';

/** Editable IPv4 CIDR allow-lists per portal (ADM-03). */
export default function IpAllowList({ value, onChange, disabled }) {
  const [inputs, setInputs] = useState({});
  const [errors, setErrors] = useState({});

  const add = (portal) => {
    const cidr = (inputs[portal] ?? '').trim();
    let err = null;
    if (!CIDR_RE.test(cidr)) err = 'Enter an IPv4 CIDR such as 10.10.4.0/24';
    else if (value[portal].includes(cidr)) err = 'Already in the list';
    else if (Number(cidr.split('/')[1]) < 8) err = 'Prefix shorter than /8 is not allowed';
    setErrors({ ...errors, [portal]: err });
    if (err) return;
    onChange({ ...value, [portal]: [...value[portal], cidr] });
    setInputs({ ...inputs, [portal]: '' });
  };
  const remove = (portal, cidr) => onChange({ ...value, [portal]: value[portal].filter((c) => c !== cidr) });

  return (
    <Card>
      <CardHeader icon={Network} title="IP allow-lists" subtitle="Requests from outside these ranges are refused and logged. Empty list = open (public-facing portal)." />
      <div className="grid grid-cols-1 gap-4 p-5 md:grid-cols-2">
        {PORTALS.map((p) => (
          <div key={p} className="rounded-lg border border-slate-200 p-3">
            <p className="text-sm font-semibold text-slate-800">{PORTAL_LABELS[p]}</p>
            <ul className="mt-2 flex min-h-[28px] flex-wrap gap-1.5">
              {value[p].length === 0 && <li className="text-xs text-slate-500">Open to internet (WAF + rate limits apply)</li>}
              {value[p].map((c) => (
                <li key={c} className="inline-flex items-center gap-1 rounded-full bg-slate-100 py-0.5 pl-2.5 pr-1 font-mono text-xs text-slate-700">
                  {c}
                  <button type="button" disabled={disabled} onClick={() => remove(p, c)} aria-label={`Remove ${c} from ${PORTAL_LABELS[p]}`} className="rounded-full p-0.5 hover:bg-slate-200 disabled:opacity-40">
                    <X className="h-3 w-3" />
                  </button>
                </li>
              ))}
            </ul>
            <div className="mt-3 flex gap-2">
              <label className="sr-only" htmlFor={`cidr-${p}`}>Add CIDR to {PORTAL_LABELS[p]}</label>
              <input id={`cidr-${p}`} value={inputs[p] ?? ''} disabled={disabled} placeholder="203.81.64.0/22"
                onChange={(e) => setInputs({ ...inputs, [p]: e.target.value })}
                onKeyDown={(e) => e.key === 'Enter' && add(p)}
                aria-invalid={!!errors[p]}
                className="h-9 w-full rounded-lg border border-slate-300 px-3 font-mono text-sm disabled:bg-slate-50" />
              <Button size="sm" variant="outline" icon={Plus} disabled={disabled} onClick={() => add(p)}>Add</Button>
            </div>
            {errors[p] && <p role="alert" className="mt-1 text-[11px] font-medium text-red-600">{errors[p]}</p>}
          </div>
        ))}
      </div>
    </Card>
  );
}
