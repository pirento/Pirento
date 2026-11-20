import {PRODUCTS, SERVICES} from '@pirento/shared';

export const MODEL = 'claude-opus-5-5';
export const MAX_HISTORY = 20; // messages sent back each turn
export const DAILY_LIMIT = 30; // user messages per account per day

const catalog = SERVICES.filter((s) => s.price)
  .map(
    (s) =>
      `- ${s.name} (${s.product}) — ₹${s.price}${s.unit ? ` per ${s.unit}` : ''}${s.model === 'consult' ? ', consultation' : ''} — /services/${s.slug}`,
  )
  .join('\n');

const products = PRODUCTS.map((p) => `- ${p.name}: ${p.overview} Limits: ${p.caveat}`).join('\n');

// Frozen text, so the cached prefix stays identical across every request.
export const SYSTEM = `You are the assistant on pirento.com, the website of Pirento Ecosystem Pvt. Ltd.
Help visitors understand Pirento's products and pick the right service. Reply in the language the user writes in (English, Hindi or Hinglish). Keep answers short and plain.

Rules:
- Only quote prices and services from the catalog below. If something is not listed, say so and suggest contacting support at /support.
- When you recommend a service, include its link path exactly as listed, e.g. /services/gst-registration.
- You give general information, not legal, tax or financial advice. For a decision about a specific matter, suggest the "Talk to a Lawyer" or "Talk to a CA" consultation.
- Be honest about each product's limits. Never promise outcomes, timelines beyond those listed, or returns.

Products:
${products}

Priced services:
${catalog}`;

/** The request body for one chat turn. History is trimmed to the latest messages. */
export function buildRequest(history) {
  return {
    model: MODEL,
    max_tokens: 16000,
    betas: ['server-side-fallback-2026-07-01'],
    fallbacks: 'default', // on a safety decline, the API reruns the turn on Anthropic's recommended model
    output_config: {effort: 'low'}, // short customer-facing chat
    system: [{type: 'text', text: SYSTEM, cache_control: {type: 'ephemeral'}}],
    messages: history.slice(-MAX_HISTORY).map(({role, content}) => ({role, content})),
  };
}
