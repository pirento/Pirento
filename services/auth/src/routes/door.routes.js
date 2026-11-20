// The other ways in: the staff door (staff ID + password), Google, and which methods this install offers.
import {Router} from 'express';
import {z} from 'zod';
import {ApiError, STAFF, validate} from '@pirento/shared/server';
import {config} from '../config.js';
import {AuditLog} from '../models/AuditLog.js';
import {User} from '../models/User.js';
import {clearFailures, recordFailure, waitFor} from '../lib/backoff.js';
import {verifyGoogleIdToken} from '../lib/google.js';
import {verifyPassword} from '../lib/password.js';
import {issueSession} from '../lib/session.js';

export const doorRoutes = Router();

export const STAFF_ID = /^[a-z0-9][a-z0-9._-]{2,39}$/;

/** What the sign-in page may offer. Mobile needs an SMS provider, which is not set up. */
doorRoutes.get('/providers', (_req, res) => {
  res.json({data: {email: true, bharatId: true, google: config.googleClientId || null, mobile: false}});
});

doorRoutes.post(
  '/staff/login',
  validate(z.object({staffId: z.string().trim().toLowerCase().max(40), password: z.string().max(200)})),
  async (req, res) => {
    const {staffId, password} = req.body;
    const key = `staff:${staffId}`;
    const wait = waitFor(key);
    if (wait) throw new ApiError(429, 'SLOW_DOWN', `Too many wrong tries. Wait ${Math.ceil(wait / 1000)} seconds.`);

    const user = STAFF_ID.test(staffId) ? await User.findOne({staffId}).select('+passwordHash') : null;
    // A right password on a non-staff account is still a refusal, worded exactly like a wrong one,
    // so this door never tells anyone which staff IDs exist or which are privileged.
    const ok = user && STAFF.includes(user.role) && (await verifyPassword(password, user.passwordHash));
    if (!ok) {
      recordFailure(key);
      await AuditLog.create({
        actorId: '-',
        actorEmail: '-',
        action: 'auth.staff_login_failed',
        target: staffId.slice(0, 40) || '-',
        detail: req.ip ?? '',
      });
      throw new ApiError(401, 'BAD_CREDENTIALS', 'Wrong staff ID or password');
    }
    clearFailures(key);
    await issueSession(res, user);
  },
);

doorRoutes.post('/google', validate(z.object({idToken: z.string().min(20).max(4000)})), async (req, res) => {
  if (!config.googleClientId) throw new ApiError(404, 'GOOGLE_OFF', 'Google sign-in is not set up');
  const profile = await verifyGoogleIdToken(req.body.idToken, config.googleClientId);
  // Same Google account → same Pirento account; otherwise the verified email links them.
  let user = (await User.findOne({googleId: profile.googleId})) ?? (await User.findOne({email: profile.email}));
  if (!user) user = new User({email: profile.email, name: profile.name.slice(0, 80), role: 'customer'});
  user.googleId = profile.googleId;
  if (config.superadminEmails().includes(user.email)) user.role = 'superadmin';
  await user.save();
  await issueSession(res, user);
});
