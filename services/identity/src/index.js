import mongoose from 'mongoose';
import {z} from 'zod';
import {bharatIdFromSeq, isBharatId} from '@pirento/shared';
import {INDIAN_STATES} from '@pirento/shared/intake';
import {
  ApiError,
  asyncHandler,
  createApp,
  env,
  finish,
  nextSeq,
  requireAuth,
  requireRole,
  STAFF,
  start,
  validate,
} from '@pirento/shared/server';

const Identity = mongoose.model(
  'Identity',
  new mongoose.Schema(
    {
      userId: {type: String, required: true, unique: true},
      email: {type: String, required: true},
      fullName: {type: String, required: true, maxlength: 80},
      dob: {type: String, required: true}, // YYYY-MM-DD
      state: {type: String, required: true},
      pan: {type: String, required: true},
      status: {type: String, enum: ['submitted', 'approved', 'rejected'], default: 'submitted', index: true},
      reason: String,
      bharatId: {type: String, unique: true, sparse: true},
      issuedAt: Date,
    },
    {timestamps: true},
  ),
);

const app = createApp('identity');

// Public: confirms an ID exists and who holds it, with the surname shortened.
app.get(
  '/verify/:bid',
  asyncHandler(async (req, res) => {
    if (!isBharatId(req.params.bid)) throw new ApiError(400, 'INVALID_ID', 'That is not a valid Bharat ID');
    const doc = await Identity.findOne({bharatId: req.params.bid, status: 'approved'});
    if (!doc) throw new ApiError(404, 'NOT_FOUND', 'No Bharat ID with this number');
    const [first, ...rest] = doc.fullName.split(/\s+/);
    const name = rest.length ? `${first} ${rest.at(-1)[0]}.` : first;
    res.json({data: {bharatId: doc.bharatId, name, state: doc.state, issuedAt: doc.issuedAt}});
  }),
);

app.use(requireAuth);

app.get(
  '/me',
  asyncHandler(async (req, res) => res.json({data: await Identity.findOne({userId: req.user.sub})})),
);

const adult = (dob) => {
  const d = new Date(dob);
  const cutoff = new Date();
  cutoff.setFullYear(cutoff.getFullYear() - 18);
  return d > new Date('1900-01-01') && d <= cutoff;
};

app.post(
  '/apply',
  validate(
    z.object({
      fullName: z
        .string()
        .trim()
        .min(2, 'Enter your full name')
        .max(80)
        .regex(/^[\p{L} .'-]+$/u, 'Use letters only in your name'),
      dob: z
        .string()
        .regex(/^\d{4}-\d{2}-\d{2}$/, 'Enter your date of birth')
        .refine(adult, 'You must be 18 or older'),
      state: z.enum(INDIAN_STATES, {message: 'Choose your state'}),
      pan: z
        .string()
        .trim()
        .toUpperCase()
        .regex(/^[A-Z]{5}\d{4}[A-Z]$/, 'Enter a valid PAN, like ABCDE1234F'),
    }),
  ),
  asyncHandler(async (req, res) => {
    // A first application, or a fresh one after a rejection; never over an approved or pending one.
    const doc = await Identity.findOneAndUpdate(
      {userId: req.user.sub, status: 'rejected'},
      {$set: {...req.body, status: 'submitted'}, $unset: {reason: 1}},
      {new: true},
    )
      .then((d) => d ?? Identity.create({...req.body, userId: req.user.sub, email: req.user.email}))
      .catch((err) => {
        if (err.code === 11000) throw new ApiError(409, 'ALREADY_APPLIED', 'You have already applied');
        throw err;
      });
    res.status(201).json({data: doc});
  }),
);

app.get(
  '/staff/queue',
  requireRole(...STAFF),
  asyncHandler(async (req, res) => {
    const status = ['submitted', 'approved', 'rejected'].includes(req.query.status) ? req.query.status : 'submitted';
    res.json({data: await Identity.find({status}).sort({updatedAt: 1}).limit(200)});
  }),
);

app.patch(
  '/staff/:id',
  requireRole(...STAFF),
  validate(z.object({decision: z.enum(['approve', 'reject']), reason: z.string().trim().max(300).default('')})),
  asyncHandler(async (req, res) => {
    if (!mongoose.isValidObjectId(req.params.id)) throw new ApiError(404, 'NOT_FOUND', 'Application not found');
    const {decision, reason} = req.body;
    if (decision === 'reject' && !reason) throw new ApiError(400, 'INVALID_INPUT', 'Tell the applicant why');
    const set =
      decision === 'approve'
        ? {status: 'approved', bharatId: bharatIdFromSeq(await nextSeq('bharat')), issuedAt: new Date()}
        : {status: 'rejected', reason};
    // Conditional on 'submitted': a second click cannot issue a second ID.
    const doc = await Identity.findOneAndUpdate({_id: req.params.id, status: 'submitted'}, {$set: set}, {new: true});
    if (!doc) throw new ApiError(409, 'CHANGED', 'This application was already decided');
    res.json({data: doc});
  }),
);

start(finish(app), {
  name: 'identity',
  port: Number(env('PORT', 4005)),
  mongoUri: env('MONGO_URI', 'mongodb://127.0.0.1:27017/pirento_identity'),
});
