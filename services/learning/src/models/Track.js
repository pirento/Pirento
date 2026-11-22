// An exam track's settings set in admin: overrides a built-in track (by slug) or adds a new one.
import mongoose from 'mongoose';
import {forgetOnWrite} from '@pirento/shared/server';

const schema = new mongoose.Schema(
  {
    slug: {type: String, required: true, unique: true, maxlength: 40},
    name: {type: String, required: true, maxlength: 80},
    minutes: {type: Number, required: true, min: 5, max: 180},
    passPercent: {type: Number, required: true, min: 30, max: 100},
    questions: {type: Number, required: true, min: 3, max: 100}, // drawn at random from the track's bank per attempt
    active: {type: Boolean, default: true}, // an inactive track takes no new exams
  },
  {timestamps: true},
);
forgetOnWrite(schema, 'learning:tracks');
export const Track = mongoose.model('Track', schema);
