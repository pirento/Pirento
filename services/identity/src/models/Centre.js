// A Bharat ID enrolment centre: a place with a QR poster. Scanning it starts an application on the person's phone,
// recorded against the centre.
import mongoose from 'mongoose';

export const Centre = mongoose.model(
  'Centre',
  new mongoose.Schema(
    {
      code: {type: String, required: true, unique: true}, // in the QR's link: /bharat-id/start?centre=<code>
      name: {type: String, required: true, maxlength: 80},
      city: {type: String, required: true, maxlength: 60},
      active: {type: Boolean, default: true}, // a closed centre's QR stops starting applications
      createdBy: {_id: false, id: String, email: String},
    },
    {timestamps: true},
  ),
);
