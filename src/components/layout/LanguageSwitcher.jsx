import clsx from 'clsx';
import { useI18n } from '@/i18n/I18nContext';

export default function LanguageSwitcher({ light = false }) {
  const { lang, setLang } = useI18n();
  return (
    <div role="group" aria-label="Language" className={clsx('inline-flex rounded-lg p-0.5 text-xs font-semibold', light ? 'bg-white/10' : 'bg-slate-100')}>
      {[['en', 'EN'], ['mm', 'မြန်မာ']].map(([code, label]) => (
        <button
          key={code}
          type="button"
          aria-pressed={lang === code}
          onClick={() => setLang(code)}
          className={clsx(
            'rounded-md px-2.5 py-1 transition-colors',
            lang === code ? (light ? 'bg-white text-primary' : 'bg-white text-primary shadow-sm') : (light ? 'text-white/80 hover:text-white' : 'text-slate-600 hover:text-slate-900'),
          )}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
