// Bharat ID for Business is prepaid: each live call is paid from the owner's Pirento wallet, at the admin's price.
import {ApiError, callService} from '@pirento/shared/server';
import {config} from '../config.js';
import {readPrices} from '../models/BusinessPricing.js';

/**
 * Charges one live call before it is done. `ref` is unique per call, so a retry is charged once. Test calls and
 * calls priced 0 are free. Not enough balance stops the call with 402.
 */
export async function charge(req, kind, ref) {
  if (req.mode !== 'live') return 0;
  const amount = (await readPrices())[kind] ?? 0;
  if (!amount) return 0;
  try {
    await callService(config.walletUrl, '/internal/debit', {
      userId: req.business.userId,
      amount,
      ref: `bid:${kind}:${ref}`,
      note: `Bharat ID for Business · ${kind}`,
    });
  } catch (err) {
    if (err.code === 'INSUFFICIENT_BALANCE') {
      throw new ApiError(
        402,
        'INSUFFICIENT_CREDIT',
        'Not enough credit. Add money in your business dashboard → Billing.',
      );
    }
    throw err;
  }
  return amount;
}
