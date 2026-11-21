// Settling a withdrawal sent through RazorpayX, from the API's answer or its webhook. Safe to run twice.
import {notify} from '@pirento/shared/server';
import {Withdrawal} from '../models/Withdrawal.js';
import {move} from './move.js';
import {outcomeOf} from './payouts.js';

const rupees = (paise) => `₹${(paise / 100).toLocaleString('en-IN')}`;

/**
 * Applies a payout's status to its withdrawal. Every write is conditional on the withdrawal still being
 * 'processing', so a webhook that arrives twice, or races a "check again", changes nothing the second time.
 */
export async function settle(w, payout) {
  const outcome = outcomeOf(payout.status);
  const base = {_id: w._id, status: 'processing'};
  if (outcome === 'pending') {
    return Withdrawal.findOneAndUpdate(
      base,
      {$set: {'payout.id': payout.id, 'payout.status': payout.status}},
      {new: true},
    );
  }
  if (outcome === 'paid') {
    const done = await Withdrawal.findOneAndUpdate(
      base,
      {
        $set: {status: 'paid', utr: payout.utr ?? undefined, 'payout.id': payout.id, 'payout.status': payout.status},
        $unset: {open: 1},
      },
      {new: true},
    );
    if (done) {
      notify(w.userId, {
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
  const done = await Withdrawal.findOneAndUpdate(
    base,
    {$set: {status: 'rejected', reason, 'payout.id': payout.id, 'payout.status': payout.status}, $unset: {open: 1}},
    {new: true},
  );
  if (done) {
    notify(w.userId, {
      label: 'Withdrawal',
      big: 'Returned to your wallet',
      note: `The bank could not take it: ${reason}. The amount is back in your wallet.`,
    });
  }
  return done ?? (await Withdrawal.findById(w._id));
}
