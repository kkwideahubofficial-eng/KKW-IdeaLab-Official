import { useState, useEffect } from "react";
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
  Calendar as CalendarIcon,
  Search,
  Filter,
  CheckCircle,
  XCircle,
  Clock,
  ArrowRight,
  User,
  Info,
  TrendingUp,
  Sliders,
  ChevronLeft,
  ChevronRight,
  Percent,
  AlertTriangle,
  RotateCcw,
  Check,
  AlertCircle,
  FileText,
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

const HeadRoomPermissions = () => {
  const [requests, setRequests] = useState<any[]>([]);
  const [stats, setStats] = useState({ pending: 0, approved: 0, rejected: 0, conditional: 0, resourceUtilization: 15 });
  const [analytics, setAnalytics] = useState<any>(null);
  const [calendarBookings, setCalendarBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [roomFilter, setRoomFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("");
  const [branchFilter, setBranchFilter] = useState("all");
  const [yearFilter, setYearFilter] = useState("all");

  // Selected Date on Calendar
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<string>("");

  // Dialog State
  const [selectedRequest, setSelectedRequest] = useState<any | null>(null);
  const [decisionRemarks, setDecisionRemarks] = useState("");
  const [conditionsInput, setConditionsInput] = useState("");
  const [processing, setProcessing] = useState(false);
  const [confirmAction, setConfirmAction] = useState<"approve" | "reject" | "conditional" | "forward_back" | "request_changes" | null>(null);

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
        fetchStats(),
        fetchAnalytics(),
        fetchCalendarBookings()
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
    fetchAnalytics();
    fetchCalendarBookings();
  }, [search, statusFilter, roomFilter, dateFilter, branchFilter, yearFilter]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        Promise.all([
          fetchRequests(true),
          fetchStats(),
          fetchAnalytics(),
          fetchCalendarBookings()
        ]).catch(err => console.error("Auto refresh head room permissions failed", err));
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
      if (!isSilent) toast.error("Failed to load requests.");
    } finally {
      if (!isSilent) setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await api.get("/room-permissions/head-stats");
      setStats(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchAnalytics = async () => {
    try {
      const res = await api.get("/room-permissions/analytics");
      setAnalytics(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchCalendarBookings = async () => {
    try {
      const res = await api.get("/room-permissions/calendar-bookings");
      setCalendarBookings(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleHeadDecision = async (id: string, decision: string) => {
    if ((decision === "reject" || decision === "request_changes" || decision === "forward_back") && !decisionRemarks) {
      toast.error("Please enter remarks for this action.");
      return;
    }
    if (decision === "conditional" && !conditionsInput) {
      toast.error("Please enter conditions for approval.");
      return;
    }

    try {
      setProcessing(true);
      await api.put(`/room-permissions/${id}/head-decision`, {
        decision,
        remarks: decisionRemarks,
        conditions: conditionsInput
      });

      toast.success(`Request status updated: ${decision.replace('_', ' ').toUpperCase()}`);
      setSelectedRequest(null);
      setDecisionRemarks("");
      setConditionsInput("");
      setConfirmAction(null);
      fetchRequests();
      fetchStats();
      fetchAnalytics();
      fetchCalendarBookings();
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

  // Calendar helpers
  const handleMonthChange = (offset: number) => {
    const nextDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + offset, 1);
    setCurrentDate(nextDate);
  };

  const getCalendarDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const totalDays = new Date(year, month + 1, 0).getDate();
    
    const days = [];
    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }
    for (let i = 1; i <= totalDays; i++) {
      days.push(new Date(year, month, i));
    }
    return days;
  };

  const getCalendarDateStatus = (dateStr: string) => {
    const bookings = calendarBookings.filter(b => b.date === dateStr);
    if (bookings.length === 0) return "bg-slate-50 border-slate-200 text-slate-400";
    
    // Check if contains approved, conditional, rejected, or completed
    const hasApproved = bookings.some(b => b.status === "Approved");
    const hasConditional = bookings.some(b => b.status === "Conditional Approval");
    const hasRejected = bookings.some(b => b.status === "Rejected");
    const hasCompleted = bookings.some(b => b.status === "Completed");

    if (hasApproved) return "bg-blue-100 border-blue-300 text-blue-800 font-semibold";
    if (hasConditional) return "bg-amber-100 border-amber-300 text-amber-800 font-semibold";
    if (hasRejected) return "bg-red-100 border-red-300 text-red-800 font-semibold";
    if (hasCompleted) return "bg-slate-200 border-slate-300 text-slate-800";

    return "bg-slate-50 border-slate-200";
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="border-b pb-4 mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            AICTE IDEA Lab Head: Approvals & Analytics
          </h1>
          <p className="text-muted-foreground mt-1">
            Make final decisions on room bookings, review facility usage analytics, and track monthly schedules.
          </p>
        </div>
        <div className="flex flex-col items-end gap-2 shrink-0">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="flex items-center gap-2 shadow-xs shrink-0 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`} />
              Refresh
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

      {/* Head Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 mb-8">
        <Card className="bg-amber-50 border-amber-200 text-amber-700">
          <CardContent className="p-4 text-center">
            <div className="text-xs font-bold uppercase tracking-wider">Pending Head Action</div>
            <div className="text-3xl font-extrabold mt-2">{stats.pending}</div>
          </CardContent>
        </Card>
        <Card className="bg-green-50 border-green-200 text-green-700">
          <CardContent className="p-4 text-center">
            <div className="text-xs font-bold uppercase tracking-wider">Approved Requests</div>
            <div className="text-3xl font-extrabold mt-2">{stats.approved}</div>
          </CardContent>
        </Card>
        <Card className="bg-red-50 border-red-200 text-red-700">
          <CardContent className="p-4 text-center">
            <div className="text-xs font-bold uppercase tracking-wider">Rejected Requests</div>
            <div className="text-3xl font-extrabold mt-2">{stats.rejected}</div>
          </CardContent>
        </Card>
        <Card className="bg-yellow-50 border-yellow-200 text-yellow-700">
          <CardContent className="p-4 text-center">
            <div className="text-xs font-bold uppercase tracking-wider">Conditional Approvals</div>
            <div className="text-3xl font-extrabold mt-2">{stats.conditional}</div>
          </CardContent>
        </Card>
        <Card className="bg-indigo-50 border-indigo-200 text-indigo-700">
          <CardContent className="p-4 text-center">
            <div className="text-xs font-bold uppercase tracking-wider">Resource Utilization</div>
            <div className="text-3xl font-extrabold mt-2">{stats.resourceUtilization}%</div>
            {/* Simple horizontal progress bar */}
            <div className="w-full bg-indigo-200/50 rounded-full h-1.5 mt-2">
              <div className="bg-indigo-600 h-1.5 rounded-full" style={{ width: `${stats.resourceUtilization}%` }}></div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Requests table list for Head review */}
      <Card className="mb-8">
        <CardHeader className="border-b py-4">
          <CardTitle className="text-md flex items-center gap-2">
            <Sliders className="w-4 h-4 text-primary" /> Approvals Action Queue
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {requests.length > 0 ? (
            <div className="overflow-x-auto text-xs">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b bg-muted/50 font-bold uppercase text-muted-foreground">
                    <th className="p-4">Request ID</th>
                    <th className="p-4">Student</th>
                    <th className="p-4">Room Type</th>
                    <th className="p-4">Requested Date</th>
                    <th className="p-4">Time Slot</th>
                    <th className="p-4 text-center">Status</th>
                    <th className="p-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {requests.map(req => (
                    <tr key={req._id} className="border-b hover:bg-secondary/5">
                      <td className="p-4 font-mono font-bold text-primary">{req.requestId}</td>
                      <td className="p-4">
                        <div className="font-medium">{req.applicantDetails.applicantName}</div>
                        <div className="text-3xs text-muted-foreground">{req.applicantDetails.department}</div>
                      </td>
                      <td className="p-4 font-semibold">{req.facilityRequired}</td>
                      <td className="p-4">{req.schedule.requestedDate}</td>
                      <td className="p-4 font-medium">{req.schedule.startTime} - {req.schedule.endTime}</td>
                      <td className="p-4 text-center">
                        <span className={`px-2 py-0.5 rounded text-3xs font-extrabold uppercase ${
                          req.status === 'Approved' ? 'bg-green-100 text-green-700' :
                          req.status === 'Rejected' ? 'bg-red-100 text-red-700' :
                          req.status === 'Conditional Approval' ? 'bg-amber-100 text-amber-700' :
                          'bg-blue-100 text-blue-700'
                        }`}>
                          {req.status}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <Button variant="outline" size="sm" onClick={() => { setSelectedRequest(req); setConfirmAction(null); }}>
                          Review Request
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-8 text-center text-muted-foreground text-xs">No pending approvals queue.</div>
          )}
        </CardContent>
      </Card>

      {/* Analytics & Calendar Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        
        {/* Booking Calendar Column */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between pb-3 border-b">
            <div>
              <CardTitle className="text-md">AICTE IDEA Lab Monthly Calendar</CardTitle>
              <CardDescription className="text-2xs">Review color-coded schedule overview.</CardDescription>
            </div>
            <div className="flex items-center gap-1">
              <Button variant="outline" size="sm" onClick={() => handleMonthChange(-1)}><ChevronLeft className="w-3.5 h-3.5" /></Button>
              <span className="font-bold text-xs w-28 text-center">
                {currentDate.toLocaleString('default', { month: 'short', year: 'numeric' })}
              </span>
              <Button variant="outline" size="sm" onClick={() => handleMonthChange(1)}><ChevronRight className="w-3.5 h-3.5" /></Button>
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="grid grid-cols-7 gap-1 text-center text-3xs font-bold mb-1">
              <div>Su</div><div>Mo</div><div>Tu</div><div>We</div><div>Th</div><div>Fr</div><div>Sa</div>
            </div>
            <div className="grid grid-cols-7 gap-1">
              {getCalendarDays().map((day, idx) => {
                if (!day) return <div key={`empty-${idx}`} className="h-10 bg-muted/10 rounded" />;
                const dateStr = day.toISOString().split('T')[0];
                const statusColor = getCalendarDateStatus(dateStr);
                const isSelected = selectedCalendarDate === dateStr;

                return (
                  <button
                    key={dateStr}
                    onClick={() => setSelectedCalendarDate(dateStr)}
                    className={`h-10 border rounded flex flex-col justify-between p-1 text-left text-2xs hover:bg-secondary/20 transition ${statusColor} ${isSelected ? 'ring-2 ring-primary' : ''}`}
                  >
                    <span className="font-bold">{day.getDate()}</span>
                  </button>
                );
              })}
            </div>

            {/* Legends */}
            <div className="flex justify-center gap-3 text-3xs mt-4 pt-3 border-t">
              <div className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-blue-100 border border-blue-300 rounded block" /> Approved</div>
              <div className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-amber-100 border border-amber-300 rounded block" /> Conditional</div>
              <div className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-red-100 border border-red-300 rounded block" /> Rejected</div>
              <div className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-slate-200 border border-slate-300 rounded block" /> Completed</div>
            </div>
          </CardContent>
        </Card>

        {/* Analytics Column */}
        <Card>
          <CardHeader className="border-b pb-3">
            <CardTitle className="text-md flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-primary" /> Facility Usage Analytics
            </CardTitle>
            <CardDescription className="text-2xs">Real-time room occupancy and trends.</CardDescription>
          </CardHeader>
          <CardContent className="pt-4 space-y-5 text-2xs">
            {analytics ? (
              <>
                {/* Most used room */}
                <div className="bg-primary/5 p-3 rounded border border-primary/20 flex justify-between items-center">
                  <div>
                    <div className="font-bold text-primary">Most Used Room:</div>
                    <div className="text-sm font-extrabold mt-1 text-foreground">{analytics.mostUsedRoom}</div>
                  </div>
                  <Percent className="w-8 h-8 text-primary/40" />
                </div>

                {/* Usage percentages list */}
                <div className="space-y-2.5">
                  <div className="font-bold border-b pb-1">Room Usage Breakdown:</div>
                  {[
                    { label: "Conference Room", val: analytics.percentages.conference, color: "bg-blue-600" },
                    { label: "Discussion Room", val: analytics.percentages.discussion, color: "bg-amber-500" },
                    { label: "Ideation Room", val: analytics.percentages.ideation, color: "bg-indigo-600" }
                  ].map(item => (
                    <div key={item.label}>
                      <div className="flex justify-between font-semibold mb-1">
                        <span>{item.label}</span>
                        <span>{item.val}%</span>
                      </div>
                      <div className="w-full bg-secondary rounded-full h-1.5">
                        <div className={`h-1.5 rounded-full ${item.color}`} style={{ width: `${item.val}%` }} />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Peak hours */}
                <div>
                  <div className="font-bold border-b pb-1 mb-2">Peak Usage Hours:</div>
                  <div className="space-y-1">
                    {analytics.peakUsageHours.slice(0, 3).map((ph: any) => (
                      <div key={ph.hour} className="flex justify-between items-center text-3xs border-b pb-1">
                        <span>Time range: <b className="text-primary">{ph.hour}</b></span>
                        <span className="bg-secondary px-1.5 py-0.5 rounded font-semibold">{ph.bookings} bookings</span>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center text-muted-foreground p-8">Loading analytics...</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Selected Calendar Date details */}
      {selectedCalendarDate && (
        <Card className="mb-8 border-primary/30">
          <CardHeader className="py-3 bg-secondary/10 border-b">
            <CardTitle className="text-sm font-semibold">Calendar Bookings on: {selectedCalendarDate}</CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            {calendarBookings.filter(b => b.date === selectedCalendarDate).length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {calendarBookings.filter(b => b.date === selectedCalendarDate).map((bk, idx) => (
                  <div key={idx} className="border p-3 rounded-lg text-2xs space-y-1 relative">
                    <span className={`absolute top-2 right-2 px-1.5 py-0.5 rounded font-extrabold text-3xs uppercase ${
                      bk.status === 'Approved' ? 'bg-blue-100 text-blue-700' :
                      bk.status === 'Conditional Approval' ? 'bg-amber-100 text-amber-700' :
                      bk.status === 'Rejected' ? 'bg-red-100 text-red-700' : 'bg-slate-200 text-slate-700'
                    }`}>
                      {bk.status}
                    </span>
                    <div className="font-bold text-xs text-primary">{bk.room}</div>
                    <div><b>Project:</b> {bk.title.split(' - ')[1]}</div>
                    <div><b>Student:</b> {bk.bookedBy}</div>
                    <div className="flex items-center gap-1 font-semibold text-primary/80 mt-2">
                      <Clock className="w-3.5 h-3.5" /> {bk.startTime} - {bk.endTime}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground text-center p-4">No bookings approved/scheduled on this date.</p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Head Review Modal */}
      {selectedRequest && (
        <Dialog open={!!selectedRequest} onOpenChange={() => setSelectedRequest(null)}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-white border border-slate-200 rounded-2xl p-6">
            <DialogHeader className="border-b pb-3 bg-primary/5 -mx-6 -mt-6 p-6 flex flex-row items-center justify-between">
              <div>
                <DialogTitle className="text-lg">Head Booking Approval</DialogTitle>
                <DialogDescription className="text-xs">
                  Provide final decision on booking for {selectedRequest.facilityRequired}.
                </DialogDescription>
              </div>
              <span className="font-mono text-sm bg-primary/10 text-primary px-3 py-1.5 rounded font-bold shrink-0">{selectedRequest.requestId}</span>
            </DialogHeader>

            <div className="space-y-6 pt-4 text-xs">
              {/* Core Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-b pb-4">
                <div>
                  <h4 className="font-bold text-primary mb-2">Facility & Schedule</h4>
                  <div className="space-y-1.5 text-xs">
                    <div><span className="text-muted-foreground">Required Room:</span> <span className="font-semibold">{selectedRequest.facilityRequired}</span></div>
                    <div><span className="text-muted-foreground">Category / Purpose:</span> <span className="font-semibold">{selectedRequest.category} / {selectedRequest.purpose}</span></div>
                    <div><span className="text-muted-foreground">Date:</span> <span className="font-semibold">{selectedRequest.schedule.requestedDate}</span></div>
                    <div><span className="text-muted-foreground">Time range:</span> <span className="font-semibold text-primary">{selectedRequest.schedule.startTime} - {selectedRequest.schedule.endTime} ({selectedRequest.schedule.duration} Hours)</span></div>
                  </div>
                </div>
                <div>
                  <h4 className="font-bold text-primary mb-2">Student Team details</h4>
                  <div className="space-y-1.5 text-xs">
                    <div><span className="text-muted-foreground">Student:</span> <span className="font-semibold">{selectedRequest.applicantDetails.applicantName} (PRN: {selectedRequest.applicantDetails.prn})</span></div>
                    <div><span className="text-muted-foreground">Branch / Year:</span> <span className="font-semibold">{selectedRequest.applicantDetails.department} - {selectedRequest.applicantDetails.year} (Div: {selectedRequest.applicantDetails.division})</span></div>
                    <div><span className="text-muted-foreground">Project Name:</span> <span className="font-semibold">{selectedRequest.teamDetails.projectName}</span></div>
                    <div><span className="text-muted-foreground">Team Size:</span> <span className="font-semibold">{selectedRequest.teamDetails.participantsCount} Persons</span></div>
                  </div>
                </div>
              </div>

              {/* Resource checklist & Faculty details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-b pb-4">
                <div>
                  <h4 className="font-bold text-primary mb-2">Resources requested</h4>
                  <div className="space-y-1.5 text-xs">
                    <div><span className="text-muted-foreground">Equipment:</span> {selectedRequest.resourceRequirements?.requiredEquipment?.join(", ") || "None"}</div>
                    <div><span className="text-muted-foreground">Other:</span> {selectedRequest.resourceRequirements?.otherEquipment || "None"}</div>
                    <div><span className="text-muted-foreground">Special notes:</span> {selectedRequest.specialRequirements || "None"}</div>
                  </div>
                </div>
                <div>
                  <h4 className="font-bold text-primary mb-2">Faculty Recommendation</h4>
                  <div className="space-y-1.5 text-xs">
                    <div><span className="text-muted-foreground">Advisor:</span> <span className="font-semibold">{selectedRequest.facultyRecommendation.facultyName}</span></div>
                    <div><span className="text-muted-foreground">Remarks:</span> <span className="font-semibold italic">"{selectedRequest.facultyRecommendation.facultyRemarks || 'None'}"</span></div>
                    <div><span className="text-muted-foreground">Verified Date:</span> {selectedRequest.facultyRecommendation.verifiedAt ? new Date(selectedRequest.facultyRecommendation.verifiedAt).toLocaleDateString() : "Pending"}</div>
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
              {/* Approval Remarks and Conditions Inputs */}
              {selectedRequest.status === "IDEA Hub Head Review" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs font-semibold text-slate-700">Approval Remarks / Feedback</Label>
                    <Textarea
                      placeholder="Add head evaluation remarks or feedback (Required for Rejection, Request Changes, or Returning)..."
                      value={decisionRemarks}
                      onChange={(e) => setDecisionRemarks(e.target.value)}
                      className="h-16 mt-1 bg-background text-xs"
                    />
                  </div>
                  <div>
                    <Label className="text-xs font-semibold text-slate-700">Conditions (Required ONLY for Conditional Approval)</Label>
                    <Input
                      placeholder="e.g. Must bring advisor, vacate before 4PM..."
                      value={conditionsInput}
                      onChange={(e) => setConditionsInput(e.target.value)}
                      className="mt-1 bg-background text-xs h-9"
                    />
                  </div>
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
                      Are you sure you want to {confirmAction === 'approve' ? 'approve' : confirmAction === 'reject' ? 'reject' : confirmAction === 'conditional' ? 'conditionally approve' : confirmAction === 'forward_back' ? 'return to Coordinator' : 'request changes for'} this request?
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => setConfirmAction(null)}>Cancel</Button>
                      <Button 
                        size="sm" 
                        className={confirmAction === 'reject' ? 'bg-red-600 hover:bg-red-700 text-white' : confirmAction === 'approve' ? 'bg-green-600 hover:bg-green-700 text-white' : 'bg-amber-500 hover:bg-amber-600 text-white'}
                        onClick={() => {
                          handleHeadDecision(selectedRequest._id, confirmAction);
                          setConfirmAction(null);
                        }}
                      >
                        Yes, Confirm
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex justify-between items-center">
                    {selectedRequest.status === "IDEA Hub Head Review" ? (
                      <>
                        <div className="flex flex-wrap gap-2">
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
                            className="bg-red-600 hover:bg-red-700 text-white font-semibold text-xs rounded-lg px-3 h-9"
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
                            className="bg-amber-500 hover:bg-amber-600 text-white font-semibold text-xs rounded-lg px-3 h-9"
                          >
                            Request Changes
                          </Button>
                          <Button
                            type="button"
                            onClick={() => {
                              if (!decisionRemarks) {
                                toast.error("Remarks explaining why you are returning are required.");
                                return;
                              }
                              setConfirmAction("forward_back");
                            }}
                            disabled={processing}
                            className="border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 text-xs px-3 h-9 font-semibold"
                          >
                            Return to Coordinator
                          </Button>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            type="button"
                            onClick={() => {
                              if (!conditionsInput) {
                                toast.error("Conditions are required for conditional approval.");
                                return;
                              }
                              setConfirmAction("conditional");
                            }}
                            disabled={processing}
                            className="bg-amber-500 hover:bg-amber-600 text-white font-semibold text-xs rounded-lg px-3 h-9"
                          >
                            Conditional Approval
                          </Button>
                          <Button
                            type="button"
                            onClick={() => setConfirmAction("approve")}
                            disabled={processing}
                            className="bg-green-600 hover:bg-green-700 text-white font-semibold text-xs rounded-lg px-3 h-9 flex items-center gap-1.5"
                          >
                            {processing && <span className="animate-spin text-xs">⏳</span>}
                            Final Approve
                          </Button>
                        </div>
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

export default HeadRoomPermissions;
