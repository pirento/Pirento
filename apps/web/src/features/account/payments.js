// The account's payment history: every wallet move, plus card/UPI payments, which never touch the wallet.
// Wallet payments for orders are already wallet moves, so orders add only their card/UPI payments.

const paidAt = (o) => o.timeline?.find((t) => t.status === 'paid')?.at ?? o.createdAt;

/** Newest first: {key, at, title, product, method, amount (paise), direction: 'in' | 'out'}. */
export function paymentHistory(transactions = [], orders = []) {
  const wallet = transactions.map((t) => ({
    key: `w-${t._id}`,
    at: t.createdAt,
    title: t.note || (t.type === 'credit' ? 'Added to wallet' : 'Paid from wallet'),
    method: 'Wallet',
    amount: t.amount,
    direction: t.type === 'credit' ? 'in' : 'out',
  }));
  const cards = orders
    .filter((o) => o.payment?.method === 'razorpay')
    .map((o) => ({
      key: `o-${o._id}`,
      at: paidAt(o),
      title: `Order #${o.orderNo} · ${o.serviceName}`,
      product: o.product,
      method: 'Card / UPI',
      amount: o.amount,
      direction: 'out',
    }));
  return [...wallet, ...cards].sort((a, b) => new Date(b.at) - new Date(a.at));
}

/** Paise paid out this calendar month, by any method. */
export const spentThisMonth = (history, now = new Date()) =>
  history
    .filter((p) => p.direction === 'out' && new Date(p.at).getMonth() === now.getMonth())
    .filter((p) => new Date(p.at).getFullYear() === now.getFullYear())
    .reduce((n, p) => n + p.amount, 0);
