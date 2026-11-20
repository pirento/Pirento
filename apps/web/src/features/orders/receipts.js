// Which orders have a payment receipt, and when they were paid.

/** An order was paid once it carries a payment method; a later cancellation does not undo the receipt. */
export const hasReceipt = (order) => Boolean(order.payment?.method);

/** When the payment landed: the order's first "paid" step, or when it was placed if that is missing. */
export const paidAt = (order) => order.timeline?.find((t) => t.status === 'paid')?.at ?? order.createdAt;
