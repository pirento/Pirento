// Seeds the first staff sign-in from the environment, so a new install has a way through the staff door.
import {config} from '../config.js';
import {User} from '../models/User.js';
import {MIN_PASSWORD, hashPassword, verifyPassword} from './password.js';

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
  // Re-hash only when the password in the environment changed, so restarts do not churn the hash.
  if (!(await verifyPassword(password, user.passwordHash))) user.passwordHash = await hashPassword(password);
  await user.save();
  console.log(`superadmin staff ID "${staffId}" is ready`);
}
