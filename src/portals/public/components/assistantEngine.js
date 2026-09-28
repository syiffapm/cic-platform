import { publicServices } from '@/data/services';
import channelLabel from '../lib/channelLabel';

const STOP = new Set(['the', 'a', 'an', 'is', 'are', 'do', 'does', 'i', 'my', 'me', 'to', 'of', 'and', 'or', 'can', 'how', 'what', 'who', 'for', 'in', 'on', 'it', 'be', 'if', 'with', 'you', 'your', 'about', 'there', 'this', 'that', 'get']);
const tokens = (s) => (s || '').toLowerCase().replace(/[^a-z0-9က-႟\s]/g, ' ').split(/\s+/).filter((w) => w.length > 1 && !STOP.has(w));

function score(queryTokens, text) {
  const hay = tokens(text);
  return queryTokens.reduce((n, w) => n + (hay.some((h) => h.startsWith(w) || w.startsWith(h)) ? 1 : 0), 0);
}

/** Canned, public-information-only answer from FAQ and service catalogue (PUB-11). */
export function answer(question, faqs, bi) {
  const q = tokens(question);
  if (!q.length) return { text: 'Could you tell me a little more? For example: "How do I check my credit report?"' };

  if (q.some((w) => ['hello', 'hi', 'mingalaba', 'hey'].includes(w))) {
    return { text: 'Mingalaba! I can answer questions about CIC services, credit reports, disputes and licensed MFIs using public information.' };
  }

  // How and when a citizen gets their own report/score — the report is issued on request, never instantly.
  const aboutOwnReport = q.some((w) => ['score', 'grade', 'report', 'credit'].includes(w));
  const aboutAccess = q.some((w) => ['when', 'long', 'immediately', 'instant', 'instantly', 'see', 'check', 'view', 'request', 'register', 'sign', 'login', 'access', 'own'].includes(w));
  if (aboutOwnReport && aboutAccess && !q.some((w) => ['verify', 'lender', 'mfi', 'dispute', 'wrong'].includes(w))) {
    return {
      text: 'Register with your NRC, mobile number and a password you choose, and verify your identity. CIC confirms your account by SMS or email. Sign in with your NRC and password plus an SMS code, then request your credit report. CIC validates the data from every lender and an officer approves the report, usually within 1 working day. You are notified by SMS or email, and can then view your score and full report for 30 days, download the PDF, dispute anything wrong or apply for a loan. One report every 12 months is free.',
      source: { label: 'Guide: Check my credit report', to: '/my-credit' },
    };
  }

  const faqHits = faqs
    .map((f) => ({ f, s: score(q, `${f.q.en} ${f.q.en} ${f.a.en} ${f.category}`) }))
    .filter((x) => x.s > 0)
    .sort((a, b) => b.s - a.s);
  const svcHits = publicServices()
    .map((s) => ({ s, n: score(q, `${s.title.en} ${s.title.en} ${s.summary} ${s.audience}`) }))
    .filter((x) => x.n > 0)
    .sort((a, b) => b.n - a.n);

  const bestFaq = faqHits[0];
  const bestSvc = svcHits[0];
  if (bestFaq && (!bestSvc || bestFaq.s >= bestSvc.n)) {
    return { text: bi(bestFaq.f.a), source: { label: `FAQ: ${bi(bestFaq.f.q)}`, to: `/help?faq=${bestFaq.f.id}` } };
  }
  if (bestSvc) {
    const s = bestSvc.s;
    return { text: `${s.summary} Fee: ${s.fee}. Where: ${channelLabel(s.channel)}.`, source: { label: `Service: ${bi(s.title)}`, to: `/services/${s.slug}` } };
  }
  return {
    text: 'I could not find that in our public information. You can browse the FAQ, call the helpdesk on 1800 242 242, or send us a message through the feedback form.',
    source: { label: 'Feedback & complaints form', to: '/help/grievance' },
  };
}
