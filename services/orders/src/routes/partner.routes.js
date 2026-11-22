// Pirento One: become a partner, pick a plan, and see the orders your code brought in.
import crypto from 'node:crypto';
import {Router} from 'express';
import {z} from 'zod';
import {isId, requireAuth, requireBharatId, validate} from '@pirento/shared/server';
import {buyPlan, freePlan, paidPlanOf} from '../lib/plans.js';
import {Order} from '../models/Order.js';
import {Partner} from '../models/Partner.js';

export const partnerRoutes = Router();
partnerRoutes.use('/partner', requireAuth, requireBharatId); // Pirento One opens once a Bharat ID is issued

/** The caller's partner record, made on first use. Joining twice returns the same code. */
async function partnerOf(userId) {
  const existing = await Partner.findOne({userId});
  if (existing) return existing;
  try {
    return await Partner.create({userId, code: `P${crypto.randomBytes(3).toString('hex').toUpperCase()}`});
  } catch (err) {
    if (err.code !== 11000) throw err;
    return Partner.findOne({userId}); // a parallel join made it first
  }
}

/** The plan a partner is on now: a running paid plan, else the free one. */
async function currentPlan(partner) {
  const paid = paidPlanOf(partner);
  if (paid) return {...paid, free: false};
  const free = await freePlan();
  return free ? {id: String(free._id), name: free.name, commissionPct: free.commissionPct, free: true} : null;
}

/** Joining puts you on the free plan. */
partnerRoutes.post('/partner/join', async (req, res) => {
  const partner = await partnerOf(req.user.sub);
  res.status(201).json({data: partner});
});

/** Buys (or renews) a paid plan from the wallet; joins first if needed. */
partnerRoutes.post(
  '/partner/plan',
  validate(z.object({planId: z.string().refine(isId, 'Not a plan')})),
  async (req, res) => {
    const partner = await buyPlan(await partnerOf(req.user.sub), req.body.planId);
    res.json({data: {code: partner.code, plan: await currentPlan(partner)}});
  },
);

partnerRoutes.get('/partner/me', async (req, res) => {
  const partner = await Partner.findOne({userId: req.user.sub});
  if (!partner) return res.json({data: null});
  // The order, never the client: no email, no checkout answers.
  const orders = await Order.find(
    {ref: partner.code},
    {
      orderNo: 1,
      serviceName: 1,
      quantity: 1,
      status: 1,
      amount: 1,
      createdAt: 1,
      'commission.amount': 1,
      'commission.paid': 1,
    },
  )
    .sort({createdAt: -1})
    .limit(200);
  res.json({data: {code: partner.code, plan: await currentPlan(partner), orders}});
});
