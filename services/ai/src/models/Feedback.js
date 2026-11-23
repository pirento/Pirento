// A thumbs up or down on one answer, with the question and answer as they were, so the team can improve the
// knowledge base. Personal data: removed when the account is deleted.
import mongoose from 'mongoose';

const schema = new mongoose.Schema(
  {
    userId: {type: String, required: true, index: true},
    chatId: {type: String, required: true},
    index: {type: Number, required: true}, // which message in the chat
    rating: {type: String, enum: ['up', 'down'], required: true},
    note: {type: String, default: '', maxlength: 500},
    product: String,
    question: {type: String, maxlength: 500},
    answer: {type: String, maxlength: 1500},
  },
  {timestamps: true},
);
schema.index({chatId: 1, index: 1}, {unique: true}); // one rating per answer; rating again changes it
schema.index({rating: 1, createdAt: -1});
export const Feedback = mongoose.model('Feedback', schema);
