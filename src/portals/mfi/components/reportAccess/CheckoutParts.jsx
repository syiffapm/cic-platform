import clsx from 'clsx';
import { Link } from 'react-router-dom';
import { Building2, CheckCircle2, Landmark, Receipt, Smartphone, Wallet } from 'lucide-react';
import { Card, CardBody, CardHeader } from '@/components/ui';
import { PAYMENT_METHODS } from '../../data/billingPlans';

const ICONS = { wallet: Wallet, invoice: Building2, kbzpay: Smartphone, wave: Smartphone, bank: Landmark };

/** Order summary: rows of [label, value] plus the total in USD. */
export function OrderSummary({ title, lines, total, children }) {
  return (
    <Card>
      <CardHeader title="Order summary" subtitle={title} icon={Receipt} />
      <CardBody className="space-y-4">
        <dl className="space-y-2 text-sm">
          {lines.map(([k, v]) => (
            <div key={k} className="flex items-start justify-between gap-4">
              <dt className="text-slate-500">{k}</dt>
              <dd className="text-right font-medium text-slate-800">{v}</dd>
            </div>
          ))}
        </dl>
        {children}
        <div className="flex items-baseline justify-between border-t border-slate-200 pt-3">
          <span className="text-sm font-semibold text-slate-700">Total</span>
          <span className="text-2xl font-bold text-primary">USD {total.toFixed(2)}</span>
        </div>
        <p className="text-[11px] text-slate-500">Report fees are charged in US dollars to the institution. A receipt is issued immediately and appears under Usage &amp; billing.</p>
      </CardBody>
    </Card>
  );
}

/** Payment method radio cards. `allowed` limits the list; the wallet shows its balance and a top-up link. */
export function MethodPicker({ value, onChange, allowed, balance, total, topUpTo }) {
  const methods = PAYMENT_METHODS.filter((m) => allowed.includes(m.id));
  return (
    <fieldset className="space-y-2">
      <legend className="mb-1 text-sm font-semibold text-slate-800">Payment method</legend>
      {methods.map((m) => {
        const Icon = ICONS[m.id];
        const short = m.id === 'wallet' && balance < total;
        return (
          <label key={m.id} className={clsx('flex cursor-pointer items-start gap-3 rounded-lg border p-3', value === m.id ? 'border-primary bg-primary-50 ring-1 ring-primary' : 'border-slate-200 hover:border-slate-300', short && 'cursor-not-allowed opacity-70')}>
            <input type="radio" name="method" value={m.id} checked={value === m.id} disabled={short} onChange={() => onChange(m.id)} className="mt-1 accent-[hsl(214,45%,22%)]" />
            <Icon className="mt-0.5 h-4 w-4 shrink-0 text-slate-500" aria-hidden="true" />
            <span className="flex-1">
              <span className="flex flex-wrap items-center justify-between gap-2 text-sm font-medium text-slate-800">
                {m.label}
                {m.id === 'wallet' && <span className={clsx('text-xs', short ? 'text-red-600' : 'text-emerald-700')}>Balance USD {balance.toFixed(2)}</span>}
              </span>
              <span className={clsx('block text-[11px]', value === m.id ? 'text-slate-700' : 'text-slate-500')}>{m.hint}</span>
              {short && (
                <span className="mt-1 block text-[11px] font-medium text-red-600">
                  Insufficient balance.{' '}
                  {topUpTo ? <Link to={topUpTo} className="underline">Top up the wallet</Link> : 'Ask your MFI Administrator to top up, or choose another method.'}
                </span>
              )}
            </span>
          </label>
        );
      })}
    </fieldset>
  );
}

/** Payment receipt shown after a successful checkout. */
export function PaymentReceipt({ receipt, children }) {
  return (
    <Card>
      <CardBody className="flex flex-col items-center py-8 text-center">
        <div className="rounded-full bg-emerald-50 p-3 text-emerald-600"><CheckCircle2 className="h-8 w-8" aria-hidden="true" /></div>
        <h2 className="mt-3 text-lg font-semibold text-slate-900">{receipt.title}</h2>
        <p className="mt-1 max-w-lg text-sm text-slate-600">{receipt.message}</p>
        <dl className="mt-5 grid w-full max-w-md grid-cols-2 gap-x-6 gap-y-2 rounded-lg border border-slate-200 bg-slate-50 p-4 text-left text-xs">
          {receipt.rows.map(([k, v]) => <div key={k} className="contents"><dt className="text-slate-500">{k}</dt><dd className="font-medium text-slate-800">{v}</dd></div>)}
        </dl>
        <div className="mt-6 flex flex-wrap justify-center gap-2">{children}</div>
      </CardBody>
    </Card>
  );
}
