// The wallet's own PostgreSQL database: money needs strict transactions, so balances, the ledger, top-ups and
// withdrawals live here, not in Mongo. Tables are made on start; every money change runs inside tx().
import crypto from 'node:crypto';
import pg from 'pg';
import {config} from '../config.js';

// Paise are bigint in SQL; they stay far below 2^53, so plain numbers are safe in JS.
pg.types.setTypeParser(pg.types.builtins.INT8, Number);

export const pool = new pg.Pool({
  connectionString: config.databaseUrl,
  max: config.poolSize,
  ...(config.databaseSsl && {ssl: {rejectUnauthorized: true}}),
});
pool.on('error', (err) => console.error('postgres', err.message));

export const query = (text, params) => pool.query(text, params);

/** Runs `fn(client)` in one transaction: all of it lands, or none of it does. */
export async function tx(fn) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const out = await fn(client);
    await client.query('COMMIT');
    return out;
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    throw err;
  } finally {
    client.release();
  }
}

/** A new 24-hex id, the same shape the Mongo ids had, so links and references keep working. */
export const newId = () => crypto.randomUUID().replaceAll('-', '').slice(0, 24);

const SCHEMA = `
CREATE TABLE IF NOT EXISTS wallets (
  user_id text PRIMARY KEY,
  balance bigint NOT NULL DEFAULT 0 CHECK (balance >= 0)
);
CREATE TABLE IF NOT EXISTS transactions (
  id bigserial PRIMARY KEY,
  user_id text NOT NULL,
  type text NOT NULL CHECK (type IN ('credit', 'debit')),
  amount bigint NOT NULL CHECK (amount > 0),
  balance_after bigint NOT NULL,
  note text,
  ref text UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS transactions_user ON transactions (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS transactions_created ON transactions (created_at DESC);
CREATE TABLE IF NOT EXISTS topups (
  id text PRIMARY KEY,
  user_id text NOT NULL,
  amount bigint NOT NULL CHECK (amount > 0),
  razorpay_order_id text NOT NULL UNIQUE,
  payment_id text,
  paid_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS withdrawals (
  id text PRIMARY KEY,
  user_id text NOT NULL,
  email text NOT NULL,
  amount bigint NOT NULL CHECK (amount > 0),
  upi text NOT NULL,
  status text NOT NULL DEFAULT 'requested' CHECK (status IN ('requested', 'processing', 'paid', 'rejected')),
  utr text,
  reason text,
  decided_by text,
  decided_at timestamptz,
  payout_id text,
  payout_status text,
  payout_error text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
-- One open request per person, kept by the database, so two quick clicks cannot both get through.
CREATE UNIQUE INDEX IF NOT EXISTS one_open_withdrawal ON withdrawals (user_id) WHERE status IN ('requested', 'processing');
CREATE INDEX IF NOT EXISTS withdrawals_status ON withdrawals (status, created_at);
CREATE INDEX IF NOT EXISTS withdrawals_user ON withdrawals (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS withdrawals_payout ON withdrawals (payout_id);
`;

/** Makes the tables. Safe on every start; an advisory lock keeps two starting copies from racing. */
export async function migrate() {
  await tx(async (c) => {
    await c.query('SELECT pg_advisory_xact_lock(4002)');
    await c.query(SCHEMA);
  });
}
