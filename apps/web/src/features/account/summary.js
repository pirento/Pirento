// The one sentence under the greeting: what needs you, in plain words. Pure, so it is easy to test.
const plural = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`;

export function summaryLine({orders, tickets, identity}) {
  const unpaid = orders?.filter((o) => o.status === 'pending_payment').length ?? 0;
  const working = orders?.filter((o) => ['paid', 'in_progress'].includes(o.status)).length ?? 0;
  const replies = tickets?.filter((t) => t.status === 'answered').length ?? 0;
  const parts = [
    unpaid && `${plural(unpaid, 'order')} waiting for payment`,
    working && `${plural(working, 'order')} with our team`,
    replies && `${plural(replies, 'support reply')} to read`,
    identity?.status === 'rejected' && 'your Bharat ID needs a change',
  ].filter(Boolean);
  if (!parts.length) return 'Nothing needs you right now.';
  const last = parts.pop();
  return `You have ${parts.length ? `${parts.join(', ')} and ${last}` : last}.`;
}

export const greeting = (hour) => (hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening');
