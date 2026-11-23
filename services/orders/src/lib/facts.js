// An order as facts for Pirento AI: what was bought, where it stands, the answers, the conversation and the
// documents' names. Never the customer's email or payment ids.
import {askedQuestions, getService, statusLabel} from '@pirento/shared';
import {OrderFile, WITHOUT_BYTES} from '../models/OrderFile.js';

export async function orderFacts(order) {
  const files = await OrderFile.find({orderId: String(order._id)}, WITHOUT_BYTES)
    .sort({createdAt: 1})
    .lean();
  const answers = Object.fromEntries(
    askedQuestions(order)
      .filter((q) => order.intake?.[q.id])
      .map((q) => [q.label, String(order.intake[q.id]).slice(0, 500)]),
  );
  return {
    orderNo: order.orderNo,
    product: order.product,
    service: order.serviceName,
    consultation: getService(order.serviceSlug)?.model === 'consult',
    status: statusLabel(order.status),
    placed: order.createdAt,
    timeline: (order.timeline ?? []).map((t) => ({status: statusLabel(t.status), note: t.note, at: t.at})),
    answers,
    details: order.details ?? null,
    messages: (order.messages ?? [])
      .slice(-20)
      .map((m) => ({from: m.from, body: String(m.body).slice(0, 1500), at: m.at})),
    documents: files.map((f) => ({id: String(f._id), name: f.name, from: f.from})),
    fulfilment: order.fulfilment ?? null,
  };
}
