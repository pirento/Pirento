// Digio's webhook: KYC request and document signing events. Signed with X-Digio-Checksum (HMAC-SHA256 of the body).
import {Router} from 'express';
import {ApiError, webhookSignatureOk} from '@pirento/shared/server';
import {config} from '../config.js';
import {Identity} from '../models/Identity.js';
import {markSigned, refreshKyc} from '../lib/verification.js';

export const webhookRoutes = Router();

webhookRoutes.post('/digio/webhook', async (req, res) => {
  if (!webhookSignatureOk(config.digio.webhookSecret, req.rawBody, req.get('x-digio-checksum'))) {
    throw new ApiError(400, 'BAD_SIGNATURE', 'Signature does not match');
  }
  const {event = '', payload = {}} = req.body ?? {};
  // Digio retries anything but a 200 and pauses the account's webhooks after a day of failures,
  // so an event we cannot use is logged and still answered 200.
  try {
    if (event.startsWith('KYC_REQUEST') || event.startsWith('KYC_ACTION')) {
      const kyc = payload.KYC_REQUEST;
      const doc = kyc?.id && (await Identity.findOne({'digio.kycId': kyc.id}));
      if (doc && kyc.status) {
        await Identity.updateOne(
          {_id: doc._id, 'digio.kycId': kyc.id},
          {$set: {'digio.kycStatus': String(kyc.status).toLowerCase()}},
        );
        refreshKyc(doc, {stepsOnly: true}).catch((err) => console.error('digio kyc refresh', kyc.id, err.message)); // the step list, for staff
      }
    } else if (event === 'DOC.SIGNED') {
      const d = payload.document;
      if (d?.id && d.agreement_status === 'completed') await markSigned(d.id);
    } else if (event === 'DOC.SIGN.FAILED' || event === 'DOC.SIGN.REJECTED') {
      const id = payload.document?.id;
      if (id)
        await Identity.updateOne(
          {'digio.docId': id, 'digio.docStatus': 'requested'},
          {$set: {'digio.docStatus': 'failed'}},
        );
    }
  } catch (err) {
    console.error('digio webhook', event, err.message);
  }
  res.json({data: {received: true}});
});
