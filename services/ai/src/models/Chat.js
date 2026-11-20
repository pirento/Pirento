import mongoose from 'mongoose';

// A saved conversation with the assistant.
export const Chat = mongoose.model(
  'Chat',
  new mongoose.Schema(
    {
      userId: {type: String, required: true, index: true},
      title: {type: String, maxlength: 80}, // the first question, shortened
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
