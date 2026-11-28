// Every notification Pirento sends, in one list: which product it belongs to, who gets it, which channels carry it by
// default (admin → Notifications can change them), whether a person may switch it off, and how it reads on each
// channel. The services only say what happened (`notify(userId, {event, brand, label, big, note, link})`); the words
// for email, SMS, WhatsApp and the dashboard bell are made here, once.

export const NOTICE_CHANNELS = ['dashboard', 'email', 'sms', 'whatsapp'];
export const CHANNEL_NAMES = {dashboard: 'Dashboard', email: 'Email', sms: 'SMS', whatsapp: 'WhatsApp'};

const all = {dashboard: true, email: true, sms: true, whatsapp: true};
const usual = {dashboard: true, email: true, sms: false, whatsapp: true};
const quiet = {dashboard: true, email: true, sms: false, whatsapp: false};

/**
 * `important`: about money, identity or safety; a person cannot switch its email or SMS off (WhatsApp always needs
 * their opt-in). `staff`: goes to the team, not customers. `sample` fills the previews in admin.
 */
export const NOTICE_EVENTS = [
  {
    id: 'order.update',
    product: 'orders',
    title: 'Order status',
    channels: usual,
    sample: {
      brand: 'Pirento Legal',
      label: 'Order #100231',
      big: 'In progress',
      note: 'GST registration: filing today.',
    },
  },
  {
    id: 'shipment.update',
    product: 'giftox',
    title: 'Parcel on its way',
    channels: all,
    sample: {brand: 'Giftox', label: 'Order #100245', big: 'On its way', note: 'Blue Dart waybill 70000000001.'},
  },
  {
    id: 'order.paid',
    product: 'orders',
    title: 'Payment received, with the invoice',
    channels: usual,
    sample: {brand: 'Pirento Legal', label: 'Order #100231', big: 'Paid · ₹999', note: 'Invoice PIR/26-27/00012.'},
  },
  {
    id: 'ticket.opened',
    product: 'support',
    title: 'Support ticket opened',
    channels: usual,
    sample: {brand: 'Pirento', label: 'Ticket #10000041', big: 'We have your request', note: '"Where is my GST?"'},
  },
  {
    id: 'ticket.reply',
    product: 'support',
    title: 'Reply to a support ticket',
    channels: usual,
    sample: {
      brand: 'Pirento',
      label: 'Ticket #10000041',
      big: 'New reply',
      note: 'The team answered "Where is my GST?".',
    },
  },
  {
    id: 'withdrawal.update',
    product: 'wallet',
    title: 'Withdrawal sent or returned',
    channels: all,
    important: true,
    sample: {brand: 'Pirento', label: 'Withdrawal', big: 'Sent', note: 'We sent ₹2,000 to you@upi. UTR 4012345678.'},
  },
  {
    id: 'commission.paid',
    product: 'one',
    title: 'Partner commission paid',
    channels: usual,
    sample: {brand: 'Pirento One', label: 'Order #100250', big: '₹150 commission', note: 'It is in your wallet.'},
  },
  {
    id: 'bharat-id.decision',
    product: 'bharat-id',
    title: 'Bharat ID approved or sent back',
    channels: all,
    important: true,
    sample: {
      brand: 'Bharat ID',
      label: 'Your application',
      big: 'BID 2026 0000 0012',
      note: 'Your Bharat ID is issued.',
    },
  },
  {
    id: 'bharat-id.status',
    product: 'bharat-id',
    title: 'Bharat ID suspended or restored',
    channels: all,
    important: true,
    sample: {
      brand: 'Bharat ID',
      label: 'Your Bharat ID works again',
      big: 'BID 2026 0000 0012',
      note: 'It is restored.',
    },
  },
  {
    id: 'bharat-id.change',
    product: 'bharat-id',
    title: 'Change to a Bharat ID',
    channels: usual,
    sample: {
      brand: 'Bharat ID',
      label: 'Change to address',
      big: 'Updated',
      note: 'Your Bharat ID shows the new address.',
    },
  },
  {
    id: 'bharat-id.sharing',
    product: 'bharat-id',
    title: 'A business asks to see your details',
    channels: all,
    important: true,
    sample: {brand: 'Bharat ID', label: 'Sharing request', big: 'Acme Bank', note: 'Acme Bank asks to see your name.'},
  },
  {
    id: 'business.request',
    product: 'bharat-id',
    title: 'Bharat ID for Business request',
    channels: quiet,
    sample: {brand: 'Bharat ID for Business', label: 'Acme Bank', big: 'Live', note: 'Your live keys work.'},
  },
  {
    id: 'ai.plan',
    product: 'ai',
    title: 'Pirento AI plan renewed or not',
    channels: usual,
    sample: {brand: 'Pirento AI', label: 'Plus plan', big: 'Renewed', note: 'Paid from your wallet.'},
  },
  {
    id: 'vault.checkin',
    product: 'vault',
    title: 'Vault check-in reminder',
    channels: all,
    important: true,
    sample: {
      brand: 'Pirento Vault',
      label: 'Are you well?',
      big: 'Reminder 1 of 3',
      note: 'Tap to tell us you are here.',
    },
  },
  {
    id: 'vault.linked',
    product: 'vault',
    title: 'Linked accounts updated',
    channels: quiet,
    sample: {
      brand: 'Pirento Vault',
      label: 'Linked accounts',
      big: '6 holdings updated',
      note: 'Fetched through Digio.',
    },
  },
  {
    id: 'vault.expiry',
    product: 'vault',
    title: 'A stored document expires soon',
    channels: usual,
    sample: {brand: 'Pirento Vault', label: 'Passport', big: 'Expires in 30 days', note: 'Renew it, then upload it.'},
  },
  {
    id: 'intern.programme',
    product: 'intern',
    title: 'Intern programme results and grades',
    channels: usual,
    sample: {
      brand: 'Pirento Intern',
      label: '6-month programme',
      big: 'Finished · 82%',
      note: 'Your certificate is ready.',
    },
  },
  {
    id: 'intern.work',
    product: 'intern',
    title: 'Paid work assigned or reviewed',
    channels: usual,
    sample: {
      brand: 'Pirento Intern',
      label: 'Logo for Green',
      big: 'New paid work for you',
      note: '₹1,500 on approval.',
    },
  },
  {
    id: 'intern.application',
    product: 'intern',
    title: 'Internship applications and tasks',
    channels: usual,
    sample: {brand: 'Pirento Intern', label: 'Your internship', big: 'A new task', note: 'Write the launch post.'},
  },
  {
    id: 'intern.opening',
    product: 'intern',
    title: 'Company openings reviewed',
    channels: quiet,
    sample: {
      brand: 'Pirento Intern',
      label: 'Design intern',
      big: 'Your opening is live',
      note: 'People can apply now.',
    },
  },
  {
    id: 'staff.assigned',
    product: 'admin',
    title: 'Work assigned to a staff member',
    channels: quiet,
    staff: true,
    sample: {brand: 'Pirento admin', label: 'Ticket #10000041', big: 'Assigned to you', note: 'From boss@pirento.com.'},
  },
  {
    id: 'general',
    product: 'pirento',
    title: 'Anything else',
    channels: quiet,
    sample: {brand: 'Pirento', label: 'Your account', big: 'Updated', note: 'A change on your account.'},
  },
];

export const noticeEvent = (id) => NOTICE_EVENTS.find((e) => e.id === id) ?? NOTICE_EVENTS.at(-1);

const oneLine = (s) =>
  String(s ?? '')
    .replace(/\s+/g, ' ')
    .trim();

/** The link a notice points to, made absolute for messages that leave the site. */
const full = (link, site) => (link ? (/^https?:/.test(link) ? link : `${site}${link}`) : '');

/**
 * How one notice reads on each channel. Dashboard: the row as given. Email: a subject and the lines of the body.
 * SMS: one line within 300 characters. WhatsApp: the four values of the approved "pirento_update" template (no new
 * lines, each within 1024 characters, as Meta requires) and the same as free text for an open chat.
 */
export function renderNotice(n, site = 'https://pirento.com') {
  const link = full(n.link, site);
  const brand = oneLine(n.brand || 'Pirento');
  const label = oneLine(n.label);
  const big = oneLine(n.big);
  const note = oneLine(n.note);
  const sms = `${brand}: ${label} - ${big}. ${note}${link ? ` ${link}` : ''}`;
  return {
    dashboard: {brand, label, big, note, link: n.link ?? ''},
    email: {subject: `${brand}: ${big} · ${label}`, lines: [label, big, note, link].filter(Boolean)},
    sms: sms.length > 300 ? `${sms.slice(0, 297)}...` : sms,
    whatsapp: {
      template: [brand, label, big, `${note}${link ? ` ${link}` : ''}`].map((v) => v.slice(0, 1024) || '-'),
      text: [`*${brand}*`, `${label}: *${big}*`, note, link].filter(Boolean).join('\n'),
    },
  };
}
