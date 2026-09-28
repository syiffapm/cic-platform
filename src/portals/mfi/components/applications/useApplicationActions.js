import { useStore } from '@/context/StoreContext';
import { DECLINE_REASONS } from '@/data/seed';
import { formatMMK } from '@/lib/format';
import { getBorrowerFile } from '../../data/borrowers';
import { useTenant } from '../MfiState';
import { SECOND_APPROVAL_LIMIT, isoDate, newLoanId, stampNow } from './appUtils';

/** A registered applicant who is not yet in the registry still gets a (no-hit) file. */
export function applicantFile(app, store) {
  return getBorrowerFile(app.borrowerId, store) ?? {
    borrowerId: app.borrowerId, nameEn: app.applicant.name, nameMm: '', nrc: app.applicant.nrc, previousNrc: null, dob: '', gender: '', fatherName: '',
    phone: app.applicant.phone, township: app.applicant.township, region: '', address: '', occupation: app.applicant.occupation, householdSize: null,
    loans: [], guarantees: [], noHit: true,
  };
}

/** All state changes on a loan application (report purchases go through reportAccess/usePurchaseReport). Each one appends to the case history and to the audit trail. */
export default function useApplicationActions(app) {
  const store = useStore();
  const { add, patch, logAudit } = store;
  const { user, tenant, institution, can } = useTenant();
  const short = institution?.short ?? 'PGMF';
  const by = `${user.name} (${short})`;
  const actor = { actor: user.name, role: user.role, tenant };

  const step = (changes, action) => patch('loanApplications', app.id, (a) => ({
    ...(typeof changes === 'function' ? changes(a) : changes),
    history: [...a.history, { at: stampNow(), by, action }],
  }));

  /** Approve. Amounts above the second-approval limit wait for an MFI Administrator. */
  const approve = ({ approvedAmount, rate, tenor, note }) => {
    const decision = { by: user.name, at: stampNow(), outcome: 'Approved', approvedAmount, rate, tenor, note };
    const terms = `${formatMMK(approvedAmount)}, ${tenor} months, ${rate}% p.a.`;
    if (approvedAmount > SECOND_APPROVAL_LIMIT && !can('mfi.applications', 'approve')) {
      step({ pendingApproval: { ...decision, makerId: user.id } }, `Approval recommended: ${terms} — awaiting second approver`);
      logAudit({ ...actor, action: 'LOAN_APPROVAL_RECOMMENDED', module: 'Loan applications', target: app.id, outcome: 'Pending' });
      return 'pending';
    }
    step({ status: 'Approved', decision, pendingApproval: null }, `Approved: ${terms}`);
    logAudit({ ...actor, action: 'LOAN_APPROVED', module: 'Loan applications', target: app.id, outcome: 'Success' });
    return 'approved';
  };

  /** Second approver confirms (or returns) a recommendation above the limit. Makers cannot confirm their own. */
  const confirmSecond = (accept) => {
    const p = app.pendingApproval;
    if (!p || p.makerId === user.id || !can('mfi.applications', 'approve')) return;
    if (accept) {
      step({ status: 'Approved', decision: { ...p, by: `${p.by} / ${user.name}`, at: stampNow(), checker: user.name }, pendingApproval: null }, `Second approval given — approved ${formatMMK(p.approvedAmount)}`);
      logAudit({ ...actor, action: 'LOAN_APPROVAL_CONFIRMED', module: 'Loan applications', target: app.id, outcome: 'Success' });
    } else {
      step({ pendingApproval: null }, 'Recommendation returned to credit officer by second approver');
      logAudit({ ...actor, action: 'LOAN_APPROVAL_RETURNED', module: 'Loan applications', target: app.id, outcome: 'Returned' });
    }
  };

  const decline = ({ reasonCode, note }) => {
    const reason = DECLINE_REASONS.find((r) => r.code === reasonCode)?.label ?? reasonCode;
    step({ status: 'Rejected', pendingApproval: null, decision: { by: user.name, at: stampNow(), outcome: 'Rejected', reasonCode, reason, note } }, `Declined — ${reason}`);
    logAudit({ ...actor, action: 'LOAN_DECLINED', module: 'Loan applications', target: app.id, outcome: 'Success' });
  };

  /** Disburse an approved loan and report it to the CIC registry the same day. */
  const disburse = ({ method }) => {
    if (!can('mfi.applications', 'approve')) return null;
    const d = app.decision;
    const today = isoDate();
    const loanId = newLoanId(short);
    add('reportedLoans', {
      id: loanId, borrowerId: app.borrowerId, loanId, mfiId: tenant, product: app.product, role: 'Borrower', disbursed: today, amount: d.approvedAmount,
      tenor: d.tenor, rate: d.rate, frequency: 'Monthly', outstanding: d.approvedAmount, dpd: 0, maxDpd12: 0, status: 'Active', classification: 'Standard',
      dataDate: today, history: '.......................0', applicationId: app.id, disbursementMethod: method,
    });
    step({ status: 'Disbursed', loanId, disbursedAt: stampNow(), disbursementMethod: method }, `Loan disbursed and reported to CIC — ${loanId} (${method})`);
    logAudit({ ...actor, action: 'LOAN_DISBURSED_REPORTED', module: 'Loan applications', target: `${app.id} → ${loanId}`, outcome: 'Success' });
    return loanId;
  };

  return { approve, confirmSecond, decline, disburse, logView: (reportId) => logAudit({ ...actor, action: 'REPORT_VIEW', module: 'Inquiry', target: reportId ?? app.inquiryId, purpose: 'NL', outcome: 'Success' }) };
}
