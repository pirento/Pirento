// Pirento One: become a partner, and see the orders your code brought in.
import crypto from 'node:crypto';
import {Router} from 'express';
import {requireAuth} from '@pirento/shared/server';
import {Order} from '../models/Order.js';
import {Partner} from '../models/Partner.js';

export const partnerRoutes = Router();
partnerRoutes.use('/partner', requireAuth);

/** Joining twice returns the same code. */
partnerRoutes.post('/partner/join', async (req, res) => {
  const existing = await Partner.findOne({userId: req.user.sub});
  if (existing) return res.json({data: existing});
  const partner = await Partner.create({
    userId: req.user.sub,
    code: `P${crypto.randomBytes(3).toString('hex').toUpperCase()}`,
  });
  res.status(201).json({data: partner});
});

partnerRoutes.get('/partner/me', async (req, res) => {
  const partner = await Partner.findOne({userId: req.user.sub});
  if (!partner) return res.json({data: null});
  // The order, never the client: no email, no checkout answers.
  const orders = await Order.find(
    {ref: partner.code},
    {orderNo: 1, serviceName: 1, quantity: 1, status: 1, amount: 1, createdAt: 1},
  )
    .sort({createdAt: -1})
    .limit(200);
  res.json({data: {code: partner.code, orders}});
});
