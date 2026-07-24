import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { 
  Activity, TrendingUp, Sliders, Save, RefreshCw, 
  FolderCheck, Users, Calendar, Award, Loader2, Sparkles, AlertCircle 
} from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/axios";

interface StatsAdminResponse {
  activeProjects: number;
  studentsTrained: number;
  eventsConducted: number;
  achievementsRecorded: number;
  settings: {
    activeProjectsOffset: number;
    studentsTrainedOffset: number;
    eventsConductedOffset: number;
    achievementsRecordedOffset: number;
    mode: "offset" | "override";
    overrideActiveProjects: number | null;
    overrideStudentsTrained: number | null;
    overrideEventsConducted: number | null;
    overrideAchievementsRecorded: number | null;
  };
  breakdown: {
    dbActiveProjects: number;
    dbStudentsTrained: number;
    dbEventsConducted: number;
    dbAchievementsRecorded: number;
    roomProjectsCount: number;
    machineryProjectsCount: number;
  };
}

const ManageStats = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [statsData, setStatsData] = useState<StatsAdminResponse | null>(null);

  // Form State
  const [mode, setMode] = useState<"offset" | "override">("offset");
  
  // Offsets
  const [activeProjectsOffset, setActiveProjectsOffset] = useState<number>(500);
  const [studentsTrainedOffset, setStudentsTrainedOffset] = useState<number>(1500);
  const [eventsConductedOffset, setEventsConductedOffset] = useState<number>(100);
  const [achievementsRecordedOffset, setAchievementsRecordedOffset] = useState<number>(150);

  // Manual Overrides
  const [overrideActiveProjects, setOverrideActiveProjects] = useState<string>("");
  const [overrideStudentsTrained, setOverrideStudentsTrained] = useState<string>("");
  const [overrideEventsConducted, setOverrideEventsConducted] = useState<string>("");
  const [overrideAchievementsRecorded, setOverrideAchievementsRecorded] = useState<string>("");

  const fetchAdminStats = async () => {
    try {
      setLoading(true);
      const res = await api.get("/stats/admin");
      if (res.data) {
        setStatsData(res.data);
        const s = res.data.settings;
        setMode(s.mode || "offset");

        setActiveProjectsOffset(s.activeProjectsOffset ?? 500);
        setStudentsTrainedOffset(s.studentsTrainedOffset ?? 1500);
        setEventsConductedOffset(s.eventsConductedOffset ?? 100);
        setAchievementsRecordedOffset(s.achievementsRecordedOffset ?? 150);

        setOverrideActiveProjects(s.overrideActiveProjects !== null && s.overrideActiveProjects !== undefined ? String(s.overrideActiveProjects) : "");
        setOverrideStudentsTrained(s.overrideStudentsTrained !== null && s.overrideStudentsTrained !== undefined ? String(s.overrideStudentsTrained) : "");
        setOverrideEventsConducted(s.overrideEventsConducted !== null && s.overrideEventsConducted !== undefined ? String(s.overrideEventsConducted) : "");
        setOverrideAchievementsRecorded(s.overrideAchievementsRecorded !== null && s.overrideAchievementsRecorded !== undefined ? String(s.overrideAchievementsRecorded) : "");
      }
    } catch (err) {
      console.error("Failed to load admin stats:", err);
      toast.error("Failed to fetch current site stats settings");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminStats();
  }, []);

  const handleSaveSettings = async () => {
    try {
      setSaving(true);
      const payload = {
        mode,
        activeProjectsOffset: Number(activeProjectsOffset) || 0,
        studentsTrainedOffset: Number(studentsTrainedOffset) || 0,
        eventsConductedOffset: Number(eventsConductedOffset) || 0,
        achievementsRecordedOffset: Number(achievementsRecordedOffset) || 0,
        overrideActiveProjects: overrideActiveProjects === "" ? null : Number(overrideActiveProjects),
        overrideStudentsTrained: overrideStudentsTrained === "" ? null : Number(overrideStudentsTrained),
        overrideEventsConducted: overrideEventsConducted === "" ? null : Number(overrideEventsConducted),
        overrideAchievementsRecorded: overrideAchievementsRecorded === "" ? null : Number(overrideAchievementsRecorded),
      };

      const res = await api.put("/stats/admin", payload);
      toast.success("Home page stats counters updated successfully!");
      if (res.data && res.data.data) {
        setStatsData(res.data.data);
      }
    } catch (err: any) {
      console.error("Save stats failed:", err);
      toast.error(err.response?.data?.message || "Failed to update stats settings");
    } finally {
      setSaving(false);
    }
  };

  // Preview calculations
  const dbCounts = statsData?.breakdown || {
    dbActiveProjects: 0,
    dbStudentsTrained: 0,
    dbEventsConducted: 0,
    dbAchievementsRecorded: 0,
    roomProjectsCount: 0,
    machineryProjectsCount: 0,
  };

  const previewActiveProjects = mode === "override" && overrideActiveProjects !== ""
    ? Number(overrideActiveProjects)
    : dbCounts.dbActiveProjects + (Number(activeProjectsOffset) || 0);

  const previewStudentsTrained = mode === "override" && overrideStudentsTrained !== ""
    ? Number(overrideStudentsTrained)
    : dbCounts.dbStudentsTrained + (Number(studentsTrainedOffset) || 0);

  const previewEventsConducted = mode === "override" && overrideEventsConducted !== ""
    ? Number(overrideEventsConducted)
    : dbCounts.dbEventsConducted + (Number(eventsConductedOffset) || 0);

  const previewAchievements = mode === "override" && overrideAchievementsRecorded !== ""
    ? Number(overrideAchievementsRecorded)
    : dbCounts.dbAchievementsRecorded + (Number(achievementsRecordedOffset) || 0);

  return (
    <div className="w-full space-y-8">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 rounded-2xl border border-slate-800 text-white shadow-xl">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <Badge className="bg-blue-600/30 text-blue-300 border-blue-500/30 text-[10px] font-bold tracking-widest uppercase">
              Coordinator Counter Controls
            </Badge>
            <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight">
            Manage Homepage Stats & Counter Numbers
          </h2>
          <p className="text-xs text-slate-300 max-w-2xl">
            Configure how numbers are calculated on the main homepage. Real-time updates automatically increment counts when events, projects, users, or achievements are added.
          </p>
        </div>

        <Button
          variant="outline"
          onClick={fetchAdminStats}
          disabled={loading}
          className="bg-white/10 border-white/20 text-white hover:bg-white/20 text-xs font-semibold gap-2"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          Refresh Live Data
        </Button>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-16 space-y-3">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
          <p className="text-xs text-muted-foreground font-medium">Fetching real-time database counts...</p>
        </div>
      ) : (
        <>
          {/* Live DB Breakdown Cards */}
          <div>
            <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider mb-3 flex items-center gap-2">
              <Activity className="w-4 h-4 text-blue-600" />
              Live Database Counts (Auto-Increment Source)
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="border-slate-200/80 shadow-xs bg-slate-50/50">
                <CardContent className="pt-4 flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Active Projects</p>
                    <p className="text-xl font-black text-slate-900 mt-0.5">{dbCounts.dbActiveProjects}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">Rooms ({dbCounts.roomProjectsCount}) + Machinery ({dbCounts.machineryProjectsCount})</p>
                  </div>
                  <div className="w-9 h-9 rounded-xl bg-blue-100/80 text-blue-700 flex items-center justify-center font-bold">
                    <FolderCheck className="w-4 h-4" />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-slate-200/80 shadow-xs bg-slate-50/50">
                <CardContent className="pt-4 flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Students Registered</p>
                    <p className="text-xl font-black text-slate-900 mt-0.5">{dbCounts.dbStudentsTrained}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">Total User Accounts</p>
                  </div>
                  <div className="w-9 h-9 rounded-xl bg-emerald-100/80 text-emerald-700 flex items-center justify-center font-bold">
                    <Users className="w-4 h-4" />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-slate-200/80 shadow-xs bg-slate-50/50">
                <CardContent className="pt-4 flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Events Conducted</p>
                    <p className="text-xl font-black text-slate-900 mt-0.5">{dbCounts.dbEventsConducted}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">Total Events Recorded</p>
                  </div>
                  <div className="w-9 h-9 rounded-xl bg-purple-100/80 text-purple-700 flex items-center justify-center font-bold">
                    <Calendar className="w-4 h-4" />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-slate-200/80 shadow-xs bg-slate-50/50">
                <CardContent className="pt-4 flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Achievements</p>
                    <p className="text-xl font-black text-slate-900 mt-0.5">{dbCounts.dbAchievementsRecorded}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">Published Achievements</p>
                  </div>
                  <div className="w-9 h-9 rounded-xl bg-amber-100/80 text-amber-700 flex items-center justify-center font-bold">
                    <Award className="w-4 h-4" />
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Live Preview Box */}
          <Card className="bg-slate-900 text-white border-slate-800 shadow-xl overflow-hidden relative">
            <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
              <TrendingUp className="w-48 h-48 text-blue-400" />
            </div>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <Badge className="bg-blue-500 text-white text-[10px] font-bold uppercase tracking-widest">
                  Live Homepage Preview
                </Badge>
                <span className="text-[11px] text-slate-400 font-medium">
                  Mode: <strong className="text-white uppercase">{mode}</strong>
                </span>
              </div>
              <CardTitle className="text-base font-bold text-white mt-1">
                Public Display Output
              </CardTitle>
              <CardDescription className="text-slate-400 text-xs">
                These are the exact numbers currently configured to display on the home page counters.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 text-center py-4 bg-slate-950/60 rounded-xl border border-slate-800">
                <div>
                  <p className="text-2xl sm:text-3xl font-black text-blue-400">{previewActiveProjects}+</p>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1">Active Projects</p>
                </div>
                <div>
                  <p className="text-2xl sm:text-3xl font-black text-blue-400">{previewStudentsTrained}+</p>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1">Students Trained</p>
                </div>
                <div>
                  <p className="text-2xl sm:text-3xl font-black text-blue-400">{previewEventsConducted}+</p>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1">Events Conducted</p>
                </div>
                <div>
                  <p className="text-2xl sm:text-3xl font-black text-blue-400">{previewAchievements}+</p>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1">Achievements Recorded</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Controls Tabs: Base Offsets vs Direct Override */}
          <Card className="border-slate-200">
            <CardHeader>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <Sliders className="w-4 h-4 text-primary" />
                    Configure Counter Numbers
                  </CardTitle>
                  <CardDescription className="text-xs text-slate-500 mt-1">
                    Choose between dynamic auto-increment base offsets or manual custom overrides.
                  </CardDescription>
                </div>

                <div className="bg-slate-100 p-1 rounded-xl flex items-center border border-slate-200">
                  <Button
                    type="button"
                    variant={mode === "offset" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setMode("offset")}
                    className="text-xs font-bold h-8 rounded-lg"
                  >
                    Auto-Increment Offset
                  </Button>
                  <Button
                    type="button"
                    variant={mode === "override" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setMode("override")}
                    className="text-xs font-bold h-8 rounded-lg"
                  >
                    Manual Fixed Override
                  </Button>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-6 pt-2">
              {mode === "offset" ? (
                <div className="space-y-6">
                  <div className="bg-blue-50 border border-blue-200 p-4 rounded-xl flex items-start gap-3 text-xs text-blue-900">
                    <AlertCircle className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold">Auto-Increment Offset Mode (Recommended)</p>
                      <p className="text-blue-700 text-[11px] mt-0.5">
                        In this mode, the display number equals <strong>[Live Database Count] + [Base Offset Value]</strong>.
                        Whenever a new event is conducted or active project is approved, the homepage counter automatically increases by +1!
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="activeProjectsOffset" className="text-xs font-bold text-slate-800">
                        Active Projects Base Offset
                      </Label>
                      <Input
                        id="activeProjectsOffset"
                        type="number"
                        min="0"
                        value={activeProjectsOffset}
                        onChange={(e) => setActiveProjectsOffset(Number(e.target.value))}
                        className="h-10 text-sm font-semibold"
                      />
                      <p className="text-[11px] text-slate-400">
                        Display: {dbCounts.dbActiveProjects} (DB) + {activeProjectsOffset || 0} = <strong className="text-slate-800">{dbCounts.dbActiveProjects + (Number(activeProjectsOffset) || 0)}</strong>
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="studentsTrainedOffset" className="text-xs font-bold text-slate-800">
                        Students Trained Base Offset
                      </Label>
                      <Input
                        id="studentsTrainedOffset"
                        type="number"
                        min="0"
                        value={studentsTrainedOffset}
                        onChange={(e) => setStudentsTrainedOffset(Number(e.target.value))}
                        className="h-10 text-sm font-semibold"
                      />
                      <p className="text-[11px] text-slate-400">
                        Display: {dbCounts.dbStudentsTrained} (DB) + {studentsTrainedOffset || 0} = <strong className="text-slate-800">{dbCounts.dbStudentsTrained + (Number(studentsTrainedOffset) || 0)}</strong>
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="eventsConductedOffset" className="text-xs font-bold text-slate-800">
                        Events Conducted Base Offset
                      </Label>
                      <Input
                        id="eventsConductedOffset"
                        type="number"
                        min="0"
                        value={eventsConductedOffset}
                        onChange={(e) => setEventsConductedOffset(Number(e.target.value))}
                        className="h-10 text-sm font-semibold"
                      />
                      <p className="text-[11px] text-slate-400">
                        Display: {dbCounts.dbEventsConducted} (DB) + {eventsConductedOffset || 0} = <strong className="text-slate-800">{dbCounts.dbEventsConducted + (Number(eventsConductedOffset) || 0)}</strong>
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="achievementsRecordedOffset" className="text-xs font-bold text-slate-800">
                        Achievements Recorded Base Offset
                      </Label>
                      <Input
                        id="achievementsRecordedOffset"
                        type="number"
                        min="0"
                        value={achievementsRecordedOffset}
                        onChange={(e) => setAchievementsRecordedOffset(Number(e.target.value))}
                        className="h-10 text-sm font-semibold"
                      />
                      <p className="text-[11px] text-slate-400">
                        Display: {dbCounts.dbAchievementsRecorded} (DB) + {achievementsRecordedOffset || 0} = <strong className="text-slate-800">{dbCounts.dbAchievementsRecorded + (Number(achievementsRecordedOffset) || 0)}</strong>
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl flex items-start gap-3 text-xs text-amber-900">
                    <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold">Manual Fixed Override Mode</p>
                      <p className="text-amber-700 text-[11px] mt-0.5">
                        In this mode, the numbers specified below directly replace the homepage counters regardless of database events. Leave empty if you want a specific stat to default back to base offset.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="overrideActiveProjects" className="text-xs font-bold text-slate-800">
                        Fixed Active Projects Value
                      </Label>
                      <Input
                        id="overrideActiveProjects"
                        type="number"
                        placeholder="e.g. 500"
                        value={overrideActiveProjects}
                        onChange={(e) => setOverrideActiveProjects(e.target.value)}
                        className="h-10 text-sm font-semibold"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="overrideStudentsTrained" className="text-xs font-bold text-slate-800">
                        Fixed Students Trained Value
                      </Label>
                      <Input
                        id="overrideStudentsTrained"
                        type="number"
                        placeholder="e.g. 1500"
                        value={overrideStudentsTrained}
                        onChange={(e) => setOverrideStudentsTrained(e.target.value)}
                        className="h-10 text-sm font-semibold"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="overrideEventsConducted" className="text-xs font-bold text-slate-800">
                        Fixed Events Conducted Value
                      </Label>
                      <Input
                        id="overrideEventsConducted"
                        type="number"
                        placeholder="e.g. 100"
                        value={overrideEventsConducted}
                        onChange={(e) => setOverrideEventsConducted(e.target.value)}
                        className="h-10 text-sm font-semibold"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="overrideAchievementsRecorded" className="text-xs font-bold text-slate-800">
                        Fixed Achievements Recorded Value
                      </Label>
                      <Input
                        id="overrideAchievementsRecorded"
                        type="number"
                        placeholder="e.g. 150"
                        value={overrideAchievementsRecorded}
                        onChange={(e) => setOverrideAchievementsRecorded(e.target.value)}
                        className="h-10 text-sm font-semibold"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Action Footer */}
              <div className="pt-4 border-t border-slate-200 flex justify-end">
                <Button
                  onClick={handleSaveSettings}
                  disabled={saving}
                  className="bg-primary hover:bg-primary/90 text-white font-bold text-xs px-6 h-10 gap-2 shadow-md"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Saving Changes...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Save Stats Settings
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};

export default ManageStats;
