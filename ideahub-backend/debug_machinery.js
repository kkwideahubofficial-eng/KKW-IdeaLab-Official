
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { connectToDatabase } from './src/config/db.js';
import MachineryRequest from './src/models/MachineryRequest.js';
import Machinery from './src/models/Machinery.js';
import User from './src/models/User.js';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/ideahub'; // Fallback if env not loaded

async function debug() {
  try {
    console.log('Connecting to DB...');
    await mongoose.connect(MONGO_URI);
    console.log('Connected.');

    console.log('Checking Models...');
    console.log('Machinery Model:', mongoose.modelNames().includes('Machinery'));
    console.log('User Model:', mongoose.modelNames().includes('User'));
    console.log('MachineryRequest Model:', mongoose.modelNames().includes('MachineryRequest'));

    console.log('Attempting Query...');
    const requests = await MachineryRequest.find({})
      .populate('machineryId', 'name imageUrl')
      .populate('studentId', 'name email mobile branch year')
      .limit(5);

    console.log('Query Successful!');
    console.log('Found requests:', requests.length);
    if (requests.length > 0) {
        console.log('Sample:', JSON.stringify(requests[0], null, 2));
    }

  } catch (error) {
    console.error('DEBUG ERROR:', error);
  } finally {
    await mongoose.disconnect();
    process.exit();
  }
}

debug();
