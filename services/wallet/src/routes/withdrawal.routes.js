// The customer's side: ask to withdraw, and see past requests.
import {Router} from 'express';
import {z} from 'zod';
import {conflict, requireAuth, validate} from '@pirento/shared/server';
import {Withdrawal} from '../models/Withdrawal.js';
import {move} from '../lib/move.js';
import {toPaise} from '../lib/money.js';

export const withdrawalRoutes = Router();
withdrawalRoutes.use('/withdrawals', requireAuth);

const MIN_RUPEES = 100;

withdrawalRoutes.get('/withdrawals', async (req, res) => {
  res.json({data: await Withdrawal.find({userId: req.user.sub}).sort({createdAt: -1}).limit(50)});
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
    // One open request at a time keeps the queue honest and the money easy to follow.
    if (await Withdrawal.exists({userId: req.user.sub, status: 'requested'})) {
      throw conflict('OPEN_REQUEST', 'You already have a withdrawal waiting. Wait for it to finish.');
    }
    const amount = toPaise(req.body.amount);
    const doc = new Withdrawal({userId: req.user.sub, email: req.user.email, amount, upi: req.body.upi});
    // Debit first, keyed on the request id: a failed debit leaves no request behind.
    await move(req.user.sub, 'debit', amount, `Withdrawal to ${doc.upi}`, `wd-${doc._id}`);
    await doc.save();
    res.status(201).json({data: doc});
  },
);
