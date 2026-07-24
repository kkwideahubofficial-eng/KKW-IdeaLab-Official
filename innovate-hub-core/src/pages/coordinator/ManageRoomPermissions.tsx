import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "@/lib/axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  FileText,
  Search,
  Filter,
  CheckCircle,
  XCircle,
  ArrowRight,
  Clock,
  User,
  Activity,
  Layers,
  Settings,
  Calendar,
  AlertCircle,
  RefreshCw
} from "lucide-react";

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

const ManageRoomPermissions = () => {
  const navigate = useNavigate();
  const [requests, setRequests] = useState<any[]>([]);
  const [stats, setStats] = useState({ total: 0, pending: 0, approved: 0, rejected: 0, todayBookings: 0, upcoming: 0 });
  const [loading, setLoading] = useState(true);

  // Search and Filters
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [roomFilter, setRoomFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("");
  const [branchFilter, setBranchFilter] = useState("all");
  const [yearFilter, setYearFilter] = useState("all");

  // Dialog State
  const [selectedRequest, setSelectedRequest] = useState<any | null>(null);
  const [decisionRemarks, setDecisionRemarks] = useState("");
  const [processing, setProcessing] = useState(false);
  const [confirmAction, setConfirmAction] = useState<"approve" | "reject" | "request_changes" | null>(null);

  // Report states
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [timeRange, setTimeRange] = useState("Today");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [fileFormat, setFileFormat] = useState("xlsx");

  const handleDownloadReport = (range: string, format: string = 'xlsx', from?: string, to?: string) => {
    const token = localStorage.getItem('idea_hub_token');
    let url = `${api.defaults.baseURL}/room-permissions/report?rangeType=${encodeURIComponent(range)}&format=${format}`;
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

  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([
        fetchRequests(true),
        fetchStats()
      ]);
      toast.success("Room permissions data refreshed!");
    } catch {
      toast.error("Failed to refresh data");
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchRequests();
    fetchStats();
  }, [search, statusFilter, roomFilter, dateFilter, branchFilter, yearFilter]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        Promise.all([
          fetchRequests(true),
          fetchStats()
        ]).catch(err => console.error("Auto refresh coordinator room permissions failed", err));
      }
    }, 30000);
    return () => clearInterval(interval);
  }, [search, statusFilter, roomFilter, dateFilter, branchFilter, yearFilter]);

  const fetchRequests = async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    try {
      let url = "/room-permissions?";
      const params = [];
      if (search) params.push(`search=${encodeURIComponent(search)}`);
      if (statusFilter !== "all") params.push(`status=${statusFilter}`);
      if (roomFilter !== "all") params.push(`roomType=${encodeURIComponent(roomFilter)}`);
      if (dateFilter) params.push(`date=${dateFilter}`);
      if (branchFilter !== "all") params.push(`department=${encodeURIComponent(branchFilter)}`);
      if (yearFilter !== "all") params.push(`year=${yearFilter}`);

      url += params.join("&");
      const res = await api.get(url);
      setRequests(res.data);
    } catch (err) {
      console.error(err);
      if (!isSilent) toast.error("Failed to load room permission requests.");
    } finally {
      if (!isSilent) setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await api.get("/room-permissions/coordinator-stats");
      setStats(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDecision = async (id: string, decision: string) => {
    if ((decision === "reject" || decision === "request_changes") && !decisionRemarks) {
      toast.error("Remarks are required for this action.");
      return;
    }

    try {
      setProcessing(true);
      await api.put(`/room-permissions/${id}/coordinator-decision`, {
        decision,
        remarks: decisionRemarks
      });
      
      toast.success(
        decision === "approve" ? "Request approved and forwarded to Head!" :
        decision === "reject" ? "Request rejected!" :
        "Changes requested from student!"
      );
      setSelectedRequest(null);
      setDecisionRemarks("");
      setConfirmAction(null);
      fetchRequests();
      fetchStats();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Action failed.");
    } finally {
      setProcessing(false);
    }
  };

  const clearFilters = () => {
    setSearch("");
    setStatusFilter("all");
    setRoomFilter("all");
    setDateFilter("");
    setBranchFilter("all");
    setYearFilter("all");
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="border-b pb-4 mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Coordinator: Room Permission Requests
          </h1>
          <p className="text-muted-foreground mt-1">
            Review, approve, reject, or forward student facility booking applications.
          </p>
        </div>
        <div className="flex flex-col items-end gap-2 shrink-0">
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="flex items-center gap-2 shadow-xs shrink-0 bg-white border border-border text-slate-700 hover:bg-slate-50"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`} />
              Refresh
            </Button>
            <Button onClick={() => navigate("/coordinator/manage-special-rooms")} variant="outline" className="flex items-center gap-2 shadow-xs shrink-0">
              <Settings className="w-4 h-4" /> Manage Special Rooms
            </Button>
            <Button onClick={() => setReportModalOpen(true)} className="flex items-center gap-2 shadow-sm bg-indigo-600 hover:bg-indigo-700 text-white shrink-0">
              <FileText className="w-4 h-4" /> Download Reports
            </Button>
          </div>
          {/* Quick Download Buttons */}
          <div className="flex flex-wrap items-center gap-1.5 bg-slate-50 border border-slate-200/60 p-1 rounded-lg">
            <span className="text-3xs font-semibold text-muted-foreground px-1.5">Quick Download:</span>
            {['Today', '7 Days', '30 Days', '3 Months', '1 Year'].map((range) => (
              <Button
                key={range}
                variant="ghost"
                className="h-6 text-3xs px-2 hover:bg-white hover:shadow-2xs text-slate-700 font-medium"
                onClick={() => handleQuickDownload(range)}
              >
                {range}
              </Button>
            ))}
            <Button
              variant="ghost"
              className="h-6 text-3xs px-2 hover:bg-white hover:shadow-2xs text-primary font-bold"
              onClick={() => handleQuickDownload('Custom')}
            >
              Custom
            </Button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        {[
          { label: "Total Submissions", val: stats.total, color: "bg-blue-50/50 border-blue-200 text-blue-700" },
          { label: "Awaiting Review", val: stats.pending, color: "bg-amber-50 border-amber-200 text-amber-700 font-bold" },
          { label: "Approved Requests", val: stats.approved, color: "bg-green-50 border-green-200 text-green-700" },
          { label: "Rejected Requests", val: stats.rejected, color: "bg-red-50 border-red-200 text-red-700" },
          { label: "Today's Bookings", val: stats.todayBookings, color: "bg-orange-50 border-orange-200 text-orange-700" },
          { label: "Upcoming Bookings", val: stats.upcoming, color: "bg-indigo-50 border-indigo-200 text-indigo-700" }
        ].map(card => (
          <Card key={card.label} className={`${card.color} border shadow-xs`}>
            <CardContent className="p-3 text-center">
              <div className="text-2xs font-semibold uppercase tracking-wider">{card.label}</div>
              <div className="text-2xl font-extrabold mt-1">{card.val}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters Card */}
      <Card className="mb-6">
        <CardHeader className="py-4 border-b">
          <CardTitle className="text-sm flex items-center gap-2">
            <Filter className="w-4 h-4 text-primary" /> Filters & Search
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4 grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {/* Search Input */}
          <div className="md:col-span-2">
            <Label className="text-xs">Search Text</Label>
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-muted-foreground" />
              <Input
                placeholder="ID, Student Name, PRN, Project..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 h-9 text-xs"
              />
            </div>
          </div>

          {/* Status Filter */}
          <div>
            <Label className="text-xs">Status</Label>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="h-9 text-xs">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="Submitted">Submitted</SelectItem>
                <SelectItem value="Faculty Verified">Faculty Verified</SelectItem>
                <SelectItem value="Coordinator Review">Coordinator Review</SelectItem>
                <SelectItem value="IDEA Hub Head Review">Head Review</SelectItem>
                <SelectItem value="Approved">Approved</SelectItem>
                <SelectItem value="Rejected">Rejected</SelectItem>
                <SelectItem value="Conditional Approval">Conditional Approval</SelectItem>
                <SelectItem value="Completed">Completed</SelectItem>
                <SelectItem value="Cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Room Type Filter */}
          <div>
            <Label className="text-xs">Room Type</Label>
            <Select value={roomFilter} onValueChange={setRoomFilter}>
              <SelectTrigger className="h-9 text-xs">
                <SelectValue placeholder="All Rooms" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Rooms</SelectItem>
                <SelectItem value="Conference Room">Conference Room</SelectItem>
                <SelectItem value="Discussion Room">Discussion Room</SelectItem>
                <SelectItem value="Ideation Room">Ideation Room</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Department Filter */}
          <div>
            <Label className="text-xs">Department</Label>
            <Select value={branchFilter} onValueChange={setBranchFilter}>
              <SelectTrigger className="h-9 text-xs">
                <SelectValue placeholder="All Branches" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Branches</SelectItem>
                {BRANCHES.map(b => (
                  <SelectItem key={b} value={b}>{b}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Date Filter */}
          <div>
            <Label className="text-xs">Date</Label>
            <Input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="h-9 text-xs"
            />
          </div>
        </CardContent>
        <div className="px-6 pb-4 flex justify-end">
          <Button variant="ghost" size="sm" onClick={clearFilters} className="text-xs text-primary">
            Clear Filters
          </Button>
        </div>
      </Card>

      {/* Main Review Table Card */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 text-center text-xs text-muted-foreground">Loading submissions...</div>
          ) : requests.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="border-b bg-muted/60 uppercase font-bold text-muted-foreground">
                    <th className="p-4">Request ID</th>
                    <th className="p-4">Student Name</th>
                    <th className="p-4">Room Type</th>
                    <th className="p-4">Project Name</th>
                    <th className="p-4">Requested Date</th>
                    <th className="p-4">Time Slot</th>
                    <th className="p-4 text-center">Status</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {requests.map(req => (
                    <tr key={req._id} className="border-b hover:bg-secondary/5">
                      <td className="p-4 font-mono font-bold text-primary">{req.requestId}</td>
                      <td className="p-4">
                        <div>{req.applicantDetails.applicantName}</div>
                        <div className="text-3xs text-muted-foreground">{req.applicantDetails.department}</div>
                      </td>
                      <td className="p-4 font-medium">{req.facilityRequired}</td>
                      <td className="p-4 truncate max-w-48">{req.teamDetails.projectName}</td>
                      <td className="p-4">{req.schedule.requestedDate}</td>
                      <td className="p-4 font-medium">{req.schedule.startTime} - {req.schedule.endTime}</td>
                      <td className="p-4 text-center">
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
                      <td className="p-4 text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedRequest(req);
                            setDecisionRemarks("");
                            setConfirmAction(null);
                          }}
                        >
                          Review Request
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-8 text-center text-xs text-muted-foreground">No room permission requests found matching criteria.</div>
          )}
        </CardContent>
      </Card>

      {/* Review Modal Dialog */}
      {selectedRequest && (
        <Dialog open={!!selectedRequest} onOpenChange={() => setSelectedRequest(null)}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-white border border-slate-200 rounded-2xl p-6">
            <DialogHeader className="border-b pb-3 bg-primary/5 -mx-6 -mt-6 p-6 flex flex-row items-center justify-between">
              <div>
                <DialogTitle className="text-lg">Room Request Review</DialogTitle>
                <DialogDescription className="text-xs">
                  Review booking request and perform workflow actions.
                </DialogDescription>
              </div>
              <span className="font-mono text-sm bg-primary/10 text-primary px-3 py-1.5 rounded font-bold shrink-0">{selectedRequest.requestId}</span>
            </DialogHeader>

            <div className="space-y-6 pt-4 text-xs">
              {/* Section 1 & 2: Facility */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-b pb-4">
                <div>
                  <h4 className="font-bold text-primary mb-2">Facility Details</h4>
                  <div className="space-y-1.5 text-xs">
                    <div><span className="text-muted-foreground">Required Facility:</span> <span className="font-semibold">{selectedRequest.facilityRequired}</span></div>
                    <div><span className="text-muted-foreground">Activity Category:</span> <span className="font-semibold">{selectedRequest.category}</span></div>
                    <div><span className="text-muted-foreground">Purpose:</span> <span className="font-semibold">{selectedRequest.purpose}</span></div>
                  </div>
                </div>
                <div>
                  <h4 className="font-bold text-primary mb-2">Schedule & Slot</h4>
                  <div className="space-y-1.5 text-xs">
                    <div><span className="text-muted-foreground">Date:</span> <span className="font-semibold">{selectedRequest.schedule.requestedDate}</span></div>
                    <div><span className="text-muted-foreground">Time Slot:</span> <span className="font-semibold text-primary">{selectedRequest.schedule.startTime} - {selectedRequest.schedule.endTime}</span></div>
                    <div><span className="text-muted-foreground">Duration:</span> <span className="font-semibold">{selectedRequest.schedule.duration} Hours</span></div>
                  </div>
                </div>
              </div>

              {/* Section 3 & 4: Student details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-b pb-4">
                <div>
                  <h4 className="font-bold text-primary mb-2">Applicant Details</h4>
                  <div className="space-y-1.5 text-xs">
                    <div><span className="text-muted-foreground">Name:</span> <span className="font-semibold">{selectedRequest.applicantDetails.applicantName}</span></div>
                    <div><span className="text-muted-foreground">PRN / Roll Number:</span> <span className="font-semibold">{selectedRequest.applicantDetails.prn} / {selectedRequest.applicantDetails.rollNo}</span></div>
                    <div><span className="text-muted-foreground">Dept / Year / Div:</span> <span className="font-semibold">{selectedRequest.applicantDetails.department} - {selectedRequest.applicantDetails.year} (Div: {selectedRequest.applicantDetails.division})</span></div>
                    <div><span className="text-muted-foreground">Mobile / Email:</span> <span className="font-semibold">{selectedRequest.applicantDetails.mobile} / {selectedRequest.applicantDetails.email}</span></div>
                  </div>
                </div>
                <div>
                  <h4 className="font-bold text-primary mb-2">Team & Project</h4>
                  <div className="space-y-1.5 text-xs">
                    <div><span className="text-muted-foreground">Team Name:</span> <span className="font-semibold">{selectedRequest.teamDetails.teamName}</span></div>
                    <div><span className="text-muted-foreground">Project:</span> <span className="font-semibold">{selectedRequest.teamDetails.projectName}</span></div>
                    <div><span className="text-muted-foreground">Participants Count:</span> <span className="font-semibold">{selectedRequest.teamDetails.participantsCount} Persons</span></div>
                  </div>
                </div>
              </div>

              {/* Dynamic Members List */}
              {selectedRequest.teamDetails?.teamMembers?.length > 0 && (
                <div className="border-b pb-4">
                  <h4 className="font-bold text-primary mb-2">Team Members List</h4>
                  <table className="w-full text-2xs border">
                    <thead>
                      <tr className="bg-muted font-bold text-left border-b">
                        <th className="p-2">Full Name</th>
                        <th className="p-2">PRN</th>
                        <th className="p-2">Department</th>
                        <th className="p-2">Year</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedRequest.teamDetails.teamMembers.map((m: any, mIdx: number) => (
                        <tr key={mIdx} className="border-b">
                          <td className="p-2">{m.fullName}</td>
                          <td className="p-2">{m.prn}</td>
                          <td className="p-2">{m.department}</td>
                          <td className="p-2">{m.year}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Resource requirements & Faculty Verification */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-b pb-4">
                <div>
                  <h4 className="font-bold text-primary mb-2">Resource Requirements</h4>
                  <div className="space-y-1.5 text-xs">
                    <div><span className="text-muted-foreground">Equipment:</span> {selectedRequest.resourceRequirements?.requiredEquipment?.join(", ") || "None"}</div>
                    <div><span className="text-muted-foreground">Other Resource:</span> {selectedRequest.resourceRequirements?.otherEquipment || "None"}</div>
                    <div><span className="text-muted-foreground">Special Request:</span> {selectedRequest.specialRequirements || "None"}</div>
                  </div>
                </div>
                <div>
                  <h4 className="font-bold text-primary mb-2">Faculty Recommendation</h4>
                  <div className="space-y-1.5 text-xs">
                    <div><span className="text-muted-foreground">Advisor Name:</span> <span className="font-semibold">{selectedRequest.facultyRecommendation.facultyName}</span></div>
                    <div><span className="text-muted-foreground">Dept / Design.:</span> <span className="font-semibold">{selectedRequest.facultyRecommendation.facultyDepartment} ({selectedRequest.facultyRecommendation.facultyDesignation})</span></div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-muted-foreground">Verification status:</span>
                      <span className={`px-2 py-0.5 rounded text-3xs font-extrabold uppercase ${selectedRequest.facultyRecommendation.verified ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                        {selectedRequest.facultyRecommendation.verified ? 'RECOMMENDED' : 'PENDING'}
                      </span>
                    </div>
                    <div><span className="text-muted-foreground">Faculty Remarks:</span> <span className="italic">"{selectedRequest.facultyRecommendation.facultyRemarks || 'None'}"</span></div>
                  </div>
                </div>
              </div>

              {/* Audit History Trail */}
              {selectedRequest.approvalHistory?.length > 0 && (
                <div id="audit-history-section" className="border-b pb-4">
                  <h4 className="font-bold text-primary mb-2">Workflow Audit History</h4>
                  <div className="space-y-1.5 max-h-40 overflow-y-auto">
                    {selectedRequest.approvalHistory.map((hist: any, hIdx: number) => (
                      <div key={hIdx} className="bg-secondary/15 p-2 rounded border text-xs">
                        <div className="flex justify-between font-semibold">
                          <span>{hist.role} {hist.byName ? `- ${hist.byName}` : ''}</span>
                          <span>{new Date(hist.date).toLocaleDateString()}</span>
                        </div>
                        <div className="mt-1">Action: <span className="font-bold">{hist.action}</span> | Remarks: <span className="italic text-muted-foreground">"{hist.remarks ? hist.remarks.replace(/⚡\s*/g, '') : 'None'}"</span></div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Sticky Action Footer */}
            <div className="sticky bottom-[-25px] bg-white border-t border-slate-200 pt-4 pb-2 -mx-6 mt-6 z-50 px-6 space-y-4 shadow-[0_-4px_12px_rgba(0,0,0,0.05)]">
              {/* Approval Remarks Textarea */}
              {['Submitted', 'Faculty Verified', 'Coordinator Review'].includes(selectedRequest.status) && (
                <div>
                  <Label className="text-xs font-semibold text-slate-700">Approval Remarks</Label>
                  <Textarea
                    placeholder="Enter evaluation remarks or feedback (Required for Rejections or Requesting Changes)..."
                    value={decisionRemarks}
                    onChange={(e) => setDecisionRemarks(e.target.value)}
                    className="h-16 mt-1 bg-background text-xs"
                  />
                </div>
              )}

              {/* Status Timeline */}
              <div className="border-t border-slate-100 pt-3">
                <div className="text-3xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Status Timeline</div>
                <div className="flex justify-between items-center text-3xs font-bold text-slate-600">
                  {[
                    { label: "Submitted", active: true },
                    { label: "Faculty Recommended", active: selectedRequest.facultyRecommendation?.verified || ['Faculty Verified', 'Coordinator Review', 'IDEA Hub Head Review', 'Approved', 'Conditional Approval', 'Completed'].includes(selectedRequest.status) },
                    { label: "Coordinator Approved", active: ['IDEA Hub Head Review', 'Approved', 'Conditional Approval', 'Completed'].includes(selectedRequest.status) },
                    { label: "Head Approved", active: ['Approved', 'Conditional Approval', 'Completed'].includes(selectedRequest.status) }
                  ].map((step, sIdx, arr) => {
                    const getStepLabel = (label: string) => {
                      if (label === "Faculty Recommended" && step.active) {
                        return `Faculty Rec. (${selectedRequest.facultyRecommendation?.facultyName || 'Verified'})`;
                      }
                      if (label === "Coordinator Approved" && step.active) {
                        const nameVal = selectedRequest.approvalHistory?.find((h: any) => h.role === 'Coordinator' && (h.action === 'Coordinator Approved' || h.action === 'Approved'))?.byName;
                        return `Coord. Approved ${nameVal ? `(${nameVal})` : ''}`;
                      }
                      if (label === "Head Approved" && step.active) {
                        const nameVal = selectedRequest.approvalHistory?.find((h: any) => h.role === 'Head' && (h.action === 'Approved' || h.action === 'Conditional Approval'))?.byName;
                        return `Head Approved ${nameVal ? `(${nameVal})` : ''}`;
                      }
                      return label;
                    };

                    return (
                      <div key={step.label} className="flex items-center flex-1 last:flex-initial">
                        <div className="flex items-center gap-1.5">
                          <span className={`w-4 h-4 rounded-full flex items-center justify-center border text-4xs ${step.active ? 'bg-green-600 border-green-600 text-white' : 'bg-slate-100 border-slate-300 text-slate-400'}`}>
                            {step.active ? "✓" : sIdx + 1}
                          </span>
                          <span className={step.active ? 'text-slate-800 font-bold' : 'text-slate-400 font-normal'}>{getStepLabel(step.label)}</span>
                        </div>
                        {sIdx < arr.length - 1 && (
                          <div className={`flex-1 h-px mx-2 ${step.active ? 'bg-green-600' : 'bg-slate-200'}`} />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Action Buttons Row */}
              <div className="border-t border-slate-100 pt-3">
                {confirmAction ? (
                  <div className="bg-amber-50 border border-amber-200 p-3 rounded-lg flex justify-between items-center text-xs">
                    <div className="text-amber-800 font-semibold flex items-center gap-1.5">
                      <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                      Are you sure you want to {confirmAction === 'approve' ? 'approve' : confirmAction === 'reject' ? 'reject' : 'request changes for'} this request?
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => setConfirmAction(null)}>Cancel</Button>
                      <Button 
                        size="sm" 
                        className={confirmAction === 'reject' ? 'bg-red-600 hover:bg-red-700 text-white' : confirmAction === 'approve' ? 'bg-green-600 hover:bg-green-700 text-white' : 'bg-amber-500 hover:bg-amber-600 text-white'}
                        onClick={() => {
                          handleDecision(selectedRequest._id, confirmAction);
                          setConfirmAction(null);
                        }}
                      >
                        Yes, Confirm
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex justify-between items-center">
                    {['Submitted', 'Faculty Verified', 'Coordinator Review'].includes(selectedRequest.status) ? (
                      <>
                        <div className="flex gap-2">
                          <Button
                            type="button"
                            onClick={() => {
                              if (!decisionRemarks) {
                                toast.error("Remarks explaining rejection are required.");
                                return;
                              }
                              setConfirmAction("reject");
                            }}
                            disabled={processing}
                            className="bg-red-600 hover:bg-red-700 text-white font-semibold text-xs rounded-lg px-4 h-9"
                          >
                            Reject
                          </Button>
                          <Button
                            type="button"
                            onClick={() => {
                              if (!decisionRemarks) {
                                toast.error("Remarks explaining requested changes are required.");
                                return;
                              }
                              setConfirmAction("request_changes");
                            }}
                            disabled={processing}
                            className="bg-amber-500 hover:bg-amber-600 text-white font-semibold text-xs rounded-lg px-4 h-9"
                          >
                            Request Changes
                          </Button>
                        </div>
                        <Button
                          type="button"
                          onClick={() => setConfirmAction("approve")}
                          disabled={processing}
                          className="bg-green-600 hover:bg-green-700 text-white font-semibold text-xs rounded-lg px-4 h-9 flex items-center gap-1.5"
                        >
                          {processing && <span className="animate-spin text-xs">⏳</span>}
                          {selectedRequest.status === 'Submitted' ? 'Approve' : 'Approve & Forward'}
                        </Button>
                      </>
                    ) : ['Approved', 'Conditional Approval', 'Completed'].includes(selectedRequest.status) ? (
                      <div className="flex justify-between items-center w-full">
                        <span className="text-xs font-bold text-green-700 flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" /> Status: {selectedRequest.status}
                        </span>
                        <div className="flex gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                              const token = localStorage.getItem('idea_hub_token');
                              window.open(`${api.defaults.baseURL}/room-permissions/${selectedRequest._id}/pdf${token ? `?token=${token}` : ''}`, "_blank");
                            }}
                            className="border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 text-xs px-3 h-9"
                          >
                            View PDF
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                              const token = localStorage.getItem('idea_hub_token');
                              window.open(`${api.defaults.baseURL}/room-permissions/${selectedRequest._id}/pdf${token ? `?token=${token}` : ''}`, "_blank");
                            }}
                            className="border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 text-xs px-3 h-9"
                          >
                            Download Letter
                          </Button>
                          <Button
                            type="button"
                            onClick={async () => {
                              try {
                                setProcessing(true);
                                await api.post(`/room-permissions/${selectedRequest._id}/send-reminder`);
                                toast.success("Reminder email sent to student!");
                              } catch (err: any) {
                                toast.error(err.response?.data?.message || "Failed to send reminder");
                              } finally {
                                setProcessing(false);
                              }
                            }}
                            disabled={processing}
                            className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-3 h-9 flex items-center gap-1.5"
                          >
                            {processing && <span className="animate-spin text-xs">⏳</span>}
                            Send Reminder
                          </Button>
                        </div>
                      </div>
                    ) : selectedRequest.status === 'Cancelled' ? (
                      <div className="flex justify-between items-center w-full">
                        <div className="space-y-0.5">
                          <span className="text-xs font-bold text-red-700">Status: Cancelled</span>
                          <p className="text-2xs text-slate-500">Reason: Student cancelled the booking</p>
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            const historyEl = document.getElementById("audit-history-section");
                            if (historyEl) {
                              historyEl.scrollIntoView({ behavior: 'smooth' });
                            }
                          }}
                          className="border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 text-xs px-3 h-9"
                        >
                          View Audit Log
                        </Button>
                      </div>
                    ) : (
                      <div className="flex justify-between items-center w-full">
                        <span className="text-xs font-bold text-slate-700">Status: {selectedRequest.status}</span>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setSelectedRequest(null)}
                          className="border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 text-xs px-3 h-9"
                        >
                          Close
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Download Reports Modal */}
      <Dialog open={reportModalOpen} onOpenChange={setReportModalOpen}>
        <DialogContent className="max-w-md bg-white border border-slate-200 rounded-2xl p-6">
          <DialogHeader className="border-b pb-3 -mx-6 -mt-6 p-6 bg-primary/5">
            <DialogTitle className="text-lg font-bold">Download Room Usage Report</DialogTitle>
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
  );
};

export default ManageRoomPermissions;
