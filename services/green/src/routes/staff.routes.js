// The team's side of the market: set the price, open or close it, set each drive's growth rate, and watch trades.
import {Router} from 'express';
import {z} from 'zod';
import {ACCESS, audit, requireRole, validate} from '@pirento/shared/server';
import {config} from '../config.js';
import {Holding} from '../models/Holding.js';
import {Market, market} from '../models/Market.js';
import {PricePoint} from '../models/PricePoint.js';
import {Trade} from '../models/Trade.js';

export const staffRoutes = Router();
// Prices are finance's and superadmins' work, as in Services & prices.
staffRoutes.use('/staff', requireRole(...ACCESS.pricing));

staffRoutes.get('/staff/market', async (_req, res) => {
  const [m, held, volume, recent] = await Promise.all([
    market(),
    Holding.aggregate([
      {$match: {units: {$gt: 0}}},
      {$group: {_id: null, holders: {$sum: 1}, units: {$sum: '$units'}}},
    ]),
    Trade.aggregate([
      {$match: {status: {$in: ['done', 'owed']}}},
      {$group: {_id: '$side', units: {$sum: '$units'}, amount: {$sum: '$amount'}, count: {$sum: 1}}},
    ]),
    Trade.find({}).sort({createdAt: -1}).limit(50).lean(),
  ]);
  res.json({
    data: {
      price: m.price ?? null,
      open: m.open,
      tradingOn: config.tradingOn,
      rates: m.rates ?? {}, // lean: a plain object
      holders: held[0]?.holders ?? 0,
      unitsHeld: held[0]?.units ?? 0,
      volume: Object.fromEntries(volume.map(({_id, ...v}) => [_id, v])),
      owed: await Trade.countDocuments({status: 'owed'}),
      recent,
    },
  });
});

staffRoutes.put(
  '/staff/market',
  validate(z.object({price: z.number().int().min(1).max(100_000_000).optional(), open: z.boolean().optional()})),
  async (req, res) => {
    const {price, open} = req.body;
    const before = await market();
    const m = await Market.findOneAndUpdate(
      {_id: 'market'},
      {$set: {...(price !== undefined && {price}), ...(open !== undefined && {open})}},
      {new: true},
    ).lean();
    if (price !== undefined && price !== before.price) {
      await PricePoint.create({price, by: req.user.email});
      audit(req, 'green.price', 'carbon market', `₹${before.price / 100 || '—'} → ₹${price / 100} per credit`);
    }
    if (open !== undefined && open !== before.open) audit(req, open ? 'green.open' : 'green.close', 'carbon market');
    res.json({data: {price: m.price ?? null, open: m.open}});
  },
);

staffRoutes.put(
  '/staff/rates',
  validate(z.object({slug: z.string().regex(/^green-[a-z0-9-]{1,80}$/), rate: z.number().min(0).max(10)})),
  async (req, res) => {
    const {slug, rate} = req.body;
    await market();
    await Market.updateOne({_id: 'market'}, {$set: {[`rates.${slug}`]: rate}});
    audit(req, 'green.rate', slug, `${rate} credits per tree per year`);
    res.json({data: {slug, rate}});
  },
);
