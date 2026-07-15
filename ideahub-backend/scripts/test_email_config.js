// import nodemailer from 'nodemailer'; // Unused
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load .env from backend root
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.resolve(__dirname, '../.env');

dotenv.config({ path: envPath });

console.log('--- Email Configuration Test ---');
console.log('Loading .env from:', envPath);
console.log('EMAIL_USER:', process.env.EMAIL_USER || '(Missing)');
console.log('EMAIL_PASS:', process.env.EMAIL_PASS ? '(Present)' : '(Missing)');

if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
  console.error('❌ ERROR: EMAIL_USER or EMAIL_PASS is missing in .env file.');
  process.exit(1);
}

import sendEmail from '../src/utils/sendEmail.js';

const testEmail = async () => {
  try {
    console.log('Attempting to send test email to yourself via sendEmail utility...');
    // sendEmail(to, subject, htmlContent)
    const info = await sendEmail(
      process.env.EMAIL_USER, 
      'Idea Lab: Test Email (New Config)', 
      '<h3>If you receive this, your new SMTP configuration is correct!</h3><p>Sent via port 587.</p>'
    );
    
    if (info) {
        console.log('✅ Success! Message sent:', info.messageId);
    } else {
        console.log('❌ Failed: sendEmail returned null.');
    }
  } catch (error) {
    console.error('❌ Authentication Failed:', error.message);
  }
};

testEmail();
