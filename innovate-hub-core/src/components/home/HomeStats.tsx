import { useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";
import { Edit, Settings, Sliders, Save, Loader2, Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import api from "@/lib/axios";

interface StatsData {
  activeProjects: number;
  studentsTrained: number;
  eventsConducted: number;
  achievementsRecorded: number;
}

const defaultStats: StatsData = {
  activeProjects: 500,
  studentsTrained: 1500,
  eventsConducted: 100,
  achievementsRecorded: 150,
};

const Counter = ({ value, duration = 2000 }: { value: number; duration?: number }) => {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const [hasAnimated, setHasAnimated] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated) {
          setHasAnimated(true);
        }
      },
      { threshold: 0.1 }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => {
      observer.disconnect();
    };
  }, [hasAnimated]);

  useEffect(() => {
    if (hasAnimated) {
      let startTime: number;
      let animationFrame: number;

      const animate = (timestamp: number) => {
        if (!startTime) startTime = timestamp;
        const progress = timestamp - startTime;
        const percentage = Math.min(progress / duration, 1);

        // Subtle ease-out
        const easeOutQuart = 1 - Math.pow(1 - percentage, 4);

        setCount(Math.floor(easeOutQuart * value));

        if (percentage < 1) {
          animationFrame = requestAnimationFrame(animate);
        }
      };

      animationFrame = requestAnimationFrame(animate);

      return () => cancelAnimationFrame(animationFrame);
    }
  }, [hasAnimated, value, duration]);

  return <span ref={ref}>{count}</span>;
};

const HomeStats = () => {
  const [liveStats, setLiveStats] = useState<StatsData>(defaultStats);
  const [isCoordinator, setIsCoordinator] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);

  // Quick edit modal states
  const [loadingEdit, setLoadingEdit] = useState(false);
  const [savingEdit, setSavingEdit] = useState(false);
  const [mode, setMode] = useState<"offset" | "override">("offset");
  
  const [activeProjectsOffset, setActiveProjectsOffset] = useState<number>(500);
  const [studentsTrainedOffset, setStudentsTrainedOffset] = useState<number>(1500);
  const [eventsConductedOffset, setEventsConductedOffset] = useState<number>(100);
  const [achievementsRecordedOffset, setAchievementsRecordedOffset] = useState<number>(150);

  const [overrideActiveProjects, setOverrideActiveProjects] = useState<string>("");
  const [overrideStudentsTrained, setOverrideStudentsTrained] = useState<string>("");
  const [overrideEventsConducted, setOverrideEventsConducted] = useState<string>("");
  const [overrideAchievementsRecorded, setOverrideAchievementsRecorded] = useState<string>("");

  const fetchPublicStats = async () => {
    try {
      const res = await api.get("/stats/public");
      if (res.data) {
        setLiveStats({
          activeProjects: typeof res.data.activeProjects === 'number' ? res.data.activeProjects : defaultStats.activeProjects,
          studentsTrained: typeof res.data.studentsTrained === 'number' ? res.data.studentsTrained : defaultStats.studentsTrained,
          eventsConducted: typeof res.data.eventsConducted === 'number' ? res.data.eventsConducted : defaultStats.eventsConducted,
          achievementsRecorded: typeof res.data.achievementsRecorded === 'number' ? res.data.achievementsRecorded : defaultStats.achievementsRecorded,
        });
      }
    } catch (err) {
      console.warn("Unable to fetch live site stats, using default counters.", err);
    }
  };

  useEffect(() => {
    fetchPublicStats();

    // Check user role
    try {
      const raw = localStorage.getItem("idea_hub_user");
      const token = localStorage.getItem("idea_hub_token");
      if (raw && token) {
        const user = JSON.parse(raw);
        if (['coordinator', 'head', 'admin'].includes(user?.role)) {
          setIsCoordinator(true);
        }
      }
    } catch (err) {
      setIsCoordinator(false);
    }
  }, []);

  const handleOpenEditModal = async () => {
    setEditModalOpen(true);
    try {
      setLoadingEdit(true);
      const res = await api.get("/stats/admin");
      if (res.data && res.data.settings) {
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
      toast.error("Failed to load current counter settings");
    } finally {
      setLoadingEdit(false);
    }
  };

  const handleSaveQuickEdit = async () => {
    try {
      setSavingEdit(true);
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

      await api.put("/stats/admin", payload);
      toast.success("Home section counters updated!");
      setEditModalOpen(false);
      fetchPublicStats();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to update stats");
    } finally {
      setSavingEdit(false);
    }
  };

  const statsList = [
    { value: liveStats.activeProjects, label: "Active Projects", suffix: "+" },
    { value: liveStats.studentsTrained, label: "Students Trained", suffix: "+" },
    { value: liveStats.eventsConducted, label: "Events Conducted", suffix: "+" },
    { value: liveStats.achievementsRecorded, label: "Achievements Recorded", suffix: "+" }
  ];

  return (
    <section className="relative bg-slate-900 py-20 text-white overflow-hidden">
      {/* Decorative subtle glows */}
      <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-72 h-72 rounded-full bg-blue-500/10 blur-[80px] pointer-events-none" />
      <div className="absolute top-1/2 right-1/4 -translate-y-1/2 w-72 h-72 rounded-full bg-violet-500/10 blur-[80px] pointer-events-none" />
      
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Coordinator Controls Toolbar (Visible ONLY to Coordinators/Heads/Admins) */}
        {isCoordinator && (
          <div className="flex items-center justify-end gap-2 mb-6">
            <Button
              onClick={handleOpenEditModal}
              size="sm"
              className="bg-blue-600/30 hover:bg-blue-600/60 text-blue-200 border border-blue-500/40 text-xs font-bold gap-1.5 rounded-full px-4 backdrop-blur-md shadow-lg transition-all"
            >
              <Edit className="w-3.5 h-3.5 text-blue-400" />
              Edit Section Numbers
            </Button>
            <Link 
              to="/coordinator-dashboard?tab=home_stats"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-800/80 hover:bg-slate-800 text-slate-300 border border-slate-700 text-xs font-semibold backdrop-blur-md transition-all"
            >
              <Settings className="w-3.5 h-3.5" />
              Coordinator Panel
            </Link>
          </div>
        )}

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 md:gap-12 text-center divide-y lg:divide-y-0 lg:divide-x divide-slate-800">
          {statsList.map((stat, index) => (
            <div key={index} className="px-4 py-6 lg:py-0">
              <div className="text-4xl sm:text-5xl font-black mb-2 tracking-tight text-white drop-shadow-md">
                <Counter value={stat.value} />
                <span className="text-blue-500">{stat.suffix}</span>
              </div>
              <div className="text-slate-400 font-semibold text-xs sm:text-sm uppercase tracking-widest mt-1">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Edit Dialog for Coordinators */}
      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent className="max-w-lg bg-slate-900 text-white border-slate-800">
          <DialogHeader>
            <div className="flex items-center gap-2 mb-1">
              <Badge className="bg-blue-600/30 text-blue-300 border-blue-500/30 text-[10px] font-bold uppercase">
                Coordinator Fast Edit
              </Badge>
              <Sparkles className="w-4 h-4 text-amber-400" />
            </div>
            <DialogTitle className="text-lg font-bold text-white">
              Edit Home Section Numbers
            </DialogTitle>
            <DialogDescription className="text-slate-400 text-xs">
              Adjust base numbers or fixed custom overrides. Changes immediately apply to the homepage.
            </DialogDescription>
          </DialogHeader>

          {loadingEdit ? (
            <div className="flex justify-center py-10">
              <Loader2 className="w-6 h-6 animate-spin text-blue-400" />
            </div>
          ) : (
            <div className="space-y-4 pt-2">
              <div className="flex bg-slate-950 p-1 rounded-lg border border-slate-800 justify-center gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant={mode === "offset" ? "default" : "ghost"}
                  onClick={() => setMode("offset")}
                  className="text-xs font-bold h-7"
                >
                  Auto-Increment Offset
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant={mode === "override" ? "default" : "ghost"}
                  onClick={() => setMode("override")}
                  className="text-xs font-bold h-7"
                >
                  Fixed Manual Override
                </Button>
              </div>

              {mode === "offset" ? (
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="space-y-1">
                    <Label className="text-[11px] text-slate-300">Active Projects Offset</Label>
                    <Input
                      type="number"
                      value={activeProjectsOffset}
                      onChange={(e) => setActiveProjectsOffset(Number(e.target.value))}
                      className="bg-slate-950 border-slate-800 h-9 text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[11px] text-slate-300">Students Trained Offset</Label>
                    <Input
                      type="number"
                      value={studentsTrainedOffset}
                      onChange={(e) => setStudentsTrainedOffset(Number(e.target.value))}
                      className="bg-slate-950 border-slate-800 h-9 text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[11px] text-slate-300">Events Conducted Offset</Label>
                    <Input
                      type="number"
                      value={eventsConductedOffset}
                      onChange={(e) => setEventsConductedOffset(Number(e.target.value))}
                      className="bg-slate-950 border-slate-800 h-9 text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[11px] text-slate-300">Achievements Offset</Label>
                    <Input
                      type="number"
                      value={achievementsRecordedOffset}
                      onChange={(e) => setAchievementsRecordedOffset(Number(e.target.value))}
                      className="bg-slate-950 border-slate-800 h-9 text-xs"
                    />
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="space-y-1">
                    <Label className="text-[11px] text-slate-300">Fixed Active Projects</Label>
                    <Input
                      type="number"
                      placeholder="e.g. 500"
                      value={overrideActiveProjects}
                      onChange={(e) => setOverrideActiveProjects(e.target.value)}
                      className="bg-slate-950 border-slate-800 h-9 text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[11px] text-slate-300">Fixed Students Trained</Label>
                    <Input
                      type="number"
                      placeholder="e.g. 1500"
                      value={overrideStudentsTrained}
                      onChange={(e) => setOverrideStudentsTrained(e.target.value)}
                      className="bg-slate-950 border-slate-800 h-9 text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[11px] text-slate-300">Fixed Events Conducted</Label>
                    <Input
                      type="number"
                      placeholder="e.g. 100"
                      value={overrideEventsConducted}
                      onChange={(e) => setOverrideEventsConducted(e.target.value)}
                      className="bg-slate-950 border-slate-800 h-9 text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[11px] text-slate-300">Fixed Achievements</Label>
                    <Input
                      type="number"
                      placeholder="e.g. 150"
                      value={overrideAchievementsRecorded}
                      onChange={(e) => setOverrideAchievementsRecorded(e.target.value)}
                      className="bg-slate-950 border-slate-800 h-9 text-xs"
                    />
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-800">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setEditModalOpen(false)}
                  className="border-slate-700 text-slate-300 hover:bg-slate-800 text-xs"
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleSaveQuickEdit}
                  disabled={savingEdit}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs gap-1.5"
                >
                  {savingEdit ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-3.5 h-3.5" />
                      Save & Update
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
};

export default HomeStats;
