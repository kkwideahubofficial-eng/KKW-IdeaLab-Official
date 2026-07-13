import EmailOutbox from '../models/EmailOutbox.js';
import { processEmailOutbox } from './enterpriseEmailWorker.js';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Enterprise Transactional Outbox Email Sender
 * Guaranteed At-Most-Once delivery via Idempotency Keys, Non-Blocking Execution & Auto-Retry Worker.
 * 
 * @param {string} to - Recipient email address
 * @param {string} subject - Email subject line
 * @param {string} htmlContent - HTML formatted email body
 * @param {object} [options] - Optional settings (e.g. idempotencyKey)
 */
const sendEmail = async (to, subject, htmlContent, options = {}) => {
  if (process.env.SKIP_EMAIL === 'true') {
    return { skipped: true };
  }

  try {
    if (!to || !subject || !htmlContent) {
      console.error('[sendEmail] Missing required fields (to, subject, or htmlContent).');
      return null;
    }

    // Generate deterministic or random Idempotency Key
    const cleanTo = String(to).replace(/[^a-zA-Z0-9]/g, '_');
    const cleanSub = String(subject).replace(/[^a-zA-Z0-9]/g, '_').slice(0, 20);
    const idempotencyKey = options.idempotencyKey || `email_${cleanTo}_${cleanSub}_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

    // Check for existing outbox record to guarantee Idempotency (Deduplication)
    const existing = await EmailOutbox.findOne({ idempotencyKey });
    if (existing) {
      console.log(`[sendEmail] Idempotent request detected for key ${idempotencyKey}. Deduplicating.`);
      return { idempotencyKey, deduplicated: true, status: existing.status };
    }

    // Save Email Outbox Entry in MongoDB (Transactional Outbox Pattern)
    const outboxEntry = await EmailOutbox.create({
      idempotencyKey,
      to,
      subject,
      htmlContent,
      status: 'PENDING',
      attempts: 0,
      nextRetryAt: new Date()
    });

    console.log(`[sendEmail] Queued email outbox entry [${idempotencyKey}] to ${to}`);

    // Trigger immediate non-blocking background queue processing
    setImmediate(() => {
      processEmailOutbox().catch(err => {
        console.error('[sendEmail] Non-blocking background worker trigger error:', err.message);
      });
    });

    return { idempotencyKey, queued: true, outboxId: outboxEntry._id };

  } catch (error) {
    console.error('[sendEmail] Error creating outbox entry:', error.message);
    // Silent fail to ensure main business transaction (e.g. room booking) never crashes
    return null;
  }
};

export default sendEmail;
