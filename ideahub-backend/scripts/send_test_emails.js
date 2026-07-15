import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../src/models/User.js';
import sendEmail from '../src/utils/sendEmail.js';

dotenv.config();

async function run() {
  try {
    console.log('Connecting to DB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to DB');

    const users = await User.find({});
    console.log(`Found ${users.length} users.`);

    for (const user of users) {
      if (!user.email) continue;
      
      const subject = "testing maili";
      const htmlContent = `
        <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
          <h2 style="color: #0284c7;">Hello ${user.name || 'User'},</h2>
          <p>This is a <strong>testing maili</strong> sent to verify email functionality for your account.</p>
          <p>Your registered role in the system is: <strong>${user.role || 'team'}</strong>.</p>
          <p>Best Regards,<br>Idea Lab System</p>
        </div>
      `;
      
      console.log(`Sending to ${user.email} (Role: ${user.role || 'team'})...`);
      await sendEmail(user.email, subject, htmlContent);
    }

    console.log('All test emails sent!');
    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
}

run();
