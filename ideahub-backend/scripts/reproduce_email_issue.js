
import sendEmail from '../src/utils/sendEmail.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from parent directory
dotenv.config({ path: path.join(__dirname, '../.env') });

const testEmail = async () => {
    console.log('Testing email sending...');
    try {
        const to = process.env.EMAIL_USER; // Send to self
        const subject = 'Test Email from Reproduction Script';
        const htmlContent = '<h1>This is a test email</h1><p>If you see this, email sending is working.</p>';

        const result = await sendEmail(to, subject, htmlContent);

        if (result) {
            console.log('Email sent successfully:', result);
        } else {
            console.error('Email sending failed (returned null).');
        }
    } catch (error) {
        console.error('Error during test:', error);
    }
};

testEmail();
