// The signed-in person's wallet: balance and history. Adding money is in topup.routes.js.
import {Router} from 'express';
import {requireAuth} from '@pirento/shared/server';
import {Wallet} from '../models/Wallet.js';
import {Transaction} from '../models/Transaction.js';

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
