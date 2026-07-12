import mongoose from 'mongoose';

const { Schema } = mongoose;

const roomSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },
    capacity: {
      type: Number,
      required: true,
      min: 1,
    },
    features: {
      type: [String], // e.g., ["Projector", "Whiteboard"]
      default: [],
    },
    timeSlots: [
      {
        startTime: { type: String, required: true }, // HH:mm
        endTime: { type: String, required: true },   // HH:mm
        label: { type: String, default: '' },
      }
    ],
    isActive: {
      type: Boolean,
      default: true,
    },
    deactivationReason: {
      type: String,
      default: null,
    },
    isSpecial: {
      type: Boolean,
      default: false,
    },
    description: {
      type: String,
      default: '',
    },
    image: {
      type: String,
      default: '',
    },
    lastUpdatedDate: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

export const Room = mongoose.models.Room || mongoose.model('Room', roomSchema);
export default Room;
