// Admin's choice of channels for one notification event (admin → Notifications); without a row the event's defaults
// in NOTICE_EVENTS apply.
import mongoose from 'mongoose';

export const NoticeSetting = mongoose.model(
  'NoticeSetting',
  new mongoose.Schema(
    {
      _id: {type: String}, // the event id
      channels: {dashboard: Boolean, email: Boolean, sms: Boolean, whatsapp: Boolean},
      updatedBy: String,
    },
    {timestamps: true},
  ),
);
