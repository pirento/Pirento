import crypto from 'node:crypto';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import {z} from 'zod';
import {getProduct} from '@pirento/shared';
import {mailer, sendOtpEmail} from './email.js';
import {
  ApiError,
  asyncHandler,
  createApp,
  env,
  finish,
  jwtSecret,
  requireAuth,
  requireRole,
  start,
  validate,
} from '@pirento/shared/server';

const isProd = process.env.NODE_ENV === 'production';

const User = mongoose.model(
  'User',
  new mongoose.Schema(
    {
      email: {type: String, required: true, unique: true, lowercase: true, trim: true},
      name: {type: String, default: '', maxlength: 80},
      role: {type: String, enum: ['customer', 'staff', 'superadmin'], default: 'customer'},
    },
    {timestamps: true},
  ),
);

const Otp = mongoose.model(
  'Otp',
  new mongoose.Schema({
    email: {type: String, required: true, index: true},
    codeHash: {type: String, required: true},
    attempts: {type: Number, default: 0},
    expiresAt: {type: Date, required: true, index: {expires: 0}},
  }),
);

// Refresh tokens: random, stored only as a hash, rotated on every use, 30-day life.
const RefreshToken = mongoose.model(
  'RefreshToken',
  new mongoose.Schema({
    userId: {type: String, required: true, index: true},
    hash: {type: String, required: true, unique: true},
    expiresAt: {type: Date, required: true, index: {expires: 0}},
  }),
);

const COOKIE = 'pirento_rt';
const REFRESH_DAYS = 30;
const superadminEmails = () =>
  env('SUPERADMIN_EMAILS', '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);

const readCookie = (req) =>
  (req.headers.cookie ?? '')
    .split(';')
    .map((c) => c.trim().split('='))
    .find(([k]) => k === COOKIE)?.[1];

const setCookie = (res, value, maxAgeSec) =>
  res.setHeader(
    'set-cookie',
    `${COOKIE}=${value}; Path=/api/auth; HttpOnly; SameSite=Strict; Max-Age=${maxAgeSec}${isProd ? '; Secure' : ''}`,
  );

/** Short access token in the body, rotating refresh token in an httpOnly cookie. */
async function issueSession(res, user) {
  const refresh = crypto.randomBytes(32).toString('base64url');
  await RefreshToken.create({
    userId: String(user._id),
    hash: hash(refresh),
    expiresAt: new Date(Date.now() + REFRESH_DAYS * 86_400_000),
  });
  setCookie(res, refresh, REFRESH_DAYS * 86_400);
  const token = jwt.sign({sub: String(user._id), email: user.email, role: user.role}, jwtSecret(), {
    expiresIn: '15m',
  });
  res.json({data: {token, user}});
}

const hash = (code) => crypto.createHash('sha256').update(code).digest('hex');
const email = z.string().trim().toLowerCase().email('Enter a valid email');

const app = createApp('auth');

app.post(
  '/otp/request',
  validate(z.object({email, product: z.string().max(20).optional()})),
  asyncHandler(async (req, res) => {
    // Production without a mail server would accept emails and never deliver a code: refuse instead.
    if (isProd && !mailer()) throw new ApiError(503, 'EMAIL_UNAVAILABLE', 'Email sign-in is not set up yet');
    const brand = getProduct(req.body.product ?? '')?.name ?? 'Pirento Ecosystem';
    const code = String(crypto.randomInt(0, 1_000_000)).padStart(6, '0');
    await Otp.deleteMany({email: req.body.email});
    await Otp.create({email: req.body.email, codeHash: hash(code), expiresAt: new Date(Date.now() + 10 * 60_000)});
    if (mailer()) {
      try {
        await sendOtpEmail(req.body.email, code, brand);
      } catch (err) {
        console.error('OTP email failed', err.message);
        await Otp.deleteMany({email: req.body.email});
        throw new ApiError(502, 'EMAIL_FAILED', 'We could not send the code. Check the email and try again.');
      }
    } else {
      console.log(`OTP for ${req.body.email}: ${code} (no SMTP_URL, not emailed)`);
    }
    res.json({data: {sent: true, ...(isProd ? {} : {devCode: code})}});
  }),
);

app.post(
  '/otp/verify',
  validate(z.object({email, code: z.string().regex(/^\d{6}$/, 'Enter the 6-digit code')})),
  asyncHandler(async (req, res) => {
    const otp = await Otp.findOneAndUpdate({email: req.body.email}, {$inc: {attempts: 1}}, {new: true});
    if (!otp || otp.expiresAt < new Date() || otp.attempts > 5) {
      throw new ApiError(400, 'OTP_EXPIRED', 'This code has expired. Ask for a new one.');
    }
    const a = Buffer.from(otp.codeHash);
    const b = Buffer.from(hash(req.body.code));
    if (!crypto.timingSafeEqual(a, b)) throw new ApiError(400, 'OTP_WRONG', 'That code is not right');
    await Otp.deleteOne({_id: otp._id});

    const user = await User.findOneAndUpdate(
      {email: req.body.email},
      superadminEmails().includes(req.body.email) ? {$set: {role: 'superadmin'}} : {$setOnInsert: {role: 'customer'}},
      {upsert: true, new: true},
    );
    await issueSession(res, user);
  }),
);

app.post(
  '/refresh',
  asyncHandler(async (req, res) => {
    const raw = readCookie(req);
    // Delete-on-use: a stolen token works at most once, and only until its owner refreshes.
    const old = raw && (await RefreshToken.findOneAndDelete({hash: hash(raw), expiresAt: {$gt: new Date()}}));
    const user = old && (await User.findById(old.userId));
    if (!user) {
      setCookie(res, '', 0);
      throw new ApiError(401, 'UNAUTHORIZED', 'Sign in to continue');
    }
    await issueSession(res, user);
  }),
);

app.post(
  '/logout',
  asyncHandler(async (req, res) => {
    const raw = readCookie(req);
    if (raw) await RefreshToken.deleteOne({hash: hash(raw)});
    setCookie(res, '', 0);
    res.json({data: {signedOut: true}});
  }),
);

app.get(
  '/me',
  requireAuth,
  asyncHandler(async (req, res) => {
    const user = await User.findById(req.user.sub);
    if (!user) throw new ApiError(404, 'NOT_FOUND', 'Account not found');
    res.json({data: user});
  }),
);

app.patch(
  '/me',
  requireAuth,
  validate(z.object({name: z.string().trim().max(80)})),
  asyncHandler(async (req, res) => {
    res.json({data: await User.findByIdAndUpdate(req.user.sub, {name: req.body.name}, {new: true})});
  }),
);

// ── Superadmin: people and roles ────────────────────────────────────────

app.get(
  '/admin/users',
  requireAuth,
  requireRole('superadmin'),
  asyncHandler(async (req, res) => {
    const q = String(req.query.q ?? '')
      .trim()
      .slice(0, 80);
    const filter = q ? {email: {$regex: q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i'}} : {};
    const [users, total, staff] = await Promise.all([
      User.find(filter).sort({createdAt: -1}).limit(100),
      User.estimatedDocumentCount(),
      User.countDocuments({role: {$ne: 'customer'}}),
    ]);
    res.json({data: {users, total, staff}});
  }),
);

app.patch(
  '/admin/users/:id/role',
  requireAuth,
  requireRole('superadmin'),
  validate(z.object({role: z.enum(['customer', 'staff', 'superadmin'])})),
  asyncHandler(async (req, res) => {
    if (req.params.id === req.user.sub) throw new ApiError(400, 'SELF', 'You cannot change your own role');
    const user = mongoose.isValidObjectId(req.params.id) && (await User.findById(req.params.id));
    if (!user) throw new ApiError(404, 'NOT_FOUND', 'Account not found');
    if (superadminEmails().includes(user.email) && req.body.role !== 'superadmin') {
      throw new ApiError(400, 'BOOTSTRAP', 'This superadmin is set in SUPERADMIN_EMAILS; remove it there first');
    }
    user.role = req.body.role;
    await user.save();
    // End their sessions so the new role applies within one access-token lifetime (15 min).
    await RefreshToken.deleteMany({userId: String(user._id)});
    res.json({data: user});
  }),
);

start(finish(app), {
  name: 'auth',
  port: Number(env('PORT', 4001)),
  mongoUri: env('MONGO_URI', 'mongodb://127.0.0.1:27017/pirento_auth'),
});
