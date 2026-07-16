import dotenv from 'dotenv';
import { connectToDatabase } from './src/config/db.js';
import Room from './src/models/Room.js';
import Booking from './src/models/Booking.js';

dotenv.config();

async function verifyData() {
  try {
    console.log('Connecting to MongoDB...');
    await connectToDatabase(process.env.MONGO_URI);
    console.log('Connected!');

    console.log('\n--- VERIFYING ROOMS & SLOTS ---');
    const rooms = await Room.find({});
    console.log(`Found ${rooms.length} rooms.`);
    rooms.forEach(r => {
        console.log(`\nRoom: ${r.name} (ID: ${r._id})`);
        console.log(`  Capacity: ${r.capacity}`);
        console.log(`  Time Slots (${r.timeSlots.length}):`);
        if (r.timeSlots.length === 0) console.log('    (No slots configured)');
        r.timeSlots.forEach(ts => {
            console.log(`    [${ts.startTime} - ${ts.endTime}] Label: ${ts.label || 'N/A'}`);
        });
    });

    console.log('\n--- VERIFYING BOOKINGS ---');
    const bookings = await Booking.find({}).sort({ createdAt: -1 }).limit(10); // Show last 10
    console.log(`Showing last ${bookings.length} bookings (newest first):`);
    bookings.forEach(b => {
        console.log(`\nBooking: ${b.teamName}`);
        console.log(`  Room: ${b.room}`);
        console.log(`  Date: ${b.slotDate}`);
        console.log(`  Time: ${b.startTime} - ${b.endTime}`);
        console.log(`  Status: ${b.status}`);
        console.log(`  Team Size: ${b.teamSize}`);
    });

    process.exit(0);
  } catch (error) {
    console.error('Error verifying data:', error);
    process.exit(1);
  }
}

verifyData();
