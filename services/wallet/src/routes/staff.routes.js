// Finance: the ledger, one person's wallet, adjustments and withdrawals.
import {Router} from 'express';
import crypto from 'node:crypto';
import {z} from 'zod';
import {
  ACCESS,
  audit,
  badInput,
  conflict,
  notFound,
  notify,
  requireAuth,
  requireRole,
  validate,
} from '@pirento/shared/server';
import {query} from '../lib/db.js';
import {balanceOf, move} from '../lib/move.js';
import {toPaise} from '../lib/money.js';
import {TX_COLUMNS, transaction, withdrawal} from '../lib/rows.js';
import {PayoutRefused, createPayout, fetchPayout, payoutConfig} from '../lib/payouts.js';
import {findWithdrawal, settle} from '../lib/withdrawals.js';

const WITHDRAWAL_STATUSES = ['requested', 'processing', 'paid', 'rejected'];
const isWithdrawalId = (id) => /^[a-f0-9]{24}$/.test(String(id));

export const staffRoutes = Router();
staffRoutes.use('/staff', requireAuth, requireRole(...ACCESS.payments, 'support'));

/** Latest movements, optionally only credits or debits, plus the totals held. */
staffRoutes.get('/staff/transactions', requireRole(...ACCESS.payments), async (req, res) => {
  const type = ['credit', 'debit'].includes(req.query.type) ? req.query.type : null;
  const [rows, held] = await Promise.all([
    query(
      `SELECT ${TX_COLUMNS} FROM transactions ${type ? 'WHERE type = $1' : ''} ORDER BY created_at DESC, id DESC LIMIT 200`,
      type ? [type] : [],
    ),
    query('SELECT COALESCE(SUM(balance), 0) AS total, COUNT(*) AS wallets FROM wallets'),
  ]);
  res.json({
    data: {transactions: rows.rows.map(transaction), held: held.rows[0].total, wallets: held.rows[0].wallets},
  });
});

/** One person's balance and history, for the admin user page (support may look, not move money). */
staffRoutes.get('/staff/user/:userId', async (req, res) => {
  const [{balance}, rows] = await Promise.all([
    balanceOf(req.params.userId),
    query(`SELECT ${TX_COLUMNS} FROM transactions WHERE user_id = $1 ORDER BY created_at DESC, id DESC LIMIT 50`, [
      req.params.userId,
    ]),
  ]);
  res.json({data: {balance, transactions: rows.rows.map(transaction)}});
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
  const r = await query('SELECT * FROM withdrawals WHERE status = $1 ORDER BY created_at LIMIT 200', [status]);
  res.json({data: r.rows.map(withdrawal)});
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
    if (!isWithdrawalId(req.params.id)) throw notFound('Withdrawal not found');
    if (decision === 'paid' && !utr) throw badInput('Enter the UTR of the payment you sent');
    if (decision === 'rejected' && !reason) throw badInput('Tell the customer why');
    // Conditional on 'requested', so a double click cannot pay or refund twice.
    const doc = withdrawal(
      (
        await query(
          `UPDATE withdrawals SET status = $2, utr = $3, reason = $4, decided_by = $5, decided_at = now(), updated_at = now()
           WHERE id = $1 AND status = 'requested' RETURNING *`,
          [req.params.id, decision, utr || null, reason || null, req.user.email],
        )
      ).rows[0],
    );
    if (!doc) throw conflict('CHANGED', 'This withdrawal was already handled');
    if (decision === 'rejected') {
      await move(doc.userId, 'credit', doc.amount, `Withdrawal returned: ${reason}`, `wd-${doc._id}-back`);
    }
    audit(req, `withdrawal.${decision}`, doc.email, decision === 'paid' ? `UTR ${utr}` : reason);
    notify(doc.userId, {
      event: 'withdrawal.update',
      link: '/wallet',
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
  if (!isWithdrawalId(req.params.id)) throw notFound('Withdrawal not found');
  const w = withdrawal(
    (
      await query(
        `UPDATE withdrawals SET status = 'processing', decided_by = $2, decided_at = now(), payout_id = NULL,
         payout_status = 'sending', payout_error = NULL, updated_at = now()
         WHERE id = $1 AND status = 'requested' RETURNING *`,
        [req.params.id, req.user.email],
      )
    ).rows[0],
  );
  if (!w) throw conflict('CHANGED', 'This withdrawal was already handled');
  audit(req, 'withdrawal.payout', w.email, `₹${w.amount / 100} → ${w.upi}`);
  res.json({data: await send(cfg, w)});
});

/** Asks RazorpayX again: for a payout whose webhook never came, or a send whose answer was lost. */
staffRoutes.post('/staff/withdrawals/:id/check', finance, async (req, res) => {
  const cfg = payoutConfig();
  if (!cfg) throw badInput('Payouts through the API are not set up');
  const found = isWithdrawalId(req.params.id) && (await findWithdrawal(req.params.id));
  const w = found?.status === 'processing' ? found : null;
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
      const r = await query(
        `UPDATE withdrawals SET status = 'requested', payout_status = 'refused', payout_error = $2, updated_at = now()
         WHERE id = $1 AND status = 'processing' AND payout_id IS NULL RETURNING *`,
        [w._id, err.message.slice(0, 200)],
      );
      return withdrawal(r.rows[0]) ?? findWithdrawal(w._id);
    }
    // Unknown (timeout, 5xx): it may exist. It stays processing; "check again" asks with the same key.
    const r = await query('UPDATE withdrawals SET payout_error = $2, updated_at = now() WHERE id = $1 RETURNING *', [
      w._id,
      err.message.slice(0, 200),
    ]);
    return withdrawal(r.rows[0]);
  }
}
