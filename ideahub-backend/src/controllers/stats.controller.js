import SiteStats from '../models/SiteStats.js';
import Event from '../models/Event.js';
import Achievement from '../models/Achievement.js';
import User from '../models/User.js';
import RoomPermissionRequest from '../models/RoomPermissionRequest.js';
import MachineryRequest from '../models/MachineryRequest.js';

async function calculateStats() {
  const settings = await SiteStats.getSettings();

  const [
    dbEventsConducted,
    dbAchievementsRecorded,
    dbStudentsTrained,
    roomProjectsCount,
    machineryProjectsCount
  ] = await Promise.all([
    Event.countDocuments().catch(() => 0),
    Achievement.countDocuments().catch(() => 0),
    User.countDocuments().catch(() => 0),
    RoomPermissionRequest.countDocuments({
      status: { $in: ['Approved', 'Completed', 'Head Approved', 'Faculty Approved'] }
    }).catch(() => 0),
    MachineryRequest.countDocuments({
      status: { $in: ['Approved', 'Approved With Conditions', 'Material Allocated', 'Machine Scheduled', 'Active Booking', 'Completed', 'Work Completed'] }
    }).catch(() => 0)
  ]);

  const dbActiveProjects = roomProjectsCount + machineryProjectsCount;

  let activeProjects = 0;
  let studentsTrained = 0;
  let eventsConducted = 0;
  let achievementsRecorded = 0;

  const apOffset = (typeof settings.activeProjectsOffset === 'number' && settings.activeProjectsOffset > 0) ? settings.activeProjectsOffset : 500;
  const stOffset = (typeof settings.studentsTrainedOffset === 'number' && settings.studentsTrainedOffset > 0) ? settings.studentsTrainedOffset : 1500;
  const ecOffset = (typeof settings.eventsConductedOffset === 'number' && settings.eventsConductedOffset > 0) ? settings.eventsConductedOffset : 100;
  const arOffset = (typeof settings.achievementsRecordedOffset === 'number' && settings.achievementsRecordedOffset > 0) ? settings.achievementsRecordedOffset : 150;

  if (settings.mode === 'override') {
    activeProjects = settings.overrideActiveProjects ?? (dbActiveProjects + apOffset);
    studentsTrained = settings.overrideStudentsTrained ?? (dbStudentsTrained + stOffset);
    eventsConducted = settings.overrideEventsConducted ?? (dbEventsConducted + ecOffset);
    achievementsRecorded = settings.overrideAchievementsRecorded ?? (dbAchievementsRecorded + arOffset);
  } else {
    activeProjects = dbActiveProjects + apOffset;
    studentsTrained = dbStudentsTrained + stOffset;
    eventsConducted = dbEventsConducted + ecOffset;
    achievementsRecorded = dbAchievementsRecorded + arOffset;
  }

  return {
    activeProjects,
    studentsTrained,
    eventsConducted,
    achievementsRecorded,
    settings,
    breakdown: {
      dbActiveProjects,
      dbStudentsTrained,
      dbEventsConducted,
      dbAchievementsRecorded,
      roomProjectsCount,
      machineryProjectsCount
    }
  };
}

export const getPublicStats = async (req, res) => {
  try {
    const data = await calculateStats();
    res.json({
      activeProjects: data.activeProjects,
      studentsTrained: data.studentsTrained,
      eventsConducted: data.eventsConducted,
      achievementsRecorded: data.achievementsRecorded
    });
  } catch (error) {
    console.error('Error fetching public stats:', error);
    res.status(500).json({ message: 'Error fetching stats', error: error.message });
  }
};

export const getAdminStats = async (req, res) => {
  try {
    const data = await calculateStats();
    res.json(data);
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    res.status(500).json({ message: 'Error fetching admin stats', error: error.message });
  }
};

export const updateAdminStats = async (req, res) => {
  try {
    const settings = await SiteStats.getSettings();
    const {
      activeProjectsOffset,
      studentsTrainedOffset,
      eventsConductedOffset,
      achievementsRecordedOffset,
      mode,
      overrideActiveProjects,
      overrideStudentsTrained,
      overrideEventsConducted,
      overrideAchievementsRecorded
    } = req.body;

    if (activeProjectsOffset !== undefined) settings.activeProjectsOffset = Number(activeProjectsOffset);
    if (studentsTrainedOffset !== undefined) settings.studentsTrainedOffset = Number(studentsTrainedOffset);
    if (eventsConductedOffset !== undefined) settings.eventsConductedOffset = Number(eventsConductedOffset);
    if (achievementsRecordedOffset !== undefined) settings.achievementsRecordedOffset = Number(achievementsRecordedOffset);

    if (mode && ['offset', 'override'].includes(mode)) settings.mode = mode;

    if (overrideActiveProjects !== undefined) {
      settings.overrideActiveProjects = overrideActiveProjects === null || overrideActiveProjects === '' ? null : Number(overrideActiveProjects);
    }
    if (overrideStudentsTrained !== undefined) {
      settings.overrideStudentsTrained = overrideStudentsTrained === null || overrideStudentsTrained === '' ? null : Number(overrideStudentsTrained);
    }
    if (overrideEventsConducted !== undefined) {
      settings.overrideEventsConducted = overrideEventsConducted === null || overrideEventsConducted === '' ? null : Number(overrideEventsConducted);
    }
    if (overrideAchievementsRecorded !== undefined) {
      settings.overrideAchievementsRecorded = overrideAchievementsRecorded === null || overrideAchievementsRecorded === '' ? null : Number(overrideAchievementsRecorded);
    }

    await settings.save();

    const data = await calculateStats();
    res.json({ message: 'Stats updated successfully', data });
  } catch (error) {
    console.error('Error updating admin stats:', error);
    res.status(500).json({ message: 'Error updating stats', error: error.message });
  }
};
