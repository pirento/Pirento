// Invoices: one is issued by itself when an order is paid (and by an hourly sweep for any missed), numbered per
// financial year, with GST worked out from admin's settings; cancelling a paid order adds a credit note. The price
// paid always includes GST, so the tax is taken out of it, never added on top.
import {
  COMPANY,
  PRODUCTS,
  SERVICES,
  SHIPPABLE,
  amountInWords,
  financialYear,
  gstState,
  isGstin,
  splitTax,
  stateOfGstin,
} from '@pirento/shared';
import {callService, nextSeq} from '@pirento/shared/server';
import {config} from '../config.js';
import {Invoice} from '../models/Invoice.js';
import {InvoiceSettings} from '../models/InvoiceSettings.js';
import {Order} from '../models/Order.js';

const HOUR = 3_600_000;

/** The settings row, made on first read. */
export const invoiceSettings = () =>
  InvoiceSettings.findOneAndUpdate({_id: 'main'}, {$setOnInsert: {prefix: 'PIR'}}, {upsert: true, new: true}).lean();

/** Products that sell through orders, each with admin's SAC/HSN code and GST rate (empty until set). */
export function invoiceProducts(settings) {
  const rows = settings?.products ?? {};
  return PRODUCTS.filter((p) => SERVICES.some((s) => s.product === p.slug)).map((p) => {
    const row = rows instanceof Map ? rows.get(p.slug) : rows[p.slug];
    return {
      product: p.slug,
      name: p.name,
      codeType: SHIPPABLE.includes(p.slug) ? 'HSN' : 'SAC',
      code: row?.code ?? '',
      rate: row?.rate ?? null,
    };
  });
}

/**
 * Where the supply takes place, for GST: goods go where they are delivered (the delivery state at checkout);
 * services to the buyer's address on record (billing details, else the state they gave), else the seller's state.
 */
export function placeOfSupply({order, billing, sellerState}) {
  const goods = SHIPPABLE.includes(order.product);
  const tries = goods
    ? [order.intake?.state, billing?.state]
    : [billing?.state, stateOfGstin(billing?.gstin)?.name, order.intake?.state];
  for (const t of tries) {
    const s = t && gstState(t);
    if (s) return s;
  }
  return sellerState;
}

/** The invoice for an order, without its number: everything fixed at the moment it is issued. */
export function buildInvoice({order, settings, billing, issuedAt = new Date()}) {
  const sellerState = stateOfGstin(COMPANY.gstin);
  const row = invoiceProducts(settings).find((p) => p.product === order.product);
  const kind =
    settings?.address && sellerState && row?.code && row.rate !== null && row.rate !== undefined ? 'tax' : 'plain';
  const pos = placeOfSupply({order, billing, sellerState});
  const amounts =
    kind === 'tax'
      ? splitTax(order.amount, row.rate, pos?.code === sellerState?.code)
      : {taxable: order.amount, cgst: 0, sgst: 0, igst: 0, total: order.amount};
  const buyerState = gstState(billing?.state) ?? stateOfGstin(billing?.gstin) ?? (pos !== sellerState ? pos : null);
  return {
    kind,
    fy: financialYear(issuedAt),
    orderId: String(order._id),
    orderNo: order.orderNo,
    userId: order.userId,
    product: order.product,
    issuedAt,
    seller: {
      name: COMPANY.legalName,
      gstin: COMPANY.gstin,
      cin: COMPANY.cin,
      email: COMPANY.supportEmail,
      address: settings?.address ?? '',
      state: sellerState?.name,
      stateCode: sellerState?.code,
    },
    buyer: {
      name: billing?.name || '',
      email: order.email,
      phone: billing?.phone || order.intake?.phone || '',
      gstin: isGstin(billing?.gstin) ? billing.gstin : '',
      address: billing?.address || '',
      state: buyerState?.name ?? '',
      stateCode: buyerState?.code ?? '',
    },
    placeOfSupply: pos ? {state: pos.name, code: pos.code} : {},
    // Goods: where they go, when that is not the buyer (a gift).
    shipTo: SHIPPABLE.includes(order.product)
      ? {
          name: order.intake?.recipientName ?? '',
          address: [order.intake?.address, order.intake?.pincode].filter(Boolean).join(', '),
          state: gstState(order.intake?.state)?.name ?? '',
          stateCode: gstState(order.intake?.state)?.code ?? '',
        }
      : undefined,
    line: {
      description: `${order.serviceName}${order.package?.name ? ` · ${order.package.name}` : ''}`,
      codeType: row?.codeType ?? 'SAC',
      code: row?.code ?? '',
      qty: order.quantity ?? 1,
      gross: order.amount + (order.discount ?? 0),
      discount: order.discount ?? 0,
      rate: kind === 'tax' ? row.rate : null,
    },
    amounts,
    words: amountInWords(order.amount),
    note: settings?.note ?? '',
    payment: {
      method: order.payment?.method,
      ref: order.payment?.razorpayPaymentId ?? '',
      paidAt: order.timeline?.find((t) => t.status === 'paid')?.at ?? issuedAt,
    },
  };
}

/** Issues the order's invoice once (a unique index on the order); returns it, or the one already there. */
export async function issueInvoice(order) {
  if (!order?.payment?.method) return null;
  const existing = await Invoice.findOne({orderId: String(order._id)}).lean();
  if (existing) return existing;
  const settings = await invoiceSettings();
  const billing = await callService(config.authUrl, '/internal/billing', {userId: order.userId}).catch(() => null);
  const draft = buildInvoice({order, settings, billing});
  const seq = await nextSeq(`invoice-${draft.fy}`);
  const invoiceNo = `${settings.prefix || 'PIR'}/${draft.fy}/${String(seq).padStart(5, '0')}`;
  let invoice;
  try {
    invoice = (await Invoice.create({...draft, invoiceNo})).toObject();
  } catch (err) {
    if (err.code === 11000) return Invoice.findOne({orderId: String(order._id)}).lean(); // issued by another copy
    throw err;
  }
  await Order.updateOne({_id: order._id}, {$set: {invoiceNo, invoiceId: String(invoice._id)}});
  return invoice;
}

/** A credit note for a cancelled paid order: the invoice is marked cancelled with its own CN number. */
export async function cancelInvoice(order, reason = 'Order cancelled') {
  const invoice = await Invoice.findOne({orderId: String(order._id), status: 'issued'}, {_id: 1}).lean();
  if (!invoice) return null;
  const fy = financialYear();
  const no = `CN/${fy}/${String(await nextSeq(`credit-${fy}`)).padStart(5, '0')}`;
  return Invoice.findOneAndUpdate(
    {_id: invoice._id, status: 'issued'},
    {$set: {status: 'cancelled', creditNote: {no, at: new Date(), reason: reason.slice(0, 200)}}},
    {new: true},
  ).lean();
}

/** Paid orders of the last 30 days without an invoice (a restart, a missed hook): issue theirs now. */
export async function sweepInvoices(now = new Date()) {
  const orders = await Order.find({
    'payment.method': {$exists: true},
    invoiceNo: {$exists: false},
    createdAt: {$gte: new Date(now.getTime() - 30 * 24 * HOUR)},
  })
    .limit(500)
    .lean();
  let made = 0;
  for (const order of orders) {
    if (await issueInvoice(order).catch((err) => console.error('invoice', order.orderNo, err.message))) made++;
  }
  return made;
}

export function startInvoiceSweep() {
  const run = () => sweepInvoices().catch((err) => console.error('invoices', err.message));
  setTimeout(run, 90_000).unref();
  setInterval(run, HOUR).unref();
}
