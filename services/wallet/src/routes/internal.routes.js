// Called by other services (orders, and auth when an account is deleted) only, never by a browser.
import {Router} from 'express';
import {z} from 'zod';
import {conflict, requireInternal, validate} from '@pirento/shared/server';
import {move} from '../lib/move.js';
import {Wallet} from '../models/Wallet.js';
import {Withdrawal} from '../models/Withdrawal.js';

export const internalRoutes = Router();
internalRoutes.use('/internal', requireInternal);

/** Account deletion: withdrawal requests keep their amounts, but lose the email and UPI ID. */
internalRoutes.post('/internal/forget', validate(z.object({userId: z.string().min(1).max(40)})), async (req, res) => {
  const {userId} = req.body;
  if (await Withdrawal.exists({userId, status: 'requested'})) {
    throw conflict('WITHDRAWAL_OPEN', 'A withdrawal is still being paid out. Finish it before deleting.');
  }
  await Withdrawal.updateMany({userId}, {$set: {email: `deleted-${userId}@deleted.invalid`, upi: 'removed'}});
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
    const wallet = await move(userId, type, amount, note, ref);
    res.json({data: {balance: wallet.balance}});
  });
}

/** A balance, so auth can refuse to delete an account that still holds money. */
internalRoutes.post('/internal/balance', validate(z.object({userId: z.string().min(1)})), async (req, res) => {
  const wallet = await Wallet.findOne({userId: req.body.userId});
  res.json({data: {balance: wallet?.balance ?? 0}});
});
