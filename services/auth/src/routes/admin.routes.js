import {Router} from 'express';
import {z} from 'zod';
import {ACCESS, ApiError, isId, notFound, requireAuth, requireRole, validate} from '@pirento/shared/server';
import {config} from '../config.js';
import {AuditLog} from '../models/AuditLog.js';
import {ROLES, User} from '../models/User.js';
import {endAllSessions} from '../lib/session.js';

// Staff: find people (support, finance, superadmin); change roles and suspend (superadmin only).
export const adminRoutes = Router();
adminRoutes.use('/admin', requireAuth);
const superOnly = requireRole('superadmin');

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const DAY = 86_400_000;

adminRoutes.get('/admin/users', requireRole(...ACCESS.users), async (req, res) => {
  const q = String(req.query.q ?? '')
    .trim()
    .slice(0, 80);
  const filter = q
    ? {$or: [{email: {$regex: escapeRegex(q), $options: 'i'}}, {name: {$regex: escapeRegex(q), $options: 'i'}}]}
    : {};
  if (ROLES.includes(req.query.role)) filter.role = req.query.role;
  const [users, total, staff] = await Promise.all([
    User.find(filter).sort({createdAt: -1}).limit(100),
    User.estimatedDocumentCount(),
    User.countDocuments({role: {$ne: 'customer'}}),
  ]);
  res.json({data: {users, total, staff}});
});

adminRoutes.get('/admin/users/:id', requireRole(...ACCESS.users), async (req, res) => {
  const user = isId(req.params.id) && (await User.findById(req.params.id));
  if (!user) throw notFound('Account not found');
  res.json({data: user});
});

/** Sign-ups per day for the last 30 days, for the overview chart. */
adminRoutes.get('/admin/stats', requireRole(...ACCESS.users, 'staff'), async (_req, res) => {
  const since = new Date(Date.now() - 30 * DAY);
  const [total, perDay] = await Promise.all([
    User.estimatedDocumentCount(),
    User.aggregate([
      {$match: {createdAt: {$gte: since}}},
      {$group: {_id: {$dateToString: {format: '%Y-%m-%d', date: '$createdAt'}}, count: {$sum: 1}}},
      {$sort: {_id: 1}},
    ]),
  ]);
  res.json({data: {total, signups: perDay.map((d) => ({day: d._id, count: d.count}))}});
});

/** Loads someone else's account for a superadmin change, with the guards every change shares. */
async function targetOf(req) {
  if (req.params.id === req.user.sub) throw new ApiError(400, 'SELF', 'You cannot change your own account here');
  const user = isId(req.params.id) && (await User.findById(req.params.id));
  if (!user) throw notFound('Account not found');
  if (config.superadminEmails().includes(user.email)) {
    throw new ApiError(400, 'BOOTSTRAP', 'This superadmin is set in SUPERADMIN_EMAILS; remove it there first');
  }
  return user;
}

const log = (req, action, user, detail) =>
  AuditLog.create({actorId: req.user.sub, actorEmail: req.user.email, action, target: user.email, detail});

adminRoutes.patch('/admin/users/:id/role', superOnly, validate(z.object({role: z.enum(ROLES)})), async (req, res) => {
  const user = await targetOf(req);
  const from = user.role;
  user.role = req.body.role;
  await user.save();
  // Their current access token still says the old role; ending their sessions
  // means the new role applies within one token lifetime (15 minutes).
  await endAllSessions(user._id);
  await log(req, 'role.change', user, `${from} → ${user.role}`);
  res.json({data: user});
});

adminRoutes.patch(
  '/admin/users/:id/suspend',
  superOnly,
  validate(z.object({suspended: z.boolean(), reason: z.string().trim().max(200).default('')})),
  async (req, res) => {
    const user = await targetOf(req);
    user.suspended = req.body.suspended;
    await user.save();
    if (user.suspended) await endAllSessions(user._id);
    await log(req, user.suspended ? 'account.suspend' : 'account.restore', user, req.body.reason);
    res.json({data: user});
  },
);

adminRoutes.get('/admin/audit', requireRole(...ACCESS.audit), async (req, res) => {
  const filter = typeof req.query.action === 'string' && req.query.action ? {action: req.query.action} : {};
  res.json({data: await AuditLog.find(filter).sort({createdAt: -1}).limit(300)});
});
