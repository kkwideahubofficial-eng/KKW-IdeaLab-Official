import mongoose from 'mongoose';

const pushSubscriptionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  subscription: {
    endpoint: { type: String, required: true },
    expirationTime: { type: Number, default: null },
    keys: {
      p256dh: { type: String, required: true },
      auth: { type: String, required: true },
    },
  },
}, { timestamps: true });

// Prevent duplicate subscriptions for the same endpoint
pushSubscriptionSchema.index({ 'subscription.endpoint': 1 }, { unique: true });

const PushSubscription = mongoose.model('PushSubscription', pushSubscriptionSchema);
export default PushSubscription;
