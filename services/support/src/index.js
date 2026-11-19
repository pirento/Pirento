import mongoose from 'mongoose';
import {z} from 'zod';
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

// open: waiting on staff · answered: waiting on the customer · closed
const Ticket = mongoose.model(
  'Ticket',
  new mongoose.Schema(
    {
      ticketNo: {type: Number, required: true, unique: true},
      userId: {type: String, required: true, index: true},
      email: {type: String, required: true},
      subject: {type: String, required: true, maxlength: 120},
      orderNo: Number,
      status: {type: String, enum: ['open', 'answered', 'closed'], default: 'open', index: true},
      messages: [
        {
          _id: false,
          from: {type: String, enum: ['customer', 'staff']},
          body: String,
          at: {type: Date, default: Date.now},
        },
      ],
    },
    {timestamps: true},
  ),
);

const app = createApp('support');
app.use(requireAuth);

const isStaff = (req) => STAFF.includes(req.user.role);
async function findTicket(req) {
  const t = mongoose.isValidObjectId(req.params.id) && (await Ticket.findById(req.params.id));
  if (!t || (t.userId !== req.user.sub && !isStaff(req))) throw new ApiError(404, 'NOT_FOUND', 'Ticket not found');
  return t;
}
const body = z.string().trim().min(2, 'Write a message').max(4000);

app.post(
  '/',
  validate(
    z.object({
      subject: z.string().trim().min(3, 'Add a short subject').max(120),
      message: body,
      orderNo: z.number().int().positive().optional(),
    }),
  ),
  asyncHandler(async (req, res) => {
    const t = await Ticket.create({
      ticketNo: (await nextSeq('ticket')) + 10_000_000,
      userId: req.user.sub,
      email: req.user.email,
      subject: req.body.subject,
      orderNo: req.body.orderNo,
      messages: [{from: 'customer', body: req.body.message}],
    });
    res.status(201).json({data: t});
  }),
);

app.get(
  '/',
  asyncHandler(async (req, res) => {
    res.json({data: await Ticket.find({userId: req.user.sub}, {messages: 0}).sort({updatedAt: -1}).limit(100)});
  }),
);

app.get(
  '/staff/queue',
  requireRole(...STAFF),
  asyncHandler(async (req, res) => {
    const status = ['open', 'answered', 'closed'].includes(req.query.status) ? req.query.status : 'open';
    res.json({data: await Ticket.find({status}, {messages: 0}).sort({updatedAt: 1}).limit(200)});
  }),
);

app.get(
  '/:id',
  asyncHandler(async (req, res) => res.json({data: await findTicket(req)})),
);

app.post(
  '/:id/messages',
  validate(z.object({body})),
  asyncHandler(async (req, res) => {
    const t = await findTicket(req);
    // Staff can answer any ticket; a customer only their own (findTicket checked it).
    const from = isStaff(req) && t.userId !== req.user.sub ? 'staff' : 'customer';
    const updated = await Ticket.findByIdAndUpdate(
      t._id,
      {$push: {messages: {from, body: req.body.body}}, $set: {status: from === 'staff' ? 'answered' : 'open'}},
      {new: true},
    );
    res.json({data: updated});
  }),
);

app.post(
  '/:id/close',
  asyncHandler(async (req, res) => {
    const t = await findTicket(req);
    res.json({data: await Ticket.findByIdAndUpdate(t._id, {status: 'closed'}, {new: true})});
  }),
);

start(finish(app), {
  name: 'support',
  port: Number(env('PORT', 4008)),
  mongoUri: env('MONGO_URI', 'mongodb://127.0.0.1:27017/pirento_support'),
});
