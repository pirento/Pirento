// The team's knowledge articles as one block of the assistant's instructions. It changes only when an article is
// saved, so it is cached (and kept as its own cached prompt block).
import {cached} from '@pirento/shared/server';
import {Knowledge} from '../models/Knowledge.js';

const MAX_CHARS = 60_000; // about 15k tokens: a large handbook still fits; past it, the oldest edits drop out

export const knowledgeText = () =>
  cached('ai:knowledge', 300, async () => {
    const rows = await Knowledge.find({published: true}).sort({product: 1, title: 1}).lean();
    let text = '';
    for (const k of rows) {
      const entry = `## ${k.title}${k.product ? ` (${k.product})` : ''}\n${k.body}\n\n`;
      if (text.length + entry.length > MAX_CHARS) break;
      text += entry;
    }
    return text.trim();
  });
