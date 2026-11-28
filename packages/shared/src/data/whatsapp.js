// Pirento on WhatsApp: the bot's menu and its fixed replies, shared by the support service (which answers) and the
// website's WhatsApp page (which shows what people can do there). Anything not on the menu goes to Pirento AI.

export const WA_MENU = [
  {key: '1', label: 'My orders', ask: 'Show my latest orders with their status.'},
  {key: '2', label: 'Track my parcel', ask: 'Where are my parcels? Give the waybill and the latest scan.'},
  {key: '3', label: 'Invoices and payments', ask: 'Show my invoices and what I paid recently, with links.'},
  {key: '4', label: 'My support tickets', ask: 'Show my support tickets and where each one stands.'},
  {key: '5', label: 'Wallet balance', ask: 'What is my wallet balance and my last movements?'},
  {key: '6', label: 'Bharat ID status', ask: 'Where does my Bharat ID stand, and what is my next step?'},
  {key: '7', label: 'Talk to a person'},
];

/** Words that do the same as a menu number (typed in English or Hinglish). */
export const WA_WORDS = {
  menu: ['menu', 'hi', 'hello', 'hey', 'namaste', 'start over', 'help', '0', '?'],
  human: ['7', 'agent', 'human', 'person', 'talk to a person', 'support', 'call me', 'team'],
  stop: ['stop', 'unsubscribe', 'band karo'],
  start: ['start', 'subscribe', 'chalu karo'],
};

export const WA_TEXT = {
  hello: (name) => `Namaste${name ? ` ${name}` : ''}! This is Pirento on WhatsApp.`,
  menu: () =>
    [
      'Reply with a number, or just ask in your own words:',
      ...WA_MENU.map((m) => `*${m.key}* ${m.label}`),
      'Type *STOP* to stop notices here, *MENU* for this list.',
    ].join('\n'),
  unlinked: (site) =>
    `This number is not on a Pirento account yet, so I cannot see your orders. Add it at ${site}/account, then write again. I can still answer general questions.`,
  handover: (ticketNo) =>
    `A person from our team will reply here${ticketNo ? `. Your ticket is *#${ticketNo}*` : ''}. Our hours are 10 am to 7 pm, Monday to Saturday.`,
  stopped: 'Done: no more Pirento notices on WhatsApp. Type *START* to turn them back on.',
  started: 'Done: Pirento notices will come here on WhatsApp. Type *STOP* any time to turn them off.',
  fallback: 'I could not answer that just now. Type *MENU* for options, or *7* to talk to a person.',
  limit: 'That is all the AI answers for today on this number. Type *7* to talk to a person.',
  notText: 'I can read text messages for now. Please type your question, or *MENU*.',
};

/** What a message asks for: a menu command, a word, or free text for the AI. */
export function waIntent(raw) {
  const text = String(raw ?? '').trim();
  const t = text.toLowerCase();
  if (WA_WORDS.stop.includes(t)) return {kind: 'stop'};
  if (WA_WORDS.start.includes(t)) return {kind: 'start'};
  if (WA_WORDS.human.includes(t)) return {kind: 'human'};
  if (WA_WORDS.menu.includes(t)) return {kind: 'menu'};
  const item = WA_MENU.find((m) => m.key === t && m.ask);
  if (item) return {kind: 'ask', text: item.ask};
  return {kind: 'ask', text};
}
