// The 6-digit Bharat ID PIN: set while applying (a step of the application) or later, changed with the current PIN.
import {Router} from 'express';
import {z} from 'zod';
import {pinProblem} from '@pirento/shared';
import {ApiError, badInput, notFound, requireAuth, validate} from '@pirento/shared/server';
import {Identity} from '../models/Identity.js';
import {checkPin, hashPin, samePin} from '../lib/pin.js';

export const pinRoutes = Router();

pinRoutes.put(
  '/pin',
  requireAuth,
  validate(z.object({pin: z.string(), currentPin: z.string().optional()})),
  async (req, res) => {
    const problem = pinProblem(req.body.pin);
    if (problem) throw badInput(problem);
    const doc = await Identity.findOne({userId: req.user.sub});
    if (!doc) throw notFound('Start your Bharat ID application first');
    // Changing it needs the current PIN: on an issued ID with the same lockout as any PIN check.
    if (doc.pin?.hash) {
      const wrong = () => new ApiError(401, 'PIN_WRONG', 'Your current PIN is not right');
      if (doc.status === 'approved') {
        await checkPin(doc.bharatId, req.body.currentPin ?? '', doc.sections?.personal?.dob).catch((err) => {
          throw err.code === 'PIN_LOCKED' ? err : wrong();
        });
      } else if (!(await samePin(doc, req.body.currentPin ?? ''))) {
        throw wrong();
      }
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
