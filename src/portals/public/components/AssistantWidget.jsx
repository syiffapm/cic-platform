import clsx from 'clsx';
import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Bot, Send, ShieldAlert, X } from 'lucide-react';
import { useStore } from '@/context/StoreContext';
import { useI18n } from '@/i18n/I18nContext';
import { containsNrc, redactPii } from '../lib/privacyGuard';
import { answer } from './assistantEngine';

const SUGGESTIONS = ['How do I check my credit report?', 'My report is wrong', 'Is this MFI licensed?', 'Who can see my report?'];
const GREETING = { from: 'bot', text: 'Hello! I answer questions using public CIC information only. How can I help?' };

/** Floating AI assistant: canned answers from FAQ and services, refuses personal data. */
export default function AssistantWidget({ raised }) {
  const { faqs } = useStore();
  const { bi } = useI18n();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([GREETING]);
  const listRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => { if (open) inputRef.current?.focus(); }, [open]);
  useEffect(() => { listRef.current?.scrollTo({ top: listRef.current.scrollHeight }); }, [messages]);
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  const ask = (text) => {
    const raw = text.trim();
    if (!raw) return;
    setInput('');
    if (containsNrc(raw)) {
      setMessages((m) => [...m,
        { from: 'user', text: redactPii(raw) },
        { from: 'bot', warn: true, text: 'Please do not share your NRC here. I removed it from this conversation and it was not stored. I only use public information and cannot look up anyone\'s credit record. To see your own report, sign in to the Borrower Self-Service Portal.', source: { label: 'Go to Borrower portal', to: '/borrower' } },
      ]);
      return;
    }
    const clean = redactPii(raw);
    setMessages((m) => [...m, { from: 'user', text: clean }, { from: 'bot', ...answer(clean, faqs, bi) }]);
  };

  return (
    <div className={clsx('fixed right-4 z-40 transition-all', raised ? 'bottom-36 md:bottom-24' : 'bottom-4')}>
      {open && (
        <section
          role="dialog"
          aria-label="CIC assistant"
          className="mb-3 flex h-[min(520px,70vh)] w-[min(360px,calc(100vw-2rem))] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl"
        >
          <header className="flex items-start gap-3 bg-primary px-4 py-3 text-white">
            <div className="rounded-lg bg-white/10 p-1.5"><Bot className="h-5 w-5 text-warm" aria-hidden="true" /></div>
            <div className="flex-1">
              <p className="text-sm font-semibold">CIC Assistant</p>
              <p className="text-[11px] text-primary-100">Answers from public information only</p>
            </div>
            <button type="button" onClick={() => setOpen(false)} aria-label="Close assistant" className="rounded p-1 text-white/80 hover:bg-white/10 hover:text-white"><X className="h-4 w-4" /></button>
          </header>
          <p className="flex items-center gap-1.5 border-b border-amber-200 bg-amber-50 px-4 py-2 text-[11px] font-medium text-amber-900">
            <ShieldAlert className="h-3.5 w-3.5 shrink-0" aria-hidden="true" /> Never enter your NRC, phone number or loan details.
          </p>
          <div ref={listRef} className="flex-1 space-y-3 overflow-y-auto p-4 scrollbar-thin" aria-live="polite">
            {messages.map((m, i) => (
              <div key={i} className={clsx('flex', m.from === 'user' ? 'justify-end' : 'justify-start')}>
                <div className={clsx('max-w-[85%] rounded-2xl px-3 py-2 text-[13px] leading-relaxed',
                  m.from === 'user' ? 'rounded-br-sm bg-primary text-white' : m.warn ? 'rounded-bl-sm border border-amber-200 bg-amber-50 text-amber-900' : 'rounded-bl-sm bg-slate-100 text-slate-800')}
                >
                  <span className="sr-only">{m.from === 'user' ? 'You said: ' : 'Assistant: '}</span>
                  {m.text}
                  {m.source && (
                    <Link to={m.source.to} onClick={() => setOpen(false)} className="mt-1.5 block text-[11px] font-semibold text-primary underline">{m.source.label}</Link>
                  )}
                </div>
              </div>
            ))}
            {messages.length === 1 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {SUGGESTIONS.map((s) => (
                  <button key={s} type="button" onClick={() => ask(s)} className="rounded-full border border-slate-200 px-2.5 py-1 text-[11px] text-slate-600 hover:border-primary-300 hover:text-primary">{s}</button>
                ))}
              </div>
            )}
          </div>
          <form onSubmit={(e) => { e.preventDefault(); ask(input); }} className="flex gap-2 border-t border-slate-100 p-3">
            <label htmlFor="assistant-input" className="sr-only">Ask a question</label>
            <input
              id="assistant-input"
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              autoComplete="off"
              placeholder="Ask about CIC services…"
              className="h-10 min-w-0 flex-1 rounded-lg border border-slate-300 px-3 text-sm focus:border-primary-400"
            />
            <button type="submit" aria-label="Send" className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-white hover:bg-primary-700"><Send className="h-4 w-4" /></button>
          </form>
        </section>
      )}
      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          className="flex items-center gap-2 rounded-full bg-primary py-3 pl-3 pr-4 text-sm font-semibold text-white shadow-lg ring-4 ring-white hover:bg-primary-700"
        >
          <Bot className="h-5 w-5 text-warm" aria-hidden="true" />
          {open ? 'Close assistant' : 'Ask CIC'}
        </button>
      </div>
    </div>
  );
}
