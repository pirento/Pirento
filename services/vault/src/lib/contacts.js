// The nominee and emergency contact come from the owner's issued Bharat ID, never typed into the vault, so they are
// the people the owner named and verified there.
import {callService} from '@pirento/shared/server';
import {config} from '../config.js';

export const contactsOf = (userId) => callService(config.identityUrl, '/internal/vault-contacts', {userId});

const maskMobile = (m) => (m ? `••••• •${String(m).slice(-4)}` : '');

/** The same, as the owner sees it in their dashboard: names and relation, mobiles masked. */
export async function maskedContacts(userId) {
  const c = await contactsOf(userId);
  return {
    nominee: {...c.nominee, mobile: maskMobile(c.nominee.mobile)},
    emergency: {...c.emergency, mobile: maskMobile(c.emergency.mobile)},
  };
}
