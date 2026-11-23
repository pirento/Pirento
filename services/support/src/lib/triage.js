// Sorting a new ticket with Pirento AI, after it is saved: never slows or fails opening it. The AI can raise the
// priority (the queue lists high first) and fill in the product when the customer did not say.
import {PRODUCTS} from '@pirento/shared';
import {callService} from '@pirento/shared/server';
import {config} from '../config.js';
import {Ticket} from '../models/Ticket.js';

const RANK = {low: 0, medium: 1, high: 2};

/** The higher of the customer's and the AI's priority. */
export const higher = (a, b) => (RANK[b] > RANK[a] ? b : a);

export async function triage(ticket) {
  try {
    const t = await callService(
      config.aiUrl,
      '/internal/jobs/triage',
      {
        input: {
          subject: ticket.subject,
          message: ticket.messages[0]?.body?.slice(0, 2000),
          products: PRODUCTS.map((p) => p.slug),
        },
      },
      {timeoutMs: 60_000},
    );
    const product = PRODUCTS.some((p) => p.slug === t.product) ? t.product : undefined;
    await Ticket.updateOne(
      {_id: ticket._id},
      {
        $set: {
          triage: {priority: t.priority, product: product ?? '', category: String(t.category).slice(0, 40)},
          priority: higher(ticket.priority, t.priority),
          ...(!ticket.product && product && {product}),
        },
      },
    );
  } catch (err) {
    if (err.status !== 503) console.error('triage', err.message); // 503: the AI is off, nothing to do
  }
}
