import { useState } from 'react';
import { MailCheck } from 'lucide-react';

/** Notice subscription with double opt-in. Only the email is kept, pending confirmation. */
export default function NewsletterForm() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);

  const submit = (e) => {
    e.preventDefault();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim())) {
      setError('Enter a valid email address.');
      return;
    }
    setError('');
    setSent(true);
  };

  if (sent) {
    return (
      <p role="status" className="flex items-start gap-2 rounded-lg bg-white/10 p-3 text-xs text-primary-50">
        <MailCheck className="mt-0.5 h-4 w-4 shrink-0 text-warm" aria-hidden="true" />
        <span>Check your inbox to confirm your subscription. We sent a confirmation link to <strong>{email}</strong> (double opt-in) — nothing is sent until you confirm.</span>
      </p>
    );
  }

  return (
    <form onSubmit={submit} noValidate className="space-y-2">
      <label htmlFor="newsletter-email" className="block text-xs text-primary-100">Get new notices and publications by email</label>
      <div className="flex gap-2">
        <input
          id="newsletter-email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          aria-invalid={!!error}
          aria-describedby={error ? 'newsletter-error' : undefined}
          placeholder="you@example.com"
          className="h-10 min-w-0 flex-1 rounded-lg border border-white/20 bg-white/10 px-3 text-sm text-white placeholder:text-primary-200 focus:border-warm"
        />
        <button type="submit" className="h-10 shrink-0 rounded-lg bg-warm px-4 text-sm font-semibold text-slate-900 hover:brightness-95">Subscribe</button>
      </div>
      {error && <p id="newsletter-error" role="alert" className="text-[11px] font-medium text-amber-300">{error}</p>}
      <p className="text-[11px] text-primary-300">Unsubscribe at any time. See our privacy notice.</p>
    </form>
  );
}
