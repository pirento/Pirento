// Services made in admin (a new service or a package), and the questions any service asks before and after payment.
import {Router} from 'express';
import {z} from 'zod';
import {FIXED_QUESTION_IDS, PRODUCTS, editedService, getService, servicePage, slugify} from '@pirento/shared';
import {
  ACCESS,
  audit,
  badInput,
  conflict,
  forget,
  notFound,
  requireAuth,
  requireRole,
  validate,
} from '@pirento/shared/server';
import {ServiceEdit, editMap, pageEdit} from '../models/ServiceEdit.js';

export const serviceRoutes = Router();
serviceRoutes.use('/staff/services', requireAuth, requireRole(...ACCESS.catalog));

const text = (max) => z.string().trim().max(max);
const question = z.object({
  id: z.string().regex(/^[a-z][a-zA-Z0-9]{0,39}$/, 'A question id is letters and digits, starting with a letter'),
  label: text(160).min(3, 'Write each question'),
  help: text(240).optional(),
  placeholder: text(120).optional(),
  // A choice question always needs an answer; a text one only when `required`.
  options: z.array(text(100).min(1)).min(2, 'A choice needs at least two options').max(20).optional(),
  required: z.boolean().optional(),
});
// null puts the defaults back.
const questionSet = z
  .array(question)
  .max(15)
  .nullable()
  .refine((qs) => !qs || new Set(qs.map((q) => q.id)).size === qs.length, 'Two questions have the same id')
  .refine((qs) => !qs?.some((q) => FIXED_QUESTION_IDS.includes(q.id)), 'Checkout already asks for phone and address');

const details = z.object({
  name: text(100).min(3, 'Give the service a name'),
  category: text(80).min(2, 'Choose or type a category'),
  description: text(600).default(''),
  deliveryTime: text(60).default(''),
  model: z.enum(['fixed', 'consult']).default('fixed'),
  price: z.number().int().min(1).max(10_000_000),
  includes: z.array(text(160).min(1)).max(20).default([]),
});

/** A service made in admin, by slug; the base catalogue's own services are not edited here. */
async function madeInAdmin(slug) {
  const row = await ServiceEdit.findOne({slug, custom: {$exists: true}});
  if (!row) throw notFound('No service made in admin with that name');
  return row;
}

serviceRoutes.post(
  '/staff/services',
  validate(details.extend({product: z.enum(PRODUCTS.map((p) => p.slug))})),
  async (req, res) => {
    const {product, ...custom} = req.body;
    // The product's slug leads, so every page knows whose service it is (legal-startup-pack).
    const words = slugify(custom.name);
    if (!words) throw badInput('Name the service in English letters or digits, so it gets a web address');
    const slug = `${product}-${words}`;
    if (getService(slug)) throw conflict('TAKEN', 'A service with that name already exists');
    try {
      await ServiceEdit.create({slug, custom: {product, ...custom}, updatedBy: req.user.email});
    } catch (err) {
      if (err.code === 11000) throw conflict('TAKEN', 'A service with that name already exists');
      throw err;
    }
    audit(req, 'service.create', slug, `₹${custom.price}`);
    res.status(201).json({data: editedService(slug, await editMap())});
  },
);

serviceRoutes.patch('/staff/services/:slug', validate(details), async (req, res) => {
  const row = await madeInAdmin(req.params.slug);
  // The product stays: the slug carries it.
  await ServiceEdit.updateOne(
    {_id: row._id},
    {$set: {custom: {...req.body, product: row.custom.product}, updatedBy: req.user.email}},
  );
  audit(req, 'service.edit', row.slug);
  res.json({data: editedService(row.slug, await editMap())});
});

/** Orders already placed keep their service's name, price and questions; only new sales stop. */
serviceRoutes.delete('/staff/services/:slug', async (req, res) => {
  const row = await madeInAdmin(req.params.slug);
  await ServiceEdit.deleteOne({_id: row._id});
  audit(req, 'service.delete', row.slug);
  res.json({data: {deleted: row.slug}});
});

serviceRoutes.put(
  '/staff/services/:slug/questions',
  validate(z.object({questions: questionSet, afterQuestions: questionSet})),
  async (req, res) => {
    const service = editedService(req.params.slug, await editMap());
    if (!service) throw notFound('No such service');
    const set = {updatedBy: req.user.email};
    const unset = {};
    for (const key of ['questions', 'afterQuestions'])
      if (req.body[key]) set[key] = req.body[key];
      else unset[key] = 1;
    await ServiceEdit.updateOne({slug: service.slug}, {$set: set, $unset: unset}, {upsert: true});
    audit(
      req,
      'service.questions',
      service.slug,
      `before: ${req.body.questions?.length ?? 'default'} · after: ${req.body.afterQuestions?.length ?? 'none'}`,
    );
    res.json({data: editedService(service.slug, await editMap())});
  },
);

// Packages: 1 to 4, ids unique, prices in whole rupees. null puts the catalogue's packages back.
const pack = z.object({
  id: z.string().regex(/^[a-z0-9-]{1,30}$/, 'A package id is lowercase letters, digits and hyphens'),
  name: text(40).min(2, 'Name each package'),
  price: z.number().int().min(1).max(10_000_000),
  strike: z.number().int().min(1).max(10_000_000).nullish(),
  deliveryTime: text(60).default(''),
  includes: z.array(text(160).min(1)).max(15).default([]),
  recommended: z.boolean().optional(),
});
const packageSet = z
  .array(pack)
  .min(1, 'Add at least one package')
  .max(4)
  .nullable()
  .refine((ps) => !ps || new Set(ps.map((p) => p.id)).size === ps.length, 'Two packages have the same id')
  .refine((ps) => !ps || ps.filter((p) => p.recommended).length <= 1, 'Mark at most one package as recommended')
  .refine((ps) => !ps?.some((p) => p.strike && p.strike <= p.price), 'A struck price must be higher than the price');

serviceRoutes.put('/staff/services/:slug/packages', validate(z.object({packages: packageSet})), async (req, res) => {
  const service = editedService(req.params.slug, await editMap());
  if (!service) throw notFound('No such service');
  const {packages} = req.body;
  await ServiceEdit.updateOne(
    {slug: service.slug},
    packages
      ? {$set: {packages: packages.map(({strike, ...p}) => (strike ? {...p, strike} : p)), updatedBy: req.user.email}}
      : {$set: {updatedBy: req.user.email}, $unset: {packages: 1}},
    {upsert: true},
  );
  audit(
    req,
    'service.packages',
    service.slug,
    packages ? packages.map((p) => `${p.name} ₹${p.price}`).join(', ') : 'reset',
  );
  res.json({data: editedService(service.slug, await editMap())});
});

// The page's sections. A section left out keeps the catalogue's text; an empty list hides it; null resets all.
const page = z
  .object({
    intro: text(2000),
    whoFor: z.array(text(160).min(1)).max(10),
    included: z.array(text(200).min(1)).max(20),
    notIncluded: z.array(text(200).min(1)).max(20),
    documents: z.array(text(200).min(1)).max(20),
    steps: z.array(z.object({title: text(80).min(1), body: text(300)})).max(10),
    timeline: z.array(text(200).min(1)).max(10),
    costs: z.array(z.object({title: text(80).min(1), body: text(300)})).max(10),
    deliverables: z.array(text(200).min(1)).max(15),
    mistakes: z.array(text(200).min(1)).max(10),
    benefits: z.array(z.object({title: text(80).min(1), body: text(300)})).max(10),
    faqs: z.array(z.object({q: text(200).min(3), a: text(1000).min(1)})).max(20),
  })
  .partial()
  .strict();

serviceRoutes.get('/staff/services/:slug/page', async (req, res) => {
  const service = editedService(req.params.slug, await editMap());
  if (!service) throw notFound('No such service');
  const edit = await pageEdit(service.slug);
  res.json({data: {page: servicePage(service.slug, edit), edited: Object.keys(edit ?? {})}});
});

serviceRoutes.put('/staff/services/:slug/page', validate(z.object({page: page.nullable()})), async (req, res) => {
  const service = editedService(req.params.slug, await editMap());
  if (!service) throw notFound('No such service');
  const {page: next} = req.body;
  await ServiceEdit.updateOne(
    {slug: service.slug},
    next ? {$set: {page: next, updatedBy: req.user.email}} : {$set: {updatedBy: req.user.email}, $unset: {page: 1}},
    {upsert: true},
  );
  await forget(`catalog:page:${service.slug}`);
  audit(req, 'service.page', service.slug, next ? Object.keys(next).join(', ') : 'reset');
  res.json({data: servicePage(service.slug, next)});
});
