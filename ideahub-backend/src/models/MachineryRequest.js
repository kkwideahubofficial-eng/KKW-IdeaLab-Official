import mongoose from 'mongoose';

const { Schema } = mongoose;

const machineryRequestSchema = new Schema(
  {
    // Auto-generated fields
    requestId: {
      type: String,
      required: true,
      unique: true,
    },
    applicationDate: {
      type: Date,
      default: Date.now,
    },

    // Section 1: Project Details
    projectName: {
      type: String,
      required: true,
      trim: true,
    },
    projectCategory: {
      type: String,
      required: true,
      enum: [
        'Academic Project',
        'Research Project',
        'Competition Project',
        'Startup Project',
        'Innovation Project',
        'Prototype Development',
        'Product Development',
        'Other',
      ],
    },
    projectDescription: {
      type: String,
      required: true,
    },
    projectObjectives: {
      type: String,
      required: true,
    },
    expectedOutcome: {
      type: String,
      required: true,
    },

    // Section 2: Student Information (Student Cards)
    teamName: {
      type: String,
      default: '',
      trim: true,
    },
    numberOfStudents: {
      type: Number,
      default: 1,
      min: 1,
    },
    students: [{
      name: { type: String, required: true },
      prn: { type: String, required: true },
      branch: { type: String, required: true },
      year: { type: String, required: true },
      division: { type: String, required: true },
      mobile: { type: String, required: true },
      email: { type: String, required: true },
    }],

    // Section 3: Faculty Information (Reference Only)
    facultyGuide: {
      name: { type: String, default: '' },
      department: { type: String, default: '' },
      email: { type: String, default: '' },
      mobile: { type: String, default: '' },
      designation: { type: String, default: '' },
      remarks: { type: String, default: '' }
    },

    // Section 4 & 5: Resource Details
    requestedMachines: [{
      machineId: { type: Schema.Types.ObjectId, ref: 'Machinery' },
      machineName: { type: String },
      machineUnitNumber: { type: Number },
      usageDate: { type: Date },
      startTime: { type: String }, // '10:00'
      endTime: { type: String },   // '14:00'
      usageHours: { type: Number, default: 0 },
      purposeOfUsage: { type: String },
      specialRequirements: { type: String }
    }],

    requestedMaterials: [{
      materialId: { type: Schema.Types.ObjectId, ref: 'Material' },
      materialName: { type: String },
      quantityRequired: { type: Number, default: 1 },
      purposeOfUsage: { type: String }
    }],

    uploadedFiles: {
      designFileUrl: { type: String, default: '' },
      cadFileUrl: { type: String, default: '' },
      circuitDiagramUrl: { type: String, default: '' },
      supportingDocsUrl: { type: String, default: '' }
    },

    // Section 6: Benefit to IDEA Hub
    benefits: {
      researchContribution: { type: String, default: '' },
      innovationContribution: { type: String, default: '' },
      competitionParticipation: { type: String, default: '' },
      patentPossibility: { type: String, default: '' },
      startupPotential: { type: String, default: '' },
      futureScope: { type: String, default: '' },
      technologyImpact: { type: String, default: '' },
      expectedDeliverables: { type: String, default: '' },
      communityImpact: { type: String, default: '' }
    },

    // Section 7: Declaration
    declaration: {
      infoAccurate: { type: Boolean, default: false },
      filesBelongToTeam: { type: Boolean, default: false },
      agreeToRules: { type: Boolean, default: false },
      acceptResponsibility: { type: Boolean, default: false }
    },

    // Approval Workflow Statuses
    status: {
      type: String,
      enum: [
        'Draft',
        'Submitted',
        'Coordinator Review',
        'Coordinator Approved',
        'Coordinator Rejected',
        'Changes Requested',
        'Student Resubmitted',
        'Head Review',
        'Approved',
        'Rejected',
        'Approved With Conditions',
        'Material Allocated',
        'Machine Scheduled',
        'Active Booking',
        'Work Completed',
        'Closed',
        'Completed',
        'Cancelled'
      ],
      default: 'Submitted',
    },

    // Issue & Return management
    materialAllocations: [{
      materialId: { type: Schema.Types.ObjectId, ref: 'Material' },
      quantityRequested: { type: Number },
      quantityIssued: { type: Number, default: 0 },
      issuedDate: { type: Date },
      issuedBy: { type: Schema.Types.ObjectId, ref: 'User' },
      returnedQuantity: { type: Number, default: 0 },
      balanceQuantity: { type: Number, default: 0 }
    }],

    returns: [{
      resourceType: { type: String, enum: ['Machine', 'Material'] },
      resourceId: { type: Schema.Types.ObjectId },
      resourceName: { type: String },
      returnedQuantity: { type: Number, default: 0 },
      returnDate: { type: Date },
      condition: {
        type: String,
        enum: ['Good', 'Damaged', 'Lost', 'Partially Consumed', 'N/A'],
        default: 'Good'
      },
      remarks: { type: String, default: '' },
      returnedBy: { type: String, default: '' }
    }],

    coordinatorRemarks: {
      type: String,
      default: '',
    },
    coordinatorChecks: {
      machineAvailability: { type: Boolean, default: false },
      materialAvailability: { type: Boolean, default: false },
      projectFeasibility: { type: Boolean, default: false },
      studentEligibility: { type: Boolean, default: false },
      previousUsageHistory: { type: Boolean, default: false }
    },

    headRemarks: {
      type: String,
      default: '',
    },
    headConditions: {
      type: String,
      default: '',
    },
    approvedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },

    actualEntryTime: {
      type: Date,
      default: null,
    },
    actualExitTime: {
      type: Date,
      default: null,
    },

    isWorkCompleted: {
      type: Boolean,
      default: false,
    },
    completedAt: {
      type: Date,
      default: null,
    },
    completedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    completionRemarks: {
      type: String,
      default: '',
    },
    actualUsageHours: {
      type: Number,
      default: 0,
    },
    machineReleased: {
      type: Boolean,
      default: false,
    },
    extensionEndTime: {
      type: String,
      default: null,
    },
    extensionReason: {
      type: String,
      default: null,
    },
    extensionStatus: {
      type: String,
      enum: ['Pending', 'Approved', 'Rejected', null],
      default: null,
    },
    completionReminderSent: {
      type: Boolean,
      default: false,
    },

    approvalHistory: [{
      date: { type: Date, default: Date.now },
      role: { type: String },
      action: { type: String },
      remarks: { type: String },
      byName: { type: String }
    }],

    // --- Backward Compatibility Fields ---
    machineryId: {
      type: Schema.Types.ObjectId,
      ref: 'Machinery',
    },
    studentId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    teamMembers: [{
      name: { type: String, required: true },
      branch: { type: String },
      year: { type: String },
      mobile: { type: String },
      email: { type: String },
    }],
    usageDate: {
      type: Date,
    },
    startTime: {
      type: String,
    },
    endTime: {
      type: String,
    },
    purpose: {
      type: String,
    },
    consentAgreed: {
      type: Boolean,
      default: false,
    },
    groupPhotoUrl: {
      type: String,
      default: '',
    },
    rejectionReason: {
      type: String,
      default: '',
    },

    // --- External User Fields ---
    applicantType: {
      type: String,
      enum: ['Internal', 'External'],
      default: 'Internal',
      index: true
    },
    identityVerification: {
      type: String,
      enum: ['Pending', 'Verified', 'Rejected'],
      default: 'Pending'
    },
    externalFullName: {
      type: String,
      default: ''
    },
    externalCollegeOrg: {
      type: String,
      default: ''
    },
    externalDept: {
      type: String,
      default: ''
    },
    externalDesignation: {
      type: String,
      default: ''
    },
    externalWebsite: {
      type: String,
      default: ''
    },
    externalCity: {
      type: String,
      default: ''
    },
    externalState: {
      type: String,
      default: ''
    },
    externalEmail: {
      type: String,
      default: '',
      index: true
    },
    externalMobile: {
      type: String,
      default: '',
      index: true
    },
    externalIdentityProof: {
      type: String,
      default: ''
    },
    externalApplicantType: {
      type: String,
      enum: ['Individual', 'Team'],
      default: 'Individual'
    },
    externalTeamMembers: [{
      name: { type: String },
      email: { type: String },
      mobile: { type: String }
    }],
    machineCharges: {
      type: Number,
      default: 0
    },
    materialCharges: {
      type: Number,
      default: 0
    },
    totalCharges: {
      type: Number,
      default: 0
    },
    paymentStatus: {
      type: String,
      enum: ['Pending', 'Paid', 'Waived'],
      default: 'Pending'
    }
  },
  { timestamps: true }
);

// Indexes for query optimization
machineryRequestSchema.index({ status: 1 });
machineryRequestSchema.index({ status: 1, createdAt: -1 });
machineryRequestSchema.index({ requestId: 1 }, { unique: true });
machineryRequestSchema.index({ studentId: 1 });

export const MachineryRequest = mongoose.models.MachineryRequest || mongoose.model('MachineryRequest', machineryRequestSchema);
export default MachineryRequest;
