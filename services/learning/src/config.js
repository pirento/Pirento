import {EXAM_RULES} from '@pirento/shared';
import {env, keyFrom} from '@pirento/shared/server';

export const config = {
  port: Number(env('PORT', 4006)),
  mongoUri: env('MONGO_URI', 'mongodb://127.0.0.1:27017/pirento_learning'),
  retryAfterHours: EXAM_RULES.retryHours, // a failed (or abandoned) exam can be taken again after a day
  fileKey: keyFrom(env('LEARNING_FILE_KEY', 'dev-only-learning-file-key')), // resumes at rest
  maxResumeBytes: 2 * 1024 * 1024,
};
