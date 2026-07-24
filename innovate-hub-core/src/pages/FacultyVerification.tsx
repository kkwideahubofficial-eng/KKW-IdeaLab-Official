import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import api from "@/lib/axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";
import { CheckCircle2, AlertTriangle, ShieldCheck, Mail, User, Clock, FileText, Info } from "lucide-react";

const FacultyVerification = () => {
  const { requestId } = useParams();
  const [request, setRequest] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [remarks, setRemarks] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchRequestDetails = async () => {
      try {
        const res = await api.get(`/room-permissions/${requestId}/verify-public`);
        setRequest(res.data);
      } catch (err: any) {
        setError(err.response?.data?.message || "Failed to load request details.");
      } finally {
        setLoading(false);
      }
    };
    if (requestId) fetchRequestDetails();
  }, [requestId]);

  const handleFacultyAction = async (action: "verify" | "decline") => {
    if (action === "decline" && !remarks) {
      toast.error("Please enter decline remarks/reason.");
      return;
    }

    try {
      setSubmitting(true);
      await api.put(`/room-permissions/${requestId}/faculty-verify`, {
        action,
        remarks
      });
      toast.success(action === "verify" ? "Request successfully recommended!" : "Request declined!");
      setSubmitted(true);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Action failed.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="text-xs text-muted-foreground">Loading request details for faculty review...</div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-xl text-center p-8 border-t-4 border-green-600">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-50 text-green-600 mb-4 shadow-sm">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <h2 className="text-xl font-extrabold text-green-800">Action Submitted</h2>
          <p className="text-xs text-muted-foreground mt-2">
            Thank you for reviewing the room permission request. Your recommendation decision has been saved in the system, and the student and coordinators have been notified.
          </p>
          <p className="text-2xs text-muted-foreground mt-6 border-t pt-4">
            You can close this tab now.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-lg shadow-xl border-t-4 border-primary overflow-hidden">
        <CardHeader className="bg-primary/5 border-b pb-4">
          <div className="flex justify-between items-center">
            <CardTitle className="text-md">Faculty Recommendation review</CardTitle>
            {request && (
              <span className="font-mono text-2xs bg-primary/10 text-primary px-2 py-0.5 rounded font-bold">{request.requestId}</span>
            )}
          </div>
          <CardDescription className="text-2xs">
            Review request details submitted by student and verify recommendation.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6 space-y-6 text-xs">
          {error || !request ? (
            <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 text-red-800 rounded">
              <AlertTriangle className="w-5 h-5 text-red-600 shrink-0" />
              <div>
                <p className="font-semibold">Error Loading Application</p>
                <p className="text-3xs mt-1">Request detail could not be loaded. Please ensure the verification link is correct.</p>
              </div>
            </div>
          ) : request.status !== "Submitted" ? (
            <div className="flex items-center gap-3 p-4 bg-amber-50 border border-amber-200 text-amber-800 rounded">
              <Info className="w-5 h-5 text-amber-600 shrink-0" />
              <div>
                <p className="font-semibold">Review Already Complete</p>
                <p className="text-3xs mt-1">This request has already been processed and is currently in status: <b>{request.status}</b>.</p>
              </div>
            </div>
          ) : (
            <>
              {/* Student details card */}
              <div className="bg-secondary/10 p-4 rounded border space-y-2">
                <div className="flex items-center gap-2">
                  <User className="w-4.5 h-4.5 text-primary" />
                  <div>
                    <div className="font-bold text-foreground">{request.applicantDetails.applicantName}</div>
                    <div className="text-3xs text-muted-foreground">{request.applicantDetails.department} - Year: {request.applicantDetails.year} (PRN: {request.applicantDetails.prn})</div>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2 border-t mt-2">
                  <Clock className="w-4 h-4 text-primary" />
                  <div className="font-semibold">{request.schedule.requestedDate} @ {request.schedule.startTime} - {request.schedule.endTime} ({request.schedule.duration} Hours)</div>
                </div>

                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-primary" />
                  <div className="font-semibold">Room Required: <span className="text-primary">{request.facilityRequired}</span></div>
                </div>
              </div>

              {/* Booking specifics */}
              <div className="space-y-3">
                <div>
                  <span className="text-muted-foreground block font-bold mb-1">Project Name</span>
                  <span className="text-foreground">{request.teamDetails.projectName}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block font-bold mb-1">Purpose of Booking</span>
                  <p className="text-foreground bg-slate-50 p-2.5 rounded border leading-relaxed">{request.purpose}</p>
                </div>
                <div>
                  <span className="text-muted-foreground block font-bold mb-1">Requested Resources</span>
                  <span className="text-foreground">{request.resourceRequirements?.requiredEquipment?.join(", ") || "None"}</span>
                </div>
              </div>

              {/* Recommendation Form controls */}
              <div className="space-y-4 pt-4 border-t">
                <div>
                  <Label className="text-xs font-bold text-primary">Faculty Recommendation Remarks</Label>
                  <Textarea
                    placeholder="Enter recommendation remarks or feedback..."
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    className="h-20 mt-1 bg-background text-xs"
                    required
                  />
                  <p className="text-3xs text-muted-foreground mt-1">Required if you decline this request.</p>
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t">
                  <Button
                    variant="outline"
                    onClick={() => handleFacultyAction("decline")}
                    disabled={submitting}
                    className="border-red-200 text-red-600 hover:bg-red-50"
                  >
                    Decline Request
                  </Button>
                  <Button
                    onClick={() => handleFacultyAction("verify")}
                    disabled={submitting}
                    className="bg-primary hover:bg-primary-hover"
                  >
                    Recommend & Verify
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default FacultyVerification;
