// Called by other services only: they report staff actions, look up an account, and email a customer a notice.
import {Router} from 'express';
import {z} from 'zod';
import {isId, requireInternal, validate} from '@pirento/shared/server';
import {AuditLog} from '../models/AuditLog.js';
import {User} from '../models/User.js';
import {sendNoticeEmail} from '../lib/email.js';

export const internalRoutes = Router();
internalRoutes.use('/internal', requireInternal);

internalRoutes.post(
  '/internal/audit',
  validate(
    z.object({
      actorId: z.string().min(1).max(40),
      actorEmail: z.string().max(200),
      action: z.string().min(1).max(60),
      target: z.string().min(1).max(80),
      detail: z.string().max(300).default(''),
    }),
  ),
  async (req, res) => {
    await AuditLog.create(req.body);
    res.json({data: {ok: true}});
  },
);

/** One account's id, email, role and whether it is suspended; null when there is none. Staff book orders this way. */
internalRoutes.post('/internal/user', validate(z.object({id: z.string().max(40)})), async (req, res) => {
  const user = isId(req.body.id) && (await User.findById(req.body.id));
  res.json({data: user ? {id: String(user._id), email: user.email, role: user.role, suspended: user.suspended} : null});
});

/** A short email to one account: an order moved, the team replied. Suspended and deleted accounts get nothing. */
internalRoutes.post(
  '/internal/notify',
  validate(
    z.object({
      userId: z.string().max(40),
      brand: z.string().max(60),
      label: z.string().max(80),
      big: z.string().max(80),
      note: z.string().max(600),
    }),
  ),
  async (req, res) => {
    const {userId, ...notice} = req.body;
    const user = isId(userId) && (await User.findById(userId));
    const reachable = user && !user.suspended && !user.email.endsWith('.invalid');
    if (reachable) {
      // Answer now; the mail server's speed is not the caller's problem.
      sendNoticeEmail(user.email, notice).catch((err) => console.error('notice email failed', err.message));
    }
    res.json({data: {sent: Boolean(reachable)}});
  },
);
