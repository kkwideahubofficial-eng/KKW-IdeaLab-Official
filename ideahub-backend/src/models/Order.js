import mongoose from 'mongoose';

const orderItemSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  name: { type: String, required: true },
  price: { type: Number, required: true }, // Snapshot price at purchase
  quantity: { type: Number, required: true },
  image: { type: String }
});

const orderSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  items: [orderItemSchema],
  shippingAddress: {
    fullName: { type: String, required: true },
    addressLine1: { type: String, required: true },
    addressLine2: { type: String },
    city: { type: String, required: true },
    state: { type: String, required: true },
    postalCode: { type: String, required: true },
    phone: { type: String, required: true },
    latitude: { type: Number }, 
    longitude: { type: Number }
  },
  method: { type: String, enum: ['DELIVERY', 'PICKUP'], default: 'DELIVERY' },
  paymentInfo: {
    provider: { type: String, enum: ['razorpay', 'cod'], required: true },
    razorpayOrderId: { type: String },
    paymentId: { type: String },
    signature: { type: String },
    status: { type: String, enum: ['pending', 'completed', 'failed', 'refunded'], default: 'pending' },
  },
  status: {
    type: String,
    enum: ['PENDING', 'PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'],
    default: 'PENDING'
  },
  amounts: {
    subtotal: { type: Number, required: true },
    tax: { type: Number, default: 0 },
    total: { type: Number, required: true }
  },
  // Delivery Feature Fields
  assignment: { type: mongoose.Schema.Types.ObjectId, ref: 'DeliveryAssignment', default: null },
  assignedDeliveryBoy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  deliveryOtp: { type: String, default: null },
  deliveryOtpVerification: { type: Boolean, default: false },
  deliveredAt: { type: Date }
}, { timestamps: true });

export default mongoose.model('Order', orderSchema);
