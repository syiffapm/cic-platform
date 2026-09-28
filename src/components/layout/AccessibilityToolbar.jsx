import clsx from 'clsx';
import { Contrast } from 'lucide-react';
import { useAccessibility } from '@/context/AccessibilityContext';

export default function AccessibilityToolbar({ light = false }) {
  const a11y = useAccessibility();
  const btn = clsx('rounded px-1.5 py-0.5 text-xs font-semibold', light ? 'text-white/80 hover:bg-white/10 hover:text-white' : 'text-slate-600 hover:bg-slate-100');
  return (
    <div className="flex items-center gap-1" role="group" aria-label="Accessibility options">
      <button type="button" className={btn} onClick={a11y.decrease} aria-label="Decrease text size">A−</button>
      <button type="button" className={btn} onClick={a11y.reset} aria-label="Reset text size">A</button>
      <button type="button" className={btn} onClick={a11y.increase} aria-label="Increase text size">A+</button>
      <button type="button" className={clsx(btn, a11y.contrast && 'ring-1 ring-current')} onClick={a11y.toggleContrast} aria-pressed={a11y.contrast} aria-label="Toggle high contrast">
        <Contrast className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
