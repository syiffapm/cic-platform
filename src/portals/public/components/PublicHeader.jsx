import clsx from 'clsx';
import { useEffect, useId, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { Landmark, LogIn, Menu, Search, X } from 'lucide-react';
import BrandMark from '@/components/layout/BrandMark';
import LanguageSwitcher from '@/components/layout/LanguageSwitcher';
import AccessibilityToolbar from '@/components/layout/AccessibilityToolbar';
import { useI18n } from '@/i18n/I18nContext';

export const NAV = [
  { to: '/', key: 'home', end: true },
  { to: '/services', key: 'services' },
  { to: '/mfi-directory', key: 'directory' },
  { to: '/announcements', key: 'announcements' },
  { to: '/publications', key: 'publications' },
  { to: '/statistics', key: 'statistics' },
  { to: '/how-it-works', key: 'howItWorks', label: 'How it works' },
  { to: '/verify', key: 'verify' },
  { to: '/help', key: 'help' },
];

function SearchBox({ className, onDone }) {
  const navigate = useNavigate();
  const [q, setQ] = useState('');
  const id = useId();
  const submit = (e) => {
    e.preventDefault();
    if (!q.trim()) return;
    navigate(`/search?q=${encodeURIComponent(q.trim())}`);
    setQ('');
    onDone?.();
  };
  return (
    <form role="search" onSubmit={submit} className={clsx('relative', className)}>
      <label htmlFor={id} className="sr-only">Search this website</label>
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" aria-hidden="true" />
      <input
        id={id}
        type="search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search services, notices, FAQ…"
        className="h-10 w-full rounded-lg border border-slate-300 bg-white pl-9 pr-3 text-sm placeholder:text-slate-400 focus:border-primary-400"
      />
    </form>
  );
}

export default function PublicHeader() {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();
  useEffect(() => { setOpen(false); }, [pathname]);

  const linkCls = ({ isActive }) => clsx(
    'relative whitespace-nowrap px-3 py-4 text-[13px] font-medium transition-colors',
    isActive ? 'text-primary after:absolute after:inset-x-3 after:bottom-0 after:h-0.5 after:rounded-full after:bg-warm' : 'text-slate-600 hover:text-primary',
  );

  return (
    <>
    <header>
      {/* Government top bar */}
      <div className="bg-primary-950 text-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-2 px-4 py-1.5 text-[11px] sm:px-6 lg:px-8">
          <p className="flex min-w-0 items-center gap-1.5 text-primary-100">
            <Landmark className="h-3.5 w-3.5 text-warm" aria-hidden="true" />
            <span className="truncate font-semibold text-white">{t('common.ministry')}</span>
            <span className="hidden sm:inline" aria-hidden="true">·</span>
            <span className="hidden sm:inline">An official government website</span>
          </p>
          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            <div className="hidden sm:block"><AccessibilityToolbar light /></div>
            <LanguageSwitcher light />
            <Link to="/login" className="flex min-h-[28px] items-center gap-1 whitespace-nowrap rounded-md bg-white/10 px-2 py-1 font-semibold hover:bg-white/20">
              <LogIn className="h-3.5 w-3.5" aria-hidden="true" /> {t('common.signIn')}<span className="hidden md:inline">&nbsp;· My credit</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Brand row */}
      <div className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3 sm:px-6 lg:px-8">
          <Link to="/" aria-label="CIC Myanmar home" className="flex items-center gap-3">
            <BrandMark subtitle="Central Bank of Myanmar · CIC" />
          </Link>
          <SearchBox className="ml-auto hidden w-72 md:block" />
          <button
            type="button"
            className="ml-auto rounded-lg p-2 text-slate-700 hover:bg-slate-100 lg:hidden md:ml-2"
            aria-expanded={open}
            aria-controls="mobile-nav"
            aria-label={open ? 'Close menu' : 'Open menu'}
            onClick={() => setOpen((o) => !o)}
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {open && (
        <nav id="mobile-nav" aria-label="Main" className="border-b border-slate-200 bg-white px-4 pb-4 pt-2 shadow-sm lg:hidden">
          <SearchBox className="mb-3 md:hidden" onDone={() => setOpen(false)} />
          <ul className="grid gap-0.5">
            {NAV.map((n) => (
              <li key={n.to}>
                <NavLink
                  to={n.to}
                  end={n.end}
                  className={({ isActive }) => clsx('block rounded-lg px-3 py-2.5 text-sm font-medium', isActive ? 'bg-primary-50 text-primary' : 'text-slate-700 hover:bg-slate-50')}
                >
                  {n.label ?? t(`public.nav.${n.key}`)}
                </NavLink>
              </li>
            ))}
          </ul>
          <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3">
            <AccessibilityToolbar />
            <Link to="/login" className="inline-flex min-h-[24px] items-center text-xs font-medium text-primary">Sign in to My credit</Link>
          </div>
        </nav>
      )}
    </header>
      {/* Main navigation */}
      <nav aria-label="Main" className="sticky top-0 z-30 hidden border-b border-slate-200 bg-white/95 backdrop-blur lg:block">
        <ul className="mx-auto flex max-w-7xl items-center px-2 sm:px-4 lg:px-6">
          {NAV.map((n) => (
            <li key={n.to}><NavLink to={n.to} end={n.end} className={linkCls}>{n.label ?? t(`public.nav.${n.key}`)}</NavLink></li>
          ))}
        </ul>
      </nav>

    </>
  );
}
