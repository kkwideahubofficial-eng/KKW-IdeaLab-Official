import mongoose from 'mongoose';

const { Schema } = mongoose;

const eventNotificationSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    body: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      required: true,
    },
    isRead: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

// Add TTL index on createdAt to auto-delete after 7 days (604800 seconds)
eventNotificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 604800 });

const EventNotification = mongoose.models.EventNotification || mongoose.model('EventNotification', eventNotificationSchema);

export default EventNotification;
