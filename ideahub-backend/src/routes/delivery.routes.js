import express from 'express';
import mongoose from 'mongoose';
import DeliveryAssignment from '../models/DeliveryAssignment.js';
import Order from '../models/Order.js';
import User from '../models/User.js';

const router = express.Router();

// Middleware to mock auth or extract ID from headers (for migration compatibility)
// ideally, use real authentication middleware here
const getUserId = (req) => {
    // Check for x-driver-id header first (migration support)
    const headerId = req.headers['x-driver-id'];
    if (headerId && mongoose.isValidObjectId(headerId)) return headerId;
    
    // Check for req.user if auth middleware is present
    if (req.user && req.user._id) return req.user._id;
    
    return null;
};

// GET /assignments - Get available assignments for the driver
router.get('/get-assignments', async (req, res) => {
    try {
        const userId = getUserId(req);
        if (!userId) {
            return res.status(401).json({ message: "Unauthorized: Missing Driver ID" });
        }

        const assignments = await DeliveryAssignment.find({
            // brodcastedTo: userId,  <-- Removed to allow open pool
            status: "brodcasted"
        }).populate({
            path: 'order',
            populate: { path: 'items.productId', model: 'Product' } // Use Product instead of Grocery
        });

        res.status(200).json(assignments);
    } catch (error) {
        console.error("Error in GET /assignments:", error);
        res.status(500).json({ message: error.message });
    }
});

// GET /current-order - Get active order for the driver
router.get('/current-order', async (req, res) => {
    try {
        const userId = getUserId(req);
        if (!userId) {
            return res.status(401).json({ message: "Unauthorized: Missing Driver ID" });
        }

        const activeAssignment = await DeliveryAssignment.findOne({
            assignedTo: userId,
            status: "assigned"
        }).populate({
            path: 'order',
            populate: { path: 'items.productId', model: 'Product' }
        });

        if (!activeAssignment) {
            return res.status(200).json({ active: false });
        }

        res.status(200).json({ active: true, assignment: activeAssignment });
    } catch (error) {
        console.error("Error in GET /current-order:", error);
        res.status(500).json({ message: error.message });
    }
});

// POST /assignment/:id/accept-assignment
router.post('/assignment/:id/accept-assignment', async (req, res) => {
    try {
        const userId = getUserId(req);
        const { id } = req.params;

        if (!userId) return res.status(401).json({ message: "Unauthorized" });

        const assignment = await DeliveryAssignment.findOne({
             _id: id, 
             // brodcastedTo: userId, <-- Removed to allow open pool acceptance
             status: "brodcasted" 
        });

        if (!assignment) {
            return res.status(404).json({ message: "Assignment not found or expired" });
        }

        // Update Assignment
        assignment.assignedTo = userId;
        assignment.status = "assigned";
        assignment.acceptedAt = new Date();
        await assignment.save();

        // Update Order
        await Order.findByIdAndUpdate(assignment.order, {
            assignedDeliveryBoy: userId,
            assignment: assignment._id,
            status: "OUT_OF_DELIVERY"  // Using OUT_OF_DELIVERY as closest map to 'processing'/'out of delivery'
        });

        // TODO: Emit socket event here
        
        res.status(200).json({ message: "Assignment accepted", assignment });
    } catch (error) {
        console.error("Error accepting assignment:", error);
        res.status(500).json({ message: error.message });
    }
});

// POST /assignment/:id/complete-assignment
router.post('/assignment/:id/complete-assignment', async (req, res) => {
    try {
        const userId = getUserId(req);
        const { id } = req.params;
        const { otp } = req.body;

        if (!userId) return res.status(401).json({ message: "Unauthorized" });

        const assignment = await DeliveryAssignment.findOne({
            _id: id,
            assignedTo: userId,
            status: "assigned"
        }).populate('order');

        if (!assignment) {
            return res.status(404).json({ message: "Active assignment not found" });
        }

        // Verify OTP (if order has one)
        // const order = assignment.order;
        // if (order.deliveryOtp && order.deliveryOtp !== otp) {
        //     return res.status(400).json({ message: "Invalid OTP" });
        // }

        assignment.status = "completed";
        assignment.completedAt = new Date();
        await assignment.save();

        await Order.findByIdAndUpdate(assignment.order._id, {
            status: "DELIVERED",
            deliveredAt: new Date(),
            deliveryOtpVerification: true
        });

        res.status(200).json({ message: "Delivery completed" });
    } catch (error) {
        console.error("Error completing assignment:", error);
        res.status(500).json({ message: error.message });
    }
});

// POST /create-assignment (Admin/Coordinator triggers this)
router.post('/create-assignment', async (req, res) => {
    try {
        const { orderId } = req.body;
        
        // Find the order
        const order = await Order.findById(orderId);
        if (!order) return res.status(404).json({ message: "Order not found" });

        // Check if already assigned
        if (order.assignment) {
             return res.status(400).json({ message: "Order already has an active assignment" });
        }

        // Find all Delivery Boys
        // Assuming role is 'delivery_boy'. If 'role' field varies, adjust.
        const drivers = await User.find({ role: 'delivery_boy' });
        const driverIds = drivers.map(d => d._id);

        if (driverIds.length === 0) {
            console.log("Warning: No delivery partners found immediately. Task will be in open pool.");
            // return res.status(400).json({ message: "No delivery partners found to broadcast to." });
        }

        // Create Assignment
        const assignment = new DeliveryAssignment({
            order: orderId,
            brodcastedTo: driverIds,
            status: 'brodcasted'
        });
        await assignment.save();

        // Link to Order
        order.assignment = assignment._id;
        order.status = 'PROCESSING'; // Ensure status is processing
        await order.save();

        res.status(201).json({ message: "Broadcasted to drivers", count: driverIds.length });

        // Emit socket event to all broadcasted drivers
        const io = req.app.get('io');
        if (io) {
            // Populate order details for the socket payload
            await order.populate('shippingAddress'); // Ensure address is available
            
            const taskPayload = {
                assignmentId: assignment._id,
                orderId: order._id,
                customerName: order.shippingAddress?.fullName || "Customer",
                address: [
                    order.shippingAddress?.addressLine1,
                    order.shippingAddress?.city,
                    order.shippingAddress?.postalCode
                ].filter(Boolean).join(", ") || "Unknown Address",
                status: 'PENDING',
                location: {
                    lat: order.shippingAddress?.latitude || 0,
                    lng: order.shippingAddress?.longitude || 0
                }
            };

            driverIds.forEach(driverId => {
                // Determine the socket room or emit globally if generic rooms aren't used
                // The dashboard joins "identity" room? No, it uses `emit("identity", userId)`
                // The server.js should handle joining `driver-{userId}` room.
                io.to(`driver-${driverId}`).emit('new-delivery-task', taskPayload);
            });
            console.log(`Emitted new-delivery-task to ${driverIds.length} drivers`);
        }
    } catch (error) {
        console.error("Error creating assignment:", error);
        res.status(500).json({ message: error.message });
    }
});

export default router;
