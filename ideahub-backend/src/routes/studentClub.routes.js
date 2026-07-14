import express from 'express';
import StudentClub from '../models/StudentClub.js';
import upload from '../middlewares/upload.js';

const router = express.Router();

// POST /api/student-clubs/upload-image (Cloudinary File Upload)
router.post('/upload-image', upload.single('image'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No image file uploaded' });
    }
    const imageUrl = req.file.path || req.file.secure_url || req.file.url;
    res.json({ 
      success: true, 
      message: 'Image uploaded to Cloudinary successfully', 
      url: imageUrl 
    });
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    res.status(500).json({ success: false, message: error.message || 'Image upload failed' });
  }
});

// Initial Seed Data for fallback/bootstrap
const SEED_CLUBS = [
  {
    clubId: "csi",
    name: "CSI",
    shortName: "CSI",
    fullTitle: "CSI – Computer Society of India",
    category: "Technical",
    accentColor: "#2563EB",
    icon: "💻",
    members: 320,
    established: "Since 2018",
    description: "Promoting technical excellence through workshops, seminars, coding contests, industrial visits and national level events.",
    about: "Computer Society of India (CSI) student branch at KKWIEER is a premier platform dedicated to advancing computer science education, competitive programming, and technical leadership. We organize hands-on technical workshops, national level hackathons, and industrial interaction sessions.",
    facultyCoordinator: {
      name: "Prof. S. P. Agnihotri",
      designation: "Faculty Coordinator",
      department: "Dept. of Computer Engineering"
    },
    studentLead: {
      name: "Omkar Patel",
      role: "President",
      department: "B.E. Computer Engineering"
    },
    activities: [
      "Coding Contests",
      "Workshops",
      "Hackathons",
      "Industrial Visits",
      "Guest Lectures",
      "Open Source Projects"
    ],
    achievements: [
      "🏆 SIH National Finalist 2023",
      "🏆 1st Prize State Level Hackathon",
      "🏆 320+ Active Student Members"
    ],
    conductedEvents: [
      {
        title: "National Level Hackathon: CodeHacks '24",
        date: "15-16 Feb 2024",
        category: "Hackathon",
        participants: "300+ Coders",
        description: "24-Hour non-stop coding hackathon focusing on AI solutions, Smart Healthcare, and Web3 innovations with live jury evaluations.",
        image: "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=600&auto=format&fit=crop&q=80"
      },
      {
        title: "Cloud Native & DevOps Workshop",
        date: "10 Nov 2023",
        category: "Hands-on Workshop",
        participants: "180+ Attendees",
        description: "Interactive session on Docker containerization, Kubernetes orchestration, CI/CD pipelines, and AWS Cloud infrastructure.",
        image: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=600&auto=format&fit=crop&q=80"
      },
      {
        title: "Industrial Visit to TCS Sahyadri Park",
        date: "22 Aug 2023",
        category: "Industrial Visit",
        participants: "120+ Students",
        description: "Exposure to corporate IT infrastructure, cloud server rooms, agile project management workflows, and tech career insights.",
        image: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=600&auto=format&fit=crop&q=80"
      }
    ],
    gallery: [
      "https://images.unsplash.com/photo-1531482615713-2afd69097998?w=600&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=600&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=600&auto=format&fit=crop&q=80"
    ],
    order: 1
  },
  {
    clubId: "debuggers",
    name: "Debuggers Club",
    shortName: "Debuggers",
    fullTitle: "Debuggers Club",
    category: "Technical",
    accentColor: "#10B981",
    icon: "🐞",
    members: 180,
    established: "Since 2022",
    description: "A coding community focused on Data Structures, Algorithms, Competitive Programming and Hackathons.",
    about: "Debuggers Club is KKWIEER's elite competitive programming and problem-solving hub. We empower students to master Data Structures, Algorithms, dynamic programming, and tackle technical interviews at top tier technology companies.",
    facultyCoordinator: {
      name: "Prof. R. S. Bhalerao",
      designation: "Faculty Advisor",
      department: "Dept. of Information Technology"
    },
    studentLead: {
      name: "Yash Verma",
      role: "Club Lead",
      department: "T.E. Information Technology"
    },
    activities: [
      "Coding Sprints",
      "DSA Bootcamps",
      "Hackathons",
      "LeetCode Sprints",
      "Mock Technical Interviews",
      "Bug Bounty Battles"
    ],
    achievements: [
      "🏆 100+ LeetCode 500+ Solvers",
      "🏆 Top 10 CodeChef Student Chapter",
      "🏆 180+ Active Coders"
    ],
    conductedEvents: [
      {
        title: "CodeSprint 4.0 Speed Programming",
        date: "28 Jan 2024",
        category: "Coding Contest",
        participants: "220+ Participants",
        description: "Timed competitive coding league with live leaderboards on CodeChef featuring algorithmic challenges and cash prizes.",
        image: "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=600&auto=format&fit=crop&q=80"
      },
      {
        title: "DSA Masterclass: Graphs & Dynamic Programming",
        date: "14 Oct 2023",
        category: "Bootcamp",
        participants: "150+ Attendees",
        description: "Comprehensive problem solving masterclass dissecting Dijkstra, BFS/DFS, memoization, and FAANG interview questions.",
        image: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=600&auto=format&fit=crop&q=80"
      }
    ],
    gallery: [
      "https://images.unsplash.com/photo-1515879218367-8466d910aaa4?w=600&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=600&auto=format&fit=crop&q=80"
    ],
    order: 2
  },
  {
    clubId: "pixel-phantom",
    name: "Pixel Phantom",
    shortName: "Pixel Phantom",
    fullTitle: "Pixel Phantom Creative & Media Club",
    category: "Design",
    accentColor: "#7C3AED",
    icon: "🎨",
    members: 140,
    established: "Since 2023",
    description: "Creative media and design club specializing in graphic design, UI/UX, branding, photography and videography.",
    about: "Pixel Phantom brings together visual artists, UI/UX designers, photographers, motion graphics artists, and digital creators. We design user-centered UI concepts, brand identities for campus events, and high-impact digital media.",
    facultyCoordinator: {
      name: "Prof. M. A. Wakchaure",
      designation: "Faculty Mentor",
      department: "Dept. of Robotics & Automation"
    },
    studentLead: {
      name: "Ananya Sharma",
      role: "Creative Director",
      department: "B.E. AI & Data Science"
    },
    activities: [
      "Graphic Design",
      "UI/UX Workshops",
      "Branding Challenges",
      "Photography Walks",
      "Figma Bootcamps",
      "Video Production"
    ],
    achievements: [
      "🏆 Best UI/UX Design Award 2023",
      "🏆 Campus Media Excellence",
      "🏆 140+ Creative Designers"
    ],
    conductedEvents: [
      {
        title: "Figma UI/UX Design Sprint 2024",
        date: "18 Mar 2024",
        category: "Designathon",
        participants: "140+ Designers",
        description: "Hands-on UI design sprint covering component libraries, interactive prototypes, micro-interactions, and accessibility standards.",
        image: "https://images.unsplash.com/photo-1581291518633-83b4ebd1d83e?w=600&auto=format&fit=crop&q=80"
      }
    ],
    gallery: [
      "https://images.unsplash.com/photo-1542744094-3a31b272c490?w=600&auto=format&fit=crop&q=80"
    ],
    order: 3
  },
  {
    clubId: "mibcs",
    name: "MIBCS Club",
    shortName: "MIBCS",
    fullTitle: "MIBCS – Innovation & Technical Events Club",
    category: "Technical",
    accentColor: "#F97316",
    icon: "🚀",
    members: 250,
    established: "Since 2021",
    description: "A community for innovation, tech events, leadership development and collaborative learning experiences.",
    about: "MIBCS (Management, Innovation, and Building Computer Systems) focuses on holistic engineering development. We bridge deep technical innovation with leadership, public speaking, team management, and interdisciplinary prototype development.",
    facultyCoordinator: {
      name: "Dr. S. S. Sane",
      designation: "Faculty Head",
      department: "Dept. of Computer Engineering"
    },
    studentLead: {
      name: "Rahul Deshmukh",
      role: "President",
      department: "B.E. Computer Engineering"
    },
    activities: [
      "Innovation Contests",
      "Leadership Summits",
      "Project Exhibitions"
    ],
    achievements: [
      "🏆 Best Student Branch 2023",
      "🏆 National TechFest Runner Up"
    ],
    conductedEvents: [
      {
        title: "InnovateX 2024 Hardware-Software Showcase",
        date: "02 Apr 2024",
        category: "Exhibition",
        participants: "200+ Innovators",
        description: "National prototype exhibition showcasing student hardware-software inventions reviewed by industry CTOs.",
        image: "https://images.unsplash.com/photo-1531482615713-2afd69097998?w=600&auto=format&fit=crop&q=80"
      }
    ],
    gallery: [
      "https://images.unsplash.com/photo-1475721027785-f74eccf877e2?w=600&auto=format&fit=crop&q=80"
    ],
    order: 4
  },
  {
    clubId: "robotics",
    name: "Robotics & Automation Club",
    shortName: "Robotics Club",
    fullTitle: "Robotics & Automation Club",
    category: "Technical",
    accentColor: "#06B6D4",
    icon: "🤖",
    members: 90,
    established: "Since 2022",
    description: "Exploring robotics, IoT, automation, embedded systems, drones and emerging technologies.",
    about: "Robotics & Automation Club is the official hardware and mechatronics community at KKWIEER. We design autonomous robots, IoT smart sensor networks, PCB circuits, and custom aerial drones in collaboration with AICTE IDEA Lab facilities.",
    facultyCoordinator: {
      name: "Prof. N. V. Alone",
      designation: "Faculty Coordinator",
      department: "Dept. of Robotics & Automation"
    },
    studentLead: {
      name: "Rohan Kulkarni",
      role: "Team Lead",
      department: "T.E. Robotics & Automation"
    },
    activities: [
      "Robotics Workshops",
      "IoT Bootcamps",
      "Drone Building"
    ],
    achievements: [
      "🏆 Robocon National Semi-Finalist",
      "🏆 1st Prize IoT Innovation Challenge"
    ],
    conductedEvents: [
      {
        title: "RoboWars 2024 Combat Championship",
        date: "25 Feb 2024",
        category: "Robotics League",
        participants: "150+ Robotics Enthusiasts",
        description: "High-octane combat bot competition featuring 15kg wired & wireless bots competing in an arena.",
        image: "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=600&auto=format&fit=crop&q=80"
      }
    ],
    gallery: [
      "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=600&auto=format&fit=crop&q=80"
    ],
    order: 5
  },
  {
    clubId: "ecell",
    name: "Entrepreneurship Cell",
    shortName: "E-Cell",
    fullTitle: "Entrepreneurship Cell (E-Cell)",
    category: "Entrepreneurship",
    accentColor: "#F59E0B",
    icon: "🌐",
    members: 75,
    established: "Since 2020",
    description: "Encouraging startup culture, business model development, pitch events and industry interaction.",
    about: "E-Cell KKWIEER nurtures the entrepreneurial spark among engineers. We connect aspiring student founders with startup incubators, angel investors, intellectual property experts, and business mentors to transform ideas into viable commercial ventures.",
    facultyCoordinator: {
      name: "Dr. P. B. Kushare",
      designation: "Head of Incubation",
      department: "Dept. of Mechanical Engineering"
    },
    studentLead: {
      name: "Shruti Joshi",
      role: "Overall Coordinator",
      department: "B.E. Production Engineering"
    },
    activities: [
      "Startup Culture",
      "Incubation Seminars",
      "Pitch Deck Competitions"
    ],
    achievements: [
      "🏆 5+ Student Startups Incubated",
      "🏆 National E-Summit Award Winner"
    ],
    conductedEvents: [
      {
        title: "E-Summit & Pitch Tank 2024",
        date: "10 Apr 2024",
        category: "Pitch Contest",
        participants: "250+ Student Founders",
        description: "Live startup pitch battle evaluated by angel investors, venture capitalists, and alumni entrepreneurs.",
        image: "https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=600&auto=format&fit=crop&q=80"
      }
    ],
    gallery: [
      "https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=600&auto=format&fit=crop&q=80"
    ],
    order: 6
  }
];

// Seed Helper
const ensureSeedData = async () => {
  try {
    const count = await StudentClub.countDocuments();
    if (count === 0) {
      console.log('Seeding initial Student Clubs data into MongoDB...');
      await StudentClub.insertMany(SEED_CLUBS);
    }
  } catch (err) {
    console.error('Error seeding student clubs:', err);
  }
};

// GET /api/student-clubs (Public)
router.get('/', async (req, res) => {
  try {
    await ensureSeedData();
    const clubs = await StudentClub.find().sort({ order: 1, createdAt: -1 });
    res.json({ success: true, clubs });
  } catch (error) {
    console.error('Error fetching student clubs:', error);
    res.status(500).json({ success: false, message: 'Server Error fetching clubs' });
  }
});

// GET /api/student-clubs/:id (Public)
router.get('/:id', async (req, res) => {
  try {
    const club = await StudentClub.findOne({ 
      $or: [{ _id: req.params.id }, { clubId: req.params.id }] 
    });
    if (!club) {
      return res.status(404).json({ success: false, message: 'Club not found' });
    }
    res.json({ success: true, club });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// POST /api/student-clubs (Create Club)
router.post('/', async (req, res) => {
  try {
    const { name, shortName, fullTitle, category, accentColor, icon, logoUrl, members, established, description, about, facultyCoordinator, studentLead, activities, achievements, conductedEvents, gallery, socialLinks } = req.body;
    
    const clubId = (shortName || name).toLowerCase().replace(/[^a-z0-9]/g, '-');
    
    const newClub = new StudentClub({
      clubId,
      name,
      shortName: shortName || name,
      fullTitle: fullTitle || name,
      category: category || 'Technical',
      accentColor: accentColor || '#2563EB',
      icon: icon || '💻',
      logoUrl: logoUrl || '',
      members: Number(members) || 0,
      established: established || 'Since 2024',
      description,
      about: about || description,
      facultyCoordinator: facultyCoordinator || { name: 'Faculty Lead', designation: 'Coordinator', department: 'Engineering' },
      studentLead: studentLead || { name: 'Student Lead', role: 'President', department: 'Engineering' },
      activities: activities || [],
      achievements: achievements || [],
      conductedEvents: conductedEvents || [],
      gallery: gallery || [],
      socialLinks: socialLinks || {}
    });

    await newClub.save();
    res.status(201).json({ success: true, message: 'Student Club created successfully', club: newClub });
  } catch (error) {
    console.error('Error creating club:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to create club' });
  }
});

// PUT /api/student-clubs/:id (Update Club)
router.put('/:id', async (req, res) => {
  try {
    const updated = await StudentClub.findOneAndUpdate(
      { $or: [{ _id: req.params.id }, { clubId: req.params.id }] },
      { $set: req.body },
      { new: true, runValidators: true }
    );

    if (!updated) {
      return res.status(404).json({ success: false, message: 'Club not found' });
    }

    res.json({ success: true, message: 'Student Club updated successfully', club: updated });
  } catch (error) {
    console.error('Error updating club:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to update club' });
  }
});

// DELETE /api/student-clubs/:id (Delete Club)
router.delete('/:id', async (req, res) => {
  try {
    const deleted = await StudentClub.findOneAndDelete({
      $or: [{ _id: req.params.id }, { clubId: req.params.id }]
    });

    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Club not found' });
    }

    res.json({ success: true, message: 'Club deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to delete club' });
  }
});

// POST /api/student-clubs/:id/events (Add Conducted Event to Club)
router.post('/:id/events', async (req, res) => {
  try {
    const club = await StudentClub.findOne({ 
      $or: [{ _id: req.params.id }, { clubId: req.params.id }] 
    });

    if (!club) {
      return res.status(404).json({ success: false, message: 'Club not found' });
    }

    const { title, date, category, participants, description, image } = req.body;
    club.conductedEvents.push({ title, date, category, participants, description, image });
    await club.save();

    res.status(201).json({ success: true, message: 'Event added successfully', club });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to add event' });
  }
});

// DELETE /api/student-clubs/:id/events/:eventId (Remove Conducted Event)
router.delete('/:id/events/:eventId', async (req, res) => {
  try {
    const club = await StudentClub.findOne({ 
      $or: [{ _id: req.params.id }, { clubId: req.params.id }] 
    });

    if (!club) {
      return res.status(404).json({ success: false, message: 'Club not found' });
    }

    club.conductedEvents = club.conductedEvents.filter(
      evt => evt._id.toString() !== req.params.eventId
    );
    await club.save();

    res.json({ success: true, message: 'Event removed successfully', club });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to remove event' });
  }
});

export default router;
