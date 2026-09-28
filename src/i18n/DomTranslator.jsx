import { useEffect } from 'react';
import { useI18n } from './I18nContext';

/**
 * Whole-app Myanmar translation layer.
 *
 * Components are written in English; when the language is Myanmar this component translates every
 * rendered text node and the user-facing attributes (placeholder, aria-label, title, alt) using the
 * dictionary in /public/i18n/mm.json:
 *   { exact: { "English": "Myanmar" }, templates: { "Report {x} issued": "အစီရင်ခံစာ {x} ထုတ်ပြီး" } }
 * Dynamic values ({x}) are kept, and translated themselves when they are known phrases. Switching
 * back to English restores the original text. Elements marked translate="no" (IDs, NRC, codes) are skipped.
 */
const SKIP_TAGS = new Set(['SCRIPT', 'STYLE', 'NOSCRIPT', 'CODE', 'PRE', 'TEXTAREA']);
const ATTRS = ['placeholder', 'aria-label', 'title', 'alt'];
const MONTHS = {
  Jan: 'ဇန်နဝါရီ', Feb: 'ဖေဖော်ဝါရီ', Mar: 'မတ်', Apr: 'ဧပြီ', May: 'မေ', Jun: 'ဇွန်', Jul: 'ဇူလိုင်',
  Aug: 'ဩဂုတ်', Sep: 'စက်တင်ဘာ', Sept: 'စက်တင်ဘာ', Oct: 'အောက်တိုဘာ', Nov: 'နိုဝင်ဘာ', Dec: 'ဒီဇင်ဘာ',
};
const MONTH_RE = /\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sept?|Oct|Nov|Dec)[a-z]*\b(?=\s*'?\d{2,4}\b|\s*$|\s*·)/g;

let dictPromise = null;
let compiled = null;

const norm = (s) => s.replace(/\s+/g, ' ').trim();
const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

function compile(dict) {
  const exact = new Map(Object.entries(dict.exact ?? {}));
  const buckets = new Map();
  const generic = [];
  Object.entries(dict.templates ?? {}).forEach(([en, mm]) => {
    // Only templates with enough fixed wording — tiny ones like "{x} to {x}" would match any sentence.
    const fixed = en.replace(/\{x\}/g, ' ').replace(/[^A-Za-z ]/g, ' ').trim();
    const words = fixed.split(/\s+/).filter((w) => w.length >= 2);
    const letters = fixed.replace(/\s/g, '').length;
    const headed = /[A-Za-z]{3,}/.test(en.split('{x}')[0]);
    if (headed ? letters < 5 : (letters < 10 || words.length < 2)) return;
    const parts = en.split('{x}');
    const re = new RegExp(`^${parts.map(esc).join('(.+?)')}$`, 's');
    const entry = { re, mm };
    const head = parts[0].trim().slice(0, 4).toLowerCase();
    if (head.length >= 2) { if (!buckets.has(head)) buckets.set(head, []); buckets.get(head).push(entry); } else if (letters >= 12) generic.push(entry);
  });
  return { exact, buckets, generic };
}

function loadDict() {
  if (!dictPromise) {
    dictPromise = fetch('/i18n/mm.json').then((r) => (r.ok ? r.json() : { exact: {}, templates: {} }))
      .catch(() => ({ exact: {}, templates: {} }))
      .then((d) => { compiled = compile(d); return compiled; });
  }
  return dictPromise;
}

const localiseMonths = (s) => s.replace(MONTH_RE, (m, abbr) => MONTHS[abbr] ?? MONTHS[abbr.slice(0, 3)] ?? m);

function translateCore(key, depth = 0) {
  if (!compiled || !key) return null;
  const hit = compiled.exact.get(key);
  if (hit) return hit;
  if (depth > 1) return null;
  const head = key.slice(0, 4).toLowerCase();
  const candidates = [...(compiled.buckets.get(head) ?? []), ...compiled.generic];
  for (const { re, mm } of candidates) {
    const m = key.match(re);
    if (m) {
      let i = 1;
      return mm.replace(/\{x\}/g, () => { const v = m[i++] ?? ''; return translateCore(norm(v), depth + 1) ?? localiseMonths(v); });
    }
  }
  return null;
}

/** Translate one string, keeping its surrounding whitespace. Returns null when nothing changes. */
export function translateString(value) {
  if (!value || !/[A-Za-z]/.test(value)) return null;
  const key = norm(value);
  let out = translateCore(key);
  if (out == null && key.includes(' · ')) {
    // Compound labels like "Awaiting MFI · PGMF · Investigating": translate each part.
    const parts = key.split(' · ');
    const tr = parts.map((part) => translateCore(part) ?? part);
    if (tr.some((t, i) => t !== parts[i])) out = tr.join(' · ');
  }
  if (out == null) {
    // Fragments around inline values often carry punctuation: ". Contact your lender …,"
    const m = key.match(/^([\s.,;:()·—–-]*)(.*?)([\s.,;:()·—–-]*)$/s);
    if (m && m[2] && (m[1] || m[3])) {
      const inner = translateCore(m[2]);
      if (inner != null) out = `${m[1].replace(/\./g, '။')}${inner}${m[3].replace(/\./g, '။')}`;
    }
  }
  if (out == null) {
    const months = localiseMonths(key);
    if (months === key) return null;
    out = months;
  }
  const lead = value.match(/^\s*/)[0];
  const trail = value.match(/\s*$/)[0];
  return lead + out + trail;
}

const originals = new WeakMap(); // Text node → original English
const attrOriginals = new WeakMap(); // Element → { attr: original }
const touched = new Set();
let applying = false;

const skip = (el) => !el || el.closest?.('[translate="no"], .notranslate') || SKIP_TAGS.has(el.tagName) || el.isContentEditable;

function translateText(node) {
  const parent = node.parentElement;
  if (skip(parent)) return;
  const current = node.nodeValue;
  const known = originals.get(node);
  const source = known !== undefined && current === known.mm ? known.en : current;
  const mm = translateString(source);
  if (mm == null || mm === current) return;
  originals.set(node, { en: source, mm });
  touched.add(node);
  node.nodeValue = mm;
}

function translateAttrs(el) {
  if (skip(el)) return;
  ATTRS.forEach((a) => {
    if (!el.hasAttribute(a)) return;
    const store = attrOriginals.get(el) ?? {};
    const current = el.getAttribute(a);
    const source = store[a] && current === store[a].mm ? store[a].en : current;
    const mm = translateString(source);
    if (mm == null || mm === current) return;
    store[a] = { en: source, mm };
    attrOriginals.set(el, store);
    touched.add(el);
    el.setAttribute(a, mm);
  });
}

function translateTree(root) {
  if (root.nodeType === Node.TEXT_NODE) { translateText(root); return; }
  if (root.nodeType !== Node.ELEMENT_NODE) return;
  translateAttrs(root);
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT);
  for (let n = walker.nextNode(); n; n = walker.nextNode()) {
    if (n.nodeType === Node.TEXT_NODE) translateText(n); else translateAttrs(n);
  }
}

function restoreAll() {
  touched.forEach((n) => {
    if (!n.isConnected) return;
    if (n.nodeType === Node.TEXT_NODE) {
      const o = originals.get(n);
      if (o && n.nodeValue === o.mm) n.nodeValue = o.en;
    } else {
      const store = attrOriginals.get(n) ?? {};
      Object.entries(store).forEach(([a, o]) => { if (n.getAttribute(a) === o.mm) n.setAttribute(a, o.en); });
    }
  });
  touched.clear();
}

export default function DomTranslator() {
  const { lang } = useI18n();

  useEffect(() => {
    if (lang !== 'mm') { restoreAll(); return undefined; }
    let observer;
    let cancelled = false;
    loadDict().then(() => {
      if (cancelled) return;
      applying = true;
      translateTree(document.body);
      applying = false;
      observer = new MutationObserver((mutations) => {
        if (applying) return;
        applying = true;
        mutations.forEach((m) => {
          if (m.type === 'characterData') translateText(m.target);
          else if (m.type === 'attributes') translateAttrs(m.target);
          else m.addedNodes.forEach((n) => translateTree(n));
        });
        applying = false;
      });
      observer.observe(document.body, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ATTRS });
    });
    return () => { cancelled = true; observer?.disconnect(); };
  }, [lang]);

  return null;
}
