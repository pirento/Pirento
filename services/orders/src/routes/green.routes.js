// Pirento Green's record, counted from its paid orders: trees sponsored and planted, per drive, for the home page and the team.
import {Router} from 'express';
import {ACCESS, cached, productScope, requireAuth, requireRole} from '@pirento/shared/server';
import {PAID_STATUSES} from '../config.js';
import {Order} from '../models/Order.js';

export const greenRoutes = Router();

const PAID_GREEN = {product: 'green', status: {$in: PAID_STATUSES}};
// A sponsorship counts as planted once the team wrote its planting record (FULFILMENT.green).
const PLANTED = {'fulfilment.site': {$exists: true}};

/** Paid Green orders grouped by drive, with trees planted and the sponsors behind them. */
async function byDrive() {
  const rows = await Order.aggregate([
    {$match: PAID_GREEN},
    {
      $group: {
        _id: '$serviceSlug',
        name: {$last: '$serviceName'},
        orders: {$sum: 1},
        trees: {$sum: '$quantity'},
        raised: {$sum: '$amount'},
        planted: {$sum: {$cond: [{$ifNull: ['$fulfilment.site', false]}, '$quantity', 0]}},
        // shortcut: the sponsor list is held in memory per drive; switch to a $group on userId past ~100k sponsors.
        sponsors: {$addToSet: '$userId'},
      },
    },
    {$sort: {trees: -1}},
  ]);
  const sum = (k) => rows.reduce((n, r) => n + r[k], 0);
  return {
    totals: {
      orders: sum('orders'),
      trees: sum('trees'),
      planted: sum('planted'),
      raised: sum('raised'),
      sponsors: new Set(rows.flatMap((r) => r.sponsors)).size,
    },
    drives: rows.map(({_id, sponsors, ...r}) => ({slug: _id, ...r, sponsors: sponsors.length})),
  };
}

/** The public record: counts and the latest planting sites. Never a person, an amount or an order number. */
greenRoutes.get('/green/impact', async (_req, res) => {
  const data = await cached('green:impact', 300, async () => {
    const [{totals, drives}, recent] = await Promise.all([
      byDrive(),
      Order.find({...PAID_GREEN, ...PLANTED}, {serviceName: 1, quantity: 1, fulfilment: 1})
        .sort({'fulfilment.at': -1})
        .limit(6)
        .lean(),
    ]);
    return {
      trees: totals.trees,
      planted: totals.planted,
      sponsors: totals.sponsors,
      drives: drives.map((d) => ({slug: d.slug, name: d.name, trees: d.trees, planted: d.planted})),
      recent: recent.map((o) => ({
        drive: o.serviceName,
        trees: o.quantity,
        site: o.fulfilment.site,
        plantedOn: o.fulfilment.plantedOn ?? null,
      })),
    };
  });
  res.json({data});
});

/** The team's view: totals with money, per drive, and paid sponsorships still waiting for their planting record. */
greenRoutes.get('/staff/green', requireAuth, requireRole(...ACCESS.orders), async (req, res) => {
  const scope = productScope(req);
  if (scope && !scope.includes('green')) return res.json({data: {totals: null, drives: [], waiting: []}});
  const [summary, waiting] = await Promise.all([
    byDrive(),
    Order.find(
      {...PAID_GREEN, status: {$in: ['paid', 'in_progress']}, 'fulfilment.site': {$exists: false}},
      {orderNo: 1, serviceName: 1, quantity: 1, status: 1, createdAt: 1, assignee: 1},
    )
      .sort({createdAt: 1})
      .limit(100)
      .lean(),
  ]);
  // Money is for finance and superadmins, as on the other staff numbers; operations staff see trees only.
  if (!ACCESS.payments.includes(req.user.role)) {
    delete summary.totals.raised;
    for (const d of summary.drives) delete d.raised;
  }
  res.json({data: {...summary, waiting}});
});
