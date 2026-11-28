// WhatsApp: Meta's webhook (the verification handshake, then messages and delivery receipts, signed with the app
// secret and answered 200 at once), and admin → WhatsApp for the team: the chats, a reply box, taking a chat over or
// handing it back to the bot, a Pirento AI draft, and the bot's settings.
import {Router} from 'express';
import {z} from 'zod';
import {
  ACCESS,
  ApiError,
  audit,
  callService,
  isId,
  notFound,
  requireAuth,
  requireRole,
  validate,
  whatsappNumber,
  whatsappOn,
  whatsappSignatureOk,
} from '@pirento/shared/server';
import {config} from '../config.js';
import {Ticket} from '../models/Ticket.js';
import {WaChat} from '../models/WaChat.js';
import {WaMessage} from '../models/WaMessage.js';
import {WaSettings} from '../models/WaSettings.js';
import {handleInbound, sendText, statusUpdate, waSettings, windowOpen} from '../lib/whatsapp.js';

export const whatsappWebhook = Router();
export const whatsappStaff = Router();
whatsappStaff.use(['/staff/whatsapp', '/staff/whatsapp-settings'], requireAuth, requireRole(...ACCESS.whatsapp));

/** Meta checks the webhook once: echo the challenge when the verify token matches. */
whatsappWebhook.get('/whatsapp/webhook', (req, res) => {
  const ok =
    req.query['hub.mode'] === 'subscribe' &&
    config.whatsappVerifyToken &&
    req.query['hub.verify_token'] === config.whatsappVerifyToken;
  if (!ok) throw new ApiError(403, 'FORBIDDEN', 'Verify token does not match');
  res.type('text/plain').send(String(req.query['hub.challenge'] ?? ''));
});

whatsappWebhook.post('/whatsapp/webhook', async (req, res) => {
  if (!whatsappSignatureOk(req.rawBody, req.get('x-hub-signature-256'))) {
    throw new ApiError(400, 'BAD_SIGNATURE', 'Signature does not match');
  }
  // Meta retries anything slow or failed, so answer first and work after.
  res.json({data: {received: true}});
  for (const entry of req.body?.entry ?? []) {
    for (const change of entry.changes ?? []) {
      const v = change.value ?? {};
      const names = Object.fromEntries((v.contacts ?? []).map((c) => [c.wa_id, c.profile?.name]));
      for (const m of v.messages ?? []) {
        const text = m.text?.body ?? m.interactive?.list_reply?.id ?? m.interactive?.button_reply?.id ?? m.button?.text;
        handleInbound({wa: m.from, name: names[m.from], text, waMessageId: m.id}).catch((err) =>
          console.error('whatsapp in', err.message),
        );
      }
      for (const st of v.statuses ?? []) statusUpdate(st).catch((err) => console.error('whatsapp status', err.message));
    }
  }
});

// ── The team's inbox ────────────────────────────────────────────────────

whatsappStaff.get('/staff/whatsapp', async (req, res) => {
  const f = {};
  if (['bot', 'staff'].includes(req.query.mode)) f.mode = req.query.mode;
  const q = String(req.query.q ?? '').replace(/\D/g, '');
  if (q) f.wa = {$regex: q};
  const [items, counts, settings] = await Promise.all([
    WaChat.find(f).sort({lastAt: -1}).limit(100).lean(),
    WaChat.aggregate([{$group: {_id: '$mode', n: {$sum: 1}, unread: {$sum: '$unread'}}}]),
    waSettings(),
  ]);
  res.json({
    data: {
      on: whatsappOn(),
      number: whatsappNumber(),
      settings,
      items: items.map((c) => ({...c, windowOpen: windowOpen(c)})),
      counts: Object.fromEntries(counts.map((c) => [c._id, {chats: c.n, unread: c.unread}])),
    },
  });
});

async function chatOf(req) {
  const chat = isId(req.params.id) && (await WaChat.findById(req.params.id));
  if (!chat) throw notFound('No such chat');
  return chat;
}

whatsappStaff.get('/staff/whatsapp/:id', async (req, res) => {
  const chat = await chatOf(req);
  const messages = await WaMessage.find({chatId: String(chat._id)})
    .sort({createdAt: -1})
    .limit(200)
    .lean();
  await WaChat.updateOne({_id: chat._id}, {$set: {unread: 0}});
  res.json({data: {chat: {...chat.toObject(), windowOpen: windowOpen(chat)}, messages: messages.reverse()}});
});

/** A reply from the team: the chat moves to them, and the reply joins its ticket. */
whatsappStaff.post(
  '/staff/whatsapp/:id/reply',
  validate(z.object({text: z.string().trim().min(1).max(4000)})),
  async (req, res) => {
    const chat = await chatOf(req);
    await WaChat.updateOne(
      {_id: chat._id},
      {$set: {mode: 'staff', assignee: {id: req.user.sub, email: req.user.email}, unread: 0}},
    );
    const msg = await sendText(chat, req.body.text, {from: 'staff', by: req.user.email});
    if (chat.ticketId) {
      await Ticket.updateOne(
        {_id: chat.ticketId},
        {
          $push: {messages: {from: 'staff', body: `[WhatsApp] ${req.body.text}`, by: req.user.email}},
          $set: {status: 'answered'},
        },
      );
    }
    audit(req, 'whatsapp.reply', chat.wa.slice(-4), msg.status);
    if (msg.status === 'failed') throw new ApiError(502, 'WHATSAPP_FAILED', msg.error || 'WhatsApp did not take it');
    res.json({data: msg});
  },
);

/** Take a chat (the bot stops answering it) or hand it back to the bot. */
whatsappStaff.post(
  '/staff/whatsapp/:id/mode',
  validate(z.object({mode: z.enum(['bot', 'staff'])})),
  async (req, res) => {
    const chat = await chatOf(req);
    const set =
      req.body.mode === 'staff'
        ? {$set: {mode: 'staff', assignee: {id: req.user.sub, email: req.user.email}}}
        : {$set: {mode: 'bot'}, $unset: {assignee: 1}};
    const updated = await WaChat.findByIdAndUpdate(chat._id, set, {new: true});
    audit(req, `whatsapp.${req.body.mode}`, chat.wa.slice(-4));
    res.json({data: updated});
  },
);

/** Pirento AI drafts the team's next reply from the chat; a person reads and sends it. */
whatsappStaff.post('/staff/whatsapp/:id/draft', async (req, res) => {
  const chat = await chatOf(req);
  const rows = await WaMessage.find({chatId: String(chat._id)})
    .sort({createdAt: -1})
    .limit(12)
    .lean();
  const draft = await callService(
    config.aiUrl,
    '/internal/jobs/ticketReply',
    {
      input: {
        channel: 'WhatsApp (keep it short, plain text)',
        subject: chat.ticketNo ? `WhatsApp chat, ticket #${chat.ticketNo}` : 'WhatsApp chat',
        messages: rows.reverse().map((m) => ({from: m.from, text: m.text})),
      },
    },
    {timeoutMs: 90_000},
  ).catch((err) => {
    throw new ApiError(err.status === 503 ? 503 : 502, 'AI_UNAVAILABLE', 'Pirento AI could not draft a reply now');
  });
  res.json({data: draft});
});

whatsappStaff.get('/staff/whatsapp-settings', async (_req, res) => res.json({data: await waSettings()}));

whatsappStaff.put(
  '/staff/whatsapp-settings',
  validate(
    z.object({
      bot: z.boolean(),
      ai: z.boolean(),
      greeting: z.string().trim().max(500).default(''),
      dailyAi: z.number().int().min(0).max(500),
    }),
  ),
  async (req, res) => {
    const s = await WaSettings.findOneAndUpdate(
      {_id: 'main'},
      {$set: {...req.body, updatedBy: req.user.email}},
      {upsert: true, new: true},
    );
    audit(req, 'whatsapp.settings', 'main', `bot ${req.body.bot ? 'on' : 'off'}, AI ${req.body.ai ? 'on' : 'off'}`);
    res.json({data: s});
  },
);
