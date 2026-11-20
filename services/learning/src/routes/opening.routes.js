import {Router} from 'express';
import {z} from 'zod';
import {ACCESS, audit, conflict, isId, notFound, requireAuth, requireRole, validate} from '@pirento/shared/server';
import {Application} from '../models/Application.js';
import {Opening} from '../models/Opening.js';

// Openings: anyone can read the open ones and signed-in people apply; staff post and review.
export const openingRoutes = Router();

openingRoutes.get('/openings', async (_req, res) => {
  res.json({data: await Opening.find({open: true}).sort({createdAt: -1}).limit(100)});
});

openingRoutes.get('/openings/mine', requireAuth, async (req, res) => {
  res.json({data: await Application.find({userId: req.user.sub}, {openingId: 1, status: 1})});
});

openingRoutes.post(
  '/openings/:id/apply',
  requireAuth,
  validate(z.object({note: z.string().trim().max(1000).default('')})),
  async (req, res) => {
    const opening = isId(req.params.id) && (await Opening.findOne({_id: req.params.id, open: true}));
    if (!opening) throw notFound('This opening is closed');
    try {
      const doc = await Application.create({
        openingId: String(opening._id),
        userId: req.user.sub,
        email: req.user.email,
        note: req.body.note,
      });
      res.status(201).json({data: doc});
    } catch (err) {
      if (err.code === 11000) throw conflict('APPLIED', 'You have already applied');
      throw err;
    }
  },
);

const staff = Router();
staff.use(requireAuth, requireRole(...ACCESS.openings));
openingRoutes.use('/staff/openings', staff);

const openingBody = z.object({
  title: z.string().trim().min(3).max(100),
  track: z.string().trim().max(40).default(''),
  kind: z.enum(['internship', 'job']),
  mode: z.enum(['remote', 'onsite', 'hybrid']),
  location: z.string().trim().max(80).default(''),
  description: z.string().trim().min(20, 'Describe the work in a few lines').max(2000),
  open: z.boolean().default(true),
});

staff.get('/', async (_req, res) => {
  const [openings, counts] = await Promise.all([
    Opening.find().sort({createdAt: -1}).limit(200),
    Application.aggregate([{$group: {_id: '$openingId', count: {$sum: 1}}}]),
  ]);
  const byId = Object.fromEntries(counts.map((c) => [c._id, c.count]));
  res.json({data: openings.map((o) => ({...o.toObject(), applications: byId[o._id] ?? 0}))});
});

staff.post('/', validate(openingBody), async (req, res) => {
  const doc = await Opening.create({...req.body, createdBy: req.user.email});
  audit(req, 'opening.create', doc.title);
  res.status(201).json({data: doc});
});

staff.patch('/:id', validate(openingBody.partial()), async (req, res) => {
  const doc = isId(req.params.id) && (await Opening.findByIdAndUpdate(req.params.id, req.body, {new: true}));
  if (!doc) throw notFound('Opening not found');
  audit(req, 'opening.update', doc.title, doc.open ? 'open' : 'closed');
  res.json({data: doc});
});

staff.get('/:id/applications', async (req, res) => {
  res.json({data: await Application.find({openingId: req.params.id}).sort({createdAt: 1}).limit(500)});
});

staff.patch(
  '/applications/:appId',
  validate(z.object({status: z.enum(['new', 'shortlisted', 'declined'])})),
  async (req, res) => {
    const doc =
      isId(req.params.appId) && (await Application.findByIdAndUpdate(req.params.appId, req.body, {new: true}));
    if (!doc) throw notFound('Application not found');
    audit(req, `application.${req.body.status}`, doc.email);
    res.json({data: doc});
  },
);
