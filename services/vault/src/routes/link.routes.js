// Linked accounts through Digio's Account Aggregator: the owner starts a consent (after the Bharat ID unlock), Digio's
// SDK takes them to their AA to approve, and the holdings land in the vault as sealed records.
import {Router} from 'express';
import {callService, isId, notFound} from '@pirento/shared/server';
import {aaOn, config} from '../config.js';
import {Link} from '../models/Link.js';
import {Record} from '../models/Record.js';
import {advance, requestConsent} from '../lib/aa.js';
import {logAction} from '../lib/log.js';
import {requireUnlock} from '../lib/unlock.js';

export const linkRoutes = Router();

const shown = ({_id, status, accounts, fiStatus, fetchedAt, error, createdAt}) => ({
  _id,
  status,
  accounts,
  fiStatus,
  fetchedAt,
  error,
  createdAt,
});

linkRoutes.get('/links', async (req, res) => {
  const items = await Link.find({userId: req.user.sub}).sort({createdAt: -1}).limit(20);
  res.json({data: {on: aaOn(), items: items.map(shown)}});
});

/** A new consent request; the browser opens Digio's SDK with what comes back. */
linkRoutes.post('/links', requireUnlock, async (req, res) => {
  const profile = await callService(config.identityUrl, '/internal/aa-profile', {userId: req.user.sub});
  const {link, gatewayToken} = await requestConsent({userId: req.user.sub, ...profile});
  await logAction(req.user.sub, 'linked.consent', {target: link.consentRequestId, pin: true});
  res.status(201).json({
    data: {
      _id: link._id,
      consentRequestId: link.consentRequestId,
      customerId: link.customerId,
      gatewayToken,
      environment: config.digio.environment,
      sdk: config.digio.sdk,
    },
  });
});

async function ownLink(req) {
  const link = isId(req.params.id) && (await Link.findOne({_id: req.params.id, userId: req.user.sub}));
  if (!link) throw notFound('No such linked account');
  return link;
}

/** "Check now": asks Digio where the consent and data stand, and stores anything ready. */
linkRoutes.post('/links/:id/refresh', async (req, res) => {
  const link = await ownLink(req);
  res.json({data: await advance(link)});
});

/** Removes the link and what it fetched. The consent itself is revoked in the owner's AA app. */
linkRoutes.delete('/links/:id', requireUnlock, async (req, res) => {
  const link = await ownLink(req);
  const {deletedCount} = await Record.deleteMany({userId: req.user.sub, linkId: String(link._id)});
  await link.deleteOne();
  await logAction(req.user.sub, 'linked.remove', {target: `${deletedCount} records`, pin: true});
  res.json({data: {deleted: true, records: deletedCount}});
});
