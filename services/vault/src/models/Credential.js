// A saved password. The label and username are plain so the list can show them;
// the password itself is sealed and only opened by its own route.
import mongoose from 'mongoose';

export const Credential = mongoose.model(
  'Credential',
  new mongoose.Schema(
    {
      userId: {type: String, required: true, index: true},
      label: {type: String, required: true, maxlength: 80},
      username: {type: String, maxlength: 200},
      secret: {iv: Buffer, tag: Buffer, data: Buffer},
      release: {type: Boolean, default: false}, // the owner allows it to go to their nominee
    },
    {timestamps: true},
  ),
);
