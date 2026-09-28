import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { useI18n } from '@/i18n/I18nContext';
import PublicHeader from './PublicHeader';
import PublicFooter from './PublicFooter';
import CookieConsent, { COOKIE_KEY } from './CookieConsent';
import AssistantWidget from './AssistantWidget';
import { readLocal } from '../lib/storage';

/** Shell for Portal 1: government header, main nav, footer, cookie banner and AI assistant. */
export default function PublicLayout() {
  const { t } = useI18n();
  const [showCookies, setShowCookies] = useState(() => !readLocal(COOKIE_KEY));
  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <a href="#main" className="skip-link">{t('common.skipToContent')}</a>
      <PublicHeader />
      <main id="main" tabIndex={-1} className="flex-1 focus:outline-none">
        <Outlet />
      </main>
      <PublicFooter onCookieSettings={() => setShowCookies(true)} />
      <AssistantWidget raised={showCookies} />
      {showCookies && <CookieConsent onClose={() => setShowCookies(false)} />}
    </div>
  );
}
