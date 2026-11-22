// A Pirento Intern certificate, checked publicly by its code: for passing a track's exam, or for finishing an
// internship (then `track` is `internship-<application id>` and `title` names the role).
import mongoose from 'mongoose';

const schema = new mongoose.Schema({
  code: {type: String, required: true, unique: true}, // PC-XXXXXXXX, public
  kind: {type: String, enum: ['exam', 'internship'], default: 'exam'},
  userId: {type: String, required: true},
  fullName: {type: String, required: true},
  track: {type: String, required: true},
  title: String, // internship: the role
  company: String, // internship: who it was with
  weeks: Number,
  percent: Number,
  skills: Object, // percent per skill area, e.g. {theoretical: 80, practical: 60}
  issuedAt: {type: Date, default: Date.now},
});
schema.index({userId: 1, track: 1}, {unique: true}); // one certificate per track (or internship) per person

export const Certificate = mongoose.model('Certificate', schema);
