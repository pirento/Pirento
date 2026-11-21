// Deleting an account across every service.
import {callService, conflict} from '@pirento/shared/server';
import {config} from '../config.js';
import {clearFailures} from './backoff.js';
import {endAllSessions} from './session.js';

/**
 * Deletes an account across the ecosystem. Every service that keeps personal
 * data forgets it first; if one fails, nothing here changes and the superadmin
 * can try again. Orders, the wallet ledger and tickets stay, tied to an
 * anonymous account, because accounts and tax rules need them.
 */
export async function forgetUser(user) {
  const {balance} = await callService(config.walletUrl, '/internal/balance', {userId: String(user._id)});
  if (balance > 0) throw conflict('HAS_BALANCE', 'This wallet still holds money. Pay it out before deleting.');

  for (const url of config.forgetUrls())
    await callService(url, '/internal/forget', {userId: String(user._id), email: user.email});

  await clearFailures([`user:${user.email}`, `user:${user.username}`, `staff:${user.staffId}`]);
  user.email = `deleted-${user._id}@deleted.invalid`;
  user.name = '';
  user.role = 'customer';
  user.products = [];
  // No way back in: no staff door, no Google link.
  user.staffId = undefined;
  user.googleId = undefined;
  user.passwordHash = undefined;
  user.suspended = true;
  await user.save();
  await endAllSessions(user._id);
  return user;
}
