// Changing an issued Bharat ID: the holder asks for one step to change, the team approves or turns it down.
import {Router} from 'express';
import {z} from 'zod';
import {CHANGEABLE_SECTIONS, ID_SECTIONS, validateSection} from '@pirento/shared';
import {
  ACCESS,
  audit,
  badInput,
  conflict,
  isId,
  notFound,
  notify,
  requireAuth,
  requireRole,
  validate,
} from '@pirento/shared/server';
import {Identity} from '../models/Identity.js';
import {ChangeRequest} from '../models/ChangeRequest.js';

export const changeRoutes = Router();
changeRoutes.use('/changes', requireAuth);
changeRoutes.use('/staff/changes', requireAuth, requireRole(...ACCESS.identity));

const titleOf = (id) => ID_SECTIONS.find((s) => s.id === id)?.title ?? id;

changeRoutes.get('/changes', async (req, res) => {
  res.json({data: await ChangeRequest.find({userId: req.user.sub}).sort({createdAt: -1}).limit(20)});
});

changeRoutes.post(
  '/changes',
  validate(
    z.object({
      section: z.enum(CHANGEABLE_SECTIONS),
      values: z.record(z.string(), z.string().max(300)),
      note: z.string().trim().max(300).default(''),
    }),
  ),
  async (req, res) => {
    const {section, values, note} = req.body;
    const doc = await Identity.findOne({userId: req.user.sub, status: 'approved'});
    if (!doc) throw conflict('NOT_ISSUED', 'Only an issued Bharat ID can be changed');
    const checked = validateSection(section, values);
    if (checked.error) throw badInput(checked.error);
    try {
      const made = await ChangeRequest.create({
        userId: req.user.sub,
        identityId: String(doc._id),
        bharatId: doc.bharatId,
        section,
        data: checked.data,
        note,
      });
      res.status(201).json({data: made});
    } catch (err) {
      if (err.code === 11000) throw conflict('OPEN', 'You already have a change waiting for our team');
      throw err;
    }
  },
);

/** The holder takes back a request the team has not decided yet. */
changeRoutes.delete('/changes/:id', async (req, res) => {
  if (!isId(req.params.id)) throw notFound('Request not found');
  const gone = await ChangeRequest.findOneAndDelete({_id: req.params.id, userId: req.user.sub, status: 'pending'});
  if (!gone) throw notFound('No waiting request to take back');
  res.json({data: {ok: true}});
});

changeRoutes.get('/staff/changes', async (req, res) => {
  const status = ['pending', 'approved', 'rejected'].includes(req.query.status) ? req.query.status : 'pending';
  const list = await ChangeRequest.find({status})
    .sort({createdAt: status === 'pending' ? 1 : -1})
    .limit(200)
    .lean();
  // The current values sit beside the asked ones, so the reviewer sees what changes.
  const ids = list.map((c) => c.identityId);
  const docs = await Identity.find({_id: {$in: ids}}, {sections: 1, fullName: 1, email: 1}).lean();
  const byId = new Map(docs.map((d) => [String(d._id), d]));
  res.json({
    data: list.map((c) => {
      const d = byId.get(c.identityId);
      return {...c, fullName: d?.fullName, email: d?.email, current: d?.sections?.[c.section] ?? null};
    }),
  });
});

changeRoutes.patch(
  '/staff/changes/:id',
  validate(z.object({decision: z.enum(['approve', 'reject']), reason: z.string().trim().max(300).default('')})),
  async (req, res) => {
    if (!isId(req.params.id)) throw notFound('Request not found');
    const {decision, reason} = req.body;
    if (decision === 'reject' && !reason) throw badInput('Tell the holder why');
    const ask = await ChangeRequest.findById(req.params.id);
    if (!ask) throw notFound('Request not found');

    // Claimed first, in one conditional update, so two reviewers (or a reviewer and the holder taking it back)
    // cannot both act on it.
    const done = await ChangeRequest.findOneAndUpdate(
      {_id: ask._id, status: 'pending'},
      {
        $set: {
          status: decision === 'approve' ? 'approved' : 'rejected',
          reason,
          decidedBy: {id: req.user.sub, email: req.user.email},
          decidedAt: new Date(),
        },
      },
      {new: true},
    );
    if (!done) throw conflict('CHANGED', 'This request was already decided');
    if (decision === 'approve') {
      // The ID must still be issued: a suspended one is not changed. The address step also carries the state
      // shown on the public verify page.
      const set = {[`sections.${ask.section}`]: ask.data};
      if (ask.section === 'address') set.state = ask.data.state;
      const doc = await Identity.findOneAndUpdate({_id: ask.identityId, status: 'approved'}, {$set: set});
      if (!doc) {
        // Not put back to pending: the holder may already have a new request open. They can ask again.
        const why = 'The Bharat ID was not issued when this was reviewed';
        await ChangeRequest.updateOne({_id: ask._id}, {$set: {status: 'rejected', reason: why}});
        throw conflict('NOT_ISSUED', 'This Bharat ID is not issued right now');
      }
    }
    audit(req, `bharat-id.change.${decision}`, ask.bharatId, titleOf(ask.section));
    notify(ask.userId, {
      brand: 'Bharat ID',
      label: `Change to ${titleOf(ask.section).toLowerCase()}`,
      big: decision === 'approve' ? 'Updated' : 'Not changed',
      note:
        decision === 'approve'
          ? 'Our team approved your change. Your Bharat ID now shows the new details.'
          : `Our team could not make this change: ${reason}. You can ask again from your Bharat ID dashboard.`,
    });
    res.json({data: done});
  },
);
