import { useId, useMemo, useState } from 'react';
import { Bar, BarChart, CartesianGrid, Cell, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { formatNumber } from '@/lib/format';
import { Alert, Card, CardBody, CardHeader, ChartCard, PageHeader, StatCard } from '@/components/ui';
import { DTI_DISTRIBUTION, LOANS_DISTRIBUTION } from '../../data/riskData';
import { C, axis, axisLabel, tooltip } from '../../lib/chart';
import { round } from '../../lib/util';

const SNAPSHOT = 'Aug 2026 DWH snapshot';
const TOTAL_B = DTI_DISTRIBUTION.reduce((s, d) => s + d.count, 0);
const TOTAL_P = DTI_DISTRIBUTION.reduce((s, d) => s + d.portfolio, 0);

function simulate(cap, maxLoans) {
  const dA = DTI_DISTRIBUTION.filter((d) => d.dti > cap);
  const lA = LOANS_DISTRIBUTION.filter((d) => d.loans > maxLoans);
  const a = dA.reduce((s, d) => s + d.count, 0);
  const b = lA.reduce((s, d) => s + d.count, 0);
  const ap = dA.reduce((s, d) => s + d.portfolio, 0);
  const bp = lA.reduce((s, d) => s + d.portfolio, 0);
  // Union under a positive-correlation assumption: multi-borrowers are 2.2× likelier to exceed the DTI cap.
  const overlap = Math.min(a, b, ((a * b) / TOTAL_B) * 2.2);
  const overlapP = Math.min(ap, bp, ((ap * bp) / TOTAL_P) * 2.2);
  const count = Math.round(a + b - overlap);
  const portfolio = ap + bp - overlapP;
  return { count, share: round((count / TOTAL_B) * 100), portfolio: round(portfolio), pShare: round((portfolio / TOTAL_P) * 100), a, b };
}

function Slider({ label, value, min, max, step, onChange, fmt, hint }) {
  const id = useId();
  return (
    <div>
      <div className="flex items-baseline justify-between">
        <label htmlFor={id} className="text-xs font-medium text-slate-700">{label}</label>
        <span className="text-lg font-bold text-primary">{fmt(value)}</span>
      </div>
      <input id={id} type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} className="mt-2 w-full accent-[hsl(38_92%_50%)]" aria-valuetext={fmt(value)} />
      <div className="flex justify-between text-[11px] text-slate-500"><span>{fmt(min)}</span><span>{fmt(max)}</span></div>
      {hint && <p className="mt-1 text-[11px] text-slate-500">{hint}</p>}
    </div>
  );
}

export default function PolicySimulation() {
  const [cap, setCap] = useState(50);
  const [maxLoans, setMaxLoans] = useState(3);
  const r = useMemo(() => simulate(cap, maxLoans), [cap, maxLoans]);
  const scenarios = useMemo(() => [40, 50, 60, 70, 80].map((c) => ({ cap: c, ...simulate(c, maxLoans) })), [maxLoans]);

  return (
    <div>
      <PageHeader
        title="Policy impact analysis"
        subtitle={`What-if analysis of responsible-lending rules on historical borrower distributions (${SNAPSHOT}). Supports the draft DTI guideline ANN-2026-032.`}
      />
      <Alert tone="info" className="mb-6" title="Indicative only">Results use bucketed historical distributions and a stated correlation assumption; they are not a forecast of lender behaviour.</Alert>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <Card>
          <CardHeader title="Rule thresholds" subtitle="A new loan is blocked if either rule is breached" />
          <CardBody className="space-y-6">
            <Slider label="Debt-to-income cap" value={cap} min={30} max={100} step={10} onChange={setCap} fmt={(v) => `${v}%`} hint="Monthly instalments ÷ declared household income" />
            <Slider label="Maximum active loans per borrower" value={maxLoans} min={1} max={5} step={1} onChange={setMaxLoans} fmt={(v) => `${v}`} hint="Across all MFIs, via identity resolution" />
          </CardBody>
        </Card>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:col-span-2">
          <StatCard label="Borrowers affected" value={formatNumber(r.count)} tone="violet" definition="Borrowers who would breach at least one rule at the next loan application" asOf={SNAPSHOT} />
          <StatCard label="Share of borrowers" value={`${r.share}%`} tone="warm" definition="Affected ÷ all borrowers with an active loan" asOf={SNAPSHOT} />
          <StatCard label="Portfolio affected" value={`${r.portfolio.toLocaleString()} bn MMK`} tone="navy" definition="Outstanding principal held by affected borrowers" asOf={SNAPSHOT} />
          <StatCard label="Share of portfolio" value={`${r.pShare}%`} tone="red" definition="Affected portfolio ÷ gross portfolio" asOf={SNAPSHOT} />
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-2">
        <ChartCard title="Borrowers by DTI band" subtitle={`Amber bars exceed the ${cap}% cap (${formatNumber(r.a)} borrowers)`} height={280}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={DTI_DISTRIBUTION} margin={{ top: 8, right: 8, left: 8, bottom: 16 }}>
              <CartesianGrid stroke={C.grid} vertical={false} />
              <XAxis dataKey="dti" {...axis} tickFormatter={(v) => `≤${v}%`} label={axisLabel('DTI band')} />
              <YAxis {...axis} width={52} tickFormatter={(v) => `${v / 1000}k`} label={axisLabel('Borrowers', true)} />
              <Tooltip {...tooltip} labelFormatter={(v) => `DTI ${v - 10}–${v}%`} formatter={(v) => [formatNumber(v), 'Borrowers']} />
              <ReferenceLine x={cap} stroke={C.slate} strokeDasharray="4 4" />
              <Bar dataKey="count" radius={[4, 4, 0, 0]} maxBarSize={32}>
                {DTI_DISTRIBUTION.map((d) => <Cell key={d.dti} fill={d.dti > cap ? C.amber : C.navy} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
        <ChartCard title="Borrowers by number of active loans" subtitle={`Amber bars exceed ${maxLoans} active loan(s) (${formatNumber(r.b)} borrowers)`} height={280}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={LOANS_DISTRIBUTION} margin={{ top: 8, right: 8, left: 8, bottom: 16 }}>
              <CartesianGrid stroke={C.grid} vertical={false} />
              <XAxis dataKey="loans" {...axis} tickFormatter={(v) => (v === 5 ? '5+' : v)} label={axisLabel('Active loans')} />
              <YAxis {...axis} width={52} scale="sqrt" tickFormatter={(v) => `${v / 1000}k`} label={axisLabel('Borrowers (√ scale)', true)} />
              <Tooltip {...tooltip} formatter={(v) => [formatNumber(v), 'Borrowers']} />
              <Bar dataKey="count" radius={[4, 4, 0, 0]} maxBarSize={40}>
                {LOANS_DISTRIBUTION.map((d) => <Cell key={d.loans} fill={d.loans > maxLoans ? C.amber : C.navy} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <Card className="mt-6">
        <CardHeader title="Scenario comparison" subtitle={`DTI caps with max ${maxLoans} active loan(s)`} />
        <div className="overflow-x-auto" tabIndex={0} role="region" aria-label="Simulation results table">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-[11px] uppercase text-slate-500">
              <tr><th className="px-4 py-2">DTI cap</th><th className="px-4 py-2 text-right">Borrowers affected</th><th className="px-4 py-2 text-right">% borrowers</th><th className="px-4 py-2 text-right">Portfolio (bn MMK)</th><th className="px-4 py-2 text-right">% portfolio</th></tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {scenarios.map((s) => (
                <tr key={s.cap} className={s.cap === cap ? 'bg-amber-50 font-semibold' : ''}>
                  <td className="px-4 py-2">{s.cap}%{s.cap === cap && ' (selected)'}</td>
                  <td className="px-4 py-2 text-right tabular-nums">{formatNumber(s.count)}</td>
                  <td className="px-4 py-2 text-right tabular-nums">{s.share}%</td>
                  <td className="px-4 py-2 text-right tabular-nums">{s.portfolio}</td>
                  <td className="px-4 py-2 text-right tabular-nums">{s.pShare}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
