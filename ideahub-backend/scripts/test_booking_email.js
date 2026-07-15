
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { createBooking, decideBooking } from '../src/controllers/bookingController.js';
import User from '../src/models/User.js';
import Room from '../src/models/Room.js';
import Booking from '../src/models/Booking.js';

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

const mockReq = (body = {}, user = {}, params = {}) => ({
    body,
    user,
    params,
    validationResult: () => ({ isEmpty: () => true }) // Mock express-validator
});

// We need to mock validationResult import if sticking to pure node script, 
// but since controller uses `import { validationResult } from 'express-validator'`, 
// we can't easily mock it without a test runner or module mocking.
// So we might encounter an error if we run this directly. 
// A workaround is to modify the controller to accept injected dependencies or use a library like `proxyquire` equivalent for ES modules.
// OR, we can just assume `req` has the necessary structure.
// Wait, `validationResult(req)` is called in the controller.
// We can't mock imports easily in ES modules in this simple script setup.
// However, `express-validator`'s `validationResult` looks at `req`. 
// If we just don't pass anything that triggers validation error, maybe it works?
// Actually `validationResult` expects the `req` object to have been processed by validation middleware.
// If we bypass validation middleware, `validationResult(req)` might return empty errors OR throw error.
// Let's see. If it fails, I'll just write a script that bypasses the controller and calls the logic directly (bad practice but fast).
// OR better: I can modify the controller to be more testable, OR I can just run the logic block I care about.

// Actually, `validationResult(req)` returns a Result object.
// If I can't mock it, the test will fail. 
// Let's try to run and see.

const runTest = async () => {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected.');

    // 1. Create User
    const email = process.env.EMAIL_USER;
    let user = await User.findOne({ email });
    if (!user) {
        user = await User.create({
            name: 'Test Team',
            email,
            passwordHash: 'dummy',
            role: 'team',
            teamName: 'Test Squad'
        });
    }

    // 2. Create Room
    let room = await Room.findOne({ name: 'Test Room' });
    if (!room) {
        room = await Room.create({
            name: 'Test Room',
            capacity: 10,
            features: ['AC', 'Projector'],
            isActive: true
        });
    }

    // 3. Create Booking (bypass controller createBooking to avoid validation mock issues if possible, or try controller)
    // Let's try creating directly via Model to save time and avoid middleware complexity
    const slotDate = new Date().toISOString().split('T')[0];
    const booking = await Booking.create({
        team: user._id,
        room: room._id,
        teamSize: 5,
        slotDate: slotDate,
        startTime: '14:00',
        endTime: '16:00',
        purpose: 'Testing Email',
        status: 'pending'
    });
    console.log('Booking created:', booking._id);

    // 4. Decide Booking (Approve)
    console.log('Approving booking using REAL controller...');

    const reqDecide = {
        params: { id: booking._id },
        body: { decision: 'approved', reason: 'Test Approval Real Controller' },
        user: { _id: user._id, role: 'head' } // Mocking as head/coordinator
    };
    
    // Attempt to mock validationResult if possible, or hope it returns empty
    // Since we can't easily mock the import, we'll try running it. 
    // If validationResult(req) crashes or returns errors because of missing middleware, we'll see.
    // Express-validator usually attaches state to req.
    
    const resDecide = mockRes();
    
    try {
        await decideBooking(reqDecide, resDecide);
        
        if (resDecide.statusCode === 200) {
            console.log('Booking decided successfully.');
            console.log('Response:', JSON.stringify(resDecide.data, null, 2));
            console.log('Check logs above for SendEmail output.');
        } else {
            console.error('Failed to decide booking:', resDecide.statusCode, resDecide.data);
            if (resDecide.data && resDecide.data.errors) {
                console.error('Validation Errors:', JSON.stringify(resDecide.data.errors, null, 2));
            }
        }
    } catch (err) {
        console.error('Controller crashed:', err);
    }

  } catch (error) {
    console.error('Test failed:', error);
  } finally {
    await mongoose.disconnect();
  }
};

runTest();
