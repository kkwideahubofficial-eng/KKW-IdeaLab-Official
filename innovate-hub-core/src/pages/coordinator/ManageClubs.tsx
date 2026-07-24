import React, { useState, useEffect } from "react";
import { 
  Users, 
  Calendar, 
  Plus, 
  Trash2, 
  Edit, 
  Check, 
  X, 
  Image as ImageIcon, 
  Sparkles, 
  ShieldCheck, 
  Award, 
  Flame, 
  RefreshCw,
  ArrowLeft,
  Upload,
  Cloud
} from "lucide-react";
import { Link } from "react-router-dom";
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
  clubId?: string;
  name: string;
  shortName: string;
  fullTitle: string;
  category: 'Technical' | 'Design' | 'Entrepreneurship' | 'Cultural' | 'Innovation';
  accentColor: string;
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

const API_BASE = '/api/student-clubs';

const ManageClubs: React.FC = () => {
  const [clubs, setClubs] = useState<Club[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingClub, setEditingClub] = useState<Club | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'basic' | 'coordinators' | 'activities' | 'events' | 'gallery'>('basic');

  // Form states for new event inside edit dialog
  const [newEventTitle, setNewEventTitle] = useState("");
  const [newEventDate, setNewEventDate] = useState("");
  const [newEventCategory, setNewEventCategory] = useState("Hackathon");
  const [newEventParticipants, setNewEventParticipants] = useState("150+ Coders");
  const [newEventDescription, setNewEventDescription] = useState("");
  const [newEventImage, setNewEventImage] = useState("");

  // Input states for list items
  const [newActivityInput, setNewActivityInput] = useState("");
  const [newAchievementInput, setNewAchievementInput] = useState("");
  const [newGalleryInput, setNewGalleryInput] = useState("");

  const fetchClubs = async () => {
    setLoading(true);
    try {
      const res = await fetch(API_BASE);
      const data = await res.json();
      if (data.success && Array.isArray(data.clubs)) {
        setClubs(data.clubs);
      } else {
        toast.error("Failed to load clubs data");
      }
    } catch (err) {
      console.error("Fetch error:", err);
      toast.error("Error connecting to backend server");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClubs();
  }, []);

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
    setIsAddModalOpen(true);
    setActiveTab('basic');
  };

  const handleSaveClub = async () => {
    if (!editingClub) return;

    if (!editingClub.name || !editingClub.fullTitle || !editingClub.description) {
      toast.error("Please fill in required fields (Club Name, Full Title, Description)");
      return;
    }

    try {
      const isNew = !editingClub._id;
      const url = isNew ? API_BASE : `${API_BASE}/${editingClub._id || editingClub.clubId}`;
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
        setIsAddModalOpen(false);
        fetchClubs();
      } else {
        toast.error(data.message || "Failed to save club");
      }
    } catch (err) {
      console.error("Save error:", err);
      toast.error("Error saving club to server");
    }
  };

  const handleDeleteClub = async (clubId?: string) => {
    if (!clubId) return;
    if (!window.confirm("Are you sure you want to delete this club?")) return;

    try {
      const res = await fetch(`${API_BASE}/${clubId}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        toast.success("Club deleted successfully");
        fetchClubs();
      } else {
        toast.error(data.message || "Failed to delete");
      }
    } catch (err) {
      toast.error("Error deleting club");
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

  // Activity Handlers
  const handleAddActivity = () => {
    if (!newActivityInput.trim() || !editingClub) return;
    setEditingClub({
      ...editingClub,
      activities: [...editingClub.activities, newActivityInput.trim()]
    });
    setNewActivityInput("");
  };

  const handleRemoveActivity = (index: number) => {
    if (!editingClub) return;
    setEditingClub({
      ...editingClub,
      activities: editingClub.activities.filter((_, i) => i !== index)
    });
  };

  // Achievement Handlers
  const handleAddAchievement = () => {
    if (!newAchievementInput.trim() || !editingClub) return;
    setEditingClub({
      ...editingClub,
      achievements: [...editingClub.achievements, newAchievementInput.trim()]
    });
    setNewAchievementInput("");
  };

  const handleRemoveAchievement = (index: number) => {
    if (!editingClub) return;
    setEditingClub({
      ...editingClub,
      achievements: editingClub.achievements.filter((_, i) => i !== index)
    });
  };

  // Conducted Event Handlers inside modal
  const handleAddConductedEvent = () => {
    if (!newEventTitle || !newEventDate || !newEventImage || !editingClub) {
      toast.error("Please fill in event title, date, and image URL");
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

    setEditingClub({
      ...editingClub,
      conductedEvents: [...editingClub.conductedEvents, newEvt]
    });

    setNewEventTitle("");
    setNewEventDate("");
    setNewEventDescription("");
    setNewEventImage("");
    toast.success("Event added to club list!");
  };

  const handleRemoveConductedEvent = (index: number) => {
    if (!editingClub) return;
    setEditingClub({
      ...editingClub,
      conductedEvents: editingClub.conductedEvents.filter((_, i) => i !== index)
    });
  };

  // Gallery Handlers
  const handleAddGalleryImage = () => {
    if (!newGalleryInput.trim() || !editingClub) return;
    setEditingClub({
      ...editingClub,
      gallery: [...editingClub.gallery, newGalleryInput.trim()]
    });
    setNewGalleryInput("");
  };

  const handleRemoveGalleryImage = (index: number) => {
    if (!editingClub) return;
    setEditingClub({
      ...editingClub,
      gallery: editingClub.gallery.filter((_, i) => i !== index)
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800 antialiased pb-20 pt-8">
      <div className="max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Top Management Header */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Link to="/coordinator-dashboard" className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1">
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to Dashboard</span>
              </Link>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xl">
                ⚙️
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                  Manage Student Clubs & Events
                </h1>
                <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                  Coordinator Control Portal: Edit club details, faculty coordinators, activities, achievements, conducted events & photos.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={fetchClubs}
              className="rounded-2xl h-11 px-4 text-xs font-bold border-slate-200 text-slate-700 flex items-center gap-2"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </Button>

            <Button
              onClick={handleCreateClub}
              className="rounded-2xl h-11 px-6 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs sm:text-sm shadow-md flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Student Club</span>
            </Button>
          </div>
        </div>

        {/* Clubs Table / Card Grid */}
        {loading ? (
          <div className="bg-white rounded-3xl p-16 text-center border border-slate-200 shadow-xs">
            <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-sm font-bold text-slate-600">Loading student clubs from server...</p>
          </div>
        ) : clubs.length === 0 ? (
          <div className="bg-white rounded-3xl p-16 text-center border border-slate-200 shadow-xs max-w-md mx-auto">
            <h3 className="text-lg font-bold text-slate-900">No Student Clubs Found</h3>
            <p className="text-xs text-slate-500 mt-1 mb-4">Click "Add New Student Club" to create your first community.</p>
            <Button onClick={handleCreateClub} className="rounded-xl text-xs font-bold">Add Club</Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {clubs.map((club) => (
              <div 
                key={club._id || club.clubId}
                className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-12 h-12 rounded-full flex items-center justify-center text-white font-extrabold text-lg overflow-hidden p-0.5 border border-slate-100 shrink-0"
                        style={{ backgroundColor: club.logoUrl ? '#FFFFFF' : club.accentColor }}
                      >
                        {club.logoUrl ? (
                          <img src={club.logoUrl} alt={club.name} className="w-full h-full object-contain rounded-full" />
                        ) : (
                          <span>{club.icon}</span>
                        )}
                      </div>
                      <div>
                        <h3 className="text-base font-extrabold text-slate-900 leading-snug">
                          {club.name}
                        </h3>
                        <Badge 
                          style={{
                            backgroundColor: hexToRgba(club.accentColor, 0.14),
                            color: club.accentColor || '#2563EB'
                          }}
                          className="text-[10px] py-0 px-2 mt-0.5 font-extrabold border-0"
                        >
                          {club.category}
                        </Badge>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setEditingClub(club);
                          setActiveTab('basic');
                        }}
                        className="h-8 w-8 p-0 text-blue-600 hover:bg-blue-50 rounded-xl"
                        title="Edit Club Details"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDeleteClub(club._id || club.clubId)}
                        className="h-8 w-8 p-0 text-red-500 hover:bg-red-50 rounded-xl"
                        title="Delete Club"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 line-clamp-2 mb-4">
                    {club.description}
                  </p>

                  <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 text-xs space-y-1 text-slate-600 mb-4">
                    <div><strong>Faculty Lead:</strong> {club.facultyCoordinator?.name}</div>
                    <div><strong>Student Lead:</strong> {club.studentLead?.name}</div>
                    <div><strong>Conducted Events:</strong> {club.conductedEvents?.length || 0} Listed</div>
                  </div>
                </div>

                <Button
                  onClick={() => {
                    setEditingClub(club);
                    setActiveTab('basic');
                  }}
                  style={{ backgroundColor: club.accentColor }}
                  className="w-full rounded-2xl h-10 text-xs font-bold text-white shadow-xs hover:opacity-90 transition-opacity"
                >
                  Edit Club Details & Events
                </Button>
              </div>
            ))}
          </div>
        )}

      </div>

      {/* EDIT / CREATE CLUB DIALOG */}
      {editingClub && (
        <Dialog open={!!editingClub} onOpenChange={() => setEditingClub(null)}>
          <DialogContent className="max-w-3xl bg-white p-0 rounded-3xl overflow-hidden border-0 shadow-2xl">
            
            {/* Modal Header */}
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

            {/* Navigation Tabs */}
            <div className="flex items-center gap-1 px-6 pt-4 border-b border-slate-200 bg-slate-50/50 overflow-x-auto">
              <button
                onClick={() => setActiveTab('basic')}
                className={`px-4 py-2.5 text-xs font-extrabold border-b-2 transition-all ${
                  activeTab === 'basic' 
                    ? 'border-blue-600 text-blue-600 bg-white rounded-t-xl shadow-2xs' 
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                Basic Info
              </button>
              <button
                onClick={() => setActiveTab('coordinators')}
                className={`px-4 py-2.5 text-xs font-extrabold border-b-2 transition-all ${
                  activeTab === 'coordinators' 
                    ? 'border-blue-600 text-blue-600 bg-white rounded-t-xl shadow-2xs' 
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                Coordinators
              </button>
              <button
                onClick={() => setActiveTab('activities')}
                className={`px-4 py-2.5 text-xs font-extrabold border-b-2 transition-all ${
                  activeTab === 'activities' 
                    ? 'border-blue-600 text-blue-600 bg-white rounded-t-xl shadow-2xs' 
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                Focus Areas & Achievements
              </button>
              <button
                onClick={() => setActiveTab('events')}
                className={`px-4 py-2.5 text-xs font-extrabold border-b-2 transition-all flex items-center gap-1.5 ${
                  activeTab === 'events' 
                    ? 'border-blue-600 text-blue-600 bg-white rounded-t-xl shadow-2xs' 
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <Flame className="w-3.5 h-3.5 text-orange-500" />
                <span>Conducted Events ({editingClub.conductedEvents?.length || 0})</span>
              </button>
              <button
                onClick={() => setActiveTab('gallery')}
                className={`px-4 py-2.5 text-xs font-extrabold border-b-2 transition-all ${
                  activeTab === 'gallery' 
                    ? 'border-blue-600 text-blue-600 bg-white rounded-t-xl shadow-2xs' 
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                Gallery Photos
              </button>
            </div>

            {/* Tab Contents */}
            <div className="p-6 max-h-[60vh] overflow-y-auto space-y-4">
              
              {/* TAB 1: BASIC INFO */}
              {activeTab === 'basic' && (
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

              {/* TAB 2: COORDINATORS */}
              {activeTab === 'coordinators' && (
                <div className="space-y-6 text-xs">
                  {/* Faculty Coordinator Section */}
                  <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-100 space-y-3">
                    <h4 className="font-extrabold text-blue-900 text-sm flex items-center gap-2">
                      <span>👤 Faculty Coordinator Details</span>
                    </h4>
                    
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

                  {/* Student Lead Section */}
                  <div className="p-4 rounded-2xl bg-purple-50/60 border border-purple-100 space-y-3">
                    <h4 className="font-extrabold text-purple-900 text-sm flex items-center gap-2">
                      <span>👤 Student Lead / President Details</span>
                    </h4>
                    
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

              {/* TAB 3: ACTIVITIES & ACHIEVEMENTS */}
              {activeTab === 'activities' && (
                <div className="space-y-6 text-xs">
                  {/* Activities List */}
                  <div>
                    <label className="font-extrabold text-slate-800 text-sm block mb-2">
                      Activities & Focus Areas
                    </label>

                    <div className="flex gap-2 mb-3">
                      <Input
                        value={newActivityInput}
                        onChange={(e) => setNewActivityInput(e.target.value)}
                        placeholder="Add new activity (e.g. Hackathons)..."
                        className="h-10 text-xs rounded-xl"
                      />
                      <Button onClick={handleAddActivity} className="rounded-xl text-xs font-bold">
                        Add
                      </Button>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {editingClub.activities.map((act, idx) => (
                        <span key={idx} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 text-slate-800 font-semibold text-xs border">
                          <span>✓ {act}</span>
                          <button onClick={() => handleRemoveActivity(idx)} className="text-red-500 hover:text-red-700">
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Achievements List */}
                  <div className="pt-4 border-t border-slate-100">
                    <label className="font-extrabold text-slate-800 text-sm block mb-2">
                      Achievements & Recognition Badges
                    </label>

                    <div className="flex gap-2 mb-3">
                      <Input
                        value={newAchievementInput}
                        onChange={(e) => setNewAchievementInput(e.target.value)}
                        placeholder="Add achievement (e.g. 🏆 SIH Finalist)..."
                        className="h-10 text-xs rounded-xl"
                      />
                      <Button onClick={handleAddAchievement} className="rounded-xl text-xs font-bold">
                        Add
                      </Button>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {editingClub.achievements.map((ach, idx) => (
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

              {/* TAB 4: CONDUCTED EVENTS & PHOTOS */}
              {activeTab === 'events' && (
                <div className="space-y-6 text-xs">
                  {/* Add Event Box */}
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

                  {/* List of Existing Conducted Events */}
                  <div>
                    <h4 className="font-extrabold text-slate-800 text-sm mb-3">
                      Existing Conducted Events ({editingClub.conductedEvents.length})
                    </h4>

                    {editingClub.conductedEvents.length === 0 ? (
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

              {/* TAB 5: GALLERY */}
              {activeTab === 'gallery' && (
                <div className="space-y-4 text-xs">
                  <label className="font-extrabold text-slate-800 text-sm block">
                    Club Photo Gallery URLs
                  </label>

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
                            setEditingClub({ ...editingClub, gallery: [...editingClub.gallery, url] });
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
                    {editingClub.gallery.map((imgUrl, idx) => (
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

            </div>

            {/* Dialog Footer Actions */}
            <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-end gap-3">
              <Button variant="ghost" onClick={() => setEditingClub(null)} className="rounded-xl text-xs">
                Cancel
              </Button>
              <Button 
                onClick={handleSaveClub}
                style={{ backgroundColor: editingClub.accentColor || '#2563EB' }}
                className="rounded-xl px-6 text-xs font-extrabold text-white shadow-md hover:opacity-90"
              >
                Save Club Changes
              </Button>
            </div>

          </DialogContent>
        </Dialog>
      )}

    </div>
  );
};

export default ManageClubs;
