// A saved conversation with the assistant.
import mongoose from 'mongoose';

export const Chat = mongoose.model(
  'Chat',
  new mongoose.Schema(
    {
      userId: {type: String, required: true, index: true},
      title: {type: String, maxlength: 80}, // the first question, shortened
      product: {type: String, default: ''}, // where it was started: the assistant leans to that product
      messages: [
        {
          _id: false,
          role: {type: String, enum: ['user', 'assistant']},
          content: String,
          at: {type: Date, default: Date.now},
        },
      ],
    },
    {timestamps: true},
  ),
);
