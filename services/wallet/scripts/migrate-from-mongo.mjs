// One-off: copies a wallet kept in Mongo (before the move to PostgreSQL) into PostgreSQL. Safe to run again:
// rows already copied are skipped. Run with MONGO_URI (old pirento_wallet) and DATABASE_URL set, while the
// wallet service is stopped, then check the totals it prints against the old ones.
import mongoose from 'mongoose';
import {migrate, pool} from '../src/lib/db.js';

const hex = (id) => String(id);
await mongoose.connect(process.env.MONGO_URI ?? 'mongodb://127.0.0.1:27017/pirento_wallet');
await migrate();
const db = mongoose.connection.db;

for (const w of await db.collection('wallets').find().toArray()) {
  await pool.query('INSERT INTO wallets (user_id, balance) VALUES ($1, $2) ON CONFLICT (user_id) DO NOTHING', [
    w.userId,
    w.balance,
  ]);
}
for await (const t of db.collection('transactions').find().sort({createdAt: 1})) {
  await pool.query(
    `INSERT INTO transactions (user_id, type, amount, balance_after, note, ref, created_at)
     SELECT $1, $2, $3, $4, $5, $6, $7
     WHERE $6::text IS NULL OR NOT EXISTS (SELECT 1 FROM transactions WHERE ref = $6)`,
    [t.userId, t.type, t.amount, t.balanceAfter, t.note ?? null, t.ref ?? null, t.createdAt ?? new Date()],
  );
}
for (const t of await db.collection('topups').find().toArray()) {
  await pool.query(
    `INSERT INTO topups (id, user_id, amount, razorpay_order_id, payment_id, paid_at, created_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7) ON CONFLICT DO NOTHING`,
    [
      hex(t._id),
      t.userId,
      t.amount,
      t.razorpayOrderId,
      t.paymentId ?? null,
      t.paidAt ?? null,
      t.createdAt ?? new Date(),
    ],
  );
}
for (const w of await db.collection('withdrawals').find().toArray()) {
  await pool.query(
    `INSERT INTO withdrawals (id, user_id, email, amount, upi, status, utr, reason, decided_by, decided_at,
       payout_id, payout_status, payout_error, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15) ON CONFLICT DO NOTHING`,
    [
      hex(w._id),
      w.userId,
      w.email,
      w.amount,
      w.upi,
      w.status,
      w.utr ?? null,
      w.reason ?? null,
      w.decidedBy ?? null,
      w.decidedAt ?? null,
      w.payout?.id ?? null,
      w.payout?.status ?? null,
      w.payout?.error ?? null,
      w.createdAt ?? new Date(),
      w.updatedAt ?? new Date(),
    ],
  );
}
const [mongoTotal] = await db
  .collection('wallets')
  .aggregate([{$group: {_id: null, t: {$sum: '$balance'}}}])
  .toArray();
const pgTotal = (await pool.query('SELECT COALESCE(SUM(balance), 0) AS t FROM wallets')).rows[0].t;
console.log(`held in Mongo ₹${(mongoTotal?.t ?? 0) / 100}, in PostgreSQL ₹${pgTotal / 100}`);
await mongoose.disconnect();
await pool.end();
