import mongoose from 'mongoose';

const { Schema } = mongoose;

const teamMemberSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    role: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      enum: ['hod', 'guide', 'student', 'custom'],
      default: 'guide',
      required: true,
    },
    tagline: {
      type: String,
      trim: true,
      default: '',
    },
    department: {
      type: String,
      trim: true,
      default: '',
    },
    quote: {
      type: String,
      trim: true,
      default: '',
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    image: {
      type: String,
      default: '',
    },
    badgeColor: {
      type: String,
      default: 'blue', // blue, emerald, purple, orange, etc.
    },
    socialLinks: {
      github: { type: String, default: '' },
      linkedin: { type: String, default: '' },
      email: { type: String, default: '' },
    },
    displayOrder: {
      type: Number,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

teamMemberSchema.index({ category: 1, displayOrder: 1 });

const TeamMember = mongoose.models.TeamMember || mongoose.model('TeamMember', teamMemberSchema);

export default TeamMember;
