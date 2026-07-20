import React, { useState, useEffect } from "react";
import {
  Code,
  Lightbulb,
  BookOpen,
  Users,
  Award,
  ChevronRight,
  Github,
  Linkedin,
  Rocket,
  ShieldCheck,
  Edit3,
  FlaskConical,
  Plus,
  Trash2,
  Upload,
  X,
  RefreshCw,
  Sparkles,
  Check,
  Mail,
  SlidersHorizontal,
  FileImage
} from "lucide-react";
import {
  getTeamMembers,
  createTeamMember,
  updateTeamMember,
  deleteTeamMember,
  seedTeamMembers,
  TeamMember
} from "../api/teamMemberService";

// Fallback initial data in case backend API is connecting or seeding
const DEFAULT_MEMBERS: TeamMember[] = [
  {
    _id: "default-hod-1",
    name: "Dr. Yogita Pagar-Bhise",
    role: "Head of Department (HOD)",
    category: "hod",
    tagline: "PROJECT GUIDE",
    department: "Computer Science and Design Department, K. K. Wagh Institute of Engineering Education and Research",
    quote: "Innovation begins when students are trusted to solve real-world problems.",
    description: "Visionary leadership guiding department initiatives and fostering student innovation.",
    image: "/images/yogita_pagar.jpg",
    badgeColor: "blue",
    displayOrder: 1,
    socialLinks: { email: "hod-csd@kkwagh.edu.in" }
  },
  {
    _id: "default-guide-1",
    name: "Prof. Amit S. Patil",
    role: "Technical Guide",
    category: "guide",
    tagline: "Technical Guide",
    description: "Guiding the technical architecture and development.",
    image: "/images/team/amit_patil.jpg",
    badgeColor: "blue",
    displayOrder: 2,
    socialLinks: { email: "aspatil@kkwagh.edu.in" }
  },
  {
    _id: "default-guide-2",
    name: "Prof. Pooja R. Deshmukh",
    role: "Innovation Guide",
    category: "guide",
    tagline: "Innovation Guide",
    description: "Inspiring innovation and problem-solving approaches.",
    image: "/images/team/pooja_deshmukh.jpg",
    badgeColor: "emerald",
    displayOrder: 3,
    socialLinks: { email: "prdeshmukh@kkwagh.edu.in" }
  },
  {
    _id: "default-guide-3",
    name: "Prof. Mayur B. Shinde",
    role: "Research Guide",
    category: "guide",
    tagline: "Research Guide",
    description: "Supporting research, validation and quality improvement.",
    image: "/images/team/mayur_shinde.jpg",
    badgeColor: "purple",
    displayOrder: 4,
    socialLinks: { email: "mbshinde@kkwagh.edu.in" }
  },
  {
    _id: "default-guide-4",
    name: "Prof. Neha V. Jadhav",
    role: "Faculty Guide",
    category: "guide",
    tagline: "Faculty Guide",
    description: "Providing academic support and overall mentorship.",
    image: "/images/team/neha_jadhav.jpg",
    badgeColor: "orange",
    displayOrder: 5,
    socialLinks: { email: "nvjadhav@kkwagh.edu.in" }
  },
  {
    _id: "default-student-1",
    name: "Kalpesh Bire",
    role: "Full Stack Developer",
    category: "student",
    tagline: "Full Stack Developer",
    description: "Developed the backend, frontend, system architecture and core functionalities.",
    image: "/images/team/kalpesh.jpg",
    badgeColor: "blue",
    displayOrder: 6,
    socialLinks: {
      github: "https://github.com/KalpeshBire",
      linkedin: "https://linkedin.com/in/kalpeshbire",
      email: "kalpeshbire@kkwagh.edu.in"
    }
  },
  {
    _id: "default-student-2",
    name: "Roshan Gaikwad",
    role: "Full Stack Developer",
    category: "student",
    tagline: "Full Stack Developer",
    description: "Developed the backend, frontend, system architecture and core functionalities.",
    image: "/images/team/roshan.jpg",
    badgeColor: "blue",
    displayOrder: 7,
    socialLinks: {
      github: "https://github.com/roshangaikwad",
      linkedin: "https://linkedin.com/in/roshangaikwad",
      email: "roshangaikwad@kkwagh.edu.in"
    }
  }
];

// Reusable Section Header Component
const SectionHeader: React.FC<{ title: string; subtitle?: string }> = ({ title, subtitle }) => (
  <div className="text-center space-y-2 mb-6">
    <h3 className="text-xl sm:text-2xl lg:text-3xl font-black text-[#0F172A] tracking-tight">
      {title}
    </h3>
    <div className="w-16 h-[3px] bg-[#2563EB] mx-auto rounded-full" />
    {subtitle && (
      <p className="text-xs sm:text-sm text-[#64748B] font-medium leading-relaxed max-w-xl mx-auto">
        {subtitle}
      </p>
    )}
  </div>
);

const DevelopmentTeam: React.FC = () => {
  const [members, setMembers] = useState<TeamMember[]>(DEFAULT_MEMBERS);
  const [loading, setLoading] = useState<boolean>(true);
  const [isCoordinator, setIsCoordinator] = useState<boolean>(false);
  const [isManageMode, setIsManageMode] = useState<boolean>(false);
  
  // Check if logged in user is a coordinator, head, or admin
  useEffect(() => {
    try {
      const raw = localStorage.getItem("idea_hub_user");
      const token = localStorage.getItem("idea_hub_token");
      if (raw && token) {
        const parsed = JSON.parse(raw);
        const allowedRoles = ["coordinator", "head", "admin"];
        const userRole = (parsed.role || "").toLowerCase();
        if (allowedRoles.includes(userRole)) {
          setIsCoordinator(true);
        } else {
          setIsCoordinator(false);
        }
      } else {
        setIsCoordinator(false);
      }
    } catch (e) {
      setIsCoordinator(false);
    }
  }, []);
  
  // Modal & Form State for CRUD
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // Form inputs
  const [formData, setFormData] = useState({
    name: "",
    role: "",
    category: "guide" as "hod" | "guide" | "student" | "custom",
    tagline: "",
    department: "",
    quote: "",
    description: "",
    badgeColor: "blue",
    github: "",
    linkedin: "",
    email: "",
    displayOrder: 0
  });

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");

  // Fetch Team Members from Backend API
  const fetchMembers = async () => {
    try {
      setLoading(true);
      const data = await getTeamMembers();
      if (data && data.length > 0) {
        setMembers(data);
      } else {
        setMembers(DEFAULT_MEMBERS);
      }
    } catch (err) {
      console.warn("Using fallback default team members data due to network/API status", err);
      setMembers(DEFAULT_MEMBERS);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, []);

  // Open Modal for Create
  const handleAddNew = () => {
    setEditingMember(null);
    setFormData({
      name: "",
      role: "",
      category: "guide",
      tagline: "",
      department: "",
      quote: "",
      description: "",
      badgeColor: "blue",
      github: "",
      linkedin: "",
      email: "",
      displayOrder: members.length + 1
    });
    setSelectedFile(null);
    setImagePreview("");
    setIsModalOpen(true);
  };

  // Open Modal for Edit
  const handleEdit = (member: TeamMember) => {
    setEditingMember(member);
    setFormData({
      name: member.name || "",
      role: member.role || "",
      category: member.category || "guide",
      tagline: member.tagline || member.role || "",
      department: member.department || "",
      quote: member.quote || "",
      description: member.description || "",
      badgeColor: member.badgeColor || "blue",
      github: member.socialLinks?.github || "",
      linkedin: member.socialLinks?.linkedin || "",
      email: member.socialLinks?.email || "",
      displayOrder: member.displayOrder || 0
    });
    setSelectedFile(null);
    setImagePreview(member.image || "");
    setIsModalOpen(true);
  };

  // Handle File Selection for Image Upload
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const previewUrl = URL.createObjectURL(file);
      setImagePreview(previewUrl);
    }
  };

  // Save Member (Create or Update)
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.role) {
      alert("Please provide both Name and Role.");
      return;
    }

    try {
      setIsSaving(true);
      const payload = new FormData();
      payload.append("name", formData.name);
      payload.append("role", formData.role);
      payload.append("category", formData.category);
      payload.append("tagline", formData.tagline || formData.role);
      payload.append("department", formData.department);
      payload.append("quote", formData.quote);
      payload.append("description", formData.description);
      payload.append("badgeColor", formData.badgeColor);
      payload.append("displayOrder", String(formData.displayOrder));
      
      const socialLinksObj = {
        github: formData.github,
        linkedin: formData.linkedin,
        email: formData.email
      };
      payload.append("socialLinks", JSON.stringify(socialLinksObj));

      if (selectedFile) {
        payload.append("image", selectedFile);
      } else if (imagePreview && !imagePreview.startsWith("blob:")) {
        payload.append("image", imagePreview);
      }

      if (editingMember && !editingMember._id.startsWith("default-")) {
        await updateTeamMember(editingMember._id, payload);
      } else {
        await createTeamMember(payload);
      }

      setIsModalOpen(false);
      await fetchMembers();
    } catch (err: any) {
      console.error("Save error:", err);
      alert(`Failed to save team member: ${err?.response?.data?.message || err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  // Delete Member
  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this team member?")) return;
    try {
      if (!id.startsWith("default-")) {
        await deleteTeamMember(id);
      }
      setMembers((prev) => prev.filter((m) => m._id !== id));
    } catch (err: any) {
      console.error("Delete error:", err);
      alert(`Failed to delete: ${err?.message || "Server error"}`);
    }
  };

  // Reset to Seed Data
  const handleResetSeed = async () => {
    if (!confirm("Reset all team members to initial default dataset?")) return;
    try {
      setLoading(true);
      await seedTeamMembers();
      await fetchMembers();
    } catch (err) {
      console.error("Reset error:", err);
      setMembers(DEFAULT_MEMBERS);
    } finally {
      setLoading(false);
    }
  };

  // Filter Members by Category
  const hodMembers = members.filter((m) => m.category === "hod");
  const guideMembers = members.filter((m) => m.category === "guide");
  const studentMembers = members.filter((m) => m.category === "student");
  const customMembers = members.filter((m) => m.category === "custom");

  // Get guide badge styling based on badgeColor or category
  const getBadgeStyle = (color?: string) => {
    switch (color) {
      case "emerald":
        return {
          badgeBg: "bg-emerald-50/80 text-emerald-600 border-emerald-100",
          iconBg: "bg-emerald-50 text-emerald-600",
          IconComponent: Lightbulb,
          avatarBg: "https://ui-avatars.com/api/?background=ecfdf5&color=059669&bold=true"
        };
      case "purple":
        return {
          badgeBg: "bg-purple-50/80 text-purple-600 border-purple-100",
          iconBg: "bg-purple-50 text-purple-600",
          IconComponent: FlaskConical,
          avatarBg: "https://ui-avatars.com/api/?background=f3e8ff&color=7e22ce&bold=true"
        };
      case "orange":
        return {
          badgeBg: "bg-orange-50/80 text-orange-600 border-orange-100",
          iconBg: "bg-orange-50 text-orange-600",
          IconComponent: BookOpen,
          avatarBg: "https://ui-avatars.com/api/?background=fff7ed&color=c2410c&bold=true"
        };
      case "blue":
      default:
        return {
          badgeBg: "bg-blue-50/80 text-blue-600 border-blue-100",
          iconBg: "bg-blue-50 text-blue-600",
          IconComponent: Code,
          avatarBg: "https://ui-avatars.com/api/?background=eff6ff&color=2563eb&bold=true"
        };
    }
  };

  return (
    <div
      className="min-h-screen bg-[#F8FAFC] font-sans text-[#0F172A] antialiased py-8 sm:py-12 px-4 sm:px-6 lg:px-8 relative"
      style={{
        backgroundImage: "radial-gradient(circle at 50% 0%, rgba(37,99,235,0.04) 0%, transparent 70%)"
      }}
    >
      <div className="max-w-[1200px] mx-auto space-y-12 lg:space-y-16">

        {/* ==========================================
            ADMIN / MANAGEMENT CONTROL BAR (COORDINATOR ONLY)
           ========================================== */}
        {isCoordinator && (
          <div className="bg-white/80 backdrop-blur-md border border-slate-200 shadow-sm rounded-2xl p-3 sm:p-4 flex flex-wrap items-center justify-between gap-3 transition-all">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs sm:text-sm font-bold text-slate-700">Team Structure &amp; Backend CRUD</span>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 border border-blue-100 font-semibold">
                {members.length} Members
              </span>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => setIsManageMode(!isManageMode)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  isManageMode
                    ? "bg-slate-900 text-white shadow-md"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                {isManageMode ? "Exit Edit Mode" : "Enable Edit Mode"}
              </button>

              {isManageMode && (
                <button
                  onClick={handleAddNew}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-blue-600 text-white text-xs font-bold shadow-md hover:bg-blue-700 transition-all hover:scale-105"
                >
                  <Plus className="w-4 h-4" />
                  Add Team Member
                </button>
              )}
            </div>
          </div>
        )}

        {/* ==========================================
            HERO HEADER SECTION
           ========================================== */}
        <section className="relative py-0 sm:py-2 overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-center">
            {/* Left Content */}
            <div className="lg:col-span-6 space-y-3">
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#0F172A] tracking-tight leading-tight">
                Our Story. <span className="text-[#2563EB]">Our People.</span>
              </h1>
              <p className="text-sm sm:text-base text-[#64748B] max-w-lg leading-relaxed font-medium">
                Behind every innovation is a team that believes in the power of ideas, guidance, and collaboration.
              </p>
              <p className="text-xs sm:text-sm text-[#64748B] font-medium">
                Meet the{" "}
                <span className="font-bold text-[#2563EB] hover:underline cursor-pointer">
                  mentors
                </span>{" "}
                who guide us and the{" "}
                <span className="font-bold text-[#2563EB] hover:underline cursor-pointer">
                  students
                </span>{" "}
                who turn ideas into impactful solutions.
              </p>
            </div>

            {/* Right Hero Illustration */}
            <div className="lg:col-span-6 flex justify-center lg:justify-end items-center relative">
              <img
                src="/images/exact-hero-team.png"
                alt="Development Team Collaboration"
                className="w-full max-w-md lg:max-w-md max-h-[280px] sm:max-h-[320px] h-auto object-contain mix-blend-multiply opacity-95 hover:opacity-100 transition-opacity"
                onError={(e) => {
                  const target = e.currentTarget;
                  target.src = "/images/hero-team.png";
                }}
              />
            </div>
          </div>
        </section>

        {/* ==========================================
            SECTION 01: CHIEF MENTOR & HOD (Vision & Guidance)
           ========================================== */}
        {hodMembers.length > 0 && (
          <div className="space-y-6">
            {hodMembers.map((hod) => (
              <section
                key={hod._id}
                className="relative max-w-3xl lg:max-w-4xl mx-auto w-full bg-white rounded-3xl p-6 sm:p-8 border border-[#E2E8F0] shadow-[0_8px_24px_rgba(15,23,42,0.06)] hover:shadow-[0_8px_24px_rgba(15,23,42,0.1)] transition-all group"
              >
                {isCoordinator && isManageMode && (
                  <div className="absolute top-4 right-4 flex items-center gap-2 z-10">
                    <button
                      onClick={() => handleEdit(hod)}
                      className="p-2 rounded-full bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white transition-all shadow-sm"
                      title="Edit Member"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(hod._id)}
                      className="p-2 rounded-full bg-red-50 text-red-600 hover:bg-red-600 hover:text-white transition-all shadow-sm"
                      title="Delete Member"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}

                <SectionHeader
                  title="Vision & Guidance"
                  subtitle="Great ideas need the right direction. Our journey begins with visionary leadership."
                />
                <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
                  {/* Photo with Blue Border */}
                  <div className="relative shrink-0">
                    <div className="w-44 h-52 rounded-2xl overflow-hidden border-2 border-[#2563EB] shadow-sm bg-slate-50 flex items-center justify-center">
                      <img
                        src={hod.image || "/images/yogita_pagar.jpg"}
                        alt={hod.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.onerror = null;
                          e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(
                            hod.name
                          )}&background=eff6ff&color=2563eb&bold=true`;
                        }}
                      />
                    </div>
                    <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-[#2563EB] text-white px-3 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase flex items-center gap-1 shadow-md whitespace-nowrap">
                      <span>{hod.tagline || "PROJECT GUIDE"}</span>
                    </div>
                  </div>

                  {/* Details */}
                  <div className="flex-1 text-center sm:text-left space-y-2">
                    <h2 className="text-xl sm:text-2xl font-bold text-[#0F172A]">{hod.name}</h2>
                    <p className="text-sm font-semibold text-[#2563EB]">{hod.role}</p>
                    {hod.department && (
                      <p className="text-xs sm:text-sm text-[#64748B] font-medium leading-relaxed">
                        {hod.department}
                      </p>
                    )}
                    {hod.quote && (
                      <div className="mt-4 p-4 rounded-2xl bg-[#EFF6FF] border border-[#DBEAFE] text-left relative text-xs sm:text-sm text-slate-700 font-medium italic">
                        <span className="text-[#2563EB] font-serif text-2xl leading-none mr-1">“</span>
                        {hod.quote}
                        <span className="text-[#2563EB] font-serif text-2xl leading-none ml-1">”</span>
                      </div>
                    )}
                  </div>
                </div>
              </section>
            ))}
          </div>
        )}

        {/* ==========================================
            SECTION 02: FACULTY GUIDES (Guiding Minds, Inspiring Innovation)
           ========================================== */}
        <section className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-[0_8px_24px_rgba(15,23,42,0.06)] space-y-6">
          <div className="text-center space-y-1.5 mb-6">
            <div className="flex items-center justify-center gap-2.5 text-blue-600">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
              <div className="w-10 sm:w-16 h-[1px] bg-blue-200" />
              <Users className="w-6 h-6 text-blue-600" />
              <h3 className="text-xl sm:text-2xl lg:text-3xl font-black text-slate-900 tracking-tight">
                Guiding Minds, Inspiring Innovation
              </h3>
              <div className="w-10 sm:w-16 h-[1px] bg-blue-200" />
              <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
            </div>
            <p className="text-xs sm:text-sm text-slate-500 font-medium">
              Our faculty guides who support, mentor and shape the journey.
            </p>
          </div>

          {/* Grid of Faculty Guides */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {guideMembers.map((guide, idx) => {
              const style = getBadgeStyle(guide.badgeColor);
              const BadgeIcon = style.IconComponent;

              return (
                <div
                  key={guide._id}
                  className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm text-center flex flex-col items-center justify-between space-y-3.5 hover:shadow-md transition-all relative group"
                >
                  {isCoordinator && isManageMode && (
                    <div className="absolute top-3 right-3 flex items-center gap-1.5 z-10 bg-white/90 rounded-lg p-1 shadow-xs border border-slate-200">
                      <button
                        onClick={() => handleEdit(guide)}
                        className="p-1 rounded text-blue-600 hover:bg-blue-50"
                        title="Edit Guide"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(guide._id)}
                        className="p-1 rounded text-red-600 hover:bg-red-50"
                        title="Delete Guide"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}

                  <span className="absolute top-3 left-4 text-blue-300 text-sm font-bold select-none">+</span>
                  
                  {/* Photo Frame */}
                  <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full overflow-hidden border border-slate-100 shadow-sm bg-slate-50 flex items-center justify-center">
                    <img
                      src={guide.image || style.avatarBg}
                      alt={guide.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(
                          guide.name
                        )}&background=eff6ff&color=2563eb&bold=true`;
                      }}
                    />
                  </div>

                  <div className="space-y-1.5 flex-1 flex flex-col justify-center">
                    <h4 className="font-bold text-sm sm:text-base text-slate-900">{guide.name}</h4>
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-bold ${style.badgeBg}`}>
                      <BadgeIcon className="w-3.5 h-3.5" /> {guide.tagline || guide.role}
                    </span>
                    {guide.description && (
                      <p className="text-[11px] text-slate-500 mt-2 leading-relaxed max-w-[200px] mx-auto">
                        {guide.description}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* ==========================================
            SECTION 03: BUILT BY STUDENTS
           ========================================== */}
        <section className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E2E8F0] shadow-[0_8px_24px_rgba(15,23,42,0.06)] space-y-6">
          <SectionHeader
            title="Built by Students"
            subtitle="Driven by passion, we turn ideas into real-world solutions with dedication."
          />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center w-full">
            {/* Student 1 (e.g., Kalpesh Bire) */}
            {studentMembers[0] && (
              <div className="lg:col-span-5 flex flex-col sm:flex-row items-center text-center sm:text-left gap-4 sm:gap-5 justify-self-center lg:justify-self-start relative w-full group p-2">
                {isCoordinator && isManageMode && (
                  <div className="absolute -top-2 -right-2 flex items-center gap-1 z-10 bg-white rounded-lg p-1 border shadow-xs">
                    <button onClick={() => handleEdit(studentMembers[0])} className="p-1 text-blue-600 hover:bg-blue-50 rounded">
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => handleDelete(studentMembers[0]._id)} className="p-1 text-red-600 hover:bg-red-50 rounded">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
                <div className="w-24 h-24 sm:w-28 sm:h-28 shrink-0 rounded-full overflow-hidden border-2 border-[#2563EB] shadow-sm bg-white">
                  <img
                    src={studentMembers[0].image || "/images/team/kalpesh.jpg"}
                    alt={studentMembers[0].name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(
                        studentMembers[0].name
                      )}&background=eff6ff&color=2563eb&bold=true`;
                    }}
                  />
                </div>
                <div className="space-y-1.5 flex-1">
                  <h4 className="font-bold text-lg text-[#0F172A] tracking-tight">{studentMembers[0].name}</h4>
                  <p className="text-xs font-bold text-[#2563EB]">{studentMembers[0].role}</p>
                  <p className="text-xs text-[#64748B] leading-relaxed max-w-[220px] mx-auto sm:mx-0">
                    {studentMembers[0].description}
                  </p>
                  <div className="flex items-center justify-center sm:justify-start gap-2 pt-1">
                    {studentMembers[0].socialLinks?.github && (
                      <a
                        href={studentMembers[0].socialLinks.github}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-7 h-7 rounded-full bg-slate-900 text-white flex items-center justify-center hover:bg-black transition-colors"
                        title="GitHub"
                      >
                        <Github className="w-3.5 h-3.5 fill-white" />
                      </a>
                    )}
                    {studentMembers[0].socialLinks?.linkedin && (
                      <a
                        href={studentMembers[0].socialLinks.linkedin}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-7 h-7 rounded-full bg-[#2563EB] text-white flex items-center justify-center hover:bg-blue-700 transition-colors"
                        title="LinkedIn"
                      >
                        <Linkedin className="w-3.5 h-3.5 fill-white" />
                      </a>
                    )}
                    {studentMembers[0].socialLinks?.email && (
                      <a
                        href={`mailto:${studentMembers[0].socialLinks.email}`}
                        className="w-7 h-7 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center hover:bg-slate-200 transition-colors"
                        title="Email"
                      >
                        <Mail className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Center Badge Graphic */}
            <div className="lg:col-span-2 flex flex-col items-center justify-center text-center my-auto py-2">
              <div className="flex items-center justify-center w-full">
                <div className="hidden lg:block w-3 sm:w-5 h-[1px] bg-blue-200 relative">
                  <div className="absolute left-0 w-1.5 h-1.5 bg-[#2563EB] rounded-full -top-[2.5px]" />
                </div>
                <div className="w-13 h-13 sm:w-14 sm:h-14 rounded-full border border-dashed border-[#2563EB] bg-[#EFF6FF] flex items-center justify-center text-[#2563EB] mx-1 shrink-0 shadow-sm">
                  <Lightbulb className="w-5 h-5 sm:w-6 sm:h-6 text-[#2563EB]" />
                </div>
                <div className="hidden lg:block w-3 sm:w-5 h-[1px] bg-blue-200 relative">
                  <div className="absolute right-0 w-1.5 h-1.5 bg-[#2563EB] rounded-full -top-[2.5px]" />
                </div>
              </div>
              <p className="text-[10px] font-bold text-[#0F172A] mt-2 leading-tight whitespace-nowrap">
                Teamwork<br />Makes Innovation
              </p>
            </div>

            {/* Student 2 (e.g., Roshan Gaikwad) */}
            {studentMembers[1] && (
              <div className="lg:col-span-5 flex flex-col sm:flex-row items-center text-center sm:text-left gap-4 sm:gap-5 justify-self-center lg:justify-self-end relative w-full group p-2">
                {isCoordinator && isManageMode && (
                  <div className="absolute -top-2 -right-2 flex items-center gap-1 z-10 bg-white rounded-lg p-1 border shadow-xs">
                    <button onClick={() => handleEdit(studentMembers[1])} className="p-1 text-blue-600 hover:bg-blue-50 rounded">
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => handleDelete(studentMembers[1]._id)} className="p-1 text-red-600 hover:bg-red-50 rounded">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
                <div className="w-24 h-24 sm:w-28 sm:h-28 shrink-0 rounded-full overflow-hidden border-2 border-[#2563EB] shadow-sm bg-white">
                  <img
                    src={studentMembers[1].image || "/images/team/roshan.jpg"}
                    alt={studentMembers[1].name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(
                        studentMembers[1].name
                      )}&background=eff6ff&color=2563eb&bold=true`;
                    }}
                  />
                </div>
                <div className="space-y-1.5 flex-1">
                  <h4 className="font-bold text-lg text-[#0F172A] tracking-tight">{studentMembers[1].name}</h4>
                  <p className="text-xs font-bold text-[#2563EB]">{studentMembers[1].role}</p>
                  <p className="text-xs text-[#64748B] leading-relaxed max-w-[220px] mx-auto sm:mx-0">
                    {studentMembers[1].description}
                  </p>
                  <div className="flex items-center justify-center sm:justify-start gap-2 pt-1">
                    {studentMembers[1].socialLinks?.github && (
                      <a
                        href={studentMembers[1].socialLinks.github}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-7 h-7 rounded-full bg-slate-900 text-white flex items-center justify-center hover:bg-black transition-colors"
                        title="GitHub"
                      >
                        <Github className="w-3.5 h-3.5 fill-white" />
                      </a>
                    )}
                    {studentMembers[1].socialLinks?.linkedin && (
                      <a
                        href={studentMembers[1].socialLinks.linkedin}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-7 h-7 rounded-full bg-[#2563EB] text-white flex items-center justify-center hover:bg-blue-700 transition-colors"
                        title="LinkedIn"
                      >
                        <Linkedin className="w-3.5 h-3.5 fill-white" />
                      </a>
                    )}
                    {studentMembers[1].socialLinks?.email && (
                      <a
                        href={`mailto:${studentMembers[1].socialLinks.email}`}
                        className="w-7 h-7 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center hover:bg-slate-200 transition-colors"
                        title="Email"
                      >
                        <Mail className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Render any additional student/custom members dynamically */}
          {studentMembers.length > 2 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-4 border-t border-slate-100">
              {studentMembers.slice(2).map((st) => (
                <div key={st._id} className="p-4 bg-slate-50 rounded-2xl flex items-center gap-3 relative">
                  {isCoordinator && isManageMode && (
                    <button
                      onClick={() => handleEdit(st)}
                      className="absolute top-2 right-2 p-1 text-slate-500 hover:text-blue-600"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <img
                    src={st.image || "https://ui-avatars.com/api/?name=" + encodeURIComponent(st.name)}
                    alt={st.name}
                    className="w-12 h-12 rounded-full object-cover border"
                  />
                  <div>
                    <h5 className="font-bold text-xs text-slate-900">{st.name}</h5>
                    <p className="text-[11px] text-blue-600">{st.role}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* ==========================================
            SECTION 04: DEVELOPMENT JOURNEY
           ========================================== */}
        <section className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E2E8F0] shadow-[0_8px_24px_rgba(15,23,42,0.06)] space-y-6">
          <SectionHeader
            title="Development Journey"
            subtitle="From an idea to a fully functional platform – every step matters."
          />

          <div className="flex items-center justify-between gap-1.5 sm:gap-3 overflow-x-auto pb-2 pt-2 no-scrollbar">
            {/* Step 1 */}
            <div className="flex-1 min-w-[95px] max-w-[130px] bg-amber-50/60 border border-amber-200/80 rounded-2xl p-3 sm:p-4 text-center flex flex-col items-center justify-center space-y-3 shrink-0 aspect-[4/5] shadow-sm hover:border-amber-400 hover:bg-amber-50 transition-all">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-amber-100/80 text-amber-600 border border-amber-200 flex items-center justify-center shadow-inner">
                <Lightbulb className="w-5 h-5 text-amber-600" />
              </div>
              <span className="text-[11px] sm:text-xs font-bold text-amber-950 leading-tight">
                Idea<br />Proposed
              </span>
            </div>

            <div className="text-amber-300 shrink-0">
              <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2]" />
            </div>

            {/* Step 2 */}
            <div className="flex-1 min-w-[95px] max-w-[130px] bg-emerald-50/60 border border-emerald-200/80 rounded-2xl p-3 sm:p-4 text-center flex flex-col items-center justify-center space-y-3 shrink-0 aspect-[4/5] shadow-sm hover:border-emerald-400 hover:bg-emerald-50 transition-all">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-emerald-100/80 text-emerald-600 border border-emerald-200 flex items-center justify-center shadow-inner">
                <Users className="w-5 h-5 text-emerald-600" />
              </div>
              <span className="text-[11px] sm:text-xs font-bold text-emerald-950 leading-tight">
                Mentors<br />Guided
              </span>
            </div>

            <div className="text-emerald-300 shrink-0">
              <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2]" />
            </div>

            {/* Step 3 */}
            <div className="flex-1 min-w-[95px] max-w-[130px] bg-purple-50/60 border border-purple-200/80 rounded-2xl p-3 sm:p-4 text-center flex flex-col items-center justify-center space-y-3 shrink-0 aspect-[4/5] shadow-sm hover:border-purple-400 hover:bg-purple-50 transition-all">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-purple-100/80 text-purple-600 border border-purple-200 flex items-center justify-center shadow-inner">
                <Edit3 className="w-5 h-5 text-purple-600" />
              </div>
              <span className="text-[11px] sm:text-xs font-bold text-purple-950 leading-tight">
                Planning &amp;<br />Design
              </span>
            </div>

            <div className="text-purple-300 shrink-0">
              <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2]" />
            </div>

            {/* Step 4 */}
            <div className="flex-1 min-w-[95px] max-w-[130px] bg-blue-50/60 border border-blue-200/80 rounded-2xl p-3 sm:p-4 text-center flex flex-col items-center justify-center space-y-3 shrink-0 aspect-[4/5] shadow-sm hover:border-blue-400 hover:bg-blue-50 transition-all">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-blue-100/80 text-blue-600 border border-blue-200 flex items-center justify-center shadow-inner">
                <Code className="w-5 h-5 text-blue-600" />
              </div>
              <span className="text-[11px] sm:text-xs font-bold text-blue-950 leading-tight">
                Development
              </span>
            </div>

            <div className="text-blue-300 shrink-0">
              <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2]" />
            </div>

            {/* Step 5 */}
            <div className="flex-1 min-w-[95px] max-w-[130px] bg-teal-50/60 border border-teal-200/80 rounded-2xl p-3 sm:p-4 text-center flex flex-col items-center justify-center space-y-3 shrink-0 aspect-[4/5] shadow-sm hover:border-teal-400 hover:bg-teal-50 transition-all">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-teal-100/80 text-teal-600 border border-teal-200 flex items-center justify-center shadow-inner">
                <ShieldCheck className="w-5 h-5 text-teal-600" />
              </div>
              <span className="text-[11px] sm:text-xs font-bold text-teal-950 leading-tight">
                Testing &amp;<br />Validation
              </span>
            </div>

            <div className="text-teal-300 shrink-0">
              <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2]" />
            </div>

            {/* Step 6 */}
            <div className="flex-1 min-w-[95px] max-w-[130px] bg-violet-50/60 border border-violet-200/80 rounded-2xl p-3 sm:p-4 text-center flex flex-col items-center justify-center space-y-3 shrink-0 aspect-[4/5] shadow-sm hover:border-violet-400 hover:bg-violet-50 transition-all">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-violet-100/80 text-violet-600 border border-violet-200 flex items-center justify-center shadow-inner">
                <Rocket className="w-5 h-5 text-violet-600" />
              </div>
              <span className="text-[11px] sm:text-xs font-bold text-violet-950 leading-tight">
                Deployment &amp;<br />Launch
              </span>
            </div>
          </div>
        </section>

        {/* ==========================================
            SECTION 05: GRATITUDE & CREDITS
           ========================================== */}
        <section className="bg-white border border-[#E2E8F0] rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-[0_8px_24px_rgba(15,23,42,0.06)]">
          <div className="flex items-center gap-4 sm:gap-6 flex-1 text-left">
            <div className="relative shrink-0 flex items-center justify-center">
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-[#EFF6FF] text-[#2563EB] border border-[#DBEAFE] flex items-center justify-center shadow-sm">
                <span className="font-serif text-3xl sm:text-4xl font-black text-[#2563EB] leading-none select-none">
                  “
                </span>
              </div>
            </div>

            <div className="space-y-1 flex-1">
              <h4 className="font-extrabold text-base sm:text-lg text-[#0F172A] tracking-tight">
                Heartfelt Thanks
              </h4>
              <p className="text-xs sm:text-sm text-[#64748B] leading-relaxed max-w-md font-medium">
                We extend our sincere gratitude to our mentors for their continuous support, valuable guidance and encouragement throughout this journey.
              </p>
            </div>
          </div>

          <div className="hidden md:block w-[1px] h-20 bg-[#E2E8F0] mx-2 shrink-0" />

          <div className="flex items-center justify-between gap-4 flex-1 w-full md:w-auto">
            <div className="space-y-1">
              <p className="text-xs text-[#64748B] font-medium">
                Designed &amp; Developed with <span className="text-red-500">❤️</span> by
              </p>
              <h4 className="text-base sm:text-xl font-bold text-[#2563EB] tracking-tight flex items-center gap-2 flex-wrap">
                <span>Kalpesh Bire</span>
                <span className="text-slate-400 font-normal text-sm">&amp;</span>
                <span>Roshan Gaikwad</span>
              </h4>
              <p className="text-[11px] sm:text-xs text-[#64748B] font-medium">
                AICTE IDEA Lab – Innovation for a Better Tomorrow
              </p>
            </div>
          </div>
        </section>

      </div>

      {/* ==========================================
          MODAL FOR ADD / EDIT TEAM MEMBER (CRUD)
         ========================================== */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl sm:rounded-3xl max-w-lg w-full max-h-[85vh] flex flex-col shadow-2xl border border-slate-100 relative animate-in fade-in zoom-in-95 duration-200 overflow-hidden">
            
            {/* Modal Header (Fixed) */}
            <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between shrink-0 bg-white">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    {editingMember ? "Edit Team Member" : "Add Team Member"}
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Fill details and upload profile image.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Scrollable Form Body */}
            <form onSubmit={handleSave} className="flex flex-col min-h-0 flex-1">
              <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3 text-left">
                {/* Image Upload Area */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Member Profile Image
                  </label>
                  <div className="flex items-center gap-3">
                    <div className="w-14 h-14 rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 overflow-hidden relative flex items-center justify-center shrink-0">
                      {imagePreview ? (
                        <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                      ) : (
                        <FileImage className="w-6 h-6 text-slate-400" />
                      )}
                    </div>
                    <div className="flex-1">
                      <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 text-blue-600 border border-blue-200 text-xs font-bold hover:bg-blue-100 transition-colors">
                        <Upload className="w-3.5 h-3.5" />
                        Choose Image File
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleFileChange}
                          className="hidden"
                        />
                      </label>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        Supports JPG, PNG, WEBP up to 10MB.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Grid 2 Columns */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Full Name *</label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g. Dr. Yogita Pagar"
                      className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Role / Designation *</label>
                    <input
                      type="text"
                      required
                      value={formData.role}
                      onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                      placeholder="e.g. Technical Guide"
                      className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Category</label>
                    <select
                      value={formData.category}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          category: e.target.value as "hod" | "guide" | "student" | "custom"
                        })
                      }
                      className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    >
                      <option value="hod">Vision &amp; Guidance (HOD)</option>
                      <option value="guide">Faculty Guide</option>
                      <option value="student">Student Developer</option>
                      <option value="custom">Custom Member</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Badge Accent Color</label>
                    <select
                      value={formData.badgeColor}
                      onChange={(e) => setFormData({ ...formData, badgeColor: e.target.value })}
                      className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    >
                      <option value="blue">Blue</option>
                      <option value="emerald">Emerald</option>
                      <option value="purple">Purple</option>
                      <option value="orange">Orange</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Tagline / Short Badge Text</label>
                  <input
                    type="text"
                    value={formData.tagline}
                    onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
                    placeholder="e.g. HOD & MENTOR, Technical Guide"
                    className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {formData.category === "hod" && (
                  <>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">Department &amp; Institute</label>
                      <input
                        type="text"
                        value={formData.department}
                        onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                        placeholder="e.g. Computer Science and Design Dept..."
                        className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">Inspirational Quote</label>
                      <textarea
                        rows={2}
                        value={formData.quote}
                        onChange={(e) => setFormData({ ...formData, quote: e.target.value })}
                        placeholder="Quote..."
                        className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </>
                )}

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Description / Contributions</label>
                  <textarea
                    rows={2}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Guiding the technical architecture..."
                    className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Social Links */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-0.5">GitHub URL</label>
                    <input
                      type="url"
                      value={formData.github}
                      onChange={(e) => setFormData({ ...formData, github: e.target.value })}
                      placeholder="https://github.com/..."
                      className="w-full px-2 py-1 text-xs border border-slate-200 rounded-md focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-0.5">LinkedIn URL</label>
                    <input
                      type="url"
                      value={formData.linkedin}
                      onChange={(e) => setFormData({ ...formData, linkedin: e.target.value })}
                      placeholder="https://linkedin.com/in/..."
                      className="w-full px-2 py-1 text-xs border border-slate-200 rounded-md focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Email</label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="email@kkwagh.edu.in"
                      className="w-full px-2 py-1 text-xs border border-slate-200 rounded-md focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Fixed Modal Footer */}
              <div className="px-5 py-3 border-t border-slate-100 flex items-center justify-end gap-2 shrink-0 bg-slate-50/80">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3.5 py-1.5 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 shadow-md transition-all disabled:opacity-50"
                >
                  {isSaving ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Saving...
                    </>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5" /> Save Member
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default DevelopmentTeam;
