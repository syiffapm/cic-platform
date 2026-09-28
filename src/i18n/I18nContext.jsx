import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import en from './en';
import mm from './mm';
import DomTranslator from './DomTranslator';

const DICTS = { en, mm };
const I18nContext = createContext(null);

function lookup(dict, key) {
  return key.split('.').reduce((acc, k) => (acc && acc[k] !== undefined ? acc[k] : undefined), dict);
}

export function I18nProvider({ children }) {
  const [lang, setLang] = useState(() => {
    try {
      return localStorage.getItem('cic.lang') || ((navigator.languages ?? [navigator.language]).some((l) => /^my\b|^my-/i.test(l)) ? 'mm' : 'en');
    } catch { return 'en'; }
  });

  useEffect(() => {
    document.documentElement.lang = lang === 'mm' ? 'my' : 'en';
    try { localStorage.setItem('cic.lang', lang); } catch { /* storage unavailable */ }
    document.documentElement.classList.toggle('lang-mm', lang === 'mm');
  }, [lang]);

  /** t('public.nav.home') — falls back to English, then to a humanised key, never a raw key (MFI-23). */
  const t = useCallback((key, fallback) => {
    const value = lookup(DICTS[lang], key) ?? lookup(en, key);
    if (typeof value === 'string') return value;
    return fallback ?? key.split('.').pop().replace(/([A-Z])/g, ' $1').replace(/^./, (c) => c.toUpperCase());
  }, [lang]);

  /** Picks the right side of a bilingual object: bi({ en: 'Hello', mm: 'မင်္ဂလာပါ' }) */
  const bi = useCallback((obj) => (obj && typeof obj === 'object' ? (obj[lang] || obj.en) : obj), [lang]);

  const value = useMemo(() => ({ lang, setLang, t, bi }), [lang, t, bi]);
  return (
    <I18nContext.Provider value={value}>
      {children}
      <DomTranslator />
    </I18nContext.Provider>
  );
}

export const useI18n = () => useContext(I18nContext);
