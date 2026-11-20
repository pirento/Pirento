import {Router} from 'express';
import {ACCESS, requireAuth, requireRole} from '@pirento/shared/server';
import {Transaction} from '../models/Transaction.js';
import {Wallet} from '../models/Wallet.js';

// Finance: the ledger across every account, and one person's wallet.
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
