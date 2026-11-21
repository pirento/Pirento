// Finance: the ledger, one person's wallet, adjustments and withdrawals.
import {Router} from 'express';
import crypto from 'node:crypto';
import {z} from 'zod';
import {
  ACCESS,
  audit,
  badInput,
  conflict,
  isId,
  notFound,
  notify,
  requireAuth,
  requireRole,
  validate,
} from '@pirento/shared/server';
import {WITHDRAWAL_STATUSES, Withdrawal} from '../models/Withdrawal.js';
import {move} from '../lib/move.js';
import {toPaise} from '../lib/money.js';
import {Transaction} from '../models/Transaction.js';
import {Wallet} from '../models/Wallet.js';
import {PayoutRefused, createPayout, fetchPayout, payoutConfig} from '../lib/payouts.js';
import {settle} from '../lib/withdrawals.js';

export const staffRoutes = Router();
staffRoutes.use('/staff', requireAuth, requireRole(...ACCESS.payments, 'support'));

/** Latest movements, optionally only credits or debits, plus the totals held. */
staffRoutes.get('/staff/transactions', requireRole(...ACCESS.payments), async (req, res) => {
  const filter = ['credit', 'debit'].includes(req.query.type) ? {type: req.query.type} : {};
  const [transactions, held] = await Promise.all([
    Transaction.find(filter, {ref: 0}).sort({createdAt: -1}).limit(200),
    Wallet.aggregate([{$group: {_id: null, total: {$sum: '$balance'}, wallets: {$sum: 1}}}]),
  ]);
  res.json({data: {transactions, held: held[0]?.total ?? 0, wallets: held[0]?.wallets ?? 0}});
});

/** One person's balance and history, for the admin user page (support may look, not move money). */
staffRoutes.get('/staff/user/:userId', async (req, res) => {
  const [wallet, transactions] = await Promise.all([
    Wallet.findOne({userId: req.params.userId}),
    Transaction.find({userId: req.params.userId}, {ref: 0}).sort({createdAt: -1}).limit(50),
  ]);
  res.json({data: {balance: wallet?.balance ?? 0, transactions}});
});

const finance = requireRole(...ACCESS.payments);

/** A manual credit or debit with a reason, e.g. a goodwill credit or a correction. */
staffRoutes.post(
  '/staff/adjust',
  finance,
  validate(
    z.object({
      userId: z.string().min(1).max(40),
      type: z.enum(['credit', 'debit']),
      amount: z.number().positive().max(100000),
      reason: z.string().trim().min(3, 'Give a reason').max(120),
    }),
  ),
  async (req, res) => {
    const {userId, type, amount, reason} = req.body;
    const paise = toPaise(amount);
    const wallet = await move(userId, type, paise, `Adjustment: ${reason}`, `adj-${crypto.randomUUID()}`);
    audit(req, `wallet.${type}`, userId, `₹${amount} · ${reason}`);
    res.json({data: {balance: wallet.balance}});
  },
);

staffRoutes.get('/staff/withdrawals', finance, async (req, res) => {
  const status = WITHDRAWAL_STATUSES.includes(req.query.status) ? req.query.status : 'requested';
  res.json({data: await Withdrawal.find({status}).sort({createdAt: 1}).limit(200)});
});

staffRoutes.patch(
  '/staff/withdrawals/:id',
  finance,
  validate(
    z.object({
      decision: z.enum(['paid', 'rejected']),
      utr: z.string().trim().max(40).default(''),
      reason: z.string().trim().max(200).default(''),
    }),
  ),
  async (req, res) => {
    const {decision, utr, reason} = req.body;
    if (!isId(req.params.id)) throw notFound('Withdrawal not found');
    if (decision === 'paid' && !utr) throw badInput('Enter the UTR of the payment you sent');
    if (decision === 'rejected' && !reason) throw badInput('Tell the customer why');
    // Conditional on 'requested', so a double click cannot pay or refund twice.
    const doc = await Withdrawal.findOneAndUpdate(
      {_id: req.params.id, status: 'requested'},
      {
        $set: {
          status: decision,
          utr: utr || undefined,
          reason: reason || undefined,
          decidedBy: req.user.email,
          decidedAt: new Date(),
        },
        $unset: {open: 1},
      },
      {new: true},
    );
    if (!doc) throw conflict('CHANGED', 'This withdrawal was already handled');
    if (decision === 'rejected') {
      await move(doc.userId, 'credit', doc.amount, `Withdrawal returned: ${reason}`, `wd-${doc._id}-back`);
    }
    audit(req, `withdrawal.${decision}`, doc.email, decision === 'paid' ? `UTR ${utr}` : reason);
    notify(doc.userId, {
      label: 'Withdrawal',
      big: decision === 'paid' ? 'Sent' : 'Returned to your wallet',
      note:
        decision === 'paid'
          ? `We sent ₹${(doc.amount / 100).toLocaleString('en-IN')} to your account. Bank reference (UTR): ${utr}.`
          : `We could not send it: ${reason}. The amount is back in your wallet.`,
    });
    res.json({data: doc});
  },
);

/** Whether withdrawals can be sent through RazorpayX here, so the admin shows the button. */
staffRoutes.get('/staff/payouts/config', finance, (_req, res) => res.json({data: {enabled: Boolean(payoutConfig())}}));

/**
 * Sends a withdrawal through RazorpayX. One conditional update claims it (requested → processing), so two
 * clicks or two staffers cannot both send it; the payout's idempotency key makes a repeated call harmless.
 */
staffRoutes.post('/staff/withdrawals/:id/payout', finance, async (req, res) => {
  const cfg = payoutConfig();
  if (!cfg) throw badInput('Payouts through the API are not set up; send it by hand and note the UTR');
  if (!isId(req.params.id)) throw notFound('Withdrawal not found');
  const w = await Withdrawal.findOneAndUpdate(
    {_id: req.params.id, status: 'requested'},
    {$set: {status: 'processing', decidedBy: req.user.email, decidedAt: new Date(), payout: {status: 'sending'}}},
    {new: true},
  );
  if (!w) throw conflict('CHANGED', 'This withdrawal was already handled');
  audit(req, 'withdrawal.payout', w.email, `₹${w.amount / 100} → ${w.upi}`);
  res.json({data: await send(cfg, w)});
});

/** Asks RazorpayX again: for a payout whose webhook never came, or a send whose answer was lost. */
staffRoutes.post('/staff/withdrawals/:id/check', finance, async (req, res) => {
  const cfg = payoutConfig();
  if (!cfg) throw badInput('Payouts through the API are not set up');
  const w = isId(req.params.id) && (await Withdrawal.findOne({_id: req.params.id, status: 'processing'}));
  if (!w) throw notFound('No payout on its way with this id');
  if (!w.payout?.id) return res.json({data: await send(cfg, w)}); // same idempotency key: never a second payout
  try {
    res.json({data: await settle(w, await fetchPayout(cfg, w.payout.id))});
  } catch (err) {
    throw conflict('UPSTREAM', err.message);
  }
});

/** Calls RazorpayX and records what it said. A clear refusal hands the request back to finance. */
async function send(cfg, w) {
  try {
    return await settle(w, await createPayout(cfg, w));
  } catch (err) {
    if (err instanceof PayoutRefused) {
      // Nothing was created, so the request goes back to "to pay" with the reason, still debited and open.
      return Withdrawal.findOneAndUpdate(
        {_id: w._id, status: 'processing', 'payout.id': {$exists: false}},
        {$set: {status: 'requested', 'payout.status': 'refused', 'payout.error': err.message.slice(0, 200)}},
        {new: true},
      );
    }
    // Unknown (timeout, 5xx): it may exist. It stays processing; "check again" asks with the same key.
    return Withdrawal.findByIdAndUpdate(w._id, {$set: {'payout.error': err.message.slice(0, 200)}}, {new: true});
  }
}
