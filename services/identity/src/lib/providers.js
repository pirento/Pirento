// Aadhaar OTP and face checks run on a licensed provider: Digio first, Setu as the backup once it is wired in.
import {config, digioOn} from '../config.js';
import {createKyc, kycResult} from './digio.js';

const DIGIO_TEMPLATES = () => ({aadhaar_otp: config.digio.aadhaarTemplate, face: config.digio.faceTemplate});

const PROVIDERS = [
  {
    name: 'digio',
    ready: (method) => digioOn() && Boolean(DIGIO_TEMPLATES()[method]),
    /** Opens the check; the browser shows it in Digio's web SDK with the id and token. */
    async start(method, identity, session) {
      const r = await createKyc({
        identity,
        name: identity.fullName,
        template: DIGIO_TEMPLATES()[method],
        reference: `BIDA${session._id}`,
        transaction: `BIDA${session._id}`,
      });
      return {
        requestId: r.id,
        token: r.token,
        identifier: identity.email,
        environment: config.digio.environment,
        sdk: config.digio.sdk,
      };
    },
    /** 'passed' only once Digio approves (the template's match rules passed), 'failed' if it ends any other way. */
    async outcome(requestId) {
      const {status} = await kycResult(requestId);
      return status === 'approved'
        ? 'passed'
        : ['rejected', 'expired', 'terminated'].includes(status)
          ? 'failed'
          : 'pending';
    },
  },
  // shortcut: Setu is the chosen backup, but its docs could not be read here, so no call is written for it;
  // add its start/outcome from Setu's API reference (DigiLocker Aadhaar, face match) with its keys.
  {name: 'setu', ready: () => false},
];

/** The first provider set up for this method, or null. */
export const providerFor = (method) => PROVIDERS.find((p) => p.ready(method)) ?? null;
export const providerNamed = (name) => PROVIDERS.find((p) => p.name === name);
