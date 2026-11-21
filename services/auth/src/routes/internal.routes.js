// Called by other services only: they report staff actions here, and look up an account by id.
import {Router} from 'express';
import {z} from 'zod';
import {isId, requireInternal, validate} from '@pirento/shared/server';
import {AuditLog} from '../models/AuditLog.js';
import {User} from '../models/User.js';

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
