import mongoose from 'mongoose';

const { Schema } = mongoose;

const timeSlotSchema = new Schema(
  {
    label: {
      type: String,
      required: true, // e.g., "09:00 AM - 11:00 AM"
      trim: true,
      unique: true,
    },
    startTime: {
      type: String, // HH:mm
      required: true,
    },
    endTime: {
      type: String, // HH:mm
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    order: {
      type: Number,
      default: 0, // For sorting display
    }
  },
  { timestamps: true }
);

export const TimeSlot = mongoose.models.TimeSlot || mongoose.model('TimeSlot', timeSlotSchema);
export default TimeSlot;
