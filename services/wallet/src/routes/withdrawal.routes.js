// The customer's side: ask to withdraw, and see past requests.
import {Router} from 'express';
import {z} from 'zod';
import {conflict, requireAuth, validate} from '@pirento/shared/server';
import {newId, query} from '../lib/db.js';
import {move} from '../lib/move.js';
import {toPaise} from '../lib/money.js';
import {withdrawal} from '../lib/rows.js';

export const withdrawalRoutes = Router();
withdrawalRoutes.use('/withdrawals', requireAuth);

const MIN_RUPEES = 100;

withdrawalRoutes.get('/withdrawals', async (req, res) => {
  const r = await query('SELECT * FROM withdrawals WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50', [
    req.user.sub,
  ]);
  res.json({data: r.rows.map(withdrawal)});
});

withdrawalRoutes.post(
  '/withdrawals',
  validate(
    z.object({
      amount: z.number().min(MIN_RUPEES, `The smallest withdrawal is ₹${MIN_RUPEES}`).max(200000),
      upi: z
        .string()
        .trim()
        .toLowerCase()
        .regex(/^[a-z0-9._-]{2,40}@[a-z][a-z0-9.-]{1,20}$/, 'Enter a UPI ID like name@bank'),
    }),
  ),
  async (req, res) => {
    const amount = toPaise(req.body.amount);
    const id = newId();
    // Save first: the database allows one open request per person, so a second click stops here.
    let row;
    try {
      row = (
        await query(
          'INSERT INTO withdrawals (id, user_id, email, amount, upi) VALUES ($1, $2, $3, $4, $5) RETURNING *',
          [id, req.user.sub, req.user.email, amount, req.body.upi],
        )
      ).rows[0];
    } catch (err) {
      if (err.code === '23505')
        throw conflict('OPEN_REQUEST', 'You already have a withdrawal waiting. Wait for it to finish.');
      throw err;
    }
    // Then the debit, keyed on the request id. If it fails (too little money), the request goes too.
    try {
      await move(req.user.sub, 'debit', amount, `Withdrawal to ${row.upi}`, `wd-${id}`);
    } catch (err) {
      await query('DELETE FROM withdrawals WHERE id = $1', [id]);
      throw err;
    }
    res.status(201).json({data: withdrawal(row)});
  },
);
