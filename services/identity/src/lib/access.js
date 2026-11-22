// Writes the access log: one row per live or test call that touches a Bharat ID. Never the details themselves.
import {AccessLog} from '../models/AccessLog.js';

export const logAccess = (req, row) =>
  AccessLog.create({
    businessId: String(req.business._id),
    businessName: req.business.profile?.legalName ?? req.business.request.company,
    mode: req.mode,
    ip: req.ip,
    ...row,
  }).catch((err) => console.error('access log', err.message)); // a lost log line must not fail the call
