// Called by the auth service when an account is deleted. Orders stay for accounts and tax records,
// but without the person: their email, their checkout answers, their messages and their documents go.
import {Router} from 'express';
import {z} from 'zod';
import {requireInternal, validate} from '@pirento/shared/server';
import {Order} from '../models/Order.js';
import {OrderFile} from '../models/OrderFile.js';
import {Partner} from '../models/Partner.js';

export const internalRoutes = Router();
internalRoutes.use('/internal', requireInternal);

internalRoutes.post('/internal/forget', validate(z.object({userId: z.string().min(1).max(40)})), async (req, res) => {
  const {userId} = req.body;
  await Promise.all([
    // A courier tracking number leads to their address, so it goes with the answers.
    Order.updateMany(
      {userId},
      {
        $set: {email: `deleted-${userId}@deleted.invalid`, intake: {}},
        $unset: {'fulfilment.tracking': 1, details: 1},
      },
    ),
    // What they wrote to the team goes too; the team's side of the conversation stays as a record of the work.
    Order.updateMany(
      {userId},
      {$set: {'messages.$[mine].body': '[removed when the account was deleted]'}},
      {arrayFilters: [{'mine.from': 'customer'}]},
    ),
    OrderFile.deleteMany({userId}),
    Partner.deleteMany({userId}),
    // Commission not yet in their wallet is dropped: the account is going, and a credit would reopen its wallet.
    Order.updateMany({'commission.userId': userId, 'commission.paid': {$ne: true}}, {$unset: {commission: 1}}),
  ]);
  res.json({data: {forgotten: true}});
});

/** Pirento AI's look at a person's own orders: number, service, status and amount of the latest ten. */
internalRoutes.post(
  '/internal/assistant',
  validate(z.object({userId: z.string().min(1).max(40)})),
  async (req, res) => {
    const orders = await Order.find(
      {userId: req.body.userId},
      {orderNo: 1, product: 1, serviceName: 1, status: 1, amount: 1, createdAt: 1},
    )
      .sort({createdAt: -1})
      .limit(10)
      .lean();
    res.json({
      data: orders.map((o) => ({
        orderNo: o.orderNo,
        product: o.product,
        service: o.serviceName,
        status: o.status,
        rupees: o.amount / 100,
        placed: o.createdAt,
        link: `/${o.product}/dashboard/orders/${o._id}`,
      })),
    });
  },
);
