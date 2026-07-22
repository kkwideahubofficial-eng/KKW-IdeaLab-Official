import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { 
  Search, 
  Users, 
  Calendar, 
  Bookmark, 
  ArrowRight, 
  CheckCircle2, 
  Award, 
  Trophy, 
  Sparkles, 
  MapPin, 
  Clock, 
  UserCheck, 
  Filter, 
  X, 
  Image as ImageIcon,
  ChevronRight,
  GraduationCap,
  ExternalLink,
  Flame,
  Zap,
  Edit,
  Trash2,
  Plus,
  ShieldCheck,
  RefreshCw,
  Upload,
  Cloud,
  Linkedin,
  Instagram,
  MessageCircle,
  Phone,
  Mail,
  Share2,
  ArrowUp,
  ArrowDown,
  ArrowLeft
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

function hexToRgba(hex?: string, alpha: number = 0.12): string {
  if (!hex || typeof hex !== 'string') return `rgba(37, 99, 235, ${alpha})`;
  let c = hex.replace('#', '');
  if (c.length === 3) c = c.split('').map(x => x + x).join('');
  const num = parseInt(c, 16);
  if (isNaN(num)) return `rgba(37, 99, 235, ${alpha})`;
  const r = (num >> 16) & 255;
  const g = (num >> 8) & 255;
  const b = num & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

const ExpandableText = ({ 
  text, 
  clampLines = 2, 
  className = "text-xs text-slate-600 leading-relaxed" 
}: { 
  text: string; 
  clampLines?: number; 
  className?: string; 
}) => {
  const [expanded, setExpanded] = useState(false);
  if (!text) return null;
  const isLong = text.length > 55;

  if (!isLong) {
    return <p className={className}>{text}</p>;
  }

  const clampClass = clampLines === 2 ? 'line-clamp-2' : clampLines === 3 ? 'line-clamp-3' : 'line-clamp-1';

  return (
    <div>
      <p className={`${className} ${!expanded ? clampClass : ''}`}>
        {text}
      </p>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setExpanded(!expanded);
        }}
        className="text-[11px] font-bold text-blue-600 hover:text-blue-800 hover:underline transition-colors mt-0.5 inline-flex items-center gap-0.5 cursor-pointer"
      >
        {expanded ? "Read less" : "Read more..."}
      </button>
    </div>
  );
};

export interface ConductedEvent {
  _id?: string;
  title: string;
  date: string;
  category: string;
  participants: string;
  description: string;
  image: string;
}

export interface Club {
  _id?: string;
  id?: string;
  clubId?: string;
  name: string;
  shortName: string;
  fullTitle: string;
  category: 'Technical' | 'Design' | 'Entrepreneurship' | 'Cultural' | 'Innovation';
  accentColor: string;
  bgTint?: string;
  borderColor?: string;
  badgeBg?: string;
  badgeText?: string;
  icon: string;
  logoUrl?: string;
  members: number;
  established: string;
  description: string;
  about: string;
  facultyCoordinator: {
    name: string;
    designation: string;
    department: string;
  };
  studentLead: {
    name: string;
    role: string;
    department: string;
  };
  activities: string[];
  achievements: string[];
  conductedEvents: ConductedEvent[];
  gallery: string[];
  socialLinks?: {
    linkedin?: string;
    instagram?: string;
    whatsapp?: string;
    contactNo?: string;
    email?: string;
  };
  order?: number;
}

const CLUBS_DATA: Club[] = [
  {
    id: "csi",
    clubId: "csi",
    name: "CSI",
    shortName: "CSI",
    fullTitle: "CSI – Computer Society of India",
    category: "Technical",
    accentColor: "#2563EB",
    bgTint: "bg-blue-50/70 hover:bg-blue-50",
    borderColor: "border-blue-200",
    badgeBg: "bg-blue-100",
    badgeText: "text-blue-700",
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
    ]
  },
  {
    id: "debuggers",
    clubId: "debuggers",
    name: "Debuggers Club",
    shortName: "Debuggers",
    fullTitle: "Debuggers Club",
    category: "Technical",
    accentColor: "#10B981",
    bgTint: "bg-emerald-50/70 hover:bg-emerald-50",
    borderColor: "border-emerald-200",
    badgeBg: "bg-emerald-100",
    badgeText: "text-emerald-700",
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
    ]
  },
  {
    id: "pixel-phantom",
    clubId: "pixel-phantom",
    name: "Pixel Phantom",
    shortName: "Pixel Phantom",
    fullTitle: "Pixel Phantom Creative & Media Club",
    category: "Design",
    accentColor: "#7C3AED",
    bgTint: "bg-purple-50/70 hover:bg-purple-50",
    borderColor: "border-purple-200",
    badgeBg: "bg-purple-100",
    badgeText: "text-purple-700",
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
    ]
  },
  {
    id: "mibcs",
    clubId: "mibcs",
    name: "MIBCS Club",
    shortName: "MIBCS",
    fullTitle: "MIBCS – Innovation & Technical Events Club",
    category: "Technical",
    accentColor: "#F97316",
    bgTint: "bg-orange-50/70 hover:bg-orange-50",
    borderColor: "border-orange-200",
    badgeBg: "bg-orange-100",
    badgeText: "text-orange-700",
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
    ]
  },
  {
    id: "robotics",
    clubId: "robotics",
    name: "Robotics & Automation Club",
    shortName: "Robotics Club",
    fullTitle: "Robotics & Automation Club",
    category: "Technical",
    accentColor: "#06B6D4",
    bgTint: "bg-cyan-50/70 hover:bg-cyan-50",
    borderColor: "border-cyan-200",
    badgeBg: "bg-cyan-100",
    badgeText: "text-cyan-700",
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
    ]
  },
  {
    id: "ecell",
    clubId: "ecell",
    name: "Entrepreneurship Cell",
    shortName: "E-Cell",
    fullTitle: "Entrepreneurship Cell (E-Cell)",
    category: "Entrepreneurship",
    accentColor: "#F59E0B",
    bgTint: "bg-amber-50/70 hover:bg-amber-50",
    borderColor: "border-amber-200",
    badgeBg: "bg-amber-100",
    badgeText: "text-amber-700",
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
    ]
  }
];

const UPCOMING_EVENTS = [
  {
    date: "24",
    month: "MAY",
    title: "CodeSprint 5.0",
    host: "By Debuggers Club",
    location: "IDEA Lab",
    time: "10:00 AM",
    color: "#2563EB",
    bg: "bg-blue-50 text-blue-700 border-blue-200"
  },
  {
    date: "07",
    month: "JUN",
    title: "Design Thinking Workshop",
    host: "By Pixel Phantom",
    location: "Design Studio",
    time: "02:00 PM",
    color: "#7C3AED",
    bg: "bg-purple-50 text-purple-700 border-purple-200"
  },
  {
    date: "18",
    month: "JUN",
    title: "Robotics Bootcamp",
    host: "By Robotics Club",
    location: "Robotics Lab",
    time: "11:00 AM",
    color: "#06B6D4",
    bg: "bg-cyan-50 text-cyan-700 border-cyan-200"
  }
];

const ACHIEVEMENTS_DATA = [
  {
    icon: Trophy,
    number: "12+",
    label: "National Awards",
    color: "text-amber-500 bg-amber-50 border-amber-100"
  },
  {
    icon: Award,
    number: "25+",
    label: "Hackathons Participated",
    color: "text-red-500 bg-red-50 border-red-100"
  },
  {
    icon: Users,
    number: "1,000+",
    label: "Active Members",
    color: "text-blue-500 bg-blue-50 border-blue-100"
  },
  {
    icon: Calendar,
    number: "100+",
    label: "Events Organized",
    color: "text-indigo-500 bg-indigo-50 border-indigo-100"
  }
];

export interface UpcomingEventItem {
  id: string;
  date: string;
  month: string;
  title: string;
  host: string;
  location: string;
  time: string;
  bg?: string;
}

export interface CollectiveAchievementItem {
  id: string;
  number: string;
  label: string;
  iconType: 'trophy' | 'award' | 'users' | 'calendar';
  color?: string;
}

const StudentClubs: React.FC = () => {
  const [clubsList, setClubsList] = useState<Club[]>(CLUBS_DATA);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("All Categories");
  const [sortBy, setSortBy] = useState<string>("default");
  const [bookmarkedClubs, setBookmarkedClubs] = useState<string[]>([]);
  
  // Editable Upcoming Events & Achievements State
  const [upcomingEventsList, setUpcomingEventsList] = useState<UpcomingEventItem[]>(() => {
    const saved = localStorage.getItem("idea_hub_upcoming_events");
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    return [
      { id: "1", date: "24", month: "MAY", title: "CodeSprint 5.0", host: "By Debuggers Club", location: "IDEA Lab", time: "10:00 AM", bg: "bg-blue-50 text-blue-700 border-blue-200" },
      { id: "2", date: "07", month: "JUN", title: "Design Thinking Workshop", host: "By Pixel Phantom", location: "Design Studio", time: "02:00 PM", bg: "bg-purple-50 text-purple-700 border-purple-200" },
      { id: "3", date: "18", month: "JUN", title: "Robotics Bootcamp", host: "By Robotics Club", location: "Robotics Lab", time: "11:00 AM", bg: "bg-cyan-50 text-cyan-700 border-cyan-200" }
    ];
  });

  const [collectiveAchievementsList, setCollectiveAchievementsList] = useState<CollectiveAchievementItem[]>(() => {
    const saved = localStorage.getItem("idea_hub_collective_achievements");
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    return [
      { id: "1", number: "12+", label: "National Awards", iconType: 'trophy', color: "text-amber-500 bg-amber-50 border-amber-100" },
      { id: "2", number: "25+", label: "Hackathons Participated", iconType: 'award', color: "text-red-500 bg-red-50 border-red-100" },
      { id: "3", number: "1,000+", label: "Active Members", iconType: 'users', color: "text-blue-500 bg-blue-50 border-blue-100" },
      { id: "4", number: "100+", label: "Events Organized", iconType: 'calendar', color: "text-indigo-500 bg-indigo-50 border-indigo-100" }
    ];
  });

  // Dialog States for Editing Upcoming Events & Achievements
  const [editingUpcomingEvent, setEditingUpcomingEvent] = useState<UpcomingEventItem | null>(null);
  const [editingAchievementStat, setEditingAchievementStat] = useState<CollectiveAchievementItem | null>(null);

  useEffect(() => {
    localStorage.setItem("idea_hub_upcoming_events", JSON.stringify(upcomingEventsList));
  }, [upcomingEventsList]);

  useEffect(() => {
    localStorage.setItem("idea_hub_collective_achievements", JSON.stringify(collectiveAchievementsList));
  }, [collectiveAchievementsList]);
  const [selectedClub, setSelectedClub] = useState<Club | null>(null);
  const [joinModalOpen, setJoinModalOpen] = useState(false);
  const [selectedClubForJoin, setSelectedClubForJoin] = useState<string>("");
  const [activeShowcaseClubTab, setActiveShowcaseClubTab] = useState<string>("all");
  const [showcaseLimit, setShowcaseLimit] = useState<number>(4);
  const [modalEventsLimit, setModalEventsLimit] = useState<number>(4);

  // Coordinator specific state
  const [isCoordinator, setIsCoordinator] = useState(false);
  const [editingClub, setEditingClub] = useState<Club | null>(null);
  const [editModalTab, setEditModalTab] = useState<'basic' | 'coordinators' | 'activities' | 'events' | 'gallery' | 'social'>('basic');

  // Input states for editing list items
  const [newActivityInput, setNewActivityInput] = useState("");
  const [newAchievementInput, setNewAchievementInput] = useState("");
  const [newEventTitle, setNewEventTitle] = useState("");
  const [newEventDate, setNewEventDate] = useState("");
  const [newEventCategory, setNewEventCategory] = useState("Hackathon");
  const [newEventParticipants, setNewEventParticipants] = useState("150+ Coders");
  const [newEventDescription, setNewEventDescription] = useState("");
  const [newEventImage, setNewEventImage] = useState("");
  const [newGalleryInput, setNewGalleryInput] = useState("");

  // Check coordinator role
  useEffect(() => {
    try {
      const raw = localStorage.getItem("idea_hub_user");
      if (raw) {
        const u = JSON.parse(raw);
        if (['coordinator', 'head', 'admin'].includes(u.role)) {
          setIsCoordinator(true);
        }
      }
    } catch {
      setIsCoordinator(false);
    }
  }, []);

  const fetchClubs = () => {
    fetch('/api/student-clubs')
      .then(res => res.json())
      .then(data => {
        if (data.success && Array.isArray(data.clubs) && data.clubs.length > 0) {
          setClubsList(data.clubs);
        }
      })
      .catch(err => console.log('Using static clubs fallback:', err));
  };

  useEffect(() => {
    fetchClubs();
  }, []);

  // Form fields for joining club
  const [applicantName, setApplicantName] = useState("");
  const [applicantEmail, setApplicantEmail] = useState("");
  const [applicantDept, setApplicantDept] = useState("");
  const [applicantYear, setApplicantYear] = useState("SE");
  const [applicantReason, setApplicantReason] = useState("");

  const toggleBookmark = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (bookmarkedClubs.includes(id)) {
      setBookmarkedClubs(bookmarkedClubs.filter(cId => cId !== id));
      toast.info("Removed from saved clubs");
    } else {
      setBookmarkedClubs([...bookmarkedClubs, id]);
      toast.success("Saved to your bookmarks");
    }
  };

  const handleOpenJoinModal = (clubName: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setSelectedClubForJoin(clubName);
    setJoinModalOpen(true);
  };

  const handleJoinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!applicantName || !applicantEmail) {
      toast.error("Please fill in your name and email.");
      return;
    }
    toast.success(`🎉 Application submitted for ${selectedClubForJoin || 'Student Club'}!`, {
      description: "The club coordinator will reach out to you via your college email soon."
    });
    setJoinModalOpen(false);
    setApplicantName("");
    setApplicantEmail("");
    setApplicantDept("");
    setApplicantReason("");
  };

  // Coordinator actions
  const handleDeleteClub = async (targetId?: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!targetId) return;
    if (!window.confirm("Are you sure you want to delete this student club?")) return;

    try {
      const res = await fetch(`/api/student-clubs/${targetId}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        toast.success("Student Club deleted successfully");
        setClubsList(prev => prev.filter(c => (c._id || c.id || c.clubId) !== targetId));
        if (selectedClub && (selectedClub._id || selectedClub.id || selectedClub.clubId) === targetId) {
          setSelectedClub(null);
        }
      } else {
        toast.error(data.message || "Failed to delete club");
      }
    } catch {
      toast.error("Error deleting club");
    }
  };

  const handleCreateClub = () => {
    const themeColors = ["#EC4899", "#8B5CF6", "#F59E0B", "#10B981", "#06B6D4", "#EF4444", "#3B82F6"];
    const randomTheme = themeColors[Math.floor(Math.random() * themeColors.length)];

    const blankClub: Club = {
      name: "New Student Club",
      shortName: "New Club",
      fullTitle: "New Student Club - KKWIEER",
      category: "Technical",
      accentColor: randomTheme,
      icon: "⚡",
      members: 50,
      established: "Since 2024",
      description: "Brief club overview description...",
      about: "Comprehensive about information detailing club mission and scope.",
      facultyCoordinator: {
        name: "Prof. Faculty Name",
        designation: "Faculty Advisor",
        department: "Dept. of Computer Science"
      },
      studentLead: {
        name: "Student President Name",
        role: "President",
        department: "B.E. Computer Engineering"
      },
      activities: ["Workshops", "Hackathons", "Coding Contests"],
      achievements: ["🏆 Active Campus Community"],
      conductedEvents: [],
      gallery: [
        "https://images.unsplash.com/photo-1531482615713-2afd69097998?w=600&auto=format&fit=crop&q=80"
      ]
    };

    setEditingClub(blankClub);
    setEditModalTab('basic');
  };

  const handleSaveEditedClub = async () => {
    if (!editingClub) return;

    if (!editingClub.name || !editingClub.fullTitle || !editingClub.description) {
      toast.error("Please fill in required fields (Club Name, Full Title, Description)");
      return;
    }

    try {
      const isNew = !editingClub._id;
      const targetId = editingClub._id || editingClub.id || editingClub.clubId;
      const url = isNew ? '/api/student-clubs' : `/api/student-clubs/${targetId}`;
      const method = isNew ? 'POST' : 'PUT';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingClub)
      });

      const data = await res.json();
      if (data.success) {
        toast.success(isNew ? "✨ Student Club created!" : "💾 Club updated successfully!");
        setEditingClub(null);
        fetchClubs();
      } else {
        toast.error(data.message || "Failed to save club");
      }
    } catch {
      toast.error("Error saving club to server");
    }
  };

  // Cloudinary File Upload Handler
  const handleFileUploadToCloudinary = async (
    e: React.ChangeEvent<HTMLInputElement>,
    onSuccess: (url: string) => void
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const toastId = toast.loading(`Uploading ${file.name} to Cloudinary...`);

    try {
      const formData = new FormData();
      formData.append("image", file);

      const res = await fetch("/api/student-clubs/upload-image", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (data.success && data.url) {
        toast.success("☁️ Image uploaded to Cloudinary successfully!", { id: toastId });
        onSuccess(data.url);
      } else {
        toast.error(data.message || "Failed to upload image", { id: toastId });
      }
    } catch (err) {
      console.error("Cloudinary upload error:", err);
      toast.error("Error uploading file to Cloudinary", { id: toastId });
    } finally {
      e.target.value = "";
    }
  };

  // Activity, Achievement, Event & Gallery Helper Methods for Editing Dialog
  const handleAddActivity = () => {
    if (!newActivityInput.trim() || !editingClub) return;
    setEditingClub({ ...editingClub, activities: [...editingClub.activities, newActivityInput.trim()] });
    setNewActivityInput("");
  };

  const handleRemoveActivity = (idx: number) => {
    if (!editingClub) return;
    setEditingClub({ ...editingClub, activities: editingClub.activities.filter((_, i) => i !== idx) });
  };

  const handleAddAchievement = () => {
    if (!newAchievementInput.trim() || !editingClub) return;
    setEditingClub({ ...editingClub, achievements: [...editingClub.achievements, newAchievementInput.trim()] });
    setNewAchievementInput("");
  };

  const handleRemoveAchievement = (idx: number) => {
    if (!editingClub) return;
    setEditingClub({ ...editingClub, achievements: editingClub.achievements.filter((_, i) => i !== idx) });
  };

  const handleAddConductedEvent = () => {
    if (!newEventTitle || !newEventDate || !newEventImage || !editingClub) {
      toast.error("Please fill in event title, date, and photo URL");
      return;
    }
    const newEvt: ConductedEvent = {
      title: newEventTitle,
      date: newEventDate,
      category: newEventCategory,
      participants: newEventParticipants,
      description: newEventDescription || "Event conducted by student community.",
      image: newEventImage
    };
    setEditingClub({ ...editingClub, conductedEvents: [...editingClub.conductedEvents, newEvt] });
    setNewEventTitle("");
    setNewEventDate("");
    setNewEventDescription("");
    setNewEventImage("");
    toast.success("Event added to list");
  };

  const handleRemoveConductedEvent = (idx: number) => {
    if (!editingClub) return;
    setEditingClub({ ...editingClub, conductedEvents: editingClub.conductedEvents.filter((_, i) => i !== idx) });
  };

  const handleAddGalleryImage = () => {
    if (!newGalleryInput.trim() || !editingClub) return;
    setEditingClub({ ...editingClub, gallery: [...editingClub.gallery, newGalleryInput.trim()] });
    setNewGalleryInput("");
  };

  const handleRemoveGalleryImage = (idx: number) => {
    if (!editingClub) return;
    setEditingClub({ ...editingClub, gallery: editingClub.gallery.filter((_, i) => i !== idx) });
  };

  const handleMoveClubOrder = async (club: Club, direction: 'up' | 'down') => {
    const sorted = [...clubsList].sort((a, b) => (a.order ?? 99) - (b.order ?? 99));
    const index = sorted.findIndex(c => (c._id || c.id || c.clubId) === (club._id || club.id || club.clubId));
    if (index === -1) return;

    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= sorted.length) return;

    const targetClub = sorted[targetIndex];

    const currentOrder = club.order ?? (index + 1);
    const targetOrder = targetClub.order ?? (targetIndex + 1);

    const newClubOrder = targetOrder;
    const newTargetOrder = currentOrder === targetOrder ? (direction === 'up' ? targetOrder + 1 : targetOrder - 1) : currentOrder;

    const updatedClubs = clubsList.map(c => {
      if ((c._id || c.id || c.clubId) === (club._id || club.id || club.clubId)) {
        return { ...c, order: newClubOrder };
      }
      if ((c._id || c.id || c.clubId) === (targetClub._id || targetClub.id || targetClub.clubId)) {
        return { ...c, order: newTargetOrder };
      }
      return c;
    });

    setClubsList(updatedClubs);

    try {
      const c1Id = club._id || club.id || club.clubId;
      const c2Id = targetClub._id || targetClub.id || targetClub.clubId;

      await Promise.all([
        fetch(`/api/student-clubs/${c1Id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...club, order: newClubOrder })
        }),
        fetch(`/api/student-clubs/${c2Id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...targetClub, order: newTargetOrder })
        })
      ]);
      toast.success(`Priority updated! ${club.shortName} moved ${direction === 'up' ? 'first' : 'down'}`);
      fetchClubs();
    } catch (err) {
      console.error(err);
    }
  };

  // Filtering logic
  const filteredClubs = clubsList.filter(club => {
    const matchesSearch = 
      club.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      club.fullTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
      club.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      club.activities.some(act => act.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesCategory = 
      categoryFilter === "All Categories" || club.category === categoryFilter;

    return matchesSearch && matchesCategory;
  }).sort((a, b) => {
    if (sortBy === "members") return b.members - a.members;
    if (sortBy === "name") return a.name.localeCompare(b.name);
    return (a.order ?? 99) - (b.order ?? 99);
  });

  // Flattened conducted events for the showcase section
  const allConductedEvents = clubsList.flatMap(club => {
    const cId = (club._id || club.id || club.clubId || club.shortName || club.name || '').toString();
    return (club.conductedEvents || []).map(evt => ({ 
      ...evt, 
      clubName: club.name, 
      clubShortName: club.shortName,
      clubIcon: club.icon, 
      accentColor: club.accentColor, 
      clubId: cId 
    }));
  });

  const showcaseEvents = activeShowcaseClubTab === "all" 
    ? allConductedEvents 
    : allConductedEvents.filter(evt => evt.clubId === activeShowcaseClubTab.toString());

  return (
    <div className="min-h-screen bg-slate-50/60 font-sans text-slate-800 antialiased pb-20">
      
      {/* 1. Hero Banner Section */}
      <section className="bg-gradient-to-b from-white via-blue-50/30 to-slate-50/60 border-b border-slate-200/80 pt-10 pb-12 lg:pb-16">
        <div className="max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            
            {/* Left Hero Details */}
            <div className="lg:col-span-7 space-y-5 text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100/70 border border-blue-200 text-blue-700 text-xs sm:text-sm font-bold tracking-wider uppercase">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Communities of Innovation</span>
              </div>
              
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 tracking-tight leading-[1.15]">
                Student Clubs & <br className="hidden sm:block" />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600">
                  Communities
                </span>
              </h1>
              
              <p className="text-slate-600 text-base sm:text-lg leading-relaxed max-w-2xl">
                Explore the technical, creative, and innovation communities at K. K. Wagh Institute of Engineering Education and Research. Collaborate, innovate, lead, and build the future together.
              </p>

              {/* Stats Badges */}
              <div className="pt-2 flex flex-wrap items-center gap-3 sm:gap-4">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 border border-blue-200/80 text-blue-800 text-sm font-semibold shadow-xs">
                  <Users className="w-4 h-4 text-blue-600" />
                  <span><strong className="text-blue-900 font-extrabold">1,055+</strong> Active Members</span>
                </div>

                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 border border-blue-200/80 text-blue-800 text-sm font-semibold shadow-xs">
                  <Award className="w-4 h-4 text-blue-600" />
                  <span><strong className="text-blue-900 font-extrabold">20+</strong> Events Every Year</span>
                </div>
              </div>
            </div>

            {/* Right Hero Graphic Illustration */}
            <div className="lg:col-span-5 flex justify-center lg:justify-end">
              <div className="relative w-full max-w-[520px] flex items-center justify-center">
                <img 
                  src="/images/student-clubs-hero.png" 
                  alt="Student Clubs Communities Illustration"
                  className="w-full h-auto object-contain mix-blend-multiply transform hover:scale-[1.02] transition-transform duration-500"
                />
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 2. Main Content Container */}
      <div className="max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8 -mt-6">
        
        {/* Search + Filter Bar */}
        <div className="bg-white rounded-2xl p-3.5 sm:p-4 border border-slate-200 shadow-md flex flex-col md:flex-row gap-3 items-center justify-between mb-10 backdrop-blur-md">
          
          {/* Search Input */}
          <div className="relative w-full md:w-1/2 lg:w-7/12">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input 
              type="text" 
              placeholder="Search clubs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-11 border-slate-200 rounded-xl text-slate-800 placeholder:text-slate-400 focus-visible:ring-2 focus-visible:ring-blue-600 text-sm bg-slate-50/50"
            />
            {searchTerm && (
              <button 
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Filter Dropdowns */}
          <div className="flex w-full md:w-auto items-center gap-3">
            <div className="relative flex-1 md:w-44">
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full h-11 pl-3.5 pr-8 bg-slate-50/50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-600 cursor-pointer appearance-none"
              >
                <option value="All Categories">All Categories</option>
                <option value="Technical">Technical</option>
                <option value="Design">Design</option>
                <option value="Entrepreneurship">Entrepreneurship</option>
              </select>
              <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 text-xs">
                ▼
              </div>
            </div>

            <div className="relative flex-1 md:w-44">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full h-11 pl-3.5 pr-8 bg-slate-50/50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-600 cursor-pointer appearance-none"
              >
                <option value="default">Sort By: Featured</option>
                <option value="members">Sort By: Most Members</option>
                <option value="name">Sort By: Name (A-Z)</option>
              </select>
              <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 text-xs">
                ▼
              </div>
            </div>
          </div>

        </div>

        {/* INLINE COORDINATOR CONTROL BANNER */}
        {isCoordinator && (
          <div className="mb-8 p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl border border-blue-800">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-blue-500/20 backdrop-blur-md flex items-center justify-center font-bold text-2xl border border-blue-400/30 shrink-0">
                🛡️
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-base font-extrabold text-white">Coordinator Portal Active</span>
                  <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/40 text-xs font-extrabold px-2.5 py-0.5">
                    Admin Privileges
                  </Badge>
                </div>
                <p className="text-xs text-blue-200 mt-0.5">
                  You have full ability to create new clubs, edit details, update activities, conducted events, photos, or delete any student club.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 shrink-0">
              <Button
                onClick={handleCreateClub}
                className="rounded-2xl h-11 px-5 bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs sm:text-sm flex items-center gap-2 shadow-md"
              >
                <Plus className="w-4 h-4" />
                <span>+ Add New Student Club</span>
              </Button>
              
              <Link to="/manage-clubs">
                <Button variant="outline" className="rounded-2xl h-11 px-4 border-white/20 text-white hover:bg-white/10 font-bold text-xs">
                  ⚙️ Manage Clubs
                </Button>
              </Link>
            </div>
          </div>
        )}

        {/* 3. Clubs Cards Grid (Desktop 3 Cols, Mobile 1 Col) */}
        <div className="mb-14">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                Featured Student Clubs
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                Showing {filteredClubs.length} of {clubsList.length} active communities
              </p>
            </div>

            {bookmarkedClubs.length > 0 && (
              <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 text-xs py-1 px-3">
                🔖 {bookmarkedClubs.length} Saved Clubs
              </Badge>
            )}
          </div>

          {filteredClubs.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 shadow-sm max-w-md mx-auto">
              <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mx-auto mb-3">
                <Search className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">No clubs found</h3>
              <p className="text-sm text-slate-500 mt-1">Try tweaking your search term or category filters.</p>
              <Button 
                variant="outline" 
                className="mt-4 rounded-xl text-xs" 
                onClick={() => { setSearchTerm(''); setCategoryFilter('All Categories'); }}
              >
                Reset Filters
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
              {filteredClubs.map((club) => {
                const isBookmarked = bookmarkedClubs.includes(club.id || club.clubId || '');
                const cTargetId = club._id || club.id || club.clubId;

                return (
                  <div
                    key={cTargetId}
                    onClick={() => setSelectedClub(club)}
                    className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-7 shadow-xs hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 flex flex-col justify-between relative group cursor-pointer"
                  >
                    {/* Top Header Row */}
                    <div>
                      <div className="flex items-start justify-between gap-3">
                        
                        {/* Left: Circle Logo + Title & Category */}
                        <div className="flex items-start gap-3.5 flex-1">
                          <div 
                            className="w-16 h-16 rounded-full flex items-center justify-center text-white font-black text-xl shadow-xs shrink-0 tracking-tight overflow-hidden p-0.5 border border-slate-100"
                            style={{ backgroundColor: club.logoUrl ? '#FFFFFF' : club.accentColor }}
                          >
                            {club.logoUrl ? (
                              <img 
                                src={club.logoUrl} 
                                alt={`${club.name} Official Logo`}
                                className="w-full h-full object-contain rounded-full"
                              />
                            ) : club.shortName === 'CSI' ? (
                              <span className="font-extrabold text-lg tracking-tighter">CSI</span>
                            ) : (
                              <span className="text-2xl">{club.icon}</span>
                            )}
                          </div>

                          <div className="space-y-1">
                            <h3 className="text-base sm:text-lg font-extrabold text-slate-900 group-hover:text-blue-600 transition-colors leading-snug">
                              {club.fullTitle}
                            </h3>
                            <span 
                              style={{
                                backgroundColor: hexToRgba(club.accentColor, 0.14),
                                color: club.accentColor || '#2563EB'
                              }}
                              className="inline-block px-3 py-0.5 rounded-full text-xs font-extrabold tracking-wide"
                            >
                              {club.category}
                            </span>
                          </div>
                        </div>

                        {/* Top Right: Bookmark + Coordinator Quick Actions */}
                        <div className="flex items-center gap-1 shrink-0">
                          {isCoordinator && (
                            <>
                              <div className="flex items-center gap-0.5 bg-slate-100 p-0.5 rounded-lg border border-slate-200" title="Display Priority Order (Click arrows to re-order)">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleMoveClubOrder(club, 'up');
                                  }}
                                  className="p-1 rounded bg-white hover:bg-slate-200 text-slate-700 transition-colors"
                                  title="Move Higher Priority (Show Earlier)"
                                >
                                  <ArrowLeft className="w-3 h-3" />
                                </button>
                                <span className="text-[10px] font-black text-slate-700 px-1">
                                  #{club.order ?? (filteredClubs.indexOf(club) + 1)}
                                </span>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleMoveClubOrder(club, 'down');
                                  }}
                                  className="p-1 rounded bg-white hover:bg-slate-200 text-slate-700 transition-colors"
                                  title="Move Lower Priority (Show Later)"
                                >
                                  <ArrowRight className="w-3 h-3" />
                                </button>
                              </div>

                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setEditingClub(club);
                                  setEditModalTab('basic');
                                }}
                                className="p-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
                                title="Edit Club Details"
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={(e) => handleDeleteClub(cTargetId, e)}
                                className="p-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
                                title="Delete Club"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}

                          <button
                            onClick={(e) => toggleBookmark(cTargetId || '', e)}
                            className="p-1 text-slate-400 hover:text-amber-500 transition-colors"
                            title={isBookmarked ? "Remove bookmark" : "Bookmark club"}
                          >
                            <Bookmark className={`w-5 h-5 stroke-[1.5] ${isBookmarked ? 'fill-amber-400 text-amber-500' : ''}`} />
                          </button>
                        </div>

                      </div>

                      <ExpandableText 
                        text={club.description} 
                        clampLines={3} 
                        className="text-slate-500 text-xs sm:text-sm leading-relaxed mt-4 mb-3" 
                      />
                    </div>

                    <div className="space-y-4 pt-2">
                      <div className="flex items-center gap-6 text-slate-500 text-xs font-semibold">
                        <div className="flex items-center gap-1.5">
                          <Users className="w-4 h-4 text-slate-400 stroke-[1.75]" />
                          <span>{club.members} Members</span>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <Clock className="w-4 h-4 text-slate-400 stroke-[1.75]" />
                          <span>{club.established}</span>
                        </div>
                      </div>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedClub(club);
                        }}
                        style={{
                          borderColor: club.accentColor,
                          color: club.accentColor
                        }}
                        className="w-full h-11 rounded-2xl border-2 font-bold text-sm flex items-center justify-center gap-2 hover:bg-slate-50 transition-all duration-200 group-hover:shadow-xs"
                      >
                        <span>Explore Club</span>
                        <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                      </button>
                    </div>

                  </div>
                );
              })}
            </div>
          )}
        </div>







      </div>

      {/* 7. CLUB DETAILS MODAL WITH COORDINATOR ACTIONS */}
      {selectedClub && (
        <Dialog open={!!selectedClub} onOpenChange={() => setSelectedClub(null)}>
          <DialogContent className="max-w-3xl bg-white p-0 rounded-3xl overflow-hidden border-0 shadow-2xl">
            
            {/* Header Banner */}
            <div 
              className="p-6 sm:p-8 text-white relative flex flex-col justify-between min-h-[160px]"
              style={{ backgroundColor: selectedClub.accentColor }}
            >
              <div className="absolute top-4 right-4 flex items-center gap-2">
                {isCoordinator && (
                  <>
                    <button
                      onClick={() => {
                        const target = selectedClub;
                        setSelectedClub(null);
                        setEditingClub(target);
                        setEditModalTab('basic');
                      }}
                      className="px-3 py-1.5 rounded-xl bg-white/20 hover:bg-white/30 text-white text-xs font-bold flex items-center gap-1.5 backdrop-blur-md border border-white/30 transition-colors"
                    >
                      <Edit className="w-3.5 h-3.5" />
                      <span>Edit Club Details</span>
                    </button>

                    <button
                      onClick={() => {
                        const targetId = selectedClub._id || selectedClub.id || selectedClub.clubId;
                        handleDeleteClub(targetId);
                      }}
                      className="px-3 py-1.5 rounded-xl bg-red-600/80 hover:bg-red-600 text-white text-xs font-bold flex items-center gap-1.5 backdrop-blur-md transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete Club</span>
                    </button>
                  </>
                )}

                <button 
                  onClick={() => setSelectedClub(null)}
                  className="w-8 h-8 rounded-full bg-black/20 hover:bg-black/40 text-white flex items-center justify-center transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex items-center gap-4 pt-4">
                <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center text-3xl shadow-md overflow-hidden p-1">
                  {selectedClub.logoUrl ? (
                    <img src={selectedClub.logoUrl} alt={selectedClub.name} className="w-full h-full object-contain rounded-xl" />
                  ) : (
                    <span>{selectedClub.icon}</span>
                  )}
                </div>
                <div>
                  <Badge className="bg-white/20 text-white border-white/30 text-xs mb-1">
                    {selectedClub.category}
                  </Badge>
                  <DialogTitle className="text-2xl sm:text-3xl font-extrabold text-white">
                    {selectedClub.name}
                  </DialogTitle>
                  <p className="text-white/80 text-xs sm:text-sm font-medium">
                    {selectedClub.fullTitle}
                  </p>
                </div>
              </div>
            </div>

            {/* Modal Body Content */}
            <div className="p-6 sm:p-8 space-y-6 max-h-[75vh] overflow-y-auto">
              
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                  About Club
                </h4>
                <p className="text-slate-700 text-sm leading-relaxed">
                  {selectedClub.about}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-lg">
                    👤
                  </div>
                  <div>
                    <div className="text-[11px] font-bold text-slate-400 uppercase">Faculty Coordinator</div>
                    <div className="text-sm font-bold text-slate-900">{selectedClub.facultyCoordinator?.name}</div>
                    <div className="text-[11px] text-slate-500">{selectedClub.facultyCoordinator?.department}</div>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-lg">
                    👤
                  </div>
                  <div>
                    <div className="text-[11px] font-bold text-slate-400 uppercase">Student Lead / President</div>
                    <div className="text-sm font-bold text-slate-900">{selectedClub.studentLead?.name}</div>
                    <div className="text-[11px] text-slate-500">{selectedClub.studentLead?.department}</div>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                  Activities & Focus Areas
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {selectedClub.activities?.map((act, idx) => (
                    <div key={idx} className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs font-semibold text-slate-700">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                      <span>{act}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2.5">
                  Achievements & Recognition
                </h4>
                <div className="flex flex-wrap gap-2">
                  {selectedClub.achievements?.map((ach, idx) => (
                    <Badge key={idx} variant="outline" className="bg-amber-50/70 text-amber-800 border-amber-200 px-3 py-1.5 text-xs font-bold">
                      {ach}
                    </Badge>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-blue-600" />
                    <span>Events Conducted by {selectedClub.shortName}</span>
                  </h4>
                  <span className="text-xs text-slate-500 font-semibold">
                    Showing {Math.min(modalEventsLimit, selectedClub.conductedEvents?.length || 0)} of {selectedClub.conductedEvents?.length || 0} Events
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {selectedClub.conductedEvents?.slice(0, modalEventsLimit).map((evt) => (
                    <div 
                      key={evt._id || evt.title} 
                      className="bg-slate-50 rounded-2xl border border-slate-200/80 overflow-hidden flex flex-col justify-between group hover:shadow-md transition-shadow"
                    >
                      <div className="relative aspect-[16/9] overflow-hidden bg-slate-200">
                        <img 
                          src={evt.image} 
                          alt={evt.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute top-2.5 left-2.5 bg-black/60 backdrop-blur-md text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
                          {evt.category}
                        </div>
                      </div>

                      <div className="p-4 space-y-2">
                        <h5 className="text-sm font-extrabold text-slate-900 leading-snug">
                          {evt.title}
                        </h5>
                        <ExpandableText 
                          text={evt.description} 
                          clampLines={2} 
                          className="text-xs text-slate-600 leading-relaxed" 
                        />
                        
                        <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-[11px] font-semibold text-slate-500">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-slate-400" />
                            {evt.date}
                          </span>
                          <span className="flex items-center gap-1 text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full font-bold">
                            <Users className="w-3 h-3 text-emerald-600" />
                            {evt.participants}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {selectedClub.conductedEvents?.length > 4 && (
                  <div className="pt-4 text-center">
                    {modalEventsLimit < selectedClub.conductedEvents.length ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setModalEventsLimit(prev => prev + 4)}
                        className="rounded-xl border-blue-200 text-blue-700 bg-blue-50/50 hover:bg-blue-100 font-bold text-xs inline-flex items-center gap-1.5"
                      >
                        <span>Load More Events ({selectedClub.conductedEvents.length - modalEventsLimit} Remaining)</span>
                        <ChevronRight className="w-3.5 h-3.5 rotate-90" />
                      </Button>
                    ) : (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setModalEventsLimit(4)}
                        className="rounded-xl text-slate-500 hover:text-slate-800 font-bold text-xs inline-flex items-center gap-1.5"
                      >
                        <span>Show Less</span>
                        <ChevronRight className="w-3.5 h-3.5 -rotate-90" />
                      </Button>
                    )}
                  </div>
                )}
              </div>

              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
                  <ImageIcon className="w-3.5 h-3.5" />
                  <span>Club Gallery</span>
                </h4>
                <div className="grid grid-cols-3 gap-3">
                  {selectedClub.gallery?.map((imgUrl, idx) => (
                    <div key={idx} className="aspect-video rounded-xl overflow-hidden bg-slate-100 border border-slate-200 shadow-xs group">
                      <img 
                        src={imgUrl} 
                        alt={`${selectedClub.name} Activity ${idx + 1}`}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* CONNECT & SOCIAL MEDIA LINKS SECTION */}
              <div className="pt-5 border-t border-slate-200/80">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
                  <Share2 className="w-3.5 h-3.5 text-blue-600" />
                  <span>Connect & Official Handles</span>
                </h4>

                <div className="flex flex-wrap items-center gap-2.5">
                  {selectedClub.socialLinks?.linkedin && (
                    <a
                      href={selectedClub.socialLinks.linkedin.startsWith('http') ? selectedClub.socialLinks.linkedin : `https://${selectedClub.socialLinks.linkedin}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3.5 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs flex items-center gap-2 border border-blue-200/80 transition-all hover:scale-105"
                    >
                      <Linkedin className="w-4 h-4 text-blue-600 fill-blue-600" />
                      <span>LinkedIn Profile</span>
                      <ExternalLink className="w-3 h-3 text-blue-500" />
                    </a>
                  )}

                  {selectedClub.socialLinks?.instagram && (
                    <a
                      href={selectedClub.socialLinks.instagram.startsWith('http') ? selectedClub.socialLinks.instagram : `https://${selectedClub.socialLinks.instagram}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3.5 py-2 rounded-xl bg-pink-50 hover:bg-pink-100 text-pink-700 font-bold text-xs flex items-center gap-2 border border-pink-200/80 transition-all hover:scale-105"
                    >
                      <Instagram className="w-4 h-4 text-pink-600" />
                      <span>Instagram</span>
                      <ExternalLink className="w-3 h-3 text-pink-500" />
                    </a>
                  )}

                  {selectedClub.socialLinks?.whatsapp && (
                    <a
                      href={selectedClub.socialLinks.whatsapp.startsWith('http') ? selectedClub.socialLinks.whatsapp : `https://${selectedClub.socialLinks.whatsapp}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3.5 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-xs flex items-center gap-2 border border-emerald-200/80 transition-all hover:scale-105"
                    >
                      <MessageCircle className="w-4 h-4 text-emerald-600" />
                      <span>WhatsApp Group</span>
                      <ExternalLink className="w-3 h-3 text-emerald-500" />
                    </a>
                  )}

                  {selectedClub.socialLinks?.contactNo && (
                    <a
                      href={`tel:${selectedClub.socialLinks.contactNo}`}
                      className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs flex items-center gap-2 border border-slate-200 transition-all"
                    >
                      <Phone className="w-4 h-4 text-slate-600" />
                      <span>{selectedClub.socialLinks.contactNo}</span>
                    </a>
                  )}

                  {selectedClub.socialLinks?.email && (
                    <a
                      href={`mailto:${selectedClub.socialLinks.email}`}
                      className="px-3.5 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-800 font-bold text-xs flex items-center gap-2 border border-indigo-200/80 transition-all"
                    >
                      <Mail className="w-4 h-4 text-indigo-600" />
                      <span>{selectedClub.socialLinks.email}</span>
                    </a>
                  )}

                  {/* Fallback default handles if custom handles not set */}
                  {(!selectedClub.socialLinks || (!selectedClub.socialLinks.linkedin && !selectedClub.socialLinks.instagram && !selectedClub.socialLinks.whatsapp && !selectedClub.socialLinks.contactNo)) && (
                    <>
                      <a
                        href={`https://linkedin.com/company/kkwieer-${(selectedClub.shortName || selectedClub.name).toLowerCase()}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3.5 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs flex items-center gap-2 border border-blue-200/80 transition-all"
                      >
                        <Linkedin className="w-4 h-4 text-blue-600 fill-blue-600" />
                        <span>LinkedIn</span>
                      </a>
                      <a
                        href={`https://instagram.com/kkwieer_${(selectedClub.shortName || selectedClub.name).toLowerCase()}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3.5 py-2 rounded-xl bg-pink-50 hover:bg-pink-100 text-pink-700 font-bold text-xs flex items-center gap-2 border border-pink-200/80 transition-all"
                      >
                        <Instagram className="w-4 h-4 text-pink-600" />
                        <span>Instagram</span>
                      </a>
                      <a
                        href="https://chat.whatsapp.com/KKWIEERStudentClubs"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3.5 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-xs flex items-center gap-2 border border-emerald-200/80 transition-all"
                      >
                        <MessageCircle className="w-4 h-4 text-emerald-600" />
                        <span>WhatsApp Community</span>
                      </a>
                      <a
                        href="tel:+912532571001"
                        className="px-3.5 py-2 rounded-xl bg-slate-100 text-slate-800 font-bold text-xs flex items-center gap-2 border border-slate-200"
                      >
                        <Phone className="w-4 h-4 text-slate-600" />
                        <span>+91 253 257 1001</span>
                      </a>
                    </>
                  )}
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100">
                <div className="text-xs text-slate-500 font-medium">
                  👥 {selectedClub.members} Active Members • Established {selectedClub.established}
                </div>
              </div>

            </div>

          </DialogContent>
        </Dialog>
      )}

      {/* 8. EDIT / CREATE CLUB MODAL FOR COORDINATORS */}
      {editingClub && (
        <Dialog open={!!editingClub} onOpenChange={() => setEditingClub(null)}>
          <DialogContent className="max-w-3xl bg-white p-0 rounded-3xl overflow-hidden border-0 shadow-2xl">
            <div 
              className="p-6 text-white relative flex items-center justify-between"
              style={{ backgroundColor: editingClub.accentColor || '#2563EB' }}
            >
              <div>
                <DialogTitle className="text-xl font-extrabold text-white">
                  {editingClub._id ? `Edit ${editingClub.name}` : "Create New Student Club"}
                </DialogTitle>
                <DialogDescription className="text-xs text-white/80">
                  Update club details, coordinators, activities, achievements, conducted events & gallery photos.
                </DialogDescription>
              </div>
              <button 
                onClick={() => setEditingClub(null)}
                className="w-8 h-8 rounded-full bg-black/20 hover:bg-black/40 text-white flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center gap-1 px-6 pt-4 border-b border-slate-200 bg-slate-50/50 overflow-x-auto">
              <button
                onClick={() => setEditModalTab('basic')}
                className={`px-4 py-2.5 text-xs font-extrabold border-b-2 transition-all ${
                  editModalTab === 'basic' 
                    ? 'border-blue-600 text-blue-600 bg-white rounded-t-xl shadow-2xs' 
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                Basic Info
              </button>
              <button
                onClick={() => setEditModalTab('coordinators')}
                className={`px-4 py-2.5 text-xs font-extrabold border-b-2 transition-all ${
                  editModalTab === 'coordinators' 
                    ? 'border-blue-600 text-blue-600 bg-white rounded-t-xl shadow-2xs' 
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                Coordinators
              </button>
              <button
                onClick={() => setEditModalTab('activities')}
                className={`px-4 py-2.5 text-xs font-extrabold border-b-2 transition-all ${
                  editModalTab === 'activities' 
                    ? 'border-blue-600 text-blue-600 bg-white rounded-t-xl shadow-2xs' 
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                Focus Areas & Achievements
              </button>
              <button
                onClick={() => setEditModalTab('events')}
                className={`px-4 py-2.5 text-xs font-extrabold border-b-2 transition-all flex items-center gap-1.5 ${
                  editModalTab === 'events' 
                    ? 'border-blue-600 text-blue-600 bg-white rounded-t-xl shadow-2xs' 
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <Flame className="w-3.5 h-3.5 text-orange-500" />
                <span>Conducted Events ({editingClub.conductedEvents?.length || 0})</span>
              </button>
              <button
                onClick={() => setEditModalTab('gallery')}
                className={`px-4 py-2.5 text-xs font-extrabold border-b-2 transition-all ${
                  editModalTab === 'gallery' 
                    ? 'border-blue-600 text-blue-600 bg-white rounded-t-xl shadow-2xs' 
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                Gallery Photos
              </button>
              <button
                onClick={() => setEditModalTab('social')}
                className={`px-4 py-2.5 text-xs font-extrabold border-b-2 transition-all flex items-center gap-1.5 ${
                  editModalTab === 'social' 
                    ? 'border-blue-600 text-blue-600 bg-white rounded-t-xl shadow-2xs' 
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <Share2 className="w-3.5 h-3.5 text-blue-600" />
                <span>Social & Contact</span>
              </button>
            </div>

            <div className="p-6 max-h-[60vh] overflow-y-auto space-y-4">
              {editModalTab === 'basic' && (
                <div className="space-y-4 text-xs">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Club Short Name *</label>
                      <Input
                        value={editingClub.name}
                        onChange={(e) => setEditingClub({ ...editingClub, name: e.target.value, shortName: e.target.value })}
                        placeholder="e.g. CSI"
                        className="h-10 text-xs rounded-xl"
                      />
                    </div>
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Category *</label>
                      <select
                        value={editingClub.category}
                        onChange={(e) => setEditingClub({ ...editingClub, category: e.target.value as any })}
                        className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
                      >
                        <option value="Technical">Technical</option>
                        <option value="Design">Design</option>
                        <option value="Entrepreneurship">Entrepreneurship</option>
                        <option value="Cultural">Cultural</option>
                        <option value="Innovation">Innovation</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Full Title *</label>
                    <Input
                      value={editingClub.fullTitle}
                      onChange={(e) => setEditingClub({ ...editingClub, fullTitle: e.target.value })}
                      placeholder="e.g. CSI – Computer Society of India"
                      className="h-10 text-xs rounded-xl"
                    />
                  </div>

                  <div className="p-3.5 rounded-2xl bg-blue-50/50 border border-blue-100 space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="font-extrabold text-blue-900 block text-xs flex items-center gap-1.5">
                        <Cloud className="w-3.5 h-3.5 text-blue-600" />
                        <span>Official Club Logo (Cloudinary Upload / URL)</span>
                      </label>
                      {editingClub.logoUrl && (
                        <button 
                          type="button" 
                          onClick={() => setEditingClub({ ...editingClub, logoUrl: "" })} 
                          className="text-[11px] font-bold text-red-600 hover:text-red-800 underline"
                        >
                          Clear / Delete Logo
                        </button>
                      )}
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full border border-slate-200 bg-white flex items-center justify-center shrink-0 overflow-hidden p-0.5 shadow-2xs">
                        {editingClub.logoUrl ? (
                          <img src={editingClub.logoUrl} alt="Logo preview" className="w-full h-full object-contain rounded-full" />
                        ) : (
                          <span className="text-xl">{editingClub.icon || '🖼️'}</span>
                        )}
                      </div>

                      <Input
                        value={editingClub.logoUrl || ""}
                        onChange={(e) => setEditingClub({ ...editingClub, logoUrl: e.target.value })}
                        placeholder="Cloudinary URL (https://res.cloudinary.com/...)"
                        className="h-10 text-xs rounded-xl bg-white flex-1"
                      />

                      <label className="cursor-pointer shrink-0">
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => handleFileUploadToCloudinary(e, (url) => setEditingClub({ ...editingClub, logoUrl: url }))}
                        />
                        <div className="h-10 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition-colors">
                          <Upload className="w-3.5 h-3.5" />
                          <span>Upload File</span>
                        </div>
                      </label>
                    </div>
                    <p className="text-[11px] text-slate-500">
                      Click <strong>Upload File</strong> to upload directly to Cloudinary CDN or paste an image URL.
                    </p>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Accent Color (Hex)</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={editingClub.accentColor}
                          onChange={(e) => setEditingClub({ ...editingClub, accentColor: e.target.value })}
                          className="w-10 h-10 rounded-xl border border-slate-200 cursor-pointer"
                        />
                        <Input
                          value={editingClub.accentColor}
                          onChange={(e) => setEditingClub({ ...editingClub, accentColor: e.target.value })}
                          className="h-10 text-xs rounded-xl"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Icon / Emoji</label>
                      <Input
                        value={editingClub.icon}
                        onChange={(e) => setEditingClub({ ...editingClub, icon: e.target.value })}
                        placeholder="e.g. 💻"
                        className="h-10 text-xs rounded-xl"
                      />
                    </div>
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Active Members</label>
                      <Input
                        type="number"
                        value={editingClub.members}
                        onChange={(e) => setEditingClub({ ...editingClub, members: Number(e.target.value) })}
                        className="h-10 text-xs rounded-xl"
                      />
                    </div>
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Display Priority Order (1 = Top / First)</label>
                      <Input
                        type="number"
                        value={editingClub.order ?? 1}
                        onChange={(e) => setEditingClub({ ...editingClub, order: Number(e.target.value) })}
                        placeholder="1"
                        className="h-10 text-xs rounded-xl font-extrabold text-blue-700 border-blue-200 bg-blue-50/30"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Short Card Description *</label>
                    <textarea
                      rows={2}
                      value={editingClub.description}
                      onChange={(e) => setEditingClub({ ...editingClub, description: e.target.value })}
                      placeholder="Promoting technical excellence through workshops..."
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Detailed About Club *</label>
                    <textarea
                      rows={4}
                      value={editingClub.about}
                      onChange={(e) => setEditingClub({ ...editingClub, about: e.target.value })}
                      placeholder="Full comprehensive history, scope, and objectives of the club..."
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                    />
                  </div>
                </div>
              )}

              {editModalTab === 'coordinators' && (
                <div className="space-y-6 text-xs">
                  <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-100 space-y-3">
                    <h4 className="font-extrabold text-blue-900 text-sm">👤 Faculty Coordinator Details</h4>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="font-bold text-slate-700 block mb-1">Faculty Name *</label>
                        <Input
                          value={editingClub.facultyCoordinator?.name}
                          onChange={(e) => setEditingClub({
                            ...editingClub,
                            facultyCoordinator: { ...editingClub.facultyCoordinator, name: e.target.value }
                          })}
                          placeholder="e.g. Prof. S. P. Agnihotri"
                          className="h-10 text-xs rounded-xl bg-white"
                        />
                      </div>
                      <div>
                        <label className="font-bold text-slate-700 block mb-1">Designation</label>
                        <Input
                          value={editingClub.facultyCoordinator?.designation}
                          onChange={(e) => setEditingClub({
                            ...editingClub,
                            facultyCoordinator: { ...editingClub.facultyCoordinator, designation: e.target.value }
                          })}
                          placeholder="Faculty Coordinator"
                          className="h-10 text-xs rounded-xl bg-white"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Department *</label>
                      <Input
                        value={editingClub.facultyCoordinator?.department}
                        onChange={(e) => setEditingClub({
                          ...editingClub,
                          facultyCoordinator: { ...editingClub.facultyCoordinator, department: e.target.value }
                        })}
                        placeholder="Dept. of Computer Engineering"
                        className="h-10 text-xs rounded-xl bg-white"
                      />
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-purple-50/60 border border-purple-100 space-y-3">
                    <h4 className="font-extrabold text-purple-900 text-sm">👤 Student Lead / President Details</h4>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="font-bold text-slate-700 block mb-1">Student Lead Name *</label>
                        <Input
                          value={editingClub.studentLead?.name}
                          onChange={(e) => setEditingClub({
                            ...editingClub,
                            studentLead: { ...editingClub.studentLead, name: e.target.value }
                          })}
                          placeholder="e.g. Omkar Patel"
                          className="h-10 text-xs rounded-xl bg-white"
                        />
                      </div>
                      <div>
                        <label className="font-bold text-slate-700 block mb-1">Role</label>
                        <Input
                          value={editingClub.studentLead?.role}
                          onChange={(e) => setEditingClub({
                            ...editingClub,
                            studentLead: { ...editingClub.studentLead, role: e.target.value }
                          })}
                          placeholder="President"
                          className="h-10 text-xs rounded-xl bg-white"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Department *</label>
                      <Input
                        value={editingClub.studentLead?.department}
                        onChange={(e) => setEditingClub({
                          ...editingClub,
                          studentLead: { ...editingClub.studentLead, department: e.target.value }
                        })}
                        placeholder="B.E. Computer Engineering"
                        className="h-10 text-xs rounded-xl bg-white"
                      />
                    </div>
                  </div>
                </div>
              )}

              {editModalTab === 'activities' && (
                <div className="space-y-6 text-xs">
                  <div>
                    <label className="font-extrabold text-slate-800 text-sm block mb-2">Activities & Focus Areas</label>

                    <div className="flex gap-2 mb-3">
                      <Input
                        value={newActivityInput}
                        onChange={(e) => setNewActivityInput(e.target.value)}
                        placeholder="Add new activity (e.g. Hackathons)..."
                        className="h-10 text-xs rounded-xl"
                      />
                      <Button onClick={handleAddActivity} className="rounded-xl text-xs font-bold">Add</Button>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {editingClub.activities?.map((act, idx) => (
                        <span key={idx} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 text-slate-800 font-semibold text-xs border">
                          <span>✓ {act}</span>
                          <button onClick={() => handleRemoveActivity(idx)} className="text-red-500 hover:text-red-700">
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-100">
                    <label className="font-extrabold text-slate-800 text-sm block mb-2">Achievements & Recognition Badges</label>

                    <div className="flex gap-2 mb-3">
                      <Input
                        value={newAchievementInput}
                        onChange={(e) => setNewAchievementInput(e.target.value)}
                        placeholder="Add achievement (e.g. 🏆 SIH Finalist)..."
                        className="h-10 text-xs rounded-xl"
                      />
                      <Button onClick={handleAddAchievement} className="rounded-xl text-xs font-bold">Add</Button>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {editingClub.achievements?.map((ach, idx) => (
                        <span key={idx} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 text-amber-800 font-bold text-xs border border-amber-200">
                          <span>{ach}</span>
                          <button onClick={() => handleRemoveAchievement(idx)} className="text-red-500 hover:text-red-700">
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {editModalTab === 'events' && (
                <div className="space-y-6 text-xs">
                  <div className="p-4 rounded-2xl bg-orange-50/60 border border-orange-200/80 space-y-3">
                    <h4 className="font-extrabold text-orange-900 text-sm flex items-center gap-2">
                      <Flame className="w-4 h-4 text-orange-500" />
                      <span>Add New Conducted Event</span>
                    </h4>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="font-bold text-slate-700 block mb-1">Event Title *</label>
                        <Input
                          value={newEventTitle}
                          onChange={(e) => setNewEventTitle(e.target.value)}
                          placeholder="e.g. CodeSprint 5.0 Hackathon"
                          className="h-10 text-xs rounded-xl bg-white"
                        />
                      </div>
                      <div>
                        <label className="font-bold text-slate-700 block mb-1">Event Date *</label>
                        <Input
                          value={newEventDate}
                          onChange={(e) => setNewEventDate(e.target.value)}
                          placeholder="e.g. 15-16 Feb 2024"
                          className="h-10 text-xs rounded-xl bg-white"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="font-bold text-slate-700 block mb-1">Category Tag</label>
                        <Input
                          value={newEventCategory}
                          onChange={(e) => setNewEventCategory(e.target.value)}
                          placeholder="e.g. Hackathon / Workshop"
                          className="h-10 text-xs rounded-xl bg-white"
                        />
                      </div>
                      <div>
                        <label className="font-bold text-slate-700 block mb-1">Participants Count</label>
                        <Input
                          value={newEventParticipants}
                          onChange={(e) => setNewEventParticipants(e.target.value)}
                          placeholder="e.g. 200+ Coders"
                          className="h-10 text-xs rounded-xl bg-white"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Event Photo Image (Cloudinary Upload / URL) *</label>
                      <div className="flex gap-2">
                        <Input
                          value={newEventImage}
                          onChange={(e) => setNewEventImage(e.target.value)}
                          placeholder="https://res.cloudinary.com/... or image URL"
                          className="h-10 text-xs rounded-xl bg-white flex-1"
                        />
                        <label className="cursor-pointer shrink-0">
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => handleFileUploadToCloudinary(e, (url) => setNewEventImage(url))}
                          />
                          <div className="h-10 px-3 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition-colors">
                            <Upload className="w-3.5 h-3.5" />
                            <span>Upload Photo</span>
                          </div>
                        </label>
                      </div>
                      {newEventImage && (
                        <div className="mt-2 w-32 h-20 rounded-xl overflow-hidden border border-slate-200 bg-slate-100">
                          <img src={newEventImage} alt="Event Preview" className="w-full h-full object-cover" />
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Event Description</label>
                      <textarea
                        rows={2}
                        value={newEventDescription}
                        onChange={(e) => setNewEventDescription(e.target.value)}
                        placeholder="24-Hour non-stop coding hackathon focusing on AI solutions..."
                        className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs"
                      />
                    </div>

                    <Button onClick={handleAddConductedEvent} className="w-full rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs">
                      Add Conducted Event
                    </Button>
                  </div>

                  <div>
                    <h4 className="font-extrabold text-slate-800 text-sm mb-3">
                      Existing Conducted Events ({editingClub.conductedEvents?.length || 0})
                    </h4>

                    {(!editingClub.conductedEvents || editingClub.conductedEvents.length === 0) ? (
                      <p className="text-slate-400 italic">No conducted events added yet.</p>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {editingClub.conductedEvents.map((evt, idx) => (
                          <div key={idx} className="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex items-start gap-3 relative group">
                            <img src={evt.image} alt={evt.title} className="w-16 h-16 rounded-xl object-cover shrink-0" />
                            <div className="flex-1 pr-6">
                              <div className="font-bold text-slate-900 line-clamp-1">{evt.title}</div>
                              <div className="text-[11px] text-slate-500">{evt.date} • {evt.participants}</div>
                              <Badge variant="outline" className="text-[10px] py-0 px-1.5 mt-1">{evt.category}</Badge>
                            </div>
                            <button
                              onClick={() => handleRemoveConductedEvent(idx)}
                              className="absolute top-2 right-2 text-red-500 hover:text-red-700"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {editModalTab === 'gallery' && (
                <div className="space-y-4 text-xs">
                  <label className="font-extrabold text-slate-800 text-sm block">Club Photo Gallery URLs</label>

                  <div className="flex gap-2 mb-3">
                    <Input
                      value={newGalleryInput}
                      onChange={(e) => setNewGalleryInput(e.target.value)}
                      placeholder="Add image URL (https://res.cloudinary.com/...)"
                      className="h-10 text-xs rounded-xl flex-1"
                    />
                    <label className="cursor-pointer shrink-0">
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleFileUploadToCloudinary(e, (url) => {
                          if (editingClub) {
                            setEditingClub({ ...editingClub, gallery: [...(editingClub.gallery || []), url] });
                            toast.success("☁️ Gallery photo uploaded to Cloudinary!");
                          }
                        })}
                      />
                      <div className="h-10 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition-colors">
                        <Upload className="w-3.5 h-3.5" />
                        <span>Upload File</span>
                      </div>
                    </label>
                    <Button onClick={handleAddGalleryImage} className="rounded-xl text-xs font-bold shrink-0">Add URL</Button>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    {editingClub.gallery?.map((imgUrl, idx) => (
                      <div key={idx} className="relative aspect-video rounded-xl overflow-hidden bg-slate-100 border border-slate-200 group">
                        <img src={imgUrl} alt={`Gallery ${idx}`} className="w-full h-full object-cover" />
                        <button
                          onClick={() => handleRemoveGalleryImage(idx)}
                          className="absolute top-1.5 right-1.5 p-1 bg-red-600 text-white rounded-full opacity-90 hover:opacity-100"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {editModalTab === 'social' && (
                <div className="space-y-4 text-xs">
                  <h4 className="font-extrabold text-slate-900 text-sm">
                    Social Media Handles & Official Contact Details
                  </h4>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">LinkedIn Profile / Page URL</label>
                    <Input
                      value={editingClub.socialLinks?.linkedin || ""}
                      onChange={(e) => setEditingClub({
                        ...editingClub,
                        socialLinks: { ...editingClub.socialLinks, linkedin: e.target.value }
                      })}
                      placeholder="https://linkedin.com/company/csi-kkwieer"
                      className="h-10 text-xs rounded-xl"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Instagram Account URL</label>
                    <Input
                      value={editingClub.socialLinks?.instagram || ""}
                      onChange={(e) => setEditingClub({
                        ...editingClub,
                        socialLinks: { ...editingClub.socialLinks, instagram: e.target.value }
                      })}
                      placeholder="https://instagram.com/csi_kkwieer"
                      className="h-10 text-xs rounded-xl"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">WhatsApp Group / Community Link</label>
                    <Input
                      value={editingClub.socialLinks?.whatsapp || ""}
                      onChange={(e) => setEditingClub({
                        ...editingClub,
                        socialLinks: { ...editingClub.socialLinks, whatsapp: e.target.value }
                      })}
                      placeholder="https://chat.whatsapp.com/..."
                      className="h-10 text-xs rounded-xl"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Official Contact Phone Number</label>
                      <Input
                        value={editingClub.socialLinks?.contactNo || ""}
                        onChange={(e) => setEditingClub({
                          ...editingClub,
                          socialLinks: { ...editingClub.socialLinks, contactNo: e.target.value }
                        })}
                        placeholder="+91 98765 43210"
                        className="h-10 text-xs rounded-xl"
                      />
                    </div>

                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Official Club Email</label>
                      <Input
                        value={editingClub.socialLinks?.email || ""}
                        onChange={(e) => setEditingClub({
                          ...editingClub,
                          socialLinks: { ...editingClub.socialLinks, email: e.target.value }
                        })}
                        placeholder="csi@kkwagh.edu.in"
                        className="h-10 text-xs rounded-xl"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-end gap-3">
              <Button variant="ghost" onClick={() => setEditingClub(null)} className="rounded-xl text-xs">
                Cancel
              </Button>
              <Button 
                onClick={handleSaveEditedClub}
                style={{ backgroundColor: editingClub.accentColor || '#2563EB' }}
                className="rounded-xl px-6 text-xs font-extrabold text-white shadow-md hover:opacity-90"
              >
                Save Club Changes
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* 9. JOIN CLUB FORM MODAL */}
      <Dialog open={joinModalOpen} onOpenChange={setJoinModalOpen}>
        <DialogContent className="max-w-md bg-white p-6 rounded-3xl shadow-2xl border-0">
          <DialogHeader>
            <DialogTitle className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
              <GraduationCap className="w-5 h-5 text-blue-600" />
              <span>Join {selectedClubForJoin || "Student Club"}</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Submit your details to apply for membership. Club coordinators will contact you via email.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleJoinSubmit} className="space-y-4 pt-2">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Select Club</label>
              <select
                value={selectedClubForJoin}
                onChange={(e) => setSelectedClubForJoin(e.target.value)}
                className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800"
              >
                {clubsList.map(c => (
                  <option key={c.id || c.clubId || c._id} value={c.name}>{c.fullTitle}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Full Name *</label>
              <Input
                required
                placeholder="e.g. Omkar Patil"
                value={applicantName}
                onChange={(e) => setApplicantName(e.target.value)}
                className="h-10 text-xs rounded-xl border-slate-200 bg-slate-50/50"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">College Email *</label>
              <Input
                required
                type="email"
                placeholder="student@kkwagh.edu.in"
                value={applicantEmail}
                onChange={(e) => setApplicantEmail(e.target.value)}
                className="h-10 text-xs rounded-xl border-slate-200 bg-slate-50/50"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Department</label>
                <Input
                  placeholder="e.g. Computer / IT"
                  value={applicantDept}
                  onChange={(e) => setApplicantDept(e.target.value)}
                  className="h-10 text-xs rounded-xl border-slate-200 bg-slate-50/50"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Year of Study</label>
                <select
                  value={applicantYear}
                  onChange={(e) => setApplicantYear(e.target.value)}
                  className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800"
                >
                  <option value="FE">First Year (FE)</option>
                  <option value="SE">Second Year (SE)</option>
                  <option value="TE">Third Year (TE)</option>
                  <option value="BE">Final Year (BE)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Why do you want to join?</label>
              <textarea
                rows={2}
                placeholder="Briefly state your interests or relevant skills..."
                value={applicantReason}
                onChange={(e) => setApplicantReason(e.target.value)}
                className="w-full p-2.5 text-xs bg-slate-50/50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <Button 
                type="button" 
                variant="ghost" 
                className="rounded-xl text-xs h-10" 
                onClick={() => setJoinModalOpen(false)}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                className="rounded-xl text-xs h-10 bg-blue-600 hover:bg-blue-700 text-white font-bold px-5"
              >
                Submit Application
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* 10. EDIT UPCOMING EVENT MODAL FOR COORDINATORS */}
      {editingUpcomingEvent && (
        <Dialog open={!!editingUpcomingEvent} onOpenChange={() => setEditingUpcomingEvent(null)}>
          <DialogContent className="max-w-md bg-white p-6 rounded-3xl shadow-2xl border-0">
            <DialogHeader>
              <DialogTitle className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-blue-600" />
                <span>{upcomingEventsList.some(e => e.id === editingUpcomingEvent.id) ? "Edit Upcoming Event" : "Add New Upcoming Event"}</span>
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500">
                Update upcoming event title, date, location, host, and timing.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 pt-2 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Date Number *</label>
                  <Input
                    value={editingUpcomingEvent.date}
                    onChange={(e) => setEditingUpcomingEvent({ ...editingUpcomingEvent, date: e.target.value })}
                    placeholder="e.g. 24"
                    className="h-10 text-xs rounded-xl"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Month Short Name *</label>
                  <Input
                    value={editingUpcomingEvent.month}
                    onChange={(e) => setEditingUpcomingEvent({ ...editingUpcomingEvent, month: e.target.value.toUpperCase() })}
                    placeholder="e.g. MAY / JUN"
                    className="h-10 text-xs rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Event Title *</label>
                <Input
                  value={editingUpcomingEvent.title}
                  onChange={(e) => setEditingUpcomingEvent({ ...editingUpcomingEvent, title: e.target.value })}
                  placeholder="e.g. CodeSprint 5.0 Hackathon"
                  className="h-10 text-xs rounded-xl"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Host / Organized By *</label>
                <Input
                  value={editingUpcomingEvent.host}
                  onChange={(e) => setEditingUpcomingEvent({ ...editingUpcomingEvent, host: e.target.value })}
                  placeholder="e.g. By Debuggers Club"
                  className="h-10 text-xs rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Location *</label>
                  <Input
                    value={editingUpcomingEvent.location}
                    onChange={(e) => setEditingUpcomingEvent({ ...editingUpcomingEvent, location: e.target.value })}
                    placeholder="e.g. IDEA Lab"
                    className="h-10 text-xs rounded-xl"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Timing *</label>
                  <Input
                    value={editingUpcomingEvent.time}
                    onChange={(e) => setEditingUpcomingEvent({ ...editingUpcomingEvent, time: e.target.value })}
                    placeholder="e.g. 10:00 AM"
                    className="h-10 text-xs rounded-xl"
                  />
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <Button variant="ghost" onClick={() => setEditingUpcomingEvent(null)} className="rounded-xl text-xs">
                  Cancel
                </Button>
                <Button 
                  onClick={() => {
                    if (!editingUpcomingEvent.title || !editingUpcomingEvent.date) {
                      toast.error("Title and date are required");
                      return;
                    }
                    setUpcomingEventsList(prev => {
                      const exists = prev.some(e => e.id === editingUpcomingEvent.id);
                      if (exists) {
                        return prev.map(e => e.id === editingUpcomingEvent.id ? editingUpcomingEvent : e);
                      }
                      return [...prev, editingUpcomingEvent];
                    });
                    toast.success("Upcoming event saved successfully!");
                    setEditingUpcomingEvent(null);
                  }} 
                  className="rounded-xl text-xs bg-blue-600 hover:bg-blue-700 text-white font-bold px-5"
                >
                  Save Event
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* 11. EDIT COLLECTIVE ACHIEVEMENT STAT MODAL FOR COORDINATORS */}
      {editingAchievementStat && (
        <Dialog open={!!editingAchievementStat} onOpenChange={() => setEditingAchievementStat(null)}>
          <DialogContent className="max-w-md bg-white p-6 rounded-3xl shadow-2xl border-0">
            <DialogHeader>
              <DialogTitle className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
                <Trophy className="w-5 h-5 text-amber-500" />
                <span>{collectiveAchievementsList.some(a => a.id === editingAchievementStat.id) ? "Edit Achievement Stat" : "Add Achievement Stat"}</span>
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500">
                Update statistical metric number, label, and card styling.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 pt-2 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Metric Number *</label>
                  <Input
                    value={editingAchievementStat.number}
                    onChange={(e) => setEditingAchievementStat({ ...editingAchievementStat, number: e.target.value })}
                    placeholder="e.g. 12+ or 1,000+"
                    className="h-10 text-xs rounded-xl"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Icon Style</label>
                  <select
                    value={editingAchievementStat.iconType}
                    onChange={(e) => setEditingAchievementStat({ ...editingAchievementStat, iconType: e.target.value as any })}
                    className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
                  >
                    <option value="trophy">🏆 Trophy</option>
                    <option value="award">🏅 Award Badge</option>
                    <option value="users">👥 Active Members</option>
                    <option value="calendar">📅 Calendar Events</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Label / Title *</label>
                <Input
                  value={editingAchievementStat.label}
                  onChange={(e) => setEditingAchievementStat({ ...editingAchievementStat, label: e.target.value })}
                  placeholder="e.g. National Awards"
                  className="h-10 text-xs rounded-xl"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Card Theme Style</label>
                <select
                  value={editingAchievementStat.color}
                  onChange={(e) => setEditingAchievementStat({ ...editingAchievementStat, color: e.target.value })}
                  className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
                >
                  <option value="text-amber-500 bg-amber-50 border-amber-100">Gold / Amber</option>
                  <option value="text-red-500 bg-red-50 border-red-100">Red / Crimson</option>
                  <option value="text-blue-500 bg-blue-50 border-blue-100">Blue / Ocean</option>
                  <option value="text-indigo-500 bg-indigo-50 border-indigo-100">Indigo / Purple</option>
                  <option value="text-emerald-500 bg-emerald-50 border-emerald-100">Emerald / Green</option>
                </select>
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <Button variant="ghost" onClick={() => setEditingAchievementStat(null)} className="rounded-xl text-xs">
                  Cancel
                </Button>
                <Button 
                  onClick={() => {
                    if (!editingAchievementStat.number || !editingAchievementStat.label) {
                      toast.error("Number and label are required");
                      return;
                    }
                    setCollectiveAchievementsList(prev => {
                      const exists = prev.some(a => a.id === editingAchievementStat.id);
                      if (exists) {
                        return prev.map(a => a.id === editingAchievementStat.id ? editingAchievementStat : a);
                      }
                      return [...prev, editingAchievementStat];
                    });
                    toast.success("Achievement stat saved successfully!");
                    setEditingAchievementStat(null);
                  }} 
                  className="rounded-xl text-xs bg-amber-600 hover:bg-amber-700 text-white font-bold px-5"
                >
                  Save Stat
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

    </div>
  );
};

export default StudentClubs;
