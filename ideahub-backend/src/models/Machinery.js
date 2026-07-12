import mongoose from 'mongoose';

const { Schema } = mongoose;

const machinerySchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    imageUrl: {
      type: String,
      required: true,
    },
    capacity: {
      type: Number,
      default: 1,
    },
    studentCapacity: {
      type: Number,
      default: 1,
    },
    timeSlots: [{
      day: { type: String, required: true }, // e.g., 'Monday', 'Tuesday'
      startTime: { type: String, required: true }, // e.g., '10:00'
      endTime: { type: String, required: true }, // e.g., '12:00'
    }],
    isAvailable: {
      type: Boolean,
      default: true,
    },
    lastUpdatedDate: {
      type: Date,
      default: Date.now,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    }
  },
  { timestamps: true }
);

export const Machinery = mongoose.models.Machinery || mongoose.model('Machinery', machinerySchema);
export default Machinery;
