import {Router} from 'express';
import {z} from 'zod';
import {PRODUCTS, getService} from '@pirento/shared';
import {ACCESS, audit, conflict, isId, notFound, requireAuth, requireRole, validate} from '@pirento/shared/server';
import {Coupon} from '../models/Coupon.js';
import {Order} from '../models/Order.js';
import {discountFor} from '../lib/coupons.js';

// Discount codes: a customer checks one at checkout; finance creates and switches them off.
export const couponRoutes = Router();

couponRoutes.get('/coupons/:code', requireAuth, async (req, res) => {
  const service = getService(String(req.query.service ?? ''));
  if (!service?.price) throw notFound('Service not found');
  const quantity = Math.max(1, Math.min(Number(req.query.quantity) || 1, service.maxQty ?? 1));
  const amount = service.price * 100 * quantity;
  const coupon = await Coupon.findOne({code: req.params.code.toUpperCase()});
  const discount = discountFor(coupon, service.product, amount);
  res.json({data: {code: coupon.code, discount, total: amount - discount}});
});

const staff = Router();
staff.use(requireAuth, requireRole(...ACCESS.coupons));
couponRoutes.use('/staff/coupons', staff);

staff.get('/', async (_req, res) => {
  res.json({data: await Coupon.find().sort({createdAt: -1}).limit(200)});
});

staff.post(
  '/',
  validate(
    z.object({
      code: z
        .string()
        .trim()
        .toUpperCase()
        .regex(/^[A-Z0-9]{4,16}$/, '4 to 16 letters or digits'),
      kind: z.enum(['percent', 'flat']),
      value: z.number().int().min(1).max(100000),
      product: z.enum(['', ...PRODUCTS.map((p) => p.slug)]).default(''),
      minAmount: z.number().int().min(0).max(1000000).default(0),
      maxUses: z.number().int().min(0).max(1000000).default(0),
      expiresAt: z.iso.date().optional().or(z.literal('')),
    }),
  ),
  async (req, res) => {
    const {expiresAt, ...rest} = req.body;
    if (rest.kind === 'percent' && rest.value > 90)
      throw conflict('TOO_BIG', 'A percent code can take at most 90% off');
    if (await Coupon.exists({code: rest.code})) throw conflict('TAKEN', 'That code already exists');
    const coupon = await Coupon.create({
      ...rest,
      product: rest.product || undefined,
      // The code works until the end of the chosen day, India time.
      expiresAt: expiresAt ? new Date(`${expiresAt}T23:59:59+05:30`) : undefined,
      createdBy: req.user.email,
    });
    audit(req, 'coupon.create', coupon.code, `${coupon.kind} ${coupon.value}`);
    res.status(201).json({data: coupon});
  },
);

staff.patch('/:id', validate(z.object({active: z.boolean()})), async (req, res) => {
  const coupon = isId(req.params.id) && (await Coupon.findByIdAndUpdate(req.params.id, req.body, {new: true}));
  if (!coupon) throw notFound('Code not found');
  audit(req, coupon.active ? 'coupon.on' : 'coupon.off', coupon.code);
  res.json({data: coupon});
});

/** The orders that used a code. */
staff.get('/:id/orders', async (req, res) => {
  const coupon = isId(req.params.id) && (await Coupon.findById(req.params.id));
  if (!coupon) throw notFound('Code not found');
  res.json({data: await Order.find({coupon: coupon.code}, {intake: 0, timeline: 0}).sort({createdAt: -1}).limit(200)});
});
