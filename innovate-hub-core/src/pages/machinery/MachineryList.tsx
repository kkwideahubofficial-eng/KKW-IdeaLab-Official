import { useState, useEffect } from "react";
import api from "@/lib/axios";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Calendar as CalendarIcon, Clock, CheckCircle, XCircle, AlertTriangle, 
  FileText, Search, ArrowRight, PlusCircle, History, BookOpen, Layers,
  Printer, Share2, Download, Eye, Play, Check, Users, ShieldAlert, Award, Settings,
  Database, RefreshCw
} from "lucide-react";
import { getNextAvailableDate, formatTime12Hour } from "@/lib/dateUtils";

interface TeamMember {
  name: string;
  prn: string;
  branch: string;
  year: string;
  division: string;
  mobile: string;
  email: string;
}

interface Machine {
  _id: string;
  name: string;
  description: string;
  imageUrl?: string;
  capacity: number;
  studentCapacity?: number;
  timeSlots: { day: string; startTime: string; endTime: string }[];
  isAvailable: boolean;
}

const is24x7Slots = (slots: { day: string; startTime: string; endTime: string }[]) => {
  if (!slots || slots.length !== 7) return false;
  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
  return days.every(d => 
    slots.some(s => s.day === d && s.startTime === "00:00" && (s.endTime === "23:59" || s.endTime === "24:00"))
  );
};

interface Material {
  _id: string;
  name: string;
  category: string;
  description: string;
  currentStock: number;
  allocatedQuantity: number;
  remainingQuantity: number;
  lowStockThreshold: number;
  unit: string;
  imageUrl?: string;
}

interface ResourceRequest {
  _id: string;
  requestId: string;
  projectName: string;
  projectCategory: string;
  projectDescription: string;
  status: string;
  applicationDate: string;
  students: TeamMember[];
  requestedMachines: {
    machineId: any;
    machineName: string;
    usageDate: string;
    startTime: string;
    endTime: string;
    usageHours: number;
  }[];
  requestedMaterials: {
    materialId: any;
    materialName: string;
    quantityRequired: number;
  }[];
  approvalHistory: {
    date: string;
    role: string;
    action: string;
    remarks: string;
    byName: string;
  }[];
  materialAllocations: {
    materialId: any;
    quantityRequested: number;
    quantityIssued: number;
    returnedQuantity: number;
    balanceQuantity: number;
  }[];
  returns: {
    resourceType: string;
    resourceName: string;
    returnedQuantity: number;
    returnDate: string;
    condition: string;
    remarks: string;
  }[];
  actualEntryTime?: string;
  actualExitTime?: string;
  teamName?: string;
  projectObjectives?: string;
  expectedOutcome?: string;
  completedAt?: string;
  completedBy?: string;
  isWorkCompleted?: boolean;
  completionRemarks?: string;
  actualUsageHours?: number;
  machineReleased?: boolean;
  extensionEndTime?: string;
  extensionReason?: string;
  extensionStatus?: string;
  applicantType?: string;
  externalFullName?: string;
  externalDesignation?: string;
  externalDept?: string;
  externalCollegeOrg?: string;
  externalCity?: string;
  externalState?: string;
  externalEmail?: string;
  externalMobile?: string;
  externalIdentityProof?: string;
  identityVerification?: string;
  externalApplicantType?: string;
  externalTeamMembers?: { name: string; email: string; mobile: string }[];
  totalCharges?: number;
  paymentStatus?: string;
  machineCharges?: number;
  materialCharges?: number;
  headConditions?: string;
  numberOfStudents?: number;
  externalWebsite?: string;
}

// Helpers for 12-hour time dropdowns
const parseTime24To12 = (time24: string) => {
  if (!time24) return { hour12: '12', minute: '00', period: 'AM' };
  const [hStr, mStr] = time24.split(':');
  const h = parseInt(hStr, 10);
  const period = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 || 12;
  return {
    hour12: String(h12).padStart(2, '0'),
    minute: mStr || '00',
    period
  };
};

const formatTime12To24 = (hour12: string, minute: string, period: string) => {
  let h = parseInt(hour12, 10);
  if (period === 'PM' && h !== 12) h += 12;
  if (period === 'AM' && h === 12) h = 0;
  const hStr = String(h).padStart(2, '0');
  const mStr = minute.padStart(2, '0');
  return `${hStr}:${mStr}`;
};

const TimeSelectGroup = ({ 
  value, 
  onChange 
}: { 
  value: string; 
  onChange: (val: string) => void; 
}) => {
  const { hour12, minute, period } = parseTime24To12(value);

  const handleValChange = (field: 'hour12' | 'minute' | 'period', newVal: string) => {
    let h = hour12;
    let m = minute;
    let p = period;
    if (field === 'hour12') h = newVal;
    if (field === 'minute') m = newVal;
    if (field === 'period') p = newVal;
    onChange(formatTime12To24(h, m, p));
  };

  return (
    <div className="flex items-center gap-1 mt-1">
      <select
        value={hour12}
        onChange={(e) => handleValChange('hour12', e.target.value)}
        className="h-9 flex-1 rounded-md border border-input bg-background px-2 py-1 text-xs shadow-xs focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring cursor-pointer"
      >
        {Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0')).map(h => (
          <option key={h} value={h}>{h}</option>
        ))}
      </select>
      <span className="text-muted-foreground">:</span>
      <select
        value={minute}
        onChange={(e) => handleValChange('minute', e.target.value)}
        className="h-9 flex-1 rounded-md border border-input bg-background px-2 py-1 text-xs shadow-xs focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring cursor-pointer"
      >
        {Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0')).map(m => (
          <option key={m} value={m}>{m}</option>
        ))}
      </select>
      <select
        value={period}
        onChange={(e) => handleValChange('period', e.target.value)}
        className="h-9 w-[60px] rounded-md border border-input bg-background px-2 py-1 text-xs shadow-xs focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring cursor-pointer font-bold"
      >
        <option value="AM">AM</option>
        <option value="PM">PM</option>
      </select>
    </div>
  );
};

const MachineryList = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const extendId = searchParams.get("extend");
  const completeId = searchParams.get("complete");

  const [activeTab, setActiveTab] = useState("machines");
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    const rawUser = localStorage.getItem("idea_hub_user");
    if (rawUser) {
      try {
        setCurrentUser(JSON.parse(rawUser));
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  const handleNewRequestClick = () => {
    const type = currentUser?.userType === "EXTERNAL" ? "External" : "Internal";
    navigate(`/machinery/request/new?type=${type}`);
  };
  const [machines, setMachines] = useState<Machine[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [requests, setRequests] = useState<ResourceRequest[]>([]);
  const [loading, setLoading] = useState(true);

  // Machine completion states
  const [completionRequest, setCompletionRequest] = useState<ResourceRequest | null>(null);
  const [showCompletionDialog, setShowCompletionDialog] = useState(false);
  const [confirmCheckbox, setConfirmCheckbox] = useState(false);
  const [completing, setCompleting] = useState(false);

  const handleCompleteWork = async () => {
    if (!completionRequest) return;
    if (!confirmCheckbox) {
      toast.error("Please confirm that machine usage is complete.");
      return;
    }

    setCompleting(true);
    try {
      await api.post(`/machinery/requests/${completionRequest._id}/complete-work`);
      toast.success("Work completion recorded successfully!");
      setShowCompletionDialog(false);
      setConfirmCheckbox(false);
      setCompletionRequest(null);
      fetchInitialData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to complete work.");
    } finally {
      setCompleting(false);
    }
  };

  // Machine extension states
  const [extensionRequest, setExtensionRequest] = useState<ResourceRequest | null>(null);
  const [showExtensionDialog, setShowExtensionDialog] = useState(false);
  const [extensionEndTime, setExtensionEndTime] = useState("14:00");
  const [extensionReason, setExtensionReason] = useState("");
  const [extending, setExtending] = useState(false);

  const handleRequestExtension = async () => {
    if (!extensionRequest) return;
    if (!extensionEndTime || !extensionReason) {
      toast.error("Please enter end time and extension reason.");
      return;
    }

    setExtending(true);
    try {
      await api.post(`/machinery/requests/${extensionRequest._id}/request-extension`, {
        extensionEndTime,
        reason: extensionReason
      });
      toast.success("Extension request submitted successfully!");
      setShowExtensionDialog(false);
      setExtensionRequest(null);
      setExtensionReason("");
      fetchInitialData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to submit extension request.");
    } finally {
      setExtending(false);
    }
  };

  // Search & Filter state for History Tab
  const [searchTerm, setSearchTerm] = useState("");
  const [searchField, setSearchField] = useState("projectName"); // projectName, requestId, teamName
  const [statusFilter, setStatusFilter] = useState("all");
  const [resourceTypeFilter, setResourceTypeFilter] = useState("all"); // all, machine, material
  const [dateFilter, setDateFilter] = useState("");
  const [applicantTypeFilter, setApplicantTypeFilter] = useState("all");

  // Detailed Modal state
  const [selectedRequest, setSelectedRequest] = useState<ResourceRequest | null>(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await fetchInitialData(true);
      toast.success("Dashboard data refreshed!");
    } catch {
      toast.error("Failed to refresh data");
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        fetchInitialData(true).catch(err => console.error("Auto refresh failed", err));
      }
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (extendId && requests.length > 0) {
      const target = requests.find(r => r._id === extendId);
      if (target && ['Machine Scheduled', 'Active Booking'].includes(target.status)) {
        setExtensionRequest(target);
        setExtensionEndTime(target.requestedMachines?.[0]?.endTime || "14:00");
        setShowExtensionDialog(true);
        searchParams.delete("extend");
        setSearchParams(searchParams);
      }
    }
  }, [extendId, requests]);

  useEffect(() => {
    if (completeId && requests.length > 0) {
      const target = requests.find(r => r._id === completeId);
      if (target && ['Machine Scheduled', 'Active Booking'].includes(target.status)) {
        setCompletionRequest(target);
        setShowCompletionDialog(true);
        searchParams.delete("complete");
        setSearchParams(searchParams);
      }
    }
  }, [completeId, requests]);

  const fetchInitialData = async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    try {
      const [mRes, matRes, rRes] = await Promise.all([
        api.get("/machinery"),
        api.get("/materials"),
        api.get("/machinery/requests")
      ]);
      setMachines(mRes.data);
      setMaterials(matRes.data);
      setRequests(rRes.data);
    } catch (error) {
      if (!isSilent) toast.error("Failed to load dashboard data");
    } finally {
      if (!isSilent) setLoading(false);
    }
  };

  const downloadPdf = async (id: string, reqId: string) => {
    setDownloadingId(id);
    try {
      const response = await api.get(`/machinery/requests/${id}/pdf`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `PermissionLetter_${reqId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success('Permission Letter Downloaded!');
    } catch {
      toast.error('Failed to download PDF.');
    } finally {
      setDownloadingId(null);
    }
  };

  const printPdf = async (id: string) => {
    try {
      const response = await api.get(`/machinery/requests/${id}/pdf`, { responseType: 'blob' });
      const file = new Blob([response.data], { type: 'application/pdf' });
      const fileURL = URL.createObjectURL(file);
      const iframe = document.createElement('iframe');
      iframe.style.display = 'none';
      iframe.src = fileURL;
      document.body.appendChild(iframe);
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
      toast.success('Print Dialog Opened.');
    } catch {
      toast.error('Failed to print PDF form.');
    }
  };

  const shareRequest = (req: ResourceRequest) => {
    const shareUrl = `${window.location.origin}/verify-request/${req.requestId}`;
    if (navigator.share) {
      navigator.share({
        title: `AICTE IDEA Lab Permission: ${req.requestId}`,
        text: `Verify permission status for project ${req.projectName}`,
        url: shareUrl,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(shareUrl);
      toast.success("Verification Link copied to clipboard!");
    }
  };

  // Stats calculation
  const stats = {
    total: requests.length,
    pending: requests.filter(r => ['Submitted', 'Coordinator Review', 'Head Review', 'Student Resubmitted'].includes(r.status)).length,
    approved: requests.filter(r => ['Approved', 'Approved With Conditions', 'Material Allocated', 'Machine Scheduled', 'Active Booking'].includes(r.status)).length,
    rejected: requests.filter(r => ['Rejected', 'Coordinator Rejected'].includes(r.status)).length,
    issued: requests.filter(r => r.status === 'Material Allocated' || r.materialAllocations?.some(a => a.quantityIssued > 0)).length,
    bookings: requests.filter(r => ['Machine Scheduled', 'Active Booking'].includes(r.status) || r.requestedMachines?.length > 0).length,
    completed: requests.filter(r => ['Completed', 'Work Completed', 'Closed'].includes(r.status)).length,
  };

  // Filters application
  const filteredRequests = requests.filter(r => {
    // Search
    let matchesSearch = true;
    if (searchTerm) {
      if (searchField === "projectName") {
        matchesSearch = r.projectName.toLowerCase().includes(searchTerm.toLowerCase());
      } else if (searchField === "requestId") {
        matchesSearch = r.requestId.toLowerCase().includes(searchTerm.toLowerCase());
      } else if (searchField === "teamName") {
        matchesSearch = (r.teamName || "").toLowerCase().includes(searchTerm.toLowerCase());
      }
    }

    // Status Filter
    let matchesStatus = true;
    if (statusFilter !== "all") {
      if (statusFilter === "pending") {
        matchesStatus = ['Submitted', 'Coordinator Review', 'Head Review', 'Student Resubmitted'].includes(r.status);
      } else if (statusFilter === "approved") {
        matchesStatus = ['Approved', 'Approved With Conditions', 'Material Allocated', 'Machine Scheduled', 'Active Booking'].includes(r.status);
      } else if (statusFilter === "rejected") {
        matchesStatus = ['Rejected', 'Coordinator Rejected'].includes(r.status);
      } else {
        matchesStatus = r.status === statusFilter;
      }
    }

    // Resource Type Filter
    let matchesResourceType = true;
    if (resourceTypeFilter === "machine") {
      matchesResourceType = r.requestedMachines && r.requestedMachines.length > 0;
    } else if (resourceTypeFilter === "material") {
      matchesResourceType = r.requestedMaterials && r.requestedMaterials.length > 0;
    }

    // Date Filter
    let matchesDate = true;
    if (dateFilter) {
      const appDate = new Date(r.applicationDate).toDateString();
      const targetDate = new Date(dateFilter).toDateString();
      matchesDate = appDate === targetDate;
    }

    // Applicant Type Filter
    let matchesApplicantType = true;
    if (applicantTypeFilter !== "all") {
      matchesApplicantType = r.applicantType === applicantTypeFilter;
    }

    return matchesSearch && matchesStatus && matchesResourceType && matchesDate && matchesApplicantType;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Approved':
      case 'Machine Scheduled':
      case 'Material Allocated':
      case 'Active Booking':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'Approved With Conditions':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Pending':
      case 'Submitted':
      case 'Coordinator Review':
      case 'Head Review':
      case 'Student Resubmitted':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Changes Requested':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'Completed':
      case 'Closed':
        return 'bg-slate-100 text-slate-800 border-slate-200';
      case 'Work Completed':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'Rejected':
      case 'Coordinator Rejected':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const renderTimeline = (status: string) => {
    const steps = [
      { name: "Submitted", active: ['Submitted', 'Coordinator Review', 'Changes Requested', 'Student Resubmitted', 'Coordinator Approved', 'Head Review', 'Approved', 'Approved With Conditions', 'Material Allocated', 'Machine Scheduled', 'Active Booking', 'Work Completed', 'Closed', 'Completed'].includes(status) },
      { name: "Coord Review", active: ['Coordinator Review', 'Student Resubmitted', 'Coordinator Approved', 'Head Review', 'Approved', 'Approved With Conditions', 'Material Allocated', 'Machine Scheduled', 'Active Booking', 'Work Completed', 'Closed', 'Completed'].includes(status) },
      { name: "Coord Approved", active: ['Coordinator Approved', 'Head Review', 'Approved', 'Approved With Conditions', 'Material Allocated', 'Machine Scheduled', 'Active Booking', 'Work Completed', 'Closed', 'Completed'].includes(status) },
      { name: "Head Review", active: ['Head Review', 'Approved', 'Approved With Conditions', 'Material Allocated', 'Machine Scheduled', 'Active Booking', 'Work Completed', 'Closed', 'Completed'].includes(status) },
      { name: "Approved", active: ['Approved', 'Approved With Conditions', 'Material Allocated', 'Machine Scheduled', 'Active Booking', 'Work Completed', 'Closed', 'Completed'].includes(status) },
      { name: "Allocated", active: ['Material Allocated', 'Machine Scheduled', 'Active Booking', 'Work Completed', 'Closed', 'Completed'].includes(status) },
      { name: "Completed", active: ['Completed', 'Work Completed', 'Closed'].includes(status) }
    ];

    if (status === 'Rejected' || status === 'Coordinator Rejected') {
      return (
        <div className="flex items-center gap-2 p-3 bg-red-50 text-red-800 border border-red-100 rounded-md text-xs font-semibold">
          <ShieldAlert className="w-4 h-4 text-red-600" />
          <span>Application Rejected. Please review remarks and resubmit.</span>
        </div>
      );
    }

    if (status === 'Changes Requested') {
      return (
        <div className="flex items-center gap-2 p-3 bg-amber-50 text-amber-800 border border-amber-100 rounded-md text-xs font-semibold">
          <ShieldAlert className="w-4 h-4 text-amber-600" />
          <span>Changes Requested by Coordinator. Edit details from your request history and resubmit.</span>
        </div>
      );
    }

    const getExtraName = (stepName: string) => {
      if (!selectedRequest?.approvalHistory) return '';
      if (stepName === "Coord Approved") {
        const isApproved = ['Coordinator Approved', 'Head Review', 'Approved', 'Approved With Conditions', 'Material Allocated', 'Machine Scheduled', 'Active Booking', 'Work Completed', 'Closed', 'Completed'].includes(status);
        if (isApproved) {
          const coordNode = selectedRequest.approvalHistory.find((h: any) => h.role?.toUpperCase() === 'COORDINATOR' && (h.action?.includes('Approve') || h.action?.includes('Allocated') || h.action?.includes('Scheduled') || h.action?.includes('Issued')));
          return coordNode?.byName || '';
        }
      }
      if (stepName === "Approved") {
        const isApproved = ['Approved', 'Approved With Conditions', 'Material Allocated', 'Machine Scheduled', 'Active Booking', 'Work Completed', 'Closed', 'Completed'].includes(status);
        if (isApproved) {
          const headNode = selectedRequest.approvalHistory.find((h: any) => h.role?.toUpperCase() === 'HEAD' && h.action?.includes('Approved'));
          return headNode?.byName || '';
        }
      }
      return '';
    };

    return (
      <div className="w-full pt-4 pb-8 overflow-x-auto">
        <div className="flex justify-between items-center min-w-[650px] px-4">
          {steps.map((step, idx) => {
            const extraName = getExtraName(step.name);
            return (
              <div key={idx} className="flex items-center flex-1 last:flex-none">
                <div className="flex flex-col items-center relative">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center border-2 text-[10px] font-bold transition-all ${step.active ? 'bg-primary text-primary-foreground border-primary' : 'bg-background text-muted-foreground border-border'}`}>
                    {idx + 1}
                  </div>
                  <div className="absolute top-6 flex flex-col items-center w-24 text-center">
                    <span className="text-[10px] font-semibold text-foreground leading-tight">{step.name}</span>
                    {extraName && <span className="text-[8px] text-muted-foreground font-normal leading-tight mt-0.5">{extraName}</span>}
                  </div>
                </div>
                {idx < steps.length - 1 && (
                  <div className={`h-[2px] flex-1 mx-2 transition-all ${steps[idx + 1].active ? 'bg-primary' : 'bg-border'}`} />
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
          <p className="text-muted-foreground font-medium text-sm">Loading Permission Portal...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header and Quick Stats */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-foreground tracking-tight flex items-center gap-2">
            <BookOpen className="text-primary w-8 h-8" />
            Material & Machinery Portal
          </h1>
          <p className="text-muted-foreground text-sm mt-1">KK Wagh AICTE IDEA Lab Permission Management System</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto items-center">
          <Button
            variant="outline"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="w-full sm:w-auto gap-2 shadow-xs bg-white text-slate-700 border-border hover:bg-slate-50"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button 
            onClick={handleNewRequestClick}
            className="w-full gap-2 shadow-md hover:scale-[1.02] transition-transform bg-primary text-primary-foreground border-none font-bold"
          >
            <PlusCircle className="w-4 h-4" /> + New Permission Request
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4 mb-8">
        {[
          { label: "My Requests", value: stats.total, color: "text-primary", icon: FileText },
          { label: "Pending Reviews", value: stats.pending, color: "text-blue-600", icon: Clock },
          { label: "Approved Perms", value: stats.approved, color: "text-green-600", icon: CheckCircle },
          { label: "Rejected Requests", value: stats.rejected, color: "text-red-600", icon: XCircle },
          { label: "Issued Materials", value: stats.issued, color: "text-indigo-600", icon: Layers },
          { label: "Machine Bookings", value: stats.bookings, color: "text-purple-600", icon: CalendarIcon }
        ].map((card, idx) => (
          <Card key={idx} className="shadow-2xs border-border/60 hover:shadow-sm transition-shadow">
            <CardContent className="p-3 sm:p-4 flex items-center justify-between">
              <div>
                <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">{card.label}</p>
                <p className={`text-xl font-bold mt-1 ${card.color}`}>{card.value}</p>
              </div>
              <div className="w-8 h-8 rounded-full bg-secondary/15 flex items-center justify-center shrink-0">
                <card.icon className={`w-4 h-4 ${card.color}`} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="machines" value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList 
          className="bg-muted/50 p-1 rounded-lg border w-full flex overflow-x-auto whitespace-nowrap justify-start md:inline-flex md:justify-center [&::-webkit-scrollbar]:hidden h-auto md:h-10"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          <TabsTrigger value="machines" className="rounded-md gap-1.5 shrink-0"><Settings className="w-4 h-4" /> Available Machinery</TabsTrigger>
          <TabsTrigger value="dashboard" className="rounded-md gap-1.5 shrink-0"><History className="w-4 h-4" /> Student Dashboard</TabsTrigger>
          <TabsTrigger value="history" className="rounded-md gap-1.5 shrink-0"><History className="w-4 h-4" /> Request History & PDF</TabsTrigger>
        </TabsList>

        {/* Tab 1: Dashboard Overview */}
        <TabsContent value="dashboard" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Quick Actions Card */}
            <Card className="lg:col-span-1 shadow-sm border-border/75">
              <CardHeader><CardTitle className="text-base font-bold">Quick Actions</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <Button 
                  variant="outline" 
                  onClick={handleNewRequestClick}
                  className="w-full justify-start gap-3 text-sm py-5 font-semibold text-primary border-primary/20 hover:bg-primary/5"
                >
                  <PlusCircle className="w-4 h-4 text-primary" /> Apply for Permission Request
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setActiveTab("machines")} 
                  className="w-full justify-start gap-3 text-sm py-5 font-semibold"
                >
                  <Settings className="w-4 h-4 text-slate-500" /> Book Machine Slots
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setActiveTab("history")} 
                  className="w-full justify-start gap-3 text-sm py-5 font-semibold"
                >
                  <Download className="w-4 h-4 text-slate-500" /> Download Approved PDF Letters
                </Button>
              </CardContent>
            </Card>

            {/* Recent Requests list */}
            <Card className="lg:col-span-2 shadow-sm border-border/75">
              <CardHeader className="flex flex-row justify-between items-center pb-3">
                <div>
                  <CardTitle className="text-base font-bold">Recent Resource Applications</CardTitle>
                  <CardDescription className="text-xs">Your latest submissions and approvals</CardDescription>
                </div>
                <Button variant="link" size="sm" onClick={() => setActiveTab("history")} className="text-primary font-semibold">
                  View All <ArrowRight className="w-3.5 h-3.5 ml-1" />
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                {requests.slice(0, 4).length === 0 ? (
                  <p className="text-muted-foreground text-center py-6 text-sm">No requests filed yet.</p>
                ) : (
                  requests.slice(0, 4).map((req) => (
                    <div key={req._id} className="p-3 border rounded-lg bg-card hover:bg-secondary/5 flex flex-col md:flex-row justify-between gap-3 items-start md:items-center transition-all text-xs">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-primary flex items-center gap-1.5">
                            {req.requestId}
                            <Badge className={`text-[8px] font-bold px-1.5 py-0 rounded-sm ${
                              req.applicantType === 'External'
                                ? 'bg-orange-100 text-orange-800 border-orange-200 hover:bg-orange-100'
                                : 'bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-100'
                            }`}>
                              {req.applicantType === 'External' ? 'EXTERNAL' : 'INTERNAL'}
                            </Badge>
                          </span>
                          <span className="text-muted-foreground">•</span>
                          <span className="font-semibold text-foreground">{req.projectName}</span>
                        </div>
                        <div className="text-muted-foreground mt-1 font-medium">
                          {req.requestedMachines?.length > 0 && `Machines: ${req.requestedMachines.map(m => m.machineName).join(', ')}`}
                          {req.requestedMachines?.length > 0 && req.requestedMaterials?.length > 0 && ` | `}
                          {req.requestedMaterials?.length > 0 && `Materials: ${req.requestedMaterials.map(m => m.materialName).join(', ')}`}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 self-end md:self-auto">
                        {['Machine Scheduled', 'Active Booking'].includes(req.status) && (
                          <div className="flex gap-1.5 items-center">
                            <Button 
                              className="bg-green-600 hover:bg-green-700 text-white font-bold h-8 text-[10px] gap-1 px-2.5 py-1"
                              onClick={() => { setCompletionRequest(req); setShowCompletionDialog(true); }}
                            >
                              <Check className="w-3.5 h-3.5" /> Work Completed
                            </Button>
                            {req.extensionStatus === 'Pending' ? (
                              <Badge variant="outline" className="bg-amber-100 text-amber-800 border-amber-200 uppercase font-bold text-[9px] px-2 py-1.5 h-8 flex items-center">
                                Ext Pending
                              </Badge>
                            ) : (
                              <Button 
                                className="bg-amber-600 hover:bg-amber-700 text-white font-bold h-8 text-[10px] px-2.5 py-1"
                                onClick={() => { setExtensionRequest(req); setExtensionEndTime(req.requestedMachines?.[0]?.endTime || "14:00"); setShowExtensionDialog(true); }}
                              >
                                Extend
                              </Button>
                            )}
                          </div>
                        )}
                        {req.status === 'Work Completed' && (
                          <div className="flex flex-col items-end gap-0.5">
                            <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 uppercase font-bold text-[9px] px-2 py-0.5 rounded">
                              ✓ Work Completed
                            </Badge>
                            {req.completedAt && (
                              <span className="text-[9px] text-muted-foreground font-semibold">
                                Completed: {new Date(req.completedAt).toLocaleString()}
                              </span>
                            )}
                          </div>
                        )}
                        {req.status !== 'Work Completed' && !['Machine Scheduled', 'Active Booking'].includes(req.status) && (
                          <Badge variant="outline" className={`font-bold uppercase tracking-wider text-[10px] ${getStatusColor(req.status)}`}>
                            {req.status}
                          </Badge>
                        )}
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => { setSelectedRequest(req); setShowDetailDialog(true); }}
                          title="View Details"
                        >
                          <Eye className="w-4 h-4 text-slate-500 hover:text-primary" />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

          </div>
        </TabsContent>

        {/* Tab 2: Available Machinery */}
        <TabsContent value="machines" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {machines.map((machine) => (
              <Card key={machine._id} className={`flex flex-col hover:shadow-md transition-shadow border-border/75 ${!machine.isAvailable ? 'opacity-75 border-dashed' : ''}`}>
                <div className="relative h-44 w-full bg-muted">
                  {machine.imageUrl ? (
                    <img src={machine.imageUrl} alt={machine.name} className="w-full h-full object-cover rounded-t-lg" />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-muted-foreground text-xs font-semibold">No Image</div>
                  )}
                  <span className={`absolute top-2 right-2 text-white text-[10px] font-bold px-2 py-0.5 rounded-full ${machine.isAvailable ? 'bg-green-500' : 'bg-red-500'}`}>
                    {machine.isAvailable ? "Available" : "Unavailable"}
                  </span>
                </div>
                
                <CardHeader className="pb-2">
                  <CardTitle className="text-base font-bold">{machine.name}</CardTitle>
                  <CardDescription className="text-xs line-clamp-2">{machine.description}</CardDescription>
                </CardHeader>
                
                <CardContent className="pt-2 flex-grow flex flex-col gap-4 text-xs">
                  <div className="bg-secondary/10 p-3 rounded border space-y-2">
                    <div className="grid grid-cols-2 gap-1 text-xs text-foreground mb-1">
                      <p><b>Capacity:</b> {machine.capacity || 0} Units</p>
                      <p><b>Student Limit:</b> {machine.studentCapacity || 1} / slot</p>
                    </div>
                    <p className="font-semibold text-foreground mb-0.5">Weekly Standard Hours:</p>
                    {is24x7Slots(machine.timeSlots) ? (
                      <span className="inline-block text-[11px] bg-green-50 border border-green-200 text-green-700 font-bold px-2 py-0.5 rounded-md">
                        24/7 Available
                      </span>
                    ) : (
                      <ul className="text-muted-foreground space-y-0.5 list-disc pl-3 text-3xs font-medium">
                        {machine.timeSlots.slice(0, 3).map((slot, i) => (
                          <li key={i}>{slot.day}: {formatTime12Hour(slot.startTime)} - {formatTime12Hour(slot.endTime)}</li>
                        ))}
                        {machine.timeSlots.length > 3 && <li>+{machine.timeSlots.length - 3} more days</li>}
                      </ul>
                    )}
                  </div>

                  <Link to={`/machinery/request/new?machineId=${machine._id}&type=${currentUser?.userType === "EXTERNAL" ? "External" : "Internal"}`} className="mt-auto block">
                    <Button className="w-full text-xs font-semibold" variant={machine.isAvailable ? "default" : "outline"} disabled={!machine.isAvailable}>
                      {machine.isAvailable ? "Request Booking / Check Slots" : "Slot Booking Disabled"}
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>


        {/* Tab 5: Request History */}
        <TabsContent value="history" className="space-y-6">
          {/* Advanced Search & Filters Card */}
          <Card className="shadow-sm border-border/60 bg-muted/10">
            <CardContent className="p-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-6 gap-3 text-xs">
              
              {/* Search Bar */}
              <div className="space-y-1 md:col-span-2">
                <Label>Search Request</Label>
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-2.5 top-3 text-muted-foreground" />
                  <Input 
                    placeholder="Search query..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8 h-8 text-xs bg-background"
                  />
                </div>
              </div>

              {/* Search Field selector */}
              <div className="space-y-1">
                <Label>Search By</Label>
                <select 
                  className="w-full h-8 rounded-md border border-input bg-background px-2 py-1 text-xs focus:ring-1 focus:ring-primary"
                  value={searchField}
                  onChange={(e) => setSearchField(e.target.value)}
                >
                  <option value="projectName">Project Name</option>
                  <option value="requestId">Request ID</option>
                  <option value="teamName">Team Name</option>
                </select>
              </div>

              {/* Status Filter */}
              <div className="space-y-1">
                <Label>Status</Label>
                <select 
                  className="w-full h-8 rounded-md border border-input bg-background px-2 py-1 text-xs focus:ring-1 focus:ring-primary"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="all">All Statuses</option>
                  <option value="pending">Pending Review</option>
                  <option value="approved">Approved</option>
                  <option value="Changes Requested">Changes Requested</option>
                  <option value="Completed">Completed</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>

              {/* Resource Type Filter */}
              <div className="space-y-1">
                <Label>Resource Type</Label>
                <select 
                  className="w-full h-8 rounded-md border border-input bg-background px-2 py-1 text-xs focus:ring-1 focus:ring-primary"
                  value={resourceTypeFilter}
                  onChange={(e) => setResourceTypeFilter(e.target.value)}
                >
                  <option value="all">All Resources</option>
                  <option value="machine">Machines only</option>
                  <option value="material">Materials only</option>
                </select>
              </div>

              {/* Applicant Type Filter */}
              <div className="space-y-1">
                <Label>Applicant Type</Label>
                <select 
                  className="w-full h-8 rounded-md border border-input bg-background px-2 py-1 text-xs focus:ring-1 focus:ring-primary"
                  value={applicantTypeFilter}
                  onChange={(e) => setApplicantTypeFilter(e.target.value)}
                >
                  <option value="all">All Applicants</option>
                  <option value="Internal">Internal Student</option>
                  <option value="External">External User</option>
                </select>
              </div>

            </CardContent>
          </Card>

          {/* History Requests Table */}
          <div className="border rounded-xl overflow-hidden shadow-xs bg-card">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead className="bg-slate-50 text-slate-700 font-bold uppercase tracking-wider text-[10px] border-b">
                  <tr>
                    <th className="px-4 py-3">Request ID</th>
                    <th className="px-4 py-3">Project Name</th>
                    <th className="px-4 py-3">Resources Requested</th>
                    <th className="px-4 py-3">Date Submitted</th>
                    <th className="px-4 py-3">Workflow Status</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y text-slate-700">
                  {filteredRequests.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground font-medium">
                        No requests found matching the current search filters.
                      </td>
                    </tr>
                  ) : (
                    filteredRequests.map((req) => {
                      const isApproved = ['Approved', 'Approved With Conditions', 'Material Allocated', 'Machine Scheduled', 'Completed'].includes(req.status);
                      
                      return (
                        <tr key={req._id} className="hover:bg-slate-50/40">
                          <td className="px-4 py-3 font-mono font-bold text-primary flex items-center gap-1.5">
                            {req.requestId}
                            <Badge className={`text-[8px] font-bold px-1.5 py-0 rounded-sm ${
                              req.applicantType === 'External'
                                ? 'bg-orange-100 text-orange-800 border-orange-200 hover:bg-orange-100'
                                : 'bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-100'
                            }`}>
                              {req.applicantType === 'External' ? 'EXTERNAL' : 'INTERNAL'}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 font-semibold text-foreground">{req.projectName}</td>
                          <td className="px-4 py-3 text-muted-foreground font-medium max-w-xs truncate">
                            {req.requestedMachines?.map(m => m.machineName).concat(req.requestedMaterials?.map(m => m.materialName)).filter(Boolean).join(', ')}
                          </td>
                          <td className="px-4 py-3 font-medium">
                            {new Date(req.applicationDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </td>
                          <td className="px-4 py-3">
                            {req.status === 'Work Completed' && req.completedAt ? (
                              <div className="flex flex-col gap-0.5">
                                <Badge variant="outline" className={`font-bold text-[9px] px-2 py-0.5 rounded uppercase ${getStatusColor(req.status)}`}>
                                  {req.status}
                                </Badge>
                                <span className="text-[9px] text-muted-foreground font-semibold">
                                  {new Date(req.completedAt).toLocaleString()}
                                </span>
                              </div>
                            ) : (
                              <Badge variant="outline" className={`font-bold text-[9px] px-2 py-0.5 rounded uppercase ${getStatusColor(req.status)}`}>
                                {req.status}
                              </Badge>
                            )}
                          </td>
                          <td className="px-4 py-3 text-right flex items-center justify-end gap-1.5">
                            {/* Work Completed Action inside Table */}
                            {['Machine Scheduled', 'Active Booking'].includes(req.status) && (
                              <div className="flex gap-1.5 items-center">
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  onClick={() => { setCompletionRequest(req); setShowCompletionDialog(true); }}
                                  className="h-8 text-[10px] font-bold border-green-500 text-green-700 hover:bg-green-50 px-2.5"
                                >
                                  ✓ Work Completed
                                </Button>
                                {req.extensionStatus === 'Pending' ? (
                                  <Badge variant="outline" className="bg-amber-100 text-amber-800 border-amber-200 uppercase font-bold text-[9px] px-2 py-1 h-8 flex items-center">
                                    Ext Pending
                                  </Badge>
                                ) : (
                                  <Button 
                                    variant="outline" 
                                    size="sm" 
                                    onClick={() => { setExtensionRequest(req); setExtensionEndTime(req.requestedMachines?.[0]?.endTime || "14:00"); setShowExtensionDialog(true); }}
                                    className="h-8 text-[10px] font-bold border-amber-500 text-amber-700 hover:bg-amber-50 px-2.5"
                                  >
                                    Extend
                                  </Button>
                                )}
                              </div>
                            )}

                            {/* View details */}
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              onClick={() => { setSelectedRequest(req); setShowDetailDialog(true); }}
                              title="View Details"
                              className="h-8 w-8 text-slate-500 hover:text-primary"
                            >
                              <Eye className="w-4 h-4" />
                            </Button>

                            {/* Edit request if draft or changes requested */}
                            {['Draft', 'Changes Requested'].includes(req.status) && (
                              <Link to={`/machinery/request/edit/${req._id}`}>
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  title="Edit Application"
                                  className="h-8 w-8 text-amber-600 hover:text-amber-700"
                                >
                                  <PlusCircle className="w-4 h-4" />
                                </Button>
                              </Link>
                            )}

                            {/* Download PDF Permission Letter */}
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              disabled={!isApproved || downloadingId === req._id}
                              onClick={() => downloadPdf(req._id, req.requestId)}
                              title={isApproved ? "Download PDF Permission Letter" : "Unapproved"}
                              className="h-8 w-8 text-slate-500 hover:text-primary disabled:opacity-35"
                            >
                              {downloadingId === req._id ? (
                                <div className="animate-spin rounded-full h-3.5 w-3.5 border-b-2 border-primary"></div>
                              ) : (
                                <Download className="w-4 h-4" />
                              )}
                            </Button>

                            {/* Print Action */}
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              disabled={!isApproved}
                              onClick={() => printPdf(req._id)}
                              title={isApproved ? "Print Permission Letter" : "Unapproved"}
                              className="h-8 w-8 text-slate-500 hover:text-primary disabled:opacity-35"
                            >
                              <Printer className="w-4 h-4" />
                            </Button>

                            {/* Share Action */}
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              onClick={() => shareRequest(req)}
                              title="Share Verification Link"
                              className="h-8 w-8 text-slate-500 hover:text-primary"
                            >
                              <Share2 className="w-4 h-4" />
                            </Button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Detailed Request Modal Drawer */}
      {selectedRequest && showDetailDialog && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <Card className="w-full max-w-3xl max-h-[90vh] overflow-y-auto bg-card shadow-2xl border border-border/80">
            <CardHeader className="border-b bg-slate-50/50 pb-4">
              <div className="flex justify-between items-start gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-sm text-primary">{selectedRequest.requestId}</span>
                    <span className="text-muted-foreground">•</span>
                    <Badge variant="outline" className={`font-bold text-[9px] uppercase ${getStatusColor(selectedRequest.status)}`}>
                      {selectedRequest.status}
                    </Badge>
                  </div>
                  <CardTitle className="text-base font-extrabold mt-1">{selectedRequest.projectName}</CardTitle>
                  <CardDescription className="text-3xs mt-0.5">Submitted on: {new Date(selectedRequest.applicationDate).toLocaleString()}</CardDescription>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setShowDetailDialog(false)} className="text-muted-foreground hover:text-foreground font-bold text-sm">
                  ✕
                </Button>
              </div>
            </CardHeader>
            
            <CardContent className="p-6 space-y-6 text-xs text-slate-700">
              {/* Timeline Status Tracker */}
              <div>
                <h4 className="font-bold text-primary mb-2 flex items-center gap-1.5 uppercase tracking-wider text-[10px]">
                  Application Progress Tracker
                </h4>
                <div className="p-3 border rounded-lg bg-slate-50">
                  {renderTimeline(selectedRequest.status)}
                </div>
              </div>

              {/* Applicant Details */}
              {selectedRequest.applicantType === 'External' ? (
                <div className="bg-orange-50/50 border border-orange-200 p-4 rounded-lg space-y-3">
                  <h4 className="font-bold text-orange-850 flex items-center gap-1.5 uppercase tracking-wider text-[10px]">
                    <Users className="w-3.5 h-3.5 text-orange-600" /> External Applicant Profile
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-slate-700">
                    <div className="space-y-1">
                      <p><strong>Full Name:</strong> {selectedRequest.externalFullName}</p>
                      <p><strong>Institution:</strong> {selectedRequest.externalCollegeOrg}</p>
                      <p><strong>Department:</strong> {selectedRequest.externalDept || 'N/A'}</p>
                      <p><strong>Designation:</strong> {selectedRequest.externalDesignation || 'N/A'}</p>
                      {selectedRequest.externalWebsite && (
                        <p>
                          <strong>Website:</strong> <a href={selectedRequest.externalWebsite} target="_blank" rel="noreferrer" className="text-primary hover:underline">{selectedRequest.externalWebsite}</a>
                        </p>
                      )}
                    </div>
                    <div className="space-y-1">
                      <p><strong>Location:</strong> {selectedRequest.externalCity}, {selectedRequest.externalState}</p>
                      <p><strong>Email:</strong> {selectedRequest.externalEmail}</p>
                      <p><strong>Mobile:</strong> {selectedRequest.externalMobile}</p>
                      <p>
                        <strong>Identity Proof:</strong>{" "}
                        {selectedRequest.externalIdentityProof ? (
                          <a href={selectedRequest.externalIdentityProof} target="_blank" rel="noreferrer" className="text-primary hover:underline font-bold">View Uploaded ID</a>
                        ) : (
                          <span className="text-muted-foreground italic">Not Provided</span>
                        )}
                      </p>
                    </div>
                  </div>
                  
                  <div className="border-t border-orange-200/60 pt-3 flex flex-wrap gap-x-6 gap-y-2 text-slate-700">
                    <div><strong>Identity Verification:</strong> <Badge variant="outline" className={`font-bold capitalize ml-1 ${
                      selectedRequest.identityVerification === 'Verified' ? 'bg-green-100 text-green-800 border-green-200' :
                      selectedRequest.identityVerification === 'Rejected' ? 'bg-red-100 text-red-800 border-red-200' :
                      'bg-blue-100 text-blue-800 border-blue-200'
                    }`}>{selectedRequest.identityVerification || 'Pending'}</Badge></div>
                    <p><strong>Usage Charges:</strong> ₹{selectedRequest.totalCharges || 0} ({selectedRequest.paymentStatus || 'Pending'})</p>
                  </div>
                  
                  {selectedRequest.externalApplicantType === 'Team' && selectedRequest.externalTeamMembers && selectedRequest.externalTeamMembers.length > 0 && (
                    <div className="border-t border-orange-200/60 pt-3 space-y-2">
                      <p className="font-bold text-orange-850 text-[9px] uppercase tracking-wider">Team Members List</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-3xs">
                        {selectedRequest.externalTeamMembers.map((m, idx) => (
                          <div key={idx} className="bg-white border border-orange-100 rounded-md p-2">
                            <p className="font-bold text-slate-800">{m.name}</p>
                            <p className="text-muted-foreground mt-0.5">Email: {m.email} | Mobile: {m.mobile}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-secondary/15 p-4 rounded-lg space-y-3 border">
                  <h4 className="font-bold text-foreground flex items-center gap-1.5 uppercase tracking-wider text-[10px]"><Users className="w-3.5 h-3.5 text-primary" /> Student Team Information</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-0.5">
                      <div className="font-bold text-sm text-foreground">{selectedRequest.students?.[0]?.name || "N/A"}</div>
                      <div className="text-muted-foreground">
                        PRN: {selectedRequest.students?.[0]?.prn || "N/A"} | Branch: {selectedRequest.students?.[0]?.branch || "N/A"}
                      </div>
                      <div className="text-muted-foreground">
                        Year: {selectedRequest.students?.[0]?.year || "N/A"} | Division: {selectedRequest.students?.[0]?.division || "N/A"}
                      </div>
                    </div>
                    <div className="space-y-0.5">
                      <p><strong>Email:</strong> {selectedRequest.students?.[0]?.email || "N/A"}</p>
                      <p><strong>Mobile:</strong> {selectedRequest.students?.[0]?.mobile || "N/A"}</p>
                      {selectedRequest.teamName && <p><strong>Team:</strong> {selectedRequest.teamName} ({selectedRequest.numberOfStudents} members)</p>}
                    </div>
                  </div>
                  {selectedRequest.students?.length > 1 && (
                    <div className="border-t border-border/40 pt-3 space-y-2">
                      <p className="font-semibold text-foreground text-[9px] uppercase tracking-wider">Additional Team Members</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-3xs font-medium">
                        {selectedRequest.students.slice(1).map((s, idx) => (
                          <div key={idx} className="p-2 border rounded bg-card space-y-0.5">
                            <p className="font-bold">{s.name}</p>
                            <p className="text-muted-foreground">PRN: {s.prn} | Branch: {s.branch}</p>
                            <p className="text-muted-foreground">Email: {s.email || "N/A"} | Mobile: {s.mobile || "N/A"}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Resource Split details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-bold text-primary mb-2 uppercase tracking-wider text-[10px]">Requested Machinery</h4>
                  <div className="border rounded-md p-3 bg-secondary/5 space-y-2">
                    {selectedRequest.requestedMachines?.length === 0 ? (
                      <p className="text-muted-foreground text-3xs italic">No machine bookings requested.</p>
                    ) : (
                      selectedRequest.requestedMachines.map((m, i) => (
                        <div key={i} className="border-b pb-2 last:border-0 last:pb-0">
                          <p className="font-bold text-foreground">• {m.machineName}</p>
                          <p className="text-3xs text-muted-foreground mt-0.5">
                            <b>Date:</b> {m.usageDate ? new Date(m.usageDate).toLocaleDateString() : 'N/A'} | <b>Slot:</b> {m.startTime} - {m.endTime} ({m.usageHours} hrs)
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div>
                  <h4 className="font-bold text-primary mb-2 uppercase tracking-wider text-[10px]">Requested Material Allocation</h4>
                  <div className="border rounded-md p-3 bg-secondary/5 space-y-2">
                    {selectedRequest.requestedMaterials?.length === 0 ? (
                      <p className="text-muted-foreground text-3xs italic">No raw materials requested.</p>
                    ) : (
                      selectedRequest.requestedMaterials.map((m, i) => (
                        <div key={i} className="flex justify-between items-center py-1 border-b last:border-0">
                          <span className="font-semibold">• {m.materialName}</span>
                          <span className="bg-slate-200 text-slate-800 font-bold px-2 py-0.5 rounded font-mono text-[10px]">Qty: {m.quantityRequired}</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              {/* Material Allocation Details */}
              {selectedRequest.materialAllocations?.length > 0 && (
                <div>
                  <h4 className="font-bold text-primary mb-2 uppercase tracking-wider text-[10px]">Material Issue & Return tracking</h4>
                  <div className="border rounded-lg overflow-hidden border-border/80">
                    <table className="w-full text-center border-collapse text-3xs">
                      <thead className="bg-slate-50 font-bold uppercase tracking-wider text-slate-700 border-b">
                        <tr>
                          <th className="px-3 py-2 text-left">Material</th>
                          <th className="px-3 py-2">Requested</th>
                          <th className="px-3 py-2 text-indigo-700">Issued</th>
                          <th className="px-3 py-2 text-green-700">Returned</th>
                          <th className="px-3 py-2 text-red-600">Balance</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y font-semibold">
                        {selectedRequest.materialAllocations.map((a: any, idx) => (
                          <tr key={idx} className="hover:bg-slate-50/20">
                            <td className="px-3 py-2 text-left text-foreground font-bold">{a.materialId?.name || "Material"}</td>
                            <td className="px-3 py-2">{a.quantityRequested}</td>
                            <td className="px-3 py-2 text-indigo-700">{a.quantityIssued}</td>
                            <td className="px-3 py-2 text-green-700">{a.returnedQuantity}</td>
                            <td className="px-3 py-2 text-red-600">{a.balanceQuantity}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Returns records */}
              {selectedRequest.returns?.length > 0 && (
                <div>
                  <h4 className="font-bold text-primary mb-2 uppercase tracking-wider text-[10px]">Resource Returns History Log</h4>
                  <div className="space-y-2">
                    {selectedRequest.returns.map((ret: any, idx: number) => (
                      <div key={idx} className="p-2.5 border border-border/40 rounded bg-slate-50/50 space-y-1">
                        <div className="flex justify-between items-center text-3xs font-bold text-slate-700">
                          <span>Return Action: {ret.resourceName} ({ret.resourceType})</span>
                          <span className="text-muted-foreground">{new Date(ret.returnDate).toLocaleString()}</span>
                        </div>
                        <p className="text-3xs text-muted-foreground">
                          <b>Quantity Returned:</b> {ret.returnedQuantity} | <b>Condition:</b> {ret.condition}
                        </p>
                        {ret.remarks && <p className="text-3xs text-slate-500 italic mt-0.5">"Remarks: {ret.remarks}"</p>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Project description details */}
              <div>
                <h4 className="font-bold text-primary mb-2 uppercase tracking-wider text-[10px]">Project Description & expected outcomes</h4>
                <div className="border rounded-md p-3 bg-secondary/5 space-y-2 font-medium">
                  <p><strong>Objectives:</strong> {selectedRequest.projectObjectives}</p>
                  <p><strong>Outcome:</strong> {selectedRequest.expectedOutcome}</p>
                </div>
              </div>

              {/* Approval History logs */}
              {selectedRequest.approvalHistory?.length > 0 && (
                <div>
                  <h4 className="font-bold text-primary mb-2 uppercase tracking-wider text-[10px]">Approval History & Logs</h4>
                  <div className="space-y-2 border rounded-md p-3 bg-slate-50/50">
                    {selectedRequest.approvalHistory.map((h, i) => (
                      <div key={i} className="flex justify-between items-start border-b border-border/40 pb-2 last:border-0 last:pb-0">
                        <div>
                          <div className="font-semibold text-foreground flex items-center gap-1.5">
                            <Badge variant="secondary" className="text-[8px] uppercase tracking-wide font-bold">{h.role}</Badge>
                            <span>{h.action} {h.byName ? `(${h.byName})` : ''}</span>
                          </div>
                          {h.remarks && <p className="text-3xs text-muted-foreground mt-0.5 font-medium">Remarks: {h.remarks.replace(/⚡\s*/g, '')}</p>}
                        </div>
                        <span className="text-[10px] text-muted-foreground font-mono self-center">
                          {new Date(h.date).toLocaleDateString()}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions Footer inside modal */}
              <div className="flex gap-2 justify-end border-t pt-4 bg-slate-50/30 p-2 rounded-b-lg">
                <Button 
                  variant="outline" 
                  disabled={!['Approved', 'Approved With Conditions', 'Material Allocated', 'Machine Scheduled', 'Completed'].includes(selectedRequest.status)}
                  onClick={() => downloadPdf(selectedRequest._id, selectedRequest.requestId)}
                  className="text-xs font-semibold"
                >
                  <Download className="w-3.5 h-3.5 mr-1.5" /> PDF
                </Button>
                <Button 
                  variant="outline" 
                  disabled={!['Approved', 'Approved With Conditions', 'Material Allocated', 'Machine Scheduled', 'Completed'].includes(selectedRequest.status)}
                  onClick={() => printPdf(selectedRequest._id)}
                  className="text-xs font-semibold"
                >
                  <Printer className="w-3.5 h-3.5 mr-1.5" /> Print
                </Button>
                <Button variant="default" onClick={() => setShowDetailDialog(false)} className="text-xs font-semibold">
                  Close Details
                </Button>
              </div>

            </CardContent>
          </Card>
        </div>
      )}

      {/* Confirmation Dialog for Machine Completion */}
      {showCompletionDialog && completionRequest && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <Card className="w-full max-w-md max-h-[90vh] overflow-y-auto bg-card shadow-2xl border border-border/80">
            <CardHeader className="border-b pb-3 bg-slate-50/50">
              <CardTitle className="text-sm font-extrabold text-foreground">Complete Machine Usage</CardTitle>
            </CardHeader>
            <CardContent className="p-5 space-y-4 text-xs text-slate-700">
              <p className="font-semibold text-slate-600">Are you sure you have finished using this machine?</p>
              
              <div className="bg-secondary/10 p-3 rounded-lg border space-y-2 font-medium">
                <div>
                  <span className="text-[10px] text-muted-foreground uppercase font-bold">Machine:</span>
                  <p className="font-bold text-foreground">{completionRequest.requestedMachines?.[0]?.machineName || "N/A"}</p>
                </div>
                <div>
                  <span className="text-[10px] text-muted-foreground uppercase font-bold">Project:</span>
                  <p className="font-bold text-foreground">{completionRequest.projectName}</p>
                </div>
                <div>
                  <span className="text-[10px] text-muted-foreground uppercase font-bold">Booking Date:</span>
                  <p className="font-bold text-foreground">
                    {completionRequest.requestedMachines?.[0]?.usageDate ? new Date(completionRequest.requestedMachines[0].usageDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : 'N/A'}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-[10px] text-muted-foreground uppercase font-bold">Start Time:</span>
                    <p className="font-bold text-foreground">{completionRequest.requestedMachines?.[0]?.startTime ? formatTime12Hour(completionRequest.requestedMachines[0].startTime) : 'N/A'}</p>
                  </div>
                  <div>
                    <span className="text-[10px] text-muted-foreground uppercase font-bold">End Time:</span>
                    <p className="font-bold text-foreground">{completionRequest.requestedMachines?.[0]?.endTime ? formatTime12Hour(completionRequest.requestedMachines[0].endTime) : 'N/A'}</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-2 pt-2">
                <Checkbox 
                  id="confirm-complete" 
                  checked={confirmCheckbox} 
                  onCheckedChange={(c) => setConfirmCheckbox(!!c)} 
                />
                <Label htmlFor="confirm-complete" className="font-bold text-xs leading-none cursor-pointer text-slate-700">
                  I confirm that machine usage is complete.
                </Label>
              </div>

              <div className="flex gap-2 pt-3 border-t justify-end">
                <Button 
                  variant="outline" 
                  onClick={() => { setShowCompletionDialog(false); setConfirmCheckbox(false); setCompletionRequest(null); }}
                  className="font-bold text-xs h-9 px-4"
                  disabled={completing}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleCompleteWork}
                  className="font-bold text-xs h-9 px-4 bg-green-600 text-white hover:bg-green-700"
                  disabled={completing}
                >
                  {completing ? "Completing..." : "Confirm Completion"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Request Extension Dialog */}
      {showExtensionDialog && extensionRequest && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <Card className="w-full max-w-md max-h-[90vh] overflow-y-auto bg-card shadow-2xl border border-border/80 text-xs">
            <CardHeader className="border-b pb-3 bg-slate-50/50">
              <CardTitle className="text-sm font-extrabold text-foreground">Request Booking Extension</CardTitle>
            </CardHeader>
            <CardContent className="p-5 space-y-4 text-slate-700">
              <div className="bg-secondary/10 p-3 rounded-lg border space-y-2 font-medium">
                <div>
                  <span className="text-[10px] text-muted-foreground uppercase font-bold">Machine:</span>
                  <p className="font-bold text-foreground">{extensionRequest.requestedMachines?.[0]?.machineName || "N/A"}</p>
                </div>
                <div>
                  <span className="text-[10px] text-muted-foreground uppercase font-bold">Project:</span>
                  <p className="font-bold text-foreground">{extensionRequest.projectName}</p>
                </div>
                <div>
                  <span className="text-[10px] text-muted-foreground uppercase font-bold">Current Booking:</span>
                  <p className="font-bold text-foreground">
                    {extensionRequest.requestedMachines?.[0]?.startTime ? formatTime12Hour(extensionRequest.requestedMachines[0].startTime) : 'N/A'} - {extensionRequest.requestedMachines?.[0]?.endTime ? formatTime12Hour(extensionRequest.requestedMachines[0].endTime) : 'N/A'}
                  </p>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="font-bold text-xs">New End Time</Label>
                <TimeSelectGroup 
                  value={extensionEndTime} 
                  onChange={setExtensionEndTime} 
                />
              </div>

              <div className="space-y-1.5">
                <Label className="font-bold text-xs">Reason for Extension</Label>
                <textarea 
                  value={extensionReason}
                  onChange={(e) => setExtensionReason(e.target.value)}
                  className="w-full h-20 rounded-md border border-input bg-background px-3 py-2 text-xs focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring font-medium"
                  placeholder="Explain why you need extra time..."
                  required
                />
              </div>

              <div className="flex gap-2 pt-3 border-t justify-end">
                <Button 
                  variant="outline" 
                  onClick={() => { setShowExtensionDialog(false); setExtensionRequest(null); setExtensionReason(""); }}
                  className="font-bold text-xs h-9 px-4"
                  disabled={extending}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleRequestExtension}
                  className="font-bold text-xs h-9 px-4 bg-primary text-primary-foreground hover:bg-primary/90"
                  disabled={extending}
                >
                  {extending ? "Submitting..." : "Submit Extension"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}


    </div>
  );
};

export default MachineryList;
