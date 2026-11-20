import mongoose from 'mongoose';

const schema = new mongoose.Schema({
  code: {type: String, required: true, unique: true}, // PC-XXXXXXXX, public
  userId: {type: String, required: true},
  fullName: {type: String, required: true},
  track: {type: String, required: true},
  percent: Number,
  skills: Object, // percent per skill area, e.g. {theoretical: 80, practical: 60}
  issuedAt: {type: Date, default: Date.now},
});
schema.index({userId: 1, track: 1}, {unique: true}); // one certificate per track per person

export const Certificate = mongoose.model('Certificate', schema);
