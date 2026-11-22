// Open to anyone: the Intern tracks, and checking a certificate.
import {Router} from 'express';
import {notFound} from '@pirento/shared/server';
import {Certificate} from '../models/Certificate.js';
import {publicCertificate} from '../lib/certificate.js';
import {allTracks} from '../lib/bank.js';

export const publicRoutes = Router();

publicRoutes.get('/tracks', async (_req, res) => {
  res.json({data: (await allTracks()).filter((t) => t.active).map(({builtIn, active, ...t}) => t)});
});

publicRoutes.get('/verify/:code', async (req, res) => {
  const cert = await Certificate.findOne({code: req.params.code.toUpperCase()});
  if (!cert) throw notFound('No certificate has this code');
  res.json({data: publicCertificate(cert)});
});
