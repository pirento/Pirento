// Placing, listing, reading and cancelling your own orders.
import {Router} from 'express';
import {z} from 'zod';
import {checkAnswers, packageOf, validateIntake} from '@pirento/shared';
import {liveService} from '../lib/catalog.js';
import {ApiError, badInput, callService, conflict, requireAuth, validate} from '@pirento/shared/server';
import {config} from '../config.js';
import {Order} from '../models/Order.js';
import {Partner} from '../models/Partner.js';
import {findAccessible, findOwn, nextOrderNo, questionsOf} from '../lib/orders.js';
import {discountOf} from '../lib/coupons.js';

export const customerRoutes = Router();
customerRoutes.use(requireAuth);

customerRoutes.post(
  '/',
  validate(
    z.object({
      serviceSlug: z.string().max(80),
      packageId: z.string().max(40).optional(),
      quantity: z.number().int().min(1).default(1),
      ref: z.string().trim().toUpperCase().max(12).optional(),
      coupon: z.string().trim().toUpperCase().max(16).optional(),
      intake: z.record(z.string(), z.string()).default({}),
    }),
  ),
  async (req, res) => {
    const service = await liveService(req.body.serviceSlug);
    if (!service?.price) throw new ApiError(400, 'NOT_FOR_SALE', 'This service cannot be bought online yet');

    // A paused product takes no new orders. If settings cannot be read, sales go on: a pause is never worth an outage.
    const settings = await callService(config.catalogUrl, '/internal/settings', {}).catch(() => null);
    if (settings?.paused.includes(service.product)) {
      throw new ApiError(503, 'PAUSED', 'Orders for this product are paused for now. Please try again later.');
    }

    const {answers, error} = validateIntake(service, req.body.intake);
    if (error) throw badInput(error);
    const maxQty = service.maxQty ?? 1;
    if (req.body.quantity > maxQty) throw badInput(`You can order at most ${maxQty} at a time`);

    // An unknown partner code, or your own, is ignored: it must never block a purchase.
    const partner = req.body.ref && (await Partner.findOne({code: req.body.ref}));
    const ref = partner && partner.userId !== req.user.sub ? partner.code : undefined;

    const pack = packageOf(service, req.body.packageId);
    if (!pack) throw badInput('Choose one of the packages on offer');
    const full = pack.price * 100 * req.body.quantity; // the price is always the server's
    const coupon = req.body.coupon || undefined;
    const discount = coupon ? await discountOf(coupon, service.product, full) : 0;

    const order = await Order.create({
      orderNo: await nextOrderNo(),
      userId: req.user.sub,
      email: req.user.email,
      product: service.product,
      serviceSlug: service.slug,
      serviceName: service.name,
      package: {id: pack.id, name: pack.name},
      quantity: req.body.quantity,
      amount: full - discount,
      coupon,
      discount,
      intake: answers,
      ...questionsOf(service),
      ref,
      timeline: [{status: 'pending_payment', note: 'Order placed'}],
    });
    res.status(201).json({data: order});
  },
);

customerRoutes.get('/', async (req, res) => {
  res.json({data: await Order.find({userId: req.user.sub}).sort({createdAt: -1}).limit(100)});
});

customerRoutes.get('/:id', async (req, res) => res.json({data: await findAccessible(req)}));

/** The customer writes to the team on one of their orders. */
customerRoutes.post(
  '/:id/messages',
  validate(z.object({body: z.string().trim().min(2, 'Write a message').max(1000)})),
  async (req, res) => {
    const order = await findOwn(req);
    const updated = await Order.findByIdAndUpdate(
      order._id,
      {$push: {messages: {from: 'customer', body: req.body.body}}},
      {new: true},
    );
    res.json({data: updated});
  },
);

/** After paying, the customer answers the service's after-payment questions; they may correct them until it is done. */
customerRoutes.put(
  '/:id/details',
  validate(z.object({answers: z.record(z.string(), z.string())})),
  async (req, res) => {
    const order = await findOwn(req);
    if (!order.afterQuestions?.length) throw badInput('This order asks no more questions');
    const {answers, error} = checkAnswers(order.afterQuestions, req.body.answers);
    if (error) throw badInput(error);
    const updated = await Order.findOneAndUpdate(
      {_id: order._id, status: {$in: ['paid', 'in_progress']}},
      {$set: {details: answers, detailsAt: new Date()}},
      {new: true},
    );
    if (!updated) throw conflict('NOT_LIVE', 'Details can be sent once the order is paid, until it is completed');
    res.json({data: updated});
  },
);

/** Customers may cancel only before paying; after that it is the team's call. */
customerRoutes.post('/:id/cancel', async (req, res) => {
  const order = await findOwn(req);
  const cancelled = await Order.findOneAndUpdate(
    {_id: order._id, status: 'pending_payment'},
    {$set: {status: 'cancelled'}, $push: {timeline: {status: 'cancelled', note: 'Cancelled by you'}}},
    {new: true},
  );
  if (!cancelled) throw conflict('NOT_CANCELLABLE', 'Paid orders can only be cancelled by our team');
  res.json({data: cancelled});
});
