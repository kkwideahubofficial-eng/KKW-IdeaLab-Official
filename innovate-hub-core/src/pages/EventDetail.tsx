import { useParams, Link, useSearchParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar, MapPin, Users, Clock, ArrowLeft, ShieldAlert, CheckCircle, XCircle, Phone, Mail, FileText, UserCheck, AlertTriangle, ChevronDown, ChevronUp, ChevronsUpDown, Check } from "lucide-react";
import { useEffect, useState, useMemo } from "react";
import api from "@/lib/axios";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from "@/components/ui/command";


interface EventDetailItem {
  _id: string;
  title: string;
  category: string;
  description: string;
  objectives?: string;
  date: string;
  startTime: string;
  endTime: string;
  registrationStartDate: string;
  registrationEndDate: string;
  venue: string;
  building?: string;
  roomNumber?: string;
  totalSeats: number;
  availableSeats: number;
  participationType: 'Individual Only' | 'Team Only' | 'Both Allowed';
  minTeamSize: number;
  maxTeamSize: number;
  allowedBranches: string[];
  allowedYears: string[];
  requiredSkills: string[];
  organizer: string;
  coordinatorName?: string;
  coordinatorContact?: string;
  imageUrl?: string;
  rules?: string;
  eligibilityCriteria?: string;
  schedule?: string;
  attachments?: Array<{ name: string; url: string }>;
  ruleBookUrl?: string;
  status: string;
}

interface TeamMemberInput {
  fullName: string;
  prn: string;
  rollNumber: string;
  department: string;
  year: string;
  division: string;
  email: string;
  mobile: string;
  isTeamLeader: boolean;
}

function getCurrentUser() {
  try {
    const raw = localStorage.getItem("idea_hub_user");
    const token = localStorage.getItem("idea_hub_token");
    if (!raw || !token) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

const getStatusColor = (status: string) => {
  const s = status ? status.toLowerCase() : '';
  if (s === 'upcoming') return 'bg-blue-500/10 text-blue-500 hover:bg-blue-500/20 border-blue-500/30';
  if (s === 'registration open') return 'bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 border-emerald-500/30';
  if (s === 'registration closed') return 'bg-amber-500/10 text-amber-500 hover:bg-amber-500/20 border-amber-500/30';
  if (s === 'ongoing') return 'bg-purple-500/10 text-purple-500 hover:bg-purple-500/20 border-purple-500/30';
  if (s === 'completed') return 'bg-slate-500/10 text-slate-500 hover:bg-slate-500/20 border-slate-500/30';
  if (s === 'cancelled') return 'bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 border-rose-500/30';
  return 'bg-secondary/30 text-secondary-foreground';
};

const DEPARTMENTS = [
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

const YEARS = [
  "1st Year",
  "2nd Year",
  "3rd Year",
  "4th Year"
];

interface SearchableSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: string[];
  placeholder: string;
  searchPlaceholder: string;
  emptyMessage: string;
}

const SearchableSelect = ({
  value,
  onChange,
  options,
  placeholder,
  searchPlaceholder,
  emptyMessage
}: SearchableSelectProps) => {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between font-normal h-10 border border-input rounded-md px-3 py-2 text-sm bg-background hover:bg-background text-foreground shadow-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          <span className="truncate">{value || placeholder}</span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
        <Command>
          <CommandInput placeholder={searchPlaceholder} className="h-9" />
          <CommandList>
            <CommandEmpty>{emptyMessage}</CommandEmpty>
            <CommandGroup>
              {options.map((option) => (
                <CommandItem
                  key={option}
                  value={option}
                  onSelect={(currentValue) => {
                    const selectedOption = options.find(
                      (o) => o.toLowerCase() === currentValue.toLowerCase()
                    ) || option;
                    onChange(selectedOption);
                    setOpen(false);
                  }}
                  className="flex items-center justify-between cursor-pointer animate-none"
                >
                  <span className="truncate">{option}</span>
                  <Check
                    className={cn(
                      "ml-auto h-4 w-4",
                      value === option ? "opacity-100" : "opacity-0"
                    )}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};


const EventDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [event, setEvent] = useState<EventDetailItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const user = useMemo(getCurrentUser, []);

  // Team Registration Specifics
  const [teamType, setTeamType] = useState<'individual' | 'team'>('individual');
  const [teamSize, setTeamSize] = useState<number>(1);
  const [teamMembers, setTeamMembers] = useState<TeamMemberInput[]>([]);
  const [expandedIndex, setExpandedIndex] = useState<number | null>(0);

  // Extra Form Fields
  const [teamName, setTeamName] = useState("");
  const [projectTitle, setProjectTitle] = useState("");
  const [skills, setSkills] = useState("");
  const [problemStatement, setProblemStatement] = useState("");
  const [projectDescription, setProjectDescription] = useState("");

  const [declaration1, setDeclaration1] = useState(false);
  const [declaration2, setDeclaration2] = useState(false);

  // Fetch event details
  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const res = await api.get(`/events/${id}`);
        setEvent(res.data);
        
        // Match registration requirements
        if (res.data.participationType === 'Team Only') {
          setTeamType('team');
          setTeamSize(res.data.minTeamSize || 2);
        } else {
          setTeamType('individual');
          setTeamSize(1);
        }
      } catch (e) {
        toast.error("Failed to fetch event details");
        setEvent(null);
      } finally {
        setLoading(false);
      }
    };
    
    fetchEvent();
  }, [id]);

  // Handle default state initialization when registering opens
  useEffect(() => {
    if (isRegisterOpen && event) {
      const defaultLeader: TeamMemberInput = {
        fullName: user?.name || "",
        prn: "",
        rollNumber: "",
        department: user?.branch || "",
        year: user?.year || "",
        division: "",
        email: user?.email || "",
        mobile: user?.mobile || "",
        isTeamLeader: true
      };
      
      const newMembers: TeamMemberInput[] = [defaultLeader];
      const targetSize = teamType === 'individual' ? 1 : Math.max(event.minTeamSize, teamSize);
      
      for (let i = 1; i < targetSize; i++) {
        newMembers.push({
          fullName: "",
          prn: "",
          rollNumber: "",
          department: "",
          year: "",
          division: "",
          email: "",
          mobile: "",
          isTeamLeader: false
        });
      }
      setTeamMembers(newMembers);
      setTeamSize(targetSize);
      setExpandedIndex(0);
    }
  }, [isRegisterOpen, teamType, event]);

  // Adjust team members count dynamically when teamSize selector changes
  const handleTeamSizeChange = (newSize: number) => {
    if (!event) return;
    setTeamSize(newSize);
    
    setTeamMembers(prev => {
      const currentMembers = [...prev];
      if (currentMembers.length < newSize) {
        // Add members
        const diff = newSize - currentMembers.length;
        for (let i = 0; i < diff; i++) {
          currentMembers.push({
            fullName: "",
            prn: "",
            rollNumber: "",
            department: "",
            year: "",
            division: "",
            email: "",
            mobile: "",
            isTeamLeader: false
          });
        }
      } else if (currentMembers.length > newSize) {
        // Remove members
        currentMembers.splice(newSize);
      }
      return currentMembers;
    });
  };

  const updateMemberField = (index: number, field: keyof TeamMemberInput, value: any) => {
    setTeamMembers(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  // Check validations
  const validationErrors = useMemo(() => {
    const errors: string[] = [];
    if (teamMembers.length === 0) return errors;

    const prns = teamMembers.map(m => m.prn.trim().toUpperCase()).filter(Boolean);
    const rolls = teamMembers.map(m => m.rollNumber.trim().toUpperCase()).filter(Boolean);
    const emails = teamMembers.map(m => m.email.trim().toLowerCase()).filter(Boolean);

    if (new Set(prns).size !== prns.length) {
      errors.push("Duplicate PRN numbers found inside team members.");
    }
    if (new Set(rolls).size !== rolls.length) {
      errors.push("Duplicate Roll numbers found inside team members.");
    }
    if (new Set(emails).size !== emails.length) {
      errors.push("Duplicate Email addresses found inside team members.");
    }

    // Check mandatory fields
    let missingInfo = false;
    teamMembers.forEach((m, idx) => {
      if (!m.fullName || !m.prn || !m.rollNumber || !m.department || !m.year || !m.division || !m.email || !m.mobile) {
        missingInfo = true;
      }
    });

    if (missingInfo) {
      errors.push("All mandatory fields for each team member must be filled.");
    }

    if (teamType === 'team' && !teamName.trim()) {
      errors.push("Team Name is required for team participation.");
    }

    return errors;
  }, [teamMembers, teamName, teamType]);

  // Check progress indicator
  const progressInfo = useMemo(() => {
    let completed = 0;
    teamMembers.forEach(m => {
      if (m.fullName && m.prn && m.rollNumber && m.department && m.year && m.division && m.email && m.mobile) {
        completed++;
      }
    });
    return { completed, total: teamMembers.length };
  }, [teamMembers]);

  useEffect(() => {
    if (searchParams.get("register") === "true" && event?.status === "Registration Open") {
      setIsRegisterOpen(true);
    }
  }, [event, searchParams]);

  // Eligibility check logic
  const eligibility = useMemo(() => {
    if (!event) return { status: false, reason: "Loading..." };
    if (!user) return { status: false, reason: "Login to check eligibility" };

    const branch = (user.branch || "").trim().toUpperCase();
    const year = (user.year || "").trim().toUpperCase();

    if (event.allowedBranches && event.allowedBranches.length > 0) {
      const allowedB = event.allowedBranches.map(b => b.trim().toUpperCase());
      const isBranchAllowed = allowedB.some(b => branch.includes(b) || b.includes(branch));
      if (!isBranchAllowed && branch !== "") {
        return { status: false, reason: `Only allowed for branches: ${event.allowedBranches.join(", ")}` };
      }
    }

    if (event.allowedYears && event.allowedYears.length > 0) {
      const allowedY = event.allowedYears.map(y => y.trim().toUpperCase());
      const isYearAllowed = allowedY.includes(year);
      if (!isYearAllowed && year !== "") {
        return { status: false, reason: `Only allowed for engineering years: ${event.allowedYears.join(", ")}` };
      }
    }

    return { status: true, reason: "Eligible" };
  }, [event, user]);

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (validationErrors.length > 0) {
      toast.error(validationErrors[0]);
      return;
    }
    if (!declaration1 || !declaration2) {
      toast.error("You must agree to all declarations before submitting.");
      return;
    }

    try {
      setIsSubmitting(true);

      const payload = {
        teamName: teamType === 'individual' ? `${user?.name || 'Individual'}'s Registration` : teamName,
        teamSize: teamMembers.length,
        projectTitle,
        problemStatement,
        projectDescription,
        skills,
        teamMembers,
        declarationConfirmed: true
      };

      await api.post(`/events/${id}/register`, payload);
      toast.success("Successfully registered for the event!");
      setIsRegisterOpen(false);
      
      const refreshRes = await api.get(`/events/${id}`);
      setEvent(refreshRes.data);
      
      navigate("/events");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Registration failed. Try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="container mx-auto px-4 py-12 text-center max-w-md">
        <ShieldAlert className="w-12 h-12 text-rose-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold">Event Not Found</h2>
        <p className="text-muted-foreground mt-2">The event does not exist or has been removed.</p>
        <Link to="/events" className="mt-4 inline-block">
          <Button variant="outline">Back to Events</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <Link to="/events" className="inline-flex items-center text-sm font-semibold text-muted-foreground hover:text-primary mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4 mr-2" /> Back to Events
      </Link>

      {/* Banner */}
      <div className="relative aspect-[21/9] w-full overflow-hidden rounded-[24px] bg-muted border mb-8 shadow-sm">
        {event.imageUrl ? (
          <img src={event.imageUrl} alt={event.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-secondary/30 text-muted-foreground/20">
            <Calendar className="w-20 h-20" />
          </div>
        )}
        <div className="absolute top-4 right-4">
          <Badge variant="outline" className={`font-bold px-4 py-1.5 text-xs rounded-full border bg-background/95 backdrop-blur ${getStatusColor(event.status)}`}>
            {event.status}
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Details */}
        <div className="lg:col-span-2 space-y-6">
          <div>
            <span className="text-xs font-bold text-primary uppercase tracking-widest bg-primary/10 px-3 py-1 rounded-full">{event.category}</span>
            <h1 className="text-3xl md:text-4xl font-extrabold text-foreground mt-3 mb-2">{event.title}</h1>
            <p className="text-sm font-medium text-muted-foreground">Organized by: <strong className="text-foreground">{event.organizer}</strong></p>
          </div>

          <Card className="rounded-2xl border-border/60">
            <CardContent className="p-6 space-y-4">
              <h3 className="text-xl font-bold text-foreground">About This Event</h3>
              <p className="text-muted-foreground text-sm leading-relaxed whitespace-pre-line">{event.description}</p>
              
              {event.objectives && (
                <div className="pt-4 border-t">
                  <h4 className="font-bold text-sm text-foreground uppercase tracking-wide mb-2">Objectives</h4>
                  <p className="text-muted-foreground text-sm leading-relaxed whitespace-pre-line">{event.objectives}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Agenda & Schedule */}
          {event.schedule && (
            <Card className="rounded-2xl border-border/60">
              <CardContent className="p-6">
                <h3 className="text-xl font-bold text-foreground mb-4">Event Agenda / Schedule</h3>
                <div className="text-muted-foreground text-sm leading-relaxed whitespace-pre-line bg-muted/20 p-4 rounded-xl border border-border/40">
                  {event.schedule}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Rules and Guidelines */}
          {event.rules && (
            <Card className="rounded-2xl border-border/60">
              <CardContent className="p-6">
                <h3 className="text-xl font-bold text-foreground mb-4">Event Rules & Guidelines</h3>
                <div className="text-muted-foreground text-sm leading-relaxed whitespace-pre-line bg-rose-500/5 p-4 rounded-xl border border-rose-500/10">
                  {event.rules}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Info Sidebar */}
        <div className="space-y-6">
          {/* Quick Info Card */}
          <Card className="rounded-2xl border-border/60 shadow-sm">
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 bg-primary/10 rounded-lg flex items-center justify-center text-primary"><Calendar className="w-5 h-5" /></div>
                <div>
                  <p className="text-xs text-muted-foreground font-semibold">Date</p>
                  <p className="font-bold text-sm text-foreground">{new Date(event.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="h-9 w-9 bg-primary/10 rounded-lg flex items-center justify-center text-primary"><Clock className="w-5 h-5" /></div>
                <div>
                  <p className="text-xs text-muted-foreground font-semibold">Time</p>
                  <p className="font-bold text-sm text-foreground">{event.startTime} - {event.endTime}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="h-9 w-9 bg-primary/10 rounded-lg flex items-center justify-center text-primary"><MapPin className="w-5 h-5" /></div>
                <div>
                  <p className="text-xs text-muted-foreground font-semibold">Venue</p>
                  <p className="font-bold text-sm text-foreground">{event.venue}</p>
                  {(event.building || event.roomNumber) && (
                    <p className="text-xs text-muted-foreground font-medium mt-0.5">{event.building} (Room {event.roomNumber})</p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="h-9 w-9 bg-primary/10 rounded-lg flex items-center justify-center text-primary"><Users className="w-5 h-5" /></div>
                <div>
                  <p className="text-xs text-muted-foreground font-semibold">Capacity & Type</p>
                  <p className="font-bold text-sm text-foreground">{event.availableSeats} / {event.totalSeats} seats remaining</p>
                  <p className="text-xs text-muted-foreground font-medium mt-0.5">Type: <span className="font-semibold text-foreground">{event.participationType}</span></p>
                  {event.participationType !== 'Individual Only' && (
                    <p className="text-xs text-muted-foreground font-medium">Team Limits: <span className="font-semibold text-foreground">{event.minTeamSize} - {event.maxTeamSize} members</span></p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Eligibility Criteria Verification Card */}
          <Card className="rounded-2xl border-border/60 shadow-sm overflow-hidden">
            <CardHeader className="bg-muted/30 pb-3 border-b">
              <CardTitle className="text-md font-bold">Eligibility Check</CardTitle>
            </CardHeader>
            <CardContent className="p-5 space-y-4">
              {!user ? (
                <div className="text-center py-2 space-y-3">
                  <AlertTriangle className="w-8 h-8 text-amber-500 mx-auto" />
                  <p className="text-xs text-muted-foreground font-medium">Please login to check eligibility and register.</p>
                  <Link to="/login" className="block w-full">
                    <Button variant="outline" size="sm" className="w-full rounded-xl">Login</Button>
                  </Link>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-2.5">
                    {eligibility.status ? (
                      <>
                        <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0" />
                        <span className="font-bold text-sm text-emerald-600">✓ Eligible</span>
                      </>
                    ) : (
                      <>
                        <XCircle className="w-5 h-5 text-rose-500 shrink-0" />
                        <span className="font-bold text-sm text-rose-600">✗ Not Eligible</span>
                      </>
                    )}
                  </div>
                  
                  {!eligibility.status && (
                    <p className="text-xs text-rose-500/90 font-medium bg-rose-500/5 p-3 rounded-lg border border-rose-500/10">
                      {eligibility.reason}
                    </p>
                  )}

                  {eligibility.status && (
                    <div className="text-xs space-y-1.5 text-muted-foreground font-medium">
                      <p>• Department matching check passed.</p>
                      <p>• Candidate year level verification cleared.</p>
                    </div>
                  )}

                  {event.eligibilityCriteria && (
                    <div className="pt-3 border-t">
                      <p className="text-xs font-bold text-foreground mb-1">Details Criteria:</p>
                      <p className="text-xs text-muted-foreground leading-relaxed">{event.eligibilityCriteria}</p>
                    </div>
                  )}

                  {event.requiredSkills && event.requiredSkills.length > 0 && (
                    <div className="pt-3 border-t">
                      <p className="text-xs font-bold text-foreground mb-1.5">Required Skills:</p>
                      <div className="flex flex-wrap gap-1">
                        {event.requiredSkills.map(skill => (
                          <Badge key={skill} variant="secondary" className="text-[10px] px-2 py-0.5 rounded-md">{skill}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          {/* Organizer details */}
          {(event.coordinatorName || event.coordinatorContact) && (
            <Card className="rounded-2xl border-border/60 shadow-sm">
              <CardContent className="p-5 space-y-3">
                <h3 className="font-bold text-sm text-foreground uppercase tracking-wide border-b pb-1.5 mb-2">Coordinator Contact</h3>
                
                {event.coordinatorName && (
                  <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
                    <UserCheck className="w-4 h-4 text-primary shrink-0" />
                    <span className="text-foreground">{event.coordinatorName}</span>
                  </div>
                )}
                
                {event.coordinatorContact && (
                  <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
                    <Phone className="w-4 h-4 text-primary shrink-0" />
                    <span>{event.coordinatorContact}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Registration Button / Status Banner */}
          {user && eligibility.status && event.status === "Registration Open" && (
            <Button 
              className="w-full rounded-xl py-6 bg-primary hover:bg-primary/95 text-white font-bold text-md shadow-md hover:shadow-primary/10 transition-all"
              onClick={() => setIsRegisterOpen(true)}
            >
              Register For Event
            </Button>
          )}

          {event.status !== "Registration Open" && (
            <div className="bg-amber-500/10 text-amber-600 text-center font-bold p-4 rounded-xl border border-amber-500/20 text-sm">
              Registrations are Closed
            </div>
          )}
        </div>
      </div>

      {/* Registration Dialog Form */}
      <Dialog open={isRegisterOpen} onOpenChange={setIsRegisterOpen}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto rounded-3xl p-6">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-foreground">Event Registration Form</DialogTitle>
            <DialogDescription>Registering for: <strong className="text-foreground">{event.title}</strong></DialogDescription>
          </DialogHeader>

          <form onSubmit={handleRegisterSubmit} className="space-y-6 pt-4">
            
            {/* Participation Type Selector */}
            {event.participationType === 'Both Allowed' && (
              <div className="space-y-2.5 bg-muted/40 p-4 rounded-2xl border">
                <Label className="text-sm font-bold text-foreground">Select Participation Type</Label>
                <div className="flex gap-6 pt-1">
                  <div className="flex items-center gap-2">
                    <input 
                      type="radio" 
                      id="typeInd" 
                      name="teamType" 
                      checked={teamType === 'individual'} 
                      onChange={() => setTeamType('individual')}
                      className="h-4 w-4 text-primary"
                    />
                    <Label htmlFor="typeInd" className="text-xs font-semibold cursor-pointer">Individual Participation</Label>
                  </div>

                  <div className="flex items-center gap-2">
                    <input 
                      type="radio" 
                      id="typeTeam" 
                      name="teamType" 
                      checked={teamType === 'team'} 
                      onChange={() => setTeamType('team')}
                      className="h-4 w-4 text-primary"
                    />
                    <Label htmlFor="typeTeam" className="text-xs font-semibold cursor-pointer">Team Participation</Label>
                  </div>
                </div>
              </div>
            )}

            {/* Dynamic Team Size Drodown */}
            {teamType === 'team' && (
              <div className="space-y-2.5 bg-muted/40 p-4 rounded-2xl border flex items-center justify-between gap-4">
                <div>
                  <Label className="text-sm font-bold text-foreground block">Number of Team Members</Label>
                  <span className="text-xs text-muted-foreground font-medium">Select size within event limits: {event.minTeamSize} to {event.maxTeamSize} members</span>
                </div>
                
                <select
                  value={teamSize}
                  onChange={(e) => handleTeamSizeChange(parseInt(e.target.value, 10))}
                  className="h-10 px-3 rounded-xl border bg-background text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary/20 shrink-0"
                >
                  {Array.from({ length: event.maxTeamSize - event.minTeamSize + 1 }, (_, i) => event.minTeamSize + i).map(size => (
                    <option key={size} value={size}>{size} Member{size > 1 ? 's' : ''}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Progress Count Indicator */}
            {teamType === 'team' && (
              <div className="flex justify-between items-center bg-primary/5 px-4 py-2.5 rounded-xl border border-primary/20 text-xs font-bold text-primary">
                <span>Team Members Info Completed:</span>
                <span>{progressInfo.completed} / {progressInfo.total} added</span>
              </div>
            )}

            {/* Real-time validation warning alert */}
            {validationErrors.length > 0 && (
              <div className="bg-rose-500/10 border border-rose-500/20 p-4 rounded-2xl space-y-1">
                <p className="text-xs font-extrabold text-rose-600 flex items-center gap-1"><AlertTriangle className="w-4 h-4 shrink-0" /> Validation Warnings:</p>
                <ul className="list-disc pl-5 text-xs text-rose-500 font-semibold space-y-0.5">
                  {validationErrors.map((err, i) => <li key={i}>{err}</li>)}
                </ul>
              </div>
            )}

            {/* Collapsible Member Cards accordion */}
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-primary uppercase tracking-widest border-b pb-1">Member Information</h3>
              
              {teamMembers.map((member, index) => {
                const isExpanded = expandedIndex === index;
                const isLeader = member.isTeamLeader;

                return (
                  <Card key={index} className="overflow-hidden border border-border/60 shadow-sm rounded-2xl">
                    {/* Header */}
                    <div 
                      onClick={() => setExpandedIndex(isExpanded ? null : index)}
                      className="bg-muted/30 px-5 py-3.5 flex justify-between items-center cursor-pointer hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-foreground">
                          Team Member {index + 1} {isLeader ? '(Team Leader)' : ''}
                        </span>
                        {isLeader && (
                          <Badge className="bg-amber-500 hover:bg-amber-600 text-[10px] font-bold py-0.5 gap-0.5"><UserCheck className="w-3 h-3" /> ★ Team Leader</Badge>
                        )}
                        {member.fullName && (
                          <span className="text-xs text-muted-foreground font-semibold">({member.fullName})</span>
                        )}
                      </div>
                      {isExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                    </div>

                    {/* Form Fields */}
                    {isExpanded && (
                      <CardContent className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in duration-200">
                        <div className="space-y-1">
                          <Label className="text-xs font-semibold">Full Name</Label>
                          <Input 
                            value={member.fullName} 
                            onChange={(e) => updateMemberField(index, 'fullName', e.target.value)}
                            placeholder="Enter full name"
                            required 
                          />
                        </div>
                        
                        <div className="space-y-1">
                          <Label className="text-xs font-semibold">PRN Number</Label>
                          <Input 
                            value={member.prn} 
                            onChange={(e) => updateMemberField(index, 'prn', e.target.value)}
                            placeholder="Ex. 71928392K" 
                            required 
                          />
                        </div>

                        <div className="space-y-1">
                          <Label className="text-xs font-semibold">Roll Number</Label>
                          <Input 
                            value={member.rollNumber} 
                            onChange={(e) => updateMemberField(index, 'rollNumber', e.target.value)}
                            placeholder="Ex. 41" 
                            required 
                          />
                        </div>

                        <div className="space-y-1">
                          <Label className="text-xs font-semibold">Department / Branch</Label>
                          <SearchableSelect
                            value={member.department}
                            onChange={(val) => updateMemberField(index, 'department', val)}
                            options={DEPARTMENTS}
                            placeholder="Select department / branch"
                            searchPlaceholder="Search branch..."
                            emptyMessage="No branch found."
                          />
                        </div>

                        <div className="space-y-1">
                          <Label className="text-xs font-semibold">Year of Engineering</Label>
                          <SearchableSelect
                            value={member.year}
                            onChange={(val) => updateMemberField(index, 'year', val)}
                            options={YEARS}
                            placeholder="Select year of engineering"
                            searchPlaceholder="Search year..."
                            emptyMessage="No year found."
                          />
                        </div>


                        <div className="space-y-1">
                          <Label className="text-xs font-semibold">Division</Label>
                          <Input 
                            value={member.division} 
                            onChange={(e) => updateMemberField(index, 'division', e.target.value)}
                            placeholder="Ex. A" 
                            required 
                          />
                        </div>

                        <div className="space-y-1">
                          <Label className="text-xs font-semibold">Email Address</Label>
                          <Input 
                            type="email"
                            value={member.email} 
                            onChange={(e) => updateMemberField(index, 'email', e.target.value)}
                            placeholder="name@email.com" 
                            required 
                          />
                        </div>

                        <div className="space-y-1">
                          <Label className="text-xs font-semibold">Mobile Number</Label>
                          <Input 
                            value={member.mobile} 
                            onChange={(e) => updateMemberField(index, 'mobile', e.target.value)}
                            placeholder="+91 9999999999" 
                            required 
                          />
                        </div>
                      </CardContent>
                    )}
                  </Card>
                );
              })}
            </div>

            {/* Team Metadata Information */}
            {teamType === 'team' && (
              <div className="space-y-4 pt-2">
                <h3 className="text-xs font-bold text-primary uppercase tracking-widest border-b pb-1">Team Details</h3>
                <div className="space-y-4">
                  <div className="space-y-1">
                    <Label htmlFor="teamNameInput" className="text-xs font-semibold">Team Name</Label>
                    <Input 
                      id="teamNameInput" 
                      value={teamName} 
                      onChange={(e) => setTeamName(e.target.value)}
                      placeholder="Ex. Innovators Hub" 
                      required 
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Declarations */}
            <div className="space-y-3 bg-muted/30 p-4 rounded-xl border">
              <h3 className="text-xs font-bold text-foreground uppercase tracking-wider mb-2">Declaration</h3>
              <div className="flex items-start gap-2.5">
                <Checkbox id="decl1" checked={declaration1} onCheckedChange={(checked) => setDeclaration1(checked === true)} />
                <Label htmlFor="decl1" className="text-xs leading-none cursor-pointer text-muted-foreground font-medium">
                  I confirm that all provided personal and academic information is correct and true.
                </Label>
              </div>

              <div className="flex items-start gap-2.5">
                <Checkbox id="decl2" checked={declaration2} onCheckedChange={(checked) => setDeclaration2(checked === true)} />
                <Label htmlFor="decl2" className="text-xs leading-none cursor-pointer text-muted-foreground font-medium">
                  I agree to follow all event rules and code of conduct set by the AICTE IDEA Lab cell.
                </Label>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" className="rounded-xl h-10" onClick={() => setIsRegisterOpen(false)}>Cancel</Button>
              <Button 
                type="submit" 
                className="rounded-xl h-10 bg-primary hover:bg-primary/95 text-white font-bold" 
                disabled={isSubmitting || validationErrors.length > 0}
              >
                {isSubmitting ? "Submitting..." : "Submit Registration"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EventDetail;
