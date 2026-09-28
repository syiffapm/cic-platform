import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CheckCircle2, Copy, RefreshCw, Send } from 'lucide-react';
import { Alert, Button, Card, CardBody, Input, Select, Textarea, useToast } from '@/components/ui';
import { useStore } from '@/context/StoreContext';
import { formatDate } from '@/lib/format';
import PageHero, { PageBody } from '../../components/PageHero';
import { GRIEVANCE_CATEGORIES, GRIEVANCE_SLA_DAYS } from '../../data/site';
import { containsNrc } from '../../lib/privacyGuard';

const newCaptcha = () => {
  const a = 2 + Math.floor(Math.random() * 8);
  const b = 1 + Math.floor(Math.random() * 9);
  return { a, b, answer: a + b };
};
const addDays = (iso, n) => { const d = new Date(iso); d.setDate(d.getDate() + n); return d.toISOString().slice(0, 10); };
const EMPTY = { category: '', mfiId: '', description: '', email: '', phone: '', captcha: '' };

/** Grievance / feedback form: ticket number, CAPTCHA, SLA acknowledgement. Routes to GOV-12 / ADM-09. */
export default function GrievancePage() {
  const { institutions, grievances, add, logAudit } = useStore();
  const toast = useToast();
  const [params] = useSearchParams();
  const published = useMemo(() => institutions.filter((i) => i.publish === true).sort((a, b) => a.name.localeCompare(b.name)), [institutions]);
  const presetMfi = published.some((i) => i.id === params.get('mfi')) ? params.get('mfi') : '';
  const [form, setForm] = useState({ ...EMPTY, mfiId: presetMfi, category: presetMfi ? 'MFI conduct' : '' });
  const [captcha, setCaptcha] = useState(newCaptcha);
  const [errors, setErrors] = useState({});
  const [ticket, setTicket] = useState(null);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const validate = () => {
    const e = {};
    if (!form.category) e.category = 'Choose a category.';
    if (form.description.trim().length < 20) e.description = 'Please describe the issue in at least 20 characters.';
    else if (containsNrc(form.description)) e.description = 'Please remove your NRC number. We do not need it to handle your feedback.';
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(form.email.trim())) e.email = 'Enter a valid email or leave it empty.';
    if (form.phone && !/^[+\d][\d\s-]{6,}$/.test(form.phone.trim())) e.phone = 'Enter a valid phone number or leave it empty.';
    if (Number(form.captcha) !== captcha.answer) e.captcha = 'The answer is not correct. Try again.';
    return e;
  };

  const submit = (ev) => {
    ev.preventDefault();
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length) {
      if (e.captcha) { setCaptcha(newCaptcha()); setForm((f) => ({ ...f, captcha: '' })); }
      return;
    }
    const maxNo = grievances.reduce((m, g) => Math.max(m, Number(g.id.split('-')[2]) || 0), 1100);
    const id = `GRV-2026-${String(maxNo + 1).padStart(4, '0')}`;
    const createdAt = new Date().toISOString().slice(0, 10);
    const description = form.description.trim();
    const item = {
      id,
      category: form.category,
      mfiId: form.mfiId || null,
      subject: description.length > 80 ? `${description.slice(0, 77)}…` : description,
      description,
      contactEmail: form.email.trim() || null,
      contactPhone: form.phone.trim() || null,
      channel: 'Public form',
      status: 'Open',
      createdAt,
      sla: addDays(createdAt, GRIEVANCE_SLA_DAYS),
      assignee: null,
    };
    add('grievances', item);
    logAudit({ actor: 'Public visitor', role: 'public', tenant: 'CIC', action: 'Grievance submitted', module: 'Public · Grievance form', target: id });
    setTicket(item);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const hero = <PageHero title="Complaints and feedback" subtitle="Tell us about a problem with a microfinance institution, an unlicensed lender or this website." breadcrumbs={[{ label: 'Help', to: '/help' }, { label: 'Feedback form' }]} />;

  if (ticket) {
    const mfi = published.find((i) => i.id === ticket.mfiId);
    return (
      <>
        {hero}
        <PageBody className="max-w-3xl">
          <Card>
            <CardBody className="p-8 text-center">
              <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-600" aria-hidden="true" />
              <h2 className="mt-4 text-xl font-bold text-slate-900" role="status">We have received your submission</h2>
              <p className="mt-2 text-sm text-slate-600">Keep this ticket number to follow up with the helpdesk.</p>
              <div className="mx-auto mt-5 flex w-fit items-center gap-2 rounded-xl bg-primary-50 px-5 py-3">
                <span className="font-mono text-2xl font-bold tracking-wide text-primary">{ticket.id}</span>
                <button type="button" aria-label="Copy ticket number" className="rounded p-1 text-primary hover:bg-primary-100" onClick={() => { try { navigator.clipboard.writeText(ticket.id); toast('Ticket number copied', 'success'); } catch { /* clipboard unavailable */ } }}>
                  <Copy className="h-4 w-4" />
                </button>
              </div>
              <dl className="mx-auto mt-6 grid max-w-md gap-3 text-left text-sm sm:grid-cols-2">
                <div><dt className="text-[11px] text-slate-500">Category</dt><dd className="font-medium">{ticket.category}</dd></div>
                <div><dt className="text-[11px] text-slate-500">Institution</dt><dd className="font-medium">{mfi?.name ?? '—'}</dd></div>
                <div><dt className="text-[11px] text-slate-500">Received</dt><dd className="font-medium">{formatDate(ticket.createdAt)}</dd></div>
                <div><dt className="text-[11px] text-slate-500">Reply by</dt><dd className="font-medium">{formatDate(ticket.sla)}</dd></div>
              </dl>
              <Alert tone="info" className="mt-6 text-left" title={`We will respond within ${GRIEVANCE_SLA_DAYS} days`}>
                {ticket.contactEmail || ticket.contactPhone
                  ? 'We will contact you using the details you gave.'
                  : 'You did not leave contact details, so we cannot reply to you directly. Call 1800 242 242 with your ticket number to hear the outcome.'}
              </Alert>
              <div className="mt-6 flex flex-wrap justify-center gap-3">
                <Button variant="outline" onClick={() => { setTicket(null); setForm(EMPTY); setCaptcha(newCaptcha()); }}>Submit another</Button>
                <Link to="/" className="inline-flex h-10 items-center rounded-lg bg-primary px-4 text-sm font-medium text-white hover:bg-primary-700">Back to home</Link>
              </div>
            </CardBody>
          </Card>
        </PageBody>
      </>
    );
  }

  return (
    <>
      {hero}
      <PageBody className="grid gap-6 lg:grid-cols-3">
        <form onSubmit={submit} noValidate className="lg:col-span-2">
          <Card>
            <CardBody className="space-y-5">
              {Object.keys(errors).length > 0 && <Alert tone="danger" title="Your feedback has not been sent yet">Some answers are missing or not in the right format. Fix the fields marked in red below, then send it again.</Alert>}
              <div className="grid gap-4 sm:grid-cols-2">
                <Select label="Category" required value={form.category} onChange={set('category')} placeholder="Choose…" options={GRIEVANCE_CATEGORIES} error={errors.category} />
                <Select label="Institution (optional)" value={form.mfiId} onChange={set('mfiId')} placeholder="Not about a specific MFI" options={published.map((i) => ({ value: i.id, label: `${i.name} (${i.licenceNo})` }))} />
              </div>
              <Textarea label="What happened?" required rows={6} value={form.description} onChange={set('description')} error={errors.description} hint="Include dates, places and what you were told. Do not include your NRC or loan account numbers." maxLength={2000} />
              <fieldset className="rounded-lg border border-slate-200 p-4">
                <legend className="px-1 text-xs font-semibold text-slate-700">How can we reach you? (optional)</legend>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Input label="Email" type="email" autoComplete="email" value={form.email} onChange={set('email')} error={errors.email} />
                  <Input label="Phone" type="tel" autoComplete="tel" value={form.phone} onChange={set('phone')} error={errors.phone} placeholder="09 …" />
                </div>
                <p className="mt-2 text-[11px] text-slate-500">Leave empty to stay anonymous. Contact details are used only to reply to you.</p>
              </fieldset>
              <div className="flex flex-wrap items-end gap-3">
                <Input className="w-48" label={`Security check: what is ${captcha.a} + ${captcha.b}?`} required inputMode="numeric" value={form.captcha} onChange={set('captcha')} error={errors.captcha} autoComplete="off" />
                <Button variant="ghost" size="sm" icon={RefreshCw} onClick={() => setCaptcha(newCaptcha())}>New question</Button>
              </div>
              <div className="flex flex-col gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-[11px] text-slate-500">By submitting you agree to our <Link to="/privacy" className="underline">privacy notice</Link>.</p>
                <Button type="submit" icon={Send}>Submit</Button>
              </div>
            </CardBody>
          </Card>
        </form>
        <aside className="space-y-4 text-sm">
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <p className="font-semibold text-slate-900">What happens next</p>
            <ol className="mt-3 list-decimal space-y-1.5 pl-5 text-xs text-slate-600">
              <li>You get a ticket number straight away.</li>
              <li>Our team reviews it and, if it concerns an MFI, passes it to the Central Bank's consumer-protection unit.</li>
              <li>We reply within {GRIEVANCE_SLA_DAYS} days.</li>
            </ol>
          </div>
          <Alert tone="warning" title="Wrong entry on your credit report?">This form is not for disputes. <Link to="/borrower/disputes/new" className="font-semibold underline">File a free dispute</Link> in the Borrower portal so the MFI must respond.</Alert>
        </aside>
      </PageBody>
    </>
  );
}
