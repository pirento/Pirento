// What the team teaches the assistant: short articles (how a service works, policies, timelines). Published ones
// are added to every chat's instructions.
import mongoose from 'mongoose';
import {forgetOnWrite} from '@pirento/shared/server';

const schema = new mongoose.Schema(
  {
    title: {type: String, required: true, maxlength: 120},
    body: {type: String, required: true, maxlength: 4000},
    product: {type: String, default: ''}, // '' = all of Pirento
    published: {type: Boolean, default: false},
    updatedBy: String,
  },
  {timestamps: true},
);
forgetOnWrite(schema, 'ai:knowledge');
export const Knowledge = mongoose.model('Knowledge', schema);
