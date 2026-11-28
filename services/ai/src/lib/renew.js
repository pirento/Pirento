// Auto-renewal of AI plans the person switched it on for: within a day of the end, the same plan is bought again
// from the wallet (the purchase ref is per day, so many copies of this job still charge once). A failure (too little
// money, the plan withdrawn) switches it off and tells the person.
import {notify} from '@pirento/shared/server';
import {Subscription} from '../models/Subscription.js';
import {buyPlan} from './plans.js';

const DAY = 86_400_000;

export async function renewDue(now = new Date()) {
  const due = await Subscription.find({autoRenew: true, until: {$gt: now, $lte: new Date(now.getTime() + DAY)}}).limit(
    500,
  );
  for (const sub of due) {
    try {
      const after = await buyPlan(sub.userId, sub.planId, now);
      if (after?.until > sub.until) {
        notify(sub.userId, {
          event: 'ai.plan',
          link: '/ai/dashboard/plans',
          brand: 'Pirento AI',
          label: `${sub.name} plan`,
          big: 'Renewed',
          note: `Paid from your wallet; it now runs until ${new Date(after.until).toISOString().slice(0, 10)}.`,
        });
      }
    } catch (err) {
      await Subscription.updateOne({_id: sub._id}, {$set: {autoRenew: false}});
      notify(sub.userId, {
        event: 'ai.plan',
        link: '/ai/dashboard/plans',
        brand: 'Pirento AI',
        label: `${sub.name} plan`,
        big: 'Could not renew',
        note: `${err.message}. Auto-renew is now off; renew from Pirento AI → Plans when you are ready.`,
      });
    }
  }
}

export function startRenewals() {
  const run = () => renewDue().catch((err) => console.error('ai renewals', err.message));
  setTimeout(run, 45_000).unref();
  setInterval(run, 60 * 60_000).unref();
}
