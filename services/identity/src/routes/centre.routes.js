// Enrolment centres: staff make one and print its QR; anyone scanning it sees the centre, signs in on their phone,
// and starts their Bharat ID application there (the application remembers the centre).
import crypto from 'node:crypto';
import {Router} from 'express';
import {z} from 'zod';
import {ACCESS, audit, isId, notFound, requireAuth, requireRole, validate} from '@pirento/shared/server';
import {Centre} from '../models/Centre.js';
import {Identity} from '../models/Identity.js';

export const centreRoutes = Router();

const CODE = /^[A-Z0-9]{6}$/;

/** What the QR page shows: the centre's name and city, if it is open. */
centreRoutes.get('/centres/:code', async (req, res) => {
  const code = String(req.params.code).toUpperCase();
  const centre = CODE.test(code) && (await Centre.findOne({code, active: true}, {code: 1, name: 1, city: 1}));
  if (!centre) throw notFound('This enrolment centre is not open');
  res.json({data: centre});
});

centreRoutes.use('/staff/centres', requireAuth, requireRole(...ACCESS.enrol));

/** Every centre, with how many applications its QR started, submitted and issued. */
centreRoutes.get('/staff/centres', async (_req, res) => {
  const [centres, counts] = await Promise.all([
    Centre.find().sort({active: -1, createdAt: -1}),
    Identity.aggregate([
      {$match: {'centre.code': {$exists: true}}},
      {$group: {_id: {code: '$centre.code', status: '$status'}, n: {$sum: 1}}},
    ]),
  ]);
  const tally = {};
  for (const {_id, n} of counts) (tally[_id.code] ??= {})[_id.status] = n;
  res.json({data: centres.map((c) => ({...c.toJSON(), counts: tally[c.code] ?? {}}))});
});

/** Reviewers make, rename and close centres; any staffer can see them and print a QR. */
centreRoutes.post(
  '/staff/centres',
  requireRole(...ACCESS.identity),
  validate(z.object({name: z.string().trim().min(2).max(80), city: z.string().trim().min(2).max(60)})),
  async (req, res) => {
    // Six letters and digits, made up: a QR cannot be guessed from a centre's name.
    let centre;
    for (let tries = 0; !centre; tries++) {
      try {
        centre = await Centre.create({
          ...req.body,
          code: crypto
            .randomBytes(6)
            .toString('base64url')
            .toUpperCase()
            .replace(/[^A-Z0-9]/g, 'X')
            .slice(0, 6),
          createdBy: {id: req.user.sub, email: req.user.email},
        });
      } catch (err) {
        if (err.code !== 11000 || tries > 5) throw err;
      }
    }
    audit(req, 'centre.create', `${centre.name} (${centre.code})`);
    res.status(201).json({data: centre});
  },
);

centreRoutes.patch(
  '/staff/centres/:id',
  requireRole(...ACCESS.identity),
  validate(
    z.object({name: z.string().trim().min(2).max(80), city: z.string().trim().min(2).max(60), active: z.boolean()}),
  ),
  async (req, res) => {
    const centre =
      isId(req.params.id) && (await Centre.findByIdAndUpdate(req.params.id, {$set: req.body}, {new: true}));
    if (!centre) throw notFound('No such centre');
    audit(req, 'centre.update', `${centre.name} (${centre.code})`, centre.active ? 'open' : 'closed');
    res.json({data: centre});
  },
);
