import {Router} from 'express';
import {z} from 'zod';
import {validateIntake} from '@pirento/shared';
import {liveService} from '../lib/catalog.js';
import {ApiError, badInput, callService, conflict, requireAuth, validate} from '@pirento/shared/server';
import {config} from '../config.js';
import {Order} from '../models/Order.js';
import {Partner} from '../models/Partner.js';
import {findAccessible, nextOrderNo} from '../lib/orders.js';
import {redeem, releaseCoupon} from '../lib/coupons.js';

// Placing, listing, reading and cancelling your own orders.
export const customerRoutes = Router();
customerRoutes.use(requireAuth);

customerRoutes.post(
  '/',
  validate(
    z.object({
      serviceSlug: z.string().max(80),
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

    const {answers, error} = validateIntake(service.product, service.slug, req.body.intake);
    if (error) throw badInput(error);
    const maxQty = service.maxQty ?? 1;
    if (req.body.quantity > maxQty) throw badInput(`You can order at most ${maxQty} at a time`);

    // An unknown partner code, or your own, is ignored: it must never block a purchase.
    const partner = req.body.ref && (await Partner.findOne({code: req.body.ref}));
    const ref = partner && partner.userId !== req.user.sub ? partner.code : undefined;

    const full = service.price * 100 * req.body.quantity; // the price is always the server's
    const coupon = req.body.coupon || undefined;
    const discount = coupon ? await redeem(coupon, service.product, full) : 0;

    const order = await Order.create({
      orderNo: await nextOrderNo(),
      userId: req.user.sub,
      email: req.user.email,
      product: service.product,
      serviceSlug: service.slug,
      serviceName: service.name,
      quantity: req.body.quantity,
      amount: full - discount,
      coupon,
      discount,
      intake: answers,
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

/** Customers may cancel only before paying; after that it is the team's call. */
customerRoutes.post('/:id/cancel', async (req, res) => {
  const order = await findAccessible(req);
  const cancelled = await Order.findOneAndUpdate(
    {_id: order._id, status: 'pending_payment'},
    {$set: {status: 'cancelled'}, $push: {timeline: {status: 'cancelled', note: 'Cancelled by you'}}},
    {new: true},
  );
  if (!cancelled) throw conflict('NOT_CANCELLABLE', 'Paid orders can only be cancelled by our team');
  await releaseCoupon(cancelled);
  res.json({data: cancelled});
});
