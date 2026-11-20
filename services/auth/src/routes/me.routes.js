import {Router} from 'express';
import {z} from 'zod';
import {conflict, notFound, requireAuth, validate} from '@pirento/shared/server';
import {DeletionRequest} from '../models/DeletionRequest.js';
import {User} from '../models/User.js';

// The signed-in person's own profile.
export const meRoutes = Router();
meRoutes.use('/me', requireAuth);

meRoutes.get('/me', async (req, res) => {
  const user = await User.findById(req.user.sub);
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
