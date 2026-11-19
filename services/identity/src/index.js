import mongoose from 'mongoose';
import {z} from 'zod';
import {ID_SECTIONS, bharatIdFromSeq, isBharatId, validateSection} from '@pirento/shared';
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

// draft → submitted → approved | rejected. A rejected application is edited and submitted again.
const Identity = mongoose.model(
  'Identity',
  new mongoose.Schema(
    {
      userId: {type: String, required: true, unique: true},
      email: {type: String, required: true},
      status: {type: String, enum: ['draft', 'submitted', 'approved', 'rejected'], default: 'draft', index: true},
      sections: {type: Object, default: {}}, // one entry per ID_SECTIONS id, already validated and reduced
      fullName: String, // copied on submit for the public verify page
      state: String,
      consentAt: Date,
      submittedAt: Date,
      reason: String,
      bharatId: {type: String, unique: true, sparse: true},
      issuedAt: Date,
    },
    {timestamps: true, minimize: false},
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

// Save one step. Allowed while drafting or after a rejection, never once submitted.
app.put(
  '/draft/:section',
  asyncHandler(async (req, res) => {
    const {data, error} = validateSection(req.params.section, req.body);
    if (error) throw new ApiError(400, 'INVALID_INPUT', error);
    const doc = await Identity.findOneAndUpdate(
      {userId: req.user.sub, status: {$in: ['draft', 'rejected']}},
      {$set: {[`sections.${req.params.section}`]: data}, $setOnInsert: {email: req.user.email}},
      {new: true, upsert: true},
    ).catch((err) => {
      // The upsert collides with an existing submitted/approved application.
      if (err.code === 11000) throw new ApiError(409, 'LOCKED', 'Your application is already with our team');
      throw err;
    });
    res.json({data: doc});
  }),
);

app.post(
  '/submit',
  validate(z.object({consent: z.literal(true, {message: 'Tick the box to agree'})})),
  asyncHandler(async (req, res) => {
    const doc = await Identity.findOne({userId: req.user.sub, status: {$in: ['draft', 'rejected']}});
    if (!doc) throw new ApiError(409, 'LOCKED', 'There is nothing to submit');
    const missing = ID_SECTIONS.find((s) => !doc.sections?.[s.id]);
    if (missing) throw new ApiError(400, 'INCOMPLETE', `Finish the "${missing.title}" step first`);
    const updated = await Identity.findOneAndUpdate(
      {_id: doc._id, status: doc.status},
      {
        $set: {
          status: 'submitted',
          submittedAt: new Date(),
          consentAt: new Date(),
          fullName: doc.sections.personal.fullName,
          state: doc.sections.address.state,
        },
        $unset: {reason: 1},
      },
      {new: true},
    );
    if (!updated) throw new ApiError(409, 'CHANGED', 'Your application changed. Reload and try again.');
    res.json({data: updated});
  }),
);

app.get(
  '/staff/queue',
  requireRole(...STAFF),
  asyncHandler(async (req, res) => {
    const status = ['submitted', 'approved', 'rejected'].includes(req.query.status) ? req.query.status : 'submitted';
    res.json({data: await Identity.find({status}).sort({submittedAt: 1}).limit(200)});
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
