import {Router} from 'express';
import {z} from 'zod';
import {requireInternal, validate} from '@pirento/shared/server';
import {move} from '../lib/move.js';
import {Wallet} from '../models/Wallet.js';

// Called by other services (orders) only, never by a browser.
export const internalRoutes = Router();
internalRoutes.use('/internal', requireInternal);

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
