// Saved passwords. Listing never includes the secret; it is opened one at a time.
import {Router} from 'express';
import {z} from 'zod';
import {decrypt, encrypt, validate} from '@pirento/shared/server';
import {config} from '../config.js';
import {Credential} from '../models/Credential.js';
import {findOwned} from './owned.js';
import {healthOf} from '../lib/health.js';
import {logAction} from '../lib/log.js';
import {requireUnlock} from '../lib/unlock.js';

export const credentialRoutes = Router();

credentialRoutes.get('/credentials', async (req, res) => {
  res.json({data: await Credential.find({userId: req.user.sub}, {secret: 0}).sort({label: 1})});
});

credentialRoutes.post(
  '/credentials',
  requireUnlock,
  validate(
    z.object({
      label: z.string().trim().min(1, 'Name this entry').max(80),
      username: z.string().trim().max(200).default(''),
      password: z.string().min(1, 'Enter the password').max(500),
    }),
  ),
  async (req, res) => {
    const {label, username, password} = req.body;
    const saved = await Credential.create({
      userId: req.user.sub,
      label,
      username,
      secret: encrypt(config.key, Buffer.from(password)),
    });
    await logAction(req.user.sub, 'password.add', {target: label, pin: true});
    res.status(201).json({data: {_id: saved._id, label, username}});
  },
);

/** Which saved passwords are weak or reused. Decrypted here, judged here; only the verdicts leave. */
credentialRoutes.get('/credentials/health', async (req, res) => {
  const saved = await Credential.find({userId: req.user.sub});
  const items = healthOf(saved.map((c) => ({_id: c._id, password: decrypt(config.key, c.secret).toString()})));
  res.set('cache-control', 'no-store').json({
    data: {items, weak: items.filter((i) => i.weak).length, reused: items.filter((i) => i.reused).length},
  });
});

credentialRoutes.get('/credentials/:id/secret', requireUnlock, async (req, res) => {
  const credential = await findOwned(Credential, req);
  await logAction(req.user.sub, 'password.open', {target: credential.label, pin: true});
  res.set('cache-control', 'no-store').json({data: {password: decrypt(config.key, credential.secret).toString()}});
});

credentialRoutes.delete('/credentials/:id', requireUnlock, async (req, res) => {
  const credential = await findOwned(Credential, req);
  await credential.deleteOne();
  await logAction(req.user.sub, 'password.delete', {target: credential.label, pin: true});
  res.json({data: {deleted: true}});
});
