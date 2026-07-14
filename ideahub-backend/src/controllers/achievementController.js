import Achievement from '../models/Achievement.js';
import { validationResult } from 'express-validator';
import { deleteFromCloudinary } from '../utils/deleteCloudinaryImage.js';

const CONTRIBUTION_FIELDS = [
  'workspaceProvided',
  'meetingRoomAccess',
  'dPrintingSupport',
  'electronicsComponents',
  'prototypeDevelopment',
  'testingFacility',
  'mentorshipSupport',
  'presentationGuidance',
  'competitionRegistration',
  'industryMentoring',
];

const COMPETITION_TYPES = new Set(['Competition', 'Hackathon', 'Sports', 'Innovation Challenge']);

function parseNumberish(value) {
  if (value === '' || value === null || value === undefined) return undefined;
  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue : undefined;
}

function parseIntegerish(value) {
  if (value === '' || value === null || value === undefined) return undefined;
  const numericValue = Number(value);
  return Number.isInteger(numericValue) ? numericValue : undefined;
}

function parseBooleanish(value) {
  if (value === true || value === false) return value;
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (['true', '1', 'yes', 'on'].includes(normalized)) return true;
    if (['false', '0', 'no', 'off'].includes(normalized)) return false;
  }
  return undefined;
}

function parseContributionFlags(rawValue) {
  if (!rawValue) return undefined;

  if (typeof rawValue === 'string') {
    try {
      return parseContributionFlags(JSON.parse(rawValue));
    } catch {
      return undefined;
    }
  }

  if (typeof rawValue !== 'object' || Array.isArray(rawValue)) return undefined;

  const parsed = {};
  let hasValue = false;

  for (const field of CONTRIBUTION_FIELDS) {
    if (Object.prototype.hasOwnProperty.call(rawValue, field)) {
      const value = parseBooleanish(rawValue[field]);
      if (value !== undefined) {
        parsed[field] = value;
        hasValue = true;
      }
    }
  }

  return hasValue ? parsed : undefined;
}

function buildAchievementMatch(query = {}) {
  const andConditions = [];

  const searchTerm = typeof query.search === 'string' ? query.search.trim() : '';
  if (searchTerm) {
    andConditions.push({
      $or: [
      { title: { $regex: searchTerm, $options: 'i' } },
      { description: { $regex: searchTerm, $options: 'i' } },
      { achievedBy: { $regex: searchTerm, $options: 'i' } },
      { achievementType: { $regex: searchTerm, $options: 'i' } },
      { contributionDomain: { $regex: searchTerm, $options: 'i' } },
      { competitionLevel: { $regex: searchTerm, $options: 'i' } },
      ],
    });
  }

  const filters = [
    ['achievementType', query.achievementType],
    ['contributionDomain', query.contributionDomain],
    ['competitionLevel', query.competitionLevel],
    ['team', query.team],
  ];

  for (const [field, value] of filters) {
    if (typeof value === 'string' && value.trim()) {
      andConditions.push({ [field === 'team' ? 'achievedBy' : field]: { $regex: value.trim(), $options: 'i' } });
    }
  }

  const year = parseIntegerish(query.year);
  if (year) {
    andConditions.push({
      $or: [
        { eventYear: year },
        { date: { $gte: new Date(`${year}-01-01`), $lt: new Date(`${year + 1}-01-01`) } },
      ],
    });
  }

  const prizeWinner = typeof query.prizeWinner === 'string' ? query.prizeWinner.trim().toLowerCase() : '';
  if (prizeWinner === 'true' || prizeWinner === '1' || prizeWinner === 'yes') {
    andConditions.push({ prizeAmount: { $gt: 0 } });
  }

  return andConditions.length ? { $and: andConditions } : {};
}

function getContributionProjection() {
  return CONTRIBUTION_FIELDS.reduce((projection, field) => {
    projection[field] = 1;
    return projection;
  }, {});
}

// @desc    Create an achievement
// @route   POST /api/achievements
// @access  Private/Coordinator
export const createAchievement = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { title, description, date, achievedBy, achievementType, contributionDomain, competitionLevel } = req.body;
    
    let imageUrl = req.body.imageUrl || '';
    if (req.files && req.files.image && req.files.image[0]) {
      imageUrl = req.files.image[0].path;
    }

    let gallery = [];
    if (req.files && req.files.gallery) {
      gallery = req.files.gallery.map(file => file.path);
    }

    const prizeAmount = parseNumberish(req.body.prizeAmount);
    const eventYear = parseIntegerish(req.body.eventYear);
    const teamSize = parseIntegerish(req.body.teamSize);
    const ideaHubContributions = parseContributionFlags(req.body.ideaHubContributions);

    let timeline = [];
    if (req.body.timeline) {
      try {
        const parsed = typeof req.body.timeline === 'string' ? JSON.parse(req.body.timeline) : req.body.timeline;
        if (Array.isArray(parsed)) {
          timeline = parsed.map(item => ({
            label: item.label,
            date: new Date(item.date)
          })).filter(item => !isNaN(item.date.getTime()) && item.label);
        }
      } catch (e) {
        // ignore JSON errors
      }
    }

    let certificates = [];
    if (req.body.certificates) {
      try {
        const parsed = typeof req.body.certificates === 'string' ? JSON.parse(req.body.certificates) : req.body.certificates;
        if (Array.isArray(parsed)) {
          certificates = parsed.map(item => {
            let fileUrl = item.fileUrl || '';
            if (item.fileIndex !== undefined && req.files && req.files.certificateFiles) {
              const idx = Number(item.fileIndex);
              if (req.files.certificateFiles[idx]) {
                fileUrl = req.files.certificateFiles[idx].path;
              }
            }
            return {
              title: item.title,
              achievedBy: item.achievedBy,
              date: new Date(item.date),
              fileUrl
            };
          }).filter(item => !isNaN(item.date.getTime()) && item.title && item.achievedBy);
        }
      } catch (e) {
        // ignore JSON errors
      }
    }

    const newAchievement = new Achievement({
      title,
      description,
      date,
      achievedBy,
      imageUrl,
      gallery,
      timeline,
      certificates,
      achievementType,
      contributionDomain,
      competitionLevel,
      prizeAmount,
      eventYear,
      teamSize,
      ...(ideaHubContributions ? { ideaHubContributions } : {}),
    });

    const achievement = await newAchievement.save();
    res.status(201).json(achievement);
  } catch (err) {
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Get all achievements
// @route   GET /api/achievements
// @access  Public
export const getAllAchievements = async (req, res) => {
  try {
    const achievements = await Achievement.find().sort({ date: -1 });
    res.json(achievements);
  } catch (err) {
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Filter achievements
// @route   GET /api/achievements/filter
// @access  Public
export const filterAchievements = async (req, res) => {
  try {
    const page = Math.max(parseIntegerish(req.query.page) || 1, 1);
    const limit = Math.min(Math.max(parseIntegerish(req.query.limit) || 12, 1), 100);
    const skip = (page - 1) * limit;
    const match = buildAchievementMatch(req.query);

    const [items, total] = await Promise.all([
      Achievement.find(match).sort({ date: -1, createdAt: -1 }).skip(skip).limit(limit),
      Achievement.countDocuments(match),
    ]);

    res.json({
      data: items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.max(Math.ceil(total / limit), 1),
      },
    });
  } catch (err) {
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Get achievement timeline
// @route   GET /api/achievements/timeline
// @access  Public
export const getAchievementTimeline = async (_req, res) => {
  try {
    const timeline = await Achievement.aggregate([
      {
        $addFields: {
          timelineYear: { $ifNull: ['$eventYear', { $year: '$date' }] },
        },
      },
      { $sort: { timelineYear: -1, date: -1, createdAt: -1 } },
      {
        $group: {
          _id: '$timelineYear',
          achievements: {
            $push: {
              _id: '$_id',
              title: '$title',
              description: '$description',
              date: '$date',
              achievedBy: '$achievedBy',
              achievementType: '$achievementType',
              contributionDomain: '$contributionDomain',
              competitionLevel: '$competitionLevel',
              prizeAmount: '$prizeAmount',
              imageUrl: '$imageUrl',
              teamSize: '$teamSize',
            },
          },
        },
      },
      { $sort: { _id: -1 } },
    ]);

    res.json(timeline.map((entry) => ({ year: entry._id, achievements: entry.achievements })));
  } catch (err) {
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Get contribution analytics
// @route   GET /api/achievements/contributions
// @access  Public
export const getContributionAnalytics = async (_req, res) => {
  try {
    const contributions = await Achievement.aggregate([
      { $match: { ideaHubContributions: { $exists: true, $ne: null } } },
      {
        $group: {
          _id: null,
          workspaceSupportCount: { $sum: { $cond: ['$ideaHubContributions.workspaceProvided', 1, 0] } },
          mentorshipCount: { $sum: { $cond: ['$ideaHubContributions.mentorshipSupport', 1, 0] } },
          prototypeDevelopmentCount: { $sum: { $cond: ['$ideaHubContributions.prototypeDevelopment', 1, 0] } },
          testingFacilityUsage: { $sum: { $cond: ['$ideaHubContributions.testingFacility', 1, 0] } },
          competitionRegistrationSupport: { $sum: { $cond: ['$ideaHubContributions.competitionRegistration', 1, 0] } },
          industryMentoringSupport: { $sum: { $cond: ['$ideaHubContributions.industryMentoring', 1, 0] } },
        },
      },
      {
        $project: {
          _id: 0,
        },
      },
    ]);

    res.json(
      contributions[0] || {
        workspaceSupportCount: 0,
        mentorshipCount: 0,
        prototypeDevelopmentCount: 0,
        testingFacilityUsage: 0,
        competitionRegistrationSupport: 0,
        industryMentoringSupport: 0,
      }
    );
  } catch (err) {
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Get achievement analytics
// @route   GET /api/achievements/analytics
// @access   Public
export const getAchievementAnalytics = async (_req, res) => {
  try {
    const [summary] = await Achievement.aggregate([
      {
        $addFields: {
          normalizedYear: { $ifNull: ['$eventYear', { $year: '$date' }] },
          normalizedPrizeAmount: { $ifNull: ['$prizeAmount', 0] },
          normalizedTeamSize: { $ifNull: ['$teamSize', 1] },
        },
      },
      {
        $group: {
          _id: null,
          totalAchievements: { $sum: 1 },
          totalStudentsParticipated: { $sum: '$normalizedTeamSize' },
          totalCompetitions: {
            $sum: {
              $cond: [{ $in: ['$achievementType', Array.from(COMPETITION_TYPES)] }, 1, 0],
            },
          },
          totalPrizeMoney: { $sum: '$normalizedPrizeAmount' },
          nationalAchievements: { $sum: { $cond: [{ $eq: ['$competitionLevel', 'National'] }, 1, 0] } },
          internationalAchievements: { $sum: { $cond: [{ $eq: ['$competitionLevel', 'International'] }, 1, 0] } },
          researchPublications: { $sum: { $cond: [{ $eq: ['$achievementType', 'Research Paper'] }, 1, 0] } },
          patents: { $sum: { $cond: [{ $eq: ['$achievementType', 'Patent'] }, 1, 0] } },
        },
      },
    ]);

    res.json(
      summary || {
        totalAchievements: 0,
        totalStudentsParticipated: 0,
        totalCompetitions: 0,
        totalPrizeMoney: 0,
        nationalAchievements: 0,
        internationalAchievements: 0,
        researchPublications: 0,
        patents: 0,
      }
    );
  } catch (err) {
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Get prize analytics
// @route   GET /api/achievements/prize-analytics
// @access   Public
export const getPrizeAnalytics = async (_req, res) => {
  try {
    const [summary] = await Achievement.aggregate([
      {
        $addFields: {
          normalizedYear: { $ifNull: ['$eventYear', { $year: '$date' }] },
          normalizedPrizeAmount: { $ifNull: ['$prizeAmount', 0] },
        },
      },
      {
        $group: {
          _id: null,
          totalPrizeMoney: { $sum: '$normalizedPrizeAmount' },
          statePrizeMoney: { $sum: { $cond: [{ $eq: ['$competitionLevel', 'State'] }, '$normalizedPrizeAmount', 0] } },
          nationalPrizeMoney: { $sum: { $cond: [{ $eq: ['$competitionLevel', 'National'] }, '$normalizedPrizeAmount', 0] } },
          internationalPrizeMoney: { $sum: { $cond: [{ $eq: ['$competitionLevel', 'International'] }, '$normalizedPrizeAmount', 0] } },
          averagePrizeValue: { $avg: '$normalizedPrizeAmount' },
          highestPrizeWon: { $max: '$normalizedPrizeAmount' },
        },
      },
    ]);

    const yearWisePrizeDistribution = await Achievement.aggregate([
      {
        $addFields: {
          normalizedYear: { $ifNull: ['$eventYear', { $year: '$date' }] },
          normalizedPrizeAmount: { $ifNull: ['$prizeAmount', 0] },
        },
      },
      {
        $group: {
          _id: '$normalizedYear',
          totalPrizeMoney: { $sum: '$normalizedPrizeAmount' },
          achievementCount: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
      {
        $project: {
          _id: 0,
          year: '$_id',
          totalPrizeMoney: 1,
          achievementCount: 1,
        },
      },
    ]);

    const competitionWisePrizeDistribution = await Achievement.aggregate([
      {
        $addFields: {
          normalizedPrizeAmount: { $ifNull: ['$prizeAmount', 0] },
          competitionBucket: { $ifNull: ['$competitionLevel', 'Unspecified'] },
        },
      },
      {
        $group: {
          _id: '$competitionBucket',
          totalPrizeMoney: { $sum: '$normalizedPrizeAmount' },
          count: { $sum: 1 },
        },
      },
      { $sort: { totalPrizeMoney: -1, _id: 1 } },
      {
        $project: {
          _id: 0,
          label: '$_id',
          totalPrizeMoney: 1,
          count: 1,
        },
      },
    ]);

    const achievementTypeDistribution = await Achievement.aggregate([
      {
        $group: {
          _id: { $ifNull: ['$achievementType', 'Unspecified'] },
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1, _id: 1 } },
      {
        $project: {
          _id: 0,
          name: '$_id',
          value: '$count',
        },
      },
    ]);

    res.json({
      summary: summary || {
        totalPrizeMoney: 0,
        statePrizeMoney: 0,
        nationalPrizeMoney: 0,
        internationalPrizeMoney: 0,
        averagePrizeValue: 0,
        highestPrizeWon: 0,
      },
      charts: {
        yearWisePrizeDistribution,
        competitionWisePrizeDistribution,
        achievementTypeDistribution,
      },
    });
  } catch (err) {
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Get achievement by ID
// @route   GET /api/achievements/:id
// @access  Public
export const getAchievementById = async (req, res) => {
  try {
    const achievement = await Achievement.findById(req.params.id);
    if (!achievement) {
      return res.status(404).json({ message: 'Achievement not found' });
    }
    res.json(achievement);
  } catch (err) {
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Update an achievement
// @route   PUT /api/achievements/:id
// @access  Private/Coordinator
export const updateAchievement = async (req, res) => {
  try {
    const { title, description, date, achievedBy, achievementType, contributionDomain, competitionLevel } = req.body;
    let achievement = await Achievement.findById(req.params.id);

    if (!achievement) {
      return res.status(404).json({ message: 'Achievement not found' });
    }

    achievement.title = title || achievement.title;
    achievement.description = description || achievement.description;
    achievement.date = date || achievement.date;
    achievement.achievedBy = achievedBy || achievement.achievedBy;
    achievement.achievementType = achievementType || achievement.achievementType;
    achievement.contributionDomain = contributionDomain || achievement.contributionDomain;
    achievement.competitionLevel = competitionLevel || achievement.competitionLevel;
    const prizeAmount = parseNumberish(req.body.prizeAmount);
    const eventYear = parseIntegerish(req.body.eventYear);
    const teamSize = parseIntegerish(req.body.teamSize);
    const ideaHubContributions = parseContributionFlags(req.body.ideaHubContributions);

    if (prizeAmount !== undefined) achievement.prizeAmount = prizeAmount;
    if (eventYear !== undefined) achievement.eventYear = eventYear;
    if (teamSize !== undefined) achievement.teamSize = teamSize;
    if (ideaHubContributions) {
      achievement.ideaHubContributions = {
        ...(achievement.ideaHubContributions || {}),
        ...ideaHubContributions,
      };
    }
    const oldImageUrl = achievement.imageUrl;
    const oldGallery = achievement.gallery || [];

    if (req.files && req.files.image && req.files.image[0]) {
      const newImageUrl = req.files.image[0].path;
      if (oldImageUrl && oldImageUrl !== newImageUrl) {
        await deleteFromCloudinary(oldImageUrl);
      }
      achievement.imageUrl = newImageUrl;
    } else if (typeof req.body.imageUrl === 'string') {
      const newImageUrl = req.body.imageUrl;
      if (oldImageUrl && oldImageUrl !== newImageUrl) {
        await deleteFromCloudinary(oldImageUrl);
      }
      achievement.imageUrl = newImageUrl;
    }

    let gallery = [];
    if (req.files && req.files.gallery) {
      gallery = req.files.gallery.map(file => file.path);
    }

    if (req.body.existingGallery) {
      try {
        const existing = typeof req.body.existingGallery === 'string'
          ? JSON.parse(req.body.existingGallery)
          : req.body.existingGallery;
        if (Array.isArray(existing)) {
          gallery = [...existing, ...gallery];

          // Delete removed gallery images from Cloudinary
          const keptSet = new Set(existing);
          const removedFromGallery = oldGallery.filter(url => !keptSet.has(url));
          if (removedFromGallery.length > 0) {
            await deleteFromCloudinary(removedFromGallery);
          }
        }
      } catch (e) {
        // Ignore parse error
      }
    }

    if ((req.files && req.files.gallery) || req.body.existingGallery !== undefined) {
      achievement.gallery = gallery;
    }

    if (req.body.timeline !== undefined) {
      try {
        const parsed = typeof req.body.timeline === 'string' ? JSON.parse(req.body.timeline) : req.body.timeline;
        if (Array.isArray(parsed)) {
          achievement.timeline = parsed.map(item => ({
            label: item.label,
            date: new Date(item.date)
          })).filter(item => !isNaN(item.date.getTime()) && item.label);
        }
      } catch (e) {
        // ignore parse error
      }
    }
    if (req.body.certificates !== undefined) {
      try {
        const parsed = typeof req.body.certificates === 'string' ? JSON.parse(req.body.certificates) : req.body.certificates;
        if (Array.isArray(parsed)) {
          achievement.certificates = parsed.map(item => {
            let fileUrl = item.fileUrl || '';
            if (item.fileIndex !== undefined && req.files && req.files.certificateFiles) {
              const idx = Number(item.fileIndex);
              if (req.files.certificateFiles[idx]) {
                fileUrl = req.files.certificateFiles[idx].path;
              }
            }
            return {
              title: item.title,
              achievedBy: item.achievedBy,
              date: new Date(item.date),
              fileUrl
            };
          }).filter(item => !isNaN(item.date.getTime()) && item.title && item.achievedBy);
        }
      } catch (e) {
        // ignore parse error
      }
    }

    await achievement.save();
    res.json(achievement);
  } catch (err) {
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Delete an achievement
// @route   DELETE /api/achievements/:id
// @access  Private/Coordinator
export const deleteAchievement = async (req, res) => {
  try {
    const achievement = await Achievement.findById(req.params.id);

    if (!achievement) {
      return res.status(404).json({ message: 'Achievement not found' });
    }

    // Delete associated images, gallery, and certificates from Cloudinary
    if (achievement.imageUrl) {
      await deleteFromCloudinary(achievement.imageUrl);
    }
    if (achievement.gallery && achievement.gallery.length > 0) {
      await deleteFromCloudinary(achievement.gallery);
    }
    if (achievement.certificates && achievement.certificates.length > 0) {
      const certUrls = achievement.certificates.map(c => c.fileUrl).filter(Boolean);
      await deleteFromCloudinary(certUrls);
    }

    await achievement.deleteOne();
    res.json({ message: 'Achievement removed' });
  } catch (err) {
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Delete single photo/image asset from Cloudinary
// @route   POST /api/achievements/delete-image
// @access  Private/Coordinator
export const deleteCloudinaryImageController = async (req, res) => {
  try {
    const { imageUrl } = req.body;
    if (!imageUrl) {
      return res.status(400).json({ message: 'imageUrl is required' });
    }
    await deleteFromCloudinary(imageUrl);
    res.json({ success: true, message: 'Image deleted from Cloudinary' });
  } catch (err) {
    console.error('Error deleting Cloudinary image:', err);
    res.status(500).json({ message: 'Failed to delete image from Cloudinary' });
  }
};

