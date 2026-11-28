// Digio's Account Aggregator webhook: consent and data events. Signed with X-Digio-Checksum (HMAC-SHA256 of the body);
// always answered 200 once the signature holds, since Digio pauses webhooks that keep failing.
import {Router} from 'express';
import {ApiError, webhookSignatureOk} from '@pirento/shared/server';
import {config} from '../config.js';
import {Link} from '../models/Link.js';
import {advance} from '../lib/aa.js';

export const webhookRoutes = Router();

webhookRoutes.post('/digio/webhook', async (req, res) => {
  if (!webhookSignatureOk(config.digio.webhookSecret, req.rawBody, req.get('x-digio-checksum'))) {
    throw new ApiError(400, 'BAD_SIGNATURE', 'Signature does not match');
  }
  const {event = '', payload = {}} = req.body ?? {};
  try {
    const link = payload.consent_request_id && (await Link.findOne({consentRequestId: payload.consent_request_id}));
    if (link && (event.startsWith('CONSENT') || event.startsWith('FI_'))) await advance(link);
  } catch (err) {
    console.error('digio aa webhook', event, err.message);
  }
  res.json({data: {received: true}});
});
