import mongoose from 'mongoose';

const { Schema } = mongoose;

const achievementSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },
    date: {
      type: Date,
      required: true,
    },
    imageUrl: {
      type: String,
      required: true,
    },
    gallery: {
      type: [String],
      default: [],
    },
    timeline: [
      {
        date: { type: Date, required: true },
        label: { type: String, required: true }
      }
    ],
    certificates: [
      {
        title: { type: String, required: true },
        achievedBy: { type: String, required: true },
        date: { type: Date, required: true },
        fileUrl: { type: String }
      }
    ],
    achievedBy: {
      type: String, // e.g., Student name, team name
      required: true,
    },
    achievementType: {
      type: String,
      trim: true,
      set: (value) => (typeof value === 'string' && value.trim() ? value.trim() : undefined),
    },
    contributionDomain: {
      type: String,
      trim: true,
      set: (value) => (typeof value === 'string' && value.trim() ? value.trim() : undefined),
    },
    competitionLevel: {
      type: String,
      trim: true,
      set: (value) => (typeof value === 'string' && value.trim() ? value.trim() : undefined),
    },
    teamSize: {
      type: Number,
      min: 1,
      set: (value) => {
        if (value === '' || value === null || value === undefined) return undefined;
        const numericValue = Number(value);
        return Number.isInteger(numericValue) && numericValue > 0 ? numericValue : undefined;
      },
    },
    ideaHubContributions: {
      workspaceProvided: { type: Boolean, default: undefined },
      meetingRoomAccess: { type: Boolean, default: undefined },
      dPrintingSupport: { type: Boolean, default: undefined },
      electronicsComponents: { type: Boolean, default: undefined },
      prototypeDevelopment: { type: Boolean, default: undefined },
      testingFacility: { type: Boolean, default: undefined },
      mentorshipSupport: { type: Boolean, default: undefined },
      presentationGuidance: { type: Boolean, default: undefined },
      competitionRegistration: { type: Boolean, default: undefined },
      industryMentoring: { type: Boolean, default: undefined },
    },
    prizeAmount: {
      type: Number,
      min: 0,
      set: (value) => {
        if (value === '' || value === null || value === undefined) return undefined;
        const numericValue = Number(value);
        return Number.isFinite(numericValue) ? numericValue : undefined;
      },
    },
    eventYear: {
      type: Number,
      min: 1900,
      max: 3000,
      set: (value) => {
        if (value === '' || value === null || value === undefined) return undefined;
        const numericValue = Number(value);
        return Number.isInteger(numericValue) ? numericValue : undefined;
      },
    },
  },
  { timestamps: true }
);

achievementSchema.index({ eventYear: -1, date: -1 });
achievementSchema.index({ achievementType: 1, contributionDomain: 1, eventYear: -1 });
achievementSchema.index({ competitionLevel: 1, eventYear: -1 });
achievementSchema.index({ teamSize: 1 });
achievementSchema.index({ achievedBy: 1 });
achievementSchema.index({ prizeAmount: -1 });

const Achievement = mongoose.models.Achievement || mongoose.model('Achievement', achievementSchema);

export default Achievement;
