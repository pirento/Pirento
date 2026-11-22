// The holder sets or changes their 6-digit Bharat ID PIN, once the ID is issued. Changing it needs the current PIN.
import {Router} from 'express';
import {z} from 'zod';
import {pinProblem} from '@pirento/shared';
import {ApiError, badInput, notFound, requireAuth, validate} from '@pirento/shared/server';
import {Identity} from '../models/Identity.js';
import {checkPin, hashPin} from '../lib/pin.js';

export const pinRoutes = Router();

pinRoutes.put(
  '/pin',
  requireAuth,
  validate(z.object({pin: z.string(), currentPin: z.string().optional()})),
  async (req, res) => {
    const problem = pinProblem(req.body.pin);
    if (problem) throw badInput(problem);
    const doc = await Identity.findOne({userId: req.user.sub, status: 'approved'});
    if (!doc) throw notFound('Your PIN can be set once your Bharat ID is issued');
    // Changing it needs the current PIN, checked with the same lockout as any other PIN check.
    if (doc.pin?.hash) {
      await checkPin(doc.bharatId, req.body.currentPin ?? '', doc.sections?.personal?.dob).catch((err) => {
        throw err.code === 'PIN_LOCKED' ? err : new ApiError(401, 'PIN_WRONG', 'Your current PIN is not right');
      });
    }
    const saved = await Identity.findOneAndUpdate(
      {_id: doc._id},
      {
        $set: {'pin.hash': await hashPin(req.body.pin), 'pin.setAt': new Date(), 'pin.fails': 0},
        $unset: {'pin.lockedUntil': 1},
      },
      {new: true},
    );
    res.json({data: saved});
  },
);
