import { useState } from 'react';
import { LoaderCircle, Play, Timer } from 'lucide-react';
import { Badge, Button, Card, CardHeader, DataTable, useToast } from '@/components/ui';
import { useAdminCollection } from '../../../context/AdminStore';
import { nowStamp } from '../../../lib/time';
import { JOBS } from '../../../data/system';

/** Job scheduler (ADM-13) with manual "Run now" (audited). */
export default function JobsCard({ readOnly, audit }) {
  const toast = useToast();
  const [jobs, api] = useAdminCollection('systemJobs', JOBS);
  const [running, setRunning] = useState({});

  const run = (job) => {
    setRunning((r) => ({ ...r, [job.id]: true }));
    audit('JOB_RUN_MANUAL', `${job.id} · ${job.name}`);
    setTimeout(() => {
      const secs = 20 + Math.floor(Math.random() * 90);
      api.patch(job.id, { lastRun: nowStamp(), status: 'Success', duration: `${Math.floor(secs / 60)} m ${String(secs % 60).padStart(2, '0')} s` });
      setRunning((r) => ({ ...r, [job.id]: false }));
      toast(`${job.name} completed successfully`, 'success');
    }, 1800);
  };

  const columns = [
    { key: 'name', header: 'Job', sortable: true, render: (j) => <div><p className="font-medium text-slate-800">{j.name}</p><p className="font-mono text-[11px] text-slate-500">{j.id}</p></div> },
    { key: 'cron', header: 'Schedule (cron)', className: 'font-mono text-xs' },
    { key: 'lastRun', header: 'Last run', sortable: true, className: 'whitespace-nowrap text-xs' },
    { key: 'nextRun', header: 'Next run', className: 'whitespace-nowrap text-xs' },
    { key: 'duration', header: 'Duration', className: 'whitespace-nowrap text-xs' },
    { key: 'status', header: 'Status', sortable: true, render: (j) => (running[j.id] ? <Badge tone="blue">Running</Badge> : <Badge status={j.status} />) },
    {
      key: 'run', header: <span className="relative"><span className="sr-only">Run</span></span>, render: (j) => (
        <Button size="sm" variant="outline" icon={running[j.id] ? LoaderCircle : Play} disabled={readOnly || running[j.id]} onClick={() => run(j)}
          className={running[j.id] ? '[&>svg]:animate-spin' : ''} aria-label={`Run ${j.name} now`}>
          {running[j.id] ? 'Running…' : 'Run now'}
        </Button>
      ),
    },
  ];

  return (
    <Card>
      <CardHeader icon={Timer} title="Job scheduler" subtitle="Times in MMT (UTC+6:30) · manual runs are audited" />
      <DataTable columns={columns} rows={jobs} pageSize={10} />
    </Card>
  );
}
