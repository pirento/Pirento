// Admin → Notifications (superadmins): every event with the channels it goes on, a preview of how it reads on each,
// which channels are set up on this server, the delivery log, and a test notice to yourself.
import {Router} from 'express';
import {z} from 'zod';
import {NOTICE_CHANNELS, NOTICE_EVENTS, renderNotice} from '@pirento/shared';
import {ACCESS, audit, notFound, requireAuth, requireRole, validate, whatsappNumber} from '@pirento/shared/server';
import {NoticeDelivery} from '../models/NoticeDelivery.js';
import {NoticeSetting} from '../models/NoticeSetting.js';
import {User} from '../models/User.js';
import {WA_TEMPLATE, channelReady, deliver, eventSettings, forgetSettings} from '../lib/notices.js';

export const noticeRoutes = Router();
noticeRoutes.use('/staff/notices', requireAuth, requireRole(...ACCESS.notices));

noticeRoutes.get('/staff/notices', async (_req, res) => {
  const events = await eventSettings();
  const site = (process.env.SITE_URL ?? 'https://pirento.com').replace(/\/$/, '');
  res.json({
    data: {
      ready: channelReady(),
      whatsapp: {number: whatsappNumber(), template: WA_TEMPLATE()},
      events: events.map((e) => ({...e, preview: renderNotice({...e.sample, link: '/dashboard'}, site)})),
    },
  });
});

noticeRoutes.put(
  '/staff/notices/:event',
  validate(z.object({channels: z.object(Object.fromEntries(NOTICE_CHANNELS.map((c) => [c, z.boolean()])))})),
  async (req, res) => {
    if (!NOTICE_EVENTS.some((e) => e.id === req.params.event)) throw notFound('No such notification');
    await NoticeSetting.findOneAndUpdate(
      {_id: req.params.event},
      {$set: {channels: req.body.channels, updatedBy: req.user.email}},
      {upsert: true},
    );
    await forgetSettings();
    const on = NOTICE_CHANNELS.filter((c) => req.body.channels[c]).join(', ') || 'none';
    audit(req, 'notice.channels', req.params.event, on);
    res.json({data: (await eventSettings()).find((e) => e.id === req.params.event)});
  },
);

/** The last deliveries, newest first, by channel, status or event. */
noticeRoutes.get('/staff/notices/log', async (req, res) => {
  const f = {};
  if (NOTICE_CHANNELS.includes(req.query.channel)) f.channel = req.query.channel;
  if (['sent', 'skipped', 'failed'].includes(req.query.status)) f.status = req.query.status;
  if (NOTICE_EVENTS.some((e) => e.id === req.query.event)) f.event = req.query.event;
  const [items, counts] = await Promise.all([
    NoticeDelivery.find(f).sort({createdAt: -1}).limit(200).lean(),
    NoticeDelivery.aggregate([
      {$match: {createdAt: {$gte: new Date(Date.now() - 7 * 86_400_000)}}},
      {$group: {_id: {channel: '$channel', status: '$status'}, n: {$sum: 1}}},
    ]),
  ]);
  res.json({data: {items, week: counts.map((c) => ({...c._id, n: c.n}))}});
});

/** Sends an event's sample to the signed-in staff member, on the channels it would use for them. */
noticeRoutes.post('/staff/notices/:event/test', async (req, res) => {
  const event = NOTICE_EVENTS.find((e) => e.id === req.params.event);
  if (!event) throw notFound('No such notification');
  const me = await User.findById(req.user.sub);
  const {route} = await deliver(me, {...event.sample, userId: String(me._id), event: event.id, link: '/dashboard'});
  res.json({data: {route}});
});
