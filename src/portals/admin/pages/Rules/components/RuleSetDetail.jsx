import { useState } from 'react';
import { History, RotateCcw, Rocket } from 'lucide-react';
import { Alert, Badge, Button, Card, CardBody, CardHeader, DataTable, Input, MakerCheckerBanner, Modal, Textarea, Timeline, useToast } from '@/components/ui';
import { roleName } from '@/data/roles';
import { useAdmin } from '../../../lib/useAdmin';
import { FAMILIES } from '../../../data/rules';
import { RULE_STATUS_TONE } from './RuleSetList';
import SampleTest from './SampleTest';

const byVersion = (a, b) => a.id.localeCompare(b.id);

/** One rule set: rules, back-test, activation / rollback requests (checker: Super Administrator) and version timeline. */
export default function RuleSetDetail({ set, sets, api, pending }) {
  const { user, readOnly, requestApproval } = useAdmin('rules');
  const toast = useToast();
  const [modal, setModal] = useState(null); // 'activate' | 'rollback'
  const [effective, setEffective] = useState('2026-10-01');
  const [reason, setReason] = useState('');

  const family = sets.filter((s) => s.family === set.family).sort(byVersion);
  const active = family.find((s) => s.status === 'Active');
  const previous = active ? [...family].reverse().find((s) => s.status === 'Superseded' && byVersion(s, active) < 0) : null;

  const openModal = (m) => { setReason(''); setModal(m); };

  const activate = () => {
    const effects = [{ target: 'admin', collection: 'ruleSets', op: 'patch', id: set.id, changes: { status: 'Active', effectiveFrom: effective } }];
    if (active) effects.push({ target: 'admin', collection: 'ruleSets', op: 'patch', id: active.id, changes: { status: 'Superseded', supersededOn: effective } });
    requestApproval({
      type: 'Rule activation',
      summary: `Activate ${FAMILIES[set.family].label.toLowerCase()} rule set ${set.id} effective ${effective}${active ? ` (supersedes ${active.id})` : ''}`,
      checkerRole: 'adm_super',
      payload: {
        ruleSetId: set.id, reason, testedOn: set.testedOn,
        diff: [{ field: `${set.id} status`, from: 'Draft', to: `Active from ${effective}` }, ...(active ? [{ field: `${active.id} status`, from: 'Active', to: 'Superseded' }] : [])],
        effect: effects,
      },
    });
    toast(`${set.id} submitted for activation — awaiting ${roleName('adm_super')}`, 'success');
    setModal(null);
  };

  const rollback = () => {
    requestApproval({
      type: 'Rule rollback',
      summary: `Roll back ${set.id} → reactivate ${previous.id}`,
      checkerRole: 'adm_super',
      payload: {
        ruleSetId: set.id, reason,
        diff: [{ field: `${set.id} status`, from: 'Active', to: 'Rolled back' }, { field: `${previous.id} status`, from: 'Superseded', to: 'Active' }],
        effect: [
          { target: 'admin', collection: 'ruleSets', op: 'patch', id: set.id, changes: { status: 'Rolled back' } },
          { target: 'admin', collection: 'ruleSets', op: 'patch', id: previous.id, changes: { status: 'Active', effectiveFrom: new Date().toISOString().slice(0, 10) } },
        ],
      },
    });
    toast(`Rollback of ${set.id} submitted for approval`, 'warning');
    setModal(null);
  };

  const columns = [
    { key: 'id', header: 'Rule', render: (r) => <span className="font-mono text-xs font-medium">{r.id}</span> },
    { key: 'condition', header: 'Condition' },
    { key: 'points', header: 'Points', className: 'text-right', render: (r) => <span className={r.points < 0 ? 'font-semibold text-red-700' : 'font-semibold text-emerald-700'}>{r.points > 0 ? '+' : ''}{r.points}</span> },
    { key: 'reason', header: 'Reason code', render: (r) => <Badge tone="navy">{r.reason}</Badge> },
    {
      key: 'chg', header: 'vs active',
      render: (r) => {
        if (!active || active.id === set.id) return <span className="text-xs text-slate-500">—</span>;
        const cur = active.rules.find((x) => x.id === r.id);
        if (!cur) return <Badge tone="teal">New</Badge>;
        return cur.condition !== r.condition || cur.points !== r.points ? <Badge tone="amber">Changed</Badge> : <span className="text-xs text-slate-500">Same</span>;
      },
    },
  ];

  const timeline = family.map((s) => ({
    title: `${s.id} · ${s.status}`,
    time: s.effectiveFrom ? `Effective ${s.effectiveFrom}` : 'Not activated',
    actor: [s.createdBy && `Maker ${s.createdBy}`, s.approvedBy && `Checker ${s.approvedBy}`].filter(Boolean).join(' · '),
    description: s.note,
    tone: s.status === 'Active' ? 'current' : s.status === 'Draft' ? 'pending' : 'done',
  })).reverse();

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader
          title={<span className="flex items-center gap-2"><span className="font-mono">{set.id}</span><Badge tone={RULE_STATUS_TONE[set.status]}>{set.status}</Badge></span>}
          subtitle={`${FAMILIES[set.family].label} · ${set.rules.length} rules · ${set.note}`}
          action={(
            <div className="flex flex-wrap gap-2">
              {set.status === 'Draft' && <Button size="sm" icon={Rocket} disabled={readOnly || !!pending || !set.testedAt} onClick={() => openModal('activate')}>Submit for activation</Button>}
              {set.status === 'Active' && <Button size="sm" variant="outline" icon={RotateCcw} disabled={readOnly || !!pending || !previous} onClick={() => openModal('rollback')}>Roll back</Button>}
            </div>
          )}
        />
        {pending && <Alert tone="info" className="m-4" title={`${pending.id} pending checker`}>{pending.summary}</Alert>}
        {set.status === 'Draft' && !set.testedAt && !pending && <Alert tone="warning" className="m-4">Run a back-test before submitting this version for activation.</Alert>}
        <DataTable columns={columns} rows={set.rules} dense pageSize={12} />
      </Card>

      {set.status === 'Draft' && <SampleTest candidate={set} active={active} api={api} />}

      <Card>
        <CardHeader icon={History} title="Version timeline" subtitle={FAMILIES[set.family].label} />
        <CardBody><Timeline items={timeline} /></CardBody>
      </Card>

      <Modal
        open={!!modal}
        onClose={() => setModal(null)}
        title={modal === 'activate' ? `Activate ${set.id}` : `Roll back ${set.id}`}
        subtitle={modal === 'activate' ? `Tested on ${set.testedOn ?? '—'} at ${set.testedAt ?? '—'}` : previous && `Reactivates ${previous.id}`}
        footer={(
          <>
            <Button variant="outline" onClick={() => setModal(null)}>Cancel</Button>
            <Button variant={modal === 'rollback' ? 'danger' : 'primary'} disabled={reason.trim().length < 5 || (modal === 'activate' && !effective)} onClick={modal === 'activate' ? activate : rollback}>
              Submit for approval
            </Button>
          </>
        )}
      >
        <div className="space-y-4">
          {modal === 'activate' && <Input label="Effective date" type="date" required min="2026-09-26" value={effective} onChange={(e) => setEffective(e.target.value)} hint={active ? `${active.id} becomes Superseded on this date` : undefined} />}
          {modal === 'rollback' && <Alert tone="warning">Reports generated from now on will use {previous?.id}. Existing reports keep the version they were produced with.</Alert>}
          <Textarea label="Justification" required rows={3} value={reason} onChange={(e) => setReason(e.target.value)} placeholder={modal === 'activate' ? 'e.g. Back-test within tolerance; approved by Risk Committee 18 Sep 2026' : 'e.g. Unexpected grade shift in flood townships'} />
          <MakerCheckerBanner maker={user?.name} checker={roleName('adm_super')} />
        </div>
      </Modal>
    </div>
  );
}
