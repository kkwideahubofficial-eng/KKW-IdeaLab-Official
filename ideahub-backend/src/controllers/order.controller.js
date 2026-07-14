import Order from '../models/Order.js';
import axios from 'axios';

// 1. Initiate Checkout - Create PENDING Order
export const initiateCheckout = async (req, res) => {
  try {
    const { items, shippingAddress, amounts, method } = req.body;

    // In a real app, verify prices and stock here before creating

    const newOrder = new Order({
      userId: req.user._id,
      items,
      shippingAddress,
      method: method || 'DELIVERY',
      paymentInfo: {
          provider: 'razorpay',
          status: 'pending'
      },
      amounts,
      status: 'PENDING'
    });

    const savedOrder = await newOrder.save();

    // Mock Razorpay Order ID generation
    const mockRazorpayOrderId = `order_${new Date().getTime()}`;
    
    // Save the provider ID if needed, or just return it for the frontend SDK
    savedOrder.paymentInfo.razorpayOrderId = mockRazorpayOrderId;
    await savedOrder.save();

    res.status(201).json({ 
        order: savedOrder,
        razorpayOrderId: mockRazorpayOrderId,
        key: process.env.RAZORPAY_KEY_ID || 'mock_key' 
    });
  } catch (error) {
    console.error('Checkout Error:', error); // Debug log
    res.status(500).json({ message: 'Error initiating checkout', error: error.message });
  }
};

// 2. Verify Payment - Update Order to PAID
export const verifyPayment = async (req, res) => {
    try {
        const { orderId, paymentId, signature } = req.body;

        const order = await Order.findById(orderId);
        if(!order) return res.status(404).json({ message: 'Order not found' });

        // Mock Signature Validation
        // if (generatedSignature !== signature) return res.status(400)...
        
        order.paymentInfo.paymentId = paymentId;
        order.paymentInfo.signature = signature;
        order.paymentInfo.status = 'completed';
        order.status = 'PAID';
        
        // Removed automatic sync to SnapCart. Now handled in updateOrderStatus by Coordinator.
        
        await order.save();

        // TODO: Deduct Inventory Here
        
        res.status(200).json({ success: true, orderId: order._id });

    } catch (error) {
        console.error('Verify Payment Error:', error);
        res.status(500).json({ message: 'Payment verification failed', error: error.message });
    }
};

export const getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ userId: req.user._id }).sort({ createdAt: -1 });
    res.status(200).json(orders);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching orders', error: error.message });
  }
};

export const getOrderById = async (req, res) => {
  try {
    // Populate product details in items and delivery boy
    const order = await Order.findOne({ _id: req.params.id })
        .populate('items.productId')
        .populate('assignedDeliveryBoy');
    
    // Security note: In real app, check if req.user._id.toString() === order.userId.toString() OR if req.user.role === 'admin'
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    res.status(200).json(order);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching order details', error: error.message });
  }
};

export const getAllOrders = async (req, res) => {
    try {
        const orders = await Order.find().sort({ createdAt: -1 });
        res.status(200).json(orders);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching all orders', error: error.message });
    }
};

export const updateOrderStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const order = await Order.findByIdAndUpdate(
            req.params.id, 
            { status }, 
            { new: true }
        );

        console.log(`[DEBUG] Order ${req.params.id} updating to status: ${status}. Method: ${order.method}`);

        // Sync to SnapCart if status is moved to PROCESSING (Approved by Coordinator)
        // Sync to SnapCart removed. Delivery Assignment is now handled via Coordinator 'Assign Driver' button.
        // if (status === 'PROCESSING' && order.method === 'DELIVERY') { ... }

        // Notify Socket Server of Status Update
        try {
            const socketUrl = process.env.SOCKET_URL || 'http://localhost:4000';
            await axios.post(`${socketUrl}/notify`, {
                event: 'order-status-update',
                data: { orderId: req.params.id, status },
                socketId: req.params.id // Room ID matching Order ID
            });
        } catch (e) { 
            console.log("Socket notify failed", e.message); 
        }

        res.status(200).json(order);
    } catch (error) {
         res.status(500).json({ message: 'Error updating status', error: error.message });
    }
};

// Helper to simulate geocoding (Random point in Nashik for demo)
const getMockCoordinates = () => {
    return {
        latitude: 19.9975 + (Math.random() * 0.01),
        longitude: 73.7898 + (Math.random() * 0.01)
    };
};
