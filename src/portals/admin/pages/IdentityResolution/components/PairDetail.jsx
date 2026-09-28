import clsx from 'clsx';
import { useEffect, useState } from 'react';
import { Check, GitMerge, History, Split, UserX, X } from 'lucide-react';
import { Alert, Badge, Button, Card, CardBody, CardHeader, MakerCheckerBanner, Textarea, Timeline, useToast } from '@/components/ui';
import { roleName } from '@/data/roles';
import { normaliseName, normaliseDigits } from '@/lib/nrc';
import { useAdmin } from '../../../lib/useAdmin';
import { nowStamp } from '../../../lib/time';
import { stewardChecker } from '../../../data/masterData';
import { lineageFor } from '../../../data/identity';

const DECISIONS = {
  Merge: { icon: GitMerge, result: 'Merged', variant: 'primary', help: 'Both records become one borrower ID; loans are re-pointed and the old ID is kept as an alias.' },
  'Not same person': { icon: UserX, result: 'Not same person', variant: 'outline', help: 'Pair is suppressed from future match runs unless attributes change.' },
  Split: { icon: Split, result: 'Split', variant: 'outline', help: 'Records previously linked are separated; loans are re-assigned to the correct borrower.' },
};

/** Side-by-side compare, steward decision (maker) and lineage for one candidate pair. */
export default function PairDetail({ pair, api }) {
  const { user, role, readOnly, nrc, phone, piiUnmasked, requestApproval, audit } = useAdmin('identity');
  const toast = useToast();
  const [decision, setDecision] = useState('');
  const [reason, setReason] = useState('');
  const checkerRole = stewardChecker(role);

  useEffect(() => { setDecision(''); setReason(''); }, [pair.id]);

  const rows = [
    { label: 'NRC', a: nrc(pair.a.nrc), b: nrc(pair.b.nrc), match: normaliseDigits(pair.a.nrc) === normaliseDigits(pair.b.nrc), mono: true },
    { label: 'Previous NRC', a: pair.a.prevNrc ? nrc(pair.a.prevNrc) : '—', b: pair.b.prevNrc ? nrc(pair.b.prevNrc) : '—', match: [pair.a.prevNrc, pair.b.prevNrc].some((v) => v && [pair.a.nrc, pair.b.nrc].includes(v)) || null, mono: true },
    { label: 'Name (Myanmar)', a: pair.a.nameMm, b: pair.b.nameMm, match: normaliseName(pair.a.nameMm) === normaliseName(pair.b.nameMm) },
    { label: 'Name (English)', a: pair.a.nameEn, b: pair.b.nameEn, match: pair.a.nameEn === pair.b.nameEn },
    { label: 'Normalised name', a: normaliseName(pair.a.nameEn), b: normaliseName(pair.b.nameEn), match: normaliseName(pair.a.nameEn) === normaliseName(pair.b.nameEn), hint: 'Honorifics U / Daw / Ko / Ma / Maung stripped' },
    { label: 'Date of birth', a: pair.a.dob, b: pair.b.dob, match: pair.a.dob === pair.b.dob },
    { label: 'Father\'s name', a: pair.a.father, b: pair.b.father, match: normaliseName(pair.a.father) === normaliseName(pair.b.father) },
    { label: 'Township', a: pair.a.township, b: pair.b.township, match: pair.a.township === pair.b.township },
    { label: 'Phone', a: phone(pair.a.phone), b: phone(pair.b.phone), match: pair.a.phone === pair.b.phone, mono: true },
    { label: 'Source MFIs', a: pair.a.mfis.join(', '), b: pair.b.mfis.join(', '), match: null },
    { label: 'Active loans', a: pair.a.loans, b: pair.b.loans, match: null },
  ];

  const canDecide = !readOnly && pair.status === 'Open';

  const submit = () => {
    const d = DECISIONS[decision];
    const approval = requestApproval({
      type: `Identity ${decision.toLowerCase()}`,
      summary: `${pair.id}: ${decision} ${pair.a.rid} ↔ ${pair.b.rid} (similarity ${pair.score}%)`,
      checkerRole,
      payload: {
        reason,
        diff: [{ field: 'Pair status', from: 'Open', to: d.result }, { field: 'Records', from: `${pair.a.rid}, ${pair.b.rid}`, to: decision === 'Merge' ? `${pair.a.rid} (alias ${pair.b.rid})` : `${pair.a.rid}, ${pair.b.rid}` }],
        effect: { target: 'admin', collection: 'identityPairs', op: 'patch', id: pair.id, changes: { status: d.result, resolvedAt: nowStamp() } },
      },
    });
    api.patch(pair.id, { status: 'Pending checker', decision, decidedBy: user?.name, reason, approvalId: approval.id });
    audit('IDENTITY_DECISION', `${pair.id} · ${decision}`, { outcome: 'Pending approval' });
    toast(`${decision} submitted — ${approval.id} awaits ${roleName(checkerRole)}`, 'success');
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader
          title={`${pair.id} · similarity ${pair.score}%`}
          subtitle={`Detected ${pair.detectedAt} · ${pair.source}${piiUnmasked ? '' : ' · PII masked for your role'}`}
          action={<Badge tone={pair.status === 'Pending checker' ? 'violet' : pair.status === 'Open' ? 'blue' : 'green'}>{pair.status}</Badge>}
        />
        <div className="overflow-x-auto scrollbar-thin" tabIndex={0} role="region" aria-label="Record comparison">
          <table className="w-full text-sm">
            <caption className="sr-only">Side-by-side comparison of {pair.a.rid} and {pair.b.rid}</caption>
            <thead className="bg-slate-50 text-[11px] uppercase tracking-wide text-slate-500">
              <tr>
                <th scope="col" className="px-4 py-2.5 text-left font-semibold">Attribute</th>
                <th scope="col" className="px-4 py-2.5 text-left font-semibold">Record A · {pair.a.rid}</th>
                <th scope="col" className="px-4 py-2.5 text-left font-semibold">Record B · {pair.b.rid}</th>
                <th scope="col" className="px-4 py-2.5 text-center font-semibold">Match</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((r) => (
                <tr key={r.label} className={clsx(r.match === true && 'bg-emerald-50/50', r.match === false && 'bg-red-50/50')}>
                  <th scope="row" className="px-4 py-2.5 text-left text-xs font-medium text-slate-600">
                    {r.label}
                    {r.hint && <span className="block text-[11px] font-normal text-slate-500">{r.hint}</span>}
                  </th>
                  {[r.a, r.b].map((v, i) => (
                    <td key={i} className={clsx('px-4 py-2.5 text-slate-800', r.mono && 'font-mono text-xs')}>{v}</td>
                  ))}
                  <td className="px-4 py-2.5 text-center">
                    {r.match === true && <Check className="mx-auto h-4 w-4 text-emerald-700" aria-label="Match" />}
                    {r.match === false && <X className="mx-auto h-4 w-4 text-red-600" aria-label="Mismatch" />}
                    {r.match == null && <span className="text-xs text-slate-500" aria-label="Not compared">—</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title="Steward decision" subtitle="Maker step — applies only after checker approval" />
          <CardBody className="space-y-4">
            {pair.status === 'Pending checker' && (
              <Alert tone="info" title={`${pair.decision} proposed by ${pair.decidedBy}`}>
                {pair.approvalId ? `${pair.approvalId} is` : 'The request is'} awaiting a checker in the Approvals inbox. Records stay unchanged until approved.
              </Alert>
            )}
            {pair.rejectedNote && <Alert tone="warning">{pair.rejectedNote}</Alert>}
            {['Merged', 'Not same person', 'Split'].includes(pair.status) && <Alert tone="success" title={`Resolved: ${pair.status}`}>Decision approved{pair.checker ? ` by ${pair.checker}` : ''}. See lineage.</Alert>}
            <div className="flex flex-wrap gap-2" role="group" aria-label="Decision">
              {Object.entries(DECISIONS).map(([k, d]) => (
                <Button key={k} size="sm" icon={d.icon} variant={decision === k ? 'primary' : 'outline'} aria-pressed={decision === k} disabled={!canDecide} onClick={() => setDecision(k)}>{k}</Button>
              ))}
            </div>
            {decision && <p className="text-xs text-slate-600">{DECISIONS[decision].help}</p>}
            <Textarea label="Reason / evidence" required rows={3} value={reason} onChange={(e) => setReason(e.target.value)} disabled={!canDecide} placeholder="e.g. Same NRC and DOB; name differs only by honorific; MFI confirmed phone" />
            <MakerCheckerBanner maker={user?.name} checker={roleName(checkerRole)} note="Merges and splits change who a loan belongs to. A second authorised user must approve." />
            <div className="flex justify-end">
              <Button disabled={!canDecide || !decision || reason.trim().length < 10} onClick={submit}>Submit decision</Button>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader icon={History} title="Identity lineage" subtitle={`Resolved borrower ${pair.a.rid}`} />
          <CardBody>
            <Timeline items={lineageFor(pair)} />
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
