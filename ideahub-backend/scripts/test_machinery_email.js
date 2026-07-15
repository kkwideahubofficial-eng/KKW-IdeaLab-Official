
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequest, updateRequestStatus } from '../src/controllers/machineryRequestController.js';
import User from '../src/models/User.js';
import Machinery from '../src/models/Machinery.js';
import MachineryRequest from '../src/models/MachineryRequest.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const mockRes = () => {
  const res = {};
  res.status = (code) => {
    res.statusCode = code;
    return res;
  };
  res.json = (data) => {
    res.data = data;
    return res;
  };
  return res;
};

const runTest = async () => {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected.');

    // 1. Create a dummy user (Student)
    const email = process.env.EMAIL_USER; // Use own email for testing
    let user = await User.findOne({ email });
    if (!user) {
        console.log('Creating dummy web user...');
        user = await User.create({
            name: 'Test Student',
            email,
            passwordHash: 'dummy',
            role: 'team',
            mobile: '1234567890'
        });
    }

    // 2. Create a dummy machinery
    let machinery = await Machinery.findOne({ name: 'Test Machine' });
    if (!machinery) {
        console.log('Creating dummy machinery...');
        machinery = await Machinery.create({
            name: 'Test Machine',
            description: 'For testing',
            imageUrl: 'http://example.com/image.jpg',
            totalQuantity: 5,
            createdBy: user._id
        });
    }

    // 3. Create a request
    console.log('Creating machinery request...');
    const reqCreate = {
        user: user,
        body: {
            machineryId: machinery._id,
            projectName: 'Test Project',
            projectCategory: 'Academic Project',
            projectDescription: 'This is a test description.',
            projectObjectives: 'This is a test objective.',
            expectedOutcome: 'This is a test expected outcome.',
            teamMembers: [{ name: 'Test Member', branch: 'IT', year: 'BE' }],
            usageDate: new Date(),
            startTime: '10:00',
            endTime: '12:00',
            purpose: 'Testing email flow',
            consentAgreed: true,
            groupPhotoUrl: 'http://example.com/photo.jpg'
        }
    };
    const resCreate = mockRes();
    await createRequest(reqCreate, resCreate);
    
    if (resCreate.statusCode !== 201) {
        console.error('Failed to create request:', resCreate.data);
        return;
    }
    const requestId = resCreate.data._id;
    console.log('Request created:', requestId);

    // 4. Approve the request
    console.log('Approving request...');
    const reqUpdate = {
        params: { id: requestId },
        body: { status: 'Approved' },
        user: { _id: user._id } // Mocking admin user as same user for simplicity
    };
    const resUpdate = mockRes();
    
    // Check if updateRequestStatus actually triggers email
    await updateRequestStatus(reqUpdate, resUpdate);

    if (resUpdate.statusCode === 200) {
        console.log('Request approved successfully.');
        console.log('Response Data:', JSON.stringify(resUpdate.data, null, 2));
        console.log('CHECK YOUR EMAIL NOW!');
    } else {
        console.error('Failed to approve request:', resUpdate.data);
    }

  } catch (error) {
    console.error('Test failed:', error);
  } finally {
    await mongoose.disconnect();
  }
};

runTest();
