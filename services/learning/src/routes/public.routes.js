import {Router} from 'express';
import {TRACKS} from '@pirento/shared/exam';
import {notFound} from '@pirento/shared/server';
import {Certificate} from '../models/Certificate.js';
import {publicCertificate} from '../lib/certificate.js';

export const publicRoutes = Router();

publicRoutes.get('/tracks', (_req, res) => res.json({data: TRACKS}));

publicRoutes.get('/verify/:code', async (req, res) => {
  const cert = await Certificate.findOne({code: req.params.code.toUpperCase()});
  if (!cert) throw notFound('No certificate has this code');
  res.json({data: publicCertificate(cert)});
});
