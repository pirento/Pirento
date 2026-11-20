import {Router} from 'express';
import {z} from 'zod';
import {ACCESS, ApiError, STAFF, isId, notFound, requireAuth, requireRole, validate} from '@pirento/shared/server';
import {PRODUCTS} from '@pirento/shared';
import {config} from '../config.js';
import {AuditLog} from '../models/AuditLog.js';
import {ROLES, User} from '../models/User.js';
import {endAllSessions} from '../lib/session.js';
import {MIN_PASSWORD, hashPassword} from '../lib/password.js';
import {STAFF_ID} from './door.routes.js';
import {forgetUser} from '../lib/forget.js';
import {DeletionRequest} from '../models/DeletionRequest.js';

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
adminRoutes.get('/admin/stats', requireRole(...ACCESS.users), async (_req, res) => {
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

/** Everyone on the team, for assigning work. Any staff role may read it. */
adminRoutes.get('/admin/team', requireRole(...STAFF), async (_req, res) => {
  const team = await User.find(
    {role: {$in: STAFF}},
    {email: 1, name: 1, role: 1, products: 1, suspended: 1, staffId: 1},
  ).sort({
    email: 1,
  });
  res.json({data: team});
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
  '/admin/users/:id/products',
  superOnly,
  validate(z.object({products: z.array(z.enum(PRODUCTS.map((p) => p.slug))).max(10)})),
  async (req, res) => {
    const user = await targetOf(req);
    user.products = req.body.products;
    await user.save();
    await endAllSessions(user._id); // the scope is in their token
    await log(req, 'role.products', user, req.body.products.join(', ') || 'all products');
    res.json({data: user});
  },
);

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

adminRoutes.get('/admin/deletions', requireRole(...ACCESS.accounts), async (req, res) => {
  const status = ['requested', 'approved', 'rejected'].includes(req.query.status) ? req.query.status : 'requested';
  res.json({data: await DeletionRequest.find({status}).sort({createdAt: 1}).limit(200)});
});

adminRoutes.patch(
  '/admin/deletions/:id',
  requireRole(...ACCESS.accounts),
  validate(z.object({decision: z.enum(['approve', 'reject']), answer: z.string().trim().max(300).default('')})),
  async (req, res) => {
    const doc = isId(req.params.id) && (await DeletionRequest.findById(req.params.id));
    if (!doc || doc.status !== 'requested') throw notFound('No open request with that id');
    if (req.body.decision === 'reject' && !req.body.answer) throw new ApiError(400, 'BAD_INPUT', 'Tell them why');
    if (req.body.decision === 'approve') {
      req.params.id = doc.userId; // targetOf reads the account id from the URL
      await forgetUser(await targetOf(req));
    }
    // Conditional on 'requested', so a second click does not decide twice.
    const done = await DeletionRequest.findOneAndUpdate(
      {_id: doc._id, status: 'requested'},
      {
        $set: {
          status: req.body.decision === 'approve' ? 'approved' : 'rejected',
          answer: req.body.answer || undefined,
          decidedBy: req.user.email,
          decidedAt: new Date(),
        },
      },
      {new: true},
    );
    await AuditLog.create({
      actorId: req.user.sub,
      actorEmail: req.user.email,
      action: `account.delete.${req.body.decision}`,
      target: doc.email,
      detail: req.body.answer,
    });
    res.json({data: done});
  },
);

const password = z.string().min(MIN_PASSWORD, `Use at least ${MIN_PASSWORD} characters`).max(200);

/**
 * A superadmin issues a staff sign-in: a staff ID and a first password, on a new
 * account or on an existing one with that email. The person can change the password later.
 */
adminRoutes.post(
  '/admin/staff',
  superOnly,
  validate(
    z.object({
      staffId: z.string().trim().toLowerCase().regex(STAFF_ID, '3 to 40 letters, digits, dots, dashes or underscores'),
      email: z.email().trim().toLowerCase(),
      name: z.string().trim().max(80).default(''),
      role: z.enum(STAFF),
      password,
    }),
  ),
  async (req, res) => {
    const {staffId, email, name, role} = req.body;
    if (await User.exists({staffId})) throw new ApiError(409, 'TAKEN', 'That staff ID is already in use');
    const user = (await User.findOne({email})) ?? new User({email, name});
    if (user.staffId) throw new ApiError(409, 'HAS_STAFF_ID', `This account already signs in as ${user.staffId}`);
    Object.assign(user, {staffId, role, passwordHash: await hashPassword(req.body.password)});
    if (name && !user.name) user.name = name;
    await user.save();
    await endAllSessions(user._id); // a changed role must not ride on an old token
    await log(req, 'staff.create', user, `${staffId} · ${role}`);
    res.status(201).json({data: user});
  },
);

/** A superadmin sets a new password for someone who forgot theirs. */
adminRoutes.patch('/admin/users/:id/password', superOnly, validate(z.object({password})), async (req, res) => {
  const user = await targetOf(req);
  if (!user.staffId) throw new ApiError(400, 'NO_STAFF_ID', 'This account has no staff ID');
  user.passwordHash = await hashPassword(req.body.password);
  await user.save();
  await endAllSessions(user._id);
  await log(req, 'staff.password_reset', user, user.staffId);
  res.json({data: {reset: true}});
});
