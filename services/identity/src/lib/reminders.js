// Carrying an unfinished Bharat ID application through: what is left, a one-time link to it by email and SMS,
// and reminders after 1, 3 and 7 days without progress.
import {ID_SECTIONS, declarationSigned, kycDone, toPhone} from '@pirento/shared';
import {callService} from '@pirento/shared/server';
import {config} from '../config.js';
import {Identity} from '../models/Identity.js';

const DAY = 86_400_000;
export const REMINDER_GAPS = [1 * DAY, 3 * DAY, 7 * DAY];

/** The next thing the applicant must do, in the words they see. */
export function nextStep(doc) {
  const section = ID_SECTIONS.find((s) => !doc.sections?.[s.id]);
  if (section) return section.title;
  if (!kycDone(doc)) return 'Video KYC';
  if (!declarationSigned(doc)) return 'Sign the declaration';
  if (!doc.pin?.hash) return 'Set your PIN';
  return 'Review and submit';
}

/** The fields that start the reminder clock again; set on every change to a draft. */
export const remindFromNow = () => ({
  'reminders.count': 0,
  'reminders.nextAt': new Date(Date.now() + REMINDER_GAPS[0]),
});

/** Sends the one-time link to carry on, to the account's email and by SMS to the mobile in the application. */
export function sendContinue(doc, intro) {
  const step = nextStep(doc);
  return callService(config.authUrl, '/internal/continue-link', {
    userId: doc.userId,
    phone: toPhone(doc.sections?.contact?.mobile) ?? undefined,
    brand: 'Bharat ID',
    label: 'Your application',
    note: `${intro} Next: ${step}. Carry on here:`,
    next: '/bharat-id/dashboard/apply',
  });
}

/**
 * Sends the reminders that are due. Each one is claimed first with one conditional update (the next date moves on),
 * so two service instances never send the same reminder twice.
 */
export async function sendDueReminders(now = new Date()) {
  let sent = 0;
  for (;;) {
    const doc = await Identity.findOneAndUpdate(
      {
        status: {$in: ['draft', 'rejected']},
        'reminders.nextAt': {$lte: now},
        'reminders.count': {$lt: REMINDER_GAPS.length},
      },
      [
        {
          $set: {
            'reminders.count': {$add: ['$reminders.count', 1]},
            'reminders.nextAt': {
              $cond: [
                {$lt: [{$add: ['$reminders.count', 1]}, REMINDER_GAPS.length]},
                {$add: [now, {$arrayElemAt: [REMINDER_GAPS, {$add: ['$reminders.count', 1]}]}]},
                null,
              ],
            },
          },
        },
      ],
      {new: true},
    );
    if (!doc) return sent;
    await sendContinue(doc, 'Your Bharat ID application is not finished yet.').then(
      () => sent++,
      (err) => console.error('reminder', String(doc._id), err.message),
    );
  }
}

/** Checks for due reminders every hour, from when the service starts. */
export function startReminders() {
  setInterval(() => sendDueReminders().catch((err) => console.error('reminders', err.message)), 60 * 60_000).unref();
}
