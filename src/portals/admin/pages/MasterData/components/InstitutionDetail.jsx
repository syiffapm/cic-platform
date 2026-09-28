import { useEffect, useState } from 'react';
import { ExternalLink } from 'lucide-react';
import { Alert, Badge, Button, MakerCheckerBanner, Modal, Select, Textarea, Timeline, Toggle, useToast } from '@/components/ui';
import { LICENCE_HISTORY } from '@/data/institutions';
import { roleName } from '@/data/roles';
import { formatDate, formatMMK, formatNumber } from '@/lib/format';
import { useAdmin } from '../../../lib/useAdmin';
import { TIERS, stewardChecker } from '../../../data/masterData';

function Fact({ label, children }) {
  return (
    <div>
      <dt className="text-[11px] uppercase tracking-wide text-slate-500">{label}</dt>
      <dd className="mt-0.5 text-sm text-slate-800">{children || '—'}</dd>
    </div>
  );
}

/** Institution master record: facts, licence status history, publish flag and tier (both maker-checker). */
export default function InstitutionDetail({ institution: inst, pending, onClose }) {
  const { user, role, readOnly, requestApproval } = useAdmin('masterdata');
  const toast = useToast();
  const [publish, setPublish] = useState(false);
  const [tier, setTier] = useState('');
  const [reason, setReason] = useState('');

  useEffect(() => {
    if (inst) { setPublish(inst.publish); setTier(inst.tier); setReason(''); }
  }, [inst]);

  if (!inst) return null;
  const checkerRole = stewardChecker(role);
  const history = [
    { date: inst.licensedSince, status: 'Created', note: `Record created in Institution Master (licence ${inst.licenceNo})` },
    ...(LICENCE_HISTORY[inst.id] ?? [{ date: inst.licensedSince, status: inst.status, note: 'Initial licence granted' }]),
  ].sort((a, b) => b.date.localeCompare(a.date));

  const changes = {};
  if (publish !== inst.publish) changes.publish = publish;
  if (tier !== inst.tier) changes.tier = tier;
  const dirty = Object.keys(changes).length > 0;

  const submit = () => {
    const diff = Object.entries(changes).map(([field, to]) => ({
      field: field === 'publish' ? 'Publish to directory' : 'Tier',
      from: field === 'publish' ? (inst.publish ? 'Yes' : 'No') : inst.tier,
      to: field === 'publish' ? (to ? 'Yes' : 'No') : to,
    }));
    const parts = diff.map((d) => `${d.field} ${d.from} → ${d.to}`).join('; ');
    requestApproval({
      type: changes.tier ? 'Institution tier change' : 'Directory publish flag',
      summary: `${inst.short} (${inst.id}): ${parts}`,
      checkerRole,
      payload: { reason, diff, effect: { target: 'store', collection: 'institutions', op: 'patch', id: inst.id, changes } },
    });
    toast(`Change submitted for ${roleName(checkerRole)} approval`, 'success');
    onClose();
  };

  return (
    <Modal
      open
      onClose={onClose}
      size="lg"
      title={inst.name}
      subtitle={`${inst.id} · Licence ${inst.licenceNo} · ${inst.type}`}
      footer={(
        <>
          <Button variant="outline" onClick={onClose}>Close</Button>
          <Button onClick={submit} disabled={readOnly || !dirty || pending || !reason.trim()}>Submit for approval</Button>
        </>
      )}
    >
      <div className="space-y-6">
        <div className="flex flex-wrap items-center gap-2">
          <Badge status={inst.status} tone={inst.status === 'Under Review' ? 'amber' : undefined} />
          <Badge tone="navy">{inst.tier}</Badge>
          {inst.publish ? <Badge tone="teal">In public directory</Badge> : <Badge>Hidden from directory</Badge>}
          {pending && <Badge tone="violet">Change pending checker</Badge>}
        </div>

        <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Fact label="Region / township">{inst.region} · {inst.township}</Fact>
          <Fact label="Address">{inst.address}</Fact>
          <Fact label="Contact">{[inst.phone, inst.email].filter(Boolean).join(' · ')}</Fact>
          <Fact label="Branches">{formatNumber(inst.branches)}</Fact>
          <Fact label="Active borrowers">{formatNumber(inst.borrowers)}</Fact>
          <Fact label="Gross portfolio">{formatMMK(inst.portfolio, { compact: true })}</Fact>
          <Fact label="Licensed since">{formatDate(inst.licensedSince)}</Fact>
          <Fact label="DQ score">{inst.dqScore ? `${inst.dqScore}%` : '—'}</Fact>
          <Fact label="Products">{inst.products.join(', ')}</Fact>
        </dl>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <section aria-labelledby="lic-hist">
            <h3 id="lic-hist" className="mb-3 text-sm font-semibold text-slate-900">Status history</h3>
            <Timeline items={history.map((h, i) => ({ title: h.status, time: formatDate(h.date), description: h.note, tone: i === 0 ? 'current' : 'done' }))} />
            <p className="mt-4 flex items-start gap-1.5 text-xs text-slate-500">
              <ExternalLink className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              <span>Licence status changes are made by the <b>Licensing Officer</b> in Government Portal → Supervision → Institution register, not in this console.</span>
            </p>
          </section>

          <section aria-labelledby="md-edit" className="space-y-4">
            <h3 id="md-edit" className="text-sm font-semibold text-slate-900">Master data changes</h3>
            {pending && <Alert tone="warning">A change for this institution is already awaiting a checker. Wait for a decision before submitting another.</Alert>}
            <div className="rounded-lg border border-slate-200 p-3">
              <Toggle
                checked={publish}
                onChange={(v) => !readOnly && setPublish(v)}
                label="Publish to public directory"
                description="Controls visibility in the public MFI directory"
              />
            </div>
            <Select label="Tier" options={TIERS} value={tier} onChange={(e) => setTier(e.target.value)} disabled={readOnly} hint="Tier affects reporting frequency and supervisory thresholds" />
            <Textarea label="Reason for change" required rows={2} value={reason} onChange={(e) => setReason(e.target.value)} disabled={readOnly} placeholder="e.g. Tier upgraded per FRD letter 22/2026" />
            <MakerCheckerBanner maker={user?.name} checker={roleName(checkerRole)} />
          </section>
        </div>
      </div>
    </Modal>
  );
}
