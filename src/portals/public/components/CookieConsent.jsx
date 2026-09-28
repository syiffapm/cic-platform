import { Cookie } from 'lucide-react';
import { Link } from 'react-router-dom';
import { writeLocal } from '../lib/storage';

export const COOKIE_KEY = 'cic.public.cookieConsent';

/** Cookie consent banner. No analytics runs until the visitor accepts. */
export default function CookieConsent({ onClose }) {
  const choose = (value) => {
    writeLocal(COOKIE_KEY, { value, at: new Date().toISOString() });
    onClose(value);
  };
  return (
    <section
      role="region"
      aria-label="Cookie consent"
      className="fixed inset-x-0 bottom-0 z-50 border-t border-slate-200 bg-white/95 shadow-[0_-8px_24px_rgba(15,23,42,0.08)] backdrop-blur"
    >
      <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-4 sm:px-6 md:flex-row md:items-center lg:px-8">
        <Cookie className="hidden h-6 w-6 shrink-0 text-warm md:block" aria-hidden="true" />
        <p className="flex-1 text-xs text-slate-600 sm:text-sm">
          We use essential storage to remember your language and text size. With your permission we also count anonymous page views to improve this website — no advertising trackers, ever.{' '}
          <Link to="/cookies" className="font-medium text-primary underline">Cookie policy</Link>
        </p>
        <div className="flex shrink-0 gap-2">
          <button type="button" onClick={() => choose('essential')} className="h-10 flex-1 rounded-lg border border-slate-300 bg-white px-4 text-sm font-medium text-slate-700 hover:bg-slate-50 md:flex-none">Essential only</button>
          <button type="button" onClick={() => choose('all')} className="h-10 flex-1 rounded-lg bg-primary px-4 text-sm font-semibold text-white hover:bg-primary-700 md:flex-none">Accept all</button>
        </div>
      </div>
    </section>
  );
}
