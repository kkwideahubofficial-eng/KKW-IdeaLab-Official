import EmailOutbox from '../models/EmailOutbox.js';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

// Create Nodemailer transporter once with connection pooling & DNS workaround
const transporter = nodemailer.createTransport({
  host: '142.250.115.108', // Hardcoded IP for smtp.gmail.com to bypass Windows/c-ares DNS timeout issues
  port: 465, // Secure SSL port
  secure: true, 
  pool: true, // Use pooled connections for fast execution
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  connectionTimeout: 15000, 
  socketTimeout: 15000, 
  tls: {
    servername: 'smtp.gmail.com',
    rejectUnauthorized: false
  }
});

// Circuit Breaker State Machine
const CircuitBreaker = {
  state: 'CLOSED', // 'CLOSED' | 'OPEN' | 'HALF_OPEN'
  consecutiveFailures: 0,
  failureThreshold: 5,
  cooldownMs: 60000, // 60 seconds cooldown when OPEN
  lastStateChange: Date.now(),

  recordSuccess() {
    this.consecutiveFailures = 0;
    if (this.state !== 'CLOSED') {
      console.log('[Circuit Breaker] SMTP Service recovered. Circuit state changed to CLOSED.');
      this.state = 'CLOSED';
    }
  },

  recordFailure() {
    this.consecutiveFailures += 1;
    if (this.consecutiveFailures >= this.failureThreshold && this.state !== 'OPEN') {
      this.state = 'OPEN';
      this.lastStateChange = Date.now();
      console.warn(`[Circuit Breaker] ${this.failureThreshold} consecutive SMTP failures detected. Circuit state tripped to OPEN for ${this.cooldownMs / 1000}s.`);
    }
  },

  canAttempt() {
    if (this.state === 'CLOSED') return true;
    if (this.state === 'OPEN') {
      if (Date.now() - this.lastStateChange > this.cooldownMs) {
        this.state = 'HALF_OPEN';
        console.log('[Circuit Breaker] Cooldown elapsed. Testing SMTP connection in HALF_OPEN state.');
        return true;
      }
      return false;
    }
    return true; // HALF_OPEN
  }
};

/**
 * Calculates exponential backoff retry delay with jitter
 * Attempt 1: ~3s, Attempt 2: ~9s, Attempt 3: ~27s, Attempt 4: ~81s, Attempt 5: ~243s
 */
function calculateNextRetryDelayMs(attempts) {
  const baseSeconds = 3;
  const exponentialSeconds = baseSeconds * Math.pow(3, Math.max(0, attempts - 1));
  const jitterMs = Math.floor(Math.random() * 2000); // 0-2 seconds random jitter
  return (exponentialSeconds * 1000) + jitterMs;
}

/**
 * Process pending and failed emails from the MongoDB EmailOutbox
 */
export async function processEmailOutbox() {
  if (process.env.SKIP_EMAIL === 'true') {
    return;
  }

  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    return;
  }

  if (!CircuitBreaker.canAttempt()) {
    console.warn('[Enterprise Email Worker] Skipping queue run: Circuit Breaker is OPEN due to SMTP outage.');
    return;
  }

  try {
    const now = new Date();
    // Query pending/failed emails scheduled for now or earlier
    const pendingOutboxEntries = await EmailOutbox.find({
      status: { $in: ['PENDING', 'FAILED'] },
      nextRetryAt: { $lte: now },
      attempts: { $lt: 5 }
    }).sort({ createdAt: 1 }).limit(10);

    if (!pendingOutboxEntries || pendingOutboxEntries.length === 0) {
      return;
    }

    console.log(`[Enterprise Email Worker] Processing ${pendingOutboxEntries.length} outbox email(s)...`);

    for (const entry of pendingOutboxEntries) {
      // Atomic state transition to prevent worker collision
      const lockedEntry = await EmailOutbox.findOneAndUpdate(
        { _id: entry._id, status: entry.status },
        { status: 'PROCESSING', $inc: { attempts: 1 } },
        { new: true }
      );

      if (!lockedEntry) continue; // Concurrently claimed by another process

      try {
        const info = await transporter.sendMail({
          from: `"Idea Lab" <${process.env.EMAIL_USER}>`,
          to: lockedEntry.to,
          subject: lockedEntry.subject,
          html: lockedEntry.htmlContent,
        });

        console.log(`[Enterprise Email Worker] Successfully sent email [Idempotency: ${lockedEntry.idempotencyKey}] to ${lockedEntry.to}. MessageId: ${info.messageId}`);
        
        CircuitBreaker.recordSuccess();

        // Remove sent entry from DB to keep collection lightweight and clean
        await EmailOutbox.findByIdAndDelete(lockedEntry._id);

      } catch (err) {
        console.error(`[Enterprise Email Worker] Failed sending email (${lockedEntry.idempotencyKey}) to ${lockedEntry.to} (Attempt ${lockedEntry.attempts}/5):`, err.message);
        
        CircuitBreaker.recordFailure();

        const errorMsg = err.message || 'SMTP Transmission Error';

        if (lockedEntry.attempts >= lockedEntry.maxAttempts) {
          // Permanently failed after max attempts -> Move to Dead Letter Queue (DLQ)
          console.error(`[Dead Letter Queue] Email [Idempotency: ${lockedEntry.idempotencyKey}] moved to DLQ after ${lockedEntry.attempts} failed attempts.`);
          await EmailOutbox.findByIdAndUpdate(lockedEntry._id, {
            status: 'DLQ',
            lastError: errorMsg
          });
        } else {
          // Schedule next retry with exponential backoff
          const delayMs = calculateNextRetryDelayMs(lockedEntry.attempts);
          const nextRetryAt = new Date(Date.now() + delayMs);
          
          console.log(`[Enterprise Email Worker] Rescheduling retry for ${lockedEntry.idempotencyKey} in ${Math.round(delayMs / 1000)}s at ${nextRetryAt.toISOString()}`);
          
          await EmailOutbox.findByIdAndUpdate(lockedEntry._id, {
            status: 'FAILED',
            nextRetryAt,
            lastError: errorMsg
          });
        }
      }
    }
  } catch (error) {
    console.error('[Enterprise Email Worker] Error during outbox processing cycle:', error.message);
  }
}

let workerInterval = null;

/**
 * Starts the automatic background enterprise retry worker
 */
export function startEnterpriseEmailWorker(intervalMs = 15000) {
  if (process.env.SKIP_EMAIL === 'true') {
    console.log('[Enterprise Email Worker] Worker disabled via SKIP_EMAIL flag.');
    return;
  }

  console.log(`[Enterprise Email Worker] Auto-retry enterprise service started (Poll interval: ${intervalMs / 1000}s).`);
  
  // Initial run
  processEmailOutbox();

  // Periodic background worker
  if (!workerInterval) {
    workerInterval = setInterval(() => {
      processEmailOutbox();
    }, intervalMs);
  }
}

export function stopEnterpriseEmailWorker() {
  if (workerInterval) {
    clearInterval(workerInterval);
    workerInterval = null;
    console.log('[Enterprise Email Worker] Stopped.');
  }
}

export default transporter;
