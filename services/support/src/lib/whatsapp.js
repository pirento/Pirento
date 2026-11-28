// The WhatsApp bot. A message comes in; the number is matched to its Pirento account (the account's mobile); then the
// menu, STOP/START, a hand-over to a person (which opens a ticket), or Pirento AI answers with the person's own
// account (orders, parcels, invoices, tickets, wallet, Bharat ID). Every message in and out is kept for the team's
// inbox. Free text is sent only inside WhatsApp's 24-hour window; outside it the approved template carries it.
import {WA_TEXT, waIntent} from '@pirento/shared';
import {callService, env, sendWhatsApp} from '@pirento/shared/server';
import {config} from '../config.js';
import {Ticket} from '../models/Ticket.js';
import {WaChat} from '../models/WaChat.js';
import {WaMessage} from '../models/WaMessage.js';
import {WaSettings} from '../models/WaSettings.js';
import {openTicket} from './tickets.js';

const DAY = 86_400_000;
const indiaDay = (d = new Date()) => new Date(d.getTime() + 330 * 60_000).toISOString().slice(0, 10);

export const waSettings = () =>
  WaSettings.findOneAndUpdate({_id: 'main'}, {$setOnInsert: {bot: true}}, {upsert: true, new: true}).lean();

/** Whether free text may go now: the person wrote in the last 24 hours. */
export const windowOpen = (chat) => Boolean(chat.lastInboundAt && Date.now() - new Date(chat.lastInboundAt) < DAY);

/** Sends text to a chat (free text in the window, else the update template) and keeps it. */
export async function sendText(chat, text, {from = 'bot', by} = {}) {
  let waMessageId;
  let error;
  try {
    waMessageId = windowOpen(chat)
      ? await sendWhatsApp(chat.wa, {text})
      : await sendWhatsApp(chat.wa, {
          template: env('WHATSAPP_NOTICE_TEMPLATE', 'pirento_update'),
          params: ['Pirento', 'Support', 'New message', text.replace(/\s+/g, ' ').slice(0, 1000)],
        });
  } catch (err) {
    error = err.message;
  }
  const msg = await WaMessage.create({
    chatId: String(chat._id),
    dir: 'out',
    from,
    by,
    text,
    ...(waMessageId && {waMessageId}),
    status: error ? 'failed' : 'sent',
    error,
  });
  await WaChat.updateOne({_id: chat._id}, {$set: {lastAt: new Date(), lastText: text.slice(0, 200)}});
  return msg;
}

/** The chat for a number, made on first contact, with its account looked up while it has none. */
async function chatFor(wa, name) {
  let chat = await WaChat.findOneAndUpdate(
    {wa},
    {$setOnInsert: {wa}, ...(name && {$set: {name: name.slice(0, 80)}})},
    {upsert: true, new: true},
  );
  if (!chat.userId) {
    const account = await callService(config.authUrl, '/internal/account-by-phone', {phone: wa}).catch(() => null);
    if (account) {
      chat = await WaChat.findByIdAndUpdate(
        chat._id,
        {$set: {userId: account.userId, email: account.email}},
        {new: true},
      );
    }
  }
  return chat;
}

/** The last messages as a conversation for the AI: the person as user, the bot and the team as assistant. */
async function historyOf(chat) {
  const rows = await WaMessage.find({chatId: String(chat._id), text: {$ne: ''}})
    .sort({createdAt: -1})
    .limit(12)
    .lean();
  const turns = [];
  for (const m of rows.reverse()) {
    const role = m.dir === 'in' ? 'user' : 'assistant';
    if (turns.at(-1)?.role === role) turns.at(-1).content += `\n${m.text}`;
    else turns.push({role, content: m.text});
  }
  while (turns[0]?.role === 'assistant') turns.shift();
  return turns.slice(-20);
}

/** One AI answer, within the number's daily allowance (taken with one conditional update). */
async function aiAnswer(chat, settings) {
  if (!settings.ai) return WA_TEXT.fallback;
  const day = indiaDay();
  const took = await WaChat.updateOne(
    {_id: chat._id, $or: [{aiDay: {$ne: day}}, {aiCount: {$lt: settings.dailyAi ?? 30}}]},
    [{$set: {aiCount: {$cond: [{$eq: ['$aiDay', day]}, {$add: ['$aiCount', 1]}, 1]}, aiDay: day}}],
  );
  if (!took.modifiedCount) return WA_TEXT.limit;
  try {
    const {reply} = await callService(
      config.aiUrl,
      '/internal/chat-turn',
      {userId: chat.userId, email: chat.email, channel: 'whatsapp', history: await historyOf(chat)},
      {timeoutMs: 90_000},
    );
    return reply.slice(0, 4000);
  } catch {
    return WA_TEXT.fallback;
  }
}

/** Hands the chat to the team: staff mode, and a ticket (for a known account) holding what was said so far. */
async function handOver(chat) {
  let ticket = chat.ticketId && (await Ticket.findOne({_id: chat.ticketId, status: {$ne: 'closed'}}));
  if (!ticket && chat.userId) {
    const said = (await historyOf(chat))
      .filter((t) => t.role === 'user')
      .map((t) => t.content)
      .join('\n')
      .slice(-3000);
    ticket = await openTicket({
      userId: chat.userId,
      email: chat.email,
      subject: 'WhatsApp chat',
      message: said || 'Asked on WhatsApp to talk to a person.',
      priority: 'medium',
      via: 'whatsapp',
    });
  }
  await WaChat.updateOne(
    {_id: chat._id},
    {$set: {mode: 'staff', ...(ticket && {ticketId: String(ticket._id), ticketNo: ticket.ticketNo})}},
  );
  return WA_TEXT.handover(ticket?.ticketNo);
}

/** Handles one incoming message. Safe to call twice for the same WhatsApp id: the second is ignored. */
export async function handleInbound({wa, name, text, waMessageId}) {
  if (waMessageId && (await WaMessage.exists({waMessageId}))) return null;
  const chat = await chatFor(wa, name);
  try {
    await WaMessage.create({chatId: String(chat._id), dir: 'in', from: 'customer', text: text ?? '', waMessageId});
  } catch (err) {
    if (err.code === 11000) return null; // the same message, handled by another copy
    throw err;
  }
  const now = new Date();
  const live = await WaChat.findByIdAndUpdate(
    chat._id,
    {$set: {lastInboundAt: now, lastAt: now, lastText: String(text ?? '').slice(0, 200)}, $inc: {unread: 1}},
    {new: true},
  );
  // With the team: the message waits in their inbox, and joins the chat's ticket.
  if (live.mode === 'staff') {
    if (live.ticketId && text) {
      await Ticket.updateOne(
        {_id: live.ticketId, status: {$ne: 'closed'}},
        {$push: {messages: {from: 'customer', body: `[WhatsApp] ${text}`.slice(0, 4000)}}, $set: {status: 'open'}},
      );
    }
    return null;
  }
  const settings = await waSettings();
  if (!settings.bot) return null;
  if (!text) return sendText(live, WA_TEXT.notText);

  const intent = waIntent(text);
  let reply;
  if (intent.kind === 'menu') {
    reply = [
      settings.greeting || WA_TEXT.hello(live.name),
      WA_TEXT.menu(),
      !live.userId && WA_TEXT.unlinked(config.siteUrl),
    ]
      .filter(Boolean)
      .join('\n\n');
  } else if (intent.kind === 'stop' || intent.kind === 'start') {
    if (!live.userId) reply = WA_TEXT.unlinked(config.siteUrl);
    else {
      await callService(config.authUrl, '/internal/notice-prefs', {
        userId: live.userId,
        whatsapp: intent.kind === 'start',
      });
      reply = intent.kind === 'start' ? WA_TEXT.started : WA_TEXT.stopped;
    }
  } else if (intent.kind === 'human') {
    reply = await handOver(live);
  } else {
    reply = await aiAnswer(live, settings);
  }
  return sendText(live, reply);
}

/** Delivery receipts from WhatsApp: sent → delivered → read, or failed with Meta's reason. */
export async function statusUpdate({id, status, errors}) {
  if (!id || !status) return;
  await WaMessage.updateOne(
    {waMessageId: id},
    {$set: {status, ...(errors?.[0] && {error: String(errors[0].title ?? errors[0].message).slice(0, 200)})}},
  );
}
