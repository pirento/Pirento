// Talking to the wallet service. Every call carries a ref, and the wallet
// applies a ref at most once, so any of these can be retried safely.
import {callService} from '@pirento/shared/server';
import {config} from '../config.js';

export const debitForOrder = (order) =>
  callService(config.walletUrl, '/internal/debit', {
    userId: order.userId,
    amount: order.amount,
    ref: `order:${order._id}`,
    note: `Order #${order.orderNo} · ${order.serviceName}`.slice(0, 140),
  });

/** Gives back a wallet payment that arrived after the order was already settled. */
export const voidOrderDebit = (order) =>
  callService(config.walletUrl, '/internal/credit', {
    userId: order.userId,
    amount: order.amount,
    ref: `void:order:${order._id}`,
    note: `Refund · order #${order.orderNo} was already settled`,
  });

/** Refund for an order staff cancelled after it was paid from the wallet. */
export const refundOrder = (order) =>
  callService(config.walletUrl, '/internal/credit', {
    userId: order.userId,
    amount: order.amount,
    ref: `refund:${order._id}`,
    note: `Refund · order #${order.orderNo}`,
  });
