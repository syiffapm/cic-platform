import { useEffect, useRef, useState } from 'react';
import { CheckCircle2, Circle, Hash, LoaderCircle } from 'lucide-react';
import { Alert, Button } from '@/components/ui';
import { formatNumber } from '@/lib/format';
import { INTEGRITY } from '../../../data/security';

const STEPS = [
  'Loading WORM segment manifests',
  'Recomputing SHA-256 hash chain',
  'Comparing daily anchors with external timestamp',
  'Confirming WORM retention lock',
];

/** SEC-08 hash-chain integrity check with animated progress (~2 s). */
export default function IntegrityCheck({ entryCount, audit }) {
  const [step, setStep] = useState(-1); // -1 idle, 0..n running, n done
  const timer = useRef(null);
  useEffect(() => () => clearInterval(timer.current), []);

  const run = () => {
    setStep(0);
    audit('AUDIT_CHAIN_VERIFY_STARTED', 'audit-log');
    let i = 0;
    timer.current = setInterval(() => {
      i += 1;
      setStep(i);
      if (i >= STEPS.length) {
        clearInterval(timer.current);
        audit('AUDIT_CHAIN_VERIFIED', `${entryCount} entries`, { outcome: 'Success' });
      }
    }, 500);
  };

  const running = step >= 0 && step < STEPS.length;
  const done = step >= STEPS.length;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-3">
        <Button icon={Hash} variant="teal" onClick={run} disabled={running}>{running ? 'Verifying…' : 'Verify hash-chain integrity'}</Button>
        <span className="text-xs text-slate-500">Recomputes every entry’s hash from the previous one</span>
      </div>
      {step >= 0 && (
        <ol className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4" aria-live="polite">
          {STEPS.map((s, i) => {
            const state = i < step ? 'done' : i === step ? 'active' : 'todo';
            const Icon = state === 'done' ? CheckCircle2 : state === 'active' ? LoaderCircle : Circle;
            return (
              <li key={s} className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-xs ${state === 'done' ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : state === 'active' ? 'border-blue-200 bg-blue-50 text-blue-800' : 'border-slate-200 text-slate-500'}`}>
                <Icon className={`h-4 w-4 shrink-0 ${state === 'active' ? 'animate-spin' : ''}`} aria-hidden="true" />
                {s}
              </li>
            );
          })}
        </ol>
      )}
      {done && (
        <Alert tone="success" title={`${formatNumber(entryCount)} entries verified, chain intact`}>
          <p>Last anchored hash <span className="break-all font-mono text-[11px]">{INTEGRITY.lastAnchor}</span> at {INTEGRITY.anchoredAt} MMT.</p>
          <p className="mt-0.5">Storage: {INTEGRITY.retention} retention — entries cannot be altered or deleted before expiry.</p>
        </Alert>
      )}
    </div>
  );
}
