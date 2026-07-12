import mongoose from 'mongoose';

const { Schema } = mongoose;

const siteStatsSchema = new Schema(
  {
    activeProjectsOffset: {
      type: Number,
      default: 500,
    },
    studentsTrainedOffset: {
      type: Number,
      default: 1500,
    },
    eventsConductedOffset: {
      type: Number,
      default: 100,
    },
    achievementsRecordedOffset: {
      type: Number,
      default: 150,
    },
    mode: {
      type: String,
      enum: ['offset', 'override'],
      default: 'offset',
    },
    overrideActiveProjects: {
      type: Number,
      default: null,
    },
    overrideStudentsTrained: {
      type: Number,
      default: null,
    },
    overrideEventsConducted: {
      type: Number,
      default: null,
    },
    overrideAchievementsRecorded: {
      type: Number,
      default: null,
    },
  },
  { timestamps: true }
);

siteStatsSchema.statics.getSettings = async function () {
  let doc = await this.findOne();
  if (!doc) {
    doc = await this.create({});
  }
  return doc;
};

const SiteStats = mongoose.models.SiteStats || mongoose.model('SiteStats', siteStatsSchema);

export default SiteStats;
