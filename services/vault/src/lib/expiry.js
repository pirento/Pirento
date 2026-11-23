// Expiry reminders: once an hour, files whose document expires within 30 days get one email to their owner. Each
// reminder is claimed by one conditional update, so with many copies of the service it still goes once.
import {notify} from '@pirento/shared/server';
import {VaultFile} from '../models/VaultFile.js';

const DAY = 86_400_000;

export async function sendExpiryReminders(now = new Date()) {
  const soon = new Date(now.getTime() + 30 * DAY);
  const due = await VaultFile.find(
    {expiresOn: {$gte: now, $lte: soon}, expiryReminded: {$exists: false}},
    {userId: 1, name: 1, label: 1, expiresOn: 1},
  ).limit(500);
  for (const f of due) {
    const claimed = await VaultFile.updateOne(
      {_id: f._id, expiryReminded: {$exists: false}},
      {$set: {expiryReminded: now}},
    );
    if (!claimed.modifiedCount) continue;
    const days = Math.max(0, Math.ceil((f.expiresOn - now) / DAY));
    notify(f.userId, {
      brand: 'Pirento Vault',
      label: f.label ?? 'Document',
      big: `Expires in ${days} day${days === 1 ? '' : 's'}`,
      note: `${f.name} expires on ${f.expiresOn.toISOString().slice(0, 10)}. Renew it, then upload the new one to your vault.`,
    });
  }
}

export function startExpiryReminders() {
  const run = () => sendExpiryReminders().catch((err) => console.error('expiry reminders', err.message));
  setTimeout(run, 30_000).unref();
  setInterval(run, 60 * 60_000).unref();
}
