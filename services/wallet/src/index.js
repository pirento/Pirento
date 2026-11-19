import mongoose from 'mongoose';
import {z} from 'zod';
import {
  ApiError,
  asyncHandler,
  createApp,
  env,
  finish,
  requireAuth,
  requireInternal,
  start,
  validate,
} from '@pirento/shared/server';
import {toPaise} from './money.js';

// All amounts are stored in paise (integers) so no rupee value is ever a float.
const Wallet = mongoose.model(
  'Wallet',
  new mongoose.Schema({
    userId: {type: String, required: true, unique: true},
    balance: {type: Number, required: true, default: 0, min: 0},
    // Refs of every move already applied, so a retried debit or refund is a no-op.
    // shortcut: grows by one per order; move to a capped ledger collection past ~10k orders per user.
    refs: {type: [String], default: []},
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
      ref: {type: String, unique: true, sparse: true},
    },
    {timestamps: true},
  ),
);

// One atomic update: a debit only matches when the balance covers it, so two
// parallel debits can never overdraw the wallet. With a ref the move happens at
// most once, however often it is retried.
async function move(userId, type, amount, note, ref) {
  const filter = {userId, ...(type === 'debit' ? {balance: {$gte: amount}} : {}), ...(ref ? {refs: {$ne: ref}} : {})};
  const update = {$inc: {balance: type === 'debit' ? -amount : amount}, ...(ref ? {$push: {refs: ref}} : {})};
  let wallet = null;
  try {
    wallet = await Wallet.findOneAndUpdate(filter, update, {new: true, upsert: type === 'credit'});
  } catch (err) {
    if (err.code !== 11000) throw err; // credit upsert hit an existing wallet that already has this ref
  }
  if (!wallet && ref) {
    const applied = await Wallet.findOne({userId, refs: ref});
    if (applied) {
      // Already done earlier; make sure its ledger row exists, then report success.
      await Transaction.updateOne(
        {ref},
        {$setOnInsert: {userId, type, amount, balanceAfter: applied.balance, note}},
        {upsert: true},
      );
      return applied;
    }
  }
  if (!wallet) throw new ApiError(400, 'INSUFFICIENT_BALANCE', 'Your wallet balance is too low');
  await Transaction.create({userId, type, amount, balanceAfter: wallet.balance, note, ref});
  return wallet;
}

const app = createApp('wallet');

// Called by the orders service only. Amounts are already in paise.
const internalMove = z.object({
  userId: z.string().min(1),
  amount: z.number().int().positive(),
  ref: z.string().min(1).max(80),
  note: z.string().max(140),
});
for (const type of ['debit', 'credit']) {
  app.post(
    `/internal/${type}`,
    requireInternal,
    validate(internalMove),
    asyncHandler(async (req, res) => {
      const {userId, amount, ref, note} = req.body;
      const wallet = await move(userId, type, amount, note, ref);
      res.json({data: {balance: wallet.balance}});
    }),
  );
}

app.use(requireAuth);

app.get(
  '/',
  asyncHandler(async (req, res) => {
    const [wallet, transactions] = await Promise.all([
      Wallet.findOne({userId: req.user.sub}),
      Transaction.find({userId: req.user.sub}, {ref: 0}).sort({createdAt: -1}).limit(50),
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
