// Products and prices from packages/shared, with admin price changes applied to single services.
import {Router} from 'express';
import {LEGAL_CATALOGUE, PRODUCTS, getProduct, servicesFor} from '@pirento/shared';
import {notFound} from '@pirento/shared/server';
import {overrideMap} from '../models/PriceOverride.js';
import {pricedService, withOverride} from '../lib/priced.js';

export const catalogRoutes = Router();

catalogRoutes.get('/products', (_req, res) => res.json({data: PRODUCTS}));

catalogRoutes.get('/products/:slug', async (req, res) => {
  const product = getProduct(req.params.slug);
  if (!product) throw notFound('No such product');
  const overrides = await overrideMap();
  res.json({data: {...product, services: servicesFor(product.slug).map((s) => withOverride(s, overrides[s.slug]))}});
});

catalogRoutes.get('/legal/catalogue', (_req, res) => res.json({data: LEGAL_CATALOGUE}));

catalogRoutes.get('/services/:slug', async (req, res) => {
  const service = pricedService(req.params.slug, await overrideMap());
  if (!service) throw notFound('No such service');
  res.json({data: service});
});
