import TeamMember from '../models/TeamMember.js';
import { deleteFromCloudinary } from '../utils/deleteCloudinaryImage.js';

// Initial default seed data for the Development Team page
export const INITIAL_TEAM_MEMBERS = [
  {
    name: 'Dr. Yogita Pagar-Bhise',
    role: 'Head of Department (HOD)',
    category: 'hod',
    tagline: 'PROJECT GUIDE',
    department: 'Computer Science and Design Department, K. K. Wagh Institute of Engineering Education and Research',
    quote: 'Innovation begins when students are trusted to solve real-world problems.',
    description: 'Visionary leadership guiding department initiatives and fostering student innovation.',
    image: '/images/yogita_pagar.jpg',
    badgeColor: 'blue',
    displayOrder: 1,
    socialLinks: { email: 'hod-csd@kkwagh.edu.in' }
  },
  {
    name: 'Prof. Amit S. Patil',
    role: 'Technical Guide',
    category: 'guide',
    tagline: 'Technical Guide',
    description: 'Guiding the technical architecture and development.',
    image: '/images/team/amit_patil.jpg',
    badgeColor: 'blue',
    displayOrder: 2,
    socialLinks: { email: 'aspatil@kkwagh.edu.in' }
  },
  {
    name: 'Prof. Pooja R. Deshmukh',
    role: 'Innovation Guide',
    category: 'guide',
    tagline: 'Innovation Guide',
    description: 'Inspiring innovation and problem-solving approaches.',
    image: '/images/team/pooja_deshmukh.jpg',
    badgeColor: 'emerald',
    displayOrder: 3,
    socialLinks: { email: 'prdeshmukh@kkwagh.edu.in' }
  },
  {
    name: 'Prof. Mayur B. Shinde',
    role: 'Research Guide',
    category: 'guide',
    tagline: 'Research Guide',
    description: 'Supporting research, validation and quality improvement.',
    image: '/images/team/mayur_shinde.jpg',
    badgeColor: 'purple',
    displayOrder: 4,
    socialLinks: { email: 'mbshinde@kkwagh.edu.in' }
  },
  {
    name: 'Prof. Neha V. Jadhav',
    role: 'Faculty Guide',
    category: 'guide',
    tagline: 'Faculty Guide',
    description: 'Providing academic support and overall mentorship.',
    image: '/images/team/neha_jadhav.jpg',
    badgeColor: 'orange',
    displayOrder: 5,
    socialLinks: { email: 'nvjadhav@kkwagh.edu.in' }
  },
  {
    name: 'Kalpesh Bire',
    role: 'Full Stack Developer',
    category: 'student',
    tagline: 'Full Stack Developer',
    description: 'Developed the backend, frontend, system architecture and core functionalities.',
    image: '/images/team/kalpesh.jpg',
    badgeColor: 'blue',
    displayOrder: 6,
    socialLinks: {
      github: 'https://github.com/KalpeshBire',
      linkedin: 'https://linkedin.com/in/kalpeshbire',
      email: 'kalpeshbire@kkwagh.edu.in'
    }
  },
  {
    name: 'Roshan Gaikwad',
    role: 'UI/UX & Frontend Developer',
    category: 'student',
    tagline: 'UI/UX & Frontend Developer',
    description: 'Designed the UI/UX, implemented the frontend and ensured a seamless experience.',
    image: '/images/team/roshan.jpg',
    badgeColor: 'blue',
    displayOrder: 7,
    socialLinks: {
      github: 'https://github.com/roshangaikwad',
      linkedin: 'https://linkedin.com/in/roshangaikwad',
      email: 'roshangaikwad@kkwagh.edu.in'
    }
  }
];

// Helper to extract image URL from req.file or req.body
const getImageUrl = (req) => {
  if (req.file) {
    // Cloudinary returns path / secure_url
    return req.file.path || req.file.secure_url || req.file.url || '';
  }
  return req.body.image || req.body.imageUrl || '';
};

// GET all team members (Auto-seeds if empty)
export const getAllTeamMembers = async (req, res) => {
  try {
    const { category } = req.query;
    const filter = { isActive: true };
    if (category) {
      filter.category = category;
    }

    let members = await TeamMember.find(filter).sort({ displayOrder: 1, createdAt: 1 });

    // Auto-seed if database has no team members yet
    if (members.length === 0 && !category) {
      await TeamMember.insertMany(INITIAL_TEAM_MEMBERS);
      members = await TeamMember.find({ isActive: true }).sort({ displayOrder: 1, createdAt: 1 });
    }

    res.status(200).json({
      success: true,
      count: members.length,
      data: members,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve team members',
      error: error.message,
    });
  }
};

// GET single team member by ID
export const getTeamMemberById = async (req, res) => {
  try {
    const member = await TeamMember.findById(req.params.id);
    if (!member) {
      return res.status(404).json({ success: false, message: 'Team member not found' });
    }
    res.status(200).json({ success: true, data: member });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// CREATE new team member (With Image Upload support)
export const createTeamMember = async (req, res) => {
  try {
    const imageUrl = getImageUrl(req);
    
    // Parse social links if passed as stringified JSON from multipart/form-data
    let socialLinks = req.body.socialLinks;
    if (typeof socialLinks === 'string') {
      try {
        socialLinks = JSON.parse(socialLinks);
      } catch (e) {
        socialLinks = {
          github: req.body.github || '',
          linkedin: req.body.linkedin || '',
          email: req.body.email || ''
        };
      }
    } else if (!socialLinks) {
      socialLinks = {
        github: req.body.github || '',
        linkedin: req.body.linkedin || '',
        email: req.body.email || ''
      };
    }

    const newMember = new TeamMember({
      name: req.body.name,
      role: req.body.role,
      category: req.body.category || 'guide',
      tagline: req.body.tagline || req.body.role,
      department: req.body.department || '',
      quote: req.body.quote || '',
      description: req.body.description || '',
      image: imageUrl,
      badgeColor: req.body.badgeColor || 'blue',
      socialLinks,
      displayOrder: req.body.displayOrder ? Number(req.body.displayOrder) : 0,
      isActive: req.body.isActive !== undefined ? req.body.isActive : true,
    });

    const savedMember = await newMember.save();

    res.status(201).json({
      success: true,
      message: 'Team member created successfully',
      data: savedMember,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Failed to create team member',
      error: error.message,
    });
  }
};

// UPDATE team member by ID (With Image Upload support)
export const updateTeamMember = async (req, res) => {
  try {
    const member = await TeamMember.findById(req.params.id);
    if (!member) {
      return res.status(404).json({ success: false, message: 'Team member not found' });
    }

    const imageUrl = getImageUrl(req);
    if (imageUrl) {
      member.image = imageUrl;
    }

    if (req.body.name) member.name = req.body.name;
    if (req.body.role) member.role = req.body.role;
    if (req.body.category) member.category = req.body.category;
    if (req.body.tagline !== undefined) member.tagline = req.body.tagline;
    if (req.body.department !== undefined) member.department = req.body.department;
    if (req.body.quote !== undefined) member.quote = req.body.quote;
    if (req.body.description !== undefined) member.description = req.body.description;
    if (req.body.badgeColor) member.badgeColor = req.body.badgeColor;
    if (req.body.displayOrder !== undefined) member.displayOrder = Number(req.body.displayOrder);
    if (req.body.isActive !== undefined) member.isActive = req.body.isActive;

    // Handle social links
    let socialLinks = req.body.socialLinks;
    if (typeof socialLinks === 'string') {
      try {
        socialLinks = JSON.parse(socialLinks);
      } catch (e) {
        socialLinks = null;
      }
    }
    if (socialLinks) {
      member.socialLinks = { ...member.socialLinks, ...socialLinks };
    } else {
      if (req.body.github !== undefined) member.socialLinks.github = req.body.github;
      if (req.body.linkedin !== undefined) member.socialLinks.linkedin = req.body.linkedin;
      if (req.body.email !== undefined) member.socialLinks.email = req.body.email;
    }

    const updatedMember = await member.save();

    res.status(200).json({
      success: true,
      message: 'Team member updated successfully',
      data: updatedMember,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Failed to update team member',
      error: error.message,
    });
  }
};

// DELETE team member by ID
export const deleteTeamMember = async (req, res) => {
  try {
    const member = await TeamMember.findById(req.params.id);
    if (!member) {
      return res.status(404).json({ success: false, message: 'Team member not found' });
    }

    if (member.image) {
      await deleteFromCloudinary(member.image);
    }

    await member.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Team member deleted successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete team member',
      error: error.message,
    });
  }
};

// SEED / RESET team members
export const seedTeamMembers = async (req, res) => {
  try {
    await TeamMember.deleteMany({});
    const members = await TeamMember.insertMany(INITIAL_TEAM_MEMBERS);
    res.status(200).json({
      success: true,
      message: 'Team members reset to default seed data successfully',
      data: members,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to seed team members',
      error: error.message,
    });
  }
};
