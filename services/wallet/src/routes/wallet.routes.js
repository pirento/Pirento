import {Router} from 'express';
import {z} from 'zod';
import {ApiError, requireAuth, validate} from '@pirento/shared/server';
import {config} from '../config.js';
import {Wallet} from '../models/Wallet.js';
import {Transaction} from '../models/Transaction.js';
import {move} from '../lib/move.js';
import {toPaise} from '../lib/money.js';

// The signed-in person's wallet: balance, history, and (for now) test top-ups.
export const walletRoutes = Router();
walletRoutes.use(requireAuth);

walletRoutes.get('/', async (req, res) => {
  const [wallet, transactions] = await Promise.all([
    Wallet.findOne({userId: req.user.sub}),
    Transaction.find({userId: req.user.sub}, {ref: 0}).sort({createdAt: -1}).limit(50),
  ]);
  res.json({data: {balance: wallet?.balance ?? 0, transactions}});
});

// shortcut: test money with no payment gateway; replace with a Razorpay top-up before launch.
walletRoutes.post('/topup', validate(z.object({amount: z.number().positive().max(100000)})), async (req, res) => {
  if (!config.testTopupAllowed()) {
    throw new ApiError(403, 'PAYMENTS_UNAVAILABLE', 'Top-up opens when payments go live');
  }
  const wallet = await move(req.user.sub, 'credit', toPaise(req.body.amount), 'Test top-up');
  res.json({data: {balance: wallet.balance}});
});
