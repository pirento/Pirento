// A signed-in person's side of the market: their credits, trades and trees, buying, selling and claiming.
import {Router} from 'express';
import {z} from 'zod';
import {ApiError, badInput, callService, conflict, notFound, validate} from '@pirento/shared/server';
import {config} from '../config.js';
import {costOf, credits, grownUnits} from '../lib/credits.js';
import {debit, payOwed} from '../lib/money.js';
import {Claim} from '../models/Claim.js';
import {Holding} from '../models/Holding.js';
import {market} from '../models/Market.js';
import {Trade} from '../models/Trade.js';
import {tradingOpen} from './market.routes.js';

export const tradeRoutes = Router();

const treesOf = (userId) => callService(config.ordersUrl, '/internal/green-trees', {userId});

/** Each planted sponsorship with the credits it has grown since its last claim. */
async function growing(userId, rates) {
  const trees = await treesOf(userId);
  const claims = await Claim.find({orderId: {$in: trees.map((t) => t.orderId)}}).lean();
  return trees.map((t) => {
    const c = claims.find((x) => x.orderId === t.orderId);
    const rate = rates[t.slug] ?? 0;
    const from = c?.lastClaimAt ?? t.plantedAt;
    return {...t, rate, claimedUnits: c?.claimedUnits ?? 0, growingUnits: grownUnits(t.trees, rate, from)};
  });
}

tradeRoutes.get('/me', async (req, res) => {
  const userId = req.user.sub;
  await payOwed(userId);
  const m = await market();
  const [holding, trades, trees] = await Promise.all([
    Holding.findOne({userId}).lean(),
    Trade.find({userId}).sort({createdAt: -1}).limit(30).lean(),
    growing(userId, m.rates ?? {}),
  ]);
  const units = holding?.units ?? 0;
  res.json({
    data: {
      units,
      cost: holding?.cost ?? 0,
      value: m.price ? costOf(units, m.price, 'sell') : null,
      trades,
      trees,
    },
  });
});

tradeRoutes.post(
  '/trade',
  validate(z.object({side: z.enum(['buy', 'sell']), units: z.number().int().min(1).max(1_000_000)})),
  async (req, res) => {
    const userId = req.user.sub;
    const {side, units} = req.body;
    const m = await market();
    if (!tradingOpen(m)) throw conflict('MARKET_CLOSED', 'The carbon market is closed just now');
    const amount = costOf(units, m.price, side);
    if (amount < 1) throw badInput('That is too few credits to trade');

    if (side === 'buy') {
      // The trade is saved first, so its id makes the wallet debit happen once whatever the retries.
      const trade = await Trade.create({userId, side, units, price: m.price, amount, status: 'pending'});
      try {
        await debit(trade);
      } catch (err) {
        await Trade.updateOne({_id: trade._id, status: 'pending'}, {$set: {status: 'failed'}});
        throw err;
      }
      // shortcut: a crash between the debit and here leaves the trade pending with money taken; add a sweep that
      // re-runs debit (a no-op by ref) and finishes pending trades before going past a demo.
      const won = await Trade.updateOne({_id: trade._id, status: 'pending'}, {$set: {status: 'done'}});
      if (won.modifiedCount) await Holding.updateOne({userId}, {$inc: {units, cost: amount}}, {upsert: true});
      return res.status(201).json({data: {...trade.toObject(), status: 'done'}});
    }

    // Sell: the credits leave in one conditional update (never below zero), with their share of the cost.
    const held = await Holding.findOneAndUpdate({userId, units: {$gte: units}}, [
      {
        $set: {
          cost: {$subtract: ['$cost', {$round: [{$multiply: ['$cost', {$divide: [units, '$units']}]}, 0]}]},
          units: {$subtract: ['$units', units]},
        },
      },
    ]);
    if (!held) throw new ApiError(400, 'NOT_ENOUGH_CREDITS', `You hold fewer than ${credits(units)} credits`);
    const trade = await Trade.create({userId, side, units, price: m.price, amount, status: 'owed'});
    await payOwed(userId);
    res.status(201).json({data: await Trade.findById(trade._id).lean()});
  },
);

/** Moves what one planted sponsorship has grown into the holding. */
tradeRoutes.post('/claims/:orderId', async (req, res) => {
  const userId = req.user.sub;
  const m = await market();
  const tree = (await growing(userId, m.rates ?? {})).find((t) => t.orderId === req.params.orderId);
  if (!tree) throw notFound('No planted sponsorship of yours has this id');
  if (tree.growingUnits < 1) throw badInput('Nothing has grown since the last claim yet');
  const now = new Date();
  const claim = await Claim.findOne({orderId: tree.orderId}).lean();
  // The first claim inserts (a unique orderId stops a second one); later ones move lastClaimAt only if nobody did.
  const moved = claim
    ? (
        await Claim.updateOne(
          {_id: claim._id, lastClaimAt: claim.lastClaimAt},
          {$set: {lastClaimAt: now}, $inc: {claimedUnits: tree.growingUnits}},
        )
      ).modifiedCount
    : await Claim.create({userId, orderId: tree.orderId, lastClaimAt: now, claimedUnits: tree.growingUnits}).then(
        () => 1,
        (err) => (err.code === 11000 ? 0 : Promise.reject(err)),
      );
  if (!moved) throw conflict('ALREADY_CLAIMED', 'These credits were just claimed');
  await Holding.updateOne({userId}, {$inc: {units: tree.growingUnits}}, {upsert: true});
  const trade = await Trade.create({
    userId,
    side: 'claim',
    units: tree.growingUnits,
    status: 'done',
    orderNo: tree.orderNo,
  });
  res.status(201).json({data: trade});
});
