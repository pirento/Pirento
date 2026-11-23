// Called by other services only. Account deletion: refused while the person holds credits or is owed a sale.
import {Router} from 'express';
import {z} from 'zod';
import {conflict, requireInternal, validate} from '@pirento/shared/server';
import {Claim} from '../models/Claim.js';
import {Holding} from '../models/Holding.js';
import {Trade} from '../models/Trade.js';

export const internalRoutes = Router();
internalRoutes.use('/internal', requireInternal);

internalRoutes.post('/internal/forget', validate(z.object({userId: z.string().min(1).max(40)})), async (req, res) => {
  const {userId} = req.body;
  if (await Holding.exists({userId, units: {$gt: 0}}))
    throw conflict('CREDITS_HELD', 'Sell your carbon credits before deleting the account.');
  if (await Trade.exists({userId, status: {$in: ['pending', 'owed']}}))
    throw conflict('TRADE_OPEN', 'A carbon credit trade is still being settled. Try again shortly.');
  // Trades stay as the market's ledger, tied only to the anonymous account id.
  await Promise.all([Holding.deleteMany({userId}), Claim.deleteMany({userId})]);
  res.json({data: {forgotten: true}});
});
