// Products and prices from packages/shared, with the admin's edits and the services made in admin.
import {Router} from 'express';
import {LEGAL_CATALOGUE, PRODUCTS, editedService, editedServicesFor, getProduct} from '@pirento/shared';
import {notFound} from '@pirento/shared/server';
import {editMap} from '../models/ServiceEdit.js';

export const catalogRoutes = Router();

catalogRoutes.get('/products', (_req, res) => res.json({data: PRODUCTS}));

catalogRoutes.get('/products/:slug', async (req, res) => {
  const product = getProduct(req.params.slug);
  if (!product) throw notFound('No such product');
  res.json({data: {...product, services: editedServicesFor(product.slug, await editMap())}});
});

catalogRoutes.get('/legal/catalogue', (_req, res) => res.json({data: LEGAL_CATALOGUE}));

catalogRoutes.get('/services/:slug', async (req, res) => {
  const service = editedService(req.params.slug, await editMap());
  if (!service) throw notFound('No such service');
  res.json({data: service});
});
