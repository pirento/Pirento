import {Router} from 'express';
import {z} from 'zod';
import {getService, validateIntake} from '@pirento/shared';
import {ApiError, badInput, conflict, requireAuth, validate} from '@pirento/shared/server';
import {Order} from '../models/Order.js';
import {Partner} from '../models/Partner.js';
import {findAccessible, nextOrderNo} from '../lib/orders.js';

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
      intake: z.record(z.string(), z.string()).default({}),
    }),
  ),
  async (req, res) => {
    const service = getService(req.body.serviceSlug);
    if (!service?.price) throw new ApiError(400, 'NOT_FOR_SALE', 'This service cannot be bought online yet');

    const {answers, error} = validateIntake(service.product, service.slug, req.body.intake);
    if (error) throw badInput(error);
    const maxQty = service.maxQty ?? 1;
    if (req.body.quantity > maxQty) throw badInput(`You can order at most ${maxQty} at a time`);

    // An unknown partner code, or your own, is ignored: it must never block a purchase.
    const partner = req.body.ref && (await Partner.findOne({code: req.body.ref}));
    const ref = partner && partner.userId !== req.user.sub ? partner.code : undefined;

    const order = await Order.create({
      orderNo: await nextOrderNo(),
      userId: req.user.sub,
      email: req.user.email,
      product: service.product,
      serviceSlug: service.slug,
      serviceName: service.name,
      quantity: req.body.quantity,
      amount: service.price * 100 * req.body.quantity, // the price is always the server's
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
  res.json({data: cancelled});
});
