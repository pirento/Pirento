// Who gets how many messages a day: a running paid plan's allowance, else the free one; and buying a plan.
import {ApiError, callService, notFound} from '@pirento/shared/server';
import {config} from '../config.js';
import {Plan} from '../models/Plan.js';
import {Subscription} from '../models/Subscription.js';
import {readSettings} from '../models/Settings.js';

const DAY = 86_400_000;

export const runningPlan = (sub, now = new Date()) => (sub?.until && new Date(sub.until) > now ? sub : null);

/** Today's allowance and the plan behind it. */
export async function allowanceOf(userId) {
  const [sub, settings] = await Promise.all([Subscription.findOne({userId}).lean(), readSettings()]);
  const plan = runningPlan(sub);
  return {limit: plan?.dailyLimit ?? settings.freeDailyLimit, plan: plan && {name: plan.name, until: plan.until}};
}

/**
 * Buys a plan from the wallet. The ref is per person, plan and day: a double click pays once and applies once.
 * Buying the plan that is running adds its months to the end; another plan waits until the running one ends.
 */
export async function buyPlan(userId, planId, now = new Date()) {
  const plan = await Plan.findOne({_id: planId, active: true}).lean();
  if (!plan) throw notFound('This plan is not on offer');
  const sub = await Subscription.findOne({userId}).lean();
  const running = runningPlan(sub, now);
  if (running && running.planId !== String(plan._id)) {
    throw new ApiError(409, 'PLAN_RUNNING', `Your ${running.name} plan runs until it ends; buy another after that.`);
  }
  const ref = `ai-plan-${userId}-${plan._id}-${now.toISOString().slice(0, 10)}`;
  if (sub?.lastPurchase === ref) return sub;
  await callService(config.walletUrl, '/internal/debit', {
    userId,
    amount: plan.price,
    ref,
    note: `Pirento AI · ${plan.name} plan, ${plan.months} months`.slice(0, 140),
  });
  const from = running ? new Date(running.until) : now;
  const set = {
    planId: String(plan._id),
    name: plan.name,
    dailyLimit: plan.dailyLimit,
    until: new Date(from.getTime() + plan.months * 30 * DAY),
    lastPurchase: ref,
  };
  return (
    (await Subscription.findOneAndUpdate(
      {userId, lastPurchase: {$ne: ref}},
      {$set: set},
      {upsert: true, new: true},
    ).catch((err) => {
      if (err.code !== 11000) throw err; // the same purchase landed first: it is already applied
      return null;
    })) ?? Subscription.findOne({userId}).lean()
  );
}
