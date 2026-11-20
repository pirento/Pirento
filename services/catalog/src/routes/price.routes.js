import {Router} from 'express';
import {z} from 'zod';
import {getService} from '@pirento/shared';
import {ACCESS, audit, notFound, requireAuth, requireInternal, requireRole, validate} from '@pirento/shared/server';
import {PriceOverride, overrideMap} from '../models/PriceOverride.js';
import {pricedService} from '../lib/priced.js';

// Price changes made in admin. The website merges them in; the orders service charges by them.
export const priceRoutes = Router();

priceRoutes.get('/prices', async (_req, res) => res.json({data: await overrideMap()}));

/** For orders: the service as it sells right now, or null. */
priceRoutes.post(
  '/internal/service',
  requireInternal,
  validate(z.object({slug: z.string().max(80)})),
  async (req, res) => {
    res.json({data: pricedService(req.body.slug, await overrideMap()) ?? null});
  },
);

priceRoutes.patch(
  '/staff/prices/:slug',
  requireAuth,
  requireRole(...ACCESS.pricing),
  validate(z.object({price: z.number().int().min(1).max(10_000_000).nullable(), offSale: z.boolean().default(false)})),
  async (req, res) => {
    const service = getService(req.params.slug);
    if (!service) throw notFound('No such service');
    const {price, offSale} = req.body;
    // Back to the catalogue price and on sale: nothing to override any more.
    if (!offSale && (price === null || price === service.price)) {
      await PriceOverride.deleteOne({slug: service.slug});
    } else {
      await PriceOverride.updateOne(
        {slug: service.slug},
        {$set: {price: price ?? undefined, offSale, updatedBy: req.user.email}},
        {upsert: true},
      );
    }
    audit(req, 'price.change', service.slug, offSale ? 'off sale' : `₹${service.price} → ₹${price ?? service.price}`);
    res.json({data: pricedService(service.slug, await overrideMap())});
  },
);
