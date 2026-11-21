// The contact form: anyone may send an enquiry; the team reads them in admin → Enquiries and marks them handled.
import {Router} from 'express';
import {z} from 'zod';
import {PRODUCTS, toPhone} from '@pirento/shared';
import {
  ACCESS,
  audit,
  badInput,
  isId,
  nextSeq,
  notFound,
  productScope,
  requireRole,
  searchFilter,
  validate,
} from '@pirento/shared/server';
import {ENQUIRY_STATUSES, Enquiry} from '../models/Enquiry.js';

/** Mounted before sign-in is required: a visitor without an account can write. The gateway rate-limits it. */
export const publicEnquiryRoutes = Router();

publicEnquiryRoutes.post(
  '/enquiries',
  validate(
    z.object({
      name: z.string().trim().min(2, 'Enter your name').max(100),
      email: z.email('Enter a valid email').max(200),
      phone: z.string().trim().max(20).default(''),
      product: z.enum(PRODUCTS.map((p) => p.slug)).optional(),
      service: z.string().trim().max(80).default(''),
      message: z.string().trim().min(10, 'Write a few words about what you need').max(3000),
      website: z.string().max(200).default(''), // a field people never see: only bots fill it in
    }),
  ),
  async (req, res) => {
    const {website, phone, ...body} = req.body;
    // A bot is told it worked and nothing is kept, so it learns nothing.
    if (website) return res.status(201).json({data: {received: true}});
    if (phone && !toPhone(phone)) throw badInput('Enter a 10-digit mobile number, or leave it empty');
    const enquiry = await Enquiry.create({
      ...body,
      enquiryNo: (await nextSeq('enquiry')) + 500_000,
      email: body.email.toLowerCase(),
      phone: phone ? toPhone(phone) : undefined,
      service: body.service || undefined,
    });
    res.status(201).json({data: {received: true, enquiryNo: enquiry.enquiryNo}});
  },
);

export const staffEnquiryRoutes = Router();
staffEnquiryRoutes.use('/staff/enquiries', requireRole(...ACCESS.support));

staffEnquiryRoutes.get('/staff/enquiries', async (req, res) => {
  const search = searchFilter(req.query.q, 'enquiryNo', ['email', 'name', 'message']);
  const asked = ENQUIRY_STATUSES.includes(req.query.status) ? req.query.status : null;
  const filter = asked ? {status: asked} : search ? {} : {status: 'new'};
  if (search) filter.$and = [search];
  const scope = productScope(req);
  if (scope) filter.product = {$in: scope};
  const product = req.query.product;
  if (PRODUCTS.some((p) => p.slug === product) && (!scope || scope.includes(product))) filter.product = product;
  res.json({data: await Enquiry.find(filter).sort({createdAt: -1}).limit(200)});
});

staffEnquiryRoutes.patch(
  '/staff/enquiries/:id',
  validate(z.object({status: z.enum(ENQUIRY_STATUSES), note: z.string().trim().max(1000).default('')})),
  async (req, res) => {
    const enquiry = isId(req.params.id) && (await Enquiry.findById(req.params.id));
    const scope = productScope(req);
    if (!enquiry || (scope && !scope.includes(enquiry.product))) throw notFound('Enquiry not found');
    const updated = await Enquiry.findByIdAndUpdate(
      enquiry._id,
      {$set: {status: req.body.status, note: req.body.note || undefined, handledBy: req.user.email}},
      {new: true},
    );
    audit(req, `enquiry.${req.body.status}`, `#${enquiry.enquiryNo}`);
    res.json({data: updated});
  },
);
