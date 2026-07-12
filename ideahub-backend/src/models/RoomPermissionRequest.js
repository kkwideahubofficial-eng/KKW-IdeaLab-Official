import mongoose from 'mongoose';

const { Schema } = mongoose;

const roomPermissionRequestSchema = new Schema(
  {
    requestId: {
      type: String,
      required: true,
      unique: true,
    },
    applicationDate: {
      type: Date,
      default: Date.now,
    },
    facilityRequired: {
      type: String,
      required: true,
      index: true,
    },
    purpose: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      required: true,
      enum: [
        'Project Discussion',
        'Prototype Development',
        'Team Meeting',
        'Workshop Preparation',
        'Presentation Practice',
        'Research Activity',
        'Innovation Activity',
        'Other',
      ],
    },
    applicantDetails: {
      requestedBy: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true,
      },
      applicantName: { type: String, required: true },
      prn: { type: String, required: true },
      rollNo: { type: String, required: true },
      department: { type: String, required: true },
      year: { type: String, required: true },
      division: { type: String, required: true },
      mobile: { type: String, required: true },
      email: { type: String, required: true },
    },
    teamDetails: {
      teamName: { type: String, required: true, trim: true },
      projectName: { type: String, required: true, trim: true },
      participantsCount: { type: Number, required: true, min: 1 },
      teamMembers: [
        {
          fullName: { type: String, required: true },
          prn: { type: String, required: true },
          department: { type: String, required: true },
          year: { type: String, required: true },
        },
      ],
    },
    schedule: {
      requestedDate: {
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
      duration: {
        type: Number, // In Hours
        required: true,
      },
    },
    facultyRecommendation: {
      facultyName: { type: String, required: true },
      facultyDepartment: { type: String, required: true },
      facultyMobile: { type: String, required: true },
      facultyEmail: { type: String, required: true },
      facultyDesignation: { type: String, required: true },
      facultyRemarks: { type: String, default: '' },
      verified: { type: Boolean, default: false },
      verifiedAt: { type: Date },
    },
    resourceRequirements: {
      requiredEquipment: {
        type: [String],
        default: [],
      },
      otherEquipment: { type: String, default: '' },
    },
    specialRequirements: {
      type: String,
      default: '',
    },
    additionalNotes: {
      type: String,
      default: '',
    },
    declaresAgreed: {
      type: Boolean,
      default: true,
    },
    reminderSent: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      enum: [
        'Draft',
        'Submitted',
        'Faculty Verified',
        'Coordinator Review',
        'Coordinator Approved',
        'IDEA Hub Head Review',
        'Approved',
        'Rejected',
        'Conditional Approval',
        'Completed',
        'Cancelled',
      ],
      default: 'Draft',
      index: true,
    },
    remarks: {
      type: String,
      default: '',
    },
    conditions: {
      type: String,
      default: '',
    },
    approvalHistory: [
      {
        date: { type: Date, default: Date.now },
        role: { type: String, required: true }, // 'Faculty', 'Coordinator', 'Head'
        action: { type: String, required: true }, // 'Verified', 'Approved', 'Rejected', 'Conditional Approval', 'Forwarded'
        remarks: { type: String, default: '' },
        byName: { type: String, required: true },
      },
    ],
  },
  { timestamps: true }
);

roomPermissionRequestSchema.index({ status: 1, 'schedule.requestedDate': 1 });
roomPermissionRequestSchema.index({ 'applicantDetails.requestedBy': 1, createdAt: -1 });

export const RoomPermissionRequest =
  mongoose.models.RoomPermissionRequest ||
  mongoose.model('RoomPermissionRequest', roomPermissionRequestSchema);

export default RoomPermissionRequest;
