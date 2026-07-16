import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const userSchema = new mongoose.Schema({}, { strict: false });
const User = mongoose.model('User', userSchema, 'users');

async function getEmails() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const users = await User.find({}, 'email');
    const emails = users.map(u => u.email).filter(Boolean);
    console.log(JSON.stringify(emails, null, 2));
    process.exit(0);
  } catch (error) {
    console.error('Error fetching emails:', error);
    process.exit(1);
  }
}

getEmails();
