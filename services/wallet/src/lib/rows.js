// SQL rows in the shape the website and the other services already read (camelCase, `_id`, nested payout).
export const transaction = (r) => ({
  _id: String(r.id),
  userId: r.user_id,
  type: r.type,
  amount: r.amount,
  balanceAfter: r.balance_after,
  note: r.note,
  createdAt: r.created_at,
});

export const withdrawal = (r) =>
  r && {
    _id: r.id,
    userId: r.user_id,
    email: r.email,
    amount: r.amount,
    upi: r.upi,
    status: r.status,
    utr: r.utr ?? undefined,
    reason: r.reason ?? undefined,
    decidedBy: r.decided_by ?? undefined,
    decidedAt: r.decided_at ?? undefined,
    payout:
      r.payout_id || r.payout_status ? {id: r.payout_id, status: r.payout_status, error: r.payout_error} : undefined,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };

/** Columns a transaction list returns (never the ref, which can name another service's record). */
export const TX_COLUMNS = 'id, user_id, type, amount, balance_after, note, created_at';
