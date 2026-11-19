import mongoose from 'mongoose';
import {z} from 'zod';
import {ApiError, asyncHandler, createApp, env, finish, requireAuth, start, validate} from '@pirento/shared/server';
import {toPaise} from './money.js';

// All amounts are stored in paise (integers) so no rupee value is ever a float.
const Wallet = mongoose.model(
  'Wallet',
  new mongoose.Schema({
    userId: {type: String, required: true, unique: true},
    balance: {type: Number, required: true, default: 0, min: 0},
  }),
);

const Transaction = mongoose.model(
  'Transaction',
  new mongoose.Schema(
    {
      userId: {type: String, required: true, index: true},
      type: {type: String, enum: ['credit', 'debit'], required: true},
      amount: {type: Number, required: true, min: 1},
      balanceAfter: {type: Number, required: true},
      note: {type: String, maxlength: 140},
    },
    {timestamps: true},
  ),
);

// One atomic update: a debit only matches when the balance covers it, so two
// parallel debits can never overdraw the wallet.
async function move(userId, type, amount, note) {
  const filter = type === 'debit' ? {userId, balance: {$gte: amount}} : {userId};
  const wallet = await Wallet.findOneAndUpdate(
    filter,
    {$inc: {balance: type === 'debit' ? -amount : amount}},
    {new: true, upsert: type === 'credit'},
  );
  if (!wallet) throw new ApiError(400, 'INSUFFICIENT_BALANCE', 'Your wallet balance is too low');
  await Transaction.create({userId, type, amount, balanceAfter: wallet.balance, note});
  return wallet;
}

const app = createApp('wallet');
app.use(requireAuth);

app.get(
  '/',
  asyncHandler(async (req, res) => {
    const [wallet, transactions] = await Promise.all([
      Wallet.findOne({userId: req.user.sub}),
      Transaction.find({userId: req.user.sub}).sort({createdAt: -1}).limit(50),
    ]);
    res.json({data: {balance: wallet?.balance ?? 0, transactions}});
  }),
);

// shortcut: test top-up with no gateway; replace with Razorpay order + signed webhook before launch.
app.post(
  '/topup',
  validate(z.object({amount: z.number().positive().max(100000)})),
  asyncHandler(async (req, res) => {
    if (process.env.NODE_ENV === 'production' && process.env.ALLOW_TEST_TOPUP !== 'true') {
      throw new ApiError(403, 'PAYMENTS_UNAVAILABLE', 'Top-up opens when payments go live');
    }
    const wallet = await move(req.user.sub, 'credit', toPaise(req.body.amount), 'Test top-up');
    res.json({data: {balance: wallet.balance}});
  }),
);

start(finish(app), {
  name: 'wallet',
  port: Number(env('PORT', 4002)),
  mongoUri: env('MONGO_URI', 'mongodb://127.0.0.1:27017/pirento_wallet'),
});
