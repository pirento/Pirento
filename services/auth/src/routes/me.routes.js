import {Router} from 'express';
import {z} from 'zod';
import {notFound, requireAuth, validate} from '@pirento/shared/server';
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
