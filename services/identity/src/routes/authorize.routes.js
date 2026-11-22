// Pirento's own check page, behind the link a business got from POST /v1/auth/sessions: the person proves they hold
// the Bharat ID here (PIN and date of birth, codes to their mobile and email, or Aadhaar OTP / face on Digio), so
// the business never sees what they type. The link's secret token opens the session; 5 tries, 10 minutes.
import crypto from 'node:crypto';
import {Router} from 'express';
import {z} from 'zod';
import {SANDBOX_AUTH, authMethod} from '@pirento/shared';
import {ApiError, callService, conflict, isId, notFound, safeEqual, validate} from '@pirento/shared/server';
import {config} from '../config.js';
import {AuthSession} from '../models/AuthSession.js';
import {Identity} from '../models/Identity.js';
import {sandboxStatus} from '../lib/business.js';
import {checkPin} from '../lib/pin.js';
import {providerFor, providerNamed} from '../lib/providers.js';

export const authorizeRoutes = Router();

const MAX_TRIES = 5;
const sha256 = (s) => crypto.createHash('sha256').update(String(s)).digest('hex');

/** The session the token opens. A wrong token reads as not found. */
async function open(id, token) {
  const s = isId(id) && (await AuthSession.findById(id));
  if (!s || !safeEqual(s.tokenHash, sha256(token ?? ''))) throw notFound('This link is not valid');
  if (s.status === 'pending' && s.expiresAt < new Date()) {
    await AuthSession.updateOne({_id: s._id, status: 'pending'}, {$set: {status: 'expired'}});
    s.status = 'expired';
  }
  return s;
}

const backTo = (s) => {
  const url = new URL(s.returnUrl);
  url.searchParams.set('session', String(s._id));
  url.searchParams.set('status', s.status);
  return url.toString();
};

const view = (s) => ({
  businessName: s.businessName,
  method: s.method,
  methodLabel: authMethod(s.method)?.label,
  bharatIdEnd: s.bharatId.slice(-4),
  status: s.status,
  expiresAt: s.expiresAt,
  mode: s.mode,
  triesLeft: Math.max(0, MAX_TRIES - s.attempts),
  ...(s.status !== 'pending' && {returnTo: backTo(s)}),
});

const live = (s) => s.status === 'pending';

/** Ends the session one way, once (conditional on it still being pending). */
const settle = (s, status) =>
  AuthSession.findOneAndUpdate(
    {_id: s._id, status: 'pending'},
    {$set: {status, ...(status === 'passed' && {passedAt: new Date()})}},
    {new: true},
  ).then((d) => d ?? AuthSession.findById(s._id));

authorizeRoutes.get('/authorize/:id', async (req, res) => {
  res.json({data: view(await open(req.params.id, req.query.t))});
});

/** Sends the codes (otp) or opens the provider check (Aadhaar OTP, face). Nothing to start for PIN and date of birth. */
authorizeRoutes.post('/authorize/:id/start', validate(z.object({t: z.string().max(100)})), async (req, res) => {
  const s = await open(req.params.id, req.body.t);
  if (!live(s)) throw conflict('DONE', 'This check is already finished');
  if (s.mode === 'test') return res.json({data: {sandbox: true}});
  if (s.method === 'otp') {
    const send = (channel) =>
      callService(config.authUrl, '/internal/codes/send', {
        userId: s.userId,
        purpose: String(s._id),
        channel,
        brand: 'Bharat ID',
      });
    const [email, mobile] = await Promise.all([send('email'), send('mobile')]);
    return res.json({
      data: {
        email: email.sentTo,
        mobile: mobile.sentTo,
        ...(email.devCode && {devCodes: {email: email.devCode, mobile: mobile.devCode}}),
      },
    });
  }
  if (authMethod(s.method)?.provider) {
    const provider = providerFor(s.method);
    if (!provider) throw new ApiError(503, 'METHOD_OFF', 'This check is not switched on yet');
    const identity = await Identity.findOne({bharatId: s.bharatId, status: 'approved'});
    const started = await provider.start(s.method, identity, s);
    await AuthSession.updateOne({_id: s._id}, {$set: {provider: {name: provider.name, requestId: started.requestId}}});
    return res.json({data: started});
  }
  res.json({data: {}});
});

/**
 * Checks what the person entered (or asks the provider how its check went). Each try is counted first, in one
 * conditional update, so parallel guesses cannot get past the limit.
 */
authorizeRoutes.post(
  '/authorize/:id/verify',
  validate(
    z.object({
      t: z.string().max(100),
      pin: z.string().max(6).optional(),
      dob: z.string().max(10).optional(),
      emailCode: z.string().max(6).optional(),
      mobileCode: z.string().max(6).optional(),
    }),
  ),
  async (req, res) => {
    let s = await open(req.params.id, req.body.t);
    if (!live(s)) return res.json({data: view(s)});
    const provider = authMethod(s.method)?.provider && s.mode === 'live';
    if (!provider) {
      s = await AuthSession.findOneAndUpdate(
        {_id: s._id, status: 'pending', attempts: {$lt: MAX_TRIES}},
        {$inc: {attempts: 1}},
        {new: true},
      );
      if (!s) {
        const ended = await settle(await AuthSession.findById(req.params.id), 'failed');
        return res.json({data: view(ended)});
      }
    }
    const {pin, dob, emailCode, mobileCode} = req.body;
    let outcome = 'pending';
    if (s.mode === 'test') {
      // Sandbox: the "declines" ID always fails, "pending" stays pending, "approves" passes with the sandbox values.
      const kind = sandboxStatus(s.bharatId);
      const right =
        s.method === 'pin_dob'
          ? pin === SANDBOX_AUTH.pin && dob === SANDBOX_AUTH.dob
          : s.method === 'otp'
            ? emailCode === SANDBOX_AUTH.code && mobileCode === SANDBOX_AUTH.code
            : true;
      outcome = kind === 'approved' ? (right ? 'passed' : 'pending') : kind === 'declined' ? 'failed' : 'pending';
    } else if (s.method === 'pin_dob') {
      outcome = await checkPin(s.bharatId, pin ?? '', dob ?? '').then(
        () => 'passed',
        (err) => {
          if (err.code === 'PIN_LOCKED') throw err;
          return 'pending';
        },
      );
    } else if (s.method === 'otp') {
      const check = (channel, code) =>
        callService(config.authUrl, '/internal/codes/check', {
          userId: s.userId,
          purpose: String(s._id),
          channel,
          code: code ?? '',
        }).then(
          () => true,
          () => false,
        );
      outcome = (await check('email', emailCode)) && (await check('mobile', mobileCode)) ? 'passed' : 'pending';
    } else if (provider && s.provider?.requestId) {
      outcome = await providerNamed(s.provider.name).outcome(s.provider.requestId);
    }
    if (outcome === 'pending' && !provider && s.attempts >= MAX_TRIES) outcome = 'failed';
    const done = outcome === 'pending' ? s : await settle(s, outcome);
    res.json({data: {...view(done), ...(outcome === 'pending' && !provider && {wrong: true})}});
  },
);
