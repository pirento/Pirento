import {Router} from 'express';
import {z} from 'zod';
import {ApiError, isId, notFound, requireAuth, requireRole, validate} from '@pirento/shared/server';
import {config} from '../config.js';
import {ROLES, User} from '../models/User.js';
import {endAllSessions} from '../lib/session.js';

// Superadmin only: find people and change their role.
export const adminRoutes = Router();
adminRoutes.use('/admin', requireAuth, requireRole('superadmin'));

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

adminRoutes.get('/admin/users', async (req, res) => {
  const q = String(req.query.q ?? '')
    .trim()
    .slice(0, 80);
  const filter = q ? {email: {$regex: escapeRegex(q), $options: 'i'}} : {};
  const [users, total, staff] = await Promise.all([
    User.find(filter).sort({createdAt: -1}).limit(100),
    User.estimatedDocumentCount(),
    User.countDocuments({role: {$ne: 'customer'}}),
  ]);
  res.json({data: {users, total, staff}});
});

adminRoutes.patch('/admin/users/:id/role', validate(z.object({role: z.enum(ROLES)})), async (req, res) => {
  if (req.params.id === req.user.sub) throw new ApiError(400, 'SELF', 'You cannot change your own role');
  const user = isId(req.params.id) && (await User.findById(req.params.id));
  if (!user) throw notFound('Account not found');
  if (config.superadminEmails().includes(user.email) && req.body.role !== 'superadmin') {
    throw new ApiError(400, 'BOOTSTRAP', 'This superadmin is set in SUPERADMIN_EMAILS; remove it there first');
  }
  user.role = req.body.role;
  await user.save();
  // Their current access token still says the old role; ending their sessions
  // means the new role applies within one token lifetime (15 minutes).
  await endAllSessions(user._id);
  res.json({data: user});
});
