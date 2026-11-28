// One notice on one channel: sent, skipped (and why) or failed, for admin → Notifications → Delivery log. Kept 90
// days; the text itself stays on the Notice.
import mongoose from 'mongoose';

export const NoticeDelivery = mongoose.model(
  'NoticeDelivery',
  new mongoose.Schema(
    {
      noticeId: String,
      userId: {type: String, index: true},
      event: String,
      channel: {type: String, enum: ['dashboard', 'email', 'sms', 'whatsapp']},
      status: {type: String, enum: ['sent', 'skipped', 'failed']},
      reason: {type: String, maxlength: 200},
      ref: String, // the provider's message id
    },
    {timestamps: true},
  )
    .index({createdAt: -1})
    .index({createdAt: 1}, {expireAfterSeconds: 90 * 86_400}),
);
