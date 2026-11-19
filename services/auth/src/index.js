import crypto from 'node:crypto';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import {z} from 'zod';
import {
  ApiError,
  asyncHandler,
  createApp,
  env,
  finish,
  jwtSecret,
  requireAuth,
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

const hash = (code) => crypto.createHash('sha256').update(code).digest('hex');
const email = z.string().trim().toLowerCase().email('Enter a valid email');

const app = createApp('auth');

app.post(
  '/otp/request',
  validate(z.object({email})),
  asyncHandler(async (req, res) => {
    const code = String(crypto.randomInt(0, 1_000_000)).padStart(6, '0');
    await Otp.deleteMany({email: req.body.email});
    await Otp.create({email: req.body.email, codeHash: hash(code), expiresAt: new Date(Date.now() + 10 * 60_000)});
    // shortcut: no mail provider wired yet; the code is only returned outside production.
    if (!isProd) console.log(`OTP for ${req.body.email}: ${code}`);
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

    const superadmins = env('SUPERADMIN_EMAILS', '')
      .split(',')
      .map((e) => e.trim().toLowerCase());
    const user = await User.findOneAndUpdate(
      {email: req.body.email},
      superadmins.includes(req.body.email) ? {$set: {role: 'superadmin'}} : {$setOnInsert: {role: 'customer'}},
      {upsert: true, new: true},
    );
    // shortcut: one 7-day access token, no refresh rotation; add refresh cookies with the admin panel phase.
    const token = jwt.sign({sub: String(user._id), email: user.email, role: user.role}, jwtSecret(), {
      expiresIn: '7d',
    });
    res.json({data: {token, user}});
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

start(finish(app), {
  name: 'auth',
  port: Number(env('PORT', 4001)),
  mongoUri: env('MONGO_URI', 'mongodb://127.0.0.1:27017/pirento_auth'),
});
