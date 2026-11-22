// Every change to a wallet balance goes through here, in paise, inside one PostgreSQL transaction.
import {ApiError} from '@pirento/shared/server';
import {query, tx} from './db.js';

const UNIQUE = '23505';

/**
 * Moves money in or out of one wallet. Amounts are paise.
 *
 * The balance update only matches when the result stays at or above zero, and the row lock it takes makes a
 * second debit wait for the first, so racing debits can never overdraw. When a `ref` is given (an order id, a
 * refund id) the move happens at most once however often the caller retries: the ledger's unique ref turns a
 * second try into a rollback that leaves the balance as the first try left it.
 */
export async function move(userId, type, amount, note, ref) {
  try {
    return await tx(async (c) => {
      if (ref) {
        const done = await c.query('SELECT 1 FROM transactions WHERE ref = $1', [ref]);
        if (done.rowCount) return balanceOf(userId, c);
      }
      await c.query('INSERT INTO wallets (user_id) VALUES ($1) ON CONFLICT DO NOTHING', [userId]);
      const updated = await c.query(
        'UPDATE wallets SET balance = balance + $2 WHERE user_id = $1 AND balance + $2 >= 0 RETURNING balance',
        [userId, type === 'debit' ? -amount : amount],
      );
      if (!updated.rowCount) {
        // A parallel try with the same ref may have taken the money while this one waited on the row lock: that
        // is success, not "too low". The lock wait ended at its commit, so this read sees it.
        if (ref && (await c.query('SELECT 1 FROM transactions WHERE ref = $1', [ref])).rowCount)
          return balanceOf(userId, c);
        throw new ApiError(400, 'INSUFFICIENT_BALANCE', 'Your wallet balance is too low');
      }
      const balance = updated.rows[0].balance;
      await c.query(
        'INSERT INTO transactions (user_id, type, amount, balance_after, note, ref) VALUES ($1, $2, $3, $4, $5, $6)',
        [userId, type, amount, balance, note ?? null, ref ?? null],
      );
      return {balance};
    });
  } catch (err) {
    // The same ref committed by a parallel try while this one waited: that one counts.
    if (err.code === UNIQUE && ref) return balanceOf(userId);
    throw err;
  }
}

export async function balanceOf(userId, client = {query}) {
  const r = await client.query('SELECT balance FROM wallets WHERE user_id = $1', [userId]);
  return {balance: r.rows[0]?.balance ?? 0};
}
