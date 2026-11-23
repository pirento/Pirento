// Pirento AI for the team on one order (Legal tools 7–11 in docs/AI.md): a draft from the order's answers, a check of
// a document before it goes out, a summary with next steps, details read from a document, and a customer summary of
// the lawyer's call notes. The order must be one this staffer may open; nothing is saved or sent by itself.
import {Router} from 'express';
import {z} from 'zod';
import {
  ACCESS,
  ApiError,
  audit,
  callService,
  openFile,
  isId,
  notFound,
  requireAuth,
  requireRole,
} from '@pirento/shared/server';
import {config} from '../config.js';
import {OrderFile} from '../models/OrderFile.js';
import {findAccessible} from '../lib/orders.js';
import {orderFacts} from '../lib/facts.js';

export const aiRoutes = Router();

const READABLE = /^(application\/pdf|image\/(png|jpeg|webp|gif)|text\/plain)$/;
const MAX_BYTES = 4.5 * 1024 * 1024; // base64 grows it by a third; the AI service takes 8 MB a request

/** One of the order's documents as something the model can read. */
async function fileFor(order, fileId) {
  const f = isId(fileId) && (await OrderFile.findOne({_id: fileId, orderId: String(order._id)}));
  if (!f) throw notFound('Document not found');
  if (!READABLE.test(f.type ?? '')) throw new ApiError(400, 'NOT_READABLE', 'The AI reads PDFs, photos and text files');
  if (f.size > MAX_BYTES) throw new ApiError(400, 'TOO_LARGE', 'This document is too large for the AI to read');
  const bytes = await openFile(config.fileKey, f);
  return f.type === 'text/plain'
    ? {type: 'document', source: {type: 'text', media_type: 'text/plain', data: bytes.toString('utf8')}}
    : {
        type: f.type === 'application/pdf' ? 'document' : 'image',
        source: {type: 'base64', media_type: f.type, data: bytes.toString('base64')},
      };
}

const KINDS = {
  orderDraft: z.object({docType: z.string().trim().min(3).max(120), extra: z.string().trim().max(2000).default('')}),
  orderSummary: z.object({}),
  consultSummary: z.object({notes: z.string().trim().min(10, 'Paste your call notes').max(6000)}),
  deliverableCheck: z.object({fileId: z.string()}),
  extract: z.object({fileId: z.string()}),
};

aiRoutes.post('/staff/:id/ai/:kind', requireAuth, requireRole(...ACCESS.orders), async (req, res) => {
  const schema = Object.hasOwn(KINDS, req.params.kind) && KINDS[req.params.kind];
  if (!schema) throw notFound('No such tool');
  const parsed = schema.safeParse(req.body ?? {});
  if (!parsed.success) throw new ApiError(400, 'INVALID_INPUT', parsed.error.issues[0].message);
  const order = await findAccessible(req);
  const facts = await orderFacts(order);
  const attachments = parsed.data.fileId ? [await fileFor(order, parsed.data.fileId)] : [];
  const {fileId, ...rest} = parsed.data;
  const input = {order: facts, ...rest, ...(req.params.kind === 'extract' && {questions: Object.keys(facts.answers)})};
  const out = await callService(
    config.aiUrl,
    '/internal/jobs/' + req.params.kind,
    {input, attachments},
    {timeoutMs: 120_000},
  );
  audit(req, `order.ai.${req.params.kind}`, `#${order.orderNo}`);
  res.json({data: out});
});
