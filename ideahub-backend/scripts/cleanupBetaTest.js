import mongoose from 'mongoose';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Import all models to clean up
import Booking from '../src/models/Booking.js';
import RoomPermissionRequest from '../src/models/RoomPermissionRequest.js';
import MachineryRequest from '../src/models/MachineryRequest.js';
import DeliveryAssignment from '../src/models/DeliveryAssignment.js';
import Order from '../src/models/Order.js';
import Cart from '../src/models/Cart.js';
import EventRegistration from '../src/models/EventRegistration.js';
import EventNotification from '../src/models/EventNotification.js';
import PushSubscription from '../src/models/PushSubscription.js';

// Fix for __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const cleanDatabase = async () => {
  try {
    console.log('Connecting to database...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB successfully!');

    // 1. Delete Room Bookings
    console.log('\nCleaning Room Bookings...');
    const bookingRes = await Booking.deleteMany({});
    console.log(`Deleted ${bookingRes.deletedCount} Room Bookings.`);

    // 2. Delete Room Permission Requests
    console.log('Cleaning Room Permission Requests...');
    const roomPermRes = await RoomPermissionRequest.deleteMany({});
    console.log(`Deleted ${roomPermRes.deletedCount} Room Permission Requests.`);

    // 3. Delete Machinery Requests
    console.log('Cleaning Machinery Requests...');
    const machReqRes = await MachineryRequest.deleteMany({});
    console.log(`Deleted ${machReqRes.deletedCount} Machinery Requests.`);

    // 4. Delete Delivery Assignments
    console.log('Cleaning Delivery Assignments...');
    const delAssRes = await DeliveryAssignment.deleteMany({});
    console.log(`Deleted ${delAssRes.deletedCount} Delivery Assignments.`);

    // 5. Delete Orders
    console.log('Cleaning Orders...');
    const orderRes = await Order.deleteMany({});
    console.log(`Deleted ${orderRes.deletedCount} Orders.`);

    // 6. Delete Carts
    console.log('Cleaning Carts...');
    const cartRes = await Cart.deleteMany({});
    console.log(`Deleted ${cartRes.deletedCount} Carts.`);

    // 7. Delete Event Registrations
    console.log('Cleaning Event Registrations...');
    const eventRegRes = await EventRegistration.deleteMany({});
    console.log(`Deleted ${eventRegRes.deletedCount} Event Registrations.`);

    // 8. Delete Event Notifications
    console.log('Cleaning Event Notifications...');
    const eventNotifRes = await EventNotification.deleteMany({});
    console.log(`Deleted ${eventNotifRes.deletedCount} Event Notifications.`);

    // 9. Delete Push Subscriptions
    console.log('Cleaning Push Subscriptions...');
    const pushSubRes = await PushSubscription.deleteMany({});
    console.log(`Deleted ${pushSubRes.deletedCount} Push Subscriptions.`);

    console.log('\nDatabase cleanup finished!');
  } catch (error) {
    console.error('Error cleaning database:', error);
  }
};

const cleanUploadsFolder = () => {
  try {
    console.log('\nCleaning local uploads folder...');
    const uploadsPath = path.join(__dirname, '../uploads');
    const pdfsPath = path.join(uploadsPath, 'pdfs');

    // Clean files in uploads directory
    if (fs.existsSync(uploadsPath)) {
      const files = fs.readdirSync(uploadsPath);
      let deletedFilesCount = 0;
      files.forEach((file) => {
        const filePath = path.join(uploadsPath, file);
        const stats = fs.statSync(filePath);
        if (stats.isFile()) {
          // Do not delete system files (like .gitkeep if any)
          if (file !== '.gitkeep') {
            fs.unlinkSync(filePath);
            deletedFilesCount++;
          }
        }
      });
      console.log(`Deleted ${deletedFilesCount} files from uploads directory.`);
    }

    // Clean files in uploads/pdfs directory
    if (fs.existsSync(pdfsPath)) {
      const files = fs.readdirSync(pdfsPath);
      let deletedPdfsCount = 0;
      files.forEach((file) => {
        const filePath = path.join(pdfsPath, file);
        const stats = fs.statSync(filePath);
        if (stats.isFile()) {
          if (file !== '.gitkeep') {
            fs.unlinkSync(filePath);
            deletedPdfsCount++;
          }
        }
      });
      console.log(`Deleted ${deletedPdfsCount} files from uploads/pdfs directory.`);
    }
  } catch (error) {
    console.error('Error cleaning uploads folders:', error);
  }
};

const run = async () => {
  await cleanDatabase();
  cleanUploadsFolder();
  process.exit(0);
};

run();
