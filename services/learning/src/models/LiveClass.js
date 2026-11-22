// A live class: a time and a Meet or Zoom link, for one track or everyone. Its recording is uploaded afterwards.
import mongoose from 'mongoose';

export const LiveClass = mongoose.model(
  'LiveClass',
  new mongoose.Schema(
    {
      track: {type: String, default: ''}, // '' = every intern
      title: {type: String, required: true, maxlength: 120},
      about: {type: String, default: '', maxlength: 1000},
      startsAt: {type: Date, required: true, index: true},
      minutes: {type: Number, default: 60},
      link: {type: String, required: true, maxlength: 300},
      recording: {_id: false, key: String, name: String, size: Number, type: String},
      createdBy: String,
    },
    {timestamps: true},
  ),
);
