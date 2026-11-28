// A notice shown in every dashboard's bell: the same words the person was emailed, kept so they can read them again.
import mongoose from 'mongoose';

export const Notice = mongoose.model(
  'Notice',
  new mongoose.Schema(
    {
      userId: {type: String, required: true},
      event: {type: String, default: 'general'}, // one of NOTICE_EVENTS
      brand: {type: String, maxlength: 60},
      label: {type: String, maxlength: 80},
      big: {type: String, maxlength: 80},
      note: {type: String, maxlength: 600},
      link: {type: String, maxlength: 300}, // the page it is about
      readAt: Date,
    },
    {timestamps: true},
  )
    .index({userId: 1, createdAt: -1})
    // Old notices go by themselves after a year.
    .index({createdAt: 1}, {expireAfterSeconds: 365 * 86_400}),
);
