// The check-in that starts a release. Any use of the vault counts as a sign of life (markSeen). Once an hour the job
// looks for quiet plans: after three quiet months a reminder goes in the 4th, 5th and 6th month (email, SMS and the
// dashboard's bell, each with an "I am here" link); after that the case waits for the team to call the nominee.
// Each step is claimed by one conditional update, so with many copies of the service it still happens once.
import crypto from 'node:crypto';
import {LEGACY, quietStage} from '@pirento/shared';
import {notify} from '@pirento/shared/server';
import {config} from '../config.js';
import {Legacy} from '../models/Legacy.js';
import {logAction} from './log.js';

const MONTH = 30 * 86_400_000;
const HOUR = 3_600_000;
const LIVE = ['active', 'reminding', 'call-nominee', 'nominee-reached']; // before a certificate is verified

/** A sign of life: back to active, reminders cleared. Written at most once an hour per person. */
export async function markSeen(userId, now = new Date()) {
  const done = await Legacy.updateOne(
    {userId, stage: {$in: LIVE}, lastSeenAt: {$lt: new Date(now - HOUR)}},
    {$set: {lastSeenAt: now, stage: 'active', reminders: 0}, $unset: {aliveHash: 1, remindedAt: 1}},
  );
  if (done.modifiedCount) await logAction(userId, 'seen', {by: 'system'});
}

export const hashToken = (t) => crypto.createHash('sha256').update(String(t)).digest('hex');

export async function runCheckins(now = new Date()) {
  const quietSince = new Date(now - LEGACY.quietMonths * MONTH);
  const due = await Legacy.find({stage: {$in: ['active', 'reminding']}, lastSeenAt: {$lte: quietSince}}).limit(500);
  for (const plan of due) {
    const months = Math.floor((now - plan.lastSeenAt) / MONTH);
    const {stage, reminder} = quietStage(months);
    if (stage === plan.stage && reminder <= plan.reminders) continue;
    const token = crypto.randomBytes(24).toString('base64url');
    const claimed = await Legacy.updateOne(
      {_id: plan._id, stage: plan.stage, reminders: plan.reminders},
      {$set: {stage, reminders: reminder, remindedAt: now, aliveHash: hashToken(token)}},
    );
    if (!claimed.modifiedCount) continue;
    if (stage === 'call-nominee') {
      await logAction(plan.userId, 'case.call-nominee', {by: 'system'});
      continue; // the team's queue shows it; nothing more goes to the owner
    }
    await logAction(plan.userId, 'reminder', {target: `${reminder} of ${LEGACY.reminderMonths.length}`, by: 'system'});
    notify(plan.userId, {
      brand: 'Pirento Vault',
      label: 'Are you well?',
      big: `Reminder ${reminder} of ${LEGACY.reminderMonths.length}`,
      note: `We have not seen you in your vault for ${months} months. Tap to tell us you are here: ${config.siteUrl}/vault/alive?t=${token} . If we hear nothing after the last reminder, our team will call your nominee.`,
      sms: true,
    });
  }
}

export function startCheckins() {
  const run = () => runCheckins().catch((err) => console.error('vault check-ins', err.message));
  setTimeout(run, 45_000).unref();
  setInterval(run, HOUR).unref();
}
