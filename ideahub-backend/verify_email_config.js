import dotenv from 'dotenv';
import nodemailer from 'nodemailer';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env from current directory
dotenv.config();

async function verifyEmail() {
    console.log('--- Verifying Email Configuration ---');
    
    const user = process.env.EMAIL_USER;
    const pass = process.env.EMAIL_PASS;

    console.log('EMAIL_USER:', user ? user : 'MISSING');
    console.log('EMAIL_PASS:', pass ? 'PRESENT' : 'MISSING');

    if (!user || !pass) {
        console.error('Missing credentials. Cannot proceed.');
        return;
    }

    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: user,
            pass: pass,
        },
    });

    try {
        console.log('Verifying transporter connection...');
        await transporter.verify();
        console.log('Transporter verification SUCCESS!');

        console.log('Attempting to send test email to self...');
        const info = await transporter.sendMail({
            from: `"Test Script" <${user}>`,
            to: user, // Send to self
            subject: 'Test Email from Verification Script',
            text: 'If you see this, email sending is working correctly.',
            html: '<b>If you see this, email sending is working correctly.</b>'
        });

        console.log('Email sent successfully!');
        console.log('Message ID:', info.messageId);
    } catch (error) {
        console.error('Email verification FAILED:', error);
    }
}

verifyEmail();
