import {LEGAL_CATALOGUE, PRODUCTS, getProduct, getService, servicesFor} from '@pirento/shared';
import {ApiError, createApp, env, finish, start} from '@pirento/shared/server';

// Read-only for now: the catalog comes from packages/shared. Orders and
// staff-edited prices arrive with the orders service.
const app = createApp('catalog');

app.get('/products', (_req, res) => res.json({data: PRODUCTS}));

app.get('/products/:slug', (req, res) => {
  const product = getProduct(req.params.slug);
  if (!product) throw new ApiError(404, 'NOT_FOUND', 'No such product');
  res.json({data: {...product, services: servicesFor(product.slug)}});
});

app.get('/legal/catalogue', (_req, res) => res.json({data: LEGAL_CATALOGUE}));

app.get('/services/:slug', (req, res) => {
  const service = getService(req.params.slug);
  if (!service) throw new ApiError(404, 'NOT_FOUND', 'No such service');
  res.json({data: service});
});

start(finish(app), {name: 'catalog', port: Number(env('PORT', 4003))});
