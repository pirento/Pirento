// Documents on an order: the customer sends their papers, the team sends back the finished work.
// Files are encrypted at rest and always downloaded, never shown in the browser.
import express, {Router} from 'express';
import {ApiError, audit, badInput, canUse, decrypt, encrypt, isId, notFound, requireAuth} from '@pirento/shared/server';
import {config} from '../config.js';
import {Order} from '../models/Order.js';
import {OrderFile, WITHOUT_BYTES} from '../models/OrderFile.js';
import {findAccessible} from '../lib/orders.js';

export const fileRoutes = Router();
fileRoutes.use(['/files', '/:id/files'], requireAuth);

/** The order, and which side the caller is on: its customer, the team, or null for read-only staff (support). */
async function orderAndSide(req) {
  const order = await findAccessible(req);
  if (order.userId === req.user.sub) return {order, side: 'customer'};
  return {order, side: canUse(req, 'orders') ? 'team' : null};
}

/** Every document on the caller's own orders, optionally for one product: the dashboard's Documents page. */
fileRoutes.get('/files/mine', async (req, res) => {
  const filter = {userId: req.user.sub};
  if (typeof req.query.product === 'string') {
    const ids = await Order.find({userId: req.user.sub, product: req.query.product}, {_id: 1}).lean();
    filter.orderId = {$in: ids.map((o) => String(o._id))};
  }
  res.json({data: await OrderFile.find(filter, WITHOUT_BYTES).sort({createdAt: -1}).limit(300)});
});

fileRoutes.get('/:id/files', async (req, res) => {
  const {order} = await orderAndSide(req);
  res.json({data: await OrderFile.find({orderId: String(order._id)}, WITHOUT_BYTES).sort({createdAt: -1})});
});

// The browser always sends application/octet-stream; the real type travels in x-file-type, the name in x-file-name.
fileRoutes.post(
  '/:id/files',
  express.raw({type: 'application/octet-stream', limit: config.maxFileBytes}),
  async (req, res) => {
    const {order, side} = await orderAndSide(req);
    if (!side) throw new ApiError(403, 'FORBIDDEN', 'Your role can read documents but not add them');
    if (order.status === 'cancelled') throw badInput('This order was cancelled');
    let name = '';
    try {
      name = decodeURIComponent(String(req.headers['x-file-name'] ?? ''))
        .trim()
        .slice(0, 200);
    } catch {
      // A broken name is treated like no name.
    }
    if (!name || !Buffer.isBuffer(req.body) || !req.body.length) throw badInput('Choose a file to upload');
    if ((await OrderFile.countDocuments({orderId: String(order._id)})) >= config.maxFilesPerOrder) {
      throw badInput(`An order can hold at most ${config.maxFilesPerOrder} documents`);
    }
    const file = await OrderFile.create({
      orderId: String(order._id),
      userId: order.userId,
      from: side,
      by: side === 'team' ? req.user.email : undefined,
      name,
      type: String(req.headers['x-file-type'] ?? '').slice(0, 100) || undefined,
      size: req.body.length,
      ...encrypt(config.fileKey, req.body),
    });
    if (side === 'team') audit(req, 'order.file', `#${order.orderNo}`, name);
    const {_id, from, size, type, createdAt} = file;
    res.status(201).json({data: {_id, orderId: file.orderId, from, name, size, type, createdAt}});
  },
);

const fileOf = async (req, order) => {
  const file =
    isId(req.params.fileId) && (await OrderFile.findOne({_id: req.params.fileId, orderId: String(order._id)}));
  if (!file) throw notFound('Document not found');
  return file;
};

fileRoutes.get('/:id/files/:fileId', async (req, res) => {
  const {order} = await orderAndSide(req);
  const file = await fileOf(req, order);
  res.set({
    // Always a download, never rendered: an uploaded HTML file must not run on our origin.
    'content-type': 'application/octet-stream',
    'content-disposition': `attachment; filename*=UTF-8''${encodeURIComponent(file.name)}`,
    'cache-control': 'no-store',
  });
  res.send(decrypt(config.fileKey, file));
});

/** Each side removes only what it sent, and nothing once the order is completed. */
fileRoutes.delete('/:id/files/:fileId', async (req, res) => {
  const {order, side} = await orderAndSide(req);
  const file = await fileOf(req, order);
  if (file.from !== side) throw new ApiError(403, 'FORBIDDEN', 'You can only remove documents you sent');
  if (order.status === 'completed') throw badInput('A completed order keeps its documents');
  await file.deleteOne();
  if (side === 'team') audit(req, 'order.file.delete', `#${order.orderNo}`, file.name);
  res.json({data: {deleted: true}});
});
