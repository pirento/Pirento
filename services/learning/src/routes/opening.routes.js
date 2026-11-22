// Openings and companies, team side: staff post openings, approve companies and review what companies post;
// an approved company posts its own openings and runs its applicants through the same pipeline.
import {Router} from 'express';
import {z} from 'zod';
import {
  ACCESS,
  ApiError,
  audit,
  conflict,
  isId,
  isStaff,
  notFound,
  notify,
  requireAuth,
  requireRole,
  validate,
} from '@pirento/shared/server';
import {Application} from '../models/Application.js';
import {Employer} from '../models/Employer.js';
import {Opening} from '../models/Opening.js';
import {teamRoutes} from './team.js';

export const openingRoutes = Router();

const shape = {
  title: z.string().trim().min(3).max(100),
  track: z.string().trim().max(40),
  kind: z.enum(['internship', 'job']),
  mode: z.enum(['remote', 'onsite', 'hybrid']),
  location: z.string().trim().max(80),
  weeks: z.number().int().min(1).max(52).optional(),
  stipend: z.string().trim().max(60),
  description: z.string().trim().min(20, 'Describe the work in a few lines').max(2000),
  open: z.boolean(),
};
const openingBody = z.object({
  ...shape,
  track: shape.track.default(''),
  location: shape.location.default(''),
  stipend: shape.stipend.default(''),
  open: shape.open.default(true),
});
// No defaults here: a partial edit must not blank the fields it leaves out.
const openingPatch = z.object(shape).partial();

/** Openings with how many applied to each. */
async function withCounts(filter) {
  const openings = await Opening.find(filter).sort({createdAt: -1}).limit(300).lean();
  const counts = await Application.aggregate([
    {$match: {openingId: {$in: openings.map((o) => String(o._id))}}},
    {$group: {_id: '$openingId', count: {$sum: 1}}},
  ]);
  const byId = Object.fromEntries(counts.map((c) => [c._id, c.count]));
  return openings.map((o) => ({...o, applications: byId[o._id] ?? 0}));
}

// ---- Staff --------------------------------------------------------------------------------------------------

const staff = Router();
staff.use(requireAuth, requireRole(...ACCESS.openings));
openingRoutes.use('/staff/openings', staff);

staff.get('/', async (_req, res) => res.json({data: await withCounts({})}));

staff.post('/', validate(openingBody), async (req, res) => {
  const doc = await Opening.create({...req.body, createdBy: req.user.email});
  audit(req, 'opening.create', doc.title);
  res.status(201).json({data: doc});
});

/** Edits, closes and reopens; `review` approves or rejects a company's opening (approving opens it). */
staff.patch(
  '/:id',
  validate(openingPatch.extend({review: z.enum(['approved', 'rejected']).optional()})),
  async (req, res) => {
    const before = isId(req.params.id) && (await Opening.findById(req.params.id));
    if (!before) throw notFound('Opening not found');
    const {review, ...set} = req.body;
    if (review) {
      if (!before.employerId) throw conflict('NOT_A_COMPANY', 'Only company openings are reviewed');
      Object.assign(set, {review, open: review === 'approved'});
    }
    const doc = await Opening.findByIdAndUpdate(before._id, {$set: set}, {new: true});
    audit(req, review ? `opening.${review}` : 'opening.update', doc.title, doc.open ? 'open' : 'closed');
    if (review) {
      const employer = await Employer.findById(doc.employerId);
      if (employer) {
        notify(employer.userId, {
          brand: 'Pirento Intern',
          label: doc.title,
          big: review === 'approved' ? 'Your opening is live' : 'Your opening was not approved',
          note: review === 'approved' ? 'People can apply now.' : 'Edit it from your company page and send it again.',
        });
      }
    }
    res.json({data: doc});
  },
);

openingRoutes.use(
  '/staff/applications',
  requireAuth,
  requireRole(...ACCESS.openings),
  teamRoutes(() => ({})),
);

const employerStaff = Router();
employerStaff.use(requireAuth, requireRole(...ACCESS.openings));
openingRoutes.use('/staff/employers', employerStaff);

employerStaff.get('/', async (req, res) => {
  const filter = typeof req.query.status === 'string' && req.query.status ? {status: req.query.status} : {};
  res.json({data: await Employer.find(filter).sort({status: 1, createdAt: -1}).limit(300)});
});

const DECISION = {
  approved: ['Your company is approved', 'Post your first internship from Pirento Intern → Company.'],
  rejected: ['Your company request was not approved', ''],
  suspended: ['Your company page is paused', 'Its openings are closed for now. Write to support to talk about it.'],
};

employerStaff.patch(
  '/:id',
  validate(
    z.object({status: z.enum(['approved', 'rejected', 'suspended']), note: z.string().trim().max(500).default('')}),
  ),
  async (req, res) => {
    const before = isId(req.params.id) && (await Employer.findById(req.params.id));
    if (!before) throw notFound('Company not found');
    const doc = await Employer.findOneAndUpdate(
      {_id: before._id, status: before.status},
      {$set: {...req.body, decidedBy: req.user.email}},
      {new: true},
    );
    if (!doc) throw conflict('CHANGED', 'Someone else changed this company. Reload and try again.');
    // A paused or refused company's openings close at once; approving again does not reopen them by itself.
    if (doc.status !== 'approved') await Opening.updateMany({employerId: String(doc._id)}, {$set: {open: false}});
    audit(req, `employer.${doc.status}`, doc.company, req.body.note);
    const [big, note] = DECISION[doc.status];
    notify(doc.userId, {brand: 'Pirento Intern', label: doc.company, big, note: req.body.note || note});
    res.json({data: doc});
  },
);

// ---- Companies ----------------------------------------------------------------------------------------------

const employerBody = z.object({
  company: z.string().trim().min(2).max(100),
  website: z.url('Enter the company website, starting with https://').max(200),
  about: z.string().trim().min(30, 'Say what the company does in a few lines').max(1500),
  contactName: z.string().trim().min(2).max(80),
  phone: z.string().regex(/^[6-9]\d{9}$/, 'Enter a 10-digit mobile number'),
});

openingRoutes.get('/employers/me', requireAuth, async (req, res) => {
  res.json({data: await Employer.findOne({userId: req.user.sub})});
});

/** A company asks to post internships. A refused request may be sent again; one in review or approved may not. */
openingRoutes.post('/employers', requireAuth, validate(employerBody), async (req, res) => {
  if (isStaff(req)) throw new ApiError(403, 'FORBIDDEN', 'Staff accounts cannot run a company page');
  const set = {...req.body, email: req.user.email, status: 'requested', note: ''};
  try {
    const doc = await Employer.findOneAndUpdate({userId: req.user.sub, status: 'rejected'}, {$set: set}, {new: true});
    res.status(201).json({data: doc ?? (await Employer.create({...set, userId: req.user.sub}))});
  } catch (err) {
    if (err.code === 11000) throw conflict('ALREADY_ASKED', 'Your company page already exists');
    throw err;
  }
});

/** Lets a request through only for an approved company's own account; puts it on req.employer. */
async function requireEmployer(req, _res, next) {
  req.employer = await Employer.findOne({userId: req.user.sub, status: 'approved'});
  next(req.employer ? undefined : new ApiError(403, 'FORBIDDEN', 'Your company is not approved yet'));
}

const company = Router();
company.use(requireAuth, requireEmployer);
openingRoutes.use('/employer/openings', company);
openingRoutes.use(
  '/employer/applications',
  requireAuth,
  requireEmployer,
  teamRoutes((req) => ({employerId: String(req.employer._id)})),
);

company.get('/', async (req, res) => res.json({data: await withCounts({employerId: String(req.employer._id)})}));

/** A company's opening waits closed for staff review. */
company.post('/', validate(openingBody), async (req, res) => {
  const doc = await Opening.create({
    ...req.body,
    open: false,
    review: 'pending',
    employerId: String(req.employer._id),
    company: req.employer.company,
    createdBy: req.user.email,
  });
  res.status(201).json({data: doc});
});

/** Changing the words sends it back to review (closed); only an approved opening may be opened or closed. */
company.patch('/:id', validate(openingPatch), async (req, res) => {
  const mine = isId(req.params.id) && {_id: req.params.id, employerId: String(req.employer._id)};
  const before = mine && (await Opening.findOne(mine));
  if (!before) throw notFound('Opening not found');
  const {open, ...words} = req.body;
  const set = {};
  if (Object.keys(words).length) Object.assign(set, words, {review: 'pending', open: false});
  else if (open !== undefined) {
    if (before.review !== 'approved') throw conflict('IN_REVIEW', 'This opening is waiting for Pirento to approve it');
    set.open = open;
  }
  res.json({data: await Opening.findOneAndUpdate(mine, {$set: set}, {new: true})});
});
