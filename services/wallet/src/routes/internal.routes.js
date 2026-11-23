// Called by other services (orders, learning, identity, and auth when an account is deleted) only, never by a browser.
import {Router} from 'express';
import {z} from 'zod';
import {conflict, requireInternal, validate} from '@pirento/shared/server';
import {query} from '../lib/db.js';
import {balanceOf, move} from '../lib/move.js';

export const internalRoutes = Router();
internalRoutes.use('/internal', requireInternal);

/** Account deletion: withdrawal requests keep their amounts, but lose the email and UPI ID. */
internalRoutes.post('/internal/forget', validate(z.object({userId: z.string().min(1).max(40)})), async (req, res) => {
  const {userId} = req.body;
  // 'processing' too: a payout already sent through RazorpayX can still come back and need crediting.
  const open = await query(`SELECT 1 FROM withdrawals WHERE user_id = $1 AND status IN ('requested', 'processing')`, [
    userId,
  ]);
  if (open.rowCount)
    throw conflict('WITHDRAWAL_OPEN', 'A withdrawal is still being paid out. Finish it before deleting.');
  await query(`UPDATE withdrawals SET email = $2, upi = 'removed', updated_at = now() WHERE user_id = $1`, [
    userId,
    `deleted-${userId}@deleted.invalid`,
  ]);
  res.json({data: {forgotten: true}});
});

const moveBody = z.object({
  userId: z.string().min(1),
  amount: z.number().int().positive(), // paise
  ref: z.string().min(1).max(80),
  note: z.string().max(140),
});

for (const type of ['debit', 'credit']) {
  internalRoutes.post(`/internal/${type}`, validate(moveBody), async (req, res) => {
    const {userId, amount, ref, note} = req.body;
    res.json({data: await move(userId, type, amount, note, ref)});
  });
}

/** A balance, so auth can refuse to delete an account that still holds money. */
internalRoutes.post('/internal/balance', validate(z.object({userId: z.string().min(1)})), async (req, res) => {
  res.json({data: await balanceOf(req.body.userId)});
});

/** Pirento AI's look at a person's own wallet: the balance and the last few movements, nothing else. */
internalRoutes.post(
  '/internal/assistant',
  validate(z.object({userId: z.string().min(1).max(40)})),
  async (req, res) => {
    const [{balance}, rows] = await Promise.all([
      balanceOf(req.body.userId),
      query(
        'SELECT type, amount, note, created_at FROM transactions WHERE user_id = $1 ORDER BY created_at DESC LIMIT 5',
        [req.body.userId],
      ),
    ]);
    res.json({
      data: {
        balanceRupees: balance / 100,
        recent: rows.rows.map((t) => ({type: t.type, rupees: t.amount / 100, note: t.note, at: t.created_at})),
      },
    });
  },
);

/** Pirento AI's admin answers (finance): withdrawals by status with amounts, and the money held in wallets. */
internalRoutes.post('/internal/staff-summary', validate(z.object({}).passthrough()), async (_req, res) => {
  const [w, held] = await Promise.all([
    query(`SELECT status, COUNT(*) AS n, COALESCE(SUM(amount), 0) AS paise FROM withdrawals GROUP BY status`),
    query('SELECT COALESCE(SUM(balance), 0) AS paise, COUNT(*) AS wallets FROM wallets'),
  ]);
  res.json({
    data: {
      withdrawals: w.rows.map((r) => ({status: r.status, count: r.n, rupees: r.paise / 100})),
      heldRupees: held.rows[0].paise / 100,
      wallets: held.rows[0].wallets,
    },
  });
});
