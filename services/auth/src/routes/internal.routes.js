import {Router} from 'express';
import {z} from 'zod';
import {requireInternal, validate} from '@pirento/shared/server';
import {AuditLog} from '../models/AuditLog.js';

// Called by other services only: they report staff actions here.
export const internalRoutes = Router();
internalRoutes.use('/internal', requireInternal);

internalRoutes.post(
  '/internal/audit',
  validate(
    z.object({
      actorId: z.string().min(1).max(40),
      actorEmail: z.string().max(200),
      action: z.string().min(1).max(60),
      target: z.string().min(1).max(80),
      detail: z.string().max(300).default(''),
    }),
  ),
  async (req, res) => {
    await AuditLog.create(req.body);
    res.json({data: {ok: true}});
  },
);
