// Any staffer can start a Bharat ID for someone who is not signed in: their email and mobile make the account and
// the application, the staffer may fill the steps with them, and the person finishes the rest (video KYC, eSign,
// PIN: only they may do those) from a one-time link sent by email and SMS.
import {Router} from 'express';
import {z} from 'zod';
import {ID_SECTIONS, validateSection} from '@pirento/shared';
import {
  ACCESS,
  audit,
  badInput,
  callService,
  conflict,
  isId,
  notFound,
  requireAuth,
  requireRole,
  validate,
} from '@pirento/shared/server';
import {config} from '../config.js';
import {Identity} from '../models/Identity.js';
import {nextStep, remindFromNow, sendContinue} from '../lib/reminders.js';
import {UNSIGN} from '../lib/verification.js';

export const enrolRoutes = Router();
enrolRoutes.use('/staff/enrol', requireAuth, requireRole(...ACCESS.enrol));

const EDITABLE = {$in: ['draft', 'rejected']};
const row = (doc) => ({...doc.toJSON(), nextStep: nextStep(doc)});
// Bharat ID reviewers see every staff-started application; any other staffer only the ones they started.
const mineOnly = (req) => (ACCESS.identity.includes(req.user.role) ? {} : {'enrolledBy.id': req.user.sub});

/** Applications started by staff, newest first, with what is left to do. */
enrolRoutes.get('/staff/enrol', async (req, res) => {
  const docs = await Identity.find({'enrolledBy.id': {$exists: true}, ...mineOnly(req)})
    .sort({createdAt: -1})
    .limit(200);
  res.json({data: docs.map(row)});
});

/** Starts an application for someone: makes (or finds) their account, saves the mobile, sends the link. */
enrolRoutes.post(
  '/staff/enrol',
  validate(
    z.object({
      email: z.email().trim().toLowerCase(),
      name: z.string().trim().max(80).default(''),
      mobile: z.string().trim(),
      agreed: z.literal(true, {message: 'Confirm the person has read and accepted the terms'}),
    }),
  ),
  async (req, res) => {
    const contact = validateSection('contact', {mobile: req.body.mobile});
    if (contact.error) throw badInput(contact.error);
    const {userId} = await callService(config.authUrl, '/internal/account-for', {
      email: req.body.email,
      name: req.body.name,
    });
    const existing = await Identity.findOne({userId});
    if (existing && !['draft', 'rejected'].includes(existing.status)) {
      throw conflict('ALREADY_APPLIED', `This person's Bharat ID is already ${existing.status}`);
    }
    const doc = await Identity.findOneAndUpdate(
      {userId},
      {
        $set: {'sections.contact': contact.data, ...remindFromNow()},
        $setOnInsert: {userId, email: req.body.email, enrolledBy: {id: req.user.sub, email: req.user.email}},
      },
      {new: true, upsert: true},
    );
    const sent = await sendContinue(doc, 'Your Bharat ID application has been started for you.');
    audit(req, 'bharat-id.enrol', req.body.email);
    res.status(201).json({data: {...row(doc), sent}});
  },
);

const findOpen = async (req) => {
  const doc = isId(req.params.id) && (await Identity.findOne({_id: req.params.id, status: EDITABLE, ...mineOnly(req)}));
  if (!doc) throw notFound('No unfinished application with this id');
  return doc;
};

/** The staffer fills a step with the person (at a desk or on a call). Changing a step voids a signature. */
enrolRoutes.put('/staff/enrol/:id/draft/:section', async (req, res) => {
  if (!ID_SECTIONS.some((s) => s.id === req.params.section)) throw notFound('No such step');
  const {data, error} = validateSection(req.params.section, req.body);
  if (error) throw badInput(error);
  const doc = await findOpen(req);
  const saved = await Identity.findOneAndUpdate(
    {_id: doc._id, status: EDITABLE},
    {$set: {[`sections.${req.params.section}`]: data, ...remindFromNow()}, $unset: UNSIGN},
    {new: true},
  );
  if (!saved) throw conflict('LOCKED', 'This application was just submitted');
  audit(req, 'bharat-id.enrol_step', saved.email, req.params.section);
  res.json({data: row(saved)});
});

/** Sends the link again now, by email and SMS. */
enrolRoutes.post('/staff/enrol/:id/remind', async (req, res) => {
  const doc = await findOpen(req);
  const sent = await sendContinue(doc, 'A reminder: your Bharat ID application is waiting for you.');
  audit(req, 'bharat-id.enrol_remind', doc.email);
  res.json({data: sent});
});
