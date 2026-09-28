import { useCallback } from 'react';
import { patchIn, nowStamp, useMfi } from './MfiState';

/**
 * Tracks the asynchronous ingestion pipeline (receive → validate → load).
 * steps: [{ status, delay (ms), extra? }] applied in sequence to the batch.
 */
export function usePipeline() {
  const { update } = useMfi();
  return useCallback((batchId, steps) => {
    let wait = 0;
    steps.forEach((s) => {
      wait += s.delay;
      setTimeout(() => update('batches', patchIn(batchId, { status: s.status, ...(typeof s.extra === 'function' ? s.extra() : s.extra) })), wait);
    });
  }, [update]);
}

export const receiptExtra = (batch) => () => ({
  receiptNo: `RCP-${batch.id.replace('BAT-', '')}`,
  loadedAt: nowStamp(),
});

/** Template columns from requirements §6.3 (submission data set). v3.2 adds guarantor_nrc and household_size. */
export function templateColumns(schema) {
  const cols = [
    'nrc', 'previous_nrc', 'full_name_mm', 'full_name_en', 'dob', 'gender', 'phone', 'address_state', 'address_township', 'address_ward', 'occupation', 'household_size',
    'loan_id', 'product_type', 'disbursement_date', 'amount_mmk', 'tenor_months', 'interest_rate', 'instalment_frequency', 'outstanding_mmk', 'dpd', 'loan_status', 'classification', 'write_off_amount', 'closure_date',
    'group_id', 'member_role', 'guarantor_nrc', 'guarantee_amount',
    'repayment_period', 'amount_due', 'amount_paid', 'date_paid',
  ];
  return schema === 'v3.1' ? cols.filter((c) => c !== 'guarantor_nrc' && c !== 'household_size') : cols;
}

/** Header-only CSV template for the chosen schema (guidance is shown in the portal, not inside the file). */
export function templateCsv(schema) {
  return `${templateColumns(schema).join(',')}\n`;
}
