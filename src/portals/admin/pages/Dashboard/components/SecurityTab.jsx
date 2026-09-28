import { Link } from 'react-router-dom';
import { Bar, BarChart, CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Fingerprint, Globe, LogIn, ShieldAlert, Siren, UserCog } from 'lucide-react';
import { Badge, Card, CardHeader, ChartCard, StatCard } from '@/components/ui';
import { DASH_AS_OF } from '../../../data/ops';
import { SECURITY_EVENTS, SECURITY_KPIS, SECURITY_TREND } from '../../../data/security';
import { C, axis } from './chartTheme';

/** Security dashboard (§9): failed logins, MFA failures, IP anomalies, privileged actions, break-glass. */
export default function SecurityTab() {
  const byType = Object.entries(SECURITY_EVENTS.reduce((acc, e) => ({ ...acc, [e.type]: (acc[e.type] ?? 0) + 1 }), {}))
    .map(([type, count]) => ({ type, count }));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        <StatCard label="Failed logins (24 h)" value={SECURITY_KPIS.failedLogins24h} icon={LogIn} tone="red" delta={3.6} deltaLabel="vs 7-day avg"
          definition="Rejected username/password attempts across all portals in the last 24 hours" asOf={DASH_AS_OF} />
        <StatCard label="MFA failures (24 h)" value={SECURITY_KPIS.mfaFailures24h} icon={Fingerprint} tone="warm"
          definition="Second-factor challenges failed or expired" asOf={DASH_AS_OF} />
        <StatCard label="IP / geo anomalies (24 h)" value={SECURITY_KPIS.ipAnomalies24h} icon={Globe} tone="violet"
          definition="Logins or API calls from IPs outside allow-lists, Tor exits, or impossible-travel pairs" asOf={DASH_AS_OF} />
        <StatCard label="Privileged actions (24 h)" value={SECURITY_KPIS.privileged24h} icon={UserCog} tone="navy"
          definition="Actions by super/security admins: config, role, key and policy changes" asOf={DASH_AS_OF} />
        <StatCard label="Break-glass use (30 days)" value={SECURITY_KPIS.breakGlass30d} icon={Siren} tone="red"
          definition="Sessions opened with emergency break-glass accounts; each triggers an alert and post-review" asOf={DASH_AS_OF} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <ChartCard className="lg:col-span-2" title="Security signals" subtitle="Daily counts, last 14 days" asOf={DASH_AS_OF}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={SECURITY_TREND} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
              <CartesianGrid vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="day" {...axis} interval={1} />
              <YAxis {...axis} />
              <Tooltip itemStyle={{ color: '#334155' }} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Line type="monotone" dataKey="failedLogins" name="Failed logins" stroke={C.red} strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="mfaFailures" name="MFA failures" stroke={C.amber} strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="privileged" name="Privileged actions" stroke={C.navy} strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="ipAnomalies" name="IP anomalies" stroke={C.teal} strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
        <ChartCard title="Events by type" subtitle="Security event register" asOf={DASH_AS_OF}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={byType} layout="vertical" margin={{ top: 4, right: 12, left: 8, bottom: 0 }}>
              <CartesianGrid horizontal={false} stroke="#e2e8f0" />
              <XAxis type="number" allowDecimals={false} {...axis} />
              <YAxis type="category" dataKey="type" width={120} {...axis} />
              <Tooltip itemStyle={{ color: '#334155' }} formatter={(v) => [v, 'Events']} />
              <Bar dataKey="count" fill={C.navy} radius={[0, 4, 4, 0]} barSize={16} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <Card>
        <CardHeader icon={ShieldAlert} title="Recent security events" subtitle="Account-level only · no borrower data"
          action={<Link to="/gov/admin/audit" className="text-xs font-medium text-primary hover:underline">Open security monitoring</Link>} />
        <ul className="divide-y divide-slate-100">
          {SECURITY_EVENTS.slice(0, 6).map((e) => (
            <li key={e.id} className="flex flex-col gap-1 px-5 py-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <p className="text-sm font-medium text-slate-800">{e.type} · <span className="font-mono text-xs">{e.account}</span></p>
                <p className="text-[11px] text-slate-500">{e.at} · {e.tenant} · <span className="font-mono">{e.ip}</span> · {e.geo}</p>
              </div>
              <div className="flex shrink-0 gap-2"><Badge status={e.severity} /><Badge status={e.status} /></div>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
