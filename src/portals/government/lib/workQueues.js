import { useMemo } from 'react';
import { useStore } from '@/context/StoreContext';
import { roleName } from '@/data/roles';
import { formatDate, slaDaysLeft } from '@/lib/format';
import { OPEN_STATUSES } from '@/lib/reportRequests';
import { useAdminStore } from '@/portals/admin/context/AdminStore';
import { CMS_ITEMS } from '@/portals/admin/data/cms';
import { BREACHES, DSRS } from '@/portals/admin/data/compliance';
import { BATCHES } from '@/portals/admin/data/dataQuality';
import { IDENTITY_PAIRS } from '@/portals/admin/data/identity';
import { USER_SEED } from '@/portals/admin/data/iam';
import { JOBS } from '@/portals/admin/data/system';
import { PAYMENTS } from '@/portals/admin/data/billing';
import { blockReason } from '@/portals/admin/lib/useApprovals';
import { slaState as requestSla } from '@/portals/admin/pages/ReportRequests/components/requestUtils';
import { useRegulator } from '@/portals/regulator/lib/RegulatorStore';
import { CASES } from '@/portals/regulator/data/cases';
import { EWS_ALERTS } from '@/portals/regulator/data/ews';
import { INFO_REQUESTS, STAT_RELEASES } from '@/portals/regulator/data/supervision';
import { useGovAccess, useRegionScope } from './access';

const readSaved = (key) => {
  try { return JSON.parse(localStorage.getItem(key) ?? 'null') ?? {}; } catch { return {}; }
};

/** Supervision records: live store when mounted, otherwise the last saved copy (or the seed). */
export function useSupervisionRecords() {
  const reg = useRegulator();
  const saved = useMemo(() => (reg ? null : readSaved('cic.regulator.v1')), [reg]);
  const src = reg ?? saved ?? {};
  const { alerts, cases, infoRequests, statReleases } = src;
  return useMemo(() => ({
    alerts: alerts ?? EWS_ALERTS,
    cases: cases ?? CASES,
    infoRequests: infoRequests ?? INFO_REQUESTS,
    statReleases: statReleases ?? STAT_RELEASES,
  }), [alerts, cases, infoRequests, statReleases]);
}

/** Platform-administration collections: live store when mounted, otherwise saved copy or seed. */
function useAdminRecords() {
  const admin = useAdminStore();
  const saved = useMemo(() => (admin ? null : readSaved('cic.admin.v1')), [admin]);
  return admin?.state ?? saved ?? {};
}

/** Due-date label and urgency rank (0 overdue · 1 due within 3 days · 2 later). */
export function dueInfo(due, prefix = 'Due') {
  if (!due) return null;
  const d = slaDaysLeft(due);
  if (d < 0) return { label: `Overdue ${-d} d`, tone: 'red', rank: 0 };
  if (d === 0) return { label: `${prefix} today`, tone: 'amber', rank: 1 };
  if (d <= 3) return { label: `${prefix} in ${d} d`, tone: 'amber', rank: 1 };
  return { label: `${prefix} ${formatDate(due)}`, tone: 'slate', rank: 2 };
}

const raised = (stamp) => (stamp ? { label: `Raised ${String(stamp).slice(0, 10)}`, tone: 'slate', rank: 2 } : null);
const SEVERITY_RANK = { Critical: 0, High: 1, Medium: 2, Low: 3 };
const isPlatform = (a) => String(a.checkerRole ?? '').startsWith('adm_') || String(a.module ?? '').startsWith('Admin');
const ACCESS_MODULES = /IAM|Users|Roles|access/i;
/** Queues each role works first (listed ahead of everything else it can act on). */
const ROLE_FOCUS = {
  gov_exec: ['approvals', 'publications'],
  gov_supervisor: ['alerts', 'cases', 'infoRequests'],
  gov_supervisor_regional: ['alerts', 'cases', 'infoRequests'],
  gov_cpo: ['slaDisputes', 'complaints'],
  gov_licensing: ['approvals'],
  adm_helpdesk: ['reportRequests'],
  adm_editor: ['content'],
  adm_publisher: ['content'],
  adm_security: ['access', 'approvals'],
  adm_steward: ['batches', 'identity', 'cicDisputes'],
  adm_dpo: ['compliance'],
  adm_billing: ['billing'],
};

const title = (x) => (typeof x === 'string' ? x : x?.en ?? '');

/**
 * Work queues for the signed-in staff user — only what the role can act on.
 * Each queue: { id, label, to, items: [{ key, title, meta, due, to }] }.
 */
export function useWorkQueues() {
  const { can, user, role } = useGovAccess();
  const store = useStore();
  const { filterByMfi } = useRegionScope();
  const sup = useSupervisionRecords();
  const adminState = useAdminRecords();
  const { approvals = [], announcements = [], reportRequests = [], disputes = [], grievances = [], institutions = [] } = store;

  return useMemo(() => {
    if (!user) return [];
    const adminGet = (key, seed) => adminState[key] ?? seed;
    const mfiName = (id) => institutions.find((i) => i.id === id)?.short ?? id ?? '—';
    const q = [];
    const push = (id, label, to, items) => { if (items.length) q.push({ id, label, to, items }); };

    // Approvals the user can decide.
    const decide = [];
    const canPlatform = can('adm.approvals', 'approve');
    if (canPlatform) {
      approvals.filter((a) => a.status === 'Pending' && isPlatform(a) && !blockReason(a, user, true)).forEach((a) => decide.push({
        key: a.id, title: a.summary, meta: `${a.id} · ${a.type} · raised by ${a.maker}`, due: raised(a.createdAt), to: `/gov/admin/approvals?focus=${a.id}`,
      }));
    }
    if (can('gov.institutions', 'approve')) {
      approvals.filter((a) => a.status === 'Pending' && a.type === 'Licence status' && a.maker !== user.name).forEach((a) => decide.push({
        key: a.id, title: a.summary, meta: `${a.id} · Licence change · proposed by ${a.maker}`, due: raised(a.createdAt), to: '/gov/mfi',
      }));
    }
    if (can('gov.cases', 'approve')) {
      filterByMfi(sup.cases).filter((c) => c.decision?.status === 'Pending approval' && c.decision.proposedById !== user.id).forEach((c) => decide.push({
        key: c.id, title: `Case decision: ${c.title}`, meta: `${c.id} · proposed by ${c.decision.proposedBy}`, due: dueInfo(c.slaDue), to: `/gov/cases/${c.id}`,
      }));
    }
    push('approvals', 'Approvals to decide', canPlatform ? '/gov/admin/approvals' : can('gov.institutions', 'approve') ? '/gov/mfi' : '/gov/cases', decide);

    // Public releases awaiting sign-off.
    if (can('gov.publicationApproval', 'approve')) {
      const items = [
        ...announcements.filter((a) => a.status === 'In review').map((a) => ({ key: a.id, title: title(a.title), meta: `${a.id} · notice by ${a.author ?? '—'}`, due: raised(a.updatedAt ?? a.createdAt ?? ''), to: '/gov/publication-approval' })),
        ...sup.statReleases.filter((s) => s.status === 'In review').map((s) => ({ key: s.id, title: s.title, meta: `${s.id} · prepared by ${s.preparedBy}`, due: dueInfo(s.embargo, 'Embargo'), to: '/gov/publication-approval' })),
      ];
      push('publications', 'Awaiting publication', '/gov/publication-approval', items);
    }

    // Website content: publishers review, editors follow up their own drafts.
    if (can('cms.content', 'approve') || can('cms.content', 'update')) {
      const approver = can('cms.content', 'approve');
      const cms = [...adminGet('cmsItems', CMS_ITEMS), ...(can('gov.publicationApproval', 'approve') ? [] : announcements)];
      const editor = (x) => x.lastEditor ?? x.author;
      const items = cms
        .filter((x) => (approver ? x.status === 'In review' && editor(x) !== user.name : ['Draft', 'In review'].includes(x.status) && [x.author, x.lastEditor].includes(user.name)))
        .map((x) => ({ key: x.id, title: title(x.title) || x.id, meta: `${x.id} · ${x.status} · last edit ${editor(x) ?? '—'}`, due: raised(x.updatedAt), to: `/gov/admin/cms/edit/${x.id}` }));
      push('content', approver ? 'Content in review' : 'Your drafts and items in review', '/gov/admin/cms', items);
    }

    // Citizen credit report requests (1 working-day decision target).
    if (can('adm.reportRequests', 'update') || can('adm.reportRequests', 'approve')) {
      const now = new Date();
      const items = reportRequests.filter((r) => OPEN_STATUSES.includes(r.status)).map((r) => {
        const s = requestSla(r, now);
        return {
          key: r.id, title: `${r.status} · ${r.purpose}`, meta: `${r.id} · submitted ${r.submittedAt}`,
          due: s ? { label: s.label, tone: s.breached ? 'red' : s.hoursLeft <= 4 ? 'amber' : 'slate', rank: s.breached ? 0 : s.hoursLeft <= 4 ? 1 : 2, sort: s.hoursLeft } : null,
          to: `/gov/admin/report-requests/${r.id}`,
        };
      });
      push('reportRequests', 'Citizen report requests', '/gov/admin/report-requests', items);
    }

    // MFI corrections awaiting the CIC checker.
    if (can('adm.helpdesk', 'approve')) {
      const items = disputes.filter((d) => d.status === 'Pending CIC approval').map((d) => ({
        key: d.id, title: `${mfiName(d.mfiId)} correction awaiting CIC approval · ${d.loanId}`, meta: `${d.id} · filed ${d.filedAt}`, due: dueInfo(d.dueAt), to: `/gov/admin/helpdesk?focus=${d.id}`,
      }));
      push('cicDisputes', 'Disputes pending CIC approval', '/gov/admin/helpdesk', items);
    }

    // Dispute oversight: SLA breaches and cases at risk.
    if (can('gov.disputes', 'update')) {
      const done = ['Resolved', 'Closed', 'Rejected', 'Escalated'];
      const items = filterByMfi(disputes).filter((d) => !done.includes(d.status)).map((d) => {
        const reply = !d.mfiResponse ? dueInfo(d.mfiDueAt) : null;
        const res = dueInfo(d.dueAt);
        const worst = reply && reply.rank < (res?.rank ?? 3) ? { ...reply, label: `MFI reply ${reply.label.toLowerCase()}` } : res;
        return { key: d.id, title: `${d.status} · ${mfiName(d.mfiId)} · ${d.loanId}`, meta: `${d.id} · filed ${d.filedAt}`, due: worst, to: `/gov/disputes?focus=${d.id}` };
      }).filter((x) => x.due && x.due.rank <= 1);
      push('slaDisputes', 'Disputes breaching or near SLA', '/gov/disputes', items);
    }
    if (can('gov.complaints', 'update')) {
      const items = filterByMfi(grievances.filter((g) => g.mfiId), 'mfiId').concat(grievances.filter((g) => !g.mfiId))
        .filter((g) => !['Resolved', 'Closed'].includes(g.status)).map((g) => ({ key: g.id, title: g.subject, meta: `${g.id} · ${g.category} · ${g.status}`, due: dueInfo(g.sla), to: '/gov/complaints' }))
        .filter((x) => x.due && x.due.rank <= 1);
      push('complaints', 'Complaints past SLA', '/gov/complaints', items);
    }

    // Supervision: alerts to triage, cases due, information requests overdue.
    if (can('gov.ews', 'update')) {
      const items = filterByMfi(sup.alerts).filter((a) => a.status === 'New')
        .sort((a, b) => (SEVERITY_RANK[a.severity] ?? 9) - (SEVERITY_RANK[b.severity] ?? 9))
        .map((a) => ({ key: a.id, title: `${a.severity} alert · ${mfiName(a.mfiId)}${a.township ? ` · ${a.township}` : ''}`, meta: `${a.id} · rule ${a.ruleId} · raised ${a.raisedAt}`, due: { label: a.severity, tone: SEVERITY_RANK[a.severity] <= 1 ? 'red' : 'amber', rank: SEVERITY_RANK[a.severity] <= 1 ? 0 : 1 }, to: `/gov/ews?focus=${a.id}` }));
      push('alerts', 'New alerts to triage', '/gov/ews', items);
    }
    if (can('gov.cases', 'update')) {
      const items = filterByMfi(sup.cases).filter((c) => !c.closedAt && c.stage < 5 && (c.owner === user.name || slaDaysLeft(c.slaDue) <= 21))
        .map((c) => ({ key: c.id, title: c.title, meta: `${c.id} · owner ${c.owner}`, due: dueInfo(c.slaDue), to: `/gov/cases/${c.id}` }));
      push('cases', 'Cases due', '/gov/cases', items);
    }
    if (can('gov.infoRequests', 'update')) {
      const items = filterByMfi(sup.infoRequests).filter((r) => r.status === 'Sent' || r.status === 'Overdue')
        .map((r) => ({ key: r.id, title: r.subject, meta: `${r.id} · ${mfiName(r.mfiId)}`, due: dueInfo(r.dueAt, 'Reply due'), to: '/gov/info-requests' }))
        .filter((x) => x.due && x.due.rank <= 1);
      push('infoRequests', 'Information requests due', '/gov/info-requests', items);
    }

    // Platform operations.
    if (can('adm.system', 'update')) {
      const items = adminGet('systemJobs', JOBS).filter((j) => j.status === 'Failed')
        .map((j) => ({ key: j.id, title: `${j.name} failed`, meta: `${j.id} · last run ${j.lastRun}`, due: { label: 'Failed', tone: 'red', rank: 0 }, to: '/gov/admin/system?tab=jobs' }));
      push('jobs', 'Failed jobs', '/gov/admin/system?tab=jobs', items);
    }
    if (can('adm.dataQuality', 'update') || can('adm.dataQuality', 'approve')) {
      const items = adminGet('dqBatches', BATCHES).filter((b) => ['Failed', 'Awaiting approval'].includes(b.status))
        .map((b) => ({ key: b.id, title: `${b.mfi} ${b.period} batch · ${b.status.toLowerCase()}`, meta: `${b.id} · received ${b.receivedAt}`, due: { label: b.status, tone: b.status === 'Failed' ? 'red' : 'amber', rank: b.status === 'Failed' ? 0 : 1 }, to: '/gov/admin/data-quality' }));
      push('batches', 'Data batches to resolve', '/gov/admin/data-quality', items);
    }
    if (can('adm.identity', 'update')) {
      const items = adminGet('identityPairs', IDENTITY_PAIRS).filter((p) => p.status === 'Open' || (p.status === 'Pending checker' && p.decidedBy !== user.name && can('adm.identity', 'approve')))
        .map((p) => ({ key: p.id, title: `Possible duplicate · similarity ${p.score}`, meta: `${p.id} · ${p.status} · ${p.source}`, due: raised(p.detectedAt), to: `/gov/admin/identity?focus=${p.id}` }));
      push('identity', 'Identity matches to review', '/gov/admin/identity', items);
    }

    // Access management.
    if (can('adm.users', 'update')) {
      const users = adminGet('adminUsers', USER_SEED);
      const items = [
        ...approvals.filter((a) => a.status === 'Pending' && ACCESS_MODULES.test(a.module) && a.maker !== user.name && !(canPlatform && !blockReason(a, user, true)))
          .map((a) => ({ key: a.id, title: a.summary, meta: `${a.id} · waiting for ${roleName(a.checkerRole)}`, due: raised(a.createdAt), to: `/gov/admin/approvals?focus=${a.id}` })),
        ...users.filter((u) => u.status === 'Locked')
          .map((u) => ({ key: u.id, title: `Locked account · ${u.name}`, meta: `${u.id} · ${u.failedLogins ?? 0} failed sign-ins`, due: { label: 'Locked', tone: 'amber', rank: 1 }, to: '/gov/admin/iam/users?status=Locked' })),
      ];
      push('access', 'Access requests and locked accounts', '/gov/admin/iam/users', items);
    }

    // Data protection and billing.
    if (can('adm.compliance', 'update')) {
      const items = [
        ...adminGet('dsrs', DSRS).filter((r) => r.status !== 'Completed').map((r) => ({ key: r.id, title: `${r.type} request`, meta: `${r.id} · received ${r.received} · ${r.status}`, due: dueInfo(r.due), to: '/gov/admin/compliance?tab=dsr' })),
        ...adminGet('breaches', BREACHES).filter((b) => b.status !== 'Closed' && !b.regulatorNotified).map((b) => ({ key: b.id, title: b.title, meta: `${b.id} · ${b.severity} · ${b.status}`, due: { label: 'Assess now', tone: 'red', rank: 0 }, to: '/gov/admin/compliance?tab=breach' })),
      ].filter((x) => !x.due || x.due.rank <= 1);
      push('compliance', 'Data subject requests and breaches', '/gov/admin/compliance', items);
    }
    if (can('adm.billing', 'update')) {
      const items = PAYMENTS.filter((p) => p.status === 'Overdue')
        .map((p) => ({ key: p.invoice, title: `Overdue payment · ${p.invoice}`, meta: `${mfiName(p.mfiId)} · due ${p.dueDate}`, due: dueInfo(p.dueDate), to: '/gov/admin/billing' }));
      push('billing', 'Overdue invoices', '/gov/admin/billing', items);
    }

    const focus = ROLE_FOCUS[user.role] ?? [];
    q.forEach((queue) => {
      queue.items.sort((a, b) => (a.due?.rank ?? 3) - (b.due?.rank ?? 3) || (a.due?.sort ?? 0) - (b.due?.sort ?? 0));
      queue.urgent = queue.items.filter((i) => i.due?.rank === 0).length;
      queue.primary = focus.includes(queue.id);
      queue.focus = queue.primary ? focus.indexOf(queue.id) : focus.length;
    });
    return q.sort((a, b) => a.focus - b.focus);
  }, [user, role, can, approvals, announcements, reportRequests, disputes, grievances, institutions, sup, adminState, filterByMfi]);
}
