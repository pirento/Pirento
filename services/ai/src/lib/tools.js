// The assistant's one tool: reading the signed-in person's own account in another part of Pirento. The person is
// always the one signed in (never an id the model gives), and each service returns only a short summary.
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
];

/** Runs one tool call for `userId`. Never throws: a failure goes back to the model as an error result. */
export async function runTool(name, input, userId, call = callService) {
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
