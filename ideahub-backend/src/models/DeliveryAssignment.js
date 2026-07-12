import mongoose from 'mongoose';

const deliveryAssignmentSchema = new mongoose.Schema({
  order: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Order",
    required: true
  },
  brodcastedTo: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  }],
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },
  status: {
    type: String,
    enum: ["brodcasted", "assigned", "completed", "cancelled", "failed"],
    default: "brodcasted"
  },
  acceptedAt: {
    type: Date
  },
  completedAt: {
    type: Date
  }
}, { timestamps: true });

// Ensure we don't recompile the model if it already exists
const DeliveryAssignment = mongoose.models.DeliveryAssignment || mongoose.model("DeliveryAssignment", deliveryAssignmentSchema);
export default DeliveryAssignment;
