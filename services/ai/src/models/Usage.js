// Messages sent per account per day: the fair-use allowance for Pirento AI.
import mongoose from 'mongoose';

const schema = new mongoose.Schema({
  userId: {type: String, required: true},
  day: {type: String, required: true}, // YYYY-MM-DD in India
  n: {type: Number, default: 0},
  createdAt: {type: Date, default: Date.now, expires: 3 * 86_400}, // old days clean themselves up
});
schema.index({userId: 1, day: 1}, {unique: true});
export const Usage = mongoose.model('Usage', schema);
