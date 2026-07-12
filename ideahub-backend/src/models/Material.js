import mongoose from 'mongoose';

const { Schema } = mongoose;

const materialSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    category: {
      type: String,
      default: 'General',
    },
    description: {
      type: String,
      default: '',
    },
    currentStock: {
      type: Number,
      default: 0,
      min: 0,
    },
    allocatedQuantity: {
      type: Number,
      default: 0,
      min: 0,
    },
    lowStockThreshold: {
      type: Number,
      default: 5,
      min: 0,
    },
    imageUrl: {
      type: String,
      default: '',
    },
    unit: {
      type: String,
      default: 'pcs',
    },
  },
  { 
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Virtual property for remaining quantity
materialSchema.virtual('remainingQuantity').get(function () {
  return Math.max(0, this.currentStock - this.allocatedQuantity);
});

export const Material = mongoose.models.Material || mongoose.model('Material', materialSchema);
export default Material;
