import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Link, useSearchParams } from "react-router-dom";
import { 
  Calendar, Check, X, Clock, Users, User, Loader2, Database, ShieldAlert, 
  Settings, FileDown, Eye, RefreshCw, Layers, Printer, Search, Download, SendHorizonal,
  FileText, History, ChevronLeft, ChevronRight, Zap
} from "lucide-react";
import { toast } from "sonner";
import api from "../lib/axios";
import { formatTime12Hour } from "../lib/dateUtils";
import NotificationCenter from "../components/NotificationCenter";
import ManageStats from "./coordinator/ManageStats";
const axios = api;

// Room booking types
interface TeamMember {
  _id: string;
  name: string;
  email: string;
  teamName: string;
}

interface BookingRequest {
  _id: string;
  team: TeamMember;
  slotDate: string;
  startTime: string;
  endTime: string;
  purpose: string;
  status: "pending" | "approved" | "rejected";
  reason?: string;
  createdAt: string;
  updatedAt: string;
}

// Material/Machinery types
interface StudentMember {
  name: string;
  prn: string;
  branch: string;
  year: string;
  mobile: string;
  email: string;
}

interface ResourceRequest {
  _id: string;
  requestId: string;
  projectName: string;
  projectCategory: string;
  projectDescription: string;
  status: string;
  createdAt: string;
  students: StudentMember[];
  requestedMachines: {
    machineId: any;
    machineName: string;
    usageDate: string;
    startTime: string;
    endTime: string;
    usageHours: number;
    purposeOfUsage: string;
    specialRequirements: string;
  }[];
  requestedMaterials: {
    materialId: any;
    materialName: string;
    quantityRequired: number;
    purposeOfUsage: string;
  }[];
  uploadedFiles?: {
    designFileUrl?: string;
    cadFileUrl?: string;
    circuitDiagramUrl?: string;
    supportingDocsUrl?: string;
  };
  materialAllocations: {
    materialId: any;
    quantityRequested: number;
    quantityIssued: number;
    returnedQuantity: number;
    balanceQuantity: number;
  }[];
  teamName?: string;
  actualEntryTime?: string;
  actualExitTime?: string;
  completedAt?: string;
  completedBy?: string;
  isWorkCompleted?: boolean;
  completionRemarks?: string;
  actualUsageHours?: number;
  machineReleased?: boolean;
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
}

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
}

// Generic Reusable Pagination Component
interface TablePaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
  onItemsPerPageChange?: (size: number) => void;
}

const TablePagination: React.FC<TablePaginationProps> = ({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  onPageChange,
  onItemsPerPageChange,
}) => {
  if (totalItems === 0) return null;

  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > 3) pages.push("...");
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);
      for (let i = start; i <= end; i++) {
        if (!pages.includes(i)) pages.push(i);
      }
      if (currentPage < totalPages - 2) pages.push("...");
      if (!pages.includes(totalPages)) pages.push(totalPages);
    }
    return pages;
  };

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 bg-slate-50/50 border-t text-xs text-muted-foreground font-medium rounded-b-xl">
      <div className="flex items-center gap-2 flex-wrap">
        <span>
          Showing <span className="font-bold text-foreground">{startItem}</span> to{" "}
          <span className="font-bold text-foreground">{endItem}</span> of{" "}
          <span className="font-bold text-foreground">{totalItems}</span> entries
        </span>
        {onItemsPerPageChange && (
          <div className="flex items-center gap-1.5 ml-2 sm:ml-4">
            <span className="text-[11px]">Show:</span>
            <Select
              value={String(itemsPerPage)}
              onValueChange={(val) => onItemsPerPageChange(Number(val))}
            >
              <SelectTrigger className="h-7 w-[65px] text-xs bg-white">
                <SelectValue placeholder="10" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="25">25</SelectItem>
                <SelectItem value="50">50</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      <div className="flex items-center space-x-1">
        <Button
          variant="outline"
          size="sm"
          className="h-7 px-2 text-xs font-semibold"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
        >
          <ChevronLeft className="h-3.5 w-3.5 mr-1" />
          Previous
        </Button>

        {getPageNumbers().map((page, idx) => (
          typeof page === "number" ? (
            <Button
              key={idx}
              variant={currentPage === page ? "default" : "outline"}
              size="sm"
              className={`h-7 w-7 p-0 text-xs font-semibold ${
                currentPage === page ? "bg-primary text-primary-foreground font-bold" : ""
              }`}
              onClick={() => onPageChange(page)}
            >
              {page}
            </Button>
          ) : (
            <span key={idx} className="px-1 text-xs select-none">
              {page}
            </span>
          )
        ))}

        <Button
          variant="outline"
          size="sm"
          className="h-7 px-2 text-xs font-semibold"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
        >
          Next
          <ChevronRight className="h-3.5 w-3.5 ml-1" />
        </Button>
      </div>
    </div>
  );
};

// BookingList component for room requests
interface BookingListProps {
  bookings: BookingRequest[];
  showActions?: boolean;
  onApprove?: (id: string) => void;
  onReject?: (id: string) => void;
  processingId?: string | null;
}

const BookingList: React.FC<BookingListProps> = ({ 
  bookings, 
  showActions = false, 
  onApprove = () => {},
  onReject = () => {},
  processingId = null 
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  useEffect(() => {
    setCurrentPage(1);
  }, [bookings.length]);

  if (bookings.length === 0) {
    return (
      <div className="text-center py-8 text-xs">
        <Calendar className="mx-auto h-12 w-12 text-muted-foreground" />
        <h3 className="mt-4 text-sm font-medium">No bookings found</h3>
        <p className="mt-1 text-[11px] text-muted-foreground">There are no bookings in this category.</p>
      </div>
    );
  }

  const totalPages = Math.ceil(bookings.length / itemsPerPage) || 1;
  const paginatedBookings = bookings.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {paginatedBookings.map((request) => {
          const isActionProcessing = processingId === request._id;
          
          return (
            <Card key={request._id} className="flex flex-col h-full border rounded-xl shadow-sm hover:shadow-md transition-shadow text-xs">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start mb-2">
                  <Badge variant={request.status === 'approved' ? 'default' : request.status === 'rejected' ? 'destructive' : 'secondary'} className="uppercase text-[9px] tracking-wide">
                    {request.status}
                  </Badge>
                  <div className="text-[10px] text-muted-foreground font-medium flex items-center">
                    <Clock className="w-3 h-3 mr-1" />
                    {new Date(request.createdAt).toLocaleDateString()}
                  </div>
                </div>
                <CardTitle className="text-sm font-semibold truncate" title={request.team?.teamName || 'No Team'}>
                  {request.team?.teamName || 'No Team'}
                </CardTitle>
                <CardDescription className="text-3xs">
                  <span className="font-medium text-foreground">{request.team?.name || 'Applicant'}</span>
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-grow space-y-4">
                <div className="grid grid-cols-2 gap-2 text-3xs">
                  <div className="bg-muted/50 p-2 rounded">
                    <p className="text-muted-foreground mb-1">Date</p>
                    <p className="font-semibold">{new Date(request.slotDate).toLocaleDateString()}</p>
                  </div>
                  <div className="bg-muted/50 p-2 rounded">
                    <p className="text-muted-foreground mb-1">Time</p>
                    <p className="font-semibold">{request.startTime} - {request.endTime}</p>
                  </div>
                </div>
                <div className="bg-muted/30 p-2.5 rounded border border-border/50">
                  <p className="text-muted-foreground text-3xs font-semibold uppercase tracking-wider mb-1">Purpose</p>
                  <p className="line-clamp-2 italic">"{request.purpose}"</p>
                </div>
              </CardContent>
              {showActions && (
                <div className="p-4 pt-0 mt-auto flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-grow h-8 text-3xs border-destructive text-destructive hover:bg-destructive hover:text-white"
                    onClick={() => onReject(request._id)}
                    disabled={isActionProcessing}
                  >
                    Reject
                  </Button>
                  <Button
                    className="flex-grow h-8 text-3xs bg-primary hover:bg-primary/95 text-white"
                    onClick={() => onApprove(request._id)}
                    disabled={isActionProcessing}
                  >
                    Approve
                  </Button>
                </div>
              )}
            </Card>
          );
        })}
      </div>
      <TablePagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={bookings.length}
        itemsPerPage={itemsPerPage}
        onPageChange={(page) => setCurrentPage(page)}
        onItemsPerPageChange={(size) => { setItemsPerPage(size); setCurrentPage(1); }}
      />
    </div>
  );
};

const CoordinatorDashboard = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Outer Tabs: room_bookings vs materials_machinery
  const [dashboardTab, setDashboardTab] = useState(searchParams.get("tab") || "room_bookings");

  // Sync state with URL
  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab && tab !== dashboardTab) {
      setDashboardTab(tab);
    }
  }, [searchParams]);

  const handleTabChange = (value: string) => {
    setDashboardTab(value);
    setSearchParams({ tab: value }, { replace: true });
  };

  // Room Booking State
  const [pendingBookings, setPendingBookings] = useState<BookingRequest[]>([]);
  const [approvedBookings, setApprovedBookings] = useState<BookingRequest[]>([]);
  const [rejectedBookings, setRejectedBookings] = useState<BookingRequest[]>([]);
  const [stats, setStats] = useState({ totalPending: 0, totalApproved: 0, totalRejected: 0 });
  const [processingId, setProcessingId] = useState<string | null>(null);

  // Materials & Machinery State
  const [resourceRequests, setResourceRequests] = useState<any[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [resourceLoading, setResourceLoading] = useState(false);
  const [applicantTypeFilter, setApplicantTypeFilter] = useState<"All" | "Internal" | "External">("All");

  // Pagination State (Default 10 per page)
  const [machinePage, setMachinePage] = useState(1);
  const [machinePerPage, setMachinePerPage] = useState(10);
  const [pendingPage, setPendingPage] = useState(1);
  const [pendingPerPage, setPendingPerPage] = useState(10);
  const [approvedPage, setApprovedPage] = useState(1);
  const [approvedPerPage, setApprovedPerPage] = useState(10);

  useEffect(() => {
    setPendingPage(1);
    setApprovedPage(1);
  }, [applicantTypeFilter]);

  // Detail Modal & Action remarks
  const [selectedResRequest, setSelectedResRequest] = useState<any | null>(null);
  const [showResReviewDialog, setShowResReviewDialog] = useState(false);
  const [decisionRemarks, setDecisionRemarks] = useState("");

  // External Review fields
  const [extIdVerification, setExtIdVerification] = useState("Pending");
  const [extMachineCharges, setExtMachineCharges] = useState(0);
  const [extMaterialCharges, setExtMaterialCharges] = useState(0);
  const [extPaymentStatus, setExtPaymentStatus] = useState("Pending");
  
  // Coordinator Checklist
  const [checks, setChecks] = useState({
    machineAvailability: false,
    materialAvailability: false,
    projectFeasibility: false,
    studentEligibility: false,
    previousUsageHistory: false
  });

  // Material Allocation Modal
  const [showAllocateDialog, setShowAllocateDialog] = useState(false);
  const [allocateQuantities, setAllocateQuantities] = useState<Record<string, number>>({});

  // Material Return Modal
  const [showReturnDialog, setShowReturnDialog] = useState(false);
  const [returnQuantities, setReturnQuantities] = useState<Record<string, number>>({});
  const [returnCondition, setReturnCondition] = useState<Record<string, string>>({});
  const [returnRemarks, setReturnRemarks] = useState<Record<string, string>>({});

  // Material Stock Editor
  const [editingMaterial, setEditingMaterial] = useState<Material | null>(null);
  const [showStockEditDialog, setShowStockEditDialog] = useState(false);
  const [stockInput, setStockInput] = useState(0);

  // Seeding loader
  const [seeding, setSeeding] = useState(false);

  // Machine completion states
  const [completionRequest, setCompletionRequest] = useState<ResourceRequest | null>(null);
  const [showCompletionDialog, setShowCompletionDialog] = useState(false);
  const [confirmCheckbox, setConfirmCheckbox] = useState(false);
  const [completing, setCompleting] = useState(false);

  // Decision submission loading state
  const [submittingDecision, setSubmittingDecision] = useState(false);
  const [showUrgentConfirmDialog, setShowUrgentConfirmDialog] = useState(false);

  // Report states
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [timeRange, setTimeRange] = useState("Today");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [fileFormat, setFileFormat] = useState("xlsx");

  const handleDownloadReport = (range: string, format: string = 'xlsx', from?: string, to?: string) => {
    const token = localStorage.getItem('idea_hub_token');
    let url = `${api.defaults.baseURL}/machinery/requests/report?rangeType=${encodeURIComponent(range)}&format=${format}`;
    if (token) url += `&token=${token}`;
    if (from) url += `&fromDate=${from}`;
    if (to) url += `&toDate=${to}`;
    window.open(url, '_blank');
  };

  const handleQuickDownload = (range: string) => {
    if (range === 'Custom') {
      setTimeRange('Custom Date Range');
      setReportModalOpen(true);
    } else {
      handleDownloadReport(range, 'xlsx');
    }
  };

  const handleGenerateReportSubmit = () => {
    if (timeRange === 'Custom Date Range' && (!fromDate || !toDate)) {
      toast.error("Please select both start and end dates");
      return;
    }
    handleDownloadReport(timeRange, fileFormat, fromDate, toDate);
    setReportModalOpen(false);
  };

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
      fetchResourcePortalData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to complete work.");
    } finally {
      setCompleting(false);
    }
  };

  const handleExtensionDecision = async (id: string, status: 'Approved' | 'Rejected') => {
    try {
      await api.post(`/machinery/requests/${id}/handle-extension`, { status });
      toast.success(`Booking extension ${status.toLowerCase()} successfully!`);
      fetchResourcePortalData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || `Failed to ${status.toLowerCase()} extension.`);
    }
  };

  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([
        fetchRoomBookings(),
        fetchResourcePortalData()
      ]);
      toast.success("Coordinator dashboard refreshed!");
    } catch {
      toast.error("Failed to refresh dashboard");
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchRoomBookings();
    fetchResourcePortalData();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        Promise.all([
          fetchRoomBookings(),
          fetchResourcePortalData()
        ]).catch(err => console.error("Auto refresh coordinator dashboard failed", err));
      }
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (selectedResRequest) {
      setExtIdVerification(selectedResRequest.identityVerification || "Pending");
      setExtMachineCharges(selectedResRequest.machineCharges || 0);
      setExtMaterialCharges(selectedResRequest.materialCharges || 0);
      setExtPaymentStatus(selectedResRequest.paymentStatus || "Pending");
    }
  }, [selectedResRequest]);

  const fetchRoomBookings = async () => {
    try {
      const allRes = await axios.get('/bookings/all');
      const all = allRes.data;
      setPendingBookings(all.filter((b: any) => b.status === 'pending'));
      setApprovedBookings(all.filter((b: any) => b.status === 'approved'));
      setRejectedBookings(all.filter((b: any) => b.status === 'rejected'));
      setStats({
        totalPending: all.filter((b: any) => b.status === 'pending').length,
        totalApproved: all.filter((b: any) => b.status === 'approved').length,
        totalRejected: all.filter((b: any) => b.status === 'rejected').length,
      });
    } catch {
      console.error("Room bookings failed.");
    }
  };

  const fetchResourcePortalData = async () => {
    setResourceLoading(true);
    try {
      const [rRes, matRes] = await Promise.all([
        api.get("/machinery/requests"),
        api.get("/materials")
      ]);
      setResourceRequests(rRes.data);
      setMaterials(matRes.data);
    } catch {
      toast.error("Failed to load inventory requests");
    } finally {
      setResourceLoading(false);
    }
  };

  const handleApprove = async (id: string) => {
    try {
      setProcessingId(id);
      await axios.patch(`/bookings/${id}/decision`, { decision: 'approved', reason: 'Approved by coordinator' });
      toast.success("Room Booking Approved.");
      fetchRoomBookings();
    } catch {
      toast.error("Approval failed.");
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (id: string) => {
    try {
      setProcessingId(id);
      await axios.patch(`/bookings/${id}/decision`, { decision: 'rejected', reason: 'Rejected by coordinator' });
      toast.error("Room Booking Rejected.");
      fetchRoomBookings();
    } catch {
      toast.error("Rejection failed.");
    } finally {
      setProcessingId(null);
    }
  };

  // Machinery Request Actions (Coordinator level)
  const handleResourceRequestDecision = async (decision: "approve" | "reject" | "request_changes" | "urgent_approve") => {
    if (!selectedResRequest) return;

    // Checklist validations for approval/forwarding/urgent approval
    if (decision === "approve" || decision === "urgent_approve") {
      const allChecked = Object.values(checks).every(v => v === true);
      if (!allChecked) {
        toast.error("Please complete all Coordinator Review Checks before approving.");
        return;
      }

      if (selectedResRequest.applicantType === "External" && extIdVerification !== "Verified") {
        toast.error("Cannot approve request. Identity Verification must be set to 'Verified' for External Users.");
        return;
      }
    }

    let nextStatus = "Coordinator Approved";
    let isUrgentPermission = false;

    if (decision === "reject") nextStatus = "Coordinator Rejected";
    if (decision === "request_changes") nextStatus = "Changes Requested";
    if (decision === "urgent_approve") {
      nextStatus = "Approved";
      isUrgentPermission = true;
    }

    setSubmittingDecision(true);
    try {
      await api.patch(`/machinery/requests/${selectedResRequest._id}/status`, {
        status: nextStatus,
        isUrgentPermission,
        remarks: decisionRemarks,
        checks: checks,
        identityVerification: extIdVerification,
        machineCharges: extMachineCharges,
        materialCharges: extMaterialCharges,
        totalCharges: extMachineCharges + extMaterialCharges,
        paymentStatus: extPaymentStatus
      });

      if (decision === "urgent_approve") {
        toast.success("Urgent Permission Granted! Request approved directly without Head approval.");
      } else {
        toast.success(`Request status updated to ${nextStatus}.`);
      }
      setShowResReviewDialog(false);
      resetReviewState();
      fetchResourcePortalData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to update status.");
    } finally {
      setSubmittingDecision(false);
    }
  };

  const resetReviewState = () => {
    setDecisionRemarks("");
    setChecks({
      machineAvailability: false,
      materialAvailability: false,
      projectFeasibility: false,
      studentEligibility: false,
      previousUsageHistory: false
    });
  };

  // Issue Materials
  const handleIssueMaterialsSubmit = async () => {
    if (!selectedResRequest) return;
    
    const allocationsList = Object.keys(allocateQuantities).map(matId => ({
      materialId: matId,
      quantityIssued: Number(allocateQuantities[matId]) || 0
    }));

    try {
      await api.post(`/machinery/requests/${selectedResRequest._id}/issue`, { allocations: allocationsList });
      toast.success("Materials allocated successfully!");
      setShowAllocateDialog(false);
      fetchResourcePortalData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Issue process failed.");
    }
  };

  // Return Resources
  const handleReturnResourcesSubmit = async () => {
    if (!selectedResRequest) return;

    const returnsList = Object.keys(returnQuantities).map(matId => ({
      resourceType: "Material",
      resourceId: matId,
      resourceName: selectedResRequest.requestedMaterials.find(m => m.materialId?._id === matId || m.materialId === matId)?.materialName || "Material",
      returnedQuantity: Number(returnQuantities[matId]) || 0,
      condition: returnCondition[matId] || 'Good',
      remarks: returnRemarks[matId] || ''
    }));

    try {
      await api.post(`/machinery/requests/${selectedResRequest._id}/return`, { returns: returnsList });
      toast.success("Return registered successfully.");
      setShowReturnDialog(false);
      fetchResourcePortalData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Returns process failed.");
    }
  };

  // Edit stock level
  const handleUpdateStock = async () => {
    if (!editingMaterial) return;
    try {
      await api.put(`/materials/${editingMaterial._id}`, { currentStock: stockInput });
      toast.success("Stock level updated successfully!");
      setShowStockEditDialog(false);
      fetchResourcePortalData();
    } catch {
      toast.error("Failed to update stock.");
    }
  };

  // Pre-seed materials script
  const triggerSeedMaterials = async () => {
    setSeeding(true);
    try {
      await api.post("/materials/seed");
      toast.success("Initial inventory materials seeded.");
      fetchResourcePortalData();
    } catch {
      toast.error("Failed to seed database.");
    } finally {
      setSeeding(false);
    }
  };

  // Check-in check-out triggers
  const handleCheckIn = async (id: string) => {
    try {
      await api.post(`/machinery/requests/${id}/checkin`);
      toast.success("Student check-in recorded.");
      fetchResourcePortalData();
    } catch {
      toast.error("Failed to record check-in.");
    }
  };

  const handleCheckOut = async (id: string) => {
    try {
      await api.post(`/machinery/requests/${id}/checkout`);
      toast.success("Student check-out recorded. Status marked Completed.");
      fetchResourcePortalData();
    } catch {
      toast.error("Failed to record check-out.");
    }
  };

  const resStats = {
    pending: resourceRequests.filter(r => ['Submitted', 'Coordinator Review', 'Student Resubmitted'].includes(r.status)).length,
    approved: resourceRequests.filter(r => ['Approved', 'Approved With Conditions', 'Material Allocated', 'Machine Scheduled', 'Active Booking'].includes(r.status)).length,
    lowStock: materials.filter(m => m.remainingQuantity <= m.lowStockThreshold).length,
    allocated: materials.reduce((acc, m) => acc + m.allocatedQuantity, 0),
    totalInternal: resourceRequests.filter(r => r.applicantType === 'Internal' || !r.applicantType).length,
    totalExternal: resourceRequests.filter(r => r.applicantType === 'External').length,
    approvedExternal: resourceRequests.filter(r => r.applicantType === 'External' && ['Approved', 'Approved With Conditions', 'Material Allocated', 'Machine Scheduled', 'Active Booking', 'Completed'].includes(r.status)).length,
    pendingExternal: resourceRequests.filter(r => r.applicantType === 'External' && ['Submitted', 'Coordinator Review', 'Student Resubmitted'].includes(r.status)).length
  };

  const todayStr = new Date().toDateString();
  const machineStats = {
    activeBookings: resourceRequests.filter(r => r.status === 'Active Booking').length,
    completedToday: resourceRequests.filter(r => r.status === 'Work Completed' && r.completedAt && new Date(r.completedAt).toDateString() === todayStr).length,
    machinesReleased: resourceRequests.filter(r => r.machineReleased === true).length,
    pendingCompletion: resourceRequests.filter(r => ['Machine Scheduled', 'Active Booking'].includes(r.status)).length
  };

  return (
    <Tabs value={dashboardTab} onValueChange={handleTabChange} className="w-full">
      <div className="container mx-auto px-4 py-8 max-w-7xl space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-extrabold text-foreground tracking-tight">Coordinator Dashboard</h1>
            <p className="text-muted-foreground text-sm">Review applications, coordinate reservations, and track inventory allocation.</p>
          </div>
          <div className="flex items-center gap-4 flex-wrap sm:flex-nowrap">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="gap-2 h-9 bg-white shadow-xs border border-slate-200 text-slate-700 hover:bg-slate-50 font-semibold"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`} />
              Refresh
            </Button>
            <TabsList 
              className="bg-muted/30 p-1 rounded-lg border border-border/60 w-full flex overflow-x-auto whitespace-nowrap justify-start lg:inline-flex lg:justify-center [&::-webkit-scrollbar]:hidden h-auto"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              <TabsTrigger value="room_bookings" className="rounded-md text-xs font-semibold">Room Bookings</TabsTrigger>
              <TabsTrigger value="materials_machinery" className="rounded-md text-xs font-semibold">Materials & Machinery</TabsTrigger>
              <TabsTrigger value="home_stats" className="rounded-md text-xs font-semibold">Home Stats Counter</TabsTrigger>
            </TabsList>
            <NotificationCenter />
          </div>
        </div>

      {/* TABS CONTENT: ROOM BOOKINGS */}
      <TabsContent value="room_bookings" className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {[
            { label: "Pending Requests", value: stats.totalPending, icon: Clock, color: "text-blue-600" },
            { label: "Approved Rooms", value: stats.totalApproved, icon: Check, color: "text-green-600" },
            { label: "Rejected Rooms", value: stats.totalRejected, icon: X, color: "text-red-600" }
          ].map((stat, idx) => (
            <Card key={idx}>
              <CardContent className="pt-6 flex justify-between items-center">
                <div>
                  <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">{stat.label}</p>
                  <p className="text-2xl font-bold text-foreground mt-1">{stat.value}</p>
                </div>
                <div className="w-10 h-10 bg-secondary/15 rounded-lg flex items-center justify-center">
                  <stat.icon className={`w-5 h-5 ${stat.color}`} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Tabs defaultValue="pending" className="space-y-6">
          <TabsList 
            className="w-full flex overflow-x-auto whitespace-nowrap justify-start lg:inline-flex lg:justify-center [&::-webkit-scrollbar]:hidden h-auto"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            <TabsTrigger value="pending">Pending</TabsTrigger>
            <TabsTrigger value="approved">Approved</TabsTrigger>
            <TabsTrigger value="rejected">Rejected</TabsTrigger>
          </TabsList>

          <TabsContent value="pending">
            <Card>
              <CardHeader><CardTitle className="text-base font-bold">Pending Booking Requests</CardTitle></CardHeader>
              <CardContent>
                <BookingList bookings={pendingBookings} showActions={true} onApprove={handleApprove} onReject={handleReject} processingId={processingId} />
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="approved">
            <Card><CardHeader><CardTitle className="text-base font-bold">Approved Bookings</CardTitle></CardHeader><CardContent><BookingList bookings={approvedBookings} /></CardContent></Card>
          </TabsContent>
          <TabsContent value="rejected">
            <Card><CardHeader><CardTitle className="text-base font-bold">Rejected Bookings</CardTitle></CardHeader><CardContent><BookingList bookings={rejectedBookings} /></CardContent></Card>
          </TabsContent>
        </Tabs>
      </TabsContent>

      {/* TABS CONTENT: MATERIALS & MACHINERY */}
      <TabsContent value="materials_machinery" className="space-y-6">
        
        {/* Resource Stats Bar */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[
            { label: "Pending Resource Requests", value: resStats.pending, color: "text-blue-600" },
            { label: "Active Resource Permissions", value: resStats.approved, color: "text-green-600" },
            { label: "Allocated Materials Items", value: resStats.allocated, color: "text-indigo-600" },
            { label: "Low Stock Inventory Alerts", value: resStats.lowStock, color: resStats.lowStock > 0 ? "text-amber-600" : "text-slate-600" },
            { label: "Total Internal Requests", value: resStats.totalInternal, color: "text-blue-700" },
            { label: "Total External Requests", value: resStats.totalExternal, color: "text-orange-600" },
            { label: "Approved External Requests", value: resStats.approvedExternal, color: "text-orange-700" },
            { label: "Pending External Requests", value: resStats.pendingExternal, color: "text-amber-600" }
          ].map((item, idx) => (
            <Card key={idx}>
              <CardContent className="pt-6">
                <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">{item.label}</p>
                <p className={`text-2xl font-bold mt-1 ${item.color}`}>{item.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <Tabs defaultValue="resource_pending" className="space-y-6">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 border-b pb-4 mb-6">
            <TabsList 
              className="bg-muted/50 p-1 border rounded-lg w-full flex overflow-x-auto whitespace-nowrap justify-start lg:inline-flex lg:justify-center [&::-webkit-scrollbar]:hidden h-auto"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              <TabsTrigger value="resource_pending" className="text-xs">Pending Reviews ({resStats.pending})</TabsTrigger>
              <TabsTrigger value="resource_approved" className="text-xs">Approved Permissions</TabsTrigger>
              <TabsTrigger value="machine_bookings" className="text-xs">Machine Bookings ({machineStats.pendingCompletion})</TabsTrigger>
            </TabsList>

            <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto justify-end">
              {/* Quick Download Buttons */}
              <div className="flex flex-wrap items-center gap-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200/60 p-1 rounded-lg">
                <span className="text-[10px] font-semibold text-muted-foreground px-1.5">Quick Download:</span>
                {['Today', '7 Days', '30 Days', '3 Months', '1 Year'].map((range) => (
                  <Button
                    key={range}
                    variant="ghost"
                    className="h-6 text-[10px] px-2 hover:bg-white dark:hover:bg-black hover:shadow-2xs text-slate-700 dark:text-slate-300 font-medium"
                    onClick={() => handleQuickDownload(range)}
                  >
                    {range}
                  </Button>
                ))}
                <Button
                  variant="ghost"
                  className="h-6 text-[10px] px-2 hover:bg-white dark:hover:bg-black hover:shadow-2xs text-primary font-bold"
                  onClick={() => handleQuickDownload('Custom')}
                >
                  Custom
                </Button>
              </div>

              <Button 
                onClick={() => setReportModalOpen(true)} 
                className="flex items-center gap-2 shadow-sm bg-indigo-600 hover:bg-indigo-700 text-white text-xs h-8"
              >
                <FileText className="w-3.5 h-3.5" /> Download Reports
              </Button>
            </div>
          </div>

          {/* Pending Reviews Tab */}
          <TabsContent value="resource_pending" className="space-y-4">
            <Card>
              <CardHeader className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <CardTitle className="text-base font-bold">Requests Awaiting Coordinator Review</CardTitle>
                  <CardDescription className="text-xs">Perform checks and forward approved requests to the Head</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Label htmlFor="pending-applicant-filter" className="text-xs font-bold text-muted-foreground whitespace-nowrap">Applicant Type:</Label>
                  <Select 
                    value={applicantTypeFilter} 
                    onValueChange={(val: any) => setApplicantTypeFilter(val)}
                  >
                    <SelectTrigger id="pending-applicant-filter" className="w-[150px] h-8 text-xs bg-white">
                      <SelectValue placeholder="Select Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="All">All Applicants</SelectItem>
                      <SelectItem value="Internal">Internal Student</SelectItem>
                      <SelectItem value="External">External User</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {(() => {
                  const filteredPending = resourceRequests
                    .filter(r => ['Submitted', 'Coordinator Review', 'Student Resubmitted'].includes(r.status))
                    .filter(r => {
                      if (applicantTypeFilter === "All") return true;
                      if (applicantTypeFilter === "Internal") return r.applicantType === "Internal" || !r.applicantType;
                      if (applicantTypeFilter === "External") return r.applicantType === "External";
                      return true;
                    });
                  const pendingTotalPages = Math.ceil(filteredPending.length / pendingPerPage) || 1;
                  const paginatedPending = filteredPending.slice((pendingPage - 1) * pendingPerPage, pendingPage * pendingPerPage);

                  if (filteredPending.length === 0) {
                    return <p className="text-muted-foreground text-center py-6 text-xs font-semibold">No resource requests matching criteria pending review.</p>;
                  }

                  return (
                    <div className="space-y-4">
                      {paginatedPending.map((req) => (
                        <div key={req._id} className="p-4 border rounded-xl bg-card hover:shadow-xs transition-shadow flex flex-col md:flex-row justify-between gap-4 items-start md:items-center text-xs">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold text-primary">{req.requestId}</span>
                              <Badge variant="outline" className="text-[9px] font-bold uppercase">{req.status}</Badge>
                              {req.applicantType === 'External' ? (
                                <Badge className="bg-orange-500 hover:bg-orange-600 text-white text-[9px] font-bold">EXTERNAL</Badge>
                              ) : (
                                <Badge className="bg-blue-600 hover:bg-blue-700 text-white text-[9px] font-bold">INTERNAL</Badge>
                              )}
                            </div>
                            <h4 className="font-bold text-sm text-foreground mt-1">{req.projectName}</h4>
                            <p className="text-3xs text-muted-foreground mt-0.5">
                              Submitted by: {req.applicantType === 'External' ? (
                                `${req.externalFullName || "External User"} (${req.externalCollegeOrg})`
                              ) : (
                                `${req.students?.[0]?.name || "Student"} (${req.students?.[0]?.branch})`
                              )}
                            </p>
                          </div>
                          
                          <div className="flex gap-2 self-end md:self-auto">
                            <Button 
                              size="sm" 
                              variant="outline" 
                              onClick={() => { setSelectedResRequest(req); setShowResReviewDialog(true); }}
                              className="text-xs gap-1 font-semibold"
                            >
                              <Eye className="w-3.5 h-3.5" /> Review request
                            </Button>
                          </div>
                        </div>
                      ))}
                      <TablePagination
                        currentPage={pendingPage}
                        totalPages={pendingTotalPages}
                        totalItems={filteredPending.length}
                        itemsPerPage={pendingPerPage}
                        onPageChange={(page) => setPendingPage(page)}
                        onItemsPerPageChange={(size) => { setPendingPerPage(size); setPendingPage(1); }}
                      />
                    </div>
                  );
                })()}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Approved Permissions & Tracker Tab */}
          <TabsContent value="resource_approved" className="space-y-4">
            <Card>
              <CardHeader className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <CardTitle className="text-base font-bold">Approved Permissions Tracker</CardTitle>
                  <CardDescription className="text-xs">Manage checkout check-ins, allocations, and tool returns</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Label htmlFor="approved-applicant-filter" className="text-xs font-bold text-muted-foreground whitespace-nowrap">Applicant Type:</Label>
                  <Select 
                    value={applicantTypeFilter} 
                    onValueChange={(val: any) => setApplicantTypeFilter(val)}
                  >
                    <SelectTrigger id="approved-applicant-filter" className="w-[150px] h-8 text-xs bg-white">
                      <SelectValue placeholder="Select Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="All">All Applicants</SelectItem>
                      <SelectItem value="Internal">Internal Student</SelectItem>
                      <SelectItem value="External">External User</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent className="overflow-x-auto text-xs font-medium">
                {(() => {
                  const filteredApproved = resourceRequests
                    .filter(r => !['Draft', 'Submitted', 'Coordinator Review', 'Student Resubmitted', 'Coordinator Rejected', 'Rejected'].includes(r.status))
                    .filter(r => {
                      if (applicantTypeFilter === "All") return true;
                      if (applicantTypeFilter === "Internal") return r.applicantType === "Internal" || !r.applicantType;
                      if (applicantTypeFilter === "External") return r.applicantType === "External";
                      return true;
                    });
                  const approvedTotalPages = Math.ceil(filteredApproved.length / approvedPerPage) || 1;
                  const paginatedApproved = filteredApproved.slice((approvedPage - 1) * approvedPerPage, approvedPage * approvedPerPage);

                  return (
                    <div>
                      <table className="w-full text-left border-collapse border rounded-xl">
                        <thead className="bg-slate-50 uppercase text-[9px] tracking-wider text-slate-700 font-bold border-b">
                          <tr>
                            <th className="px-4 py-3">ID</th>
                            <th className="px-4 py-3">Project & Team</th>
                            <th className="px-4 py-3">Usage Time</th>
                            <th className="px-4 py-3">Status</th>
                            <th className="px-4 py-3">Tracking Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y">
                          {filteredApproved.length === 0 ? (
                            <tr>
                              <td colSpan={5} className="text-center py-6 text-muted-foreground font-semibold text-xs">No approved permissions matching filter found.</td>
                            </tr>
                          ) : (
                            paginatedApproved.map((req) => (
                              <tr key={req._id} className="hover:bg-slate-50/30">
                                <td className="px-4 py-3 font-mono font-bold text-primary">
                                  <div>{req.requestId}</div>
                                  <div className="mt-1">
                                    {req.applicantType === 'External' ? (
                                      <Badge className="bg-orange-500 hover:bg-orange-600 text-white text-[8px] font-bold scale-90 origin-left">EXTERNAL</Badge>
                                    ) : (
                                      <Badge className="bg-blue-600 hover:bg-blue-700 text-white text-[8px] font-bold scale-90 origin-left">INTERNAL</Badge>
                                    )}
                                  </div>
                                </td>
                                <td className="px-4 py-3">
                                  <div className="font-bold text-slate-800">{req.projectName}</div>
                                  <div className="text-3xs text-muted-foreground">
                                    {req.applicantType === 'External' ? (
                                      `${req.externalFullName || "External User"} (${req.externalCollegeOrg})`
                                    ) : (
                                      req.teamName || req.students?.[0]?.name
                                    )}
                                  </div>
                                </td>
                                <td className="px-4 py-3 font-mono text-3xs text-muted-foreground">
                                  {req.requestedMachines?.[0]?.startTime} - {req.requestedMachines?.[0]?.endTime}
                                </td>
                                <td className="px-4 py-3">
                                  <Badge className="text-[8px] font-bold uppercase">{req.status}</Badge>
                                </td>
                                <td className="px-4 py-3 flex gap-2">
                                {/* Materials Issue */}
                                {req.status === 'Approved' && req.requestedMaterials && req.requestedMaterials.length > 0 && (
                                  <Button 
                                    size="sm" 
                                    variant="outline"
                                    onClick={() => {
                                      setSelectedResRequest(req);
                                      const initialVals: Record<string, number> = {};
                                      req.requestedMaterials.forEach(m => {
                                        initialVals[m.materialId?._id || m.materialId] = m.quantityRequired;
                                      });
                                      setAllocateQuantities(initialVals);
                                      setShowAllocateDialog(true);
                                    }}
                                    className="text-3xs h-7 font-bold border-primary text-primary hover:bg-primary/5"
                                  >
                                    Allocate Mat
                                  </Button>
                                )}

                                {/* Resource Returns */}
                                {req.status === 'Material Allocated' && (
                                  <Button 
                                    size="sm" 
                                    variant="outline"
                                    onClick={() => {
                                      setSelectedResRequest(req);
                                      const initialVals: Record<string, number> = {};
                                      const conds: Record<string, string> = {};
                                      const rems: Record<string, string> = {};
                                      req.materialAllocations.forEach(m => {
                                        const mId = m.materialId?._id || m.materialId;
                                        initialVals[mId] = m.quantityIssued;
                                        conds[mId] = 'Good';
                                        rems[mId] = '';
                                      });
                                      setReturnQuantities(initialVals);
                                      setReturnCondition(conds);
                                      setReturnRemarks(rems);
                                      setShowReturnDialog(true);
                                    }}
                                    className="text-3xs h-7 font-bold border-indigo-500 text-indigo-700 hover:bg-indigo-50"
                                  >
                                    Return tools
                                  </Button>
                                )}

                                {/* Check-in / Out */}
                                {!req.actualEntryTime && req.status !== 'Completed' && (
                                  <Button 
                                    size="sm" 
                                    onClick={() => handleCheckIn(req._id)}
                                    className="text-3xs h-7 bg-green-600 text-white font-bold hover:bg-green-700"
                                  >
                                    Check In
                                  </Button>
                                )}

                                {req.actualEntryTime && !req.actualExitTime && (
                                  <Button 
                                    size="sm" 
                                    onClick={() => handleCheckOut(req._id)}
                                    className="text-3xs h-7 bg-amber-600 text-white font-bold hover:bg-amber-700"
                                  >
                                    Check Out
                                  </Button>
                                )}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                    <TablePagination
                      currentPage={approvedPage}
                      totalPages={approvedTotalPages}
                      totalItems={filteredApproved.length}
                      itemsPerPage={approvedPerPage}
                      onPageChange={(page) => setApprovedPage(page)}
                      onItemsPerPageChange={(size) => { setApprovedPerPage(size); setApprovedPage(1); }}
                    />
                  </div>
                );
              })()}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Machine Bookings Manager Tab */}
          <TabsContent value="machine_bookings" className="space-y-6">
            {/* Machine Stats Bar */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { label: "Active Machine Bookings", value: machineStats.activeBookings, color: "text-green-600" },
                { label: "Completed Today", value: machineStats.completedToday, color: "text-emerald-600" },
                { label: "Machines Released", value: machineStats.machinesReleased, color: "text-blue-600" },
                { label: "Pending Completion", value: machineStats.pendingCompletion, color: "text-amber-600" }
              ].map((item, idx) => (
                <Card key={idx}>
                  <CardContent className="pt-6">
                    <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">{item.label}</p>
                    <p className={`text-2xl font-bold mt-1 ${item.color}`}>{item.value}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Pending Extension Requests Card */}
            {resourceRequests.filter(r => r.extensionStatus === 'Pending').length > 0 && (
              <Card className="border-amber-200 bg-amber-50/10">
                <CardHeader>
                  <CardTitle className="text-base font-bold text-amber-800 flex items-center gap-1.5">
                    <ShieldAlert className="w-5 h-5 text-amber-600" /> Pending Booking Extensions
                  </CardTitle>
                  <CardDescription className="text-xs text-amber-700/80">Students requiring more time on booked machinery slots</CardDescription>
                </CardHeader>
                <CardContent className="overflow-x-auto text-xs">
                  <table className="w-full text-left border-collapse border border-amber-200/60 rounded-xl bg-white">
                    <thead className="bg-amber-50/50 uppercase text-[9px] tracking-wider text-amber-800 font-bold border-b border-amber-200/50">
                      <tr>
                        <th className="px-4 py-3">Request ID</th>
                        <th className="px-4 py-3">Machine</th>
                        <th className="px-4 py-3">Team / Applicant</th>
                        <th className="px-4 py-3">Original End Time</th>
                        <th className="px-4 py-3 text-amber-700">Requested End Time</th>
                        <th className="px-4 py-3">Reason</th>
                        <th className="px-4 py-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-amber-100 font-medium text-slate-700">
                      {resourceRequests.filter(r => r.extensionStatus === 'Pending').map((req) => (
                        <tr key={req._id} className="hover:bg-amber-50/30">
                          <td className="px-4 py-3 font-mono font-bold text-primary">{req.requestId}</td>
                          <td className="px-4 py-3 font-bold text-foreground">
                            {req.requestedMachines?.[0]?.machineName || "N/A"}
                          </td>
                          <td className="px-4 py-3">{req.teamName || req.students?.[0]?.name || "N/A"}</td>
                          <td className="px-4 py-3 font-mono">
                            {req.requestedMachines?.[0]?.endTime ? formatTime12Hour(req.requestedMachines[0].endTime) : 'N/A'}
                          </td>
                          <td className="px-4 py-3 font-mono font-bold text-amber-700">
                            {req.extensionEndTime ? formatTime12Hour(req.extensionEndTime) : 'N/A'}
                          </td>
                          <td className="px-4 py-3 italic max-w-xs truncate" title={req.extensionReason}>
                            "{req.extensionReason || 'No reason provided'}"
                          </td>
                          <td className="px-4 py-3 text-right flex justify-end gap-2">
                            <Button 
                              size="sm" 
                              onClick={() => handleExtensionDecision(req._id, 'Rejected')}
                              className="text-3xs h-7 font-bold border-destructive text-destructive hover:bg-destructive hover:text-white"
                              variant="outline"
                            >
                              Reject
                            </Button>
                            <Button 
                              size="sm" 
                              onClick={() => handleExtensionDecision(req._id, 'Approved')}
                              className="text-3xs h-7 font-bold bg-green-600 hover:bg-green-700 text-white"
                            >
                              Approve
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </CardContent>
              </Card>
            )}

            {/* Booking Table Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base font-bold">Machine Work Completion System</CardTitle>
                <CardDescription className="text-xs">Manage active and completed machine usage bookings</CardDescription>
              </CardHeader>
              <CardContent className="overflow-x-auto text-xs">
                {(() => {
                  const allMachineBookings = resourceRequests.filter(r => r.requestedMachines && r.requestedMachines.length > 0);
                  const machineTotalPages = Math.ceil(allMachineBookings.length / machinePerPage) || 1;
                  const paginatedMachineBookings = allMachineBookings.slice((machinePage - 1) * machinePerPage, machinePage * machinePerPage);

                  return (
                    <div>
                      <table className="w-full text-left border-collapse border rounded-xl">
                        <thead className="bg-slate-50 uppercase text-[9px] tracking-wider text-slate-700 font-bold border-b">
                          <tr>
                            <th className="px-4 py-3">Request ID</th>
                            <th className="px-4 py-3">Machine Name</th>
                            <th className="px-4 py-3">Team Name</th>
                            <th className="px-4 py-3">Booking Date</th>
                            <th className="px-4 py-3">Status</th>
                            <th className="px-4 py-3">Completion Time</th>
                            <th className="px-4 py-3 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y font-medium text-slate-700">
                          {allMachineBookings.length === 0 ? (
                            <tr>
                              <td colSpan={7} className="text-center py-6 text-muted-foreground font-semibold">No machine bookings found.</td>
                            </tr>
                          ) : (
                            paginatedMachineBookings.map((req) => (
                              <tr key={req._id} className="hover:bg-slate-50/20">
                                <td className="px-4 py-3 font-mono font-bold text-primary">{req.requestId}</td>
                                <td className="px-4 py-3 font-bold text-foreground">
                                  {req.requestedMachines?.[0]?.machineName || "N/A"}
                                </td>
                                <td className="px-4 py-3">{req.teamName || req.students?.[0]?.name || "N/A"}</td>
                                <td className="px-4 py-3">
                                  {req.requestedMachines?.[0]?.usageDate ? new Date(req.requestedMachines[0].usageDate).toLocaleDateString() : 'N/A'}
                                </td>
                                <td className="px-4 py-3">
                                  <Badge className="text-[8px] font-bold uppercase" variant={req.status === 'Work Completed' ? 'default' : 'outline'}>
                                    {req.status}
                                  </Badge>
                                </td>
                                <td className="px-4 py-3 font-mono text-3xs text-muted-foreground">
                                  {req.completedAt ? new Date(req.completedAt).toLocaleString() : 'N/A'}
                                </td>
                                <td className="px-4 py-3 text-right flex justify-end gap-2">
                                  {/* View Action */}
                                  <Button 
                                    size="sm" 
                                    variant="outline"
                                    onClick={() => { setSelectedResRequest(req); setShowResReviewDialog(true); }}
                                    className="text-3xs h-7 font-bold"
                                  >
                                    View
                                  </Button>

                                  {/* Work Completed Action */}
                                  {['Machine Scheduled', 'Active Booking'].includes(req.status) && (
                                    <Button 
                                      size="sm" 
                                      onClick={() => {
                                        setCompletionRequest(req);
                                        setShowCompletionDialog(true);
                                      }}
                                      className="text-3xs h-7 font-bold bg-green-600 text-white hover:bg-green-700"
                                    >
                                      Work Completed
                                    </Button>
                                  )}
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                      <TablePagination
                        currentPage={machinePage}
                        totalPages={machineTotalPages}
                        totalItems={allMachineBookings.length}
                        itemsPerPage={machinePerPage}
                        onPageChange={(page) => setMachinePage(page)}
                        onItemsPerPageChange={(size) => { setMachinePerPage(size); setMachinePage(1); }}
                      />
                    </div>
                  );
                })()}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </TabsContent>

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

      {/* TABS CONTENT: HOME STATS COUNTER */}
      <TabsContent value="home_stats" className="space-y-6">
        <ManageStats />
      </TabsContent>

      {/* DIALOG: Coordinator Review Checks Checklist */}
      {selectedResRequest && showResReviewDialog && (
        <Dialog open={showResReviewDialog} onOpenChange={setShowResReviewDialog}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto text-xs text-slate-700">
            <DialogHeader>
              <DialogTitle className="text-base font-extrabold">Coordinator Review: {selectedResRequest.requestId}</DialogTitle>
            </DialogHeader>
            <div className="space-y-6">
              
              {/* Project & Team Description */}
              <div className="bg-secondary/10 p-3 rounded-lg border space-y-2">
                <p><b>Project Title:</b> {selectedResRequest.projectName} ({selectedResRequest.projectCategory})</p>
                <p><b>Description:</b> {selectedResRequest.projectDescription}</p>
                {selectedResRequest.applicantType === 'External' ? (
                  <div className="pt-2 border-t mt-2 space-y-1">
                    <p className="font-bold text-orange-600 text-xs">External Applicant Details</p>
                    <p><b>Name:</b> {selectedResRequest.externalFullName} ({selectedResRequest.externalDesignation || 'N/A'})</p>
                    <p><b>Department:</b> {selectedResRequest.externalDept || 'N/A'}</p>
                    <p><b>College / Org:</b> {selectedResRequest.externalCollegeOrg || 'N/A'}</p>
                    <p><b>Location:</b> {selectedResRequest.externalCity}, {selectedResRequest.externalState}</p>
                    <p><b>Contact:</b> {selectedResRequest.externalEmail} | {selectedResRequest.externalMobile}</p>
                    {selectedResRequest.externalWebsite && <p><b>Website:</b> <a href={selectedResRequest.externalWebsite} target="_blank" rel="noreferrer" className="text-primary underline">{selectedResRequest.externalWebsite}</a></p>}
                    
                    {selectedResRequest.externalApplicantType === 'Team' ? (
                      <div className="mt-2 p-2 bg-white border rounded">
                        <p className="font-bold text-[10px] text-slate-800">Team Project: {selectedResRequest.teamName}</p>
                        <div className="mt-1 space-y-1">
                          {selectedResRequest.externalTeamMembers?.map((m: any, idx: number) => (
                            <div key={idx} className="text-3xs text-muted-foreground">• {m.name} ({m.email} | {m.mobile})</div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <p><b>Type:</b> Individual Project</p>
                    )}
                  </div>
                ) : (
                  <div className="pt-2 border-t mt-2 space-y-2">
                    <p className="font-bold text-primary text-[10px] uppercase tracking-wider">Student Team Details</p>
                    {selectedResRequest.teamName && (
                      <p className="font-semibold text-slate-700">Team Name: {selectedResRequest.teamName}</p>
                    )}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-1">
                      {selectedResRequest.students?.map((s, idx) => (
                        <div key={idx} className="p-2.5 bg-white border rounded-md shadow-2xs space-y-1">
                          <p className="font-bold text-slate-900 text-xs">{s.name}</p>
                          <div className="text-muted-foreground text-[10px] space-y-0.5 font-medium">
                            <p><b>PRN:</b> {s.prn || 'N/A'} | <b>Branch/Year:</b> {s.branch || 'N/A'} / {s.year || 'N/A'}</p>
                            <p><b>Email:</b> {s.email || 'N/A'}</p>
                            <p><b>Mobile:</b> {s.mobile || 'N/A'}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Resources details inside modal */}
              <div className="space-y-3">
                <h4 className="font-bold text-primary border-b pb-1">Requested Resources List</h4>
                
                {selectedResRequest.requestedMachines?.length > 0 && (
                  <div>
                    <p className="font-bold text-3xs uppercase text-slate-500 mb-1">Machines Bookings</p>
                    {selectedResRequest.requestedMachines.map((m, i) => (
                      <div key={i} className="p-2 border rounded bg-slate-50 mb-1.5">
                        <p className="font-semibold">{m.machineName}</p>
                        <p className="text-3xs text-muted-foreground mt-0.5">
                          Date: {new Date(m.usageDate).toLocaleDateString()} | Hours: {m.usageHours} hrs ({m.startTime} - {m.endTime})
                        </p>
                      </div>
                    ))}
                  </div>
                )}

                {selectedResRequest.requestedMaterials?.length > 0 && (
                  <div>
                    <p className="font-bold text-3xs uppercase text-slate-500 mb-1">Materials Allocation</p>
                    {selectedResRequest.requestedMaterials.map((m, i) => (
                      <div key={i} className="flex justify-between items-center py-1 border-b last:border-0 font-medium">
                        <span>• {m.materialName}</span>
                        <span className="bg-slate-200 text-slate-800 font-bold px-2 py-0.5 rounded font-mono text-[10px]">Qty: {m.quantityRequired}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Project Attachment previews/downloads */}
                {selectedResRequest.uploadedFiles && Object.values(selectedResRequest.uploadedFiles).some(Boolean) && (
                  <div className="pt-3 border-t">
                    <p className="font-bold text-[10px] uppercase text-primary mb-2.5 tracking-wider">Project Attachments</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {[
                        { label: "Design File", url: selectedResRequest.uploadedFiles.designFileUrl },
                        { label: "CAD File", url: selectedResRequest.uploadedFiles.cadFileUrl },
                        { label: "Circuit Diagram", url: selectedResRequest.uploadedFiles.circuitDiagramUrl },
                        { label: "Supporting Documents", url: selectedResRequest.uploadedFiles.supportingDocsUrl }
                      ].map((item) => {
                        if (!item.url) return null;
                        const isImage = /\.(jpg|jpeg|png|gif|webp|avif|svg)(\?.*)?$/i.test(item.url);
                        return (
                          <div key={item.label} className="p-3 border rounded-lg bg-slate-50/60 flex flex-col justify-between space-y-3 hover:bg-slate-100/40 transition-colors">
                            <div className="flex items-start justify-between gap-3">
                              <div className="space-y-0.5 min-w-0">
                                <span className="font-bold text-slate-800 text-xs">{item.label}</span>
                                <span className="text-[10px] text-muted-foreground truncate block" title={item.url}>
                                  {item.url.split('/').pop()}
                                </span>
                              </div>
                              {isImage ? (
                                <div className="w-12 h-12 rounded bg-white border overflow-hidden shrink-0 flex items-center justify-center shadow-2xs">
                                  <img src={item.url} alt={item.label} className="object-cover w-full h-full" />
                                </div>
                              ) : (
                                <div className="w-12 h-12 rounded bg-white border shrink-0 flex items-center justify-center text-primary font-bold text-[10px] shadow-2xs">
                                  {item.url.split('.').pop()?.toUpperCase() || 'FILE'}
                                </div>
                              )}
                            </div>
                            <a href={item.url} target="_blank" rel="noreferrer" className="w-full">
                              <Button size="sm" variant="outline" className="w-full h-7 text-[10px] gap-1 font-semibold justify-center">
                                <Eye className="w-3.5 h-3.5" /> View / Download
                              </Button>
                            </a>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* External User ID Proof and Verification */}
              {selectedResRequest.applicantType === 'External' && (
                <div className="space-y-4 pt-3 border-t">
                  <h4 className="font-bold text-orange-600 flex items-center gap-1.5">
                    <User className="w-4 h-4 text-orange-600" /> Identity Verification & Proof
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border p-4 rounded-xl bg-orange-50/10 border-orange-100">
                    <div>
                      <span className="font-semibold text-slate-700 block mb-1">Uploaded Identity Proof:</span>
                      {selectedResRequest.externalIdentityProof ? (
                        <a 
                          href={selectedResRequest.externalIdentityProof} 
                          target="_blank" 
                          rel="noreferrer" 
                          className="inline-flex items-center gap-1.5 font-bold text-orange-700 underline text-xs"
                        >
                          <Eye className="w-4 h-4" /> View ID Proof Document
                        </a>
                      ) : (
                        <span className="text-muted-foreground italic">No ID Proof uploaded.</span>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="ext-id-verification-status" className="font-semibold">Identity Verification Status:</Label>
                      <Select 
                        value={extIdVerification} 
                        onValueChange={(val: any) => setExtIdVerification(val)}
                      >
                        <SelectTrigger id="ext-id-verification-status" className="h-9 mt-1 bg-white">
                          <SelectValue placeholder="Verification Status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Pending">Pending Verification</SelectItem>
                          <SelectItem value="Verified">Verified & Approved ID</SelectItem>
                          <SelectItem value="Rejected">Rejected ID Proof</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Usage Charges Configurator */}
                  <h4 className="font-bold text-blue-800 flex items-center gap-1.5">
                    <Database className="w-4 h-4 text-blue-800" /> External Usage Fee Configuration
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 border p-4 rounded-xl bg-blue-50/10 border-blue-100 font-medium">
                    <div>
                      <Label htmlFor="machine-charges" className="text-3xs uppercase font-bold text-slate-600">Machine Charges (₹)</Label>
                      <Input 
                        id="machine-charges"
                        type="number"
                        min="0"
                        value={extMachineCharges}
                        onChange={(e) => setExtMachineCharges(Number(e.target.value) || 0)}
                        className="h-9 mt-1 bg-white text-xs font-mono font-bold"
                      />
                    </div>
                    <div>
                      <Label htmlFor="material-charges" className="text-3xs uppercase font-bold text-slate-600">Material Charges (₹)</Label>
                      <Input 
                        id="material-charges"
                        type="number"
                        min="0"
                        value={extMaterialCharges}
                        onChange={(e) => setExtMaterialCharges(Number(e.target.value) || 0)}
                        className="h-9 mt-1 bg-white text-xs font-mono font-bold"
                      />
                    </div>
                    <div>
                      <Label className="text-3xs uppercase font-bold text-slate-600">Total Charges (₹)</Label>
                      <div className="h-9 border rounded-md flex items-center px-3 mt-1 bg-slate-50 font-mono font-extrabold text-blue-700 text-sm">
                        ₹{extMachineCharges + extMaterialCharges}
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="payment-status" className="text-3xs uppercase font-bold text-slate-600">Payment Status</Label>
                      <Select 
                        value={extPaymentStatus} 
                        onValueChange={(val: any) => setExtPaymentStatus(val)}
                      >
                        <SelectTrigger id="payment-status" className="h-9 mt-1 bg-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Pending">Pending</SelectItem>
                          <SelectItem value="Paid">Paid</SelectItem>
                          <SelectItem value="Waived">Waived</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Previous Requests History */}
                  <h4 className="font-bold text-slate-800 flex items-center gap-1.5">
                    <RefreshCw className="w-4 h-4 text-slate-600" /> Applicant History Lookup
                  </h4>
                  <div className="border rounded-xl bg-slate-50 p-4 space-y-3">
                    <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">
                      Previous Requests from {selectedResRequest.externalEmail || selectedResRequest.externalMobile}
                    </p>
                    {resourceRequests.filter(r => 
                      r._id !== selectedResRequest._id && 
                      r.applicantType === 'External' && 
                      ((selectedResRequest.externalEmail && r.externalEmail === selectedResRequest.externalEmail) || 
                       (selectedResRequest.externalMobile && r.externalMobile === selectedResRequest.externalMobile))
                    ).length === 0 ? (
                      <p className="text-3xs text-muted-foreground italic">No previous requests found for this applicant.</p>
                    ) : (
                      <div className="space-y-2 max-h-36 overflow-y-auto">
                        {resourceRequests.filter(r => 
                          r._id !== selectedResRequest._id && 
                          r.applicantType === 'External' && 
                          ((selectedResRequest.externalEmail && r.externalEmail === selectedResRequest.externalEmail) || 
                           (selectedResRequest.externalMobile && r.externalMobile === selectedResRequest.externalMobile))
                        ).map((prevReq) => (
                          <div key={prevReq._id} className="bg-white border rounded p-2 text-3xs flex justify-between items-center">
                            <div>
                              <span className="font-mono font-bold text-primary">{prevReq.requestId}</span>
                              <span className="font-bold text-slate-700 ml-2">{prevReq.projectName}</span>
                              <span className="text-muted-foreground block mt-0.5">
                                Date: {prevReq.requestedMachines?.[0]?.usageDate ? new Date(prevReq.requestedMachines[0].usageDate).toLocaleDateString() : 'N/A'} 
                                {prevReq.totalCharges > 0 && ` | Charges: ₹${prevReq.totalCharges} (${prevReq.paymentStatus})`}
                              </span>
                            </div>
                            <Badge className="text-[8px] font-bold uppercase">{prevReq.status}</Badge>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Approval History Logs */}
              {selectedResRequest.approvalHistory && selectedResRequest.approvalHistory.length > 0 && (
                <div className="border-t pt-4 space-y-2">
                  <h4 className="font-bold text-slate-800 flex items-center gap-1.5">
                    <History className="w-4 h-4 text-slate-600" /> Approval History Logs
                  </h4>
                  <div className="space-y-2 border rounded-md p-3 bg-slate-50/50">
                    {selectedResRequest.approvalHistory.map((h: any, i: number) => (
                      <div key={i} className="flex justify-between items-start border-b border-border/40 pb-2 last:border-0 last:pb-0 text-xs">
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

              {/* Coordinator Checklist checks (Section 12) */}
              <div className="space-y-3 pt-3 border-t">
                <h4 className="font-bold text-slate-800 flex items-center gap-1.5"><ShieldAlert className="w-4 h-4 text-primary" /> Coordinator Review Checks</h4>
                <div className="space-y-2 border p-4 rounded-xl bg-slate-50">
                  {[
                    { label: "1. Machine Capacity & Slot Availability Checked", field: "machineAvailability" },
                    { label: "2. Materials Stock Level & Allocation Available Checked", field: "materialAvailability" },
                    { label: "3. Project Feasibility & Objectives align with IDEA Lab parameters", field: "projectFeasibility" },
                    { label: "4. Applicant eligibility status verified in system", field: "studentEligibility" },
                    { label: "5. Checked applicant previous resource return/usage history log", field: "previousUsageHistory" }
                  ].map((chk) => (
                    <div key={chk.field} className="flex items-center space-x-2">
                      <Checkbox 
                        id={chk.field}
                        // @ts-ignore
                        checked={checks[chk.field]}
                        // @ts-ignore
                        onCheckedChange={(c) => setChecks(prev => ({ ...prev, [chk.field]: !!c }))}
                      />
                      <Label htmlFor={chk.field} className="font-semibold text-xs leading-none cursor-pointer text-slate-700">{chk.label}</Label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Remarks Textarea */}
              <div className="space-y-2">
                <Label htmlFor="remarks">Coordinator remarks / comments</Label>
                <Textarea 
                  id="remarks" 
                  value={decisionRemarks} 
                  onChange={(e) => setDecisionRemarks(e.target.value)} 
                  placeholder="Approved slot parameters, remarks, or correction instructions..."
                  rows={2} 
                />
              </div>

            </div>
            <DialogFooter className="pt-4 border-t flex flex-wrap gap-2 justify-end">
              <Button variant="outline" className="font-bold text-xs h-9" disabled={submittingDecision} onClick={() => handleResourceRequestDecision("request_changes")}>Request Changes</Button>
              <Button variant="destructive" className="font-bold text-xs h-9" disabled={submittingDecision} onClick={() => handleResourceRequestDecision("reject")}>Reject request</Button>
              <Button
                type="button"
                className="font-bold text-xs h-9 bg-indigo-600 hover:bg-indigo-700 text-white gap-1.5 shadow-xs"
                disabled={submittingDecision}
                onClick={() => setShowUrgentConfirmDialog(true)}
              >
                <ShieldAlert className="w-4 h-4 text-white" />
                Grant Urgent Permission
              </Button>
              <Button
                variant="default"
                className="font-bold text-xs h-9 bg-primary hover:bg-primary/95 text-white min-w-[180px] gap-1.5"
                disabled={submittingDecision}
                onClick={() => handleResourceRequestDecision("approve")}
              >
                {submittingDecision ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Forwarding to Head...
                  </>
                ) : (
                  <>
                    <SendHorizonal className="w-4 h-4" />
                    Approve & Forward to Head
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Confirmation Dialog for Urgent Permission */}
      {showUrgentConfirmDialog && (
        <Dialog open={showUrgentConfirmDialog} onOpenChange={setShowUrgentConfirmDialog}>
          <DialogContent className="max-w-md text-xs text-slate-700">
            <DialogHeader>
              <DialogTitle className="text-base font-extrabold flex items-center gap-2 text-slate-900">
                <ShieldAlert className="w-5 h-5 text-indigo-600" /> Confirm Urgent Permission
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-600 pt-2 space-y-2">
                <p>Are you sure you want to grant <b>Urgent Permission</b> for project <b>"{selectedResRequest?.projectName}"</b>?</p>
                <div className="bg-primary/5 border border-primary/20 p-3 rounded-md text-slate-800 font-medium space-y-1">
                  <p className="font-bold text-slate-900 flex items-center gap-1.5">
                    <ShieldAlert className="w-4 h-4 text-indigo-600" /> Direct Approval (Head Bypassed):
                  </p>
                  <p className="text-[11px] text-slate-600">Head permission will <b>NOT</b> be required. The request will be directly approved for immediate machinery usage, and recorded in history logs.</p>
                </div>
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="pt-3 gap-2">
              <Button 
                variant="outline" 
                className="font-bold text-xs h-9 px-4" 
                onClick={() => setShowUrgentConfirmDialog(false)}
                disabled={submittingDecision}
              >
                Cancel
              </Button>
              <Button 
                className="font-bold text-xs h-9 px-4 bg-indigo-600 hover:bg-indigo-700 text-white gap-1.5"
                disabled={submittingDecision}
                onClick={() => {
                  setShowUrgentConfirmDialog(false);
                  handleResourceRequestDecision("urgent_approve");
                }}
              >
                {submittingDecision ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldAlert className="w-4 h-4 text-white" />}
                Confirm Urgent Approval
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* DIALOG: Allocate & Issue Material Modal */}
      {selectedResRequest && showAllocateDialog && (
        <Dialog open={showAllocateDialog} onOpenChange={setShowAllocateDialog}>
          <DialogContent className="max-w-md text-xs text-slate-700">
            <DialogHeader><DialogTitle className="text-base font-extrabold">Material Allocation Screen</DialogTitle></DialogHeader>
            <div className="space-y-4 py-2">
              <p className="font-semibold text-muted-foreground">Adjust quantities to allocate/issue to the team:</p>
              {selectedResRequest.requestedMaterials.map((mat) => {
                const mId = mat.materialId?._id || mat.materialId;
                const matInventory = materials.find(m => m._id === mId);
                
                return (
                  <div key={mId} className="flex justify-between items-center p-3 border rounded bg-slate-50/50">
                    <div>
                      <p className="font-bold">{mat.materialName}</p>
                      <p className="text-3xs text-muted-foreground">Requested: {mat.quantityRequired} | Stock: {matInventory?.remainingQuantity || 0} avail</p>
                    </div>
                    <div className="w-24">
                      <Input 
                        type="number" 
                        min="0"
                        value={allocateQuantities[mId] || 0}
                        onChange={(e) => setAllocateQuantities({ ...allocateQuantities, [mId]: Number(e.target.value) || 0 })}
                        className="h-8 text-xs font-mono text-center font-bold"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowAllocateDialog(false)}>Cancel</Button>
              <Button className="bg-primary text-white hover:bg-primary/90" onClick={handleIssueMaterialsSubmit}>Issue Material & Deduct Stock</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* DIALOG: Returns Material/Tools Modal */}
      {selectedResRequest && showReturnDialog && (
        <Dialog open={showReturnDialog} onOpenChange={setShowReturnDialog}>
          <DialogContent className="max-w-lg text-xs text-slate-700">
            <DialogHeader><DialogTitle className="text-base font-extrabold">Process Resource Returns</DialogTitle></DialogHeader>
            <div className="space-y-4 py-2">
              {selectedResRequest.materialAllocations.map((alloc) => {
                const mId = alloc.materialId?._id || alloc.materialId;
                const mName = materials.find(m => m._id === mId)?.name || "Material";
                
                return (
                  <div key={mId} className="p-3 border rounded bg-slate-50/50 space-y-3">
                    <div className="flex justify-between items-center border-b pb-1 font-bold text-foreground">
                      <span>{mName}</span>
                      <span className="text-3xs text-indigo-700 uppercase">Issued: {alloc.quantityIssued}</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <Label className="text-3xs">Return Qty</Label>
                        <Input 
                          type="number" 
                          min="0"
                          max={alloc.quantityIssued}
                          value={returnQuantities[mId] || 0}
                          onChange={(e) => setReturnQuantities({ ...returnQuantities, [mId]: Number(e.target.value) || 0 })}
                          className="h-8 text-xs text-center font-bold"
                        />
                      </div>
                      <div>
                        <Label className="text-3xs">Condition</Label>
                        <Select 
                          value={returnCondition[mId] || 'Good'} 
                          onValueChange={(v) => setReturnCondition({ ...returnCondition, [mId]: v })}
                        >
                          <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Good">Good</SelectItem>
                            <SelectItem value="Damaged">Damaged</SelectItem>
                            <SelectItem value="Lost">Lost</SelectItem>
                            <SelectItem value="Partially Consumed">Partially Consumed</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-3xs">Remarks</Label>
                        <Input 
                          value={returnRemarks[mId] || ''}
                          onChange={(e) => setReturnRemarks({ ...returnRemarks, [mId]: e.target.value })}
                          className="h-8 text-xs"
                          placeholder="Note damages..."
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowReturnDialog(false)}>Cancel</Button>
              <Button className="bg-primary text-white hover:bg-primary/90" onClick={handleReturnResourcesSubmit}>Confirm Return & Update Inventory</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* DIALOG: Edit Stock Dialog */}
      {editingMaterial && showStockEditDialog && (
        <Dialog open={showStockEditDialog} onOpenChange={setShowStockEditDialog}>
          <DialogContent className="max-w-sm text-xs">
            <DialogHeader><DialogTitle className="text-base font-extrabold">Adjust Stock: {editingMaterial.name}</DialogTitle></DialogHeader>
            <div className="space-y-4 py-2">
              <Label>Configure Current Stock Level ({editingMaterial.unit})</Label>
              <Input 
                type="number" 
                min="0"
                value={stockInput} 
                onChange={(e) => setStockInput(Number(e.target.value) || 0)} 
                className="font-bold text-center h-9"
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowStockEditDialog(false)}>Cancel</Button>
              <Button onClick={handleUpdateStock}>Update Stock Levels</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Download Reports Modal */}
      <Dialog open={reportModalOpen} onOpenChange={setReportModalOpen}>
        <DialogContent className="max-w-md bg-white border border-slate-200 rounded-2xl p-6">
          <DialogHeader className="border-b pb-3 -mx-6 -mt-6 p-6 bg-primary/5">
            <DialogTitle className="text-lg font-bold">Download Machinery Usage Report</DialogTitle>
            <DialogDescription className="text-xs">
              Select time range and format to export the data.
            </DialogDescription>
          </DialogHeader>

          {/* Form */}
          <div className="space-y-4 pt-4 text-xs">
            {/* Time Range */}
            <div>
              <Label className="text-xs font-semibold text-slate-700">Select Time Range</Label>
              <div className="grid grid-cols-2 gap-2 mt-1.5">
                {[
                  { value: 'Today', label: 'Today' },
                  { value: 'Last 7 Days', label: 'Last 7 Days' },
                  { value: 'Last 30 Days', label: 'Last 30 Days' },
                  { value: 'Last 3 Months', label: 'Last 3 Months' },
                  { value: 'Last 6 Months', label: 'Last 6 Months' },
                  { value: 'Last 1 Year', label: 'Last 1 Year' },
                  { value: 'Custom Date Range', label: 'Custom Date Range' }
                ].map(item => (
                  <label key={item.value} className="flex items-center gap-2 p-2 rounded-lg border hover:bg-slate-50 cursor-pointer">
                    <input
                      type="radio"
                      name="timeRange"
                      value={item.value}
                      checked={timeRange === item.value}
                      onChange={() => setTimeRange(item.value)}
                      className="accent-primary"
                    />
                    <span>{item.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Custom Dates (Conditional) */}
            {timeRange === 'Custom Date Range' && (
              <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 border rounded-lg">
                <div>
                  <Label className="text-3xs font-semibold">From Date</Label>
                  <Input
                    type="date"
                    value={fromDate}
                    onChange={(e) => setFromDate(e.target.value)}
                    className="h-8 text-xs mt-1 bg-white"
                  />
                </div>
                <div>
                  <Label className="text-3xs font-semibold">To Date</Label>
                  <Input
                    type="date"
                    value={toDate}
                    onChange={(e) => setToDate(e.target.value)}
                    className="h-8 text-xs mt-1 bg-white"
                  />
                </div>
              </div>
            )}

            {/* File Format */}
            <div>
              <Label className="text-xs font-semibold text-slate-700">File Format</Label>
              <div className="flex gap-4 mt-1.5">
                {[
                  { value: 'xlsx', label: 'Excel (.xlsx)' },
                  { value: 'csv', label: 'CSV' },
                  { value: 'pdf', label: 'PDF' }
                ].map(item => (
                  <label key={item.value} className="flex items-center gap-2 p-2 px-3 rounded-lg border hover:bg-slate-50 cursor-pointer flex-1 justify-center">
                    <input
                      type="radio"
                      name="fileFormat"
                      value={item.value}
                      checked={fileFormat === item.value}
                      onChange={() => setFileFormat(item.value)}
                      className="accent-primary"
                    />
                    <span>{item.label}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 border-t pt-4 mt-6">
            <Button variant="outline" size="sm" onClick={() => setReportModalOpen(false)}>
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleGenerateReportSubmit}
              className="bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              Generate Report
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      </div>
    </Tabs>
  );
};

export default CoordinatorDashboard;
