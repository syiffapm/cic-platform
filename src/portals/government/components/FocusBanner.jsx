import { useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Crosshair } from 'lucide-react';

/**
 * `?focus=<id>` opened from a work queue. Returns [id, clear].
 *   const [focus, clearFocus] = useFocusParam();
 */
export function useFocusParam(name = 'focus') {
  const [params, setParams] = useSearchParams();
  const value = params.get(name);
  const clear = useCallback(() => {
    const next = new URLSearchParams(params);
    next.delete(name);
    setParams(next, { replace: true });
  }, [params, setParams, name]);
  return [value, clear];
}

/** Initial value of a query parameter when it is one of `allowed` (e.g. a tab id). */
export function useInitialParam(name, allowed, fallback) {
  const [params] = useSearchParams();
  const v = params.get(name);
  return allowed.includes(v) ? v : fallback;
}

/** Strip above a list narrowed to one record opened from "My work". */
export default function FocusBanner({ id, onClear, className = 'mb-4' }) {
  if (!id) return null;
  return (
    <div role="status" className={`flex flex-wrap items-center justify-between gap-2 rounded-lg border border-primary-200 bg-primary-50 px-4 py-2 text-sm text-primary-900 ${className}`}>
      <span className="flex items-center gap-2"><Crosshair className="h-4 w-4 shrink-0" aria-hidden="true" /> Showing <b className="font-mono">{id}</b> from your work queue.</span>
      <button type="button" onClick={onClear} className="rounded-md px-2 py-1 text-xs font-semibold text-primary-900 underline hover:bg-white">Show all</button>
    </div>
  );
}
