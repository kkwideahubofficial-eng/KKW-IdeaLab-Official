import mongoose from 'mongoose';

const emailQueueSchema = new mongoose.Schema({
  to: {
    type: String,
    required: true,
    trim: true
  },
  subject: {
    type: String,
    required: true
  },
  htmlContent: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['PENDING', 'SENT', 'FAILED'],
    default: 'PENDING',
    index: true
  },
  attempts: {
    type: Number,
    default: 0
  },
  maxAttempts: {
    type: Number,
    default: 5
  },
  lastError: {
    type: String,
    default: ''
  },
  sentAt: {
    type: Date
  }
}, {
  timestamps: true
});

// Index to quickly query pending and failed emails needing retry
emailQueueSchema.index({ status: 1, attempts: 1 });

const EmailQueue = mongoose.models.EmailQueue || mongoose.model('EmailQueue', emailQueueSchema);

export default EmailQueue;
