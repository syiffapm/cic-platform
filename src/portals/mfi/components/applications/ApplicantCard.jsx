import clsx from 'clsx';
import { UserRound } from 'lucide-react';
import { Card, CardBody, CardHeader } from '@/components/ui';
import { formatMMK, maskPhone } from '@/lib/format';
import { DEFAULT_RATE, affordability } from './appUtils';

function Pair({ label, value, mono }) {
  return (
    <div>
      <dt className="text-[11px] text-slate-500">{label}</dt>
      <dd className={clsx('text-sm font-medium text-slate-800', mono && 'font-mono text-xs')}>{value || '—'}</dd>
    </div>
  );
}

const BAND = {
  ok: ['bg-emerald-500', 'text-emerald-700', 'Within policy (instalment ≤ 30% of income)'],
  watch: ['bg-amber-500', 'text-amber-700', 'Stretched (30–45% of income) — verify other income or reduce amount'],
  high: ['bg-red-500', 'text-red-700', 'Above policy (> 45% of income) — consider a smaller amount or longer tenor'],
  unknown: ['bg-slate-300', 'text-slate-600', 'Income not stated'],
};

/** Applicant identity, requested terms and a first affordability check against stated income. */
export default function ApplicantCard({ app }) {
  const a = app.applicant;
  const rate = app.decision?.rate ?? DEFAULT_RATE;
  const aff = affordability(app.amount, rate, app.tenor, a.monthlyIncome);
  const [bar, text, label] = BAND[aff.band];
  return (
    <Card>
      <CardHeader title="Applicant and requested terms" subtitle={`CIC borrower ID ${app.borrowerId}`} icon={UserRound} />
      <CardBody className="space-y-5">
        <dl className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <Pair label="Name" value={a.name} />
          <Pair label="NRC" value={a.nrc} mono />
          <Pair label="Mobile" value={maskPhone(a.phone)} mono />
          <Pair label="Township" value={a.township} />
          <Pair label="Occupation" value={a.occupation} />
          <Pair label="Stated monthly income" value={formatMMK(a.monthlyIncome)} />
        </dl>
        <div className="rounded-lg border border-slate-200 bg-slate-50/60 p-4">
          <dl className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <Pair label="Product" value={app.product} />
            <Pair label="Amount requested" value={formatMMK(app.amount)} />
            <Pair label="Tenor" value={`${app.tenor} months`} />
            <Pair label="Channel" value={app.channel} />
          </dl>
          <p className="mt-3 text-xs text-slate-600"><span className="font-medium text-slate-700">Purpose of loan:</span> {app.purpose}</p>
        </div>
        <div>
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h3 className="text-sm font-semibold text-slate-800">Affordability</h3>
            <span className="text-[11px] text-slate-500">Estimated at {rate}% p.a., monthly repayments, declining balance</span>
          </div>
          <dl className="mt-2 grid gap-3 sm:grid-cols-3">
            <Pair label="Estimated instalment" value={`${formatMMK(aff.instalment)} / month`} />
            <Pair label="Stated income" value={`${formatMMK(a.monthlyIncome)} / month`} />
            <Pair label="Instalment-to-income" value={aff.ratio == null ? '—' : `${aff.ratio.toFixed(1)}%`} />
          </dl>
          <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-slate-100" role="meter" aria-valuenow={Math.round(aff.ratio ?? 0)} aria-valuemin={0} aria-valuemax={100} aria-label="Instalment as a share of income">
            <div className={clsx('h-full rounded-full', bar)} style={{ width: `${Math.min(100, aff.ratio ?? 0)}%` }} />
          </div>
          <p className={clsx('mt-1.5 text-xs font-medium', text)}>{label}</p>
          <p className="mt-1 text-[11px] text-slate-500">Existing instalments to other lenders are shown in the credit report once the credit check has been run.</p>
        </div>
      </CardBody>
    </Card>
  );
}
