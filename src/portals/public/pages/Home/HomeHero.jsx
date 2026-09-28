import { Link } from 'react-router-dom';
import { ArrowRight, Building2, CheckCircle2, FileSearch, QrCode } from 'lucide-react';
import { useI18n } from '@/i18n/I18nContext';

/** Hero — mission and the two primary calls to action (citizen actions lead to the access guide). */
export default function HomeHero() {
  const { t } = useI18n();
  return (
    <section aria-labelledby="hero-title" className="relative overflow-hidden bg-primary text-white">
      <picture>
        <source media="(max-width: 767px)" srcSet="/images/hero-myanmar-1024.jpg" />
        <img src="/images/hero-myanmar.jpg" alt="" aria-hidden="true" fetchpriority="high" decoding="async" className="absolute inset-0 h-full w-full object-cover object-[70%_center]" />
      </picture>
      <div className="absolute inset-0 bg-gradient-to-r from-primary/95 via-primary/75 to-primary/10" aria-hidden="true" />
      <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-primary/70 to-transparent" aria-hidden="true" />
      <div className="relative mx-auto max-w-7xl px-4 pb-10 pt-16 sm:px-6 sm:pt-24 lg:px-8 lg:pb-14 lg:pt-28">
        <div className="max-w-2xl">
          <p className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-warm ring-1 ring-white/15">
            Credit Information Center · Central Bank of Myanmar
          </p>
          <h1 id="hero-title" className="mt-5 text-3xl font-bold leading-tight tracking-tight sm:text-4xl lg:text-5xl">{t('public.heroTitle')}</h1>
          <p className="mt-5 max-w-2xl text-base leading-relaxed text-primary-100 sm:text-lg">{t('public.heroSubtitle')}</p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link to="/my-credit" className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-warm px-6 text-base font-semibold text-slate-900 shadow-lg hover:brightness-95">
              <FileSearch className="h-5 w-5" aria-hidden="true" /> {t('public.ctaReport')}
            </Link>
            <Link to="/mfi-directory" className="inline-flex h-12 items-center justify-center gap-2 rounded-lg border border-white/30 bg-white/5 px-6 text-base font-semibold text-white hover:bg-white/10">
              <Building2 className="h-5 w-5" aria-hidden="true" /> {t('public.ctaDirectory')}
            </Link>
          </div>
          <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-white">
            {['One free report every 12 months', 'Disputes are always free', 'No login needed to browse'].map((x) => (
              <li key={x} className="flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-teal-300" aria-hidden="true" />{x}</li>
            ))}
          </ul>
        </div>
        <div className="mt-12 flex flex-col gap-4 rounded-2xl border border-white/15 bg-primary-950/60 p-4 backdrop-blur-md sm:flex-row sm:items-center sm:justify-between sm:p-5 lg:max-w-4xl">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-teal/25 p-2"><QrCode className="h-6 w-6 text-teal-200" aria-hidden="true" /></div>
            <div>
              <p className="text-sm font-semibold">Holding a CIC credit report?</p>
              <p className="text-xs text-primary-100">Enter the report ID and 6-digit code next to the QR. We only tell you whether it is genuine — never what it contains.</p>
            </div>
          </div>
          <div className="flex shrink-0 flex-wrap gap-2">
            <Link to="/verify" className="inline-flex h-10 items-center gap-1.5 rounded-lg bg-white px-4 text-sm font-semibold text-primary hover:bg-primary-50">
              Verify a report <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
            <Link to="/help" className="inline-flex h-10 items-center rounded-lg bg-white/10 px-4 text-sm font-medium hover:bg-white/20">Help & FAQ</Link>
          </div>
        </div>
      </div>
    </section>
  );
}
