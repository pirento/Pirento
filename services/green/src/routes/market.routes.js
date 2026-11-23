// The public market: today's price, its history and whether trading is open. No sign-in needed.
import {Router} from 'express';
import {config} from '../config.js';
import {market} from '../models/Market.js';
import {PricePoint} from '../models/PricePoint.js';

export const marketRoutes = Router();

/** Whether buying and selling is open now: switched on for this server, opened by the team, and priced. */
export const tradingOpen = (m) => Boolean(config.tradingOn && m.open && m.price);

marketRoutes.get('/market', async (_req, res) => {
  const [m, points] = await Promise.all([
    market(),
    PricePoint.find({}, {_id: 0, price: 1, at: 1}).sort({at: -1}).limit(90).lean(),
  ]);
  const history = points.reverse();
  const before = history.at(-2)?.price;
  res.json({
    data: {
      price: m.price ?? null,
      open: tradingOpen(m),
      tradingOn: config.tradingOn,
      changePct: m.price && before ? Math.round(((m.price - before) / before) * 10_000) / 100 : null,
      history,
      rates: m.rates ?? {}, // lean: a plain object
    },
  });
});
