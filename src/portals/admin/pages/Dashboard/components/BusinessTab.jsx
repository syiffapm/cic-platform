import { useMemo } from 'react';
import { Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Layers, Search, TrendingUp, Wallet } from 'lucide-react';
import { ChartCard, StatCard } from '@/components/ui';
import { formatNumber } from '@/lib/format';
import { DASH_AS_OF, INQUIRIES_BY_MFI, INQUIRIES_BY_PURPOSE, REVENUE } from '../../../data/ops';
import { C, axis } from './chartTheme';

const PURPOSE_COLORS = [C.navy, C.teal, C.amber, C.slate];
const PURPOSE_DATA = INQUIRIES_BY_PURPOSE.map((p) => ({ ...p, name: `${p.code} · ${p.label}` }));
const TIER_COLORS = { 'Tier 1': C.navy, 'Tier 2': C.teal, 'Tier 3': C.amber };

/** Business dashboard (§9): inquiries by MFI and purpose, revenue billed vs collected, tier distribution. Aggregates only. */
export default function BusinessTab({ institutions }) {
  const tiers = useMemo(() => {
    const counts = {};
    institutions.filter((i) => i.status !== 'Revoked').forEach((i) => { counts[i.tier] = (counts[i.tier] ?? 0) + 1; });
    return Object.entries(counts).sort().map(([tier, count]) => ({ tier, count }));
  }, [institutions]);
  const totalInq = INQUIRIES_BY_PURPOSE.reduce((s, p) => s + p.value, 0);
  const ytdBilled = REVENUE.slice(-8).reduce((s, r) => s + r.billed, 0);
  const ytdCollected = REVENUE.slice(-8).reduce((s, r) => s + r.collected, 0);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <StatCard label="Inquiries (month to date)" value={formatNumber(totalInq)} icon={Search} tone="navy"
          definition="Billable inquiries across all MFIs and purposes; retries excluded" asOf={DASH_AS_OF} />
        <StatCard label="New-loan share" value={`${Math.round((INQUIRIES_BY_PURPOSE[0].value / totalInq) * 100)}%`} icon={TrendingUp} tone="teal"
          definition="Inquiries with purpose NL ÷ all billable inquiries" asOf={DASH_AS_OF} />
        <StatCard label="Billed YTD" value={`${formatNumber(ytdBilled)}M MMK`} icon={Wallet} tone="warm"
          definition="Sum of invoices issued Jan–Aug 2026 (MMK millions)" asOf={DASH_AS_OF} />
        <StatCard label="Collection rate YTD" value={`${((ytdCollected / ytdBilled) * 100).toFixed(1)}%`} icon={Layers} tone="green"
          definition="Payments reconciled ÷ amounts billed, Jan–Aug 2026" asOf={DASH_AS_OF} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <ChartCard className="lg:col-span-2" title="Inquiries by MFI" subtitle="Month to date" asOf={DASH_AS_OF}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={INQUIRIES_BY_MFI} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
              <CartesianGrid vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="mfi" {...axis} />
              <YAxis {...axis} tickFormatter={(v) => `${Math.round(v / 1000)}k`} />
              <Tooltip itemStyle={{ color: '#334155' }} formatter={(v) => [formatNumber(v), 'Inquiries']} />
              <Bar dataKey="inquiries" fill={C.navy} radius={[4, 4, 0, 0]} barSize={28} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
        <ChartCard title="Inquiries by purpose" subtitle="NL · RV · CL · GR" asOf={DASH_AS_OF}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={PURPOSE_DATA} dataKey="value" nameKey="name" innerRadius={50} outerRadius={85} paddingAngle={2}>
                {PURPOSE_DATA.map((p, i) => <Cell key={p.code} fill={PURPOSE_COLORS[i]} />)}
              </Pie>
              <Tooltip itemStyle={{ color: '#334155' }} formatter={(v, n) => [formatNumber(v), n]} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <ChartCard className="lg:col-span-2" title="Revenue billed vs collected" subtitle="MMK millions per month" asOf={DASH_AS_OF}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={REVENUE} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
              <CartesianGrid vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="month" {...axis} />
              <YAxis {...axis} />
              <Tooltip itemStyle={{ color: '#334155' }} formatter={(v, n) => [`${formatNumber(v)}M MMK`, n]} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="billed" name="Billed" fill={C.navy} radius={[3, 3, 0, 0]} />
              <Bar dataKey="collected" name="Collected" fill={C.emerald} radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
        <ChartCard title="Tier distribution" subtitle="Institutions not revoked" asOf={DASH_AS_OF}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={tiers} dataKey="count" nameKey="tier" outerRadius={85} label={({ name, value }) => `${name}: ${value}`} labelLine={false}>
                {tiers.map((t) => <Cell key={t.tier} fill={TIER_COLORS[t.tier] ?? C.slate} />)}
              </Pie>
              <Tooltip itemStyle={{ color: '#334155' }} formatter={(v, n) => [v, n]} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </div>
  );
}
