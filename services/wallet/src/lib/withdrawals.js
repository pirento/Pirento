// Settling a withdrawal sent through RazorpayX, from the API's answer or its webhook. Safe to run twice.
import {notify} from '@pirento/shared/server';
import {query} from './db.js';
import {move} from './move.js';
import {outcomeOf} from './payouts.js';
import {withdrawal} from './rows.js';

const rupees = (paise) => `₹${(paise / 100).toLocaleString('en-IN')}`;

/** One conditional update: changes the row only while it is still 'processing'. Returns it, or null. */
async function whileProcessing(id, set, params) {
  const r = await query(
    `UPDATE withdrawals SET ${set}, updated_at = now() WHERE id = $1 AND status = 'processing' RETURNING *`,
    [id, ...params],
  );
  return withdrawal(r.rows[0]) ?? null;
}

export async function findWithdrawal(id) {
  return withdrawal((await query('SELECT * FROM withdrawals WHERE id = $1', [id])).rows[0]) ?? null;
}

/**
 * Applies a payout's status to its withdrawal. Every write is conditional on the withdrawal still being
 * 'processing', so a webhook that arrives twice, or races a "check again", changes nothing the second time.
 */
export async function settle(w, payout) {
  const outcome = outcomeOf(payout.status);
  if (outcome === 'pending') {
    return whileProcessing(w._id, 'payout_id = $2, payout_status = $3', [payout.id, payout.status]);
  }
  if (outcome === 'paid') {
    const done = await whileProcessing(w._id, `status = 'paid', utr = $2, payout_id = $3, payout_status = $4`, [
      payout.utr ?? null,
      payout.id,
      payout.status,
    ]);
    if (done) {
      notify(w.userId, {
        event: 'withdrawal.update',
        link: '/wallet',
        label: 'Withdrawal',
        big: 'Sent',
        note: `We sent ${rupees(w.amount)} to ${w.upi}.${payout.utr ? ` Bank reference (UTR): ${payout.utr}.` : ''}`,
      });
    }
    return done;
  }
  // Returned. A failed or reversed payout is final, so the money goes back first (at most once, by its ref),
  // then the request closes. If we stop between the two, the next webhook or check finishes the job.
  if (w.status !== 'processing') return w;
  const reason = (payout.status_details?.description ?? payout.failure_reason ?? `Payout ${payout.status}`).slice(
    0,
    200,
  );
  await move(w.userId, 'credit', w.amount, `Withdrawal returned: ${reason}`, `wd-${w._id}-back`);
  const done = await whileProcessing(w._id, `status = 'rejected', reason = $2, payout_id = $3, payout_status = $4`, [
    reason,
    payout.id,
    payout.status,
  ]);
  if (done) {
    notify(w.userId, {
      event: 'withdrawal.update',
      link: '/wallet',
      label: 'Withdrawal',
      big: 'Returned to your wallet',
      note: `The bank could not take it: ${reason}. The amount is back in your wallet.`,
    });
  }
  return done ?? (await findWithdrawal(w._id));
}
