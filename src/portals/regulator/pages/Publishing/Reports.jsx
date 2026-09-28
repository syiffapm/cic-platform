import { useState } from 'react';
import { Link } from 'react-router-dom';
import { BarChart3, CalendarClock, Play } from 'lucide-react';
import { useSession } from '@/context/AuthContext';
import { useStore } from '@/context/StoreContext';
import { usePermissions } from '@/lib/rbac';
import { AS_OF, SECTOR_TREND, PORTFOLIO_BY_REGION } from '@/data/kpis';
import { Badge, Button, Card, CardBody, DataTable, Input, Modal, PageHeader, Select, useToast } from '@/components/ui';
import { COMPLIANCE, REPORTS_CATALOGUE } from '../../data/supervision';
import { TOWNSHIP_STATS } from '../../data/townships';
import { downloadCsv, nowStamp } from '../../lib/util';

/** Data behind each generated report in the prototype (real build: C10 Reporting service). */
const REPORT_DATA = {
  R02: () => COMPLIANCE.map(({ months, ...r }) => r),
  R03: () => SECTOR_TREND,
  R04: () => COMPLIANCE.map((r) => ({ mfi: r.short, tier: r.tier, onTime: r.onTime, dqScore: r.dqScore })),
  R05: () => TOWNSHIP_STATS.map((t) => ({ township: t.name, region: t.region, borrowers: t.borrowers, multi: t.multi, highDti: t.highDti })),
  R06: () => [{ metric: 'Disputes closed within SLA', value: '91.4%' }, { metric: 'Complaints received (Aug)', value: 38 }],
  R11: () => [{ metric: 'Availability', value: '99.93%' }, { metric: 'Critical incidents', value: 0 }, { metric: 'Major incidents', value: 2 }],
  'R03-A': () => PORTFOLIO_BY_REGION,
};

export default function Reports() {
  const user = useSession('gov');
  const { can } = usePermissions('gov');
  const canCreate = can('gov.reports', 'create');
  const { logAudit } = useStore();
  const toast = useToast();
  const [catalogue, setCatalogue] = useState(REPORTS_CATALOGUE);
  const [sched, setSched] = useState(null);

  const generate = (r) => {
    const rows = REPORT_DATA[r.code]?.() ?? [];
    downloadCsv(`${r.code}-${r.name.replace(/\W+/g, '-')}-${AS_OF.replace(/ /g, '')}.csv`, rows);
    setCatalogue((c) => c.map((x) => (x.code === r.code ? { ...x, lastRun: nowStamp() } : x)));
    logAudit({ actor: user.name, role: user.role, tenant: 'CBM', action: 'REPORT_GENERATE', module: 'Reports', target: r.code, outcome: 'Success' });
    toast(`${r.code} generated with watermark and cut-off ${AS_OF}`, 'success');
  };

  const saveSchedule = () => {
    setCatalogue((c) => c.map((x) => (x.code === sched.code ? { ...x, frequency: sched.frequency, recipients: sched.recipients, nextRun: `${sched.nextRun} 06:00` } : x)));
    logAudit({ actor: user.name, role: user.role, tenant: 'CBM', action: 'REPORT_SCHEDULE', module: 'Reports', target: `${sched.code} ${sched.frequency}`, outcome: 'Success' });
    toast(`${sched.code} schedule updated`, 'success');
    setSched(null);
  };

  const columns = [
    { key: 'code', header: 'Code', sortable: true, render: (r) => <span className="font-mono text-xs font-semibold">{r.code}</span> },
    { key: 'name', header: 'Report', sortable: true, render: (r) => <><p className="font-medium text-slate-900">{r.name}</p><p className="text-[11px] text-slate-500">{r.format}</p></> },
    { key: 'frequency', header: 'Frequency', sortable: true, render: (r) => <Badge tone="blue">{r.frequency}</Badge> },
    { key: 'classification', header: 'Class', render: (r) => <Badge tone={r.classification === 'Public' ? 'green' : r.classification === 'Internal' ? 'slate' : 'violet'}>{r.classification}</Badge> },
    { key: 'lastRun', header: 'Last run', sortable: true, render: (r) => <span className="font-mono text-[11px]">{r.lastRun}</span> },
    { key: 'nextRun', header: 'Next run', sortable: true, render: (r) => <span className="font-mono text-[11px]">{r.nextRun}</span> },
    { key: 'recipients', header: 'Recipients', render: (r) => <span className="text-xs">{r.recipients}</span> },
    {
      key: 'act', header: <span className="relative"><span className="sr-only">Actions</span></span>,
      render: (r) => (
        <div className="flex justify-end gap-1.5">
          <Button size="sm" icon={Play} disabled={!can('gov.reports', 'export')} onClick={() => generate(r)}>Generate</Button>
          <Button size="sm" variant="outline" icon={CalendarClock} disabled={!canCreate} onClick={() => setSched({ ...r, nextRun: r.nextRun.slice(0, 10) })}>Schedule</Button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Reports"
        subtitle="Statutory and scheduled reports. Every output carries a watermark and a footer with data cut-off, generation time and generator."
        actions={canCreate && <Link to="/gov/analytics"><Button variant="outline" icon={BarChart3}>Ad-hoc builder</Button></Link>}
      />
      <Card>
        <DataTable columns={columns} rows={catalogue} rowKey="code" searchKeys={['code', 'name', 'recipients']} />
      </Card>
      {canCreate && <Card className="mt-6">
        <CardBody className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-slate-900">Need something not in the catalogue?</p>
            <p className="text-xs text-slate-500">The ad-hoc builder queries the anonymised DWH by dimension, metric and filter — no borrower-level data.</p>
          </div>
          <Link to="/gov/analytics"><Button variant="teal" icon={BarChart3}>Open ad-hoc builder</Button></Link>
        </CardBody>
      </Card>}

      <Modal
        open={!!sched}
        onClose={() => setSched(null)}
        title={sched ? `Schedule ${sched.code}` : ''}
        subtitle={sched?.name}
        footer={<><Button variant="outline" onClick={() => setSched(null)}>Cancel</Button><Button onClick={saveSchedule}>Save schedule</Button></>}
      >
        {sched && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Select label="Frequency" value={sched.frequency} onChange={(e) => setSched({ ...sched, frequency: e.target.value })} options={['Daily', 'Weekly', 'Monthly', 'Quarterly', 'Annual']} />
            <Input label="Next run" type="date" value={sched.nextRun} onChange={(e) => setSched({ ...sched, nextRun: e.target.value })} />
            <Input className="sm:col-span-2" label="Email to role groups" value={sched.recipients} onChange={(e) => setSched({ ...sched, recipients: e.target.value })} hint="Delivered as a secure link; attachments are never emailed." />
          </div>
        )}
      </Modal>
    </div>
  );
}
