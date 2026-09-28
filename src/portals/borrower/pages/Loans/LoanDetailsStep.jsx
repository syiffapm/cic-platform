import { Calculator } from 'lucide-react';
import { Alert, Button, Input, Select, Textarea } from '@/components/ui';
import { formatMMK } from '@/lib/format';
import { estimateInstalment } from '../../lib/myFile';
import { StickyActions } from '../../components/Common';

export const TENORS = [6, 9, 12, 18, 24];
export const TYPICAL_RATE = 28; // % a year, flat — the Central Bank ceiling most MFIs quote
export const MIN_AMOUNT = 100_000;
export const MAX_AMOUNT = 10_000_000;

export function detailsValid(f) {
  const amount = Number(f.amount);
  return f.product && amount >= MIN_AMOUNT && amount <= MAX_AMOUNT && TENORS.includes(Number(f.tenor))
    && f.purpose.trim().length >= 10 && Number(f.monthlyIncome) > 0 && f.occupation.trim();
}

/** Affordability: new instalment + existing instalments vs monthly income. */
export function affordability(form, activeLoans) {
  const newInstalment = estimateInstalment(Number(form.amount) || 0, TYPICAL_RATE, Number(form.tenor) || 12);
  const existing = activeLoans.reduce((s, l) => s + (l.instalment ? l.instalment * (l.frequency === 'Fortnightly' ? 2 : 1) : 0), 0);
  const income = Number(form.monthlyIncome) || 0;
  const ratio = income ? (newInstalment + existing) / income : 0;
  return { newInstalment, existing, income, ratio };
}

/** Step 2 — product, amount, tenor, purpose and the applicant's income, with affordability hints. */
export default function LoanDetailsStep({ mfi, form, setForm, activeLoans, onBack, onNext }) {
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const aff = affordability(form, activeLoans);
  const amount = Number(form.amount) || 0;
  const amountError = form.amount && (amount < MIN_AMOUNT || amount > MAX_AMOUNT) ? `Enter between ${formatMMK(MIN_AMOUNT)} and ${formatMMK(MAX_AMOUNT)}.` : undefined;

  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <Select label="Loan product" required value={form.product} onChange={set('product')} placeholder="Choose a product" options={mfi.products.map((p) => ({ value: p, label: p }))} hint={`Products offered by ${mfi.short}.`} />
        <Select label="Repayment period" required value={String(form.tenor)} onChange={set('tenor')} options={TENORS.map((t) => ({ value: String(t), label: `${t} months` }))} />
        <Input label="Amount you need (MMK)" required inputMode="numeric" value={form.amount} onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value.replace(/\D/g, '') }))} placeholder="1000000" error={amountError} hint={amount ? formatMMK(amount) : 'Between 100,000 and 10,000,000 MMK.'} />
        <Input label="Your monthly household income (MMK)" required inputMode="numeric" value={form.monthlyIncome} onChange={(e) => setForm((f) => ({ ...f, monthlyIncome: e.target.value.replace(/\D/g, '') }))} placeholder="600000" hint="All regular income of your household, before loan repayments." />
        <Input label="Occupation" required value={form.occupation} onChange={set('occupation')} placeholder="e.g. Grocery shop owner" />
        <Input label="Township" value={form.township} onChange={set('township')} hint="Where you live or run your business." />
      </div>
      <Textarea label="What will you use the loan for?" required rows={3} value={form.purpose} onChange={set('purpose')} placeholder="e.g. Buy stock for my grocery shop before Thadingyut" hint={`${form.purpose.trim().length} characters · at least 10.`} />

      {amount >= MIN_AMOUNT && Number(form.monthlyIncome) > 0 && (
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4" aria-live="polite">
          <p className="flex items-center gap-2 text-sm font-semibold text-slate-800"><Calculator className="h-4 w-4 text-primary" aria-hidden="true" /> Can I afford it?</p>
          <dl className="mt-3 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
            <div><dt className="text-[11px] text-slate-500">New instalment (estimate)</dt><dd className="font-semibold">{formatMMK(aff.newInstalment)} / month</dd></div>
            <div><dt className="text-[11px] text-slate-500">Your current instalments</dt><dd className="font-semibold">{formatMMK(aff.existing)} / month</dd></div>
            <div><dt className="text-[11px] text-slate-500">Monthly income</dt><dd className="font-semibold">{formatMMK(aff.income)}</dd></div>
            <div><dt className="text-[11px] text-slate-500">Share of income on loans</dt><dd className={aff.ratio > 0.4 ? 'font-bold text-red-700' : 'font-bold text-emerald-700'}>{Math.round(aff.ratio * 100)}%</dd></div>
          </dl>
          <p className="mt-2 text-[11px] text-slate-500">Estimate at {TYPICAL_RATE}% a year flat over {form.tenor} months. The lender confirms the exact rate and schedule in your loan agreement.</p>
          {aff.ratio > 0.4 && (
            <Alert tone="warning" className="mt-3" title="This loan may be hard to repay">
              All your loan repayments together would take more than 40% of your income. Consider a smaller amount or a longer period — lenders often decline applications above this level.
            </Alert>
          )}
        </div>
      )}

      {activeLoans.length >= 3 && (
        <Alert tone="danger" title={`You already have ${activeLoans.length} active loans`}>
          Borrowing from many lenders at once is the most common cause of over-indebtedness. It also lowers your CIC grade. Think about closing a loan before taking a new one.
        </Alert>
      )}

      <StickyActions row className="sm:justify-between">
        <Button variant="outline" onClick={onBack}>Back</Button>
        <Button onClick={onNext} disabled={!detailsValid(form)}>Continue to consent</Button>
      </StickyActions>
    </div>
  );
}
