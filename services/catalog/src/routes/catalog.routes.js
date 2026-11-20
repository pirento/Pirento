import {Router} from 'express';
import {LEGAL_CATALOGUE, PRODUCTS, getProduct, getService, servicesFor} from '@pirento/shared';
import {notFound} from '@pirento/shared/server';

// Read-only: products and prices come from packages/shared, so the website,
// the order service and this API always agree on what costs what.
export const catalogRoutes = Router();

catalogRoutes.get('/products', (_req, res) => res.json({data: PRODUCTS}));

catalogRoutes.get('/products/:slug', (req, res) => {
  const product = getProduct(req.params.slug);
  if (!product) throw notFound('No such product');
  res.json({data: {...product, services: servicesFor(product.slug)}});
});

catalogRoutes.get('/legal/catalogue', (_req, res) => res.json({data: LEGAL_CATALOGUE}));

catalogRoutes.get('/services/:slug', (req, res) => {
  const service = getService(req.params.slug);
  if (!service) throw notFound('No such service');
  res.json({data: service});
});
