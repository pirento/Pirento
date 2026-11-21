// Seeds sign-ins from the environment: the first staff sign-in, and an optional test customer for trying the site.
import {TERMS_VERSION, isUsername, passwordProblem} from '@pirento/shared';
import {config} from '../config.js';
import {User} from '../models/User.js';
import {MIN_PASSWORD, hashPassword, verifyPassword} from './password.js';

// Re-hash only when the password in the environment changed, so restarts do not churn the hash.
async function setPassword(user, password) {
  if (!(await verifyPassword(password, user.passwordHash))) user.passwordHash = await hashPassword(password);
}

export async function seedSuperadmin() {
  const staffId = config.superadminStaffId.trim().toLowerCase();
  const password = config.superadminPassword;
  if (!staffId || !password) return;
  if (password.length < MIN_PASSWORD) {
    console.error(`SUPERADMIN_PASSWORD needs at least ${MIN_PASSWORD} characters; superadmin not seeded`);
    return;
  }
  const user =
    (await User.findOne({staffId}).select('+passwordHash')) ??
    new User({staffId, email: `${staffId}@staff.pirento.local`});
  user.role = 'superadmin';
  user.suspended = false;
  await setPassword(user, password);
  await user.save();
  console.log(`superadmin staff ID "${staffId}" is ready`);
}

/** A customer who signs in with a user ID and password, for testing. Never turns an existing staff account into it. */
export async function seedTestCustomer() {
  const username = config.testUserId.trim().toLowerCase();
  const password = config.testUserPassword;
  if (!username || !password) return;
  if (!isUsername(username) || passwordProblem(password)) {
    console.error(`TEST_USER_ID or TEST_USER_PASSWORD breaks the sign-up rules; test customer not seeded`);
    return;
  }
  const user =
    (await User.findOne({username}).select('+passwordHash')) ??
    new User({
      username,
      email: `${username}@test.pirento.local`,
      name: 'Test Customer',
      role: 'customer',
      termsAcceptedAt: new Date(),
      termsVersion: TERMS_VERSION,
    });
  if (user.role !== 'customer') {
    console.error(`TEST_USER_ID "${username}" belongs to a staff account; not seeded`);
    return;
  }
  user.suspended = false;
  await setPassword(user, password);
  await user.save();
  console.log(`test customer "${username}" is ready`);
}
