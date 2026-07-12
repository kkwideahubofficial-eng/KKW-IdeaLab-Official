import mongoose from 'mongoose';

const { Schema } = mongoose;

const bookingSchema = new Schema(
  {
    team: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    room: {
      type: Schema.Types.ObjectId,
      ref: 'Room',
      required: true,
      index: true,
    },
    teamSize: {
      type: Number,
      required: true,
      min: 1,
    },
    slotDate: {
      type: String, // YYYY-MM-DD
      required: true,
      index: true,
    },
    startTime: {
      type: String, // HH:mm
      required: true,
    },
    endTime: {
      type: String, // HH:mm
      required: true,
    },
    purpose: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: '',
      trim: true,
    },
    teamName: {
      type: String,
      default: '',
      trim: true,
    },
    actualEntryTime: {
      type: Date,
      default: null,
    },
    actualExitTime: {
      type: Date,
      default: null,
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'completed', 'cancelled', 'overstayed'],
      default: 'pending',
      index: true,
    },
    reason: {
      type: String,
      default: '',
      trim: true,
    },
    qrCode: {
      type: String, // base64 data URL
      default: '',
    },
    history: [
      {
        status: {
          type: String,
          enum: ['pending', 'approved', 'rejected'],
          required: true,
        },
        reason: {
          type: String,
          default: '',
          trim: true,
        },
        by: {
          type: Schema.Types.ObjectId,
          ref: 'User',
          required: false,
        },
        at: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  { timestamps: { createdAt: true, updatedAt: true } }
);

bookingSchema.index({ slotDate: 1, startTime: 1, endTime: 1, room: 1, status: 1 });

export const Booking = mongoose.models.Booking || mongoose.model('Booking', bookingSchema);
export default Booking;

