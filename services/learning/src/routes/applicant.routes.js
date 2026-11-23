// The applicant's side of Pirento Intern: open roles, a resume, applying, answering an offer and sending tasks.
import express, {Router} from 'express';
import {z} from 'zod';
import {httpUrl} from '../lib/urls.js';
import {badInput, cached, conflict, isId, notFound, requireAuth, sealFile, validate} from '@pirento/shared/server';
import {config} from '../config.js';
import {Application} from '../models/Application.js';
import {Opening} from '../models/Opening.js';
import {Resume} from '../models/Resume.js';
import {Employer} from '../models/Employer.js';
import {APPLICANT_MOVES, canMove} from '../lib/pipeline.js';
import {sendFile, uploadName} from '../lib/files.js';

export const applicantRoutes = Router();

// The company's id stays: it links to its public page (/companies/:id), which shows nothing private.
const PUBLIC_OPENING = {createdBy: 0, review: 0};

applicantRoutes.get('/openings', async (_req, res) => {
  // The public list is the same for everyone, so it is cached; any opening change forgets it.
  const list = () => Opening.find({open: true}, PUBLIC_OPENING).sort({createdAt: -1}).limit(100).lean();
  res.json({data: await cached('learning:openings', 60, list)});
});

applicantRoutes.get('/openings/mine', requireAuth, async (req, res) => {
  res.json({data: await Application.find({userId: req.user.sub}, {openingId: 1, status: 1})});
});

applicantRoutes.get('/resume', requireAuth, async (req, res) => {
  res.json({data: await Resume.findOne({userId: req.user.sub}, {name: 1, size: 1, type: 1, updatedAt: 1})});
});

applicantRoutes.get('/resume/file', requireAuth, async (req, res) => {
  const file = await Resume.findOne({userId: req.user.sub});
  if (!file) throw notFound('No resume yet');
  await sendFile(res, file);
});

// Like order documents: the body is the raw file, its name in x-file-name. A new upload replaces the old one.
applicantRoutes.post(
  '/resume',
  requireAuth,
  express.raw({type: 'application/octet-stream', limit: config.maxResumeBytes}),
  async (req, res) => {
    const name = uploadName(req);
    if (!name || !Buffer.isBuffer(req.body) || !req.body.length) throw badInput('Choose your resume file');
    if (!/\.(pdf|docx?)$/i.test(name)) throw badInput('Send your resume as a PDF or Word file');
    const doc = await Resume.findOneAndUpdate(
      {userId: req.user.sub},
      {
        $set: {
          name,
          type: String(req.headers['x-file-type'] ?? '').slice(0, 100) || undefined,
          size: req.body.length,
          ...(await sealFile(config.fileKey, req.body, `resumes/${req.user.sub}`)),
        },
      },
      {upsert: true, new: true, projection: {name: 1, size: 1, type: 1, updatedAt: 1}},
    );
    res.json({data: doc});
  },
);

applicantRoutes.post(
  '/openings/:id/apply',
  requireAuth,
  validate(
    z.object({
      fullName: z.string().trim().min(2, 'Enter your full name').max(80),
      note: z.string().trim().max(1000).default(''),
      links: z.string().trim().max(300).default(''),
    }),
  ),
  async (req, res) => {
    const opening = isId(req.params.id) && (await Opening.findOne({_id: req.params.id, open: true}));
    if (!opening) throw notFound('This opening is closed');
    if (!(await Resume.exists({userId: req.user.sub}))) throw badInput('Add your resume first');
    try {
      const doc = await Application.create({
        ...req.body,
        openingId: String(opening._id),
        employerId: opening.employerId,
        userId: req.user.sub,
        email: req.user.email,
        history: [{status: 'new', by: req.user.email}],
      });
      res.status(201).json({data: doc});
    } catch (err) {
      if (err.code === 11000) throw conflict('APPLIED', 'You have already applied');
      throw err;
    }
  },
);

/** Every application with its role, interview, offer and tasks: the dashboard's Internships page. */
applicantRoutes.get('/applications/mine', requireAuth, async (req, res) => {
  const apps = await Application.find({userId: req.user.sub}, {history: 0}).sort({updatedAt: -1}).lean();
  const openings = await Opening.find({_id: {$in: apps.map((a) => a.openingId)}}, PUBLIC_OPENING).lean();
  const byId = Object.fromEntries(openings.map((o) => [String(o._id), o]));
  res.json({data: apps.map((a) => ({...a, opening: byId[a.openingId] ?? null}))});
});

const mine = (req) => ({_id: req.params.id, userId: req.user.sub});

applicantRoutes.post(
  '/applications/:id/answer',
  requireAuth,
  validate(z.object({accept: z.boolean()})),
  async (req, res) => {
    const to = req.body.accept ? 'accepted' : 'turned_down';
    if (!isId(req.params.id) || !canMove(APPLICANT_MOVES, 'offered', to)) throw notFound('Application not found');
    const doc = await Application.findOneAndUpdate(
      {...mine(req), status: 'offered'},
      {$set: {status: to}, $push: {history: {status: to, by: req.user.email}}},
      {new: true},
    );
    if (!doc) throw conflict('NOT_OFFERED', 'There is no open offer on this application');
    res.json({data: doc});
  },
);

applicantRoutes.post(
  '/applications/:id/tasks/:taskId',
  requireAuth,
  validate(
    z
      .object({answer: z.string().trim().max(2000).default(''), link: httpUrl().or(z.literal('')).default('')})
      .refine((b) => b.answer || b.link, {message: 'Write your answer or add a link'}),
  ),
  async (req, res) => {
    if (!isId(req.params.id) || !isId(req.params.taskId)) throw notFound('Task not found');
    const doc = await Application.findOneAndUpdate(
      {
        ...mine(req),
        status: 'accepted',
        tasks: {$elemMatch: {_id: req.params.taskId, status: {$in: ['open', 'redo']}}},
      },
      {
        $set: {
          'tasks.$.status': 'submitted',
          'tasks.$.answer': req.body.answer,
          'tasks.$.link': req.body.link,
          'tasks.$.submittedAt': new Date(),
        },
      },
      {new: true},
    );
    if (!doc) throw conflict('NOT_OPEN', 'This task is not waiting on you');
    res.json({data: doc});
  },
);

/** A company's public page: name, website, what it does, and its open roles. Never its contact person or phone. */
applicantRoutes.get('/companies/:id', async (req, res) => {
  const company =
    isId(req.params.id) &&
    (await Employer.findOne({_id: req.params.id, status: 'approved'}, {company: 1, website: 1, about: 1}).lean());
  if (!company) throw notFound('No such company on Pirento Intern');
  const openings = await Opening.find({employerId: String(company._id), open: true}, PUBLIC_OPENING)
    .sort({createdAt: -1})
    .lean();
  res.json({data: {...company, openings}});
});
