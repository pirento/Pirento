// The banner, paused checkouts and partner commission rate: read by everyone, changed by a superadmin.
import {Router} from 'express';
import {z} from 'zod';
import {PRODUCTS} from '@pirento/shared';
import {ACCESS, audit, requireAuth, requireInternal, requireRole, validate} from '@pirento/shared/server';
import {Settings, readSettings} from '../models/Settings.js';

export const settingsRoutes = Router();

const publicView = ({banner, paused, commissionPct}) => ({banner, paused, commissionPct: commissionPct ?? 0});

settingsRoutes.get('/settings', async (_req, res) => res.json({data: publicView(await readSettings())}));

/** For the orders service: it refuses checkout on a paused product and reads the commission rate. */
settingsRoutes.post('/internal/settings', requireInternal, async (_req, res) =>
  res.json({data: publicView(await readSettings())}),
);

settingsRoutes.patch(
  '/staff/settings',
  requireAuth,
  requireRole(...ACCESS.accounts),
  validate(
    z.object({
      banner: z.object({
        on: z.boolean(),
        text: z.string().trim().max(160),
        // Internal paths only, so the banner can never send people off-site.
        link: z.union([z.literal(''), z.string().regex(/^\/[a-z0-9/_-]*$/i, 'Use a path on this site, like /legal')]),
      }),
      paused: z.array(z.enum(PRODUCTS.map((p) => p.slug))).max(PRODUCTS.length),
      // Optional, so a form that leaves it out never resets the rate.
      commissionPct: z.number().min(0).max(50).optional(),
    }),
  ),
  async (req, res) => {
    if (req.body.banner.on && !req.body.banner.text) req.body.banner.on = false;
    const doc = await Settings.findByIdAndUpdate('site', req.body, {upsert: true, new: true}).lean();
    audit(
      req,
      'settings.update',
      'site',
      `banner ${doc.banner.on ? 'on' : 'off'} · paused: ${doc.paused.join(', ') || 'none'} · commission ${doc.commissionPct ?? 0}%`,
    );
    res.json({data: publicView(doc)});
  },
);
