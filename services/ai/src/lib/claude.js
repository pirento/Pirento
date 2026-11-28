// One client for the whole service; the SDK reads ANTHROPIC_API_KEY itself.
import Anthropic from '@anthropic-ai/sdk';
import {config} from '../config.js';
import {buildRequest} from './prompt.js';
import {TOOLS, WEB_SEARCH, runTool} from './tools.js';

const client = config.enabled ? new Anthropic() : null;
const MAX_ROUNDS = 4; // account lookups per turn: enough for two or three areas; then it must answer

/**
 * Streams one assistant turn, calling our tools when the model asks, always for the signed-in person (`who`). Calls `onText`
 * for each piece of text as it arrives and resolves with the final message, so the caller can check why it
 * stopped (a refusal, or running out of room). Tool rounds are not saved: the chat keeps questions and answers.
 */
export async function streamReply(
  history,
  onText,
  {who, product, knowledge, webSearch, attachment, memory, channel, noTools} = {},
) {
  const extra = [];
  // Without a known person (a WhatsApp number on no account) there is no account to read: no tools at all.
  const tools = noTools ? undefined : webSearch ? [...TOOLS, WEB_SEARCH] : TOOLS;
  for (let round = 0; ; round++) {
    const stream = client.beta.messages.stream(
      buildRequest(history, {knowledge, product, tools, extra, attachment, memory, channel, linked: !noTools}),
    );
    stream.on('text', onText);
    const msg = await stream.finalMessage();
    if (msg.stop_reason === 'pause_turn') {
      extra.push({role: 'assistant', content: msg.content});
      continue;
    }
    // Past the cap a further call ends the turn (the route says the reply was cut short).
    if (msg.stop_reason !== 'tool_use' || round > MAX_ROUNDS) return msg;
    extra.push({role: 'assistant', content: msg.content});
    const uses = msg.content.filter((b) => b.type === 'tool_use');
    const results = await Promise.all(
      uses.map(async (u) => ({
        type: 'tool_result',
        tool_use_id: u.id,
        ...(round < MAX_ROUNDS
          ? await runTool(u.name, u.input, who)
          : {content: 'Enough lookups for this question: answer with what you have.', is_error: true}),
      })),
    );
    extra.push({role: 'user', content: results});
  }
}
