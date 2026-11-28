// Invoices. The customer (or staff) reads an order's invoice; finance and superadmins (admin → Invoices) list them
// by month, product and status with the GST totals, export a month as CSV for GST returns, print many at once,
// issue any missing, and set the seller address, number prefix and each product's SAC/HSN code and GST rate.
import {Router} from 'express';
import {z} from 'zod';
import {GST_RATES, PRODUCTS} from '@pirento/shared';
import {ACCESS, audit, isId, notFound, requireAuth, requireRole, validate} from '@pirento/shared/server';
import {findAccessible} from '../lib/orders.js';
import {invoiceProducts, invoiceSettings, issueInvoice, sweepInvoices} from '../lib/invoices.js';
import {Invoice} from '../models/Invoice.js';
import {InvoiceSettings} from '../models/InvoiceSettings.js';
import {Order} from '../models/Order.js';

export const invoiceRoutes = Router();
invoiceRoutes.use('/staff/invoices', requireAuth, requireRole(...ACCESS.payments));

/** The filter for a month (YYYY-MM, India time), a product, a kind and a status. */
function filterOf(query) {
  const f = {};
  const m = /^(\d{4})-(\d{2})$/.exec(String(query.month ?? ''));
  if (m) {
    const start = new Date(Date.UTC(+m[1], +m[2] - 1, 1) - 330 * 60_000);
    const end = new Date(Date.UTC(+m[1], +m[2], 1) - 330 * 60_000);
    f.issuedAt = {$gte: start, $lt: end};
  }
  if (PRODUCTS.some((p) => p.slug === query.product)) f.product = query.product;
  if (['tax', 'plain'].includes(query.kind)) f.kind = query.kind;
  if (['issued', 'cancelled'].includes(query.status)) f.status = query.status;
  const q = String(query.q ?? '').trim();
  if (/^\d{1,8}$/.test(q)) f.orderNo = Number(q);
  else if (q) {
    const text = {$regex: q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i'};
    f.$or = [{invoiceNo: text}, {'buyer.email': text}, {'buyer.name': text}, {'buyer.gstin': text}];
  }
  return f;
}

invoiceRoutes.get('/staff/invoices', async (req, res) => {
  const filter = filterOf(req.query);
  const [items, totals] = await Promise.all([
    Invoice.find(filter).sort({issuedAt: -1}).limit(200).lean(),
    // GST owed: issued invoices only; a credit note takes a cancelled one out.
    Invoice.aggregate([
      {$match: {...filter, status: 'issued'}},
      {
        $group: {
          _id: null,
          count: {$sum: 1},
          taxable: {$sum: '$amounts.taxable'},
          cgst: {$sum: '$amounts.cgst'},
          sgst: {$sum: '$amounts.sgst'},
          igst: {$sum: '$amounts.igst'},
          total: {$sum: '$amounts.total'},
        },
      },
    ]),
  ]);
  const {_id, ...sum} = totals[0] ?? {count: 0, taxable: 0, cgst: 0, sgst: 0, igst: 0, total: 0};
  res.json({data: {items, totals: sum}});
});

const csvCell = (v) => {
  const s = String(v ?? '');
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};
const rupees = (p) => (p / 100).toFixed(2);

/** A month (or any filter) as CSV, one row per invoice, amounts in rupees, for the GST return. */
invoiceRoutes.get('/staff/invoices/export', async (req, res) => {
  const items = await Invoice.find(filterOf(req.query)).sort({issuedAt: 1}).limit(10_000).lean();
  const head = [
    'Invoice no',
    'Date',
    'Order no',
    'Kind',
    'Status',
    'Credit note',
    'Buyer',
    'Buyer GSTIN',
    'Place of supply',
    'State code',
    'Code type',
    'SAC/HSN',
    'Description',
    'Qty',
    'GST %',
    'Taxable',
    'CGST',
    'SGST',
    'IGST',
    'Total',
  ];
  const rows = items.map((i) => [
    i.invoiceNo,
    new Date(i.issuedAt).toISOString().slice(0, 10),
    i.orderNo,
    i.kind,
    i.status,
    i.creditNote?.no ?? '',
    i.buyer?.name || i.buyer?.email,
    i.buyer?.gstin,
    i.placeOfSupply?.state,
    i.placeOfSupply?.code,
    i.line?.codeType,
    i.line?.code,
    i.line?.description,
    i.line?.qty,
    i.line?.rate ?? '',
    rupees(i.amounts.taxable),
    rupees(i.amounts.cgst),
    rupees(i.amounts.sgst),
    rupees(i.amounts.igst),
    rupees(i.amounts.total),
  ]);
  audit(req, 'invoice.export', String(req.query.month ?? 'all'), String(items.length));
  res
    .set('content-type', 'text/csv; charset=utf-8')
    .set('content-disposition', `attachment; filename="invoices-${req.query.month || 'all'}.csv"`)
    .send([head, ...rows].map((r) => r.map(csvCell).join(',')).join('\n'));
});

/** Several invoices to print in one go (`?ids=a,b`, up to 50), in the order asked. */
invoiceRoutes.get('/staff/invoices/print', async (req, res) => {
  const ids = String(req.query.ids ?? '')
    .split(',')
    .filter(isId)
    .slice(0, 50);
  const found = await Invoice.find({_id: {$in: ids}}).lean();
  res.json({data: ids.map((id) => found.find((i) => String(i._id) === id)).filter(Boolean)});
});

invoiceRoutes.get('/staff/invoices/settings', async (_req, res) => {
  const settings = await invoiceSettings();
  res.json({data: {settings, products: invoiceProducts(settings), rates: GST_RATES}});
});

/** The seller address, prefix and note. A change applies to invoices issued from now on. */
invoiceRoutes.put(
  '/staff/invoices/settings',
  validate(
    z.object({
      address: z.string().trim().max(300),
      prefix: z.string().regex(/^[A-Z]{2,5}$/, 'Two to five capital letters'),
      note: z.string().trim().max(300).default(''),
    }),
  ),
  async (req, res) => {
    const settings = await InvoiceSettings.findOneAndUpdate(
      {_id: 'main'},
      {$set: {...req.body, updatedBy: req.user.email}},
      {upsert: true, new: true},
    );
    audit(req, 'invoice.settings', 'main', req.body.prefix);
    res.json({data: settings});
  },
);

/** One product's SAC/HSN code and GST rate. Only products the catalogue sells; none is added here. */
invoiceRoutes.put(
  '/staff/invoices/settings/products/:product',
  validate(
    z.object({
      code: z.string().regex(/^\d{4,8}$/, 'A SAC or HSN code is 4 to 8 digits'),
      rate: z.union(GST_RATES.map((r) => z.literal(r))),
    }),
  ),
  async (req, res) => {
    const known = invoiceProducts(await invoiceSettings()).some((p) => p.product === req.params.product);
    if (!known) throw notFound('Not a product sold through orders');
    await InvoiceSettings.updateOne(
      {_id: 'main'},
      {$set: {[`products.${req.params.product}`]: req.body, updatedBy: req.user.email}},
      {upsert: true},
    );
    audit(req, 'invoice.product', req.params.product, `${req.body.code} at ${req.body.rate}%`);
    res.json({data: invoiceProducts(await invoiceSettings())});
  },
);

/** Issues the invoices any paid order is still missing. */
invoiceRoutes.post('/staff/invoices/sweep', async (req, res) => {
  const made = await sweepInvoices();
  audit(req, 'invoice.sweep', 'orders', String(made));
  res.json({data: {made}});
});

/** An order's invoice, for its customer or for staff. Issued now if payment just landed and it is not yet there. */
invoiceRoutes.get('/:id/invoice', requireAuth, async (req, res) => {
  const order = await findAccessible(req);
  const invoice =
    (await Invoice.findOne({orderId: String(order._id)}).lean()) ??
    (order.payment?.method ? await issueInvoice(await Order.findById(order._id).lean()) : null);
  if (!invoice) throw notFound('This order has no invoice yet');
  res.json({data: invoice});
});
