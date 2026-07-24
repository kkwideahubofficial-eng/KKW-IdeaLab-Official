import { useState, useEffect } from "react";
import api from "@/lib/axios";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Check, X, Eye, FileDown, Loader2, Calendar, Clock, AlertTriangle, ShieldCheck, CheckCircle2, FileText, RefreshCw, Zap } from "lucide-react";

const formatDate = (dateStr: string) => {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
};

interface Request {
  _id: string;
  requestId: string;
  projectName: string;
  projectCategory: string;
  projectDescription: string;
  projectObjectives: string;
  expectedOutcome: string;
  teamName: string;
  status: string;
  createdAt: string;
  students: { name: string; prn: string; branch: string; year: string; email: string; mobile: string }[];
  requestedMachines: { machineId: any; machineName: string; machineUnitNumber?: number; usageDate: string; startTime: string; endTime: string; usageHours: number; purposeOfUsage: string; specialRequirements: string }[];
  requestedMaterials: { materialId: any; materialName: string; quantityRequired: number }[];
  uploadedFiles?: { designFileUrl?: string; cadFileUrl?: string; circuitDiagramUrl?: string; supportingDocsUrl?: string };
  benefits?: { researchContribution?: string; innovationContribution?: string; patentPossibility?: string; startupPotential?: string };
  approvalHistory?: { date: string; role: string; action: string; remarks: string; byName: string }[];
  coordinatorRemarks?: string;
  coordinatorChecks?: { machineAvailability: boolean; materialAvailability: boolean; projectFeasibility: boolean; studentEligibility: boolean; previousUsageHistory: boolean };
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

const MachineryRequests = () => {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [applicantTypeFilter, setApplicantTypeFilter] = useState<"All" | "Internal" | "External">("All");
  
  // Rejection & Decision state
  const [decisionDialog, setDecisionDialog] = useState<{ open: boolean; id: string | null; action: 'Approved' | 'Rejected' | 'Approved With Conditions' | null }>({
    open: false,
    id: null,
    action: null
  });
  const [decisionRemarks, setDecisionRemarks] = useState("");
  const [conditionsText, setConditionsText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // View details state
  const [viewDialog, setViewDialog] = useState<{ open: boolean; request: Request | null }>({ open: false, request: null });
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

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

  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await fetchRequests(true);
      toast.success("Requests data refreshed!");
    } catch {
      toast.error("Failed to refresh data");
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        fetchRequests(true).catch(err => console.error("Auto refresh requests failed", err));
      }
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchRequests = async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    try {
      const res = await api.get("/machinery/requests");
      setRequests(res.data);
    } catch {
      if (!isSilent) toast.error("Failed to load requests");
    } finally {
      if (!isSilent) setLoading(false);
    }
  };

  const handleDecisionSubmit = async () => {
    if (!decisionDialog.id || !decisionDialog.action) return;
    setSubmitting(true);
    try {
      await api.patch(`/machinery/requests/${decisionDialog.id}/status`, {
        status: decisionDialog.action,
        remarks: decisionDialog.action === 'Approved' ? undefined : decisionRemarks,
        conditions: decisionDialog.action === 'Approved With Conditions' ? conditionsText : undefined
      });
      
      toast.success(`Request marked as ${decisionDialog.action}!`);
      setDecisionDialog({ open: false, id: null, action: null });
      setDecisionRemarks("");
      setConditionsText("");
      fetchRequests();
      
      if (viewDialog.open && viewDialog.request?._id === decisionDialog.id) {
        setViewDialog({ open: false, request: null });
      }
    } catch {
      toast.error("Failed to update status");
    } finally {
      setSubmitting(false);
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
      toast.success('PDF downloaded!');
    } catch {
      toast.error('Failed to download PDF.');
    } finally {
      setDownloadingId(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Approved':
      case 'Completed':
      case 'Material Allocated':
      case 'Machine Scheduled':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'Approved With Conditions':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Pending':
      case 'Submitted':
      case 'Coordinator Approved':
      case 'Coordinator Review':
      case 'Head Review':
      case 'Student Resubmitted':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Changes Requested':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'Rejected':
      case 'Coordinator Rejected':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>;

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="border-b pb-4 mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
            Machinery & Material Requests
          </h1>
          <p className="text-muted-foreground mt-1">
            Review and manage facility usage, resource allocation, and project status.
          </p>
        </div>
        <div className="flex flex-col items-end gap-2 shrink-0 w-full md:w-auto">
          <div className="flex flex-wrap gap-2 items-center w-full md:w-auto justify-end">
            <div className="flex items-center gap-2">
              <Label htmlFor="head-applicant-filter" className="text-xs font-bold text-muted-foreground whitespace-nowrap">Applicant Type:</Label>
              <select 
                id="head-applicant-filter"
                value={applicantTypeFilter} 
                onChange={(e: any) => setApplicantTypeFilter(e.target.value)}
                className="h-8 rounded-md border border-input bg-background px-3 py-1 text-xs shadow-xs focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring cursor-pointer"
              >
                <option value="All">All Applicants</option>
                <option value="Internal">Internal Student</option>
                <option value="External">External User</option>
              </select>
            </div>
            <Button 
              variant="outline"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="flex items-center gap-2 h-8 text-xs font-semibold shrink-0 bg-white border border-border text-slate-700 hover:bg-slate-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
              Refresh
            </Button>
            <Button onClick={() => setReportModalOpen(true)} className="flex items-center gap-2 shadow-sm bg-indigo-600 hover:bg-indigo-700 text-white shrink-0 h-8 text-xs font-semibold">
              <FileText className="w-4 h-4" /> Download Reports
            </Button>
          </div>
          {/* Quick Download Buttons */}
          <div className="flex flex-wrap items-center gap-1.5 bg-slate-50 border border-slate-200/60 p-1 rounded-lg">
            <span className="text-[10px] font-semibold text-muted-foreground px-1.5">Quick Download:</span>
            {['Today', '7 Days', '30 Days', '3 Months', '1 Year'].map((range) => (
              <Button
                key={range}
                variant="ghost"
                className="h-6 text-[10px] px-2 hover:bg-white hover:shadow-2xs text-slate-700 font-medium"
                onClick={() => handleQuickDownload(range)}
              >
                {range}
              </Button>
            ))}
            <Button
              variant="ghost"
              className="h-6 text-[10px] px-2 hover:bg-white hover:shadow-2xs text-primary font-bold"
              onClick={() => handleQuickDownload('Custom')}
            >
              Custom
            </Button>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {requests
          .filter((req: any) => {
            if (applicantTypeFilter === "All") return true;
            if (applicantTypeFilter === "Internal") return req.applicantType === "Internal" || !req.applicantType;
            if (applicantTypeFilter === "External") return req.applicantType === "External";
            return true;
          }).length === 0 ? (
          <p className="text-muted-foreground py-8 text-center text-xs font-semibold">No resource permission requests found matching criteria.</p>
        ) : (
          requests
            .filter((req: any) => {
              if (applicantTypeFilter === "All") return true;
              if (applicantTypeFilter === "Internal") return req.applicantType === "Internal" || !req.applicantType;
              if (applicantTypeFilter === "External") return req.applicantType === "External";
              return true;
            })
            .map((req) => (
              <Card key={req._id} className="overflow-hidden border border-border/80 shadow-xs text-xs">
                <CardHeader className="bg-slate-50/50 pb-3 border-b">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-primary">{req.requestId}</span>
                        <span className="text-muted-foreground font-medium">•</span>
                        <span className="font-semibold text-slate-500">{req.projectCategory}</span>
                        {req.applicantType === 'External' ? (
                          <Badge className="bg-orange-500 hover:bg-orange-600 text-white text-[8px] font-bold">EXTERNAL</Badge>
                        ) : (
                          <Badge className="bg-blue-600 hover:bg-blue-700 text-white text-[8px] font-bold">INTERNAL</Badge>
                        )}
                        {req.approvalHistory?.some((h: any) => h.action?.includes('Urgent') || h.remarks?.includes('URGENT')) && (
                          <Badge className="bg-indigo-600 text-white text-[8px] font-bold">
                            URGENT PERMISSION
                          </Badge>
                        )}
                      </div>
                      <CardTitle className="text-base font-extrabold mt-1">{req.projectName}</CardTitle>
                      <p className="text-3xs text-muted-foreground mt-0.5">
                        Submitted by: {req.applicantType === 'External' ? (
                          <span className="font-bold text-slate-800">{req.externalFullName || "External User"} ({req.externalCollegeOrg || "External Org"})</span>
                        ) : (
                          <>Submitted by <span className="font-bold text-slate-800">{req.students?.[0]?.name || "Student"}</span> ({req.students?.[0]?.branch || "Branch"})</>
                        )}
                      </p>
                    </div>
                    <Badge variant="outline" className={`font-bold text-[9px] uppercase ${getStatusColor(req.status)}`}>
                      {req.status}
                    </Badge>
                  </div>
                </CardHeader>
              <CardContent className="pt-4 grid md:grid-cols-2 gap-4">
                <div className="space-y-2 text-slate-700 font-medium">
                  {req.requestedMachines?.length > 0 && (
                    <p><strong>Machines:</strong> {req.requestedMachines.map(m => m.machineName).join(', ')}</p>
                  )}
                  {req.requestedMaterials?.length > 0 && (
                    <p><strong>Materials:</strong> {req.requestedMaterials.map(m => m.materialName).join(', ')}</p>
                  )}
                  <p><strong>Requested Date:</strong> {req.requestedMachines?.[0]?.usageDate ? formatDate(req.requestedMachines[0].usageDate) : 'N/A'}</p>
                  <p><strong>Time Slot:</strong> {req.requestedMachines?.[0]?.startTime} - {req.requestedMachines?.[0]?.endTime}</p>
                </div>
                
                <div className="flex items-end justify-end gap-2 mt-4 md:mt-0">
                  <Button variant="outline" size="sm" onClick={() => setViewDialog({ open: true, request: req })} className="font-semibold text-xs gap-1">
                    <Eye className="w-3.5 h-3.5" /> View Details
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    disabled={downloadingId === req._id}
                    onClick={() => downloadPdf(req._id, req.requestId)}
                    className="font-semibold text-xs gap-1"
                  >
                    {downloadingId === req._id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileDown className="w-3.5 h-3.5" />}
                    PDF
                  </Button>
                  
                  {['Submitted', 'Coordinator Approved', 'Coordinator Review', 'Head Review', 'Student Resubmitted'].includes(req.status) && (
                    <div className="flex gap-1">
                      <Button 
                        size="sm" 
                        onClick={() => setDecisionDialog({ open: true, id: req._id, action: 'Approved' })} 
                        className="bg-green-600 hover:bg-green-700 text-white font-bold text-xs"
                      >
                        Approve
                      </Button>
                      <Button 
                        size="sm" 
                        onClick={() => setDecisionDialog({ open: true, id: req._id, action: 'Approved With Conditions' })}
                        className="bg-yellow-500 hover:bg-yellow-600 text-white font-bold text-xs"
                      >
                        Cond. Approve
                      </Button>
                      <Button 
                        variant="destructive" 
                        size="sm" 
                        onClick={() => setDecisionDialog({ open: true, id: req._id, action: 'Rejected' })} 
                        className="font-bold text-xs"
                      >
                        Reject
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* ── APPROVE: compact one-click confirmation ─────────────────────── */}
      {decisionDialog.open && decisionDialog.action === 'Approved' && (
        <Dialog open={decisionDialog.open} onOpenChange={(val) => setDecisionDialog({ ...decisionDialog, open: val })}>
          <DialogContent className="max-w-sm text-xs text-slate-700">
            <DialogHeader>
              <DialogTitle className="text-base font-extrabold flex items-center gap-2 text-green-700">
                <CheckCircle2 className="w-5 h-5" /> Confirm Approval
              </DialogTitle>
            </DialogHeader>
            <div className="py-3">
              <p className="text-sm text-slate-600 font-medium">
                Are you sure you want to <span className="font-bold text-green-700">approve</span> this request?
              </p>
              <p className="text-3xs text-muted-foreground mt-2">
                The request will be marked as <b>Approved</b> and the student will be notified immediately.
              </p>
            </div>
            <DialogFooter className="gap-2">
              <Button
                variant="outline"
                disabled={submitting}
                onClick={() => setDecisionDialog({ open: false, id: null, action: null })}
              >
                Cancel
              </Button>
              <Button
                disabled={submitting}
                onClick={handleDecisionSubmit}
                className="bg-green-600 hover:bg-green-700 text-white font-bold gap-2 min-w-[140px]"
              >
                {submitting ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Approving...</> : <><Check className="w-3.5 h-3.5" /> Confirm Approval</>}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* ── REJECT / APPROVE WITH CONDITIONS: full remarks form ──────────── */}
      {decisionDialog.open && decisionDialog.action !== 'Approved' && (
        <Dialog open={decisionDialog.open} onOpenChange={(val) => setDecisionDialog({ ...decisionDialog, open: val })}>
          <DialogContent className="max-w-md text-xs text-slate-700">
            <DialogHeader>
              <DialogTitle className={`text-base font-extrabold flex items-center gap-2 ${
                decisionDialog.action === 'Rejected' ? 'text-red-700' : 'text-yellow-700'
              }`}>
                {decisionDialog.action === 'Rejected'
                  ? <><X className="w-5 h-5" /> Reject Request</>
                  : <><AlertTriangle className="w-5 h-5" /> Approve With Conditions</>
                }
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              {decisionDialog.action === 'Approved With Conditions' && (
                <div className="space-y-1">
                  <Label className="font-bold">Approval Conditions / Constraints <span className="text-red-500">*</span></Label>
                  <Input 
                    value={conditionsText} 
                    onChange={(e) => setConditionsText(e.target.value)} 
                    placeholder="Must be returned by 5 PM, Wear safety gear..."
                  />
                </div>
              )}
              <div className="space-y-1">
                <Label className="font-bold">
                  {decisionDialog.action === 'Rejected' ? 'Rejection Reason' : 'Remarks / Notes'}
                  {decisionDialog.action === 'Rejected' && <span className="text-red-500 ml-1">*</span>}
                </Label>
                <Textarea 
                  placeholder={decisionDialog.action === 'Rejected' ? 'Explain why this request is being rejected...' : 'Optional notes or remarks...'}
                  value={decisionRemarks} 
                  onChange={(e) => setDecisionRemarks(e.target.value)} 
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter className="gap-2">
              <Button
                variant="outline"
                disabled={submitting}
                onClick={() => setDecisionDialog({ open: false, id: null, action: null })}
              >
                Cancel
              </Button>
              <Button 
                disabled={submitting}
                onClick={handleDecisionSubmit}
                className={`font-bold gap-2 min-w-[150px] ${
                  decisionDialog.action === 'Rejected'
                    ? 'bg-red-600 hover:bg-red-700 text-white'
                    : 'bg-yellow-500 hover:bg-yellow-600 text-white'
                }`}
              >
                {submitting
                  ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Processing...</>
                  : decisionDialog.action === 'Rejected'
                    ? <><X className="w-3.5 h-3.5" /> Confirm Rejection</>
                    : <><Check className="w-3.5 h-3.5" /> Confirm Approval</>
                }
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Detailed Request Modal Dialog */}
      {viewDialog.open && viewDialog.request && (
        <Dialog open={viewDialog.open} onOpenChange={(val) => setViewDialog({ ...viewDialog, open: val })}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto text-xs text-slate-700">
            <DialogHeader>
              <div className="flex justify-between border-b pb-2">
                <DialogTitle className="text-base font-extrabold">{viewDialog.request.requestId}: {viewDialog.request.projectName}</DialogTitle>
                <Badge variant="outline" className={`font-bold uppercase ${getStatusColor(viewDialog.request.status)}`}>{viewDialog.request.status}</Badge>
              </div>
            </DialogHeader>
            
            <div className="space-y-6 pt-3">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-bold text-primary mb-1.5 uppercase tracking-wider text-[10px]">Project Scope</h3>
                  <div className="p-3 bg-slate-50 border rounded-md font-medium">
                     <p><strong>Category:</strong> {viewDialog.request.projectCategory}</p>
                     <p className="mt-1"><strong>Description:</strong> {viewDialog.request.projectDescription}</p>
                     <p className="mt-1"><strong>Objectives:</strong> {viewDialog.request.projectObjectives}</p>
                     <p className="mt-1"><strong>Deliverables:</strong> {viewDialog.request.expectedOutcome}</p>
                  </div>
                </div>
                <div>
                   {viewDialog.request.applicantType === 'External' ? (
                     <>
                       <h3 className="font-bold text-orange-600 mb-1.5 uppercase tracking-wider text-[10px]">External Applicant Profile</h3>
                       <div className="p-3 bg-slate-50 border rounded-md font-medium space-y-1">
                         <p><strong>Name:</strong> {viewDialog.request.externalFullName || '-'}</p>
                         <p><strong>Designation:</strong> {viewDialog.request.externalDesignation || '-'}</p>
                         <p><strong>Department:</strong> {viewDialog.request.externalDept || '-'}</p>
                         <p><strong>College/Org:</strong> {viewDialog.request.externalCollegeOrg || '-'}</p>
                         <p><strong>Location:</strong> {viewDialog.request.externalCity || '-'}, {viewDialog.request.externalState || '-'}</p>
                         <p><strong>Email:</strong> {viewDialog.request.externalEmail || '-'}</p>
                         <p><strong>Mobile:</strong> {viewDialog.request.externalMobile || '-'}</p>
                         {viewDialog.request.externalIdentityProof && (
                           <p className="pt-1.5 border-t mt-1.5">
                             <strong>ID Proof: </strong>
                             <a href={viewDialog.request.externalIdentityProof} target="_blank" rel="noreferrer" className="text-orange-600 underline font-bold">View Identity Proof</a>
                           </p>
                         )}
                         <p className="mt-1">
                           <strong>ID Verification: </strong>
                           <span className={`px-2 py-0.5 rounded font-bold text-[9px] ${
                             viewDialog.request.identityVerification === 'Verified' ? 'bg-green-100 text-green-800' :
                             viewDialog.request.identityVerification === 'Rejected' ? 'bg-red-100 text-red-800' :
                             'bg-amber-100 text-amber-800'
                           }`}>
                             {viewDialog.request.identityVerification || 'Pending'}
                           </span>
                         </p>
                       </div>
                     </>
                   ) : (
                      <>
                        <h3 className="font-bold text-primary mb-1.5 uppercase tracking-wider text-[10px]">Student Team Details</h3>
                        <div className="space-y-2">
                          {viewDialog.request.teamName && (
                            <p className="text-xs font-semibold text-slate-700">Team Name: {viewDialog.request.teamName}</p>
                          )}
                          <div className="grid grid-cols-1 gap-2">
                            {viewDialog.request.students?.map((s, idx) => (
                              <div key={idx} className="p-3 bg-slate-50 border rounded-md font-medium space-y-1">
                                <p className="font-bold text-slate-800 text-xs">{s.name}</p>
                                <div className="text-[11px] text-muted-foreground space-y-0.5 font-medium">
                                  <p><strong>PRN Number:</strong> {s.prn || '-'}</p>
                                  <p><strong>Email Address:</strong> {s.email || '-'}</p>
                                  <p><strong>Mobile Number:</strong> {s.mobile || '-'}</p>
                                  <p><strong>Branch/Year:</strong> {s.branch || '-'} / {s.year || '-'}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </>
                   )}
                </div>
              </div>

              {/* Resource separations Machines / Materials */}
              <div className="grid md:grid-cols-2 gap-6 border-t pt-4">
                <div>
                  <h3 className="font-bold text-primary mb-1.5 uppercase tracking-wider text-[10px]">Requested Machinery</h3>
                  <div className="border rounded-md p-3 bg-secondary/5 space-y-2">
                    {viewDialog.request.requestedMachines?.length === 0 ? (
                      <p className="text-muted-foreground text-3xs italic">No machine bookings requested.</p>
                    ) : (
                      viewDialog.request.requestedMachines.map((m, i) => (
                        <div key={i} className="border-b pb-2 last:border-0 last:pb-0">
                          <p className="font-bold text-slate-800">• {m.machineName}</p>
                          <p className="text-3xs text-muted-foreground mt-0.5">
                            <b>Unit:</b> #{m.machineUnitNumber || 1} | <b>Date:</b> {m.usageDate ? new Date(m.usageDate).toLocaleDateString() : 'N/A'} | <b>Slot:</b> {m.startTime} - {m.endTime} ({m.usageHours} hrs)
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="font-bold text-primary mb-1.5 uppercase tracking-wider text-[10px]">Requested Material Allocation</h3>
                  <div className="border rounded-md p-3 bg-secondary/5 space-y-2">
                    {viewDialog.request.requestedMaterials?.length === 0 ? (
                      <p className="text-muted-foreground text-3xs italic">No materials requested.</p>
                    ) : (
                      viewDialog.request.requestedMaterials.map((m, i) => (
                        <div key={i} className="flex justify-between items-center py-1 border-b last:border-0 font-medium">
                          <span>• {m.materialName}</span>
                          <span className="bg-slate-200 text-slate-800 font-bold px-2 py-0.5 rounded font-mono text-[10px]">Qty: {m.quantityRequired}</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              {/* Project Attachment previews/downloads */}
              {viewDialog.request.uploadedFiles && Object.values(viewDialog.request.uploadedFiles).some(Boolean) && (
                <div className="border-t pt-4 space-y-3">
                  <h3 className="font-bold text-primary mb-2 uppercase tracking-wider text-[10px]">Project Attachments</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {[
                      { label: "Design File", url: viewDialog.request.uploadedFiles.designFileUrl },
                      { label: "CAD File", url: viewDialog.request.uploadedFiles.cadFileUrl },
                      { label: "Circuit Diagram", url: viewDialog.request.uploadedFiles.circuitDiagramUrl },
                      { label: "Supporting Documents", url: viewDialog.request.uploadedFiles.supportingDocsUrl }
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

              {/* Coordinator review checks & remarks */}
              <div className="border-t pt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                {(() => {
                  const coordNode = viewDialog.request.approvalHistory?.find((h: any) => h.role?.toUpperCase() === 'COORDINATOR' && (h.action?.includes('Approve') || h.action?.includes('Allocated') || h.action?.includes('Scheduled') || h.action?.includes('Issued') || h.action?.includes('Verified')));
                  const coordName = coordNode?.byName || viewDialog.request.approvalHistory?.find((h: any) => h.role?.toUpperCase() === 'COORDINATOR')?.byName;
                  return (
                    <>
                      <div>
                        <h3 className="font-bold text-primary mb-1.5 uppercase tracking-wider text-[10px]">
                          Coordinator Review Checks {coordName ? `(by ${coordName})` : ''}
                        </h3>
                        <div className="p-3 border rounded bg-slate-50 space-y-1 text-3xs font-semibold">
                          <p className={viewDialog.request.coordinatorChecks?.machineAvailability ? 'text-green-700' : 'text-slate-500'}>
                            {viewDialog.request.coordinatorChecks?.machineAvailability ? '✓' : '✗'} Machine Slot Availability Check
                          </p>
                          <p className={viewDialog.request.coordinatorChecks?.materialAvailability ? 'text-green-700' : 'text-slate-500'}>
                            {viewDialog.request.coordinatorChecks?.materialAvailability ? '✓' : '✗'} Materials stock reservation check
                          </p>
                          <p className={viewDialog.request.coordinatorChecks?.projectFeasibility ? 'text-green-700' : 'text-slate-500'}>
                            {viewDialog.request.coordinatorChecks?.projectFeasibility ? '✓' : '✗'} Project feasibility evaluation
                          </p>
                          <p className={viewDialog.request.coordinatorChecks?.studentEligibility ? 'text-green-700' : 'text-slate-500'}>
                            {viewDialog.request.coordinatorChecks?.studentEligibility ? '✓' : '✗'} Applicant eligibility checked
                          </p>
                        </div>
                      </div>
                      <div>
                        <h3 className="font-bold text-primary mb-1.5 uppercase tracking-wider text-[10px]">
                          Coordinator Remarks {coordName ? `(by ${coordName})` : ''}
                        </h3>
                        <p className="p-3 border rounded bg-slate-50 italic">
                          "{viewDialog.request.coordinatorRemarks || 'No remarks added by Coordinator.'}"
                        </p>
                      </div>
                    </>
                  );
                })()}
              </div>

              {/* External User Team Details */}
              {viewDialog.request.applicantType === 'External' && viewDialog.request.externalApplicantType === 'Team' && (
                <div className="border-t pt-4">
                  <h3 className="font-bold text-orange-600 mb-1.5 uppercase tracking-wider text-[10px]">Team Details: {viewDialog.request.teamName}</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {viewDialog.request.externalTeamMembers?.map((m: any, idx: number) => (
                      <div key={idx} className="p-2 border rounded bg-slate-50">
                        <p className="font-bold text-slate-800">{m.name}</p>
                        <p className="text-[10px] text-muted-foreground">{m.email} | {m.mobile}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Usage Charges Block */}
              {viewDialog.request.applicantType === 'External' && (viewDialog.request.totalCharges > 0 || viewDialog.request.paymentStatus) && (
                <div className="border-t pt-4">
                  <h3 className="font-bold text-blue-800 mb-1.5 uppercase tracking-wider text-[10px]">Usage Charges & Fee Allocation</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 border p-3 rounded-md bg-blue-50/15 border-blue-100 font-medium">
                    <p><strong>Machine Charges:</strong> ₹{viewDialog.request.machineCharges || 0}</p>
                    <p><strong>Material Charges:</strong> ₹{viewDialog.request.materialCharges || 0}</p>
                    <p><strong>Total Charges:</strong> <span className="font-bold text-blue-700">₹{viewDialog.request.totalCharges || 0}</span></p>
                    <p className="sm:col-span-3 pt-1.5 border-t">
                      <strong>Payment Status: </strong>
                      <span className={`px-2 py-0.5 rounded font-bold text-[9px] ${
                        viewDialog.request.paymentStatus === 'Paid' ? 'bg-green-100 text-green-800' :
                        viewDialog.request.paymentStatus === 'Waived' ? 'bg-blue-100 text-blue-800' :
                        'bg-amber-100 text-amber-800'
                      }`}>
                        {viewDialog.request.paymentStatus || 'Pending'}
                      </span>
                    </p>
                  </div>
                </div>
              )}

              {/* Approval History log */}
              {viewDialog.request.approvalHistory && viewDialog.request.approvalHistory.length > 0 && (
                <div className="border-t pt-4">
                  <h3 className="font-bold text-primary mb-2 uppercase tracking-wider text-[10px]">Approval History Logs</h3>
                  <div className="space-y-2 border rounded-md p-3 bg-slate-50/50">
                    {viewDialog.request.approvalHistory.map((h, i) => (
                      <div key={i} className="flex justify-between items-start border-b border-border/40 pb-2 last:border-0 last:pb-0">
                        <div>
                          <div className="font-semibold text-foreground flex items-center gap-1.5">
                            <Badge variant="secondary" className="text-[8px] uppercase tracking-wide font-bold">{h.role}</Badge>
                            <span>{h.action} {h.byName ? `(${h.byName})` : ''}</span>
                          </div>
                          {h.remarks && <p className="text-3xs text-muted-foreground mt-0.5">Remarks: {h.remarks.replace(/⚡\s*/g, '')}</p>}
                        </div>
                        <span className="text-3xs text-muted-foreground font-mono self-center">
                          {new Date(h.date).toLocaleDateString()}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <DialogFooter className="pt-4 border-t flex flex-wrap gap-2 justify-end">
              <Button variant="outline" onClick={() => setViewDialog({ open: false, request: null })}>Close Details</Button>
              {['Submitted', 'Coordinator Approved', 'Coordinator Review', 'Head Review', 'Student Resubmitted'].includes(viewDialog.request.status) && (
                <div className="flex gap-1.5">
                  <Button 
                    onClick={() => setDecisionDialog({ open: true, id: viewDialog.request?._id || null, action: 'Approved' })} 
                    className="bg-green-600 hover:bg-green-700 text-white font-bold"
                  >
                    Approve
                  </Button>
                  <Button 
                    onClick={() => setDecisionDialog({ open: true, id: viewDialog.request?._id || null, action: 'Approved With Conditions' })}
                    className="bg-yellow-500 hover:bg-yellow-600 text-white font-bold"
                  >
                    Cond. Approve
                  </Button>
                  <Button 
                    variant="destructive" 
                    onClick={() => setDecisionDialog({ open: true, id: viewDialog.request?._id || null, action: 'Rejected' })} 
                    className="font-bold"
                  >
                    Reject
                  </Button>
                </div>
              )}
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
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold"
            >
              Generate Report
            </Button>
          </div>
        </DialogContent>
      </Dialog>

    </div>
  );
};

export default MachineryRequests;
