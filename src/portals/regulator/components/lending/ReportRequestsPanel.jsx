import { useMemo } from 'react';
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useStore } from '@/context/StoreContext';
import { formatNumber } from '@/lib/format';
import { Card, CardBody, CardHeader, ChartCard } from '@/components/ui';
import { LENDING_AS_OF, REPORT_REQUESTS_MONTHLY } from '../../data/lending';
import { C, axis, legend, tooltip } from '../../lib/chart';

const OPEN = ['Submitted', 'Validating', 'Pending review'];
const median = (xs) => {
  if (!xs.length) return null;
  const s = [...xs].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};
const hours = (a, b) => (new Date(String(b).replace(' ', 'T')) - new Date(String(a).replace(' ', 'T'))) / 36e5;

/**
 * Personal credit report requests: 12-month aggregates plus requests received since the monthly
 * cut-off (live platform count). Counts and timings only — no names, NRCs or request references.
 */
export function useReportRequestAggregates() {
  const { reportRequests = [] } = useStore();
  return useMemo(() => {
    const m = REPORT_REQUESTS_MONTHLY;
    const sum = (k) => m.reduce((s, x) => s + x[k], 0);
    const live = reportRequests.filter((r) => r.submittedAt >= '2026-09-01');
    const liveTimes = live.filter((r) => r.status === 'Ready' && r.reviewedAt).map((r) => hours(r.submittedAt, r.reviewedAt));
    return {
      requested: sum('requested'), issued: sum('issued'), rejected: sum('rejected'),
      medianHours: median(m.map((x) => x.medianHours)), lastMedian: m[m.length - 1].medianHours,
      live: {
        requested: live.length, issued: live.filter((r) => r.status === 'Ready').length,
        rejected: live.filter((r) => r.status === 'Rejected').length, open: live.filter((r) => OPEN.includes(r.status)).length,
        medianHours: median(liveTimes),
      },
    };
  }, [reportRequests]);
}

export default function ReportRequestsPanel() {
  const a = useReportRequestAggregates();
  const items = [
    ['Requested, 12 months', formatNumber(a.requested)],
    ['Issued', `${formatNumber(a.issued)} (${Math.round((a.issued / a.requested) * 1000) / 10}%)`],
    ['Rejected', formatNumber(a.rejected)],
    ['Median time to issue', `${a.lastMedian} h last month`],
  ];
  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
      <ChartCard className="xl:col-span-2" title="Personal credit report requests" subtitle="Citizens' own report requests per month — issued and rejected by CIC" asOf={LENDING_AS_OF} height={260}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={REPORT_REQUESTS_MONTHLY} margin={{ top: 8, right: 8, left: 8, bottom: 4 }}>
            <CartesianGrid stroke={C.grid} vertical={false} />
            <XAxis dataKey="month" {...axis} />
            <YAxis {...axis} width={48} tickFormatter={(v) => (v >= 1000 ? `${Math.round(v / 100) / 10}k` : v)} />
            <Tooltip {...tooltip} formatter={(v, n) => [formatNumber(v), n]} />
            <Legend {...legend} />
            <Bar dataKey="issued" name="Issued" stackId="r" fill={C.teal} maxBarSize={28} />
            <Bar dataKey="rejected" name="Rejected" stackId="r" fill={C.red} radius={[4, 4, 0, 0]} maxBarSize={28} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>
      <Card>
        <CardHeader title="Report requests at a glance" subtitle={`Aggregates to ${LENDING_AS_OF}; live figures since 1 Sep 2026`} />
        <CardBody className="space-y-4 text-sm">
          <dl className="grid grid-cols-2 gap-3">
            {items.map(([k, v]) => (
              <div key={k}><dt className="text-[11px] text-slate-500">{k}</dt><dd className="mt-0.5 font-semibold text-slate-900">{v}</dd></div>
            ))}
          </dl>
          <div className="rounded-lg border border-slate-100 bg-slate-50/60 p-3 text-xs text-slate-700">
            <p className="font-medium text-slate-800">Since 1 Sep 2026 (live)</p>
            <p className="mt-1"><b>{a.live.requested}</b> requested · <b>{a.live.issued}</b> issued · <b>{a.live.rejected}</b> rejected · <b>{a.live.open}</b> awaiting CIC</p>
            {a.live.medianHours != null && <p className="mt-0.5">Median time to issue: <b>{Math.round(a.live.medianHours * 10) / 10} h</b></p>}
          </div>
          <p className="text-[11px] text-slate-500">CIC decides every request within 1 working day. A citizen sees their score only after the report is issued; each report is valid for 30 days. Counts only — no individual requests are shown.</p>
        </CardBody>
      </Card>
    </div>
  );
}
