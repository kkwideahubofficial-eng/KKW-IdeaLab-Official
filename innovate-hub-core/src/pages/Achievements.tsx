import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Trophy,
  Users,
  Calendar,
  PlusCircle,
  Search,
  Filter,
  Star,
  Landmark,
  BookOpen,
  Shield,
  Award,
  Banknote,
  BadgeCheck,
  TrendingUp,
  Globe,
  Sparkles,
  ArrowRight,
  X,
  MapPin,
  Building,
  Bookmark,
  FileText,
  CheckCircle,
  Check,
  Pencil,
  Trash2,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import api from "@/lib/axios";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";

interface AchievementItem {
  _id: string;
  title: string;
  description: string;
  date: string;
  achievedBy: string;
  imageUrl?: string;
  gallery?: string[];
  timeline?: Array<{ _id?: string; date: string; label: string }>;
  certificates?: Array<{ _id?: string; title: string; achievedBy: string; date: string; fileUrl?: string }>;
  achievementType?: string;
  contributionDomain?: string;
  competitionLevel?: string;
  prizeAmount?: number;
  eventYear?: number;
  teamSize?: number;
  ideaHubContributions?: Record<string, boolean>;
}

interface AchievementAnalytics {
  totalAchievements: number;
  totalStudentsParticipated: number;
  totalCompetitions: number;
  totalPrizeMoney: number;
  nationalAchievements: number;
  internationalAchievements: number;
  researchPublications: number;
  patents: number;
}

interface PrizeAnalytics {
  summary: {
    totalPrizeMoney: number;
    statePrizeMoney: number;
    nationalPrizeMoney: number;
    internationalPrizeMoney: number;
    averagePrizeValue: number;
    highestPrizeWon: number;
  };
  charts: {
    yearWisePrizeDistribution: Array<{ year: number; totalPrizeMoney: number; achievementCount: number }>;
    competitionWisePrizeDistribution: Array<{ label: string; totalPrizeMoney: number; count: number }>;
    achievementTypeDistribution: Array<{ name: string; value: number }>;
  };
}

interface ContributionAnalytics {
  workspaceSupportCount: number;
  mentorshipCount: number;
  prototypeDevelopmentCount: number;
  testingFacilityUsage: number;
  competitionRegistrationSupport: number;
  industryMentoringSupport: number;
}

interface TimelineEntry {
  year: number;
  achievements: AchievementItem[];
}

const PAGE_SIZE = 9;

const DEFAULT_FILTERS = {
  search: "",
  achievementType: "all",
  competitionLevel: "all",
  contributionDomain: "all",
  year: "all",
  team: "",
  prizeWinner: "all",
};

const INITIAL_FORM = {
  title: "",
  description: "",
  date: "",
  achievedBy: "",
  imageUrl: "",
  gallery: [] as string[],
  timeline: [] as Array<{ date: string; label: string }>,
  certificates: [] as Array<{ title: string; achievedBy: string; date: string; fileUrl?: string; file?: File }>,
  achievementType: "Competition",
  competitionLevel: "National",
  contributionDomain: "AI/ML",
  prizeAmount: "",
  eventYear: "",
  teamSize: "1",
  ideaHubContributions: {
    workspaceProvided: false,
    meetingRoomAccess: false,
    dPrintingSupport: false,
    electronicsComponents: false,
    prototypeDevelopment: false,
    testingFacility: false,
    mentorshipSupport: false,
    presentationGuidance: false,
    competitionRegistration: false,
    industryMentoring: false,
  } as Record<string, boolean>
};

const CONTRIBUTION_FIELDS = [
  { key: 'workspaceProvided', label: 'Workspace Provided' },
  { key: 'meetingRoomAccess', label: 'Meeting Room Access' },
  { key: 'dPrintingSupport', label: '3D Printing Support' },
  { key: 'electronicsComponents', label: 'Electronics Components' },
  { key: 'prototypeDevelopment', label: 'Prototype Fabrication' },
  { key: 'testingFacility', label: 'Testing Facilities' },
  { key: 'mentorshipSupport', label: 'Mentorship Support' },
  { key: 'presentationGuidance', label: 'Presentation Guidance' },
  { key: 'competitionRegistration', label: 'Registration Support' },
  { key: 'industryMentoring', label: 'Industry Mentorship' },
];

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

const Achievements = () => {
  const [achievements, setAchievements] = useState<AchievementItem[]>([]);
  const [analytics, setAnalytics] = useState<AchievementAnalytics | null>(null);
  const [prizeAnalytics, setPrizeAnalytics] = useState<PrizeAnalytics | null>(null);
  const [contributionAnalytics, setContributionAnalytics] = useState<ContributionAnalytics | null>(null);
  const [timeline, setTimeline] = useState<TimelineEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [analyticsLoading, setAnalyticsLoading] = useState(true);
  
  // Dialog (Create/Edit Form) states
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(INITIAL_FORM);
  const [newGalleryFiles, setNewGalleryFiles] = useState<File[]>([]);
  
  // Custom Timeline Builder states
  const [timelineLabel, setTimelineLabel] = useState("");
  const [timelineDate, setTimelineDate] = useState("");
  const [editingTimelineIdx, setEditingTimelineIdx] = useState<number | null>(null);

  // Dedicated Timeline Dialog states
  const [isTimelineDialogOpen, setIsTimelineDialogOpen] = useState(false);
  const [timelineDialogList, setTimelineDialogList] = useState<Array<{ date: string; label: string }>>([]);
  const [timelineDialogLabel, setTimelineDialogLabel] = useState("");
  const [timelineDialogDate, setTimelineDialogDate] = useState("");
  const [editingTimelineDialogIdx, setEditingTimelineDialogIdx] = useState<number | null>(null);

  // Staged Certificates Builder states (main form)
  const [certTitle, setCertTitle] = useState("");
  const [certRecipient, setCertRecipient] = useState("");
  const [certDate, setCertDate] = useState("");
  const [certFile, setCertFile] = useState<File | null>(null);
  const [editingCertIdx, setEditingCertIdx] = useState<number | null>(null);

  // Dedicated Certificates Dialog states
  const [isCertDialogOpen, setIsCertDialogOpen] = useState(false);
  const [certDialogList, setCertDialogList] = useState<Array<{ title: string; achievedBy: string; date: string; fileUrl?: string; file?: File }>>([]);
  const [certDialogTitle, setCertDialogTitle] = useState("");
  const [certDialogRecipient, setCertDialogRecipient] = useState("");
  const [certDialogDate, setCertDialogDate] = useState("");
  const [certDialogFile, setCertDialogFile] = useState<File | null>(null);
  const [editingCertDialogIdx, setEditingCertDialogIdx] = useState<number | null>(null);
  
  // Filter states
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ page: 1, limit: PAGE_SIZE, total: 0, totalPages: 1 });

  // Debounced search state
  const [searchQuery, setSearchQuery] = useState(filters.search);

  // Selected Achievement state for master-detail view
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isDescExpanded, setIsDescExpanded] = useState(false);

  // Drawer (slide-over sheet) filter state
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [tempFilters, setTempFilters] = useState(DEFAULT_FILTERS);

  // Certificate Modal preview state
  const [zoomedCertificate, setZoomedCertificate] = useState<{ title: string; achievedBy: string; date: string; fileUrl?: string } | null>(null);

  const user = useMemo(getCurrentUser, []);
  const isCoordinator = user?.role === 'coordinator';

  // Sync temp filters when drawer opens
  useEffect(() => {
    if (isDrawerOpen) {
      setTempFilters(filters);
    }
  }, [isDrawerOpen, filters]);

  // Debounce search input changes
  useEffect(() => {
    const handler = setTimeout(() => {
      setFilters(prev => ({ ...prev, search: searchQuery }));
    }, 400);

    return () => {
      clearTimeout(handler);
    };
  }, [searchQuery]);

  const handleApplyFilters = () => {
    setFilters(tempFilters);
    setPage(1);
    setIsDrawerOpen(false);
  };

  const handleClearFilters = () => {
    setTempFilters(DEFAULT_FILTERS);
    setFilters(DEFAULT_FILTERS);
    setSearchQuery("");
    setPage(1);
    setIsDrawerOpen(false);
  };

  const filterQuery = useMemo(() => {
    const params: Record<string, string | number> = { page, limit: PAGE_SIZE };
    if (filters.search.trim()) params.search = filters.search.trim();
    if (filters.achievementType !== 'all') params.achievementType = filters.achievementType;
    if (filters.competitionLevel !== 'all') params.competitionLevel = filters.competitionLevel;
    if (filters.contributionDomain !== 'all') params.contributionDomain = filters.contributionDomain;
    if (filters.year !== 'all') params.year = filters.year;
    if (filters.team.trim()) params.team = filters.team.trim();
    if (filters.prizeWinner !== 'all') params.prizeWinner = filters.prizeWinner;
    return params;
  }, [filters, page]);

  const achievementTypes = useMemo(() => [
    'Competition',
    'Hackathon',
    'Workshop',
    'Research Paper',
    'Patent',
    'Project',
    'Internship',
    'Sports',
    'Innovation Challenge',
  ], []);

  const contributionDomains = useMemo(() => [
    'AI/ML',
    'Web Development',
    'Cyber Security',
    'IoT',
    'Robotics',
    'Cloud Computing',
    'Data Science',
    'Embedded Systems',
  ], []);

  const competitionLevels = useMemo(() => ['State', 'National', 'International', 'College'], []);

  const availableYears = useMemo(() => {
    const years = new Set<number>();
    if (timeline.length > 0) {
      timeline.forEach((entry) => years.add(entry.year));
    }
    achievements.forEach((item) => {
      const year = item.eventYear || new Date(item.date).getFullYear();
      if (year) years.add(year);
    });
    return Array.from(years).sort((a, b) => b - a);
  }, [timeline, achievements]);

  // Master-Detail selected item selection
  const activeAchievement = useMemo(() => {
    if (achievements.length === 0) return null;
    return achievements.find(a => a._id === selectedId) || achievements[0];
  }, [achievements, selectedId]);

  useEffect(() => {
    if (activeAchievement && activeAchievement._id !== selectedId) {
      setSelectedId(activeAchievement._id);
    }
  }, [activeAchievement, selectedId]);

  const activeContributions = useMemo(() => {
    if (!activeAchievement) return [];
    return CONTRIBUTION_FIELDS.filter(field => activeAchievement.ideaHubContributions?.[field.key]);
  }, [activeAchievement]);

  const getVenue = (level?: string) => {
    if (level === 'International') return 'Bangalore';
    if (level === 'National') return 'New Delhi';
    if (level === 'State') return 'Pune';
    return 'KKWIEER';
  };

  const fetchAnalytics = async () => {
    try {
      setAnalyticsLoading(true);
      const [analyticsRes, prizeRes, contributionRes, timelineRes] = await Promise.all([
        api.get('/achievements/analytics'),
        api.get('/achievements/prize-analytics'),
        api.get('/achievements/contributions'),
        api.get('/achievements/timeline'),
      ]);
      setAnalytics(analyticsRes.data);
      setPrizeAnalytics(prizeRes.data);
      setContributionAnalytics(contributionRes.data);
      setTimeline(timelineRes.data || []);
    } catch {
      toast.error('Failed to load achievement analytics');
    } finally {
      setAnalyticsLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  useEffect(() => {
    const fetchAchievements = async () => {
      try {
        setLoading(true);
        const res = await api.get('/achievements/filter', { params: filterQuery });
        setAchievements(res.data?.data || []);
        setPagination(res.data?.pagination || { page: 1, limit: PAGE_SIZE, total: 0, totalPages: 1 });
      } catch {
        toast.error('Failed to load achievements');
      } finally {
        setLoading(false);
      }
    };
    fetchAchievements();
  }, [filterQuery]);

  useEffect(() => {
    setPage(1);
  }, [filters.search, filters.achievementType, filters.competitionLevel, filters.contributionDomain, filters.year, filters.team, filters.prizeWinner]);

  const clearFilters = () => {
    setFilters(DEFAULT_FILTERS);
    setSearchQuery("");
    setPage(1);
  };

  // Timeline generator helper
  const calculateMilestones = (baseDateStr: string) => {
    const baseDate = new Date(baseDateStr);
    const formatDate = (d: Date) => d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    
    const d1 = new Date(baseDate.getTime() - 60 * 24 * 60 * 60 * 1000);
    const d2 = new Date(baseDate.getTime() - 40 * 24 * 60 * 60 * 1000);
    const d3 = new Date(baseDate.getTime() - 20 * 24 * 60 * 60 * 1000);
    const d4 = new Date(baseDate.getTime() - 10 * 24 * 60 * 60 * 1000);
    
    return [
      { date: formatDate(d1), label: 'Idea Generated' },
      { date: formatDate(d2), label: 'Prototype Development' },
      { date: formatDate(d3), label: 'Testing & Validation' },
      { date: formatDate(d4), label: 'Final Presentation' },
      { date: formatDate(baseDate), label: 'Won First Prize', active: true },
    ];
  };

  const displayTimeline = useMemo(() => {
    if (!activeAchievement) return [];
    if (activeAchievement.timeline && activeAchievement.timeline.length > 0) {
      const sorted = [...activeAchievement.timeline].sort((a, b) => {
        return new Date(a.date).getTime() - new Date(b.date).getTime();
      });
      return sorted.map((item, idx) => ({
        date: new Date(item.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
        label: item.label,
        active: idx === sorted.length - 1
      }));
    }
    return calculateMilestones(activeAchievement.date);
  }, [activeAchievement]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const formData = new FormData();
      formData.append('title', form.title);
      formData.append('description', form.description);
      formData.append('date', new Date(form.date).toISOString());
      formData.append('achievedBy', form.achievedBy);
      formData.append('achievementType', form.achievementType);
      formData.append('competitionLevel', form.competitionLevel);
      formData.append('contributionDomain', form.contributionDomain);
      if (form.prizeAmount) formData.append('prizeAmount', form.prizeAmount);
      if (form.eventYear) formData.append('eventYear', form.eventYear);
      if (form.teamSize) formData.append('teamSize', form.teamSize);
      formData.append('ideaHubContributions', JSON.stringify(form.ideaHubContributions));
      if (form.imageUrl) formData.append('imageUrl', form.imageUrl);
      formData.append('existingGallery', JSON.stringify(form.gallery));
      formData.append('timeline', JSON.stringify(form.timeline));
      
      let fileCount = 0;
      const certificatesPayload = form.certificates.map(cert => {
        if (cert.file) {
          formData.append('certificateFiles', cert.file);
          const currentIdx = fileCount;
          fileCount++;
          return {
            title: cert.title,
            achievedBy: cert.achievedBy,
            date: cert.date,
            fileIndex: currentIdx
          };
        }
        return {
          title: cert.title,
          achievedBy: cert.achievedBy,
          date: cert.date,
          fileUrl: cert.fileUrl
        };
      });
      formData.append('certificates', JSON.stringify(certificatesPayload));

      const fileInput = document.getElementById('achievement-image') as HTMLInputElement | null;
      if (fileInput?.files && fileInput.files[0]) {
        formData.append('image', fileInput.files[0]);
      }

      newGalleryFiles.forEach((file) => {
        formData.append('gallery', file);
      });

      if (editingId) {
        const res = await api.put(`/achievements/${editingId}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
        setAchievements(achievements.map(a => a._id === editingId ? res.data : a));
        toast.success('Achievement updated');
      } else {
        const res = await api.post('/achievements', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
        setAchievements([res.data, ...achievements]);
        toast.success('Achievement created');
      }
      
      setOpen(false);
      setForm(INITIAL_FORM);
      setNewGalleryFiles([]);
      setTimelineLabel("");
      setTimelineDate("");
      setEditingTimelineIdx(null);
      setCertTitle("");
      setCertRecipient("");
      setCertDate("");
      setCertFile(null);
      setEditingCertIdx(null);
      setEditingId(null);
      fetchAnalytics();
    } catch {
      toast.error(editingId ? 'Failed to update achievement' : 'Failed to create achievement');
    }
  };

  const startEdit = (achievement: AchievementItem) => {
    setEditingId(achievement._id);
    setNewGalleryFiles([]);
    setTimelineLabel("");
    setTimelineDate("");
    setEditingTimelineIdx(null);
    setCertTitle("");
    setCertRecipient("");
    setCertDate("");
    setCertFile(null);
    setEditingCertIdx(null);
    setForm({
      title: achievement.title,
      description: achievement.description,
      date: achievement.date ? new Date(achievement.date).toISOString().split('T')[0] : "",
      achievedBy: achievement.achievedBy,
      imageUrl: achievement.imageUrl || "",
      gallery: achievement.gallery || [],
      timeline: achievement.timeline ? achievement.timeline.map(item => ({ date: item.date ? new Date(item.date).toISOString().split('T')[0] : "", label: item.label })) : [],
      certificates: achievement.certificates ? achievement.certificates.map(item => ({
        title: item.title,
        achievedBy: item.achievedBy,
        date: item.date ? new Date(item.date).toISOString().split('T')[0] : "",
        fileUrl: item.fileUrl || ""
      })) : [],
      achievementType: achievement.achievementType || "Competition",
      competitionLevel: achievement.competitionLevel || "National",
      contributionDomain: achievement.contributionDomain || "AI/ML",
      prizeAmount: achievement.prizeAmount !== undefined ? String(achievement.prizeAmount) : "",
      eventYear: achievement.eventYear !== undefined ? String(achievement.eventYear) : "",
      teamSize: achievement.teamSize !== undefined ? String(achievement.teamSize) : "1",
      ideaHubContributions: {
        workspaceProvided: !!achievement.ideaHubContributions?.workspaceProvided,
        meetingRoomAccess: !!achievement.ideaHubContributions?.meetingRoomAccess,
        dPrintingSupport: !!achievement.ideaHubContributions?.dPrintingSupport,
        electronicsComponents: !!achievement.ideaHubContributions?.electronicsComponents,
        prototypeDevelopment: !!achievement.ideaHubContributions?.prototypeDevelopment,
        testingFacility: !!achievement.ideaHubContributions?.testingFacility,
        mentorshipSupport: !!achievement.ideaHubContributions?.mentorshipSupport,
        presentationGuidance: !!achievement.ideaHubContributions?.presentationGuidance,
        competitionRegistration: !!achievement.ideaHubContributions?.competitionRegistration,
        industryMentoring: !!achievement.ideaHubContributions?.industryMentoring,
      }
    });
    setOpen(true);
  };

  // Cloudinary image deletion handlers
  const handleDeleteShowcaseImage = async () => {
    if (!form.imageUrl) return;
    if (form.imageUrl.includes('cloudinary.com')) {
      const toastId = toast.loading('Deleting photo from Cloudinary...');
      try {
        await api.post('/achievements/delete-image', { imageUrl: form.imageUrl });
        toast.success('Photo deleted from Cloudinary successfully!', { id: toastId });
      } catch (err) {
        console.error(err);
        toast.error('Failed to delete photo from Cloudinary', { id: toastId });
      }
    } else {
      toast.success('Image reference removed');
    }
    setForm(prev => ({ ...prev, imageUrl: '' }));
    const fileInput = document.getElementById('achievement-image') as HTMLInputElement | null;
    if (fileInput) fileInput.value = '';
  };

  const handleDeleteGalleryImage = async (url: string, idx: number) => {
    if (url.includes('cloudinary.com')) {
      const toastId = toast.loading('Deleting gallery photo from Cloudinary...');
      try {
        await api.post('/achievements/delete-image', { imageUrl: url });
        toast.success('Gallery photo deleted from Cloudinary!', { id: toastId });
      } catch (err) {
        console.error(err);
        toast.error('Failed to delete gallery photo from Cloudinary', { id: toastId });
      }
    } else {
      toast.success('Gallery photo reference removed');
    }
    setForm(prev => ({ ...prev, gallery: prev.gallery.filter((_, i) => i !== idx) }));
  };

  // Staged Timeline Helpers for main dialog form
  const handleAddStagedTimeline = () => {
    if (!timelineLabel.trim() || !timelineDate) {
      toast.error("Please enter both a label and a date for the milestone");
      return;
    }
    
    const newItem = { date: timelineDate, label: timelineLabel.trim() };
    let updated = [...form.timeline];
    
    if (editingTimelineIdx !== null) {
      updated[editingTimelineIdx] = newItem;
      setEditingTimelineIdx(null);
    } else {
      updated.push(newItem);
    }
    
    // Sort chronologically
    updated.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    setForm(prev => ({ ...prev, timeline: updated }));
    setTimelineLabel("");
    setTimelineDate("");
  };

  const handleEditStagedTimeline = (index: number) => {
    const item = form.timeline[index];
    setTimelineLabel(item.label);
    setTimelineDate(item.date);
    setEditingTimelineIdx(index);
  };

  const handleDeleteStagedTimeline = (index: number) => {
    setForm(prev => ({ ...prev, timeline: prev.timeline.filter((_, i) => i !== index) }));
    if (editingTimelineIdx === index) {
      setTimelineLabel("");
      setTimelineDate("");
      setEditingTimelineIdx(null);
    } else if (editingTimelineIdx !== null && editingTimelineIdx > index) {
      setEditingTimelineIdx(editingTimelineIdx - 1);
    }
  };

  // Dedicated Timeline Dialog Helpers
  const handleOpenTimelineDialog = (achievement: AchievementItem) => {
    const initialList = achievement.timeline 
      ? achievement.timeline.map(item => ({
          date: item.date ? new Date(item.date).toISOString().split('T')[0] : "",
          label: item.label
        }))
      : [];
    
    setTimelineDialogList(initialList.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()));
    setTimelineDialogLabel("");
    setTimelineDialogDate("");
    setEditingTimelineDialogIdx(null);
    setIsTimelineDialogOpen(true);
  };

  const handleAddTimelineDialogItem = () => {
    if (!timelineDialogLabel.trim() || !timelineDialogDate) {
      toast.error("Please enter both a label and a date for the milestone");
      return;
    }
    
    const newItem = { date: timelineDialogDate, label: timelineDialogLabel.trim() };
    let updated = [...timelineDialogList];
    
    if (editingTimelineDialogIdx !== null) {
      updated[editingTimelineDialogIdx] = newItem;
      setEditingTimelineDialogIdx(null);
    } else {
      updated.push(newItem);
    }
    
    // Sort chronologically
    updated.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    setTimelineDialogList(updated);
    setTimelineDialogLabel("");
    setTimelineDialogDate("");
  };

  const handleEditTimelineDialogItem = (index: number) => {
    const item = timelineDialogList[index];
    setTimelineDialogLabel(item.label);
    setTimelineDialogDate(item.date);
    setEditingTimelineDialogIdx(index);
  };

  const handleDeleteTimelineDialogItem = (index: number) => {
    setTimelineDialogList(prev => prev.filter((_, i) => i !== index));
    if (editingTimelineDialogIdx === index) {
      setTimelineDialogLabel("");
      setTimelineDialogDate("");
      setEditingTimelineDialogIdx(null);
    } else if (editingTimelineDialogIdx !== null && editingTimelineDialogIdx > index) {
      setEditingTimelineDialogIdx(editingTimelineDialogIdx - 1);
    }
  };

  const handleSaveTimeline = async () => {
    if (!activeAchievement) return;
    try {
      const formData = new FormData();
      formData.append('title', activeAchievement.title);
      formData.append('description', activeAchievement.description);
      formData.append('date', new Date(activeAchievement.date).toISOString());
      formData.append('achievedBy', activeAchievement.achievedBy);
      if (activeAchievement.achievementType) formData.append('achievementType', activeAchievement.achievementType);
      if (activeAchievement.competitionLevel) formData.append('competitionLevel', activeAchievement.competitionLevel);
      if (activeAchievement.contributionDomain) formData.append('contributionDomain', activeAchievement.contributionDomain);
      if (activeAchievement.prizeAmount) formData.append('prizeAmount', String(activeAchievement.prizeAmount));
      if (activeAchievement.eventYear) formData.append('eventYear', String(activeAchievement.eventYear));
      if (activeAchievement.teamSize) formData.append('teamSize', String(activeAchievement.teamSize));
      if (activeAchievement.imageUrl) formData.append('imageUrl', activeAchievement.imageUrl);
      
      // Keep existing gallery
      if (activeAchievement.gallery) {
        formData.append('existingGallery', JSON.stringify(activeAchievement.gallery));
      }
      
      // Add the timeline
      formData.append('timeline', JSON.stringify(timelineDialogList));
      
      // Append existing contributions
      if (activeAchievement.ideaHubContributions) {
        formData.append('ideaHubContributions', JSON.stringify(activeAchievement.ideaHubContributions));
      }

      const res = await api.put(`/achievements/${activeAchievement._id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      // Update local state
      setAchievements(achievements.map(a => a._id === activeAchievement._id ? res.data : a));
      toast.success('Timeline updated successfully');
      setIsTimelineDialogOpen(false);
      fetchAnalytics();
    } catch (error) {
      toast.error('Failed to update timeline');
    }
  };

  // Staged Certificates Helpers for main dialog form
  const handleAddStagedCert = () => {
    if (!certTitle.trim() || !certRecipient.trim() || !certDate) {
      toast.error("Please fill in title, recipient, and date for the certificate");
      return;
    }
    
    const newItem = { 
      title: certTitle.trim(), 
      achievedBy: certRecipient.trim(), 
      date: certDate,
      fileUrl: editingCertIdx !== null ? form.certificates[editingCertIdx].fileUrl : undefined,
      file: certFile || undefined
    };
    
    let updated = [...form.certificates];
    if (editingCertIdx !== null) {
      updated[editingCertIdx] = newItem;
      setEditingCertIdx(null);
    } else {
      updated.push(newItem);
    }
    
    setForm(prev => ({ ...prev, certificates: updated }));
    setCertTitle("");
    setCertRecipient("");
    setCertDate("");
    setCertFile(null);
  };

  const handleEditStagedCert = (index: number) => {
    const item = form.certificates[index];
    setCertTitle(item.title);
    setCertRecipient(item.achievedBy);
    setCertDate(item.date);
    setCertFile(item.file || null);
    setEditingCertIdx(index);
  };

  const handleDeleteStagedCert = (index: number) => {
    setForm(prev => ({ ...prev, certificates: prev.certificates.filter((_, i) => i !== index) }));
    if (editingCertIdx === index) {
      setCertTitle("");
      setCertRecipient("");
      setCertDate("");
      setCertFile(null);
      setEditingCertIdx(null);
    } else if (editingCertIdx !== null && editingCertIdx > index) {
      setEditingCertIdx(editingCertIdx - 1);
    }
  };

  // Dedicated Certificates Dialog Helpers
  const handleOpenCertDialog = (achievement: AchievementItem) => {
    const initialList = achievement.certificates 
      ? achievement.certificates.map(item => ({
          title: item.title,
          achievedBy: item.achievedBy,
          date: item.date ? new Date(item.date).toISOString().split('T')[0] : "",
          fileUrl: item.fileUrl || ""
        }))
      : [];
    
    setCertDialogList(initialList);
    setCertDialogTitle("");
    setCertDialogRecipient("");
    setCertDialogDate("");
    setCertDialogFile(null);
    setEditingCertDialogIdx(null);
    setIsCertDialogOpen(true);
  };

  const handleAddCertDialogItem = () => {
    if (!certDialogTitle.trim() || !certDialogRecipient.trim() || !certDialogDate) {
      toast.error("Please fill in title, recipient, and date for the certificate");
      return;
    }
    
    const newItem = { 
      title: certDialogTitle.trim(), 
      achievedBy: certDialogRecipient.trim(), 
      date: certDialogDate,
      fileUrl: editingCertDialogIdx !== null ? certDialogList[editingCertDialogIdx].fileUrl : undefined,
      file: certDialogFile || undefined
    };
    
    let updated = [...certDialogList];
    if (editingCertDialogIdx !== null) {
      updated[editingCertDialogIdx] = newItem;
      setEditingCertDialogIdx(null);
    } else {
      updated.push(newItem);
    }
    
    setCertDialogList(updated);
    setCertDialogTitle("");
    setCertDialogRecipient("");
    setCertDialogDate("");
    setCertDialogFile(null);
  };

  const handleEditCertDialogItem = (index: number) => {
    const item = certDialogList[index];
    setCertDialogTitle(item.title);
    setCertDialogRecipient(item.achievedBy);
    setCertDialogDate(item.date);
    setCertDialogFile(item.file || null);
    setEditingCertDialogIdx(index);
  };

  const handleDeleteCertDialogItem = (index: number) => {
    setCertDialogList(prev => prev.filter((_, i) => i !== index));
    if (editingCertDialogIdx === index) {
      setCertDialogTitle("");
      setCertDialogRecipient("");
      setCertDialogDate("");
      setCertDialogFile(null);
      setEditingCertDialogIdx(null);
    } else if (editingCertDialogIdx !== null && editingCertDialogIdx > index) {
      setEditingCertDialogIdx(editingCertDialogIdx - 1);
    }
  };

  const handleSaveCertificates = async () => {
    if (!activeAchievement) return;
    try {
      const formData = new FormData();
      formData.append('title', activeAchievement.title);
      formData.append('description', activeAchievement.description);
      formData.append('date', new Date(activeAchievement.date).toISOString());
      formData.append('achievedBy', activeAchievement.achievedBy);
      if (activeAchievement.achievementType) formData.append('achievementType', activeAchievement.achievementType);
      if (activeAchievement.competitionLevel) formData.append('competitionLevel', activeAchievement.competitionLevel);
      if (activeAchievement.contributionDomain) formData.append('contributionDomain', activeAchievement.contributionDomain);
      if (activeAchievement.prizeAmount) formData.append('prizeAmount', String(activeAchievement.prizeAmount));
      if (activeAchievement.eventYear) formData.append('eventYear', String(activeAchievement.eventYear));
      if (activeAchievement.teamSize) formData.append('teamSize', String(activeAchievement.teamSize));
      if (activeAchievement.imageUrl) formData.append('imageUrl', activeAchievement.imageUrl);
      
      // Keep existing gallery
      if (activeAchievement.gallery) {
        formData.append('existingGallery', JSON.stringify(activeAchievement.gallery));
      }
      
      // Keep timeline
      if (activeAchievement.timeline) {
        formData.append('timeline', JSON.stringify(activeAchievement.timeline));
      }

      // Add certificates
      let fileCount = 0;
      const certificatesPayload = certDialogList.map(cert => {
        if (cert.file) {
          formData.append('certificateFiles', cert.file);
          const currentIdx = fileCount;
          fileCount++;
          return {
            title: cert.title,
            achievedBy: cert.achievedBy,
            date: cert.date,
            fileIndex: currentIdx
          };
        }
        return {
          title: cert.title,
          achievedBy: cert.achievedBy,
          date: cert.date,
          fileUrl: cert.fileUrl
        };
      });
      formData.append('certificates', JSON.stringify(certificatesPayload));
      
      // Append existing contributions
      if (activeAchievement.ideaHubContributions) {
        formData.append('ideaHubContributions', JSON.stringify(activeAchievement.ideaHubContributions));
      }

      const res = await api.put(`/achievements/${activeAchievement._id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      // Update local state
      setAchievements(achievements.map(a => a._id === activeAchievement._id ? res.data : a));
      toast.success('Certificates updated successfully');
      setIsCertDialogOpen(false);
      fetchAnalytics();
    } catch (error) {
      toast.error('Failed to update certificates');
    }
  };


  const renderPagination = () => {
    if (pagination.totalPages <= 1) return null;

    return (
      <Pagination className="mt-4">
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious
              href="#"
              onClick={(e) => {
                e.preventDefault();
                setPage((current) => Math.max(1, current - 1));
              }}
              className={page === 1 ? 'pointer-events-none opacity-50' : ''}
            />
          </PaginationItem>
          <PaginationItem>
            <span className="px-3 py-1.5 text-2xs text-slate-500 font-bold">
              {pagination.page} / {pagination.totalPages}
            </span>
          </PaginationItem>
          <PaginationItem>
            <PaginationNext
              href="#"
              onClick={(e) => {
                e.preventDefault();
                setPage((current) => Math.min(pagination.totalPages, current + 1));
              }}
              className={page >= pagination.totalPages ? 'pointer-events-none opacity-50' : ''}
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    );
  };

  const renderTrophyHeroIllustration = () => (
    <div className="hidden md:flex relative shrink-0">
      {/* Background radial glow */}
      <div className="absolute inset-0 bg-amber-500/25 blur-3xl rounded-full w-40 h-40 -translate-x-6" />
      <img 
        src="/images/achievements/trophy.png" 
        alt="Gold Trophy" 
        className="w-48 h-48 object-contain drop-shadow-[0_12px_24px_rgba(245,158,11,0.4)] animate-bounce-slow z-10"
        onError={(e) => {
          // In case the local image file is missing, fallback to inline SVG representation
          e.currentTarget.style.display = 'none';
        }}
      />
    </div>
  );

  const renderEmptyState = (message: string, onAction?: () => void) => (
    <div className="flex flex-col items-center justify-center text-center p-12 bg-white border border-slate-200/60 rounded-3xl shadow-3xs w-full">
      <div className="w-14 h-14 rounded-full bg-slate-50 flex items-center justify-center text-primary/50 mb-4 shadow-inner">
        <Trophy className="w-7 h-7" />
      </div>
      <h3 className="text-base font-extrabold text-slate-850 mb-1">No Achievements Found</h3>
      <p className="text-xs text-muted-foreground max-w-sm mb-6 font-medium">{message}</p>
      <div className="flex gap-3">
        {onAction && (
          <Button variant="outline" size="sm" onClick={onAction} className="font-bold text-xs h-9 px-4 rounded-xl">
            Clear Filters
          </Button>
        )}
        {isCoordinator && (
          <Button size="sm" onClick={() => setOpen(true)} className="font-bold text-xs h-9 px-4 bg-primary text-white rounded-xl">
            Add Achievement
          </Button>
        )}
      </div>
    </div>
  );

  const renderGallery = () => {
    if (!activeAchievement) return null;
    const images: string[] = [];
    if (activeAchievement.imageUrl) {
      images.push(activeAchievement.imageUrl);
    }
    if (activeAchievement.gallery && activeAchievement.gallery.length > 0) {
      activeAchievement.gallery.forEach(img => {
        if (img && !images.includes(img)) {
          images.push(img);
        }
      });
    }

    if (images.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center p-6 border border-dashed border-slate-200 rounded-xl bg-slate-50/50 text-slate-400 text-xs">
          <span>No gallery images uploaded</span>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-2 gap-2">
        {images.slice(0, 4).map((imgUrl, index) => {
          const hasMore = index === 3 && images.length > 4;

          return (
            <div key={index} className="aspect-[4/3] rounded-lg overflow-hidden border relative bg-slate-50 shadow-3xs group">
              <img src={imgUrl} alt={`gallery-${index}`} className="object-cover object-top w-full h-full transition-transform duration-300 group-hover:scale-105" />
              {isCoordinator && (
                <div className="absolute inset-0 bg-black/45 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none group-hover:pointer-events-auto">
                  <Button
                    variant="secondary"
                    className="h-7 px-2 text-[10px] bg-white text-slate-800 hover:bg-slate-100 font-bold rounded-lg shadow-sm border border-slate-200"
                    onClick={() => startEdit(activeAchievement)}
                  >
                    Edit
                  </Button>
                </div>
              )}
              {hasMore && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-white font-bold text-xs select-none">
                  +{images.length - 4}
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-16">
      <div className="container mx-auto px-4 py-8 space-y-8 font-sans">
        
        {/* Full-width Gradient Hero Section */}
        <div className="relative w-full bg-gradient-to-r from-slate-950 via-[#0d1f4d] to-slate-950 min-h-[220px] sm:h-[260px] md:h-[280px] rounded-[24px] overflow-hidden flex items-center justify-between p-6 sm:p-8 md:p-12 border border-slate-900 shadow-lg">
          {/* Subtle background glow graphics */}
          <div className="absolute top-[-50px] right-[-50px] w-72 h-72 rounded-full bg-blue-500/10 blur-3xl pointer-events-none" />
          <div className="absolute bottom-[-50px] left-[10%] w-72 h-72 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />
          
          <div className="space-y-3 max-w-xl relative z-10">
            <span className="inline-block text-[10px] font-extrabold uppercase tracking-[0.25em] text-amber-400 bg-amber-400/10 border border-amber-400/20 px-3 py-1 rounded-full">
              OUR ACHIEVEMENTS
            </span>
            <h1 className="text-2xl sm:text-4xl md:text-5xl font-extrabold text-white tracking-tight leading-tight">
              Celebrating Innovation<br />Creating Impact
            </h1>
            <p className="text-slate-200 text-xs sm:text-sm font-medium leading-normal">
              Proud moments of KK Wagh AICTE IDEA Lab family
            </p>
          </div>
          {renderTrophyHeroIllustration()}
        </div>

        {/* KPI Cards Section */}
        {analyticsLoading ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
            {[...Array(4)].map((_, i) => (
              <Card key={i} className="animate-pulse border border-slate-200/60 rounded-2xl bg-white h-24" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
            {[
              { 
                label: 'Total Achievements', 
                value: analytics?.totalAchievements ?? 126, 
                icon: Trophy, 
                color: 'text-amber-500 bg-amber-50' 
              },
              { 
                label: 'Students Participated', 
                value: analytics?.totalStudentsParticipated ?? 248, 
                icon: Users, 
                color: 'text-emerald-500 bg-emerald-50' 
              },
              { 
                label: 'Total Prize Money', 
                value: `₹${Number(analytics?.totalPrizeMoney ?? 1285000).toLocaleString('en-IN')}`, 
                icon: Banknote, 
                color: 'text-purple-500 bg-purple-50' 
              },
              { 
                label: 'Competitions', 
                value: analytics?.totalCompetitions ?? 58, 
                icon: Award, 
                color: 'text-blue-500 bg-blue-50' 
              }
            ].map((kpi, idx) => (
              <Card key={idx} className="border border-slate-200/70 shadow-xs hover:shadow-sm transition-all duration-200 rounded-2xl bg-white">
                <CardContent className="p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
                  <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center shrink-0 ${kpi.color}`}>
                    <kpi.icon className="w-5.5 h-5.5" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-xl sm:text-2xl font-black text-slate-800 leading-none">{kpi.value}</h3>
                    <p className="text-[10px] sm:text-3xs font-extrabold text-slate-400 uppercase tracking-wider mt-1 sm:mt-1.5 leading-snug">{kpi.label}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Filter Selection Row */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-4 border-slate-200/60">
          {/* Level tabs selection */}
          <div className="flex items-center w-full md:w-auto overflow-x-auto pb-2 -mb-2 gap-1.5 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden flex-nowrap shrink-0">
            {[
              { label: 'All Achievements', value: 'all' },
              { label: 'National Level', value: 'National' },
              { label: 'State Level', value: 'State' },
              { label: 'International Level', value: 'International' },
              { label: 'College Level', value: 'College' },
            ].map((tab) => (
              <button
                key={tab.value}
                onClick={() => setFilters(prev => ({ ...prev, competitionLevel: tab.value }))}
                className={`text-3xs font-bold px-3.5 py-1.5 rounded-full border transition-all whitespace-nowrap ${
                  filters.competitionLevel === tab.value
                    ? 'bg-primary text-white border-primary shadow-xs'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search bar & triggers */}
          <div className="flex items-center gap-2 w-full md:w-auto">
            <div className="relative flex-1 md:w-64 md:flex-initial">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input 
                placeholder="Search achievements..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-9.5 text-2xs border-slate-200 bg-white focus-visible:ring-1 rounded-xl w-full"
              />
            </div>
            <Button 
              variant="outline" 
              onClick={() => setIsDrawerOpen(true)}
              className="h-9.5 w-9.5 p-0 rounded-xl border-slate-200 bg-white hover:bg-slate-50 shrink-0"
            >
              <Filter className="w-4 h-4 text-slate-500" />
            </Button>

            {isCoordinator && (
              <Dialog open={open} onOpenChange={(val) => { if(!val) { setEditingId(null); setForm(INITIAL_FORM); setNewGalleryFiles([]); setTimelineLabel(""); setTimelineDate(""); setEditingTimelineIdx(null); setCertTitle(""); setCertRecipient(""); setCertDate(""); setCertFile(null); setEditingCertIdx(null); } setOpen(val); }}>
                <DialogTrigger asChild>
                  <Button className="font-bold bg-primary text-white border-none h-9.5 rounded-xl px-4 text-2xs shadow-xs hover:scale-[1.02] transition-transform">
                    <PlusCircle className="w-4 h-4 mr-1.5" /> Add
                  </Button>
                </DialogTrigger>
                <DialogContent className="rounded-3xl bg-white border max-w-2xl max-h-[90vh] overflow-y-auto p-6">
                  <DialogHeader className="border-b pb-4">
                    <DialogTitle className="text-lg font-extrabold text-slate-900">
                      {editingId ? "Edit Achievement" : "Add Achievement"}
                    </DialogTitle>
                    <DialogDescription className="text-xs">
                      Provide detailed event metrics, contributions, and upload images.
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleSubmit} className="space-y-6 text-xs font-semibold pt-4">
                    
                    {/* Basic section */}
                    <div className="space-y-3">
                      <h4 className="text-primary text-[10px] uppercase tracking-wider font-extrabold border-b pb-1">Basic Details</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="form-title">Achievement Title</Label>
                          <Input id="form-title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required className="mt-1 h-9.5 text-xs border-slate-200" />
                        </div>
                        <div>
                          <Label htmlFor="form-achievedBy">Achieved By (Student / Team Name)</Label>
                          <Input id="form-achievedBy" value={form.achievedBy} onChange={(e) => setForm({ ...form, achievedBy: e.target.value })} required className="mt-1 h-9.5 text-xs border-slate-200" placeholder="e.g. Kalpesh Bire, Team Innovators" />
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="form-description">Milestone Description</Label>
                        <Textarea id="form-description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} required rows={4} className="mt-1 text-xs border-slate-200" placeholder="Provide a detailed write-up about the achievements and its outcomes..." />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="form-date">Event Date</Label>
                          <Input id="form-date" type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} required className="mt-1 h-9.5 text-xs border-slate-200" />
                        </div>
                        <div>
                          <Label htmlFor="form-eventYear">Event Year (Optional override)</Label>
                          <Input id="form-eventYear" type="number" placeholder="e.g. 2026" value={form.eventYear} onChange={(e) => setForm({ ...form, eventYear: e.target.value })} className="mt-1 h-9.5 text-xs border-slate-200" />
                        </div>
                      </div>
                    </div>

                    {/* Classification */}
                    <div className="space-y-3">
                      <h4 className="text-primary text-[10px] uppercase tracking-wider font-extrabold border-b pb-1">Category & Metrics</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                        <div>
                          <Label>Achievement Type</Label>
                          <Select value={form.achievementType} onValueChange={(val) => setForm(prev => ({ ...prev, achievementType: val }))}>
                            <SelectTrigger className="mt-1 h-9.5 text-xs bg-white border-slate-200">
                              <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                            <SelectContent>
                              {achievementTypes.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label>Competition Level</Label>
                          <Select value={form.competitionLevel} onValueChange={(val) => setForm(prev => ({ ...prev, competitionLevel: val }))}>
                            <SelectTrigger className="mt-1 h-9.5 text-xs bg-white border-slate-200">
                              <SelectValue placeholder="Select level" />
                            </SelectTrigger>
                            <SelectContent>
                              {competitionLevels.map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label>Domain</Label>
                          <Select value={form.contributionDomain} onValueChange={(val) => setForm(prev => ({ ...prev, contributionDomain: val }))}>
                            <SelectTrigger className="mt-1 h-9.5 text-xs bg-white border-slate-200">
                              <SelectValue placeholder="Select domain" />
                            </SelectTrigger>
                            <SelectContent>
                              {contributionDomains.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="form-prizeAmount">Prize Amount (₹)</Label>
                          <Input id="form-prizeAmount" type="number" placeholder="e.g. 50000" value={form.prizeAmount} onChange={(e) => setForm({ ...form, prizeAmount: e.target.value })} className="mt-1 h-9.5 text-xs border-slate-200" />
                        </div>
                        <div>
                          <Label htmlFor="form-teamSize">Team Size</Label>
                          <Input id="form-teamSize" type="number" min="1" placeholder="1" value={form.teamSize} onChange={(e) => setForm({ ...form, teamSize: e.target.value })} className="mt-1 h-9.5 text-xs border-slate-200" />
                        </div>
                      </div>
                    </div>

                    {/* Image attachment */}
                    <div className="space-y-3">
                      <h4 className="text-primary text-[10px] uppercase tracking-wider font-extrabold border-b pb-1">Media Files</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="achievement-image">Upload Showcase Image</Label>
                          <Input id="achievement-image" type="file" accept="image/*" className="mt-1 text-xs border-slate-200 bg-slate-50/50" />
                        </div>
                        <div>
                          <Label htmlFor="form-imageUrl">Or Remote Image URL</Label>
                          <Input id="form-imageUrl" value={form.imageUrl} onChange={(e) => setForm({ ...form, imageUrl: e.target.value })} placeholder="https://..." className="mt-1 h-9.5 text-xs border-slate-200" />
                        </div>
                      </div>

                      {/* Showcase Image Delete & Preview Card */}
                      {form.imageUrl && (
                        <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between gap-3 shadow-2xs">
                          <div className="flex items-center gap-3 overflow-hidden">
                            <img src={form.imageUrl} alt="Showcase preview" className="w-12 h-12 object-cover rounded-lg border border-slate-200 shrink-0 bg-white" />
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                <p className="text-2xs font-extrabold text-slate-800">Showcase Photo</p>
                                {form.imageUrl.includes('cloudinary.com') && (
                                  <span className="text-[9px] bg-blue-100 text-blue-700 font-bold px-1.5 py-0.2 rounded-full">Cloudinary</span>
                                )}
                              </div>
                              <p className="text-[10px] text-slate-400 truncate max-w-[240px] sm:max-w-[320px]">{form.imageUrl}</p>
                            </div>
                          </div>
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            className="h-8 px-2.5 text-2xs font-bold shrink-0 flex items-center gap-1 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                            onClick={handleDeleteShowcaseImage}
                            title="Delete Photo from Cloudinary"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            Delete Photo
                          </Button>
                        </div>
                      )}

                      {/* Gallery Upload section */}
                      <div className="space-y-1.5 mt-2">
                        <Label htmlFor="achievement-gallery">Upload Gallery Images (Multiple)</Label>
                        <Input 
                          id="achievement-gallery" 
                          type="file" 
                          accept="image/*" 
                          multiple 
                          className="mt-1 text-xs border-slate-200 bg-slate-50/50" 
                          onChange={(e) => {
                            if (e.target.files) {
                              setNewGalleryFiles(prev => [...prev, ...(Array.from(e.target.files!) as File[])]);
                              e.target.value = ""; // Clear file input so same files can be re-selected if deleted
                            }
                          }}
                        />
                        
                        {/* Previews grid of existing and new gallery images */}
                        {((form.gallery && form.gallery.length > 0) || newGalleryFiles.length > 0) && (
                          <div className="mt-3 space-y-2">
                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                              Gallery Images Grid ({form.gallery.length + newGalleryFiles.length})
                            </p>
                            <div className="flex flex-wrap gap-3 p-1 border border-slate-100 rounded-2xl bg-slate-50/30">
                              {/* Existing Images */}
                              {form.gallery.map((url, idx) => (
                                <div key={`existing-${url}-${idx}`} className="relative w-16 h-16 rounded-xl border border-slate-200 bg-white group/gallery">
                                  <div className="w-full h-full rounded-xl overflow-hidden">
                                    <img src={url} alt="existing gallery" className="w-full h-full object-cover" />
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteGalleryImage(url, idx)}
                                    className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-500 hover:bg-red-650 flex items-center justify-center text-white border border-white shadow-xs transition-colors"
                                    title="Delete Photo from Cloudinary"
                                  >
                                    <X className="w-3 h-3 stroke-[3]" />
                                  </button>
                                  <span className="absolute bottom-1 left-1 bg-slate-900/60 text-white text-[7px] px-1 rounded font-sans leading-none">
                                    Saved
                                  </span>
                                </div>
                              ))}

                              {/* New Image Previews */}
                              {newGalleryFiles.map((file, idx) => {
                                const objectUrl = URL.createObjectURL(file);
                                return (
                                  <div key={`new-${file.name}-${idx}`} className="relative w-16 h-16 rounded-xl border border-emerald-300 bg-white">
                                    <div className="w-full h-full rounded-xl overflow-hidden">
                                      <img src={objectUrl} alt="new upload" className="w-full h-full object-cover" />
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setNewGalleryFiles(prev => prev.filter((_, i) => i !== idx));
                                        URL.revokeObjectURL(objectUrl);
                                      }}
                                      className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-500 hover:bg-red-650 flex items-center justify-center text-white border border-white shadow-xs transition-colors"
                                      title="Remove Image"
                                    >
                                      <X className="w-3 h-3 stroke-[3]" />
                                    </button>
                                    <span className="absolute bottom-1 left-1 bg-emerald-600/90 text-white text-[7px] px-1 rounded font-sans leading-none">
                                      New
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Contributions */}
                    <div className="space-y-3">
                      <h4 className="text-primary text-[10px] uppercase tracking-wider font-extrabold border-b pb-1">IDEA Lab Support Received</h4>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-1">
                        {CONTRIBUTION_FIELDS.map((field) => (
                          <label key={field.key} className="flex items-center gap-2 p-2 bg-slate-50 hover:bg-slate-100/80 rounded-lg cursor-pointer border border-slate-200/50 transition-colors">
                            <input 
                              type="checkbox"
                              checked={form.ideaHubContributions[field.key] || false}
                              onChange={(e) => setForm(prev => ({
                                ...prev,
                                ideaHubContributions: {
                                  ...prev.ideaHubContributions,
                                  [field.key]: e.target.checked
                                }
                              }))}
                              className="w-3.5 h-3.5 text-primary border-slate-300 rounded focus:ring-primary"
                            />
                            <span className="text-[10px] text-slate-700 leading-none">{field.label}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* Timeline Builder Section */}
                    <div className="space-y-3">
                      <h4 className="text-primary text-[10px] uppercase tracking-wider font-extrabold border-b pb-1">Custom Timeline Milestones (Optional)</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end p-3 border border-slate-100 rounded-2xl bg-slate-50/50">
                        <div className="sm:col-span-4">
                          <Label htmlFor="staged-timeline-date" className="text-3xs uppercase font-extrabold tracking-wider text-slate-400">Milestone Date</Label>
                          <Input
                            id="staged-timeline-date"
                            type="date"
                            value={timelineDate}
                            onChange={(e) => setTimelineDate(e.target.value)}
                            className="mt-1 h-8.5 text-2xs border-slate-200 bg-white"
                          />
                        </div>
                        <div className="sm:col-span-6">
                          <Label htmlFor="staged-timeline-label" className="text-3xs uppercase font-extrabold tracking-wider text-slate-400">Milestone Label</Label>
                          <Input
                            id="staged-timeline-label"
                            type="text"
                            placeholder="e.g. Testing & Validation"
                            value={timelineLabel}
                            onChange={(e) => setTimelineLabel(e.target.value)}
                            className="mt-1 h-8.5 text-2xs border-slate-200 bg-white"
                          />
                        </div>
                        <div className="sm:col-span-2">
                          <Button
                            type="button"
                            onClick={handleAddStagedTimeline}
                            className="w-full h-8.5 text-2xs font-bold bg-primary hover:bg-primary/90 text-white rounded-lg"
                          >
                            {editingTimelineIdx !== null ? "Update" : "Add"}
                          </Button>
                        </div>
                      </div>

                      {form.timeline && form.timeline.length > 0 && (
                        <div className="border border-slate-100 rounded-2xl p-3 bg-white space-y-2 max-h-48 overflow-y-auto">
                          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Staged Milestones ({form.timeline.length})</p>
                          <div className="space-y-1.5">
                            {form.timeline.map((item, idx) => (
                              <div key={idx} className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-100 text-2xs">
                                <div className="flex items-center gap-3">
                                  <span className="font-extrabold text-primary shrink-0">
                                    {new Date(item.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                                  </span>
                                  <span className="text-slate-700 font-bold truncate max-w-[180px] sm:max-w-[300px]">
                                    {item.label}
                                  </span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    className="h-6 w-6 p-0 text-slate-500 hover:text-primary hover:bg-slate-100 rounded"
                                    onClick={() => handleEditStagedTimeline(idx)}
                                  >
                                    <Pencil className="w-3.5 h-3.5" />
                                  </Button>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    className="h-6 w-6 p-0 text-red-500 hover:text-red-750 hover:bg-red-50 rounded"
                                    onClick={() => handleDeleteStagedTimeline(idx)}
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Certificates Builder Section */}
                    <div className="space-y-3">
                      <h4 className="text-primary text-[10px] uppercase tracking-wider font-extrabold border-b pb-1">Custom Certificates (Optional)</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end p-3 border border-slate-100 rounded-2xl bg-slate-50/50">
                        <div className="sm:col-span-3">
                          <Label htmlFor="staged-cert-title" className="text-3xs uppercase font-extrabold tracking-wider text-slate-400">Cert Title</Label>
                          <Input
                            id="staged-cert-title"
                            type="text"
                            placeholder="e.g. Achievement Certificate"
                            value={certTitle}
                            onChange={(e) => setCertTitle(e.target.value)}
                            className="mt-1 h-8.5 text-2xs border-slate-200 bg-white"
                          />
                        </div>
                        <div className="sm:col-span-3">
                          <Label htmlFor="staged-cert-recipient" className="text-3xs uppercase font-extrabold tracking-wider text-slate-400">Recipient Name</Label>
                          <Input
                            id="staged-cert-recipient"
                            type="text"
                            placeholder="e.g. Team Nexus"
                            value={certRecipient}
                            onChange={(e) => setCertRecipient(e.target.value)}
                            className="mt-1 h-8.5 text-2xs border-slate-200 bg-white"
                          />
                        </div>
                        <div className="sm:col-span-2">
                          <Label htmlFor="staged-cert-date" className="text-3xs uppercase font-extrabold tracking-wider text-slate-400">Date</Label>
                          <Input
                            id="staged-cert-date"
                            type="date"
                            value={certDate}
                            onChange={(e) => setCertDate(e.target.value)}
                            className="mt-1 h-8.5 text-2xs border-slate-200 bg-white"
                          />
                        </div>
                        <div className="sm:col-span-2">
                          <Label htmlFor="staged-cert-file" className="text-3xs uppercase font-extrabold tracking-wider text-slate-400">Upload PDF/Image</Label>
                          <Input
                            id="staged-cert-file"
                            type="file"
                            accept="image/*,application/pdf"
                            onChange={(e) => {
                              if (e.target.files && e.target.files[0]) {
                                setCertFile(e.target.files[0]);
                              }
                            }}
                            className="mt-1 h-8.5 text-[10px] border-slate-200 bg-white file:hidden"
                          />
                        </div>
                        <div className="sm:col-span-2">
                          <Button
                            type="button"
                            onClick={handleAddStagedCert}
                            className="w-full h-8.5 text-2xs font-bold bg-primary hover:bg-primary/90 text-white rounded-lg"
                          >
                            {editingCertIdx !== null ? "Update" : "Add"}
                          </Button>
                        </div>
                      </div>

                      {/* Display Selected File Preview/Label */}
                      {certFile && (
                        <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 rounded-lg text-3xs border border-emerald-100 max-w-xs">
                          <span className="font-extrabold uppercase">File Staged:</span>
                          <span className="truncate max-w-[150px]">{certFile.name}</span>
                          <button
                            type="button"
                            onClick={() => setCertFile(null)}
                            className="hover:text-red-500 font-bold ml-auto"
                            title="Remove file"
                          >
                            <X className="w-3 h-3 stroke-[2.5]" />
                          </button>
                        </div>
                      )}

                      {form.certificates && form.certificates.length > 0 && (
                        <div className="border border-slate-100 rounded-2xl p-3 bg-white space-y-2 max-h-48 overflow-y-auto">
                          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Staged Certificates ({form.certificates.length})</p>
                          <div className="space-y-1.5">
                            {form.certificates.map((item, idx) => (
                              <div key={idx} className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-100 text-2xs">
                                <div className="flex items-center gap-3">
                                  <span className="font-extrabold text-primary shrink-0">
                                    {new Date(item.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                                  </span>
                                  <span className="text-slate-700 font-bold max-w-[120px] truncate">
                                    {item.title}
                                  </span>
                                  <span className="text-slate-400 font-semibold italic max-w-[100px] truncate">
                                    ({item.achievedBy})
                                  </span>
                                  {item.file && (
                                    <span className="bg-emerald-500/10 text-emerald-700 text-[8px] font-extrabold px-1 rounded">
                                      New Doc
                                    </span>
                                  )}
                                  {item.fileUrl && !item.file && (
                                    <span className="bg-blue-500/10 text-blue-700 text-[8px] font-extrabold px-1 rounded">
                                      Saved Doc
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center gap-1">
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    className="h-6 w-6 p-0 text-slate-500 hover:text-primary hover:bg-slate-100 rounded"
                                    onClick={() => handleEditStagedCert(idx)}
                                  >
                                    <Pencil className="w-3.5 h-3.5" />
                                  </Button>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    className="h-6 w-6 p-0 text-red-500 hover:text-red-750 hover:bg-red-50 rounded"
                                    onClick={() => handleDeleteStagedCert(idx)}
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>


                    <DialogFooter className="pt-4 border-t gap-2 md:gap-0">
                      <Button type="button" variant="outline" onClick={() => setOpen(false)} className="font-bold text-xs h-10 rounded-xl px-5">
                        Cancel
                      </Button>
                      <Button type="submit" className="font-bold bg-primary text-white rounded-xl h-10 px-5 shadow-md">
                        {editingId ? "Update Milestone" : "Publish Milestone"}
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </div>

        {/* Sliding filter sheet for other filter params */}
        <Sheet open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
          <SheetContent side="right" className="w-full max-w-sm bg-white rounded-l-3xl border-l flex flex-col p-0 shadow-2xl">
            <SheetHeader className="p-6 border-b shrink-0">
              <SheetTitle className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <Filter className="w-4.5 h-4.5 text-primary" /> Advanced Filters
              </SheetTitle>
            </SheetHeader>

            <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs font-semibold">
              <div className="space-y-1.5">
                <Label htmlFor="drawer-search" className="font-bold">Text Keywords</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input 
                    id="drawer-search"
                    placeholder="Search keywords..." 
                    value={tempFilters.search}
                    onChange={(e) => setTempFilters(prev => ({ ...prev, search: e.target.value }))}
                    className="pl-9 h-9.5 text-xs border-slate-200"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="font-bold">Achievement Type</Label>
                <Select value={tempFilters.achievementType} onValueChange={(val) => setTempFilters(prev => ({ ...prev, achievementType: val }))}>
                  <SelectTrigger className="h-9.5 text-xs bg-white border-slate-200">
                    <SelectValue placeholder="All types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All types</SelectItem>
                    {achievementTypes.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="font-bold">Contribution Domain</Label>
                <Select value={tempFilters.contributionDomain} onValueChange={(val) => setTempFilters(prev => ({ ...prev, contributionDomain: val }))}>
                  <SelectTrigger className="h-9.5 text-xs bg-white border-slate-200">
                    <SelectValue placeholder="All domains" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All domains</SelectItem>
                    {contributionDomains.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="font-bold">Year</Label>
                <Select value={tempFilters.year} onValueChange={(val) => setTempFilters(prev => ({ ...prev, year: val }))}>
                  <SelectTrigger className="h-9.5 text-xs bg-white border-slate-200">
                    <SelectValue placeholder="All years" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All years</SelectItem>
                    {availableYears.map(y => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="drawer-team" className="font-bold">Team / Student Name</Label>
                <Input 
                  id="drawer-team"
                  placeholder="Filter name..." 
                  value={tempFilters.team}
                  onChange={(e) => setTempFilters(prev => ({ ...prev, team: e.target.value }))}
                  className="h-9.5 text-xs border-slate-200"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="font-bold">Prize Winner Status</Label>
                <Select value={tempFilters.prizeWinner} onValueChange={(val) => setTempFilters(prev => ({ ...prev, prizeWinner: val }))}>
                  <SelectTrigger className="h-9.5 text-xs bg-white border-slate-200">
                    <SelectValue placeholder="All status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All records</SelectItem>
                    <SelectItem value="true">Prize winners only</SelectItem>
                    <SelectItem value="false">No prize only</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="p-4 border-t bg-slate-50 shrink-0 flex gap-3">
              <Button variant="outline" className="flex-1 rounded-xl h-11 font-bold text-xs" onClick={handleClearFilters}>
                Clear Filters
              </Button>
              <Button className="flex-1 rounded-xl h-11 font-bold text-xs bg-primary text-white" onClick={handleApplyFilters}>
                Apply Filters
              </Button>
            </div>
          </SheetContent>
        </Sheet>

        {/* Main Master-Detail Layout */}
        {loading ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-4 space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="animate-pulse bg-white border rounded-2xl h-24" />
              ))}
            </div>
            <div className="lg:col-span-8 animate-pulse bg-white border rounded-2xl h-[500px]" />
          </div>
        ) : achievements.length === 0 ? (
          renderEmptyState("No achievements match your filters. Try clearing filter params to explore other records.", clearFilters)
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Left Column: Achievement List (30% approx) */}
            <div className="lg:col-span-4 xl:col-span-3.5 space-y-4 max-h-[850px] overflow-y-auto pr-2 custom-scrollbar">
              <h3 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider mb-2 block lg:hidden pt-4 border-t border-slate-100">
                Explore Achievements ({achievements.length})
              </h3>
              {achievements.map((item) => {
                const isActive = item._id === activeAchievement?._id;
                const isPrizeWinner = item.prizeAmount && item.prizeAmount > 0;
                return (
                  <div
                    key={item._id}
                    onClick={() => setSelectedId(item._id)}
                    className={`group bg-white border p-5 rounded-2xl cursor-pointer transition-all duration-300 flex gap-4 min-h-[150px] shadow-sm select-none ${
                      isActive 
                        ? 'border-primary ring-2 ring-primary/10 border-l-4 border-l-primary' 
                        : 'border-blue-100 hover:border-slate-350 hover:-translate-y-1 hover:shadow-md'
                    }`}
                  >
                    {/* Thumbnail Image (112px x 112px / w-28 h-28) */}
                    <div className="w-28 h-28 rounded-xl bg-slate-50 border border-slate-100 overflow-hidden shrink-0 relative flex items-center justify-center">
                      {item.imageUrl ? (
                        <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-primary/30">
                          <Trophy className="w-10 h-10" />
                        </div>
                      )}
                      
                      {/* Trophy indicator Badge */}
                      {isPrizeWinner && (
                        <div className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-amber-500 flex items-center justify-center text-white border border-white shadow-sm">
                          <Trophy className="w-3.5 h-3.5" />
                        </div>
                      )}
                    </div>

                    {/* Meta info */}
                    <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                      <div className="space-y-1.5">
                        <div className="space-y-0.5">
                          <h4 className="text-[17px] font-bold text-slate-800 line-clamp-1 group-hover:text-primary transition-colors leading-snug">
                            {item.title}
                          </h4>
                          <p className="text-sm text-[#64748B] font-semibold line-clamp-1 leading-tight">
                            {item.achievementType || 'Competition'}
                          </p>
                        </div>
                        
                        {/* Achievement Badge */}
                        <div className="pt-0.5">
                          {(() => {
                            const prize = item.prizeAmount || 0;
                            if (prize >= 50000) {
                              return <span className="inline-block text-[10px] font-bold bg-yellow-100 text-yellow-700 px-2.5 py-0.5 rounded-md uppercase">Winner</span>;
                            }
                            if (prize > 0) {
                              return <span className="inline-block text-[10px] font-bold bg-purple-100 text-purple-700 px-2.5 py-0.5 rounded-md uppercase">Runner Up</span>;
                            }
                            return <span className="inline-block text-[10px] font-bold bg-blue-100 text-blue-700 px-2.5 py-0.5 rounded-md uppercase">Finalist</span>;
                          })()}
                        </div>
                      </div>

                      <div className="flex items-end justify-between mt-2.5">
                        <div className="flex items-center gap-3 text-2xs text-slate-400 font-bold leading-none">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            {new Date(item.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: '2-digit' })}
                          </span>
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            {getVenue(item.competitionLevel)}
                          </span>
                        </div>
                        {isPrizeWinner ? (
                          <span className="text-lg font-bold text-green-600 leading-none shrink-0">
                            ₹{item.prizeAmount?.toLocaleString('en-IN')}
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </div>
                );
              })}
              {renderPagination()}
            </div>

            {/* Right Column: Selected Item Details Panel (70% approx) */}
            {activeAchievement && (
              <div className="lg:col-span-8 xl:col-span-8.5 bg-white border border-slate-200/60 rounded-3xl p-6 md:p-8 shadow-sm space-y-6">
                
                {/* Details Top Panel: Header info */}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b pb-5 border-slate-100">
                  <div className="space-y-2.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-3xs font-bold bg-primary/10 text-primary border border-primary/25 px-2.5 py-0.5 rounded-full uppercase">
                        {activeAchievement.achievementType || 'Milestone'}
                      </span>
                      {activeAchievement.competitionLevel && (
                        <span className="text-3xs font-bold bg-emerald-500/10 text-emerald-700 border border-emerald-500/20 px-2.5 py-0.5 rounded-full uppercase">
                          {activeAchievement.competitionLevel} Level Winner
                        </span>
                      )}
                    </div>
                    <div>
                      <h2 className="text-2xl font-black text-slate-850 tracking-tight leading-tight mb-1">
                        {activeAchievement.title}
                      </h2>
                      <p className="text-slate-400 font-semibold text-xs flex items-center gap-1.5">
                        <Building className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        Under domain: <span className="text-slate-600 font-bold">{activeAchievement.contributionDomain || 'General Innovation'}</span>
                      </p>
                    </div>
                  </div>

                  {/* Actions (Edit/Delete floating on the header) */}
                  {isCoordinator && (
                    <div className="flex gap-2 shrink-0">
                      <Button
                        size="sm"
                        variant="outline"
                        className="font-bold text-3xs border-slate-250 text-slate-700 h-9 rounded-xl px-3"
                        onClick={() => startEdit(activeAchievement)}
                      >
                        Edit Achievement
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        className="font-bold text-3xs h-9 rounded-xl px-3"
                        onClick={async () => {
                          if (!confirm('Are you sure you want to delete this achievement?')) return;
                          try {
                            await api.delete(`/achievements/${activeAchievement._id}`);
                            setAchievements(achievements.filter((a) => a._id !== activeAchievement._id));
                            toast.success('Achievement deleted');
                            fetchAnalytics();
                          } catch {
                            toast.error('Failed to delete achievement');
                          }
                        }}
                      >
                        Delete
                      </Button>
                    </div>
                  )}
                </div>

                {/* Large main image showcase */}
                <div className="aspect-[16/9] w-full rounded-2xl overflow-hidden border shadow-inner relative bg-slate-50 group">
                  {activeAchievement.imageUrl ? (
                    <>
                      <img src={activeAchievement.imageUrl} alt={activeAchievement.title} className="object-cover object-top w-full h-full" />
                      {isCoordinator && (
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none group-hover:pointer-events-auto">
                          <Button 
                            className="bg-white text-slate-800 hover:bg-slate-100 font-bold rounded-xl shadow-md px-4 py-2 text-xs flex items-center gap-1.5 border border-slate-200"
                            onClick={() => startEdit(activeAchievement)}
                          >
                            <PlusCircle className="w-4 h-4 text-primary" />
                            Change Showcase Image
                          </Button>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-primary/30 relative">
                      <Trophy className="w-20 h-20 mb-3" />
                      <span className="text-2xs font-extrabold text-muted-foreground uppercase tracking-widest">Showcase Image Not Loaded</span>
                      {isCoordinator && (
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none group-hover:pointer-events-auto">
                          <Button 
                            className="bg-white text-slate-800 hover:bg-slate-100 font-bold rounded-xl shadow-md px-4 py-2 text-xs flex items-center gap-1.5 border border-slate-200"
                            onClick={() => startEdit(activeAchievement)}
                          >
                            <PlusCircle className="w-4 h-4 text-primary" />
                            Upload Showcase Image
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                  {/* Compact floating glass badge overlay */}
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-slate-950/75 backdrop-blur-md rounded-2xl px-6 py-2.5 border border-white/15 shadow-xl flex items-center justify-center gap-6 max-w-[90%] text-center">
                    <div>
                      <p className="text-[10px] text-slate-300 font-bold uppercase tracking-wider whitespace-nowrap">Project Team</p>
                      <p className="text-xs sm:text-sm font-bold text-white mt-0.5 whitespace-nowrap">{activeAchievement.achievedBy}</p>
                    </div>
                    {activeAchievement.prizeAmount && activeAchievement.prizeAmount > 0 ? (
                      <div className="border-l border-white/15 pl-6 text-center">
                        <p className="text-[10px] text-amber-300 font-bold uppercase tracking-wider whitespace-nowrap">Milestone Prize</p>
                        <p className="text-xs sm:text-sm font-black text-amber-400 mt-0.5 whitespace-nowrap">₹{activeAchievement.prizeAmount.toLocaleString('en-IN')}</p>
                      </div>
                    ) : null}
                  </div>
                </div>

                {/* Metadata details list */}
                <div className="bg-slate-50/50 border border-slate-200/50 rounded-2xl p-5">
                  <h4 className="text-slate-400 text-3xs font-extrabold uppercase tracking-widest border-b pb-2 mb-3">Milestone Parameters</h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-y-4 gap-x-6 text-2xs font-medium text-slate-700">
                    <div className="space-y-1">
                      <p className="text-slate-400 text-3xs uppercase font-extrabold tracking-wider">Date</p>
                      <p className="font-extrabold text-slate-800 flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-primary shrink-0" />
                        {new Date(activeAchievement.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-slate-400 text-3xs uppercase font-extrabold tracking-wider">Venue</p>
                      <p className="font-extrabold text-slate-800 flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-primary shrink-0" />
                        KK Wagh Campus
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-slate-400 text-3xs uppercase font-extrabold tracking-wider">Organized By</p>
                      <p className="font-extrabold text-slate-800 flex items-center gap-1">
                        <Building className="w-3.5 h-3.5 text-primary shrink-0" />
                        IDEA Lab Association
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-slate-400 text-3xs uppercase font-extrabold tracking-wider">Category</p>
                      <p className="font-extrabold text-slate-800 flex items-center gap-1">
                        <Bookmark className="w-3.5 h-3.5 text-primary shrink-0" />
                        {activeAchievement.achievementType || 'Competition'}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-slate-400 text-3xs uppercase font-extrabold tracking-wider">Rank</p>
                      <p className="font-extrabold text-slate-800 flex items-center gap-1">
                        <Star className="w-3.5 h-3.5 text-primary shrink-0" />
                        {activeAchievement.prizeAmount && activeAchievement.prizeAmount > 0 ? 'Milestone Winner' : 'Milestone Achieved'}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-slate-400 text-3xs uppercase font-extrabold tracking-wider">Team Size</p>
                      <p className="font-extrabold text-slate-800 flex items-center gap-1">
                        <Users className="w-3.5 h-3.5 text-primary shrink-0" />
                        {activeAchievement.teamSize ?? 1} Member(s)
                      </p>
                    </div>
                  </div>
                </div>

                {/* Checklist & Timeline split layout */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                  
                  {/* Left Column: Support checklist */}
                  <div className="bg-white border border-slate-200 rounded-[16px] shadow-sm p-6">
                    <h3 className="text-[20px] font-semibold text-[#111827] mb-6">
                      Participating Students / Support
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-5">
                      {(activeContributions.length > 0 ? activeContributions : [
                        { key: 'workspaceProvided', label: 'Workspace Provided' },
                        { key: 'mentorshipSupport', label: 'Mentorship Support' }
                      ]).map((field) => (
                        <div 
                          key={field.key} 
                          className="flex items-center gap-3 p-1.5 px-2 hover:bg-green-50 transition-all duration-200 rounded-lg"
                        >
                          <div className="w-7 h-7 rounded-full bg-[#DCFCE7] flex items-center justify-center shrink-0">
                            <Check className="w-4 h-4 text-[#16A34A] stroke-[3]" />
                          </div>
                          <span className="text-sm font-medium text-slate-700">
                            {field.label}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Right Column: Timeline journey */}
                  <div className="space-y-3.5 bg-slate-50/50 border border-slate-200/50 p-5 rounded-2xl">
                    <h4 className="font-black text-slate-850 text-xs border-b pb-2 flex items-center justify-between gap-1.5">
                      <span className="flex items-center gap-1.5">
                        <TrendingUp className="w-4 h-4 text-primary" /> Achievement Timeline
                      </span>
                      {isCoordinator && (
                        <button
                          type="button"
                          onClick={() => handleOpenTimelineDialog(activeAchievement)}
                          className="text-[10px] font-bold text-primary hover:underline flex items-center gap-0.5"
                          title="Manage Timeline Milestones"
                        >
                          <Pencil className="w-3 h-3" /> Edit
                        </button>
                      )}
                    </h4>
                    <div className="relative pl-5 ml-3 border-l-2 border-slate-200 space-y-4 py-1 text-2xs">
                      {displayTimeline.map((step, idx) => (
                        <div key={idx} className="relative">
                          {/* Dot connector */}
                          <div className={`absolute -left-[27px] top-0.5 w-3.5 h-3.5 rounded-full border-2 bg-white flex items-center justify-center ${
                            step.active 
                              ? 'border-emerald-500 text-emerald-600 ring-2 ring-emerald-500/20' 
                              : 'border-primary text-primary'
                          }`}>
                            {step.active ? (
                              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            ) : (
                              <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                            )}
                          </div>
                          <p className="text-[9px] text-slate-400 font-bold">{step.date}</p>
                          <p className="text-slate-850 font-bold mt-0.5">{step.label}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>

                {/* Description & Gallery & Certificates Section */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 border-t pt-6 border-slate-100">
                  
                  {/* Project Description */}
                  <div className="space-y-2.5">
                    <h4 className="font-black text-slate-850 text-2xs uppercase tracking-wider text-slate-400">Project Description</h4>
                    <p className={`text-slate-600 text-2xs leading-relaxed font-medium ${isDescExpanded ? "" : "line-clamp-6"}`}>
                      {activeAchievement.description}
                    </p>
                    {activeAchievement.description && activeAchievement.description.length > 120 && (
                      <button
                        type="button"
                        onClick={() => setIsDescExpanded(!isDescExpanded)}
                        className="text-[11px] font-bold text-primary hover:underline flex items-center gap-1 mt-1 focus:outline-none"
                      >
                        {isDescExpanded ? "Read Less" : "Read More..."}
                      </button>
                    )}
                  </div>

                   {/* Gallery grid */}
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <h4 className="font-black text-slate-850 text-2xs uppercase tracking-wider text-slate-400">Gallery</h4>
                      {isCoordinator && (
                        <button
                          type="button"
                          onClick={() => startEdit(activeAchievement)}
                          className="text-[10px] font-bold text-primary hover:underline"
                        >
                          Manage Images
                        </button>
                      )}
                    </div>
                    {renderGallery()}
                  </div>

                  {/* Certificates list */}
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <h4 className="font-black text-slate-850 text-2xs uppercase tracking-wider text-slate-400">Certificates</h4>
                      {isCoordinator && (
                        <button
                          type="button"
                          onClick={() => handleOpenCertDialog(activeAchievement)}
                          className="text-[10px] font-bold text-primary hover:underline flex items-center gap-0.5"
                          title="Manage Certificates"
                        >
                          <Pencil className="w-3 h-3" /> Edit
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      
                      {/* Interactive certificate previews */}
                      {activeAchievement.certificates && activeAchievement.certificates.length > 0 ? (
                        activeAchievement.certificates.map((cert, index) => (
                          <div 
                            key={cert._id || index}
                            onClick={() => setZoomedCertificate({
                              title: cert.title,
                              achievedBy: cert.achievedBy,
                              date: cert.date,
                              fileUrl: cert.fileUrl
                            })}
                            className="aspect-[1.4] rounded-lg border overflow-hidden bg-slate-50 relative group shadow-3xs hover:border-primary/50 transition-all cursor-pointer select-none"
                          >
                            {cert.fileUrl ? (
                              <img src={cert.fileUrl} alt={cert.title} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
                            ) : (
                              <div className="w-full h-full flex flex-col items-center justify-center text-primary/30 p-4 border border-dashed rounded-lg bg-white">
                                <FileText className="w-8 h-8 mb-2" />
                                <span className="text-[10px] font-bold text-slate-400 text-center">{cert.title}</span>
                              </div>
                            )}
                            <div className="absolute inset-0 bg-black/45 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-2.5 pointer-events-none">
                              <span className="text-[10px] font-bold text-white leading-tight truncate">{cert.title}</span>
                              <span className="text-[8px] text-slate-300 font-medium leading-none mt-0.5 truncate">{cert.achievedBy}</span>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="col-span-2 py-8 border border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center text-center bg-slate-50/50">
                          <FileText className="w-8 h-8 text-slate-400 mb-2" />
                          <p className="text-[10px] text-slate-500 font-bold">No Certificates Uploaded</p>
                          <p className="text-[8px] text-slate-400 max-w-[180px] mt-0.5">Upload official certificates in image format to display them here.</p>
                        </div>
                      )}
                    </div>
                  </div>

                </div>

              </div>
            )}

          </div>
        )}

      {/* Certificate zoom modal dialog */}
      {zoomedCertificate && (
        <Dialog open={!!zoomedCertificate} onOpenChange={(val) => { if (!val) setZoomedCertificate(null); }}>
          <DialogContent className="max-w-2xl bg-white border rounded-3xl p-6 flex flex-col items-center">
            <DialogHeader className="w-full text-center border-b pb-2 mb-4">
              <DialogTitle className="text-sm font-extrabold text-slate-800">{zoomedCertificate.title}</DialogTitle>
              <DialogDescription className="text-3xs">Recipient: {zoomedCertificate.achievedBy} • Date: {new Date(zoomedCertificate.date).toLocaleDateString()}</DialogDescription>
            </DialogHeader>

            {zoomedCertificate.fileUrl ? (
              <div className="w-full rounded-2xl overflow-hidden border bg-slate-50 relative flex items-center justify-center p-1">
                <img src={zoomedCertificate.fileUrl} alt={zoomedCertificate.title} className="w-full h-auto object-contain max-h-[70vh] rounded-xl shadow-xs" />
              </div>
            ) : (
              <div className="w-full p-12 text-center text-slate-400 border border-dashed rounded-2xl bg-slate-50/50 flex flex-col items-center justify-center">
                <FileText className="w-10 h-10 mb-3 text-slate-350" />
                <p className="text-xs font-bold text-slate-500">No Image Uploaded</p>
                <p className="text-2xs text-slate-400 mt-0.5">There is no official certificate file attached.</p>
              </div>
            )}

            <DialogFooter className="w-full pt-4 border-t mt-4 flex justify-end">
              {zoomedCertificate.fileUrl && (
                <Button onClick={() => window.open(zoomedCertificate.fileUrl, '_blank')} variant="outline" className="font-bold text-xs h-9 px-4 rounded-xl mr-2">
                  Open in New Tab
                </Button>
              )}
              <Button onClick={() => setZoomedCertificate(null)} className="font-bold text-xs h-9 px-4 rounded-xl bg-primary text-white border-none">
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Dedicated Timeline CRUD Modal */}
      {isTimelineDialogOpen && (
        <Dialog open={isTimelineDialogOpen} onOpenChange={setIsTimelineDialogOpen}>
          <DialogContent className="max-w-xl bg-white border rounded-3xl p-6">
            <DialogHeader className="border-b pb-4">
              <DialogTitle className="text-base font-extrabold text-slate-900">
                Manage Timeline: {activeAchievement?.title}
              </DialogTitle>
              <DialogDescription className="text-xs">
                Add, edit, or delete milestones on the timeline. Staged changes will apply when saved.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 pt-4 text-xs font-semibold">
              {/* Form to Add / Edit Milestone */}
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end p-3 border border-slate-150 rounded-2xl bg-slate-50/50">
                <div className="sm:col-span-4">
                  <Label htmlFor="dialog-timeline-date" className="text-3xs uppercase font-extrabold tracking-wider text-slate-400">Milestone Date</Label>
                  <Input
                    id="dialog-timeline-date"
                    type="date"
                    value={timelineDialogDate}
                    onChange={(e) => setTimelineDialogDate(e.target.value)}
                    className="mt-1 h-9.5 text-2xs border-slate-200 bg-white"
                  />
                </div>
                <div className="sm:col-span-6">
                  <Label htmlFor="dialog-timeline-label" className="text-3xs uppercase font-extrabold tracking-wider text-slate-400">Milestone Label</Label>
                  <Input
                    id="dialog-timeline-label"
                    type="text"
                    placeholder="e.g. Idea Generated"
                    value={timelineDialogLabel}
                    onChange={(e) => setTimelineDialogLabel(e.target.value)}
                    className="mt-1 h-9.5 text-2xs border-slate-200 bg-white"
                  />
                </div>
                <div className="sm:col-span-2">
                  <Button
                    type="button"
                    onClick={handleAddTimelineDialogItem}
                    className="w-full h-9.5 text-2xs font-bold bg-primary hover:bg-primary/95 text-white rounded-xl shadow-sm"
                  >
                    {editingTimelineDialogIdx !== null ? "Update" : "Add"}
                  </Button>
                </div>
              </div>

              {/* List of current milestones */}
              <div className="space-y-2">
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Milestones List ({timelineDialogList.length})</p>
                {timelineDialogList.length === 0 ? (
                  <div className="text-center py-6 border border-dashed rounded-2xl text-slate-400 font-medium text-2xs bg-slate-50/30">
                    No custom milestones. Simulated milestones will be shown.
                  </div>
                ) : (
                  <div className="border border-slate-150 rounded-2xl p-3 bg-white space-y-2 max-h-60 overflow-y-auto">
                    <div className="space-y-1.5">
                      {timelineDialogList.map((item, idx) => (
                        <div key={idx} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-2xs">
                          <div className="flex items-center gap-3">
                            <span className="font-extrabold text-primary shrink-0">
                              {new Date(item.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                            </span>
                            <span className="text-slate-700 font-bold truncate max-w-[200px] sm:max-w-[320px]">
                              {item.label}
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Button
                              type="button"
                              variant="ghost"
                              className="h-7 w-7 p-0 text-slate-500 hover:text-primary hover:bg-slate-100 rounded-lg"
                              onClick={() => handleEditTimelineDialogItem(idx)}
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              className="h-7 w-7 p-0 text-red-500 hover:text-red-750 hover:bg-red-50 rounded-lg"
                              onClick={() => handleDeleteTimelineDialogItem(idx)}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <DialogFooter className="pt-4 border-t mt-4 gap-2 md:gap-0">
              <Button type="button" variant="outline" onClick={() => setIsTimelineDialogOpen(false)} className="font-bold text-xs h-10 rounded-xl px-5">
                Cancel
              </Button>
              <Button type="button" onClick={handleSaveTimeline} className="font-bold bg-primary text-white rounded-xl h-10 px-5 shadow-md">
                Save Timeline
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Dedicated Certificates CRUD Modal */}
      {isCertDialogOpen && (
        <Dialog open={isCertDialogOpen} onOpenChange={setIsCertDialogOpen}>
          <DialogContent className="max-w-xl bg-white border rounded-3xl p-6">
            <DialogHeader className="border-b pb-4">
              <DialogTitle className="text-base font-extrabold text-slate-900">
                Manage Certificates: {activeAchievement?.title}
              </DialogTitle>
              <DialogDescription className="text-xs">
                Add, edit, or delete certificates. Upload custom PDFs or images, or let metadata auto-generate them.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 pt-4 text-xs font-semibold">
              {/* Form to Add / Edit Certificate */}
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end p-3 border border-slate-150 rounded-2xl bg-slate-50/50">
                <div className="sm:col-span-3">
                  <Label htmlFor="dialog-cert-title" className="text-3xs uppercase font-extrabold tracking-wider text-slate-400">Cert Title</Label>
                  <Input
                    id="dialog-cert-title"
                    type="text"
                    placeholder="e.g. Winner Certificate"
                    value={certDialogTitle}
                    onChange={(e) => setCertDialogTitle(e.target.value)}
                    className="mt-1 h-9.5 text-2xs border-slate-200 bg-white"
                  />
                </div>
                <div className="sm:col-span-3">
                  <Label htmlFor="dialog-cert-recipient" className="text-3xs uppercase font-extrabold tracking-wider text-slate-400">Recipient Name</Label>
                  <Input
                    id="dialog-cert-recipient"
                    type="text"
                    placeholder="e.g. Team Nexus"
                    value={certDialogRecipient}
                    onChange={(e) => setCertDialogRecipient(e.target.value)}
                    className="mt-1 h-9.5 text-2xs border-slate-200 bg-white"
                  />
                </div>
                <div className="sm:col-span-2">
                  <Label htmlFor="dialog-cert-date" className="text-3xs uppercase font-extrabold tracking-wider text-slate-400">Date</Label>
                  <Input
                    id="dialog-cert-date"
                    type="date"
                    value={certDialogDate}
                    onChange={(e) => setCertDialogDate(e.target.value)}
                    className="mt-1 h-9.5 text-2xs border-slate-200 bg-white"
                  />
                </div>
                <div className="sm:col-span-2">
                  <Label htmlFor="dialog-cert-file" className="text-3xs uppercase font-extrabold tracking-wider text-slate-400">PDF / Image</Label>
                  <Input
                    id="dialog-cert-file"
                    type="file"
                    accept="image/*,application/pdf"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        setCertDialogFile(e.target.files[0]);
                      }
                    }}
                    className="mt-1 h-9.5 text-[10px] border-slate-200 bg-white file:hidden"
                  />
                </div>
                <div className="sm:col-span-2">
                  <Button
                    type="button"
                    onClick={handleAddCertDialogItem}
                    className="w-full h-9.5 text-2xs font-bold bg-primary hover:bg-primary/95 text-white rounded-xl shadow-sm"
                  >
                    {editingCertDialogIdx !== null ? "Update" : "Add"}
                  </Button>
                </div>
              </div>

              {/* Display Selected File Preview/Label */}
              {certDialogFile && (
                <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 rounded-lg text-3xs border border-emerald-100 max-w-xs">
                  <span className="font-extrabold uppercase">File Staged:</span>
                  <span className="truncate max-w-[150px]">{certDialogFile.name}</span>
                  <button
                    type="button"
                    onClick={() => setCertDialogFile(null)}
                    className="hover:text-red-500 font-bold ml-auto"
                    title="Remove file"
                  >
                    <X className="w-3 h-3 stroke-[2.5]" />
                  </button>
                </div>
              )}

              {/* List of current certificates */}
              <div className="space-y-2">
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Certificates List ({certDialogList.length})</p>
                {certDialogList.length === 0 ? (
                  <div className="text-center py-6 border border-dashed rounded-2xl text-slate-400 font-medium text-2xs bg-slate-50/30">
                    No custom certificates. Simulated certificates will be shown.
                  </div>
                ) : (
                  <div className="border border-slate-150 rounded-2xl p-3 bg-white space-y-2 max-h-60 overflow-y-auto">
                    <div className="space-y-1.5">
                      {certDialogList.map((item, idx) => (
                        <div key={idx} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-2xs">
                          <div className="flex items-center gap-3">
                            <span className="font-extrabold text-primary shrink-0">
                              {new Date(item.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                            </span>
                            <span className="text-slate-700 font-bold truncate max-w-[120px]">
                              {item.title}
                            </span>
                            <span className="text-slate-400 font-semibold italic truncate max-w-[100px]">
                              ({item.achievedBy})
                            </span>
                            {item.file && (
                              <span className="bg-emerald-500/10 text-emerald-700 text-[8px] font-extrabold px-1 rounded">
                                New Doc
                              </span>
                            )}
                            {item.fileUrl && !item.file && (
                              <span className="bg-blue-500/10 text-blue-700 text-[8px] font-extrabold px-1 rounded">
                                Saved Doc
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-1">
                            <Button
                              type="button"
                              variant="ghost"
                              className="h-7 w-7 p-0 text-slate-500 hover:text-primary hover:bg-slate-100 rounded-lg"
                              onClick={() => handleEditCertDialogItem(idx)}
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              className="h-7 w-7 p-0 text-red-500 hover:text-red-750 hover:bg-red-50 rounded-lg"
                              onClick={() => handleDeleteCertDialogItem(idx)}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <DialogFooter className="pt-4 border-t mt-4 gap-2 md:gap-0">
              <Button type="button" variant="outline" onClick={() => setIsCertDialogOpen(false)} className="font-bold text-xs h-10 rounded-xl px-5">
                Cancel
              </Button>
              <Button type="button" onClick={handleSaveCertificates} className="font-bold bg-primary text-white rounded-xl h-10 px-5 shadow-md">
                Save Certificates
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
      </div>
    </div>
  );
};

export default Achievements;
