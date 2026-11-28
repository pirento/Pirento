// One consent the owner gave through Digio's Account Aggregator: where it stands, the accounts it covers (masked, as
// the AA sends them) and the latest data request. The holdings themselves become sealed Records (source 'digio').
import mongoose from 'mongoose';

export const LINK_STATUSES = ['pending', 'approved', 'active', 'rejected', 'revoked', 'paused', 'expired', 'failed'];

export const Link = mongoose.model(
  'Link',
  new mongoose.Schema(
    {
      userId: {type: String, required: true, index: true},
      consentRequestId: {type: String, required: true, unique: true},
      customerId: String, // Digio's customer id, which its SDK needs with the gateway token
      status: {type: String, enum: LINK_STATUSES, default: 'pending'},
      accounts: [{_id: false, accountId: String, fiType: String, fipId: String, masked: String}],
      fiRequestId: String,
      fiStatus: String, // PENDING, DATA_AVAILABLE, DELIVERED, FAILED
      fetchedAt: Date, // when holdings were last written to the vault
      nextFetchAt: Date, // the refresh job claims a link by moving this forward
      error: {type: String, maxlength: 200},
    },
    {timestamps: true},
  ).index({status: 1, nextFetchAt: 1}),
);
