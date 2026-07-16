
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Order from './src/models/Order.js';
import DeliveryAssignment from './src/models/DeliveryAssignment.js';

dotenv.config();

const run = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to DB");

        // Reset all orders to processing and remove assignment links
        const res = await Order.updateMany(
            {}, 
            { 
                $unset: { assignment: 1, assignedDeliveryBoy: 1 },
                $set: { status: 'PROCESSING' }
            }
        );
        console.log(`Updated ${res.modifiedCount} orders.`);

        // clear assignments
        const del = await DeliveryAssignment.deleteMany({});
        console.log(`Deleted ${del.deletedCount} assignments.`);

        process.exit(0);
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
};

run();
