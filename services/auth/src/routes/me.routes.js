import {Router} from 'express';
import {z} from 'zod';
import {ApiError, conflict, notFound, requireAuth, validate} from '@pirento/shared/server';
import {isUsername, passwordProblem} from '@pirento/shared';
import {MIN_PASSWORD, hashPassword, verifyPassword} from '../lib/password.js';
import {DeletionRequest} from '../models/DeletionRequest.js';
import {User} from '../models/User.js';

// The signed-in person's own profile.
export const meRoutes = Router();
meRoutes.use('/me', requireAuth);

meRoutes.get('/me', async (req, res) => {
  const user = await User.findById(req.user.sub).select('+passwordHash');
  if (!user) throw notFound('Account not found');
  res.json({data: user});
});

meRoutes.patch(
  '/me',
  validate(z.object({name: z.string().trim().min(2, 'Enter your name').max(80)})),
  async (req, res) => {
    res.json({data: await User.findByIdAndUpdate(req.user.sub, {name: req.body.name}, {new: true})});
  },
);

/** Your latest deletion request, if any. */
meRoutes.get('/me/deletion', async (req, res) => {
  res.json({data: await DeletionRequest.findOne({userId: req.user.sub}).sort({createdAt: -1})});
});

meRoutes.post(
  '/me/deletion',
  validate(z.object({reason: z.string().trim().max(500).default('')})),
  async (req, res) => {
    if (await DeletionRequest.exists({userId: req.user.sub, status: 'requested'})) {
      throw conflict('OPEN_REQUEST', 'Your request is already with our team');
    }
    const doc = await DeletionRequest.create({userId: req.user.sub, email: req.user.email, reason: req.body.reason});
    res.status(201).json({data: doc});
  },
);

/** Changed your mind? Withdraw it before the team decides. */
meRoutes.delete('/me/deletion', async (req, res) => {
  await DeletionRequest.deleteOne({userId: req.user.sub, status: 'requested'});
  res.json({data: {withdrawn: true}});
});

/**
 * Set or change your password (used at the user ID sign-in, and at the staff door if you have a staff ID).
 * Changing one needs the current password; an account made by email code can set its first one.
 */
meRoutes.patch(
  '/me/password',
  validate(z.object({current: z.string().max(200).default(''), next: z.string().max(200)})),
  async (req, res) => {
    const user = await User.findById(req.user.sub).select('+passwordHash');
    if (!user) throw notFound('Account not found');
    const min = user.staffId ? MIN_PASSWORD : 0; // staff passwords keep their stricter length
    const problem =
      passwordProblem(req.body.next) || (req.body.next.length < min ? `Use at least ${min} characters` : '');
    if (problem) throw new ApiError(400, 'BAD_INPUT', problem);
    if (user.passwordHash && !(await verifyPassword(req.body.current, user.passwordHash))) {
      throw new ApiError(400, 'WRONG_PASSWORD', 'Your current password is not right');
    }
    user.passwordHash = await hashPassword(req.body.next);
    await user.save();
    res.json({data: {changed: true}});
  },
);

/** Pick a user ID once, if the account does not have one (accounts made by email code). */
meRoutes.patch(
  '/me/username',
  validate(z.object({username: z.string().trim().toLowerCase().max(40)})),
  async (req, res) => {
    const user = await User.findById(req.user.sub);
    if (!user) throw notFound('Account not found');
    if (user.username) throw new ApiError(409, 'HAS_USERNAME', 'Your user ID is already set');
    const wanted = req.body.username;
    if (wanted !== user.email && !isUsername(wanted)) {
      throw new ApiError(
        400,
        'BAD_INPUT',
        'A user ID is 3–30 letters, digits, dots, dashes or underscores, starting with a letter',
      );
    }
    if (await User.exists({username: wanted}))
      throw new ApiError(409, 'USERNAME_TAKEN', 'That user ID is taken. Try another.');
    user.username = wanted;
    await user.save();
    res.json({data: user});
  },
);
