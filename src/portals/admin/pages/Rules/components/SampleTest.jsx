import { useEffect, useRef, useState } from 'react';
import { PlayCircle } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Button, Card, CardBody, CardHeader, ChartCard, Select } from '@/components/ui';
import { formatNumber } from '@/lib/format';
import { useAdmin } from '../../../lib/useAdmin';
import { nowStamp } from '../../../lib/time';
import { FAMILIES, SAMPLES, SAMPLE_DIST, migration } from '../../../data/rules';

/** Back-test a candidate rule set against the active one on a frozen sample. */
export default function SampleTest({ candidate, active, api }) {
  const { readOnly, audit } = useAdmin('rules');
  const [sample, setSample] = useState(SAMPLES[0].value);
  const [progress, setProgress] = useState(candidate.testedAt ? 100 : null);
  const timer = useRef(null);

  useEffect(() => () => clearInterval(timer.current), []);
  useEffect(() => { setProgress(candidate.testedAt ? 100 : null); }, [candidate.id, candidate.testedAt]);

  const run = () => {
    clearInterval(timer.current);
    setProgress(0);
    audit('RULESET_TEST_RUN', `${candidate.id} vs ${active?.id ?? '—'} on ${sample}`);
    let p = 0;
    timer.current = setInterval(() => {
      p = Math.min(100, p + 9 + Math.round(Math.random() * 8));
      setProgress(p);
      if (p >= 100) {
        clearInterval(timer.current);
        api.patch(candidate.id, { testedAt: nowStamp(), testedOn: sample });
      }
    }, 220);
  };

  const bands = FAMILIES[candidate.family].bands;
  const scale = sample === 'aug26-10k' ? 1 : 0.25;
  const before = (SAMPLE_DIST[active?.id] ?? bands.map(() => 0)).map((v) => Math.round(v * scale));
  const after = (SAMPLE_DIST[candidate.id] ?? before).map((v) => Math.round(v * scale));
  const data = bands.map((b, i) => ({ band: b, before: before[i], after: after[i] }));
  const mig = migration(before, after);
  const done = progress === 100;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader icon={PlayCircle} title="Back-test" subtitle={`Compare ${candidate.id} (candidate) with ${active?.id ?? 'no active set'} (active)`} />
        <CardBody className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <Select label="Test cohort" options={SAMPLES} value={sample} onChange={(e) => setSample(e.target.value)} className="sm:w-96" />
            <Button icon={PlayCircle} onClick={run} disabled={readOnly || (progress !== null && progress < 100)}>Run test</Button>
          </div>
          {progress !== null && (
            <div>
              <div className="flex justify-between text-xs text-slate-600">
                <span>{done ? `Completed${candidate.testedAt ? ` · ${candidate.testedAt}` : ''}` : 'Scoring cohort…'}</span>
                <span>{progress}%</span>
              </div>
              <div className="mt-1 h-2 overflow-hidden rounded-full bg-slate-100" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100} aria-label="Test progress">
                <div className="h-full rounded-full bg-teal-600 transition-all" style={{ width: `${progress}%` }} />
              </div>
            </div>
          )}
        </CardBody>
      </Card>

      {done && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <ChartCard className="lg:col-span-2" title={`${FAMILIES[candidate.family].label} distribution`} subtitle="Borrowers per band — active vs candidate" asOf="31 Aug 2026 (frozen cohort)" height={240}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="band" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => formatNumber(v)} width={48} />
                <Tooltip itemStyle={{ color: '#334155' }} formatter={(v) => formatNumber(v)} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="before" name={`Active ${active?.id ?? ''}`} fill="#264063" radius={[3, 3, 0, 0]} />
                <Bar dataKey="after" name={`Candidate ${candidate.id}`} fill="#f59e0b" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
          <Card>
            <CardHeader title="Migration summary" />
            <CardBody className="space-y-3 text-sm">
              <p><span className="text-2xl font-bold text-slate-900">{mig.pct}%</span><span className="block text-xs text-slate-500">{formatNumber(mig.moved)} of {formatNumber(mig.total)} borrowers change band</span></p>
              <p className={mig.worse > 0 ? 'text-red-700' : 'text-emerald-700'}>
                <b>{mig.worse > 0 ? '+' : ''}{formatNumber(mig.worse)}</b> net into {bands.slice(Math.ceil(bands.length / 2)).join(' / ')}
              </p>
              <ul className="space-y-1 text-xs text-slate-600">
                {data.map((d) => (
                  <li key={d.band} className="flex justify-between"><span>{d.band}</span><span className="font-mono">{formatNumber(d.before)} → {formatNumber(d.after)}</span></li>
                ))}
              </ul>
              <p className="text-[11px] text-slate-500">Reason codes stay stable; the report shows the rule version used.</p>
            </CardBody>
          </Card>
        </div>
      )}
    </div>
  );
}
