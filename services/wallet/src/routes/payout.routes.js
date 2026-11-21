// RazorpayX tells us what happened to a payout. Signed over the raw body; needs no sign-in.
import {Router} from 'express';
import {ApiError} from '@pirento/shared/server';
import {Withdrawal} from '../models/Withdrawal.js';
import {payoutConfig, webhookSignatureOk} from '../lib/payouts.js';
import {settle} from '../lib/withdrawals.js';

export const payoutRoutes = Router();

payoutRoutes.post('/payouts/razorpayx/webhook', async (req, res) => {
  const cfg = payoutConfig();
  if (!cfg || !webhookSignatureOk(cfg.webhookSecret, req.rawBody, req.headers['x-razorpay-signature'])) {
    throw new ApiError(400, 'BAD_SIGNATURE', 'Invalid signature');
  }
  const payout = req.body.payload?.payout?.entity;
  if (payout?.id) {
    // Found by the payout id, or by our reference when the webhook beat our own save of that id.
    const w =
      (await Withdrawal.findOne({'payout.id': payout.id})) ??
      (/^[a-f0-9]{24}$/.test(payout.reference_id ?? '') ? await Withdrawal.findById(payout.reference_id) : null);
    // Only a payout for the same amount settles it; anything else is not ours to act on.
    if (w?.status === 'processing' && payout.amount === w.amount) await settle(w, payout);
  }
  // Always 200 for a signed call, so RazorpayX stops retrying what we have handled or cannot use.
  res.json({data: {ok: true}});
});
