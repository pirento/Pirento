// Price changes made in admin. The website merges them in; the orders service charges by them.
import {Router} from 'express';
import {z} from 'zod';
import {basePrice, editedService} from '@pirento/shared';
import {ACCESS, audit, notFound, requireAuth, requireInternal, requireRole, validate} from '@pirento/shared/server';
import {ServiceEdit, editMap} from '../models/ServiceEdit.js';

export const priceRoutes = Router();

/** Every admin edit, slug → edit: prices, questions and the services made in admin. Public, like the catalogue. */
priceRoutes.get('/prices', async (_req, res) => res.json({data: await editMap()}));

/** For orders: the service as it sells right now, with its questions, or null. */
priceRoutes.post(
  '/internal/service',
  requireInternal,
  validate(z.object({slug: z.string().max(80)})),
  async (req, res) => {
    res.json({data: editedService(req.body.slug, await editMap()) ?? null});
  },
);

priceRoutes.patch(
  '/staff/prices/:slug',
  requireAuth,
  requireRole(...ACCESS.pricing),
  validate(z.object({price: z.number().int().min(1).max(10_000_000).nullable(), offSale: z.boolean().default(false)})),
  async (req, res) => {
    const edits = await editMap();
    const service = editedService(req.params.slug, edits);
    if (!service) throw notFound('No such service');
    const base = basePrice(service.slug, edits);
    const {price, offSale} = req.body;
    // Back to the base price: the row keeps any questions, so the price is unset rather than the row deleted.
    const reset = price === null || price === base;
    await ServiceEdit.updateOne(
      {slug: service.slug},
      reset
        ? {$set: {offSale, updatedBy: req.user.email}, $unset: {price: 1}}
        : {$set: {price, offSale, updatedBy: req.user.email}},
      {upsert: true},
    );
    audit(req, 'price.change', service.slug, offSale ? 'off sale' : `₹${base} → ₹${reset ? base : price}`);
    res.json({data: editedService(service.slug, await editMap())});
  },
);
