import EmailQueue from '../models/EmailQueue.js';
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

/**
 * Process pending and failed emails from the MongoDB EmailQueue
 */
export async function processEmailQueue() {
  if (process.env.SKIP_EMAIL === 'true') {
    return;
  }

  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.warn('Email Queue Worker: Skipping process. EMAIL_USER or EMAIL_PASS missing.');
    return;
  }

  try {
    // Find emails needing delivery (PENDING or FAILED with attempts < 5)
    const pendingEmails = await EmailQueue.find({
      status: { $in: ['PENDING', 'FAILED'] },
      attempts: { $lt: 5 }
    }).sort({ createdAt: 1 }).limit(10);

    if (!pendingEmails || pendingEmails.length === 0) {
      return;
    }

    console.log(`[Email Queue Worker] Processing ${pendingEmails.length} queued email(s)...`);

    for (const emailDoc of pendingEmails) {
      try {
        emailDoc.attempts += 1;

        const info = await transporter.sendMail({
          from: `"Idea Lab" <${process.env.EMAIL_USER}>`,
          to: emailDoc.to,
          subject: emailDoc.subject,
          html: emailDoc.htmlContent,
        });

        console.log(`[Email Queue Worker] Successfully sent email (${emailDoc._id}) to ${emailDoc.to}. MessageId: ${info.messageId}`);
        
        // Remove successfully sent email from database to keep MongoDB clean
        await EmailQueue.findByIdAndDelete(emailDoc._id);

      } catch (err) {
        console.error(`[Email Queue Worker] Failed sending email (${emailDoc._id}) to ${emailDoc.to} (Attempt ${emailDoc.attempts}/5):`, err.message);
        
        emailDoc.status = 'FAILED';
        emailDoc.lastError = err.message || 'SMTP Transmission Error';
        await emailDoc.save();
      }
    }
  } catch (error) {
    console.error('[Email Queue Worker] Error during queue processing cycle:', error.message);
  }
}

let workerInterval = null;

/**
 * Starts the automatic background retry worker interval
 */
export function startEmailWorker(intervalMs = 30000) {
  if (process.env.SKIP_EMAIL === 'true') {
    console.log('[Email Queue Worker] Disabled via SKIP_EMAIL environment flag.');
    return;
  }

  console.log(`[Email Queue Worker] Auto-retry background service started (Checking every ${intervalMs / 1000}s).`);
  
  // Initial run
  processEmailQueue();

  // Periodic background execution
  if (!workerInterval) {
    workerInterval = setInterval(() => {
      processEmailQueue();
    }, intervalMs);
  }
}

export function stopEmailWorker() {
  if (workerInterval) {
    clearInterval(workerInterval);
    workerInterval = null;
    console.log('[Email Queue Worker] Auto-retry background service stopped.');
  }
}

export default transporter;
