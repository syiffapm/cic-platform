import clsx from 'clsx';
import { Link } from 'react-router-dom';
import { ArrowRight, Gauge, Info, Lightbulb, SearchX } from 'lucide-react';
import { Card, CardBody } from '@/components/ui';
import { GRADE_BANDS, GRADE_TONES, REASON_TIPS } from '@/lib/creditScore';
import { formatDate } from '@/lib/format';
import { Explain } from './Common';
import { IssuedLine, ValidityCountdown } from './ReportRequestCards';

const IMPROVE = [
  'Pay every instalment on or before the due date — this matters most.',
  'If you are late, bring the loan up to date quickly: arrears over 30 days weigh most.',
  'Avoid holding 3 or more loans at the same time.',
  'Apply only where you really intend to borrow; many checks in 6 months lower your grade.',
  'Check your report and dispute anything wrong — disputed lines are not scored while open.',
];

/** Horizontal A–E scale with the borrower's band highlighted. */
function GradeScale({ grade }) {
  const bands = [...GRADE_BANDS].reverse();
  return (
    <ol className="mt-4 grid grid-cols-5 gap-1" aria-label="Grade scale from E (high risk) to A (very low risk)">
      {bands.map((b) => (
        <li key={b.grade} className="text-center">
          <span className={clsx('block h-2 rounded-full', GRADE_TONES[b.grade], b.grade === grade ? 'ring-2 ring-offset-2 ring-primary' : 'opacity-40')} />
          <span className={clsx('mt-1 block text-[11px]', b.grade === grade ? 'font-bold text-slate-900' : 'text-slate-500')}>{b.grade}<span className="sr-only">{b.grade === grade ? ' (your grade)' : ''}</span></span>
          <span className="block text-[11px] text-slate-500">{b.min}+</span>
        </li>
      ))}
    </ol>
  );
}

/**
 * "My CIC credit score": grade A–E, score out of 100, key factors with tips. Built by the same rules
 * the lenders see, so the citizen and the MFI always see the same grade. No-hit shows no score at all.
 */
export default function ScoreCard({ report, dataAsOf, showLink = true }) {
  const issued = report.reportId ? report : null;
  if (report.noHit) {
    return (
      <Card className="border-slate-300">
        <CardBody className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-slate-100"><SearchX className="h-9 w-9 text-slate-500" aria-hidden="true" /></div>
          <div className="flex-1">
            <p className="text-xs font-semibold uppercase tracking-wider text-teal-700">My CIC credit score</p>
            <h2 className="mt-0.5 text-lg font-bold text-slate-900">No credit history yet</h2>
            {issued && <><IssuedLine result={issued} className="mt-1 text-[11px] text-slate-500" /><ValidityCountdown validUntil={issued.validUntil} className="mt-2" /></>}
            <p className="mt-1 text-sm text-slate-600">No licensed lender has reported a loan in your name, so there is nothing to score. Your history starts with your first loan from a licensed MFI — after its first monthly report you get a grade.</p>
          </div>
          {showLink && <Link to="/borrower/loans/apply" className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline">Apply for a loan <ArrowRight className="h-4 w-4" aria-hidden="true" /></Link>}
        </CardBody>
      </Card>
    );
  }

  const factors = report.reasons;
  return (
    <Card className="overflow-hidden">
      <div className="grid lg:grid-cols-[300px_1fr]">
        <div className="bg-primary p-6 text-white">
          <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-amber-300"><Gauge className="h-4 w-4" aria-hidden="true" /> My CIC credit score</p>
          <div className="mt-4 flex items-end gap-4">
            <span className={clsx('flex h-20 w-20 items-center justify-center rounded-2xl text-5xl font-bold text-white shadow-lg', GRADE_TONES[report.grade])} aria-label={`Grade ${report.grade}`}>{report.grade}</span>
            <div>
              <p className="text-3xl font-bold leading-none">{report.score}<span className="text-base font-medium text-primary-200"> / 100</span></p>
              <p className="mt-1 text-sm text-primary-100">{report.gradeLabel}</p>
            </div>
          </div>
          <div className="rounded-lg bg-white p-2 pb-1"><GradeScale grade={report.grade} /></div>
          {issued && <ValidityCountdown validUntil={issued.validUntil} light className="mt-4" />}
          {issued && <p className="mt-2 text-[11px] text-primary-100">Report <span className="font-mono font-semibold text-white">{issued.reportId}</span> · issued {formatDate(issued.generatedAt)}</p>}
          <p className="mt-2 text-[11px] text-primary-100">Based on information your lenders sent up to {formatDate(issued?.dataAsOf ?? dataAsOf)}. Lenders who check your report with your consent see this same grade.</p>
        </div>
        <CardBody className="space-y-4">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">What is affecting my score</h3>
            <ul className="mt-2 space-y-2">
              {factors.map((r) => (
                <li key={r.code} className="rounded-lg border border-slate-200 p-3">
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-sm font-medium text-slate-800">{r.text}</p>
                    <span className={clsx('shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold', r.points > 0 ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-700')}>
                      {r.points > 0 ? `−${r.points} points` : 'No effect'}
                    </span>
                  </div>
                  {REASON_TIPS[r.code] && <p className="mt-1 flex items-start gap-1.5 text-xs text-slate-600"><Lightbulb className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-700" aria-hidden="true" />{REASON_TIPS[r.code]}</p>}
                </li>
              ))}
            </ul>
          </div>
          <details className="rounded-lg bg-teal-50 p-3 text-sm">
            <summary className="cursor-pointer font-semibold text-teal-900">What improves my score?</summary>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-xs text-slate-700">{IMPROVE.map((t) => <li key={t}>{t}</li>)}</ul>
          </details>
          <Explain label="How is the score calculated?">
            Everyone starts at 100 points. Points are taken off for arrears, recent late payments, many active loans, high total debt and many recent credit checks.
            The grade band follows the points: A 85+, B 70+, C 55+, D 40+, E below 40. Records under dispute are shown but never scored.
          </Explain>
          {showLink && (
            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3">
              <p className="flex items-center gap-1.5 text-xs text-slate-500"><Info className="h-3.5 w-3.5" aria-hidden="true" /> This grade is fixed for this report. Request an updated report after it expires.</p>
              <Link to="/borrower/report" className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline">See my full report <ArrowRight className="h-4 w-4" aria-hidden="true" /></Link>
            </div>
          )}
        </CardBody>
      </div>
    </Card>
  );
}
