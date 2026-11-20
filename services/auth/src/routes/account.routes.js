// Creating an account (email + mobile codes, then a user ID and password, with the terms),
// signing in with user ID and password, and getting back in: forgot password, forgot user ID.
import {Router} from 'express';
import jwt from 'jsonwebtoken';
import {z} from 'zod';
import {TERMS_VERSION, getProduct, isUsername, maskPhone, passwordProblem, toPhone} from '@pirento/shared';
import {ApiError, jwtSecret, validate} from '@pirento/shared/server';
import {User} from '../models/User.js';
import {clearFailures, recordFailure, waitFor} from '../lib/backoff.js';
import {sendNoticeEmail} from '../lib/email.js';
import {checkCode, maskEmail, phoneKey, sendCode, sendPhoneCode} from '../lib/otp.js';
import {hashPassword, verifyPassword} from '../lib/password.js';
import {endAllSessions, issueSession} from '../lib/session.js';

export const accountRoutes = Router();

const brandOf = (product) => getProduct(product ?? '')?.name ?? 'Pirento Ecosystem';
const email = z.string().trim().toLowerCase().email('Enter a valid email');
const code = z.string().regex(/^\d{6}$/, 'Enter the 6-digit code');
const phone = z
  .string()
  .max(20)
  .transform(
    (v, ctx) =>
      toPhone(v) ?? (ctx.addIssue({code: 'custom', message: 'Enter a 10-digit Indian mobile number'}), z.NEVER),
  );
const password = z
  .string()
  .max(200)
  .superRefine((p, ctx) => {
    const problem = passwordProblem(p);
    if (problem) ctx.addIssue({code: 'custom', message: problem});
  });
const product = z.string().max(20).optional();

// ── Sign-up ─────────────────────────────────────────────────────────────

/** Step 1: name, email and mobile. Both get a code; neither may belong to an account already. */
accountRoutes.post(
  '/register/start',
  validate(z.object({name: z.string().trim().min(2, 'Enter your name').max(80), email, phone, product})),
  async (req, res) => {
    const {email: mail, phone: mobile} = req.body;
    if (await User.exists({email: mail}))
      throw new ApiError(409, 'EMAIL_TAKEN', 'This email already has an account. Sign in instead.');
    if (await User.exists({phone: mobile}))
      throw new ApiError(409, 'PHONE_TAKEN', 'This mobile already has an account. Sign in instead.');
    const brand = brandOf(req.body.product);
    const [byEmail, byPhone] = await Promise.all([sendCode(mail, brand), sendPhoneCode(mobile, brand)]);
    res.json({
      data: {
        sentTo: {email: maskEmail(mail), phone: maskPhone(mobile)},
        resendAfter: byEmail.resendAfter,
        ...(byEmail.devCode ? {devCodes: {email: byEmail.devCode, phone: byPhone.devCode}} : {}),
      },
    });
  },
);

/** Step 2: both codes right → a 20-minute ticket that carries the verified details to step 3. */
accountRoutes.post(
  '/register/verify',
  validate(z.object({name: z.string().trim().min(2).max(80), email, phone, emailCode: code, phoneCode: code})),
  async (req, res) => {
    const {name, email: mail, phone: mobile} = req.body;
    await checkCode(mail, req.body.emailCode);
    await checkCode(phoneKey(mobile), req.body.phoneCode);
    const ticket = jwt.sign({name, email: mail, phone: mobile}, jwtSecret(), {audience: 'register', expiresIn: '20m'});
    res.json({data: {ticket}});
  },
);

/** Step 3: choose a user ID (or use the email), set a password, accept the terms → the account exists. */
accountRoutes.post(
  '/register',
  validate(
    z.object({
      ticket: z.string().max(2000),
      username: z.string().trim().toLowerCase().max(40).optional(),
      useEmail: z.boolean().default(false),
      password,
      acceptTerms: z.literal(true, {error: 'Accept the terms to create your account'}),
    }),
  ),
  async (req, res) => {
    let who;
    try {
      who = jwt.verify(req.body.ticket, jwtSecret(), {audience: 'register'});
    } catch {
      throw new ApiError(400, 'TICKET_EXPIRED', 'This sign-up took too long. Start again.');
    }
    const username = req.body.useEmail ? who.email : req.body.username;
    if (!req.body.useEmail && !isUsername(username)) {
      throw new ApiError(
        400,
        'BAD_INPUT',
        'A user ID is 3–30 letters, digits, dots, dashes or underscores, starting with a letter',
      );
    }
    if (await User.exists({$or: [{email: who.email}, {phone: who.phone}]})) {
      throw new ApiError(409, 'TAKEN', 'This email or mobile already has an account. Sign in instead.');
    }
    if (await User.exists({username})) throw new ApiError(409, 'USERNAME_TAKEN', 'That user ID is taken. Try another.');
    const user = await User.create({
      email: who.email,
      phone: who.phone,
      name: who.name,
      username,
      role: 'customer',
      passwordHash: await hashPassword(req.body.password),
      termsAcceptedAt: new Date(),
      termsVersion: TERMS_VERSION,
    });
    await issueSession(res, user);
  },
);

/** Is a user ID free? For the sign-up form to say so as you type. */
accountRoutes.get('/register/username/:name', async (req, res) => {
  const name = req.params.name.toLowerCase();
  res.json({data: {valid: isUsername(name), free: isUsername(name) && !(await User.exists({username: name}))}});
});

// ── User ID + password ──────────────────────────────────────────────────

/** "login" is a user ID or an email; both find the same account. */
const findByLogin = (login) =>
  User.findOne(login.includes('@') ? {$or: [{email: login}, {username: login}]} : {username: login}).select(
    '+passwordHash',
  );

accountRoutes.post(
  '/password/login',
  validate(z.object({login: z.string().trim().toLowerCase().min(1).max(200), password: z.string().max(200)})),
  async (req, res) => {
    const key = `user:${req.body.login}`;
    const wait = waitFor(key);
    if (wait) throw new ApiError(429, 'SLOW_DOWN', `Too many wrong tries. Wait ${Math.ceil(wait / 1000)} seconds.`);
    const user = await findByLogin(req.body.login);
    // One answer for an unknown ID and a wrong password, so this form cannot be used to find accounts.
    if (!user?.passwordHash || !(await verifyPassword(req.body.password, user.passwordHash))) {
      recordFailure(key);
      throw new ApiError(401, 'BAD_CREDENTIALS', 'Wrong user ID or password');
    }
    clearFailures(key);
    await issueSession(res, user);
  },
);

// ── Forgot password: a code to the account's email, then a new password ──

accountRoutes.post(
  '/password/forgot',
  validate(z.object({login: z.string().trim().toLowerCase().min(1).max(200), product})),
  async (req, res) => {
    const user = await findByLogin(req.body.login);
    if (!user) throw new ApiError(404, 'NO_ACCOUNT', 'No account has that user ID or email');
    const sent = await sendCode(user.email, brandOf(req.body.product));
    res.json({data: {...sent, sentTo: maskEmail(user.email)}});
  },
);

accountRoutes.post(
  '/password/reset',
  validate(z.object({login: z.string().trim().toLowerCase().min(1).max(200), code, password})),
  async (req, res) => {
    const user = await findByLogin(req.body.login);
    if (!user) throw new ApiError(404, 'NO_ACCOUNT', 'No account has that user ID or email');
    await checkCode(user.email, req.body.code);
    user.passwordHash = await hashPassword(req.body.password);
    await user.save();
    await endAllSessions(user._id); // anyone signed in with the old password is signed out
    clearFailures(`user:${req.body.login}`);
    await issueSession(res, user);
  },
);

// ── Forgot user ID: emailed, never shown on screen ──────────────────────

accountRoutes.post(
  '/username/forgot',
  validate(z.object({contact: z.string().trim().toLowerCase().min(3).max(200), product})),
  async (req, res) => {
    const mobile = toPhone(req.body.contact);
    const user = await User.findOne(
      req.body.contact.includes('@') ? {email: req.body.contact} : mobile ? {phone: mobile} : {_id: null},
    );
    if (user) {
      await sendNoticeEmail(user.email, {
        brand: brandOf(req.body.product),
        label: 'Your user ID',
        big: user.username ?? user.email,
        note: user.username
          ? 'Sign in with this user ID and your password, or with a code. If you did not ask, ignore this email.'
          : 'You have not chosen a user ID yet, so sign in with this email. If you did not ask, ignore this email.',
      });
    }
    // The same answer either way, so this form cannot tell anyone whether an account exists.
    res.json({data: {sent: true}});
  },
);
