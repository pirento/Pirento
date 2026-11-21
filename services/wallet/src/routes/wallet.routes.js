// The signed-in person's wallet: balance, history, and (for now) test top-ups.
import {Router} from 'express';
import {z} from 'zod';
import {ApiError, requireAuth, validate} from '@pirento/shared/server';
import {config} from '../config.js';
import {Wallet} from '../models/Wallet.js';
import {Transaction} from '../models/Transaction.js';
import {move} from '../lib/move.js';
import {toPaise} from '../lib/money.js';

export const walletRoutes = Router();
walletRoutes.use(requireAuth);

walletRoutes.get('/', async (req, res) => {
  const [wallet, transactions] = await Promise.all([
    Wallet.findOne({userId: req.user.sub}),
    // The dashboard needs the latest few; the payment history page asks for more (?limit, at most 500).
    Transaction.find({userId: req.user.sub}, {ref: 0})
      .sort({createdAt: -1})
      .limit(Math.min(Math.max(Number(req.query.limit) || 50, 1), 500)),
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
