import clsx from 'clsx';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Bell, ChevronDown, ChevronRight, Globe, LogOut, Menu, Search, ShieldCheck, X } from 'lucide-react';
import { useAuth, useSession } from '@/context/AuthContext';
import { useI18n } from '@/i18n/I18nContext';
import LanguageSwitcher from './LanguageSwitcher';
import { loginPathFor, STAFF_HOME } from '@/config/access';
import BrandMark from './BrandMark';

/**
 * Shared shell for Portals 2–5.
 * navGroups: [{ label, items: [{ to, label, icon, roles?: string[], badge? }] }]
 * Items with `roles` are hidden for other roles (UI only — server enforces SEC-02).
 */
export default function PortalLayout({ portal, title, navGroups, tenantLabel, notifications = [], headerExtra }) {
  const user = useSession(portal);
  const { signOut } = useAuth();
  const { t } = useI18n();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [bellOpen, setBellOpen] = useState(false);

  const { pathname } = useLocation();
  const [query, setQuery] = useState('');
  const searchRef = useRef(null);
  const storeKey = `cic.nav.collapsed.${portal}`;
  const [collapsed, setCollapsed] = useState(() => { try { return JSON.parse(localStorage.getItem(storeKey)) ?? {}; } catch { return {}; } });
  useEffect(() => { try { localStorage.setItem(storeKey, JSON.stringify(collapsed)); } catch { /* storage unavailable */ } }, [collapsed, storeKey]);

  const allGroups = navGroups
    .map((g) => ({ ...g, items: g.items.filter((i) => !i.roles || i.roles.includes(user?.role)) }))
    .filter((g) => g.items.length);
  const totalItems = allGroups.reduce((n, g) => n + g.items.length, 0);
  const searchable = totalItems > 10;
  const visibleGroups = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return allGroups;
    return allGroups.map((g) => ({ ...g, items: g.items.filter((i) => String(i.label).toLowerCase().includes(q) || g.label.toLowerCase().includes(q)) })).filter((g) => g.items.length);
  }, [allGroups, query]);

  // "/" focuses the menu search (like Ctrl+K in admin consoles), unless typing in a field.
  useEffect(() => {
    if (!searchable) return undefined;
    const onKey = (e) => {
      if ((e.key === '/' || ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k')) && !['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName)) {
        e.preventDefault(); setMobileOpen(true); setTimeout(() => searchRef.current?.focus(), 50);
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [searchable]);

  const handleSignOut = () => {
    signOut(portal);
    navigate(loginPathFor(portal));
  };

  const sidebar = (
    <nav aria-label={`${title} navigation`} className="flex h-full flex-col bg-primary text-white">
      <div className="flex items-center justify-between px-5 py-5">
        <BrandMark light subtitle={title} />
        <button type="button" className="rounded p-1 text-white/70 lg:hidden" onClick={() => setMobileOpen(false)} aria-label="Close menu"><X className="h-5 w-5" /></button>
      </div>
      {tenantLabel && (
        <div className="mx-4 mb-3 rounded-lg bg-white/10 px-3 py-2 text-[11px]">
          <p className="text-primary-200">Institution</p>
          <p className="truncate font-semibold">{tenantLabel}</p>
        </div>
      )}
      {searchable && (
        <div className="px-4 pb-3">
          <label className="relative block">
            <span className="sr-only">Search the menu</span>
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-primary-200" aria-hidden="true" />
            <input ref={searchRef} value={query} onChange={(e) => setQuery(e.target.value)} onKeyDown={(e) => { if (e.key === 'Escape') setQuery(''); }} placeholder="Search menu  ( / )" className="h-9 w-full rounded-lg border border-white/10 bg-white/10 pl-8 pr-3 text-xs text-white placeholder:text-primary-200 focus:bg-white/15" />
          </label>
        </div>
      )}
      <div className="flex-1 space-y-4 overflow-y-auto px-3 pb-6 scrollbar-thin">
        {visibleGroups.length === 0 && <p className="px-3 text-xs text-primary-200">No menu item matches “{query}”.</p>}
        {visibleGroups.map((g) => {
          const hasActive = g.items.some((i) => pathname === i.to || pathname.startsWith(`${i.to}/`));
          const isOpen = query ? true : hasActive || !collapsed[g.label];
          return (
          <div key={g.label}>
            <button type="button" onClick={() => setCollapsed((c) => ({ ...c, [g.label]: isOpen }))} aria-expanded={isOpen} className="flex min-h-[24px] w-full items-center justify-between rounded px-3 pb-1.5 text-left text-[11px] font-semibold uppercase tracking-wider text-primary-200 hover:text-white">
              {g.label}
              <ChevronRight className={clsx('h-3.5 w-3.5 transition-transform', isOpen && 'rotate-90')} aria-hidden="true" />
            </button>
            {isOpen && (
            <ul className="space-y-0.5">
              {g.items.map((item) => (
                <li key={item.to}>
                  <NavLink
                    to={item.to}
                    end={item.end}
                    onClick={() => setMobileOpen(false)}
                    className={({ isActive }) => clsx(
                      'flex items-center gap-3 rounded-lg px-3 py-2 text-[13px] font-medium transition-colors',
                      isActive ? 'bg-white text-primary shadow-sm' : 'text-primary-100 hover:bg-white/10 hover:text-white',
                    )}
                  >
                    {item.icon && <item.icon className="h-4 w-4 shrink-0" aria-hidden="true" />}
                    <span className="flex-1 truncate">{item.label}</span>
                    {item.badge ? <span className="rounded-full bg-warm px-1.5 text-[11px] font-bold text-slate-900">{item.badge}</span> : null}
                  </NavLink>
                </li>
              ))}
            </ul>
            )}
          </div>
          );
        })}
      </div>
      <div className="border-t border-white/10 px-5 py-3 text-[11px] text-primary-300">
        {portal === 'borrower'
          ? <Link to="/" className="flex items-center gap-1.5 hover:text-white"><Globe className="h-3 w-3" /> CIC public website</Link>
          : <Link to={STAFF_HOME} className="flex items-center gap-1.5 hover:text-white"><Globe className="h-3 w-3" /> Staff workspace</Link>}
      </div>
    </nav>
  );

  return (
    <div className="min-h-screen bg-slate-50">
      <a href="#main" className="skip-link">{t('common.skipToContent')}</a>
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 lg:block">{sidebar}</aside>
      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-slate-900/50" onClick={() => setMobileOpen(false)} aria-hidden="true" />
          <aside className="absolute inset-y-0 left-0 w-72">{sidebar}</aside>
        </div>
      )}
      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-slate-200 bg-white/90 px-4 backdrop-blur sm:px-6">
          <button type="button" className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden" onClick={() => setMobileOpen(true)} aria-label="Open menu"><Menu className="h-5 w-5" /></button>
          <div className="hidden items-center gap-2 text-xs text-slate-500 md:flex">
            <ShieldCheck className="h-4 w-4 text-teal-700" aria-hidden="true" />
            <span>Secure session · MFA verified · <span className="font-mono">{user?.sessionId}</span> · IP {user?.ip}</span>
          </div>
          <div className="ml-auto flex items-center gap-2">
            {headerExtra}
            <LanguageSwitcher />
            <div className="relative">
              <button type="button" onClick={() => setBellOpen((o) => !o)} className="relative rounded-lg p-2 text-slate-500 hover:bg-slate-100" aria-label={`Notifications (${notifications.length})`}>
                <Bell className="h-5 w-5" />
                {notifications.length > 0 && <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-red-500" />}
              </button>
              {bellOpen && (
                <div className="absolute right-0 mt-2 w-80 rounded-xl border border-slate-200 bg-white p-2 shadow-xl">
                  <p className="px-2 py-1.5 text-xs font-semibold text-slate-700">Notifications</p>
                  {notifications.length === 0 && <p className="px-2 py-4 text-center text-xs text-slate-500">You are all caught up.</p>}
                  {notifications.map((n, i) => (
                    <div key={i} className="rounded-lg px-2 py-2 hover:bg-slate-50">
                      <p className="text-xs font-medium text-slate-800">{n.title}</p>
                      <p className="text-[11px] text-slate-500">{n.time}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="relative">
              <button type="button" onClick={() => setMenuOpen((o) => !o)} className="flex items-center gap-2 rounded-lg py-1 pl-1 pr-2 hover:bg-slate-100" aria-haspopup="menu" aria-expanded={menuOpen}>
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-bold text-white">
                  {user?.name?.split(' ').slice(-2).map((p) => p[0]).join('')}
                </span>
                <span className="hidden text-left sm:block">
                  <span className="block text-xs font-semibold text-slate-800">{user?.name}</span>
                  <span className="block text-[11px] text-slate-500">{user?.roleName}</span>
                </span>
                <ChevronDown className="h-4 w-4 text-slate-500" />
              </button>
              {menuOpen && (
                <div role="menu" className="absolute right-0 mt-2 w-60 rounded-xl border border-slate-200 bg-white p-2 shadow-xl">
                  <div className="border-b border-slate-100 px-2 pb-2">
                    <p className="text-xs font-semibold text-slate-800">{user?.name}</p>
                    <p className="text-[11px] text-slate-500">{user?.email}</p>
                    <p className="mt-1 text-[11px] text-slate-500">Idle timeout 10 min · absolute 8 h</p>
                  </div>
                  <button type="button" role="menuitem" onClick={handleSignOut} className="mt-1 flex w-full items-center gap-2 rounded-lg px-2 py-2 text-xs font-medium text-red-600 hover:bg-red-50">
                    <LogOut className="h-4 w-4" /> {t('common.signOut')}
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>
        <main id="main" className="mx-auto max-w-[1400px] px-4 py-6 sm:px-6 lg:px-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
