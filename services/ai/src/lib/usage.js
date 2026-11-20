import {Chat} from '../models/Chat.js';

/** How many questions this person asked in the last 24 hours, across all chats. */
export async function questionsToday(userId) {
  const since = new Date(Date.now() - 86_400_000);
  const [{used = 0} = {}] = await Chat.aggregate([
    {$match: {userId}},
    {$unwind: '$messages'},
    {$match: {'messages.role': 'user', 'messages.at': {$gte: since}}},
    {$count: 'used'},
  ]);
  return used;
}
