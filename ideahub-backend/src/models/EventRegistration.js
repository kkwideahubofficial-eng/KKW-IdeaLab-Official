import mongoose from 'mongoose';

const { Schema } = mongoose;

const memberSchema = new Schema({
  fullName: { type: String, required: true },
  prn: { type: String, required: true },
  rollNumber: { type: String, required: true },
  department: { type: String, required: true },
  year: { type: String, required: true },
  division: { type: String, required: true },
  email: { type: String, required: true },
  mobile: { type: String, required: true },
  isTeamLeader: { type: Boolean, default: false },
  attendance: {
    type: String,
    enum: ['pending', 'present', 'absent'],
    default: 'pending'
  },
  certificateNumber: {
    type: String,
    default: ''
  },
  certificateGeneratedAt: {
    type: Date
  }
});

const eventRegistrationSchema = new Schema(
  {
    event: {
      type: Schema.Types.ObjectId,
      ref: 'Event',
      required: true,
    },
    student: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    registrationId: {
      type: String,
      required: true,
      unique: true,
    },
    registrationDate: {
      type: Date,
      default: Date.now,
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
    teamName: {
      type: String,
      default: '',
    },
    teamSize: {
      type: Number,
      default: 1,
    },
    projectTitle: {
      type: String,
      default: '',
    },
    problemStatement: {
      type: String,
      default: '',
    },
    projectDescription: {
      type: String,
      default: '',
    },
    skills: {
      type: String,
      default: '',
    },
    teamMembers: {
      type: [memberSchema],
      default: []
    },
    declarationConfirmed: {
      type: Boolean,
      required: true,
    }
  },
  { timestamps: true }
);

const EventRegistration = mongoose.models.EventRegistration || mongoose.model('EventRegistration', eventRegistrationSchema);

export default EventRegistration;
