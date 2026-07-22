import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import api from "@/lib/axios";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, MapPin, Users, Clock, Search, Filter, BookOpen, Bell, ArrowRight, ShieldCheck, Download, Award, PlayCircle, Layers } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";


interface EventItem {
  _id: string;
  title: string;
  category: string;
  description: string;
  date: string;
  startTime: string;
  endTime: string;
  registrationStartDate: string;
  registrationEndDate: string;
  venue: string;
  organizer: string;
  totalSeats: number;
  availableSeats?: number;
  imageUrl?: string;
  status: string;
}

interface TeamMemberItem {
  _id: string;
  fullName: string;
  prn: string;
  rollNumber: string;
  department: string;
  year: string;
  division: string;
  email: string;
  mobile: string;
  isTeamLeader: boolean;
  attendance: 'pending' | 'present' | 'absent';
  certificateNumber?: string;
}

interface RegistrationItem {
  _id: string;
  event: EventItem;
  registrationId: string;
  registrationDate: string;
  status: 'pending' | 'approved' | 'rejected';
  teamName: string;
  teamSize: number;
  projectTitle?: string;
  problemStatement?: string;
  projectDescription?: string;
  skills?: string;
  teamMembers: TeamMemberItem[];
}

interface NotificationItem {
  _id: string;
  title: string;
  body: string;
  type: string;
  isRead: boolean;
  createdAt: string;
}

function getCurrentUser() {
  try {
    const raw = localStorage.getItem("idea_hub_user");
    const token = localStorage.getItem("idea_hub_token");
    if (!raw || !token) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

const getStatusColor = (status: string) => {
  const s = status ? status.toLowerCase() : '';
  if (s === 'upcoming') return 'bg-blue-500/10 text-blue-500 hover:bg-blue-500/20 border-blue-500/30';
  if (s === 'registration open') return 'bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 border-emerald-500/30';
  if (s === 'registration closed') return 'bg-amber-500/10 text-amber-500 hover:bg-amber-500/20 border-amber-500/30';
  if (s === 'ongoing') return 'bg-purple-500/10 text-purple-500 hover:bg-purple-500/20 border-purple-500/30';
  if (s === 'completed') return 'bg-slate-500/10 text-slate-500 hover:bg-slate-500/20 border-slate-500/30';
  if (s === 'cancelled') return 'bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 border-rose-500/30';
  return 'bg-secondary/30 text-secondary-foreground';
};

const Events = () => {
  const [activeTab, setActiveTab] = useState("browse");
  const [events, setEvents] = useState<EventItem[]>([]);
  const [registrations, setRegistrations] = useState<RegistrationItem[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Search & Filter state
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("");

  // Drawer & temp filter state for mobile view
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [tempSearch, setTempSearch] = useState("");
  const [tempCategory, setTempCategory] = useState("all");
  const [tempStatus, setTempStatus] = useState("all");
  const [tempDate, setTempDate] = useState("");

  // Sync temp state when drawer opens
  useEffect(() => {
    if (isDrawerOpen) {
      setTempSearch(search);
      setTempCategory(category);
      setTempStatus(statusFilter);
      setTempDate(dateFilter);
    }
  }, [isDrawerOpen]);

  const handleApplyFilters = () => {
    setSearch(tempSearch);
    setCategory(tempCategory);
    setStatusFilter(tempStatus);
    setDateFilter(tempDate);
    setIsDrawerOpen(false);
  };

  const handleClearFilters = () => {
    setTempSearch("");
    setTempCategory("all");
    setTempStatus("all");
    setTempDate("");
    
    setSearch("");
    setCategory("all");
    setStatusFilter("all");
    setDateFilter("");
    setIsDrawerOpen(false);
  };

  const user = useMemo(getCurrentUser, []);

  // Fetch all events
  const fetchEvents = async () => {
    try {
      setLoading(true);
      // Query parameters
      const params: any = {};
      if (category !== "all") params.category = category;
      if (search) params.search = search;
      if (dateFilter) params.date = dateFilter;
      
      const res = await api.get("/events", { params });
      setEvents(res.data);
    } catch (e) {
      toast.error("Failed to load events");
    } finally {
      setLoading(false);
    }
  };

  // Fetch student registrations
  const fetchRegistrations = async () => {
    if (!user) return;
    try {
      const res = await api.get("/events/student/registrations");
      setRegistrations(res.data);
    } catch (e) {
      console.error("Failed to fetch registrations", e);
    }
  };

  // Fetch student notifications
  const fetchNotifications = async () => {
    if (!user) return;
    try {
      const res = await api.get("/events/student/notifications");
      setNotifications(res.data);
    } catch (e) {
      console.error("Failed to fetch notifications", e);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, [category, search, dateFilter]);

  useEffect(() => {
    if (activeTab === "my-events") {
      fetchRegistrations();
    } else if (activeTab === "notifications") {
      fetchNotifications();
    }
  }, [activeTab]);

  const markAsRead = async (id: string) => {
    try {
      await api.patch(`/events/student/notifications/${id}/read`);
      setNotifications(notifications.map(n => n._id === id ? { ...n, isRead: true } : n));
      toast.success("Notification read");
    } catch (e) {
      toast.error("Error updating notification");
    }
  };

  const handleDownloadCertificate = async (registrationId: string, eventTitle: string, memberId?: string) => {
    try {
      toast.loading("Preparing certificate download...");
      const response = await api.get(`/events/certificate/${registrationId}`, {
        params: memberId ? { memberId } : {},
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `certificate_${eventTitle.replace(/\s+/g, '_')}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.dismiss();
      toast.success("Certificate downloaded successfully!");
    } catch (err) {
      toast.dismiss();
      toast.error("Failed to download certificate.");
    }
  };

  // Dynamic filter for status tabs under Browse
  const filteredEvents = useMemo(() => {
    if (statusFilter === "all") return events;
    return events.filter(e => {
      const currentStatus = e.status.toLowerCase();
      if (statusFilter === "upcoming") return currentStatus === "upcoming" || currentStatus === "registration open";
      if (statusFilter === "ongoing") return currentStatus === "ongoing";
      if (statusFilter === "past") return currentStatus === "completed" || currentStatus === "registration closed" || currentStatus === "cancelled";
      return true;
    });
  }, [events, statusFilter]);

  const categories = useMemo(() => {
    const cats = new Set(events.map(e => e.category));
    return ["all", ...Array.from(cats)].filter(Boolean);
  }, [events]);

  // Participation History calculations
  const historyStats = useMemo(() => {
    const registered = registrations.length;
    const attended = registrations.reduce((sum, r) => sum + (r.teamMembers?.filter(m => m.attendance === 'present').length || 0), 0);
    const completed = registrations.filter(r => r.status === 'approved' && r.event && r.event.status && r.event.status.toLowerCase() === 'completed').length;
    const certificates = registrations.reduce((sum, r) => sum + (r.teamMembers?.filter(m => m.certificateNumber).length || 0), 0);
    return { registered, attended, completed, certificates };
  }, [registrations]);

  // Event Status Overview calculations
  const overviewStats = useMemo(() => {
    let upcoming = 0;
    let ongoing = 0;
    let past = 0;
    const total = events.length;

    events.forEach(e => {
      const s = e.status ? e.status.toLowerCase() : "";
      if (s === "upcoming" || s === "registration open") {
        upcoming++;
      } else if (s === "ongoing") {
        ongoing++;
      } else if (
        s === "completed" ||
        s === "registration closed" ||
        s === "cancelled"
      ) {
        past++;
      }
    });

    return { upcoming, ongoing, past, total };
  }, [events]);

  const handleOverviewFilter = (status: string) => {
    setActiveTab("browse");
    setStatusFilter(status);
    setTimeout(() => {
      const el = document.getElementById("events-tabs");
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }, 100);
  };


  return (
    <div className="container mx-auto px-4 py-4 sm:py-8">
      {/* Page Header */}
      <div className="mb-6 sm:mb-8 pt-2 sm:pt-4">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-foreground/90">Event Management</h1>
        <p className="text-xs sm:text-sm lg:text-base text-muted-foreground/80 mt-1.5 font-light">Create, manage and track all lab events in one place</p>
      </div>

      {/* Event Status Overview Section */}
      <div className="bg-[#F8FAFC] border border-slate-200/60 rounded-2xl p-4 sm:p-6 mb-6 sm:mb-8 shadow-sm">
        <h2 className="text-base sm:text-lg font-bold text-slate-800 mb-3 sm:mb-4 font-sans">Event Status Overview</h2>
        
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1 - Upcoming Events */}
          <div 
            className="flex flex-col justify-between w-full min-h-[120px] sm:h-[180px] p-4 sm:p-6 rounded-[16px] border bg-[#EFF6FF] border-[#BFDBFE] text-[#2563EB] shadow-sm hover:-translate-y-1 sm:hover:-translate-y-[2px] hover:shadow-md transition-all duration-300 font-sans cursor-pointer group"
            onClick={() => handleOverviewFilter("upcoming")}
          >
            {/* Mobile View */}
            <div className="flex sm:hidden flex-col items-center justify-between h-full w-full text-center py-0.5">
              <span className="font-semibold text-sm text-[#2563EB]">Upcoming Events</span>
              <div className="flex flex-col items-center">
                <span className="text-3xl font-bold text-slate-900 leading-none">
                  {String(overviewStats.upcoming).padStart(2, '0')}
                </span>
                <span className="text-xs text-slate-500 mt-1 font-medium">
                  Scheduled
                </span>
              </div>
              <Button 
                size="sm"
                variant="outline" 
                className="h-8 px-3 text-xs border-[#2563EB] text-[#2563EB] bg-white hover:bg-[#2563EB]/10 rounded-lg font-bold shadow-sm"
                onClick={(e) => {
                  e.stopPropagation();
                  handleOverviewFilter("upcoming");
                }}
              >
                View All
              </Button>
            </div>

            {/* Desktop View */}
            <div className="hidden sm:flex flex-col justify-between h-full w-full">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full flex items-center justify-center bg-white border border-[#BFDBFE] shadow-sm shrink-0">
                  <Calendar className="w-5 h-5 text-[#2563EB]" />
                </div>
                <span className="font-bold text-base text-[#2563EB]">Upcoming Events</span>
              </div>
              
              <div className="flex items-end justify-between mt-0">
                <div className="flex flex-col items-start">
                  <span className="text-[36px] font-extrabold text-slate-900 leading-none">
                    {String(overviewStats.upcoming).padStart(2, '0')}
                  </span>
                  <span className="text-[13px] text-slate-500 mt-1 leading-tight font-semibold">
                    Scheduled <span className="hidden sm:inline">• Yet to begin</span>
                  </span>
                </div>
                
                <Button 
                  variant="outline" 
                  className="h-8 px-4 py-1 text-xs border-[#2563EB] text-[#2563EB] bg-white hover:bg-[#2563EB]/10 rounded-lg font-bold shadow-sm shrink-0 min-h-[32px]"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleOverviewFilter("upcoming");
                  }}
                >
                  View All
                </Button>
              </div>
            </div>
          </div>

          {/* Card 2 - Ongoing Events */}
          <div 
            className="flex flex-col justify-between w-full min-h-[120px] sm:h-[180px] p-4 sm:p-6 rounded-[16px] border bg-[#F0FDF4] border-[#BBF7D0] text-[#22C55E] shadow-sm hover:-translate-y-1 sm:hover:-translate-y-[2px] hover:shadow-md transition-all duration-300 font-sans cursor-pointer group"
            onClick={() => handleOverviewFilter("ongoing")}
          >
            {/* Mobile View */}
            <div className="flex sm:hidden flex-col items-center justify-between h-full w-full text-center py-0.5">
              <span className="font-semibold text-sm text-[#22C55E]">Ongoing Events</span>
              <div className="flex flex-col items-center">
                <span className="text-3xl font-bold text-slate-900 leading-none">
                  {String(overviewStats.ongoing).padStart(2, '0')}
                </span>
                <span className="text-xs text-slate-500 mt-1 font-medium">
                  In Progress
                </span>
              </div>
              <Button 
                size="sm"
                variant="outline" 
                className="h-8 px-3 text-xs border-[#22C55E] text-[#22C55E] bg-white hover:bg-[#22C55E]/10 rounded-lg font-bold shadow-sm"
                onClick={(e) => {
                  e.stopPropagation();
                  handleOverviewFilter("ongoing");
                }}
              >
                View All
              </Button>
            </div>

            {/* Desktop View */}
            <div className="hidden sm:flex flex-col justify-between h-full w-full">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full flex items-center justify-center bg-white border border-[#BBF7D0] shadow-sm shrink-0">
                  <PlayCircle className="w-5 h-5 text-[#22C55E]" />
                </div>
                <span className="font-bold text-base text-[#22C55E]">Ongoing Events</span>
              </div>
              
              <div className="flex items-end justify-between mt-0">
                <div className="flex flex-col items-start">
                  <span className="text-[36px] font-extrabold text-slate-900 leading-none">
                    {String(overviewStats.ongoing).padStart(2, '0')}
                  </span>
                  <span className="text-[13px] text-slate-500 mt-1 leading-tight font-semibold">
                    In Progress <span className="hidden sm:inline">• Ongoing</span>
                  </span>
                </div>
                
                <Button 
                  variant="outline" 
                  className="h-8 px-4 py-1 text-xs border-[#22C55E] text-[#22C55E] bg-white hover:bg-[#22C55E]/10 rounded-lg font-bold shadow-sm shrink-0 min-h-[32px]"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleOverviewFilter("ongoing");
                  }}
                >
                  View All
                </Button>
              </div>
            </div>
          </div>

          {/* Card 3 - Past Events */}
          <div 
            className="flex flex-col justify-between w-full min-h-[120px] sm:h-[180px] p-4 sm:p-6 rounded-[16px] border bg-[#FFFBEB] border-[#FDE68A] text-[#F59E0B] shadow-sm hover:-translate-y-1 sm:hover:-translate-y-[2px] hover:shadow-md transition-all duration-300 font-sans cursor-pointer group"
            onClick={() => handleOverviewFilter("past")}
          >
            {/* Mobile View */}
            <div className="flex sm:hidden flex-col items-center justify-between h-full w-full text-center py-0.5">
              <span className="font-semibold text-sm text-[#F59E0B]">Past Events</span>
              <div className="flex flex-col items-center">
                <span className="text-3xl font-bold text-slate-900 leading-none">
                  {String(overviewStats.past).padStart(2, '0')}
                </span>
                <span className="text-xs text-slate-500 mt-1 font-medium">
                  Completed
                </span>
              </div>
              <Button 
                size="sm"
                variant="outline" 
                className="h-8 px-3 text-xs border-[#F59E0B] text-[#F59E0B] bg-white hover:bg-[#F59E0B]/10 rounded-lg font-bold shadow-sm"
                onClick={(e) => {
                  e.stopPropagation();
                  handleOverviewFilter("past");
                }}
              >
                View All
              </Button>
            </div>

            {/* Desktop View */}
            <div className="hidden sm:flex flex-col justify-between h-full w-full">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full flex items-center justify-center bg-white border border-[#FDE68A] shadow-sm shrink-0">
                  <Clock className="w-5 h-5 text-[#F59E0B]" />
                </div>
                <span className="font-bold text-base text-[#F59E0B]">Past Events</span>
              </div>
              
              <div className="flex items-end justify-between mt-0">
                <div className="flex flex-col items-start">
                  <span className="text-[36px] font-extrabold text-slate-900 leading-none">
                    {String(overviewStats.past).padStart(2, '0')}
                  </span>
                  <span className="text-[13px] text-slate-500 mt-1 leading-tight font-semibold">
                    Completed <span className="hidden sm:inline">• Finished</span>
                  </span>
                </div>
                
                <Button 
                  variant="outline" 
                  className="h-8 px-4 py-1 text-xs border-[#F59E0B] text-[#F59E0B] bg-white hover:bg-[#F59E0B]/10 rounded-lg font-bold shadow-sm shrink-0 min-h-[32px]"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleOverviewFilter("past");
                  }}
                >
                  View All
                </Button>
              </div>
            </div>
          </div>

          {/* Card 4 - Total Events */}
          <div 
            className="flex flex-col justify-between w-full min-h-[120px] sm:h-[180px] p-4 sm:p-6 rounded-[16px] border bg-[#FAF5FF] border-[#E9D5FF] text-[#9333EA] shadow-sm hover:-translate-y-1 sm:hover:-translate-y-[2px] hover:shadow-md transition-all duration-300 font-sans cursor-pointer group"
            onClick={() => handleOverviewFilter("all")}
          >
            {/* Mobile View */}
            <div className="flex sm:hidden flex-col items-center justify-between h-full w-full text-center py-0.5">
              <span className="font-semibold text-sm text-[#9333EA]">Total Events</span>
              <div className="flex flex-col items-center">
                <span className="text-3xl font-bold text-slate-900 leading-none">
                  {String(overviewStats.total).padStart(2, '0')}
                </span>
                <span className="text-xs text-slate-500 mt-1 font-medium">
                  All Time
                </span>
              </div>
              <Button 
                size="sm"
                variant="outline" 
                className="h-8 px-3 text-xs border-[#9333EA] text-[#9333EA] bg-white hover:bg-[#9333EA]/10 rounded-lg font-bold shadow-sm"
                onClick={(e) => {
                  e.stopPropagation();
                  handleOverviewFilter("all");
                }}
              >
                View All
              </Button>
            </div>

            {/* Desktop View */}
            <div className="hidden sm:flex flex-col justify-between h-full w-full">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full flex items-center justify-center bg-white border border-[#E9D5FF] shadow-sm shrink-0">
                  <Layers className="w-5 h-5 text-[#9333EA]" />
                </div>
                <span className="font-bold text-base text-[#9333EA]">Total Events</span>
              </div>
              
              <div className="flex items-end justify-between mt-0">
                <div className="flex flex-col items-start">
                  <span className="text-[36px] font-extrabold text-slate-900 leading-none">
                    {String(overviewStats.total).padStart(2, '0')}
                  </span>
                  <span className="text-[13px] text-slate-500 mt-1 leading-tight font-semibold">
                    All Time <span className="hidden sm:inline">• All events</span>
                  </span>
                </div>
                
                <Button 
                  variant="outline" 
                  className="h-8 px-4 py-1 text-xs border-[#9333EA] text-[#9333EA] bg-white hover:bg-[#9333EA]/10 rounded-lg font-bold shadow-sm shrink-0 min-h-[32px]"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleOverviewFilter("all");
                  }}
                >
                  View All
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>


      <Tabs id="events-tabs" value={activeTab} onValueChange={setActiveTab} className="space-y-4 sm:space-y-8">
        <div className="border-b pb-3 sm:pb-4 overflow-hidden">
          <div 
            className="w-full overflow-x-auto [&::-webkit-scrollbar]:hidden"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            <TabsList 
              className="flex w-full sm:w-auto justify-start sm:justify-center bg-slate-100/60 sm:bg-muted/50 p-1.5 sm:p-1 rounded-xl h-12 items-center min-w-max"
            >
              <TabsTrigger 
                value="browse" 
                className="rounded-lg font-bold px-5 py-2 text-sm sm:text-base flex items-center justify-center shrink-0 h-10 data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm sm:data-[state=active]:bg-primary sm:data-[state=active]:text-primary-foreground"
              >
                Events
              </TabsTrigger>
              {user && (
                <TabsTrigger 
                  value="my-events" 
                  className="rounded-lg font-bold px-5 py-2 text-sm sm:text-base flex items-center justify-center shrink-0 h-10 data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm sm:data-[state=active]:bg-primary sm:data-[state=active]:text-primary-foreground"
                >
                  History
                </TabsTrigger>
              )}
              {user && (
                <TabsTrigger 
                  value="notifications" 
                  className="rounded-lg font-bold px-5 py-2 text-sm sm:text-base flex items-center justify-center shrink-0 h-10 data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm sm:data-[state=active]:bg-primary sm:data-[state=active]:text-primary-foreground flex items-center gap-1.5"
                >
                  Alerts
                  {notifications.filter(n => !n.isRead).length > 0 && (
                    <Badge variant="destructive" className="h-5 w-5 p-0 flex items-center justify-center rounded-full text-[10px] font-bold bg-rose-500 text-white border-none shrink-0">
                      {notifications.filter(n => !n.isRead).length}
                    </Badge>
                  )}
                </TabsTrigger>
              )}
            </TabsList>
          </div>
        </div>

        {/* Tab 1: Browse Events */}
        <TabsContent value="browse" className="space-y-6">
          {/* Desktop Filters Panel (visible on sm screens and up) */}
          <div className="hidden sm:grid bg-card/30 border p-5 rounded-2xl grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 items-end shadow-sm">
            <div className="space-y-2">
              <Label htmlFor="search" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input 
                  id="search"
                  placeholder="Search events, organizer..." 
                  className="pl-9 rounded-xl border-border/60 bg-background/50 focus:bg-background transition-all"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="category" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Category</Label>
              <select 
                id="category"
                className="w-full h-10 px-3 rounded-xl border border-border/60 bg-background/50 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                {categories.map(cat => (
                  <option key={cat} value={cat} className="capitalize">{cat === 'all' ? 'All Categories' : cat}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="date" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Date</Label>
              <Input 
                id="date"
                type="date"
                className="rounded-xl border-border/60 bg-background/50"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="statusFilter" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status Group</Label>
              <select 
                id="statusFilter"
                className="w-full h-10 px-3 rounded-xl border border-border/60 bg-background/50 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">All Events</option>
                <option value="upcoming">Upcoming & Open</option>
                <option value="ongoing">Ongoing</option>
                <option value="past">Past / Closed</option>
              </select>
            </div>
          </div>

          {/* Mobile Filters Panel Toolbar (hidden on sm screens) */}
          <div className="flex sm:hidden items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input 
                placeholder="Search events..." 
                className="pl-9 rounded-xl border-border/60 bg-background/50 focus:bg-background transition-all"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Button 
              variant="outline" 
              className="rounded-xl border-border/60 h-10 gap-2 font-semibold bg-background"
              onClick={() => setIsDrawerOpen(true)}
            >
              <Filter className="w-4 h-4" /> Filters
            </Button>
          </div>

          {/* Mobile Bottom Sheet Filter Drawer */}
          <Sheet open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
            <SheetContent side="bottom" className="h-[70vh] rounded-t-3xl flex flex-col p-0 bg-background overflow-hidden border-t">
              <SheetHeader className="p-4 border-b text-center shrink-0">
                <SheetTitle className="text-base font-bold text-foreground">Filters</SheetTitle>
              </SheetHeader>
              
              <div className="flex-1 overflow-y-auto p-5 space-y-5">
                {/* Search Field inside Drawer */}
                <div className="space-y-1.5">
                  <Label htmlFor="drawer-search" className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Search</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input 
                      id="drawer-search"
                      placeholder="Search events, organizer..." 
                      className="pl-9 rounded-xl border-border/60 bg-background/50"
                      value={tempSearch}
                      onChange={(e) => setTempSearch(e.target.value)}
                    />
                  </div>
                </div>

                {/* Category Dropdown inside Drawer */}
                <div className="space-y-1.5">
                  <Label htmlFor="drawer-category" className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Category</Label>
                  <select 
                    id="drawer-category"
                    className="w-full h-10 px-3 rounded-xl border border-border/60 bg-background/50 text-sm focus:outline-none"
                    value={tempCategory}
                    onChange={(e) => setTempCategory(e.target.value)}
                  >
                    {categories.map(cat => (
                      <option key={cat} value={cat} className="capitalize">{cat === 'all' ? 'All Categories' : cat}</option>
                    ))}
                  </select>
                </div>

                {/* Date Picker inside Drawer */}
                <div className="space-y-1.5">
                  <Label htmlFor="drawer-date" className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Date</Label>
                  <Input 
                    id="drawer-date"
                    type="date"
                    className="rounded-xl border-border/60 bg-background/50"
                    value={tempDate}
                    onChange={(e) => setTempDate(e.target.value)}
                  />
                </div>

                {/* Status Dropdown inside Drawer */}
                <div className="space-y-1.5">
                  <Label htmlFor="drawer-status" className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Status Group</Label>
                  <select 
                    id="drawer-status"
                    className="w-full h-10 px-3 rounded-xl border border-border/60 bg-background/50 text-sm focus:outline-none"
                    value={tempStatus}
                    onChange={(e) => setTempStatus(e.target.value)}
                  >
                    <option value="all">All Events</option>
                    <option value="upcoming">Upcoming & Open</option>
                    <option value="ongoing">Ongoing</option>
                    <option value="past">Past / Closed</option>
                  </select>
                </div>
              </div>

              {/* Sticky Drawer Footer */}
              <div className="p-4 border-t bg-muted/20 shrink-0 flex gap-3">
                <Button 
                  variant="outline" 
                  className="flex-1 rounded-xl h-11 font-semibold"
                  onClick={handleClearFilters}
                >
                  Clear Filters
                </Button>
                <Button 
                  className="flex-1 rounded-xl h-11 font-semibold bg-primary text-primary-foreground"
                  onClick={handleApplyFilters}
                >
                  Apply Filters
                </Button>
              </div>
            </SheetContent>
          </Sheet>

          {/* Events Grid */}
          {loading ? (
            <div className="flex items-center justify-center py-24">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
            </div>
          ) : filteredEvents.length === 0 ? (
            <div className="text-center py-20 bg-muted/10 rounded-2xl border border-dashed border-muted">
              <Calendar className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
              <p className="text-muted-foreground text-lg font-medium">No events found matching your criteria.</p>
              <Button onClick={() => { setSearch(""); setCategory("all"); setDateFilter(""); setStatusFilter("all"); }} variant="link" className="mt-2 text-primary font-semibold">Clear Filters</Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {filteredEvents.map((event) => (
                <Card 
                  key={event._id} 
                  className="group relative flex flex-col bg-card/60 hover:bg-card border border-border/40 shadow-sm hover:shadow-lg rounded-3xl overflow-hidden transition-all duration-300 hover:-translate-y-1"
                >
                  {/* Image banner section */}
                  <div className="p-3 pb-0">
                    <div className="relative aspect-[16/10] w-full overflow-hidden rounded-[20px] bg-muted shadow-inner">
                      {event.imageUrl ? (
                        <img 
                          src={event.imageUrl} 
                          alt={event.title} 
                          className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-secondary/20 text-muted-foreground/30">
                          <BookOpen className="w-12 h-12" />
                        </div>
                      )}
                      
                      {/* Floating Status Badge */}
                      <div className="absolute top-3 right-3">
                        <Badge variant="outline" className={`font-bold px-3 py-1 text-xs rounded-full border bg-background/90 backdrop-blur ${getStatusColor(event.status)}`}>
                          {event.status}
                        </Badge>
                      </div>

                      {/* Floating Category Badge */}
                      <div className="absolute bottom-3 left-3">
                        <span className="px-2.5 py-1 bg-black/60 backdrop-blur-md rounded-lg text-[10px] font-bold uppercase tracking-wider text-white">
                          {event.category}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Body Content */}
                  <CardContent className="p-5 flex-grow flex flex-col justify-between">
                    <div>
                      <h3 className="text-xl font-bold text-foreground leading-tight group-hover:text-primary transition-colors mb-2">
                        {event.title}
                      </h3>
                      
                      <p className="text-xs text-muted-foreground font-semibold mb-4 flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5" />
                        Organized by: {event.organizer}
                      </p>

                      <div className="space-y-2 text-sm text-muted-foreground bg-muted/30 p-3.5 rounded-xl border border-border/30 mb-5">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-primary/70 shrink-0" />
                          <span>{new Date(event.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-primary/70 shrink-0" />
                          <span>{event.startTime} - {event.endTime}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-primary/70 shrink-0" />
                          <span className="truncate">{event.venue}</span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-border/40">
                      <div className="flex justify-between items-center text-xs font-semibold mb-4 text-muted-foreground/90">
                        <span>Seats Available: <strong className="text-foreground">{event.availableSeats ?? event.totalSeats} / {event.totalSeats}</strong></span>
                        <span className="text-rose-500/80">Deadline: {new Date(event.registrationEndDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                      </div>

                      <div className="flex gap-2.5">
                        <Link to={`/events/${event._id}`} className="flex-1">
                          <Button variant="outline" className="w-full rounded-xl border-primary/20 hover:bg-primary/5 hover:text-primary transition-all font-semibold text-sm sm:text-xs h-11 sm:h-10">
                            View Details
                          </Button>
                        </Link>
                        {event.status === 'Registration Open' && (
                          <Link to={`/events/${event._id}?register=true`} className="flex-1">
                            <Button className="w-full rounded-xl bg-primary hover:bg-primary/95 text-white transition-all font-semibold text-sm sm:text-xs h-11 sm:h-10">
                              Register
                            </Button>
                          </Link>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Tab 2: My Events & Participation History */}
        <TabsContent value="my-events" className="space-y-8">
          {/* History Summary Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="bg-card/40 border border-border/30 shadow-sm">
              <CardContent className="p-5 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Registered</p>
                  <p className="text-3xl font-extrabold text-foreground mt-1">{historyStats.registered}</p>
                </div>
                <div className="h-10 w-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary"><BookOpen className="w-5 h-5" /></div>
              </CardContent>
            </Card>
            <Card className="bg-card/40 border border-border/30 shadow-sm">
              <CardContent className="p-5 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Attended</p>
                  <p className="text-3xl font-extrabold text-foreground mt-1">{historyStats.attended}</p>
                </div>
                <div className="h-10 w-10 bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-500"><ShieldCheck className="w-5 h-5" /></div>
              </CardContent>
            </Card>
            <Card className="bg-card/40 border border-border/30 shadow-sm">
              <CardContent className="p-5 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Completed</p>
                  <p className="text-3xl font-extrabold text-foreground mt-1">{historyStats.completed}</p>
                </div>
                <div className="h-10 w-10 bg-blue-500/10 rounded-xl flex items-center justify-center text-blue-500"><Calendar className="w-5 h-5" /></div>
              </CardContent>
            </Card>
            <Card className="bg-card/40 border border-border/30 shadow-sm">
              <CardContent className="p-5 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Certificates</p>
                  <p className="text-3xl font-extrabold text-foreground mt-1">{historyStats.certificates}</p>
                </div>
                <div className="h-10 w-10 bg-amber-500/10 rounded-xl flex items-center justify-center text-amber-500"><Award className="w-5 h-5" /></div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* My Registrations List */}
            <div className="lg:col-span-2 space-y-4">
              <h2 className="text-2xl font-bold text-foreground">Registered Events</h2>
              
              {registrations.length === 0 ? (
                <div className="text-center py-16 bg-muted/10 rounded-2xl border border-dashed border-muted">
                  <p className="text-muted-foreground">You haven't registered for any events yet.</p>
                  <Button variant="link" className="text-primary font-bold mt-2" onClick={() => setActiveTab("browse")}>Browse Available Events</Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {registrations.map((reg) => (
                    <Card key={reg._id} className="bg-card border shadow-sm rounded-2xl overflow-hidden hover:shadow-md transition-shadow">
                      <CardContent className="p-5 flex flex-col items-start gap-4">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center w-full gap-2">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <h3 className="font-bold text-lg text-foreground">{reg.event?.title || 'Unknown Event'}</h3>
                              <Badge variant="outline" className={`text-[10px] uppercase font-bold ${
                                reg.status === 'approved' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
                                reg.status === 'rejected' ? 'bg-rose-500/10 text-rose-500 border-rose-500/20' :
                                'bg-amber-500/10 text-amber-500 border-amber-500/20'
                              }`}>
                                {reg.status}
                              </Badge>
                            </div>
                            
                            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground font-medium pt-0.5">
                              <span>Reg ID: <strong className="text-foreground">{reg.registrationId}</strong></span>
                              <span>Date: {new Date(reg.registrationDate).toLocaleDateString()}</span>
                              {reg.teamSize > 1 && <span>Team Name: <strong className="text-foreground">{reg.teamName}</strong></span>}
                            </div>
                          </div>

                          <div className="shrink-0">
                            <Link to={`/events/${reg.event?._id}`}>
                              <Button size="sm" variant="outline" className="rounded-xl text-xs h-9">
                                View Event
                              </Button>
                            </Link>
                          </div>
                        </div>

                        {/* Collapsible/Expandable Members list */}
                        {reg.teamMembers && reg.teamMembers.length > 0 && (
                          <div className="w-full pt-3 border-t space-y-2">
                            <p className="text-[10px] font-bold text-primary uppercase tracking-wider">Registered Participants & Certificates:</p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              {reg.teamMembers.map(m => (
                                <div key={m._id} className="flex justify-between items-center text-xs bg-muted/40 p-2.5 rounded-lg border">
                                  <div>
                                    <span className="font-bold text-foreground block">{m.fullName}</span>
                                    <span className="text-[10px] text-muted-foreground font-semibold">
                                      {m.isTeamLeader ? '★ Leader' : 'Member'} • Attendance: <span className="capitalize">{m.attendance}</span>
                                    </span>
                                  </div>
                                  {reg.status === 'approved' && m.attendance === 'present' && m.certificateNumber && (
                                    <Button 
                                      size="sm"
                                      variant="ghost"
                                      className="rounded-lg h-7 px-2 text-amber-500 hover:text-amber-600 hover:bg-amber-500/10 font-bold text-[10px] flex gap-1 items-center border border-amber-500/20"
                                      onClick={() => handleDownloadCertificate(reg.registrationId, reg.event.title, m._id)}
                                    >
                                      <Download className="w-3.5 h-3.5" /> Certificate
                                    </Button>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>

            {/* Timeline view of activity */}
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-foreground">Participation Timeline</h2>
              <Card className="p-5 bg-card/40 border border-border/30 shadow-sm rounded-2xl">
                <div className="relative pl-6 border-l border-border/80 space-y-6">
                  {registrations.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center pl-0 border-l-0">No timeline milestones available.</p>
                  ) : (
                    registrations.map((reg) => {
                      const wasAttended = reg.teamMembers?.some(m => m.attendance === 'present');
                      return (
                        <div key={reg._id} className="relative">
                          {/* Dot */}
                          <div className={`absolute -left-[30px] top-1 h-3 w-3 rounded-full border-2 bg-background ${
                            wasAttended ? 'border-emerald-500 bg-emerald-500' :
                            reg.status === 'approved' ? 'border-primary bg-primary' : 'border-amber-500 bg-amber-500'
                          }`} />
                          
                          <div className="space-y-1">
                            <p className="text-xs font-semibold text-muted-foreground">{new Date(reg.registrationDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                            <h4 className="font-bold text-sm text-foreground line-clamp-1">{reg.event?.title}</h4>
                            <p className="text-xs text-muted-foreground">
                              Status: <span className="capitalize font-semibold text-foreground">{reg.status}</span>
                              {wasAttended && " • Attended"}
                            </p>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* Tab 3: Notifications */}
        <TabsContent value="notifications" className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-foreground">In-App Notifications</h2>
            {notifications.filter(n => !n.isRead).length > 0 && (
              <span className="text-xs font-semibold text-muted-foreground">Unread alerts to clear</span>
            )}
          </div>

          {notifications.length === 0 ? (
            <div className="text-center py-20 bg-muted/10 rounded-2xl border border-dashed border-muted">
              <Bell className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
              <p className="text-muted-foreground">Your notifications inbox is empty.</p>
            </div>
          ) : (
            <div className="space-y-4 max-w-3xl">
              {notifications.map((notif) => (
                <Card 
                  key={notif._id} 
                  className={`border transition-all rounded-2xl overflow-hidden shadow-sm ${
                    notif.isRead ? 'bg-card/40 opacity-75' : 'bg-card border-l-4 border-l-primary'
                  }`}
                >
                  <CardContent className="p-5 flex justify-between items-start gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h3 className={`font-bold ${notif.isRead ? 'text-foreground/85' : 'text-foreground'}`}>{notif.title}</h3>
                        {!notif.isRead && (
                          <Badge variant="destructive" className="h-2 w-2 p-0 rounded-full" />
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">{notif.body}</p>
                      
                      {notif.type && notif.type.startsWith('machinery_completion_reminder:') && !notif.isRead && (
                        <div className="flex gap-2 pt-2">
                          <Link to={`/machinery?complete=${notif.type.split(':')[1]}`}>
                            <Button 
                              size="sm" 
                              className="bg-green-600 hover:bg-green-700 text-white font-bold text-[10px] h-7 px-3 rounded-lg"
                              onClick={() => markAsRead(notif._id)}
                            >
                              Yes, Work Completed
                            </Button>
                          </Link>
                          <Link to={`/machinery?extend=${notif.type.split(':')[1]}`}>
                            <Button 
                              size="sm" 
                              className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-[10px] h-7 px-3 rounded-lg"
                              onClick={() => markAsRead(notif._id)}
                            >
                              Extend Usage Request
                            </Button>
                          </Link>
                        </div>
                      )}

                      <p className="text-[10px] text-muted-foreground font-semibold pt-1">
                        {new Date(notif.createdAt).toLocaleString()}
                      </p>
                    </div>

                    {!notif.isRead && (
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        className="rounded-xl text-xs hover:bg-primary/5 text-primary"
                        onClick={() => markAsRead(notif._id)}
                      >
                        Mark read
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Events;
