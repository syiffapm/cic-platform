import { Link } from 'react-router-dom';
import BrandMark from '@/components/layout/BrandMark';
import { useI18n } from '@/i18n/I18nContext';
import { formatDate } from '@/lib/format';
import { LAST_UPDATED } from '../data/site';
import NewsletterForm from './NewsletterForm';

const SITEMAP = [
  { title: 'Services', links: [['/services', 'Service catalogue'], ['/my-credit', 'Check my credit report'], ['/how-it-works', 'How it works'], ['/services/dispute-correction', 'Dispute & correction'], ['/verify', 'Verify a report']] },
  { title: 'Information', links: [['/mfi-directory', 'MFI Directory'], ['/announcements', 'Announcements'], ['/publications', 'Publications'], ['/statistics', 'Statistics']] },
  { title: 'Help', links: [['/help', 'FAQ'], ['/help#contact', 'Contact helpdesk'], ['/help/grievance', 'Feedback & complaints']] },
];

const LEGAL = [['/privacy', 'Privacy notice'], ['/terms', 'Terms of use'], ['/accessibility', 'Accessibility statement'], ['/cookies', 'Cookie policy']];

export default function PublicFooter({ onCookieSettings }) {
  const { t } = useI18n();
  return (
    <footer className="bg-primary text-white" aria-labelledby="footer-heading">
      <h2 id="footer-heading" className="sr-only">Footer</h2>
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 lg:grid-cols-12 lg:px-8">
        <div className="lg:col-span-4">
          <BrandMark light subtitle="Central Bank of Myanmar · CIC" />
          <p className="mt-4 max-w-sm text-xs leading-relaxed text-primary-100">{t('public.heroSubtitle')}</p>
          <div className="mt-6"><NewsletterForm /></div>
        </div>
        <nav aria-label="Sitemap" className="grid grid-cols-2 gap-8 sm:grid-cols-3 lg:col-span-8">
          {SITEMAP.map((col) => (
            <div key={col.title}>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-warm">{col.title}</h3>
              <ul className="mt-3 space-y-2">
                {col.links.map(([to, label]) => (
                  <li key={to}><Link to={to} className="text-sm text-primary-100 hover:text-white hover:underline">{label}</Link></li>
                ))}
              </ul>
            </div>
          ))}
        </nav>
      </div>
      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-5 text-[11px] text-primary-200 sm:px-6 md:flex-row md:items-center md:justify-between lg:px-8">
          <ul className="flex flex-wrap gap-x-4 gap-y-1" aria-label="Legal">
            {LEGAL.map(([to, label]) => <li key={to}><Link to={to} className="inline-flex min-h-[24px] items-center hover:text-white hover:underline">{label}</Link></li>)}
            <li><button type="button" onClick={onCookieSettings} className="inline-flex min-h-[24px] items-center hover:text-white hover:underline">Cookie settings</button></li>
          </ul>
          <p>© 2026 Credit Information Center, Central Bank of Myanmar · Last updated <time dateTime={LAST_UPDATED}>{formatDate(LAST_UPDATED)}</time></p>
        </div>
      </div>
    </footer>
  );
}
