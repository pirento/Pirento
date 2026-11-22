// Open to anyone: the Intern tracks, and checking a certificate.
import {Router} from 'express';
import {badInput, notFound} from '@pirento/shared/server';
import {Certificate} from '../models/Certificate.js';
import {publicCertificate} from '../lib/certificate.js';
import {allTracks} from '../lib/bank.js';
import {Lesson} from '../models/Lesson.js';
import {Opening} from '../models/Opening.js';
import {lessonDoc, openingDoc, searchIndex, searchReady} from '../lib/search.js';

export const publicRoutes = Router();

publicRoutes.get('/tracks', async (_req, res) => {
  res.json({data: (await allTracks()).filter((t) => t.active).map(({builtIn, active, ...t}) => t)});
});

publicRoutes.get('/verify/:code', async (req, res) => {
  const cert = await Certificate.findOne({code: req.params.code.toUpperCase()});
  if (!cert) throw notFound('No certificate has this code');
  res.json({data: publicCertificate(cert)});
});

/** Open roles and published lessons matching ?q=, for the search box. */
publicRoutes.get('/search', async (req, res) => {
  const q = String(req.query.q ?? '').trim();
  if (q.length < 2 || q.length > 60) throw badInput('Search with 2 to 60 characters');
  let hits;
  if (searchReady()) {
    hits = await searchIndex(q).catch((err) => (console.error('search', err.message), null));
    if (hits) {
      // Bulk closes (a paused company) skip the index's save hooks, so each hit is checked against Mongo.
      const ids = hits.map((h) => h.id);
      const [open, live] = await Promise.all([
        Opening.find({_id: {$in: ids}, open: true}, {_id: 1}).lean(),
        Lesson.find({_id: {$in: ids}, published: true}, {_id: 1}).lean(),
      ]);
      const ok = new Set([...open, ...live].map((d) => String(d._id)));
      hits = hits.filter((h) => ok.has(h.id));
    }
  }
  if (!hits) {
    // shortcut: a regex scan, fine for thousands of rows; set OPENSEARCH_URL before the catalogue grows past that.
    const match = {$regex: q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i'};
    const [openings, lessons] = await Promise.all([
      Opening.find({open: true, title: match}).limit(5).lean(),
      Lesson.find({published: true, title: match}).limit(5).lean(),
    ]);
    hits = [...openings.map(openingDoc), ...lessons.map(lessonDoc)];
  }
  res.json({data: hits.slice(0, 8).map(({kind, title, to}) => ({kind, title, to}))});
});
