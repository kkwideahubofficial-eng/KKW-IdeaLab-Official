import mongoose from 'mongoose';

const { Schema } = mongoose;

const machineSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    summary: { type: String, default: '', trim: true },
    details: { type: String, default: '', trim: true },
    imageUrl: { type: String, required: true },
  },
  { timestamps: true }
);

const Machine = mongoose.models.Machine || mongoose.model('Machine', machineSchema);
export default Machine;


