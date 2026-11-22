// The signed-in person's wallet: balance and history. Adding money is in topup.routes.js.
import {Router} from 'express';
import {requireAuth} from '@pirento/shared/server';
import {query} from '../lib/db.js';
import {balanceOf} from '../lib/move.js';
import {TX_COLUMNS, transaction} from '../lib/rows.js';

export const walletRoutes = Router();
walletRoutes.use(requireAuth);

walletRoutes.get('/', async (req, res) => {
  // The dashboard needs the latest few; the payment history page asks for more (?limit, at most 500).
  const limit = Math.min(Math.max(Number(req.query.limit) || 50, 1), 500);
  const [{balance}, rows] = await Promise.all([
    balanceOf(req.user.sub),
    query(`SELECT ${TX_COLUMNS} FROM transactions WHERE user_id = $1 ORDER BY created_at DESC, id DESC LIMIT $2`, [
      req.user.sub,
      limit,
    ]),
  ]);
  res.json({data: {balance, transactions: rows.rows.map(transaction)}});
});
