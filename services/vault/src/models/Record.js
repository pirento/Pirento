// A record in the vault (a bank account, a policy, money lent, a will…). Its kind and title are plain, so the list
// can show them; every field is sealed together with AES-256-GCM and opened only after a Bharat ID PIN check.
import mongoose from 'mongoose';

export const Record = mongoose.model(
  'Record',
  new mongoose.Schema(
    {
      userId: {type: String, required: true, index: true},
      kind: {type: String, required: true}, // one of VAULT_KINDS
      title: {type: String, required: true, maxlength: 120},
      fields: {iv: Buffer, tag: Buffer, data: Buffer}, // the JSON of the fields, sealed
      release: {type: Boolean, default: false}, // the owner allows it to go to their nominee
    },
    {timestamps: true},
  ),
);

/** Projection for listings: everything except the sealed fields. */
export const WITHOUT_FIELDS = {fields: 0};
