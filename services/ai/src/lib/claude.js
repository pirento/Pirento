import Anthropic from '@anthropic-ai/sdk';
import {config} from '../config.js';
import {buildRequest} from './prompt.js';

// One client for the whole service; the SDK reads ANTHROPIC_API_KEY itself.
const client = config.enabled ? new Anthropic() : null;

/**
 * Streams one assistant turn. Calls `onText` for each piece of text as it
 * arrives and resolves with the final message, so the caller can check why it
 * stopped (a refusal, or running out of room).
 */
export async function streamReply(history, onText) {
  const stream = client.beta.messages.stream(buildRequest(history));
  stream.on('text', onText);
  return stream.finalMessage();
}
