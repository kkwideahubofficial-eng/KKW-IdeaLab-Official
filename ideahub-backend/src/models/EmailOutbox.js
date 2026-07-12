import mongoose from 'mongoose';

const emailOutboxSchema = new mongoose.Schema({
  idempotencyKey: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
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
    enum: ['PENDING', 'PROCESSING', 'SENT', 'FAILED', 'DLQ'],
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
  nextRetryAt: {
    type: Date,
    default: Date.now,
    index: true
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

// Compound index for ultra-fast background worker processing
emailOutboxSchema.index({ status: 1, nextRetryAt: 1 });

const EmailOutbox = mongoose.models.EmailOutbox || mongoose.model('EmailOutbox', emailOutboxSchema);

export default EmailOutbox;
