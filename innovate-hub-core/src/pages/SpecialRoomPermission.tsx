import { useState, useEffect } from "react";
import api from "@/lib/axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  Users,
  Briefcase,
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Trash,
  Plus,
  Printer,
  Download,
  Info,
  Check,
  Loader2,
  RefreshCw
} from "lucide-react";

interface RoomDetails {
  name: string;
  capacity: number;
  equipment: string[];
  description: string;
  image: string;
  isActive?: boolean;
  deactivationReason?: string | null;
}

const BRANCHES = [
  "Computer Engineering",
  "Artificial Intelligence & Data Science (AIDS)",
  "Computer Science & Design (CSD)",
  "Electronics & Telecommunication Engineering (ENTC)",
  "Information Technology (IT)",
  "Robotics & Automation",
  "Mechanical Engineering",
  "Civil Engineering",
  "Electrical Engineering",
  "Chemical Engineering"
];

const CATEGORIES = [
  "Project Discussion",
  "Prototype Development",
  "Team Meeting",
  "Workshop Preparation",
  "Presentation Practice",
  "Research Activity",
  "Innovation Activity",
  "Other"
];

const getEquipmentEmoji = (eq: string) => {
  const map: Record<string, string> = {
    'Projector': '📽',
    'Display Screen': '🖥',
    'Audio System': '🔊',
    'Marker Set': '✏',
    'Whiteboard': '📋',
    'Laptop Connection': '🔌',
    'Extension Board': '⚡',
    'Internet Access': '🌐',
    'Video Conferencing Setup': '📹',
    'Prototype Display Area': '📦'
  };
  return map[eq] || '🛠';
};

const parseTimeTo12Hour = (timeStr: string) => {
  if (!timeStr) return { hour: "", minute: "", period: "" };
  const parts = timeStr.split(":");
  if (parts.length < 2) return { hour: "", minute: "", period: "" };
  const [hStr, mStr] = parts;
  let hour = parseInt(hStr, 10);
  const minute = mStr || "00";
  let period = "AM";
  if (hour >= 12) {
    period = "PM";
    if (hour > 12) hour -= 12;
  }
  if (hour === 0) hour = 12;
  return {
    hour: String(hour).padStart(2, "0"),
    minute,
    period
  };
};

const formatTimeFrom12Hour = (hour: string, minute: string, period: string) => {
  let h = parseInt(hour, 10);
  if (period === "PM" && h < 12) h += 12;
  if (period === "AM" && h === 12) h = 0;
  return `${String(h).padStart(2, "0")}:${minute}`;
};

const TimePicker12Hour = ({
  label,
  value,
  onChange
}: {
  label: string;
  value: string;
  onChange: (time: string) => void;
}) => {
  const { hour, minute, period } = parseTimeTo12Hour(value);

  const handleHourChange = (newHour: string) => {
    const m = minute || "00";
    const p = period || "AM";
    onChange(formatTimeFrom12Hour(newHour, m, p));
  };

  const handleMinuteChange = (newMinute: string) => {
    const h = hour || "12";
    const p = period || "AM";
    onChange(formatTimeFrom12Hour(h, newMinute, p));
  };

  const handlePeriodChange = (newPeriod: string) => {
    const h = hour || "12";
    const m = minute || "00";
    onChange(formatTimeFrom12Hour(h, m, newPeriod));
  };

  const hoursList = ["12", "01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11"];
  const minutesList = Array.from({ length: 12 }, (_, i) => String(i * 5).padStart(2, "0"));

  return (
    <div>
      <Label className="text-sm font-medium">{label}</Label>
      <div className="grid grid-cols-3 gap-2 sm:flex sm:items-center sm:gap-1.5 mt-1">
        <Select value={hour || undefined} onValueChange={handleHourChange}>
          <SelectTrigger className="w-full h-11 sm:h-10 sm:w-[75px] border border-slate-200 rounded-lg text-sm sm:text-xs bg-background min-h-[44px]">
            <SelectValue placeholder="Hour" />
          </SelectTrigger>
          <SelectContent className="max-h-[200px]">
            {hoursList.map((h) => (
              <SelectItem key={h} value={h}>
                {h}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span className="hidden sm:inline text-muted-foreground font-semibold text-center">:</span>
        <Select value={minute || undefined} onValueChange={handleMinuteChange}>
          <SelectTrigger className="w-full h-11 sm:h-10 sm:w-[75px] border border-slate-200 rounded-lg text-sm sm:text-xs bg-background min-h-[44px]">
            <SelectValue placeholder="Min" />
          </SelectTrigger>
          <SelectContent className="max-h-[200px]">
            {minutesList.map((m) => (
              <SelectItem key={m} value={m}>
                {m}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={period || undefined} onValueChange={handlePeriodChange}>
          <SelectTrigger className="w-full h-11 sm:h-10 sm:w-[85px] border border-slate-200 rounded-lg text-sm sm:text-xs bg-background min-h-[44px]">
            <SelectValue placeholder="AM/PM" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="AM">AM</SelectItem>
            <SelectItem value="PM">PM</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};

const SpecialRoomPermission = () => {
  const [activeTab, setActiveTab] = useState<"book" | "history">("book");
  const [selectedRoom, setSelectedRoom] = useState<RoomDetails | null>(null);
  const [viewDetailsRoom, setViewDetailsRoom] = useState<RoomDetails | null>(null);
  
  // Form State
  const [formStep, setFormStep] = useState<number>(1);
  const [formData, setFormData] = useState({
    purpose: "",
    category: "Project Discussion",
    applicantDetails: {
      applicantName: "",
      prn: "",
      rollNo: "",
      department: "",
      year: "",
      division: "",
      mobile: "",
      email: ""
    },
    teamDetails: {
      teamName: "",
      projectName: "",
      participantsCount: 1
    },
    schedule: {
      requestedDate: "",
      startTime: "",
      endTime: ""
    },
    facultyRecommendation: {
      facultyName: "",
      facultyDepartment: "",
      facultyMobile: "",
      facultyEmail: "",
      facultyDesignation: "Assistant Professor",
      facultyRemarks: ""
    },
    resourceRequirements: {
      requiredEquipment: [] as string[],
      otherEquipment: ""
    },
    specialRequirements: "",
    additionalNotes: "",
    guidelinesChecked: {
      cleanliness: false,
      noDamage: false,
      timings: false,
      returnEquipment: false,
      policies: false
    }
  });

  const [teamMembers, setTeamMembers] = useState<{ fullName: string; prn: string; department: string; year: string }[]>([]);
  const [availabilityCheck, setAvailabilityCheck] = useState<{ available: boolean; status: string; message: string; suggestions?: { startTime: string; endTime: string }[] } | null>(null);
  const [inventoryStatus, setInventoryStatus] = useState<{ equipment: string; total: number; reserved: number; remaining: number }[]>([]);
  
  // Dashboard / History state
  const [myRequests, setMyRequests] = useState<any[]>([]);
  const [stats, setStats] = useState({ total: 0, pending: 0, approved: 0, rejected: 0, upcoming: 0, todayBookings: 0, completed: 0 });
  const [selectedRequestDetails, setSelectedRequestDetails] = useState<any | null>(null);
  const [rooms, setRooms] = useState<RoomDetails[]>([]);
  const [loadingRooms, setLoadingRooms] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingDraftId, setEditingDraftId] = useState<string | null>(null);

  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([
        fetchMyRequests(),
        fetchStats(),
        fetchSpecialRooms()
      ]);
      toast.success("Room permissions data refreshed!");
    } catch {
      toast.error("Failed to refresh data");
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        Promise.all([
          fetchMyRequests(),
          fetchStats()
        ]).catch(err => console.error("Auto refresh room permissions failed", err));
      }
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    fetchSpecialRooms();
    fetchMyRequests();
    fetchStats();
    
    // Autofill user details if logged in
    const userRaw = localStorage.getItem("idea_hub_user");
    if (userRaw) {
      const u = JSON.parse(userRaw);
      setFormData(prev => ({
        ...prev,
        applicantDetails: {
          ...prev.applicantDetails,
          applicantName: u.name || "",
          email: u.email || "",
          mobile: u.mobile || "",
          department: u.branch || "",
          year: u.year || ""
        }
      }));
    }
  }, []);

  const fetchSpecialRooms = async () => {
    try {
      setLoadingRooms(true);
      const res = await api.get("/rooms?isSpecial=true");
      const mapped = res.data.map((r: any) => ({
        name: r.name,
        capacity: r.capacity,
        equipment: r.features || [],
        description: r.description || "",
        image: r.image || "",
        isActive: r.isActive,
        deactivationReason: r.deactivationReason
      }));
      setRooms(mapped);
    } catch (err) {
      console.error("Failed to load special rooms:", err);
      toast.error("Failed to load special rooms.");
    } finally {
      setLoadingRooms(false);
    }
  };

  const fetchMyRequests = async () => {
    try {
      const res = await api.get("/room-permissions");
      setMyRequests(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await api.get("/room-permissions/student-stats");
      setStats(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const checkAvailability = async () => {
    if (!selectedRoom || !formData.schedule.requestedDate || !formData.schedule.startTime || !formData.schedule.endTime) {
      return;
    }
    try {
      const res = await api.get(
        `/room-permissions/availability?requestedDate=${formData.schedule.requestedDate}&startTime=${formData.schedule.startTime}&endTime=${formData.schedule.endTime}&facilityRequired=${selectedRoom.name}`
      );
      setAvailabilityCheck(res.data);
      if (!res.data.available) {
        toast.warning(res.data.message);
      } else {
        toast.success(res.data.message);
      }

      // Also fetch resources inventory for that time
      const invRes = await api.get(
        `/room-permissions/inventory?date=${formData.schedule.requestedDate}&startTime=${formData.schedule.startTime}&endTime=${formData.schedule.endTime}`
      );
      setInventoryStatus(invRes.data);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to check availability");
    }
  };

  const addTeamMember = () => {
    setTeamMembers(prev => [...prev, { fullName: "", prn: "", department: formData.applicantDetails.department, year: "" }]);
  };

  const removeTeamMember = (index: number) => {
    setTeamMembers(prev => prev.filter((_, i) => i !== index));
  };

  const handleMemberChange = (index: number, field: string, value: string) => {
    const members = [...teamMembers];
    // @ts-ignore
    members[index][field] = value;
    setTeamMembers(members);
  };

  const handleEquipmentToggle = (item: string) => {
    const current = formData.resourceRequirements.requiredEquipment;
    if (current.includes(item)) {
      setFormData(prev => ({
        ...prev,
        resourceRequirements: {
          ...prev.resourceRequirements,
          requiredEquipment: current.filter(x => x !== item)
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        resourceRequirements: {
          ...prev.resourceRequirements,
          requiredEquipment: [...current, item]
        }
      }));
    }
  };

  const calculateDuration = () => {
    const { startTime, endTime } = formData.schedule;
    if (!startTime || !endTime) return "0 hours";
    const [sh, sm] = startTime.split(':').map(Number);
    const [eh, em] = endTime.split(':').map(Number);
    const duration = (eh * 60 + em - (sh * 60 + sm)) / 60;
    return duration > 0 ? `${duration.toFixed(1)} Hours` : "0 hours";
  };

  const validateStep = (step: number) => {
    if (step === 1) {
      if (!selectedRoom) return "Please select a facility.";
      if (!formData.schedule.requestedDate || !formData.schedule.startTime || !formData.schedule.endTime) {
        return "Please enter a schedule date and slot.";
      }
      if (availabilityCheck && !availabilityCheck.available) {
        return "Selected slot has conflict. Please select a different timing.";
      }
      if (!formData.teamDetails.participantsCount || formData.teamDetails.participantsCount < 1) {
        return "Number of participants must be at least 1.";
      }
      if (formData.teamDetails.participantsCount > selectedRoom.capacity) {
        return `Participant count exceeds room capacity of ${selectedRoom.capacity}.`;
      }
    }
    if (step === 2) {
      const ap = formData.applicantDetails;
      if (!ap.applicantName || !ap.prn || !ap.rollNo || !ap.department || !ap.year || !ap.division || !ap.mobile || !ap.email) {
        return "Please fill all applicant details.";
      }
      const td = formData.teamDetails;
      if (!td.teamName || !td.projectName) {
        return "Please enter team name and project name.";
      }
      for (const m of teamMembers) {
        if (!m.fullName || !m.prn || !m.year) {
          return "Please fill all details for each team member.";
        }
      }
    }
    if (step === 3) {
      const fc = formData.facultyRecommendation;
      if (!fc.facultyName || !fc.facultyDepartment || !fc.facultyMobile || !fc.facultyEmail) {
        return "Please fill recommendations faculty details.";
      }
    }
    return null;
  };

  const nextStep = () => {
    const err = validateStep(formStep);
    if (err) {
      toast.error(err);
      return;
    }
    setFormStep(prev => prev + 1);
  };

  const prevStep = () => {
    setFormStep(prev => prev - 1);
  };

  const handleFormSubmit = async (status: "Draft" | "Submitted") => {
    if (status === "Submitted") {
      const err = validateStep(3);
      if (err) return toast.error(err);
      
      const guides = formData.guidelinesChecked;
      if (!guides.cleanliness || !guides.noDamage || !guides.timings || !guides.returnEquipment || !guides.policies) {
        return toast.error("You must agree to all Room Rules & Guidelines before submission.");
      }
    }

    setIsSubmitting(true);
    try {
      const payload = {
        facilityRequired: selectedRoom?.name,
        purpose: formData.purpose,
        category: formData.category,
        applicantDetails: formData.applicantDetails,
        teamDetails: {
          ...formData.teamDetails,
          teamMembers
        },
        schedule: formData.schedule,
        facultyRecommendation: formData.facultyRecommendation,
        resourceRequirements: formData.resourceRequirements,
        specialRequirements: formData.specialRequirements,
        additionalNotes: formData.additionalNotes,
        declaresAgreed: true,
        status
      };

      if (editingDraftId) {
        await api.put(`/room-permissions/${editingDraftId}/update`, payload);
      } else {
        await api.post("/room-permissions/submit", payload);
      }
      
      toast.success(status === "Submitted" ? "Request submitted successfully!" : "Draft saved!");
      setActiveTab("history");
      setSelectedRoom(null);
      setFormStep(1);
      setEditingDraftId(null);
      // Reset form
      setFormData(prev => ({
        ...prev,
        purpose: "",
        teamDetails: { teamName: "", projectName: "", participantsCount: 1 },
        schedule: { requestedDate: "", startTime: "", endTime: "" },
        facultyRecommendation: { facultyName: "", facultyDepartment: "", facultyMobile: "", facultyEmail: "", facultyDesignation: "Assistant Professor", facultyRemarks: "" },
        resourceRequirements: { requiredEquipment: [], otherEquipment: "" },
        specialRequirements: "",
        additionalNotes: "",
        guidelinesChecked: { cleanliness: false, noDamage: false, timings: false, returnEquipment: false, policies: false }
      }));
      setTeamMembers([]);
      setAvailabilityCheck(null);
      fetchMyRequests();
      fetchStats();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to submit request.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const cancelRequest = async (id: string) => {
    try {
      await api.put(`/room-permissions/${id}/cancel`);
      toast.success("Request cancelled successfully!");
      fetchMyRequests();
      fetchStats();
      if (selectedRequestDetails?._id === id) {
        setSelectedRequestDetails(null);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to cancel request.");
    }
  };

  const submitDraft = async (reqObj: any) => {
    try {
      await api.put(`/room-permissions/${reqObj._id}/submit-draft`);
      toast.success("Draft submitted successfully!");
      fetchMyRequests();
      fetchStats();
      if (selectedRequestDetails?._id === reqObj._id) {
        setSelectedRequestDetails(prev => prev ? { ...prev, status: "Submitted" } : null);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to submit draft.");
    }
  };

  const editDraft = (req: any) => {
    setEditingDraftId(req._id);
    
    // Find the selected room
    const room = rooms.find(r => r.name === req.facilityRequired);
    if (room) setSelectedRoom(room);

    setFormData({
      purpose: req.purpose || "",
      category: req.category || "Project Discussion",
      applicantDetails: {
        applicantName: req.applicantDetails?.applicantName || "",
        prn: req.applicantDetails?.prn || "",
        rollNo: req.applicantDetails?.rollNo || "",
        department: req.applicantDetails?.department || "",
        year: req.applicantDetails?.year || "",
        division: req.applicantDetails?.division || "",
        mobile: req.applicantDetails?.mobile || "",
        email: req.applicantDetails?.email || ""
      },
      teamDetails: {
        teamName: req.teamDetails?.teamName || "",
        projectName: req.teamDetails?.projectName || "",
        participantsCount: req.teamDetails?.participantsCount || 1
      },
      schedule: {
        requestedDate: req.schedule?.requestedDate || "",
        startTime: req.schedule?.startTime || "",
        endTime: req.schedule?.endTime || ""
      },
      facultyRecommendation: {
        facultyName: req.facultyRecommendation?.facultyName || "",
        facultyDepartment: req.facultyRecommendation?.facultyDepartment || "",
        facultyMobile: req.facultyRecommendation?.facultyMobile || "",
        facultyEmail: req.facultyRecommendation?.facultyEmail || "",
        facultyDesignation: req.facultyRecommendation?.facultyDesignation || "Assistant Professor",
        facultyRemarks: req.facultyRecommendation?.facultyRemarks || ""
      },
      resourceRequirements: {
        requiredEquipment: req.resourceRequirements?.requiredEquipment || [],
        otherEquipment: req.resourceRequirements?.otherEquipment || ""
      },
      specialRequirements: req.specialRequirements || "",
      additionalNotes: req.additionalNotes || "",
      guidelinesChecked: req.declaresAgreed ? { cleanliness: true, noDamage: true, timings: true, returnEquipment: true, policies: true } : { cleanliness: false, noDamage: false, timings: false, returnEquipment: false, policies: false }
    });
    setTeamMembers(req.teamDetails?.teamMembers || []);
    setActiveTab("book");
    setFormStep(1);
  };

  const downloadPdf = (id: string) => {
    const token = localStorage.getItem('idea_hub_token');
    window.open(`${api.defaults.baseURL}/room-permissions/${id}/pdf${token ? `?token=${token}` : ''}`, "_blank");
  };

  const printForm = (req: any) => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;
    printWindow.document.write(`
      <html>
        <head>
          <title>Room Permission Form - ${req.requestId}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; line-height: 1.6; color: #333; }
            h2 { text-align: center; color: #1a237e; border-bottom: 2px solid #1a237e; padding-bottom: 10px; }
            .section { margin-bottom: 20px; border: 1px solid #ddd; padding: 15px; border-radius: 4px; }
            .section-title { font-weight: bold; background: #e8eaf6; padding: 5px 10px; margin:-15px -15px 15px -15px; color:#1a237e; }
            .grid { display: grid; grid-template-cols: 1fr 1fr; gap: 10px; }
            .label { font-weight: bold; }
            .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #777; }
            .sig-row { display: flex; justify-content: space-between; margin-top: 50px; }
            .sig-col { text-align: center; width: 22%; border-top: 1px solid #aaa; padding-top: 5px; font-size: 13px; }
          </style>
        </head>
        <body>
          <div class="header-container">
            <img src="/uploaded-logo.png" alt="Logo" class="logo" onerror="this.src='/logo.svg'; this.onerror=null;" />
            <h2>AICTE IDEA HUB SPECIAL ROOM PERMISSION</h2>
          </div>
          <p style="text-align:right"><b>Request ID:</b> ${req.requestId} | <b>Date:</b> ${new Date(req.createdAt).toLocaleDateString()}</p>
          
          <div class="section">
            <div class="section-title">Facility details</div>
            <div class="grid">
              <div><span class="label">Required Room:</span> ${req.facilityRequired}</div>
              <div><span class="label">Date & Time:</span> ${req.schedule.requestedDate} (${req.schedule.startTime} - ${req.schedule.endTime})</div>
              <div><span class="label">Duration:</span> ${req.schedule.duration} Hours</div>
              <div><span class="label">Project Title:</span> ${req.teamDetails.projectName}</div>
            </div>
          </div>

          <div class="section">
            <div class="section-title">Applicant details</div>
            <div class="grid">
              <div><span class="label">Name:</span> ${req.applicantDetails.applicantName}</div>
              <div><span class="label">PRN / Roll Number:</span> ${req.applicantDetails.prn} / ${req.applicantDetails.rollNo}</div>
              <div><span class="label">Department / Year:</span> ${req.applicantDetails.department} - ${req.applicantDetails.year} (Div: ${req.applicantDetails.division})</div>
              <div><span class="label">Email / Mobile:</span> ${req.applicantDetails.email} / ${req.applicantDetails.mobile}</div>
            </div>
          </div>

          <div class="section">
            <div class="section-title">Faculty Recommendation</div>
            <div class="grid">
              <div><span class="label">Faculty Advisor:</span> ${req.facultyRecommendation.facultyName}</div>
              <div><span class="label">Designation / Department:</span> ${req.facultyRecommendation.facultyDesignation} (${req.facultyRecommendation.facultyDepartment})</div>
              <div><span class="label">Recommendation Status:</span> ${req.facultyRecommendation.verified ? "RECOMMENDED" : "PENDING"}</div>
              <div><span class="label">Faculty Remarks:</span> ${req.facultyRecommendation.facultyRemarks || "None"}</div>
            </div>
          </div>

          <div class="sig-row">
            <div class="sig-col">Student Sign</div>
            <div class="sig-col">Faculty Advisor</div>
            <div class="sig-col">Coordinator Sign</div>
            <div class="sig-col">AICTE IDEA Lab Head Sign</div>
          </div>

          <div class="footer">
            Generated from AICTE IDEA Lab Room Permission Module. Valid ONLY with QR/Official signatures.
          </div>
          <script>window.print();</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };



  return (
    <div className="w-full min-h-screen bg-[#F8FAFC] py-4 sm:py-8">
      <div className="w-full max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 sm:mb-8 border-b pb-6 gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Room Permission Management
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Request permission for Conference Rooms, Discussion Rooms, and Ideation Rooms.
          </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3 self-stretch sm:self-auto w-full sm:w-auto justify-end">
          <Button
            variant="outline"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center justify-center gap-2 h-11 sm:h-9 w-full sm:w-auto text-sm bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 font-semibold shadow-xs"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`} />
            Refresh
          </Button>

          {/* Navigation Tabs */}
          <div className="grid grid-cols-2 gap-2 flex-1 w-full bg-slate-100/60 p-1.5 rounded-xl sm:flex sm:flex-none sm:w-auto sm:gap-2 sm:bg-muted sm:p-1 sm:rounded-lg">
            <Button
              variant={activeTab === "book" ? "default" : "ghost"}
              onClick={() => { setActiveTab("book"); setFormStep(1); setEditingDraftId(null); setSelectedRoom(null); }}
              className={`flex items-center justify-center gap-2 h-11 sm:h-9 w-full sm:w-auto text-sm ${activeTab === 'book' ? 'bg-white text-slate-900 shadow-sm sm:bg-primary sm:text-primary-foreground font-semibold' : 'text-slate-600 sm:text-slate-600 font-semibold'}`}
            >
              <Users className="w-4 h-4" /> Book Room
            </Button>

            <Button
              variant={activeTab === "history" ? "default" : "ghost"}
              onClick={() => setActiveTab("history")}
              className={`flex items-center justify-center gap-2 h-11 sm:h-9 w-full sm:w-auto text-sm ${activeTab === 'history' ? 'bg-white text-slate-900 shadow-sm sm:bg-primary sm:text-primary-foreground font-semibold' : 'text-slate-600 sm:text-slate-600 font-semibold'}`}
            >
              <FileText className="w-4 h-4" /> My Requests
            </Button>
          </div>
        </div>
      </div>

      {/* -------------------- BOOK ROOM TAB -------------------- */}
      {activeTab === "book" && (
        <div className="w-full">
          {/* Room Selection Cards Column */}
          {loadingRooms ? (
            <div className="text-center py-12 text-muted-foreground">Loading special rooms details...</div>
          ) : !selectedRoom ? (
            <div className="space-y-6 sm:space-y-8 w-full bg-white/50 backdrop-blur-md p-4 sm:p-6 md:p-8 rounded-2xl border border-slate-200/60 shadow-sm">
              <div className="border-b border-slate-200/80 pb-4 sm:pb-5">
                <h2 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-slate-900 tracking-tight">Select Facility Type</h2>
                <p className="text-xs sm:text-sm text-slate-500 mt-1">Choose the space that best suits your activity</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 sm:gap-8">
                {rooms.map(room => {
                  const isDeactivated = room.isActive === false;
                  return (
                    <Card 
                      key={room.name} 
                      className={`overflow-hidden bg-white border border-slate-200/80 shadow-sm hover:-translate-y-1 sm:hover:-translate-y-2 hover:shadow-lg transition-all duration-300 rounded-2xl flex flex-col min-h-0 md:min-h-[520px] ${isDeactivated ? 'opacity-80' : ''}`}
                    >
                      <div className="relative h-48 sm:h-56 overflow-hidden bg-slate-900 group">
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/40 via-transparent to-transparent z-10" />
                        {room.image ? (
                          <img 
                            src={room.image} 
                            alt={room.name} 
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out" 
                          />
                        ) : (
                          <div className="w-full h-full bg-slate-200 flex items-center justify-center text-muted-foreground text-xs">No Image</div>
                        )}
                        <div className="absolute top-4 right-4 z-20 bg-white/95 backdrop-blur-md text-slate-800 text-2xs sm:text-xs px-2.5 py-1.5 rounded-full font-bold shadow-sm border border-slate-100 flex items-center gap-1.5">
                          👥 {room.capacity} People
                        </div>
                      </div>
                      <CardHeader className="p-4 sm:p-6 pb-2">
                        <CardTitle className="text-base sm:text-lg font-extrabold text-slate-900 flex items-center justify-between">
                          {room.name}
                          {isDeactivated && (
                            <span className="text-[9px] sm:text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-rose-100 text-rose-700">Unavailable</span>
                          )}
                        </CardTitle>
                        <CardDescription className="line-clamp-3 text-2xs sm:text-xs text-slate-500 leading-relaxed mt-1">{room.description}</CardDescription>
                      </CardHeader>
                      <CardContent className="flex-1 flex flex-col justify-between p-4 sm:p-6 pt-0 space-y-4 sm:space-y-6">
                        <div>
                          <div className="text-[9px] sm:text-2xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Available Equipment</div>
                          <div className="flex flex-wrap gap-1.5">
                            {room.equipment.slice(0, 4).map(eq => (
                              <span key={eq} className="rounded-full bg-blue-50 text-blue-700 font-semibold px-2.5 py-1 text-[10px] sm:text-2xs flex items-center gap-1">
                                {getEquipmentEmoji(eq)} {eq}
                              </span>
                            ))}
                            {room.equipment.length > 4 && (
                              <span className="rounded-full bg-blue-50 text-blue-700 font-semibold px-2.5 py-1 text-[10px] sm:text-2xs">
                                +{room.equipment.length - 4} More
                              </span>
                            )}
                          </div>
                        </div>
                        
                        {/* Capacity Summary Section or Deactivation message */}
                        {isDeactivated ? (
                          <div className="p-3 rounded-lg bg-rose-50 border border-rose-100 text-rose-800 text-[10px] sm:text-2xs leading-relaxed">
                            <span className="font-extrabold uppercase block text-[8px] sm:text-[9px] mb-0.5 text-rose-900">Deactivated:</span>
                            {room.deactivationReason || "This space is temporarily closed for maintenance."}
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 border-t border-slate-100/80 pt-4">
                            <Users className="w-4 h-4 text-slate-400" />
                            <span className="text-xs font-semibold text-slate-500">Capacity:</span>
                            <span className="text-xs font-bold text-slate-800">{room.capacity} People</span>
                          </div>
                        )}

                        <div className="flex gap-3 pt-2">
                          <Button 
                            type="button" 
                            variant="outline" 
                            onClick={() => setViewDetailsRoom(room)} 
                            className="border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 transition font-semibold px-3 sm:px-4 py-2.5 text-xs rounded-lg flex-1 h-11 sm:h-10 min-h-[44px] sm:min-h-0 shadow-sm"
                          >
                            View Details
                          </Button>
                          <Button 
                            type="button" 
                            disabled={isDeactivated}
                            onClick={() => setSelectedRoom(room)} 
                            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-3 sm:px-4 py-2.5 text-xs rounded-lg transition flex-1 h-11 sm:h-10 min-h-[44px] sm:min-h-0 shadow-sm disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed disabled:border-transparent"
                          >
                            {isDeactivated ? "Unavailable" : "Book Room"}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Form Wizard Column */}
              <div className="lg:col-span-2 space-y-6">
                {/* Mobile Stepper */}
                <div className="block sm:hidden w-full space-y-3 pb-4 border-b mb-4">
                  <div className="flex items-center justify-between">
                    <Button variant="ghost" size="sm" onClick={() => { setSelectedRoom(null); setFormStep(1); }} className="p-0 h-9 hover:bg-transparent text-xs font-semibold text-primary">
                      <ChevronLeft className="w-4 h-4 mr-1" /> Back to Rooms
                    </Button>
                    <span className="text-xs font-bold text-slate-500">Step {formStep} of 3</span>
                  </div>
                  
                  {/* Progress Line Indicator */}
                  <div className="flex items-center justify-center px-8">
                    <div className="flex items-center w-full max-w-[240px]">
                      <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center transition-all ${formStep >= 1 ? 'bg-primary border-2 border-primary' : 'bg-white border-2 border-slate-300'}`}>
                        {formStep > 1 && <Check className="w-2.5 h-2.5 text-white" />}
                      </div>
                      <div className={`flex-1 h-0.5 transition-all ${formStep >= 2 ? 'bg-primary' : 'bg-slate-200'}`} />
                      <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center transition-all ${formStep >= 2 ? 'bg-primary border-2 border-primary' : 'bg-white border-2 border-slate-300'}`}>
                        {formStep > 2 && <Check className="w-2.5 h-2.5 text-white" />}
                      </div>
                      <div className={`flex-1 h-0.5 transition-all ${formStep >= 3 ? 'bg-primary' : 'bg-slate-200'}`} />
                      <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center transition-all ${formStep >= 3 ? 'bg-primary border-2 border-primary' : 'bg-white border-2 border-slate-300'}`}>
                      </div>
                    </div>
                  </div>
                  
                  {/* Step Name Labels */}
                  <div className="flex justify-between items-center text-[10px] font-bold px-2">
                    <span className={formStep === 1 ? 'text-primary' : 'text-slate-400'}>Details</span>
                    <span className="text-slate-300">→</span>
                    <span className={formStep === 2 ? 'text-primary' : 'text-slate-400'}>Applicant</span>
                    <span className="text-slate-300">→</span>
                    <span className={formStep === 3 ? 'text-primary' : 'text-slate-400'}>Faculty</span>
                  </div>
                </div>

                {/* Desktop Stepper */}
                <div className="hidden sm:flex items-center justify-between border-b pb-4 mb-4">
                  <Button variant="ghost" size="sm" onClick={() => { setSelectedRoom(null); setFormStep(1); }} className="p-0 hover:bg-transparent">
                    <ChevronLeft className="w-4 h-4 mr-1" /> Back to Rooms
                  </Button>
                  <div className="flex items-center gap-2">
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${formStep >= 1 ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>1</span>
                    <span className="text-xs text-muted-foreground">Details</span>
                    <span className="w-4 h-px bg-muted" />
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${formStep >= 2 ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>2</span>
                    <span className="text-xs text-muted-foreground">Applicant</span>
                    <span className="w-4 h-px bg-muted" />
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${formStep >= 3 ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>3</span>
                    <span className="text-xs text-muted-foreground">Faculty</span>
                  </div>
                </div>

                <Card className="rounded-2xl border bg-white shadow-sm">
                  <CardHeader className="p-4 sm:p-6 pb-2">
                    <CardTitle className="text-lg font-bold">Booking {selectedRoom.name} - Step {formStep} of 3</CardTitle>
                    <CardDescription className="text-xs sm:text-sm">Fill out all required details accurately.</CardDescription>
                  </CardHeader>
                  <CardContent className="p-4 sm:p-6">
                    {/* STEP 1: SCHEDULE & CAPACITY DETAILS */}
                    {formStep === 1 && (
                      <div className="space-y-4 sm:space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <Label className="text-sm font-medium text-slate-700">Requested Date</Label>
                            <Input 
                              type="date" 
                              min={new Date().toISOString().split('T')[0]} 
                              value={formData.schedule.requestedDate} 
                              onChange={(e) => setFormData(prev => ({ ...prev, schedule: { ...prev.schedule, requestedDate: e.target.value } }))} 
                              className="w-full h-11 sm:h-10 text-sm mt-1"
                            />
                          </div>
                          <TimePicker12Hour 
                            label="Start Time"
                            value={formData.schedule.startTime}
                            onChange={(time) => setFormData(prev => ({ ...prev, schedule: { ...prev.schedule, startTime: time } }))}
                          />
                          <TimePicker12Hour 
                            label="End Time"
                            value={formData.schedule.endTime}
                            onChange={(time) => setFormData(prev => ({ ...prev, schedule: { ...prev.schedule, endTime: time } }))}
                          />
                        </div>

                        <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 pt-1">
                          <Button 
                            type="button"
                            variant="secondary" 
                            onClick={checkAvailability}
                            className="w-full sm:w-auto h-11 sm:h-10 text-sm font-semibold min-h-[44px]"
                          >
                            Check Slot Availability
                          </Button>
                          <div className="flex items-center justify-center sm:justify-start text-sm font-semibold h-11 sm:h-auto">
                            Duration: <span className="text-primary ml-1">{calculateDuration()}</span>
                          </div>
                        </div>

                        {/* Availability Warnings */}
                        {availabilityCheck && (
                          <div className={`p-4 rounded-xl border text-sm flex items-start gap-3 ${availabilityCheck.available ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'}`}>
                            {availabilityCheck.available ? <CheckCircle className="w-5 h-5 text-green-600 shrink-0 mt-0.5" /> : <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />}
                            <div>
                              <p className="font-semibold text-sm">{availabilityCheck.status}</p>
                              <p className="text-xs mt-1 leading-relaxed">{availabilityCheck.message}</p>
                              {availabilityCheck.suggestions && availabilityCheck.suggestions.length > 0 && (
                                <div className="mt-3">
                                  <p className="font-semibold text-xs">Suggested nearest available slots:</p>
                                  <div className="flex flex-wrap gap-2 mt-1.5">
                                    {availabilityCheck.suggestions.map((s, idx) => (
                                      <Button 
                                        key={idx} 
                                        type="button" 
                                        variant="outline" 
                                        size="sm" 
                                        onClick={() => {
                                          setFormData(prev => ({ ...prev, schedule: { ...prev.schedule, startTime: s.startTime, endTime: s.endTime } }));
                                          setAvailabilityCheck(null);
                                        }}
                                        className="h-9 text-xs"
                                      >
                                        {s.startTime} - {s.endTime}
                                      </Button>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label className="text-sm font-medium text-slate-700">Activity / Project Category</Label>
                            <Select 
                              value={formData.category} 
                              onValueChange={(val) => setFormData(prev => ({ ...prev, category: val }))}
                            >
                              <SelectTrigger className="h-11 sm:h-10 text-sm mt-1 w-full">
                                <SelectValue placeholder="Category" />
                              </SelectTrigger>
                              <SelectContent>
                                {CATEGORIES.map(c => (
                                  <SelectItem key={c} value={c}>{c}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label className="text-sm font-medium text-slate-700">Number of Participants</Label>
                            <Input 
                              type="number" 
                              min={0} 
                              value={formData.teamDetails.participantsCount === 0 ? "0" : (formData.teamDetails.participantsCount || "")} 
                              onChange={(e) => {
                                const val = e.target.value;
                                setFormData(prev => ({ 
                                  ...prev, 
                                  teamDetails: { 
                                    ...prev.teamDetails, 
                                    participantsCount: val === "" ? "" as any : parseInt(val)
                                  } 
                                }));
                              }} 
                              className="h-11 sm:h-10 text-sm mt-1 w-full"
                            />
                            <p className="text-2xs text-muted-foreground mt-1.5">Max capacity for {selectedRoom.name} is {selectedRoom.capacity} persons.</p>
                          </div>
                        </div>

                        <div>
                          <Label className="text-sm font-medium text-slate-700">Purpose of Request</Label>
                          <Textarea 
                            placeholder="Briefly state the purpose of booking..." 
                            value={formData.purpose} 
                            onChange={(e) => setFormData(prev => ({ ...prev, purpose: e.target.value }))}
                            className="text-sm mt-1 min-h-[100px] w-full"
                          />
                        </div>
                      </div>
                    )}

                    {/* STEP 2: APPLICANT DETAILS & TEAM MEMBERS */}
                    {formStep === 2 && (
                      <div className="space-y-4 sm:space-y-6">
                        <h3 className="text-lg font-bold border-b pb-2 text-slate-800">Applicant Information</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <Label className="text-sm font-medium text-slate-700">Requested By</Label>
                            <Input value={formData.applicantDetails.applicantName} onChange={(e) => setFormData(prev => ({ ...prev, applicantDetails: { ...prev.applicantDetails, applicantName: e.target.value } }))} required className="h-11 sm:h-10 text-sm mt-1 w-full" />
                          </div>
                          <div>
                            <Label className="text-sm font-medium text-slate-700">PRN Number</Label>
                            <Input value={formData.applicantDetails.prn} onChange={(e) => setFormData(prev => ({ ...prev, applicantDetails: { ...prev.applicantDetails, prn: e.target.value } }))} required className="h-11 sm:h-10 text-sm mt-1 w-full" />
                          </div>
                          <div>
                            <Label className="text-sm font-medium text-slate-700">Roll Number</Label>
                            <Input value={formData.applicantDetails.rollNo} onChange={(e) => setFormData(prev => ({ ...prev, applicantDetails: { ...prev.applicantDetails, rollNo: e.target.value } }))} required className="h-11 sm:h-10 text-sm mt-1 w-full" />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                          <div className="md:col-span-2">
                            <Label className="text-sm font-medium text-slate-700">Department / Branch</Label>
                            <Select 
                              value={formData.applicantDetails.department}
                              onValueChange={(val) => setFormData(prev => ({ ...prev, applicantDetails: { ...prev.applicantDetails, department: val } }))}
                            >
                              <SelectTrigger className="h-11 sm:h-10 text-sm mt-1 w-full">
                                <SelectValue placeholder="Select Department" />
                              </SelectTrigger>
                              <SelectContent>
                                {BRANCHES.map(b => (
                                  <SelectItem key={b} value={b}>{b}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label className="text-sm font-medium text-slate-700">Year</Label>
                            <Select 
                              value={formData.applicantDetails.year}
                              onValueChange={(val) => setFormData(prev => ({ ...prev, applicantDetails: { ...prev.applicantDetails, year: val } }))}
                            >
                              <SelectTrigger className="h-11 sm:h-10 text-sm mt-1 w-full">
                                <SelectValue placeholder="Year" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="FE">First Year (FE)</SelectItem>
                                <SelectItem value="SE">Second Year (SE)</SelectItem>
                                <SelectItem value="TE">Third Year (TE)</SelectItem>
                                <SelectItem value="BE">Fourth Year (BE)</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label className="text-sm font-medium text-slate-700">Division</Label>
                            <Input placeholder="A/B/C" value={formData.applicantDetails.division} onChange={(e) => setFormData(prev => ({ ...prev, applicantDetails: { ...prev.applicantDetails, division: e.target.value } }))} required className="h-11 sm:h-10 text-sm mt-1 w-full" />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label className="text-sm font-medium text-slate-700">Mobile Number</Label>
                            <Input type="tel" value={formData.applicantDetails.mobile} onChange={(e) => setFormData(prev => ({ ...prev, applicantDetails: { ...prev.applicantDetails, mobile: e.target.value } }))} required className="h-11 sm:h-10 text-sm mt-1 w-full" />
                          </div>
                          <div>
                            <Label className="text-sm font-medium text-slate-700">Email Address</Label>
                            <Input type="email" value={formData.applicantDetails.email} onChange={(e) => setFormData(prev => ({ ...prev, applicantDetails: { ...prev.applicantDetails, email: e.target.value } }))} required className="h-11 sm:h-10 text-sm mt-1 w-full" />
                          </div>
                        </div>

                        <h3 className="text-lg font-bold border-b pb-2 pt-4 flex justify-between items-center text-slate-800">
                          <span>Team & Project Details</span>
                          <Button type="button" variant="outline" onClick={addTeamMember} className="h-11 sm:h-8 px-4 text-xs font-semibold min-h-[44px] sm:min-h-0">
                            <Plus className="w-3.5 h-3.5 mr-1" /> Add Member
                          </Button>
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label className="text-sm font-medium text-slate-700">Team Name</Label>
                            <Input placeholder="Project / Team Name" value={formData.teamDetails.teamName} onChange={(e) => setFormData(prev => ({ ...prev, teamDetails: { ...prev.teamDetails, teamName: e.target.value } }))} className="h-11 sm:h-10 text-sm mt-1 w-full" />
                          </div>
                          <div>
                            <Label className="text-sm font-medium text-slate-700">Project Name</Label>
                            <Input placeholder="Core Project Title" value={formData.teamDetails.projectName} onChange={(e) => setFormData(prev => ({ ...prev, teamDetails: { ...prev.teamDetails, projectName: e.target.value } }))} className="h-11 sm:h-10 text-sm mt-1 w-full" />
                          </div>
                        </div>

                        {teamMembers.length > 0 && (
                          <div className="space-y-3 pt-2">
                            <Label className="text-sm font-semibold text-slate-700">Dynamic Team Members</Label>
                            {teamMembers.map((member, idx) => (
                              <div key={idx} className="flex flex-col md:flex-row gap-3 border p-4 sm:p-3 rounded-2xl sm:rounded-xl bg-secondary/15 relative pt-10 sm:pt-3">
                                <Button type="button" variant="ghost" onClick={() => removeTeamMember(idx)} className="absolute top-1.5 right-1.5 w-11 h-11 flex items-center justify-center text-red-500 hover:text-red-700 md:hidden min-h-[44px]">
                                  <Trash className="w-4 h-4" />
                                </Button>
                                <div className="flex-1">
                                  <Input placeholder="Full Name" value={member.fullName} onChange={(e) => handleMemberChange(idx, 'fullName', e.target.value)} className="h-11 sm:h-8 text-sm sm:text-xs bg-background w-full" />
                                </div>
                                <div className="w-full md:w-32">
                                  <Input placeholder="PRN" value={member.prn} onChange={(e) => handleMemberChange(idx, 'prn', e.target.value)} className="h-11 sm:h-8 text-sm sm:text-xs bg-background w-full" />
                                </div>
                                <div className="w-full md:w-40">
                                  <Input placeholder="Branch" value={formData.applicantDetails.department} disabled className="h-11 sm:h-8 text-sm sm:text-xs bg-background/50 w-full" />
                                </div>
                                <div className="w-full md:w-28">
                                  <Select value={member.year} onValueChange={(val) => handleMemberChange(idx, 'year', val)}>
                                    <SelectTrigger className="h-11 sm:h-8 text-sm sm:text-xs bg-background w-full">
                                      <SelectValue placeholder="Year" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="FE">FE</SelectItem>
                                      <SelectItem value="SE">SE</SelectItem>
                                      <SelectItem value="TE">TE</SelectItem>
                                      <SelectItem value="BE">BE</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                                <Button type="button" variant="ghost" size="sm" onClick={() => removeTeamMember(idx)} className="text-red-500 hover:text-red-700 hidden md:inline-flex self-center">
                                  <Trash className="w-4 h-4" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* STEP 3: RECOMMENDING FACULTY & RESOURCE REQUIREMENTS */}
                    {formStep === 3 && (
                      <div className="space-y-4 sm:space-y-6">
                        <h3 className="text-lg font-bold border-b pb-2 text-slate-800">Recommending Faculty Details</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <Label className="text-sm font-medium text-slate-700">Faculty Name</Label>
                            <Input value={formData.facultyRecommendation.facultyName} onChange={(e) => setFormData(prev => ({ ...prev, facultyRecommendation: { ...prev.facultyRecommendation, facultyName: e.target.value } }))} required className="h-11 sm:h-10 text-sm mt-1 w-full" />
                          </div>
                          <div>
                            <Label className="text-sm font-medium text-slate-700">Faculty Department</Label>
                            <Input value={formData.facultyRecommendation.facultyDepartment} onChange={(e) => setFormData(prev => ({ ...prev, facultyRecommendation: { ...prev.facultyRecommendation, facultyDepartment: e.target.value } }))} required className="h-11 sm:h-10 text-sm mt-1 w-full" />
                          </div>
                          <div>
                            <Label className="text-sm font-medium text-slate-700">Faculty Designation</Label>
                            <Select 
                              value={formData.facultyRecommendation.facultyDesignation}
                              onValueChange={(val) => setFormData(prev => ({ ...prev, facultyRecommendation: { ...prev.facultyRecommendation, facultyDesignation: val } }))}
                            >
                              <SelectTrigger className="h-11 sm:h-10 text-sm mt-1 w-full">
                                <SelectValue placeholder="Designation" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Assistant Professor">Assistant Professor</SelectItem>
                                <SelectItem value="Associate Professor">Associate Professor</SelectItem>
                                <SelectItem value="Professor">Professor</SelectItem>
                                <SelectItem value="Head of Department">Head of Department (HOD)</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label className="text-sm font-medium text-slate-700">Faculty Mobile Number</Label>
                            <Input type="tel" value={formData.facultyRecommendation.facultyMobile} onChange={(e) => setFormData(prev => ({ ...prev, facultyRecommendation: { ...prev.facultyRecommendation, facultyMobile: e.target.value } }))} required className="h-11 sm:h-10 text-sm mt-1 w-full" />
                          </div>
                          <div>
                            <Label className="text-sm font-medium text-slate-700">Faculty Email Address</Label>
                            <Input type="email" value={formData.facultyRecommendation.facultyEmail} onChange={(e) => setFormData(prev => ({ ...prev, facultyRecommendation: { ...prev.facultyRecommendation, facultyEmail: e.target.value } }))} required className="h-11 sm:h-10 text-sm mt-1 w-full" />
                          </div>
                        </div>

                        <h3 className="text-lg font-bold border-b pb-2 pt-4 text-slate-800">Resource & Equipment Requirements</h3>
                        <div>
                          <Label className="mb-2 block text-sm font-semibold text-slate-700">Select Required Equipment</Label>
                          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                            {selectedRoom.equipment.map(eq => (
                              <div key={eq} className="flex items-center space-x-3 border p-3 rounded-xl hover:bg-slate-50 cursor-pointer min-h-[44px]">
                                <Checkbox 
                                  id={`eq-${eq}`} 
                                  checked={formData.resourceRequirements.requiredEquipment.includes(eq)} 
                                  onCheckedChange={() => handleEquipmentToggle(eq)}
                                  className="h-5 w-5"
                                />
                                <label htmlFor={`eq-${eq}`} className="text-sm font-medium leading-none cursor-pointer">{eq}</label>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                          <div>
                            <Label className="text-sm font-medium text-slate-700">Other Equipment Required</Label>
                            <Input placeholder="Laptop adapters, prototypes display area..." value={formData.resourceRequirements.otherEquipment} onChange={(e) => setFormData(prev => ({ ...prev, resourceRequirements: { ...prev.resourceRequirements, otherEquipment: e.target.value } }))} className="h-11 sm:h-10 text-sm mt-1 w-full" />
                          </div>
                          <div>
                            <Label className="text-sm font-medium text-slate-700">Special Requirements</Label>
                            <Input placeholder="Extended seating, specific audio setups..." value={formData.specialRequirements} onChange={(e) => setFormData(prev => ({ ...prev, specialRequirements: e.target.value }))} className="h-11 sm:h-10 text-sm mt-1 w-full" />
                          </div>
                        </div>

                        <h3 className="text-lg font-bold border-b pb-2 pt-4 text-slate-800">Room Usage Rules & Guidelines</h3>
                        <div className="space-y-1 bg-slate-50 p-4 border rounded-xl">
                          {[
                            { key: 'cleanliness', text: "I agree to maintain complete cleanliness inside the facility." },
                            { key: 'noDamage', text: "I agree to not damage any equipment or furniture inside the room." },
                            { key: 'timings', text: "I agree to strictly follow the allocated timings and vacate immediately after." },
                            { key: 'returnEquipment', text: "I agree to return all borrowed markers, connection cables, or equipment." },
                            { key: 'policies', text: "I agree to follow all official AICTE IDEA Lab guidelines and policies." }
                          ].map(rule => (
                            <div key={rule.key} className="flex items-start space-x-3 py-2 cursor-pointer">
                              <Checkbox 
                                id={`rule-${rule.key}`}
                                // @ts-ignore
                                checked={formData.guidelinesChecked[rule.key]}
                                onCheckedChange={(val) => setFormData(prev => ({
                                  ...prev,
                                  guidelinesChecked: { ...prev.guidelinesChecked, [rule.key]: val }
                                }))}
                                className="mt-0.5 h-5 w-5"
                              />
                              <label htmlFor={`rule-${rule.key}`} className="text-sm cursor-pointer select-none leading-snug text-slate-700">{rule.text}</label>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Actions Row */}
                    <div className="flex flex-col-reverse sm:flex-row sm:justify-between gap-3 sm:gap-2 items-stretch sm:items-center mt-8 pt-4 border-t">
                      {formStep > 1 ? (
                        <Button variant="outline" onClick={prevStep} className="h-11 sm:h-10 text-sm font-semibold w-full sm:w-auto min-h-[44px]">Previous</Button>
                      ) : (
                        <div className="hidden sm:block" />
                      )}
                      
                      <div className="flex flex-col sm:flex-row gap-2 sm:gap-2">
                        <Button variant="ghost" onClick={() => handleFormSubmit("Draft")} disabled={isSubmitting} className="h-11 sm:h-10 text-sm font-semibold w-full sm:w-auto min-h-[44px]">Save Draft</Button>
                        {formStep < 3 ? (
                          <Button onClick={nextStep} className="h-11 sm:h-10 text-sm font-semibold w-full sm:w-auto min-h-[44px]">Next Step</Button>
                        ) : (
                          <Button onClick={() => handleFormSubmit("Submitted")} disabled={isSubmitting} className="bg-green-600 hover:bg-green-700 h-11 sm:h-10 text-sm font-semibold w-full sm:w-auto min-h-[44px]">
                            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Submit Application
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Room Info Side Column */}
              <div className="space-y-4 sm:space-y-6">
                <Card className="rounded-2xl border bg-white shadow-sm">
                  <CardHeader className="p-4 sm:p-6 pb-2">
                    <CardTitle className="text-sm font-bold text-slate-800">Room Inventory Status</CardTitle>
                    <CardDescription className="text-2xs sm:text-xs">Real-time equipment check for selection.</CardDescription>
                  </CardHeader>
                  <CardContent className="p-4 sm:p-6 pt-0 space-y-4">
                    {inventoryStatus.length > 0 ? (
                      <div className="space-y-3">
                        {inventoryStatus.slice(0, 5).map(inv => (
                          <div key={inv.equipment} className="flex justify-between items-center text-xs border-b pb-2">
                            <span className="font-medium">{inv.equipment}</span>
                            <span className="text-muted-foreground">
                              {inv.remaining} / {inv.total} Available
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-xs text-muted-foreground flex items-center gap-2 p-2.5 bg-muted/40 rounded-xl leading-relaxed">
                        <Info className="w-4 h-4 text-primary shrink-0" /> Enter Date and Time slot in Step 1 to load real-time equipment availability.
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card className="rounded-2xl border bg-white shadow-sm overflow-hidden">
                  <CardContent className="p-4 sm:p-6 space-y-4 text-xs">
                    <img src={selectedRoom.image} alt={selectedRoom.name} className="w-full h-40 sm:h-32 object-cover rounded-xl border mb-2" />
                    <h3 className="font-bold text-sm text-slate-800">{selectedRoom.name}</h3>
                    <p className="text-muted-foreground leading-relaxed text-xs">{selectedRoom.description}</p>
                    <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                      <div className="font-semibold text-slate-700 text-xs">Room Capacity:</div>
                      <div className="text-slate-600 font-medium text-2xs mt-0.5">Max {selectedRoom.capacity} participants</div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </div>
      )}

      {/* -------------------- MY REQUESTS / HISTORY TAB -------------------- */}
      {activeTab === "history" && (
        <div className="space-y-6">
          {/* Stats Row */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3 sm:gap-4">
            {[
              { label: "Total Requests", val: stats.total, color: "bg-blue-50 border-blue-200 text-blue-700" },
              { label: "Pending Requests", val: stats.pending, color: "bg-amber-50 border-amber-200 text-amber-700" },
              { label: "Approved Requests", val: stats.approved, color: "bg-green-50 border-green-200 text-green-700" },
              { label: "Rejected Requests", val: stats.rejected, color: "bg-red-50 border-red-200 text-red-700" },
              { label: "Upcoming Bookings", val: stats.upcoming, color: "bg-indigo-50 border-indigo-200 text-indigo-700" },
              { label: "Today's Bookings", val: stats.todayBookings, color: "bg-orange-50 border-orange-200 text-orange-700" },
              { label: "Completed Bookings", val: stats.completed, color: "bg-slate-50 border-slate-200 text-slate-700" }
            ].map(card => (
              <Card key={card.label} className={`${card.color} border hover:shadow-md transition duration-200 rounded-xl`}>
                <CardContent className="p-3 text-center flex flex-col justify-center h-full">
                  <div className="text-[10px] sm:text-xs font-semibold leading-tight">{card.label}</div>
                  <div className="text-lg sm:text-xl font-extrabold mt-1">{card.val}</div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
            {/* Requests List Table */}
            <div className="lg:col-span-2">
              <Card className="rounded-2xl border bg-white shadow-sm">
                <CardHeader className="p-4 sm:p-6 pb-2">
                  <CardTitle className="text-lg font-bold text-slate-800">My Requests History</CardTitle>
                  <CardDescription className="text-xs sm:text-sm">Track status and actions for your requests.</CardDescription>
                </CardHeader>
                <CardContent className="p-4 sm:p-6 pt-0">
                  {myRequests.length > 0 ? (
                    <div className="overflow-x-auto -mx-4 sm:mx-0">
                      <table className="w-full text-xs text-left border-collapse min-w-[500px] sm:min-w-0">
                        <thead>
                          <tr className="border-b bg-slate-50 text-slate-500 uppercase font-bold text-[10px] tracking-wider">
                            <th className="p-3">Request ID</th>
                            <th className="p-3">Room / Schedule</th>
                            <th className="p-3 hidden sm:table-cell">Date</th>
                            <th className="p-3 hidden sm:table-cell">Time</th>
                            <th className="p-3 text-center">Status</th>
                            <th className="p-3 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {myRequests.map((req) => (
                            <tr 
                              key={req._id} 
                              className={`border-b hover:bg-secondary/5 cursor-pointer transition ${selectedRequestDetails?._id === req._id ? 'bg-secondary/10' : ''}`}
                              onClick={() => setSelectedRequestDetails(req)}
                            >
                              <td className="p-3 font-semibold text-primary">{req.requestId}</td>
                              <td className="p-3">
                                <div className="font-bold text-slate-800 text-xs sm:text-sm">{req.facilityRequired}</div>
                                <div className="sm:hidden text-muted-foreground text-[10px] font-medium mt-1 leading-snug">
                                  {req.schedule.requestedDate} • {req.schedule.startTime} - {req.schedule.endTime}
                                </div>
                              </td>
                              <td className="p-3 hidden sm:table-cell font-medium text-slate-600">{req.schedule.requestedDate}</td>
                              <td className="p-3 hidden sm:table-cell font-medium text-slate-600">{req.schedule.startTime} - {req.schedule.endTime}</td>
                              <td className="p-3 text-center">
                                <span className={`px-2.5 py-0.5 rounded-full text-3xs font-extrabold uppercase ${
                                  req.status === 'Approved' ? 'bg-green-100 text-green-700' :
                                  req.status === 'Rejected' ? 'bg-red-100 text-red-700' :
                                  req.status === 'Conditional Approval' ? 'bg-amber-100 text-amber-700' :
                                  req.status === 'Draft' ? 'bg-slate-100 text-slate-700' :
                                  'bg-blue-100 text-blue-700'
                                }`}>
                                  {req.status}
                                </span>
                              </td>
                              <td className="p-3 text-right" onClick={(e) => e.stopPropagation()}>
                                <div className="flex justify-end gap-1.5">
                                  {['Approved', 'Conditional Approval'].includes(req.status) && (
                                    <>
                                      <Button variant="outline" size="icon" onClick={() => downloadPdf(req._id)} className="h-10 w-10 sm:h-8 sm:w-8 p-0 flex items-center justify-center min-h-[40px] sm:min-h-0">
                                        <Download className="w-4 h-4 text-slate-600" />
                                      </Button>
                                      <Button variant="outline" size="icon" onClick={() => printForm(req)} className="h-10 w-10 sm:h-8 sm:w-8 p-0 flex items-center justify-center min-h-[40px] sm:min-h-0">
                                        <Printer className="w-4 h-4 text-slate-600" />
                                      </Button>
                                    </>
                                  )}
                                  {['Submitted', 'Faculty Verified', 'Coordinator Review'].includes(req.status) && (
                                    <Button variant="destructive" onClick={() => cancelRequest(req._id)} className="h-10 px-3.5 text-xs sm:h-8 sm:px-2.5 sm:text-2xs flex items-center justify-center font-bold text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 rounded-lg border border-red-200 min-h-[40px] sm:min-h-0">
                                      Cancel
                                    </Button>
                                  )}
                                  {req.status === 'Draft' && (
                                    <>
                                      <Button variant="outline" onClick={() => editDraft(req)} className="h-10 px-3.5 text-xs sm:h-8 sm:px-2.5 sm:text-2xs flex items-center justify-center font-bold text-slate-600 hover:bg-slate-100 rounded-lg border min-h-[40px] sm:min-h-0">
                                        Edit
                                      </Button>
                                      <Button variant="default" onClick={() => submitDraft(req)} className="h-10 px-3.5 text-xs sm:h-8 sm:px-2.5 sm:text-2xs flex items-center justify-center font-bold bg-primary hover:bg-primary/90 text-white rounded-lg border border-primary/20 min-h-[40px] sm:min-h-0">
                                        Send
                                      </Button>
                                    </>
                                  )}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground p-8 text-center bg-muted/10 border border-dashed rounded-2xl">No requests submitted yet.</p>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Request Detail Panel (Timeline, History, QR details) */}
            <div>
              {selectedRequestDetails ? (
                <Card className="sticky top-20 border-primary/20 rounded-2xl shadow-sm bg-white overflow-hidden">
                  <CardHeader className="border-b pb-4 bg-primary/5 p-4 sm:p-6">
                    <CardTitle className="text-md font-bold flex justify-between items-center text-slate-800">
                      <span>Request Details</span>
                      <span className="text-xs font-mono font-bold text-primary">{selectedRequestDetails.requestId}</span>
                    </CardTitle>
                    <CardDescription className="text-xs">{selectedRequestDetails.facilityRequired} Booking</CardDescription>
                  </CardHeader>
                  <CardContent className="p-4 sm:p-6 space-y-5 text-xs">
                    
                    {/* Status Tracker Timeline */}
                    <div>
                      <div className="font-bold text-slate-800 mb-3 text-xs uppercase tracking-wider">Status Timeline</div>
                      <div className="relative border-l border-primary/20 pl-4 space-y-4 ml-2">
                        {[
                          { key: 'Submitted', label: 'Submitted & Created' },
                          { key: 'Faculty Verified', label: 'Faculty Verified' },
                          { key: 'Coordinator Review', label: 'Coordinator Review' },
                          { key: 'Coordinator Approved', label: 'Coordinator Approved' },
                          { key: 'IDEA Hub Head Review', label: 'Head Review' },
                          { key: 'Final Decision', label: 'Final Decision' }
                        ].map((node, index) => {
                          let isDone = false;
                          const currentStatus = selectedRequestDetails.status;
                          
                          if (node.key === 'Submitted' && ['Submitted', 'Faculty Verified', 'Coordinator Review', 'Coordinator Approved', 'IDEA Hub Head Review', 'Approved', 'Conditional Approval', 'Completed'].includes(currentStatus)) isDone = true;
                          if (node.key === 'Faculty Verified' && selectedRequestDetails.facultyRecommendation?.verified) isDone = true;
                          if (node.key === 'Coordinator Review' && ['Coordinator Review', 'Coordinator Approved', 'IDEA Hub Head Review', 'Approved', 'Conditional Approval', 'Completed'].includes(currentStatus)) isDone = true;
                          if (node.key === 'Coordinator Approved' && ['Coordinator Approved', 'IDEA Hub Head Review', 'Approved', 'Conditional Approval', 'Completed'].includes(currentStatus)) isDone = true;
                          if (node.key === 'IDEA Hub Head Review' && ['IDEA Hub Head Review', 'Approved', 'Conditional Approval', 'Completed'].includes(currentStatus)) isDone = true;
                          if (node.key === 'Final Decision' && ['Approved', 'Conditional Approval', 'Rejected', 'Completed'].includes(currentStatus)) isDone = true;

                          let extraInfo = '';
                          if (isDone) {
                            if (node.key === 'Faculty Verified' && selectedRequestDetails.facultyRecommendation?.facultyName) {
                              extraInfo = `by Prof. ${selectedRequestDetails.facultyRecommendation.facultyName}`;
                            } else if (node.key === 'Coordinator Approved') {
                              const coordNode = selectedRequestDetails.approvalHistory?.find((h: any) => h.role === 'Coordinator' && (h.action === 'Coordinator Approved' || h.action === 'Approved'));
                              if (coordNode?.byName) {
                                extraInfo = `by ${coordNode.byName}`;
                              }
                            } else if (node.key === 'Final Decision' && ['Approved', 'Conditional Approval', 'Completed'].includes(currentStatus)) {
                              const headNode = selectedRequestDetails.approvalHistory?.find((h: any) => h.role === 'Head' && (h.action === 'Approved' || h.action === 'Conditional Approval'));
                              if (headNode?.byName) {
                                extraInfo = `by ${headNode.byName}`;
                              }
                            }
                          }

                          return (
                            <div key={index} className="relative">
                              <span className={`absolute -left-6 top-0 w-3.5 h-3.5 rounded-full border flex items-center justify-center ${isDone ? 'bg-primary border-primary text-white' : 'bg-background border-slate-300'}`}>
                                {isDone && <Check className="w-2 h-2" />}
                              </span>
                              <div className={`${isDone ? 'text-slate-800 font-bold' : 'text-slate-400 font-medium'}`}>
                                {node.label}
                                {extraInfo && <span className="text-[10px] text-muted-foreground font-normal block mt-0.5">{extraInfo}</span>}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div className="border-t pt-3 grid grid-cols-2 gap-y-2 text-xs">
                      <span className="text-muted-foreground font-semibold">Purpose:</span>
                      <span className="font-medium text-right text-slate-800">{selectedRequestDetails.purpose}</span>
                      
                      <span className="text-muted-foreground font-semibold">Category:</span>
                      <span className="font-medium text-right text-slate-800">{selectedRequestDetails.category}</span>
                      
                      <span className="text-muted-foreground font-semibold">Participants:</span>
                      <span className="font-medium text-right text-slate-800">{selectedRequestDetails.teamDetails?.participantsCount} Persons</span>

                      <span className="text-muted-foreground font-semibold">Status:</span>
                      <span className="font-bold text-right text-primary">{selectedRequestDetails.status}</span>
                    </div>

                    {/* Remarks history audit trail */}
                    {selectedRequestDetails.approvalHistory?.length > 0 && (
                      <div className="border-t pt-3">
                        <div className="font-semibold text-slate-800 mb-2">Audit History Remarks</div>
                        <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                          {selectedRequestDetails.approvalHistory.map((hist: any, hIdx: number) => (
                            <div key={hIdx} className="bg-secondary/20 p-2.5 rounded-xl text-2xs border">
                              <div className="flex justify-between font-semibold text-muted-foreground">
                                <span>{hist.role} {hist.byName ? `(${hist.byName})` : ''}</span>
                                <span>{new Date(hist.date).toLocaleDateString()}</span>
                              </div>
                              <div className="mt-1 font-medium">Action: <span className="font-bold text-slate-700">{hist.action}</span></div>
                              {hist.remarks && <div className="mt-1 text-slate-500 italic">"{hist.remarks.replace(/⚡\s*/g, '')}"</div>}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* PDF Actions */}
                    {['Approved', 'Conditional Approval'].includes(selectedRequestDetails.status) && (
                      <div className="flex flex-col sm:flex-row gap-2.5 border-t pt-4">
                        <Button className="w-full sm:flex-1 h-11 sm:h-9 text-sm font-semibold min-h-[44px]" size="sm" onClick={() => downloadPdf(selectedRequestDetails._id)}>
                          <Download className="w-4 h-4 mr-2" /> Download PDF
                        </Button>
                        <Button className="w-full sm:flex-1 h-11 sm:h-9 text-sm font-semibold min-h-[44px]" variant="outline" size="sm" onClick={() => printForm(selectedRequestDetails)}>
                          <Printer className="w-4 h-4 mr-2" /> Print Form
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ) : (
                <div className="h-full border border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center p-8 text-center text-muted-foreground text-xs bg-slate-50/50 min-h-[200px]">
                  <Info className="w-6 h-6 mb-2 block text-slate-400" /> Select a request from the history table to view real-time timeline, remarks, audit trail, and print commands.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      
      {/* Room Details Modal */}
      <Dialog open={!!viewDetailsRoom} onOpenChange={(open) => !open && setViewDetailsRoom(null)}>
        <DialogContent className="w-[calc(100%-32px)] max-w-md md:max-w-lg rounded-2xl bg-white border border-slate-200 p-4 sm:p-6 overflow-y-auto max-h-[90vh]">
          {viewDetailsRoom && (
            <>
              <DialogHeader>
                <DialogTitle className="text-xl font-bold text-slate-900">{viewDetailsRoom.name}</DialogTitle>
                <DialogDescription className="text-slate-500">
                  Full details and equipment checklist.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <img src={viewDetailsRoom.image} alt={viewDetailsRoom.name} className="w-full h-48 sm:h-56 object-cover rounded-xl border border-slate-100" />
                
                <div>
                  <h4 className="text-sm font-bold text-slate-800 mb-1">Description</h4>
                  <p className="text-xs text-slate-600 leading-relaxed">{viewDetailsRoom.description}</p>
                </div>

                <div className="flex justify-between items-center bg-slate-50 p-3 rounded-lg border border-slate-100">
                  <span className="text-xs font-semibold text-slate-600">Capacity Limit:</span>
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-1">👥 {viewDetailsRoom.capacity} People</span>
                </div>

                <div>
                  <h4 className="text-sm font-bold text-slate-800 mb-2">Available Equipment Checklist ({viewDetailsRoom.equipment.length})</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                    {viewDetailsRoom.equipment.map((eq) => (
                      <div key={eq} className="flex items-center gap-2 bg-blue-50/50 text-blue-700 rounded-lg p-2 border border-blue-100/40">
                        <span className="text-sm">{getEquipmentEmoji(eq)}</span>
                        <span className="text-xs font-medium truncate">{eq}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-4 border-t border-slate-100">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setViewDetailsRoom(null)}
                    className="w-full sm:w-auto h-11 sm:h-9 text-sm font-semibold min-h-[44px] border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 rounded-lg"
                  >
                    Close
                  </Button>
                  <Button 
                    type="button" 
                    onClick={() => {
                      setSelectedRoom(viewDetailsRoom);
                      setViewDetailsRoom(null);
                    }}
                    className="w-full sm:w-auto h-11 sm:h-9 text-sm font-semibold min-h-[44px] bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"
                  >
                    Book Room
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
      </div>
    </div>
  );
};

export default SpecialRoomPermission;
