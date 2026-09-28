import { useState } from 'react';
import { AlertTriangle, Coins, Receipt, RefreshCw } from 'lucide-react';
import { Card, PageHeader, StatCard, Tabs, useToast } from '@/components/ui';
import { useStore } from '@/context/StoreContext';
import { AS_OF } from '@/data/kpis';
import { formatMMK, formatNumber } from '@/lib/format';
import { useAdmin } from '../../lib/useAdmin';
import { useAdminCollection } from '../../context/AdminStore';
import PendingApprovals from '../../components/PendingApprovals';
import { CREDIT_NOTES_SEED, PAYMENTS, USAGE, planOf } from '../../data/billing';
import { Entitlements, TariffPlans } from './components/PlansAndQuotas';
import Ledger from './components/Ledger';
import InvoiceRun from './components/InvoiceRun';
import CreditNotes from './components/CreditNotes';
import { PaymentStatus, Reconciliation } from './components/ReconPayments';
import ReportPurchases from './components/ReportPurchases';

const TABS = [
  { id: 'tariffs', label: 'Tariff plans' }, { id: 'quotas', label: 'Entitlements & quotas' }, { id: 'ledger', label: 'Billable-event ledger' },
  { id: 'run', label: 'Monthly invoice run' }, { id: 'credit', label: 'Credit notes' }, { id: 'recon', label: 'Reconciliation' }, { id: 'payments', label: 'Payment status' }, { id: 'reports', label: 'Report purchases' },
];

export default function Billing() {
  const { user, role, can, audit, requestApproval } = useAdmin('adm.billing');
  const readOnly = !can('create');
  const { institutions, reportPurchases } = useStore();
  const toast = useToast();
  const [tab, setTab] = useState('run');
  const [invoices, invoiceApi] = useAdminCollection('invoices', []);
  const [notes] = useAdminCollection('creditNotes', CREDIT_NOTES_SEED);
  const checkerRole = role === 'adm_super' ? 'adm_billing' : 'adm_super';

  const usage = Object.values(USAGE);
  const billable = usage.reduce((a, u) => a + u.basic + u.full, 0);
  const excluded = usage.reduce((a, u) => a + u.retries + u.dupes, 0);
  const overQuota = Object.entries(USAGE).filter(([, u]) => u.basic + u.full > planOf(u.plan).quota).length;
  const overdue = PAYMENTS.filter((p) => p.status === 'Overdue');

  const createNote = (form) => {
    const id = `CN-2026-${String(15 + notes.length - CREDIT_NOTES_SEED.length).padStart(3, '0')}`;
    const item = { id, invoice: form.invoice, mfiId: form.mfiId, amount: form.amount, reason: form.reason.trim(), status: 'Issued', date: new Date().toISOString().slice(0, 10), maker: user?.name };
    const a = requestApproval({
      type: 'Credit note', checkerRole, summary: `Credit note ${formatMMK(form.amount)} against ${form.invoice}`,
      payload: { reason: item.reason, diff: [{ field: 'Credit note', from: '—', to: `${id} · ${formatMMK(form.amount)}` }, { field: 'Invoice', from: form.invoice, to: `${form.invoice} (credited)` }], effect: { target: 'admin', collection: 'creditNotes', op: 'add', item } },
    });
    toast(`${a.id}: credit note sent for approval`, 'success');
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Billing & entitlements" subtitle="Tariffs, quotas, billable events, invoicing, credit notes, reconciliation and payments" />

      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <StatCard label="Billable inquiries (Sep MTD)" value={formatNumber(billable)} icon={Receipt} tone="navy" definition="Basic + Full reports with a unique request id, excluding retries and duplicates within 5 minutes." asOf="25 Sep 2026" />
        <StatCard label="Retries / duplicates excluded" value={formatNumber(excluded)} icon={RefreshCw} tone="warm" definition="Ledger events flagged non-billable under the retry/duplicate rule this month." asOf="25 Sep 2026" />
        <StatCard label="MFIs over quota" value={overQuota} icon={Coins} tone="teal" definition="MFIs whose inquiries exceed their plan's included monthly quota; overage billed per inquiry." asOf="25 Sep 2026" />
        <StatCard label="Overdue invoices" value={overdue.length} icon={AlertTriangle} tone="red" definition={`August invoices unpaid after due date; ${formatMMK(overdue.reduce((a, p) => a + p.total, 0))} outstanding.`} asOf={AS_OF} />
      </div>

      <Card>
        <Tabs className="px-4" tabs={TABS.map((t) => (t.id === 'credit' ? { ...t, count: notes.length } : t))} value={tab} onChange={setTab} />
        {tab === 'tariffs' && <TariffPlans />}
        {tab === 'quotas' && <Entitlements institutions={institutions} />}
        {tab === 'ledger' && <Ledger institutions={institutions} />}
        {tab === 'run' && (
          <InvoiceRun institutions={institutions} invoices={invoices} api={invoiceApi} readOnly={readOnly} canExport={can('export')} maker={user?.name} checkerRole={checkerRole}
            audit={audit} requestApproval={requestApproval} toast={toast} />
        )}
        {tab === 'credit' && <CreditNotes notes={notes} institutions={institutions} readOnly={readOnly} maker={user?.name} checkerRole={checkerRole} onCreate={createNote} />}
        {tab === 'recon' && <Reconciliation institutions={institutions} />}
        {tab === 'payments' && <PaymentStatus institutions={institutions} />}
        {tab === 'reports' && <ReportPurchases purchases={reportPurchases} institutions={institutions} />}
      </Card>

      <PendingApprovals moduleLabel="Billing & entitlements" />
    </div>
  );
}
