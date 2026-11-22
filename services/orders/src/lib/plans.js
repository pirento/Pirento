// Pirento One plans: which one a partner is on, its commission rate, and buying a paid one from the wallet.
import {ApiError, callService, notFound} from '@pirento/shared/server';
import {config} from '../config.js';
import {Partner} from '../models/Partner.js';
import {PartnerPlan} from '../models/PartnerPlan.js';

const DAY = 86_400_000;

/** The plan offered free: the first active plan priced 0. */
export const freePlan = () => PartnerPlan.findOne({price: 0, active: true}).sort({sort: 1, createdAt: 1}).lean();

/** A paid plan still running, or null. */
export const paidPlanOf = (partner, now = new Date()) =>
  partner?.plan?.until && new Date(partner.plan.until) > now ? partner.plan : null;

/** The commission rate a partner earns today: their paid plan's, else the free plan's, else 0. */
export async function rateFor(partner) {
  const paid = paidPlanOf(partner);
  if (paid) return paid.commissionPct;
  return (await freePlan())?.commissionPct ?? 0;
}

/** When a purchase made now ends: a renewal of the same running plan adds to it, anything else starts today. */
export function endOf(partner, plan, now = new Date()) {
  const running = paidPlanOf(partner, now);
  const from = running && running.id === String(plan._id) ? new Date(running.until) : now;
  return new Date(from.getTime() + plan.months * 30 * DAY);
}

/**
 * Buys a paid plan from the wallet. The ref is per person, plan and day, so a double click or a retry
 * is charged once (the wallet applies a ref once) and applied once (lastPurchase).
 */
export async function buyPlan(partner, planId, now = new Date()) {
  const plan = await PartnerPlan.findOne({_id: planId, active: true}).lean();
  if (!plan) throw notFound('This plan is not on offer');
  if (!plan.price) throw new ApiError(400, 'FREE_PLAN', 'The free plan needs no purchase');
  const running = paidPlanOf(partner, now);
  if (running && running.id !== String(plan._id)) {
    throw new ApiError(409, 'PLAN_RUNNING', `Your ${running.name} plan runs until it ends; buy another after that.`);
  }
  const ref = `partner-plan-${partner.userId}-${plan._id}-${now.toISOString().slice(0, 10)}`;
  if (partner.lastPurchase === ref) return partner;
  await callService(config.walletUrl, '/internal/debit', {
    userId: partner.userId,
    amount: plan.price,
    ref,
    note: `Pirento One · ${plan.name} plan, ${plan.months} months`.slice(0, 140),
  });
  const set = {
    plan: {id: String(plan._id), name: plan.name, commissionPct: plan.commissionPct, until: endOf(partner, plan, now)},
    lastPurchase: ref,
  };
  return (
    (await Partner.findOneAndUpdate({_id: partner._id, lastPurchase: {$ne: ref}}, {$set: set}, {new: true})) ??
    Partner.findById(partner._id)
  );
}
