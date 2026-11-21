// The spoken code that proves a KYC video was recorded live.
import crypto from 'node:crypto';
import {config} from '../config.js';

/** A random 4-digit code the applicant reads out on camera. */
export const newChallenge = () => String(crypto.randomInt(1000, 10_000));

/** True while a challenge is fresh enough to record against. */
export const challengeValid = (kyc, now = Date.now()) =>
  Boolean(kyc?.challenge && kyc.challengeAt && now - new Date(kyc.challengeAt).getTime() <= config.challengeLifeMs);
