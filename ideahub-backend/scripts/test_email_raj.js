import dotenv from 'dotenv';
import sendEmail from '../src/utils/sendEmail.js';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

async function run() {
  const studentEmail = 'rbsankpal370124@kkwagh.edu.in';
  const subject = `AICTE IDEA Lab: Registration Approved - HAND'S ON ELECTRICAL VEHICLE`;
  
  const htmlContent = `
    <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
      <h2 style="color: #10b981;">Registration Approved! 🎉</h2>
      <p>Dear Raj Sankpal,</p>
      <p>Congratulations! Your registration for the event <strong>"HAND'S ON ELECTRICAL VEHICLE"</strong> has been approved.</p>
      
      <h3 style="margin-top: 20px;">Event Details:</h3>
      <ul style="line-height: 1.6; padding-left: 20px;">
        <li><strong>Event:</strong> HAND'S ON ELECTRICAL VEHICLE</li>
        <li><strong>Date:</strong> 16/7/2026</li>
        <li><strong>Time:</strong> 10:00 AM - 05:00 PM</li>
        <li><strong>Venue:</strong> IDEA Lab</li>
      </ul>
      
      <p style="margin-top: 20px;">Please ensure you arrive on time. If you have any questions, you can contact the coordinator: the organizing team.</p>
      
      <br/>
      <p>Best regards,<br/><strong>AICTE IDEA Lab Team</strong></p>
    </div>
  `;

  console.log('Sending email to Raj (rbsankpal370124@kkwagh.edu.in)...');
  await sendEmail(studentEmail, subject, htmlContent);
  console.log('Done!');
}

run();
