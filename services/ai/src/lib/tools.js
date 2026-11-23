// The assistant's tools: reading the signed-in person's own account in another part of Pirento, opening a support
// ticket for them when they ask, and (when admin allows) web search for current public facts. The person is always
// the one signed in (never an id the model gives), and each service returns only a short summary.
import {callService} from '@pirento/shared/server';
import {config} from '../config.js';

export const AREAS = Object.keys(config.areas);

export const TOOLS = [
  {
    name: 'my_account',
    description:
      'Read the signed-in person\'s own Pirento account in one area: "wallet" (balance, last movements), "orders" ' +
      '(latest orders with status and links), "bharat_id" (application status and next step), "intern" (programme, ' +
      'mark, open tasks, paid work, applications, certificates) or "support" (their tickets). Use it whenever they ask ' +
      'about their own account instead of guessing. Returns JSON.',
    strict: true,
    input_schema: {
      type: 'object',
      properties: {area: {type: 'string', enum: AREAS}},
      required: ['area'],
      additionalProperties: false,
    },
  },
  {
    name: 'open_support_ticket',
    description:
      'Open a support ticket for the signed-in person. Only when they clearly ask you to raise a request, complaint ' +
      'or ticket, after you have told them the subject and message you will send. Write the message in their words, ' +
      'with the order number if there is one. Returns the ticket number and its link.',
    strict: true,
    input_schema: {
      type: 'object',
      properties: {subject: {type: 'string'}, message: {type: 'string'}},
      required: ['subject', 'message'],
      additionalProperties: false,
    },
  },
];

/** Anthropic's own web search, run on their side; a few searches per answer at most. */
export const WEB_SEARCH = {type: 'web_search_20260209', name: 'web_search', max_uses: 3};

/**
 * Runs one tool call for the signed-in person ({userId, email, product}). Never throws: a failure goes back to
 * the model as an error result.
 */
export async function runTool(name, input, who, call = callService) {
  const {userId} = typeof who === 'string' ? {userId: who} : who;
  if (name === 'open_support_ticket') {
    try {
      const data = await call(config.areas.support, '/internal/tickets', {
        userId,
        email: who.email,
        subject: String(input?.subject ?? '').slice(0, 120),
        message: String(input?.message ?? '').slice(0, 4000),
        ...(who.product && {product: who.product}),
      });
      return {content: JSON.stringify(data)};
    } catch (err) {
      return {content: `Could not open the ticket: ${err.message}`, is_error: true};
    }
  }
  if (name !== 'my_account' || !AREAS.includes(input?.area)) {
    return {content: 'Unknown tool or area', is_error: true};
  }
  try {
    const data = await call(config.areas[input.area], '/internal/assistant', {userId});
    return {content: JSON.stringify(data).slice(0, 8000)};
  } catch (err) {
    return {content: `Could not read ${input.area} right now: ${err.message}`, is_error: true};
  }
}
