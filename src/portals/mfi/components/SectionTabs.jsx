import clsx from 'clsx';
import { Navigate, NavLink, Outlet } from 'react-router-dom';
import { useAccess } from './access';

/**
 * Tab strip for a sidebar item that groups several pages (e.g. Credit & lending, Submissions).
 * Only tabs whose feature the role can read are shown; each tab is a real link with its own URL.
 */
export function SectionTabs({ tabs, label }) {
  const { can } = useAccess();
  const visible = tabs.filter((t) => can(t.feature, 'read'));
  if (visible.length < 2) return null;
  return (
    <nav aria-label={label} className="-mt-1 mb-5 overflow-x-auto border-b border-slate-200 scrollbar-thin">
      <ul className="flex min-w-max gap-1">
        {visible.map((t) => (
          <li key={t.to}>
            <NavLink
              to={t.to}
              end={t.end}
              className={({ isActive }) => clsx(
                'inline-flex items-center gap-1.5 border-b-2 px-3 py-2.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-warm',
                isActive ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700',
              )}
            >
              {t.label}
              {t.badge ? <span className="rounded-full bg-warm px-1.5 text-[11px] font-bold text-slate-900">{t.badge}</span> : null}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}

/** Layout route: tab strip above the active tab's page. */
export function SectionLayout({ tabs, label }) {
  return (
    <div>
      <SectionTabs tabs={tabs} label={label} />
      <Outlet />
    </div>
  );
}

/** Index route of a section: goes to the first tab the role can read. */
export function FirstTab({ tabs }) {
  const { can } = useAccess();
  const first = tabs.find((t) => can(t.feature, 'read'));
  return <Navigate to={first?.to ?? '/mfi'} replace />;
}
