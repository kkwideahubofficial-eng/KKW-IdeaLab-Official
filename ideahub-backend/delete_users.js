import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const userSchema = new mongoose.Schema({}, { strict: false });
const User = mongoose.model('User', userSchema, 'users');

const emailsToDelete = [
  "teammember@gmail.com",
  "kalpeshbire2006@gmail.com",
  "student@test.com",
  "roshangaikwad1902@gmail.com",
  "roshangaikwad2006@gmail.com",
  "rnmunje@kkwagh.edu.in",
  "birekalpesh@gmail.com"
];

async function deleteUsers() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const result = await User.deleteMany({ email: { $in: emailsToDelete } });
    console.log(`Successfully deleted ${result.deletedCount} users.`);
    process.exit(0);
  } catch (error) {
    console.error('Error deleting users:', error);
    process.exit(1);
  }
}

deleteUsers();
