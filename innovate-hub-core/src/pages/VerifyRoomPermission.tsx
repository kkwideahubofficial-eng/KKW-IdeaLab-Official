import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import api from "@/lib/axios";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { CheckCircle, XCircle, AlertTriangle, ShieldCheck, User, Calendar, Clock, FileText } from "lucide-react";

const VerifyRoomPermission = () => {
  const { requestId } = useParams();
  const [request, setRequest] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchVerificationDetails = async () => {
      try {
        // Fetch from public verification endpoint
        const res = await api.get(`/room-permissions/${requestId}/verify-public`);
        setRequest(res.data);
      } catch (err: any) {
        setError(err.response?.data?.message || "Failed to load verification details.");
      } finally {
        setLoading(false);
      }
    };
    if (requestId) fetchVerificationDetails();
  }, [requestId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="text-xs text-muted-foreground">Verifying Room Permission details...</div>
      </div>
    );
  }

  const isValid = request && ["Approved", "Conditional Approval", "Completed"].includes(request.status);

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-xl border-t-4 border-primary overflow-hidden">
        
        {/* Verification Status Header */}
        <div className={`p-6 text-center ${isValid ? 'bg-green-50/50' : 'bg-red-50/50'}`}>
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white shadow-md mb-3">
            {isValid ? (
              <ShieldCheck className="w-10 h-10 text-green-600 animate-pulse" />
            ) : (
              <XCircle className="w-10 h-10 text-red-600" />
            )}
          </div>
          
          <h2 className={`text-xl font-extrabold tracking-tight ${isValid ? 'text-green-800' : 'text-red-800'}`}>
            {isValid ? "VERIFICATION VALID" : "VERIFICATION INVALID"}
          </h2>
          <p className="text-2xs text-muted-foreground mt-1">
            AICTE IDEA Lab Digital Security System
          </p>
        </div>

        <CardContent className="p-6 space-y-6 text-xs">
          {error || !request ? (
            <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 text-red-800 rounded">
              <AlertTriangle className="w-5 h-5 text-red-600 shrink-0" />
              <div>
                <p className="font-semibold">Error Loading Request</p>
                <p className="text-3xs mt-1">The request ID is incorrect or the booking has been deleted from the database.</p>
              </div>
            </div>
          ) : (
            <>
              {/* Request ID & Room Details */}
              <div className="space-y-3">
                <div className="flex justify-between border-b pb-2">
                  <span className="text-muted-foreground">Request ID:</span>
                  <span className="font-mono font-bold text-primary">{request.requestId}</span>
                </div>
                <div className="flex justify-between border-b pb-2">
                  <span className="text-muted-foreground">Facility Required:</span>
                  <span className="font-semibold">{request.facilityRequired}</span>
                </div>
                <div className="flex justify-between border-b pb-2">
                  <span className="text-muted-foreground">Approval Status:</span>
                  <span className={`font-bold uppercase ${isValid ? 'text-green-600' : 'text-red-600'}`}>
                    {request.status}
                  </span>
                </div>
              </div>

              {/* Booking Info Card */}
              <div className="bg-secondary/15 p-4 rounded-lg space-y-2 border">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-primary" />
                  <div>
                    <div className="font-bold text-foreground">{request.applicantDetails.applicantName}</div>
                    <div className="text-3xs text-muted-foreground">{request.applicantDetails.department} (PRN: {request.applicantDetails.prn})</div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 pt-2 border-t mt-2">
                  <Calendar className="w-4 h-4 text-primary" />
                  <div className="font-semibold">{request.schedule.requestedDate}</div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-primary" />
                  <div className="font-semibold">{request.schedule.startTime} - {request.schedule.endTime} ({request.schedule.duration} Hours)</div>
                </div>

                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-primary" />
                  <div className="font-semibold truncate">Project: {request.teamDetails.projectName}</div>
                </div>
              </div>

              {/* Digital Signatures check */}
              <div className="border-t pt-4 space-y-3">
                <h4 className="font-bold text-primary text-xs uppercase tracking-wider mb-2">Digital Signature Logs</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="border p-2.5 rounded bg-slate-50 text-center">
                    <div className="font-semibold text-2xs text-muted-foreground">Faculty Advisor</div>
                    <div className="text-xs font-bold text-green-700 mt-1 flex flex-col items-center justify-center gap-0.5">
                      <div className="flex items-center gap-1">
                        <CheckCircle className="w-3.5 h-3.5" /> VERIFIED
                      </div>
                      <span className="text-[10px] text-muted-foreground font-normal">Prof. {request.facultyRecommendation?.facultyName}</span>
                    </div>
                  </div>
                  <div className="border p-2.5 rounded bg-slate-50 text-center">
                    <div className="font-semibold text-2xs text-muted-foreground">Coordinator</div>
                    <div className={`text-xs font-bold mt-1 flex flex-col items-center justify-center gap-0.5 ${request.approvalHistory?.some((h: any) => h.role === 'Coordinator') ? 'text-green-700' : 'text-amber-600'}`}>
                      {request.approvalHistory?.some((h: any) => h.role === 'Coordinator') ? (
                        <>
                          <div className="flex items-center gap-1">
                            <CheckCircle className="w-3.5 h-3.5" /> APPROVED
                          </div>
                          <span className="text-[10px] text-muted-foreground font-normal">
                            {request.approvalHistory?.find((h: any) => h.role === 'Coordinator')?.byName || 'Coordinator'}
                          </span>
                        </>
                      ) : (
                        <div className="flex items-center gap-1">
                          <AlertTriangle className="w-3.5 h-3.5" /> PENDING
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <div className="border p-2.5 rounded bg-slate-50 text-center mt-2">
                  <div className="font-semibold text-2xs text-muted-foreground">AICTE IDEA Lab Head</div>
                  <div className={`text-xs font-bold mt-1 flex flex-col items-center justify-center gap-0.5 ${isValid ? 'text-green-700' : 'text-red-700'}`}>
                    {isValid ? (
                      <>
                        <div className="flex items-center gap-1">
                          <CheckCircle className="w-3.5 h-3.5" /> SIGNED
                        </div>
                        <span className="text-[10px] text-muted-foreground font-normal">
                          {request.approvalHistory?.find((h: any) => h.role === 'Head')?.byName || 'AICTE IDEA Lab Head'}
                        </span>
                      </>
                    ) : (
                      <div className="flex items-center gap-1">
                        <XCircle className="w-3.5 h-3.5" /> UNSIGNED
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default VerifyRoomPermission;
