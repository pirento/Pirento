// A message sent from a site's contact form, by anyone, signed in or not.
import mongoose from 'mongoose';

export const ENQUIRY_STATUSES = ['new', 'handled'];

/** new: nobody has answered yet · handled: the team replied (by email or phone) or closed it. */
export const Enquiry = mongoose.model(
  'Enquiry',
  new mongoose.Schema(
    {
      enquiryNo: {type: Number, required: true, unique: true},
      name: {type: String, required: true, maxlength: 100},
      email: {type: String, required: true, index: true},
      phone: String,
      product: {type: String, index: true}, // the site it came from; none for Pirento itself
      service: String, // the service slug it is about, if one was chosen
      message: {type: String, required: true, maxlength: 3000},
      status: {type: String, enum: ENQUIRY_STATUSES, default: 'new', index: true},
      handledBy: String,
      note: {type: String, maxlength: 1000}, // team-only: what was done
    },
    {timestamps: true},
  ),
);
