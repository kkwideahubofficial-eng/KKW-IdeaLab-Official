
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import User from '../src/models/User.js';
import Order from '../src/models/Order.js';
import DeliveryAssignment from '../src/models/DeliveryAssignment.js';
import Product from '../src/models/Product.js';

// Setup environment
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
    console.error("MONGO_URI is missing in .env");
    process.exit(1);
}

async function runVerification() {
    try {
        console.log("Connecting to Database...");
        await mongoose.connect(MONGO_URI);
        console.log("Connected.");

        // 1. Create/Find a Dummy Driver
        const driverEmail = "test_driver_verify@ideahub.com";
        let driver = await User.findOne({ email: driverEmail });
        
        if (!driver) {
            console.log("Creating Test Driver...");
            driver = await User.create({
                name: "Test Driver Verify",
                email: driverEmail,
                passwordHash: "dummyhash", // Not testing auth here, just flows
                role: "delivery_boy", 
                mobile: "9999999999"
            });
        }
        console.log(`Driver Ready: ${driver._id}`);

        // 2. Create a Dummy Product (needed for Order)
        let product = await Product.findOne({ title: "Test Product Verify" });
        if (!product) {
            product = await Product.create({
                title: "Test Product Verify",
                price: 100,
                description: "Test Desc",
                category: "Test",
                stock: 10,
                imageUrl: "http://example.com/image.png"
            });
        }

        // 3. Create a Dummy Order
        console.log("Creating Test Order...");
        const order = await Order.create({
            userId: driver._id, // Assigning to self just for validity (normally a customer)
            items: [{
                productId: product._id,
                name: product.title,
                price: product.price,
                quantity: 1
            }],
            shippingAddress: {
                fullName: "Test Customer",
                addressLine1: "123 Test Lane",
                city: "Test City",
                state: "Test State",
                postalCode: "123456",
                phone: "1234567890"
            },
            paymentInfo: {
                provider: 'cod',
                status: 'pending'
            },
            amounts: {
                subtotal: 100,
                total: 100
            },
            status: 'PENDING'
        });
        console.log(`Order Created: ${order._id}`);

        // 4. Simulate Admin Broadcasting Task (Driver is "Offline" - assuming no socket connection here)
        console.log("Simulating Admin Broadcast (Driver Offline)...");
        
        // This logic mimics the /create-assignment endpoint
        const assignment = new DeliveryAssignment({
            order: order._id,
            brodcastedTo: [driver._id], // Simulating the broadcast logic finding our driver
            status: 'brodcasted'
        });
        await assignment.save();

        order.assignment = assignment._id;
        order.status = 'PROCESSING';
        await order.save();
        
        console.log(`Assignment Broadcasted: ${assignment._id}`);

        // 5. Simulate Driver executing /get-assignments (Coming Online later)
        console.log("Simulating Driver coming online and fetching tasks...");
        
        // Logic mimics /get-assignments endpoint
        // NOTE: The endpoint in delivery.routes.js had commented out `brodcastedTo` check.
        // It selects based on status: 'brodcasted'.
        // Let's verify if that's sufficient or if checks are needed.
        
        const fetchedAssignments = await DeliveryAssignment.find({
            status: "brodcasted"
            // brodcastedTo: driver._id // If enabled in backend
        }).populate('order');

        const foundMyAssignment = fetchedAssignments.find(a => a._id.toString() === assignment._id.toString());

        if (foundMyAssignment) {
            console.log("SUCCESS: Driver successfully retrieved the task that was assigned while offline.");
            console.log(`Task Details: Order for ${foundMyAssignment.order.shippingAddress.fullName}`);
        } else {
            console.error("FAILURE: Driver could not find the task.");
        }

        // Cleanup
        console.log("Cleaning up...");
        await Order.findByIdAndDelete(order._id);
        await DeliveryAssignment.findByIdAndDelete(assignment._id);
        // await User.findByIdAndDelete(driver._id); // Keep driver for reuse or manual testing? Deleting for now.
        await User.findByIdAndDelete(driver._id);
        await Product.findByIdAndDelete(product._id);
        console.log("Cleanup Done.");

    } catch (e) {
        console.error("Verification Failed:", e);
    } finally {
        await mongoose.disconnect();
    }
}

runVerification();
