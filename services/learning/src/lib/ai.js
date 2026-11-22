// Asking the AI service for an intern job. Returns null when the AI is off or gave nothing, so every caller has a
// plain fallback and the programme never stops because of it.
import {callService, env} from '@pirento/shared/server';

const AI_URL = env('AI_URL', 'http://127.0.0.1:4009');

export async function ask(kind, input) {
  try {
    // A model answer takes longer than a normal internal call.
    return await callService(AI_URL, `/internal/intern/${kind}`, {input}, {timeoutMs: 120_000});
  } catch (err) {
    if (err.status !== 503) console.error('intern AI', kind, err.message);
    return null;
  }
}
