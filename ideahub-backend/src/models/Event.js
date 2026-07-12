import mongoose from 'mongoose';

const { Schema } = mongoose;

const eventSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      required: true,
      default: 'General',
    },
    description: {
      type: String,
      required: true,
    },
    objectives: {
      type: String,
      default: '',
    },
    date: {
      type: Date,
      required: true,
    },
    startTime: {
      type: String,
      required: true,
      default: '10:00 AM',
    },
    endTime: {
      type: String,
      required: true,
      default: '05:00 PM',
    },
    registrationStartDate: {
      type: Date,
      required: true,
      default: Date.now,
    },
    registrationEndDate: {
      type: Date,
      required: true,
      default: Date.now,
    },
    venue: {
      type: String,
      required: true,
      default: 'IDEA Lab',
    },
    building: {
      type: String,
      default: '',
    },
    roomNumber: {
      type: String,
      default: '',
    },
    participationType: {
      type: String,
      enum: ['Individual Only', 'Team Only', 'Both Allowed'],
      default: 'Both Allowed',
      required: true
    },
    minTeamSize: {
      type: Number,
      default: 1,
      required: true
    },
    maxTeamSize: {
      type: Number,
      default: 10,
      required: true
    },
    totalSeats: {
      type: Number,
      required: true,
      default: 50,
    },
    allowedBranches: {
      type: [String],
      default: [],
    },
    allowedYears: {
      type: [String],
      default: [],
    },
    requiredSkills: {
      type: [String],
      default: [],
    },
    organizer: {
      type: String,
      required: true,
    },
    coordinatorName: {
      type: String,
      default: '',
    },
    coordinatorContact: {
      type: String,
      default: '',
    },
    imageUrl: {
      type: String,
      default: '',
    },
    gallery: {
      type: [String],
      default: [],
    },
    attachments: [
      {
        name: { type: String, required: true },
        url: { type: String, required: true },
      }
    ],
    ruleBookUrl: {
      type: String,
      default: '',
    },
    rules: {
      type: String,
      default: '',
    },
    eligibilityCriteria: {
      type: String,
      default: '',
    },
    schedule: {
      type: String,
      default: '',
    },
    isPublished: {
      type: Boolean,
      default: true,
    },
    statusOverride: {
      type: String,
      enum: ['Cancelled', null],
      default: null,
    },
  },
  { timestamps: true }
);

// Virtual field or helper method to get the current status dynamically
eventSchema.methods.getStatus = function () {
  if (this.statusOverride === 'Cancelled') {
    return 'Cancelled';
  }
  
  const now = new Date();
  const regStart = new Date(this.registrationStartDate);
  const regEnd = new Date(this.registrationEndDate);
  const eventDate = new Date(this.date);
  
  // Calculate end time
  let eventEndDate = new Date(eventDate);
  if (this.endTime) {
    const timeMatch = this.endTime.match(/(\d+):(\d+)\s*(AM|PM)/i);
    if (timeMatch) {
      let hours = parseInt(timeMatch[1], 10);
      const minutes = parseInt(timeMatch[2], 10);
      const ampm = timeMatch[3].toUpperCase();
      if (ampm === 'PM' && hours < 12) hours += 12;
      if (ampm === 'AM' && hours === 12) hours = 0;
      eventEndDate.setHours(hours, minutes, 0, 0);
    } else {
      eventEndDate.setHours(eventEndDate.getHours() + 3);
    }
  } else {
    eventEndDate.setHours(eventEndDate.getHours() + 3);
  }

  if (now < regStart) {
    return 'Upcoming';
  } else if (now >= regStart && now <= regEnd) {
    return 'Registration Open';
  } else if (now > regEnd && now < eventDate) {
    return 'Registration Closed';
  } else if (now >= eventDate && now <= eventEndDate) {
    return 'Ongoing';
  } else {
    return 'Completed';
  }
};

const Event = mongoose.models.Event || mongoose.model('Event', eventSchema);

export default Event;
