import { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { PlusCircle, Edit, Trash2, Calendar, Users, MapPin, CheckCircle, XCircle, FileSpreadsheet, FileDown, TrendingUp, BarChart3, Clock, ClipboardList, ChevronDown, ChevronUp, UserCheck, Star, ChevronsUpDown, Check, Loader2 } from 'lucide-react';
import api from '@/lib/axios';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from '@/components/ui/command';

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface TeamMember {
  _id: string;
  fullName: string;
  prn: string;
  rollNumber: string;
  department: string;
  year: string;
  division: string;
  email: string;
  mobile: string;
  isTeamLeader: boolean;
  attendance: 'pending' | 'present' | 'absent';
  certificateNumber?: string;
}

interface Event {
  _id: string;
  title: string;
  category: string;
  description: string;
  objectives: string;
  date: string;
  startTime: string;
  endTime: string;
  registrationStartDate: string;
  registrationEndDate: string;
  venue: string;
  building: string;
  roomNumber: string;
  totalSeats: number;
  participationType: 'Individual Only' | 'Team Only' | 'Both Allowed';
  minTeamSize: number;
  maxTeamSize: number;
  allowedBranches: string[];
  allowedYears: string[];
  requiredSkills: string[];
  organizer: string;
  coordinatorName: string;
  coordinatorContact: string;
  imageUrl?: string;
  gallery?: string[];
  attachments?: Array<{ name: string; url: string }>;
  ruleBookUrl?: string;
  rules?: string;
  eligibilityCriteria?: string;
  schedule?: string;
  isPublished: boolean;
  statusOverride: string | null;
  status: string;
}

interface Registration {
  _id: string;
  registrationId: string;
  registrationDate: string;
  status: 'pending' | 'approved' | 'rejected';
  teamName: string;
  teamSize: number;
  projectTitle: string;
  problemStatement: string;
  projectDescription: string;
  skills: string;
  teamMembers: TeamMember[];
}

interface Analytics {
  summary: {
    totalEvents: number;
    upcomingEvents: number;
    ongoingEvents: number;
    completedEvents: number;
    totalRegistrations: number;
    approvedParticipants: number;
    attendancePercentage: number;
    certificatesGenerated: number;
  };
  charts: {
    regPerEvent: Array<{ name: string; count: number }>;
    attendancePerEvent: Array<{ name: string; present: number; absent: number }>;
    deptParticipation: Array<{ name: string; count: number }>;
    yearParticipation: Array<{ name: string; count: number }>;
  };
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

interface MultiSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: string[];
  placeholder: string;
}

const MultiSelect = ({ value, onChange, options, placeholder }: MultiSelectProps) => {
  const [open, setOpen] = useState(false);
  const selectedList = useMemo(() => {
    return value ? value.split(',').map(s => s.trim()).filter(Boolean) : [];
  }, [value]);

  const handleToggle = (option: string) => {
    let newList: string[];
    if (selectedList.includes(option)) {
      newList = selectedList.filter(o => o !== option);
    } else {
      newList = [...selectedList, option];
    }
    onChange(newList.join(', '));
  };

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
          <CommandInput placeholder="Search branches..." className="h-9" />
          <CommandList>
            <CommandEmpty>No branch found.</CommandEmpty>
            <CommandGroup>
              {options.map((option) => (
                <CommandItem
                  key={option}
                  value={option}
                  onSelect={(currentValue) => {
                    const matchedOption = options.find(
                      (o) => o.toLowerCase() === currentValue.toLowerCase()
                    ) || option;
                    handleToggle(matchedOption);
                  }}
                  className="flex items-center justify-between cursor-pointer animate-none"
                >
                  <span className="truncate">{option}</span>
                  <Check
                    className={cn(
                      "ml-auto h-4 w-4",
                      selectedList.includes(option) ? "opacity-100" : "opacity-0"
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


const ManageEvents = () => {
  const [activeTab, setActiveTab] = useState('events');
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string>('');
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Dialog & Form State
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentEvent, setCurrentEvent] = useState<Event | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Registration Row Selection
  const [selectedRegIds, setSelectedRegIds] = useState<string[]>([]);
  const [expandedRegId, setExpandedRegId] = useState<string | null>(null);
  const [regFilter, setRegFilter] = useState<'pending' | 'approved' | 'rejected'>('pending');
  const [isApproving, setIsApproving] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);

  const filteredRegistrations = useMemo(() => {
    return registrations.filter(r => r.status === regFilter);
  }, [registrations, regFilter]);

  // Attendance Checkboxes (Format: registrationId_memberId)
  const [selectedAttKeys, setSelectedAttKeys] = useState<string[]>([]);

  // Form Field State
  const [formData, setFormData] = useState({
    title: '',
    category: '',
    description: '',
    objectives: '',
    date: '',
    startTime: '10:00 AM',
    endTime: '05:00 PM',
    registrationStartDate: '',
    registrationEndDate: '',
    venue: '',
    building: '',
    roomNumber: '',
    totalSeats: 50,
    participationType: 'Both Allowed' as 'Individual Only' | 'Team Only' | 'Both Allowed',
    minTeamSize: 1,
    maxTeamSize: 10,
    allowedBranches: '',
    allowedYears: [] as string[],
    requiredSkills: '',
    organizer: '',
    coordinatorName: '',
    coordinatorContact: '',
    imageUrl: '',
    rules: '',
    eligibilityCriteria: '',
    schedule: '',
    isPublished: true,
    statusOverride: 'Active'
  });

  const fetchEvents = async () => {
    try {
      const res = await api.get('/events');
      setEvents(res.data);
      if (res.data.length > 0 && !selectedEventId) {
        setSelectedEventId(res.data[0]._id);
      }
    } catch (e) {
      toast.error('Failed to load events.');
    }
  };

  const fetchRegistrations = async (eventId: string) => {
    if (!eventId) return;
    try {
      const res = await api.get(`/events/${eventId}/registrations`);
      setRegistrations(res.data);
      setSelectedRegIds([]);
      setSelectedAttKeys([]);
      setExpandedRegId(null);
    } catch (e) {
      toast.error('Failed to fetch registrations.');
    }
  };

  useEffect(() => {
    setSelectedRegIds([]);
    setExpandedRegId(null);
  }, [regFilter]);

  const fetchAnalytics = async () => {
    try {
      const res = await api.get('/events/dashboard/analytics');
      setAnalytics(res.data);
    } catch (e) {
      console.error('Failed to fetch analytics', e);
    }
  };

  useEffect(() => {
    const init = async () => {
      setIsLoading(true);
      await fetchEvents();
      setIsLoading(false);
    };
    init();
  }, []);

  useEffect(() => {
    if (selectedEventId && (activeTab === 'registrations' || activeTab === 'attendance')) {
      fetchRegistrations(selectedEventId);
    }
  }, [selectedEventId, activeTab]);

  useEffect(() => {
    if (activeTab === 'analytics') {
      fetchAnalytics();
    }
  }, [activeTab]);

  // Open Dialog for Create/Edit
  const openFormDialog = (event: Event | null = null) => {
    setCurrentEvent(event);
    setImageFile(null);
    if (event) {
      setFormData({
        title: event.title,
        category: event.category,
        description: event.description,
        objectives: event.objectives || '',
        date: new Date(event.date).toISOString().split('T')[0],
        startTime: event.startTime,
        endTime: event.endTime,
        registrationStartDate: new Date(event.registrationStartDate).toISOString().split('T')[0],
        registrationEndDate: new Date(event.registrationEndDate).toISOString().split('T')[0],
        venue: event.venue,
        building: event.building || '',
        roomNumber: event.roomNumber || '',
        totalSeats: event.totalSeats,
        participationType: event.participationType || 'Both Allowed',
        minTeamSize: event.minTeamSize || 1,
        maxTeamSize: event.maxTeamSize || 10,
        allowedBranches: event.allowedBranches?.join(', ') || '',
        allowedYears: event.allowedYears || [],
        requiredSkills: event.requiredSkills?.join(', ') || '',
        organizer: event.organizer,
        coordinatorName: event.coordinatorName || '',
        coordinatorContact: event.coordinatorContact || '',
        imageUrl: event.imageUrl || '',
        rules: event.rules || '',
        eligibilityCriteria: event.eligibilityCriteria || '',
        schedule: event.schedule || '',
        isPublished: event.isPublished,
        statusOverride: event.statusOverride === 'Cancelled' ? 'Cancelled' : 'Active'
      });
    } else {
      setFormData({
        title: '',
        category: 'Workshop',
        description: '',
        objectives: '',
        date: '',
        startTime: '10:00 AM',
        endTime: '05:00 PM',
        registrationStartDate: '',
        registrationEndDate: '',
        venue: 'IDEA Lab',
        building: '',
        roomNumber: '',
        totalSeats: 50,
        participationType: 'Both Allowed',
        minTeamSize: 1,
        maxTeamSize: 10,
        allowedBranches: '',
        allowedYears: [],
        requiredSkills: '',
        organizer: 'AICTE IDEA Lab',
        coordinatorName: '',
        coordinatorContact: '',
        imageUrl: '',
        rules: '',
        eligibilityCriteria: '',
        schedule: '',
        isPublished: true,
        statusOverride: 'Active'
      });
    }
    setIsDialogOpen(true);
  };

  const handleYearToggle = (year: string) => {
    setFormData(prev => {
      const years = prev.allowedYears.includes(year)
        ? prev.allowedYears.filter(y => y !== year)
        : [...prev.allowedYears, year];
      return { ...prev, allowedYears: years };
    });
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const data = new FormData();
      data.append('title', formData.title);
      data.append('category', formData.category);
      data.append('description', formData.description);
      data.append('objectives', formData.objectives);
      data.append('date', new Date(formData.date).toISOString());
      data.append('startTime', formData.startTime);
      data.append('endTime', formData.endTime);
      data.append('registrationStartDate', new Date(formData.registrationStartDate).toISOString());
      data.append('registrationEndDate', new Date(formData.registrationEndDate).toISOString());
      data.append('venue', formData.venue);
      data.append('building', formData.building);
      data.append('roomNumber', formData.roomNumber);
      data.append('totalSeats', String(formData.totalSeats));
      data.append('participationType', formData.participationType);
      data.append('minTeamSize', String(formData.minTeamSize));
      data.append('maxTeamSize', String(formData.maxTeamSize));
      
      const parsedBranches = formData.allowedBranches.split(',').map(s => s.trim()).filter(Boolean);
      data.append('allowedBranches', JSON.stringify(parsedBranches));
      data.append('allowedYears', JSON.stringify(formData.allowedYears));
      const parsedSkills = formData.requiredSkills.split(',').map(s => s.trim()).filter(Boolean);
      data.append('requiredSkills', JSON.stringify(parsedSkills));
      
      data.append('organizer', formData.organizer);
      data.append('coordinatorName', formData.coordinatorName);
      data.append('coordinatorContact', formData.coordinatorContact);
      data.append('rules', formData.rules);
      data.append('eligibilityCriteria', formData.eligibilityCriteria);
      data.append('schedule', formData.schedule);
      data.append('isPublished', String(formData.isPublished));
      data.append('statusOverride', formData.statusOverride === 'Cancelled' ? 'Cancelled' : '');

      if (imageFile) {
        data.append('image', imageFile);
      } else if (formData.imageUrl) {
        data.append('imageUrl', formData.imageUrl);
      }

      if (currentEvent) {
        await api.put(`/events/${currentEvent._id}`, data, { headers: { 'Content-Type': 'multipart/form-data' } });
        toast.success('Event updated successfully');
      } else {
        await api.post('/events', data, { headers: { 'Content-Type': 'multipart/form-data' } });
        toast.success('Event created successfully');
      }
      setIsDialogOpen(false);
      fetchEvents();
    } catch (err) {
      toast.error('Failed to save event');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this event? This will delete all associated registrations.')) return;
    try {
      await api.delete(`/events/${id}`);
      toast.success('Event deleted successfully');
      fetchEvents();
    } catch (e) {
      toast.error('Failed to delete event');
    }
  };

  // Bulk Registration Decisions
  const handleBulkDecision = async (status: 'approved' | 'rejected') => {
    if (selectedRegIds.length === 0) {
      toast.warning('Please select at least one team registration.');
      return;
    }
    if (status === 'approved') setIsApproving(true);
    else setIsRejecting(true);
    try {
      await api.patch('/events/registrations/status', {
        registrationIds: selectedRegIds,
        status
      });
      toast.success(`Selected registrations marked as ${status}`);
      fetchRegistrations(selectedEventId);
    } catch (e) {
      toast.error('Failed to update registrations');
    } finally {
      if (status === 'approved') setIsApproving(false);
      else setIsRejecting(false);
    }
  };

  // Bulk Attendance Marking
  const handleBulkAttendance = async (attendance: 'present' | 'absent') => {
    if (selectedAttKeys.length === 0) {
      toast.warning('Please select at least one team member.');
      return;
    }
    try {
      const updates = selectedAttKeys.map(key => {
        const [registrationId, memberId] = key.split('_');
        return { registrationId, memberId, attendance };
      });
      await api.patch('/events/attendance', { updates });
      toast.success(`Selected members marked as ${attendance}`);
      fetchRegistrations(selectedEventId);
    } catch (e) {
      toast.error('Failed to update attendance status');
    }
  };

  // Checkbox functions for team registrations
  const toggleSelectReg = (id: string) => {
    setSelectedRegIds(prev => prev.includes(id) ? prev.filter(rId => rId !== id) : [...prev, id]);
  };

  const toggleSelectAllRegs = () => {
    if (selectedRegIds.length === filteredRegistrations.length && filteredRegistrations.length > 0) {
      setSelectedRegIds([]);
    } else {
      setSelectedRegIds(filteredRegistrations.map(r => r._id));
    }
  };

  // Checkbox functions for individual member attendance
  const approvedMembersList = useMemo(() => {
    const list: Array<{ registrationId: string; teamName: string; member: TeamMember }> = [];
    registrations.filter(r => r.status === 'approved').forEach(r => {
      r.teamMembers.forEach(m => {
        list.push({ registrationId: r._id, teamName: r.teamName, member: m });
      });
    });
    return list;
  }, [registrations]);

  const toggleSelectMember = (regId: string, memberId: string) => {
    const key = `${regId}_${memberId}`;
    setSelectedAttKeys(prev => prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]);
  };

  const toggleSelectAllMembers = () => {
    if (selectedAttKeys.length === approvedMembersList.length) {
      setSelectedAttKeys([]);
    } else {
      setSelectedAttKeys(approvedMembersList.map(item => `${item.registrationId}_${item.member._id}`));
    }
  };

  // Export CSV flat list of all members
  const handleExportCSV = () => {
    if (registrations.length === 0) return;
    const activeEventName = events.find(e => e._id === selectedEventId)?.title || 'Event';
    
    let csvContent = 'data:text/csv;charset=utf-8,';
    csvContent += 'Team Name,Member Name,PRN,Roll Number,Branch/Department,Year,Division,Email,Mobile,Role,Status,Attendance,Certificate\n';
    
    registrations.forEach(r => {
      r.teamMembers.forEach(m => {
        const row = [
          `"${r.teamName}"`,
          `"${m.fullName}"`,
          m.prn,
          m.rollNumber,
          m.department,
          m.year,
          m.division,
          m.email,
          m.mobile,
          m.isTeamLeader ? 'Leader' : 'Member',
          r.status,
          m.attendance,
          m.certificateNumber || 'None'
        ].join(',');
        csvContent += row + '\n';
      });
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `registrations_${activeEventName.replace(/\s+/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  // Export PDF flat list of all members
  const handleExportPDF = () => {
    if (registrations.length === 0) return;
    const activeEventName = events.find(e => e._id === selectedEventId)?.title || 'Event';
    
    const doc = new jsPDF('landscape');
    doc.setFontSize(16);
    doc.text(`AICTE IDEA Lab - Event Participant list`, 14, 20);
    doc.setFontSize(11);
    doc.text(`Event: ${activeEventName}`, 14, 28);
    doc.text(`Export Date: ${new Date().toLocaleDateString()}`, 14, 34);

    const cols = ['Team Name', 'Member Name', 'PRN', 'Branch', 'Year', 'Email', 'Mobile', 'Attendance'];
    const rows: string[][] = [];
    registrations.forEach(r => {
      r.teamMembers.forEach(m => {
        rows.push([
          r.teamName,
          m.fullName + (m.isTeamLeader ? ' (Leader)' : ''),
          m.prn,
          m.department,
          m.year,
          m.email,
          m.mobile,
          m.attendance.toUpperCase()
        ]);
      });
    });

    autoTable(doc, {
      head: [cols],
      body: rows,
      startY: 40,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [26, 35, 126] }
    });

    doc.save(`participant_list_${activeEventName.replace(/\s+/g, '_')}.pdf`);
  };

  // Individual attendance metrics helper
  const attendanceMetrics = useMemo(() => {
    let present = 0;
    let absent = 0;
    let pending = 0;
    registrations.filter(r => r.status === 'approved').forEach(r => {
      r.teamMembers.forEach(m => {
        if (m.attendance === 'present') present++;
        else if (m.attendance === 'absent') absent++;
        else pending++;
      });
    });
    const total = present + absent;
    const percentage = total > 0 ? Math.round((present / total) * 100) : 0;
    return { present, absent, pending, percentage };
  }, [registrations]);

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4 pt-4 border-b pb-6">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground/90">Coordinator Event Dashboard</h1>
          <p className="text-muted-foreground mt-1">Configure event dynamic boundaries, approve multi-member teams, mark individual attendance and view analytics.</p>
        </div>
        <Button onClick={() => openFormDialog()} className="shadow-lg hover:shadow-primary/20 transition-all">
          <PlusCircle className="mr-2 h-4 w-4" /> Create Event
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList 
          className="bg-muted/50 p-1 rounded-xl w-full flex overflow-x-auto whitespace-nowrap justify-start md:inline-flex md:justify-center [&::-webkit-scrollbar]:hidden h-auto md:h-12"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          <TabsTrigger value="events" className="rounded-lg font-semibold px-5 py-2.5">Events List</TabsTrigger>
          <TabsTrigger value="registrations" className="rounded-lg font-semibold px-5 py-2.5">Manage Registrations</TabsTrigger>
          <TabsTrigger value="attendance" className="rounded-lg font-semibold px-5 py-2.5">Attendance Tracker</TabsTrigger>
          <TabsTrigger value="analytics" className="rounded-lg font-semibold px-5 py-2.5">Event Analytics</TabsTrigger>
        </TabsList>

        {/* Tab 1: Events List */}
        <TabsContent value="events" className="space-y-4">
          {isLoading ? (
            <div className="flex justify-center items-center py-20">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : events.length === 0 ? (
            <div className="text-center py-16 bg-muted/10 border border-dashed rounded-2xl">
              <Calendar className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
              <p className="text-muted-foreground text-md font-medium">No events found. Start by creating a new event.</p>
              <Button onClick={() => openFormDialog()} size="sm" className="mt-3">Create First Event</Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {events.map((event) => (
                <Card key={event._id} className="bg-card/50 hover:bg-card border shadow-sm hover:shadow-md transition-all rounded-2xl overflow-hidden">
                  <CardContent className="p-5 flex flex-col md:flex-row gap-5">
                    {/* Media thumbnail */}
                    <div className="w-full md:w-32 aspect-video md:aspect-square shrink-0 rounded-xl overflow-hidden bg-muted border">
                      {event.imageUrl ? (
                        <img src={event.imageUrl} alt={event.title} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-muted-foreground/20"><Calendar className="w-8 h-8" /></div>
                      )}
                    </div>
                    {/* Info */}
                    <div className="flex-grow flex flex-col justify-between space-y-3">
                      <div>
                        <div className="flex justify-between items-start gap-2">
                          <h3 className="font-bold text-lg text-foreground line-clamp-1">{event.title}</h3>
                          <Badge variant="outline" className={`font-bold text-[10px] rounded-full border shrink-0 ${getStatusColor(event.status)}`}>
                            {event.status}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground font-semibold mt-0.5">{event.category} • {event.organizer}</p>
                        
                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground font-medium pt-2">
                          <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5 text-primary/70" /> {new Date(event.date).toLocaleDateString()}</span>
                          <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5 text-primary/70" /> {event.startTime}</span>
                        </div>
                        <p className="text-[10px] font-bold text-primary bg-primary/5 px-2 py-0.5 mt-2 rounded inline-block">
                          {event.participationType} • Limits: {event.minTeamSize}-{event.maxTeamSize} members
                        </p>
                      </div>

                      <div className="flex justify-between items-center pt-3 border-t">
                        <span className="text-xs text-muted-foreground font-semibold">Published: <strong className={event.isPublished ? 'text-emerald-500' : 'text-slate-500'}>{event.isPublished ? 'Yes' : 'No'}</strong></span>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" className="rounded-xl h-8 text-xs font-semibold" onClick={() => openFormDialog(event)}>
                            <Edit className="w-3.5 h-3.5 mr-1" /> Edit
                          </Button>
                          <Button size="sm" variant="destructive" className="rounded-xl h-8 text-xs font-semibold" onClick={() => handleDelete(event._id)}>
                            <Trash2 className="w-3.5 h-3.5 mr-1" /> Delete
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Tab 2: Manage Registrations */}
        <TabsContent value="registrations" className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-muted/20 p-4 rounded-xl border">
            <div className="space-y-1.5 w-full sm:w-80">
              <Label htmlFor="regSelect" className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Select Event</Label>
              <select
                id="regSelect"
                className="w-full h-10 px-3 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                value={selectedEventId}
                onChange={(e) => setSelectedEventId(e.target.value)}
              >
                {events.map(e => (
                  <option key={e._id} value={e._id}>{e.title}</option>
                ))}
              </select>
            </div>

            <div className="flex flex-wrap gap-2 w-full sm:w-auto justify-start sm:justify-end">
              <Button size="sm" className="rounded-xl text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-semibold animate-all flex-1 sm:flex-initial" onClick={() => handleBulkDecision('approved')} disabled={isApproving || isRejecting}>
                {isApproving && <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />}
                Approve Selected
              </Button>
              <Button size="sm" className="rounded-xl text-xs bg-rose-600 hover:bg-rose-700 text-white font-semibold animate-all flex-1 sm:flex-initial" onClick={() => handleBulkDecision('rejected')} disabled={isApproving || isRejecting}>
                {isRejecting && <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />}
                Reject Selected
              </Button>
              <Button size="sm" variant="outline" className="rounded-xl text-xs font-semibold gap-1.5 flex-1 sm:flex-initial" onClick={handleExportCSV}>
                <FileSpreadsheet className="w-3.5 h-3.5" /> Export Excel
              </Button>
              <Button size="sm" variant="outline" className="rounded-xl text-xs font-semibold gap-1.5 flex-1 sm:flex-initial" onClick={handleExportPDF}>
                <FileDown className="w-3.5 h-3.5" /> Export PDF
              </Button>
            </div>
          </div>

          <div className="flex gap-2 overflow-x-auto pb-2 w-full scrollbar-hide" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
            <Button variant={regFilter === 'pending' ? 'default' : 'outline'} onClick={() => setRegFilter('pending')} size="sm" className="rounded-xl font-semibold whitespace-nowrap shrink-0">Pending Registrations</Button>
            <Button variant={regFilter === 'approved' ? 'default' : 'outline'} onClick={() => setRegFilter('approved')} size="sm" className="rounded-xl font-semibold whitespace-nowrap shrink-0">Approved Registrations</Button>
            <Button variant={regFilter === 'rejected' ? 'default' : 'outline'} onClick={() => setRegFilter('rejected')} size="sm" className="rounded-xl font-semibold whitespace-nowrap shrink-0">Rejected Registrations</Button>
          </div>

          <Card className="rounded-2xl shadow-sm border overflow-hidden">
            <div className="overflow-x-auto w-full">
              <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12 text-center">
                    <Checkbox 
                      checked={filteredRegistrations.length > 0 && selectedRegIds.length === filteredRegistrations.length} 
                      onCheckedChange={toggleSelectAllRegs}
                    />
                  </TableHead>
                  <TableHead>Registration ID</TableHead>
                  <TableHead>Team Name</TableHead>
                  <TableHead>Team Leader</TableHead>
                  <TableHead className="text-center">Members Count</TableHead>
                  <TableHead>Register Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-16 text-center">View</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRegistrations.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-10 text-muted-foreground">No {regFilter} registrations found.</TableCell>
                  </TableRow>
                ) : (
                  filteredRegistrations.map((reg) => {
                    const isExpanded = expandedRegId === reg._id;
                    const leader = reg.teamMembers.find(m => m.isTeamLeader) || reg.teamMembers[0];

                    return (
                      <>
                        <TableRow key={reg._id} className="hover:bg-muted/5 border-b">
                          <TableCell className="text-center">
                            <Checkbox 
                              checked={selectedRegIds.includes(reg._id)} 
                              onCheckedChange={() => toggleSelectReg(reg._id)}
                            />
                          </TableCell>
                          <TableCell className="font-bold text-xs text-primary">{reg.registrationId}</TableCell>
                          <TableCell className="font-semibold text-sm">{reg.teamName}</TableCell>
                          <TableCell>
                            <div className="font-semibold text-sm">{leader?.fullName}</div>
                            <div className="text-xs text-muted-foreground">{leader?.email}</div>
                          </TableCell>
                          <TableCell className="text-center font-bold text-sm">{reg.teamSize}</TableCell>
                          <TableCell className="text-xs">{new Date(reg.registrationDate).toLocaleDateString()}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className={`font-bold text-[10px] uppercase ${
                              reg.status === 'approved' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
                              reg.status === 'rejected' ? 'bg-rose-500/10 text-rose-500 border-rose-500/20' :
                              'bg-amber-500/10 text-amber-500 border-amber-500/20'
                            }`}>
                              {reg.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center">
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              onClick={() => setExpandedRegId(isExpanded ? null : reg._id)}
                              className="h-8 w-8 rounded-full"
                            >
                              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                            </Button>
                          </TableCell>
                        </TableRow>

                        {/* Collapsible Row displaying nested table of members */}
                        {isExpanded && (
                          <TableRow className="bg-muted/10">
                            <TableCell colSpan={8} className="p-4">
                              <div className="border rounded-xl bg-background p-4 space-y-3">
                                <h4 className="text-xs font-bold text-primary uppercase tracking-wide">Team Composition details</h4>
                                <div className="overflow-x-auto w-full">
                                  <Table>
                                    <TableHeader className="bg-muted/20">
                                      <TableRow>
                                        <TableHead className="text-xs font-bold">Member Name</TableHead>
                                        <TableHead className="text-xs font-bold">PRN</TableHead>
                                        <TableHead className="text-xs font-bold">Roll</TableHead>
                                        <TableHead className="text-xs font-bold">Branch/Year</TableHead>
                                        <TableHead className="text-xs font-bold">Division</TableHead>
                                        <TableHead className="text-xs font-bold">Contact Email / Phone</TableHead>
                                        <TableHead className="text-xs font-bold">Role Badge</TableHead>
                                      </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                      {reg.teamMembers.map((member) => (
                                        <TableRow key={member._id}>
                                          <TableCell className="text-xs font-semibold text-foreground">{member.fullName}</TableCell>
                                          <TableCell className="text-xs font-mono">{member.prn}</TableCell>
                                          <TableCell className="text-xs">{member.rollNumber}</TableCell>
                                          <TableCell className="text-xs">{member.department} / {member.year}</TableCell>
                                          <TableCell className="text-xs">{member.division}</TableCell>
                                          <TableCell className="text-xs">
                                            <div>{member.email}</div>
                                            <div className="text-[10px] text-muted-foreground">{member.mobile}</div>
                                          </TableCell>
                                          <TableCell>
                                            {member.isTeamLeader ? (
                                              <Badge className="bg-amber-500 text-[9px] font-bold"><Star className="w-2.5 h-2.5 mr-0.5" /> Leader</Badge>
                                            ) : (
                                              <Badge variant="secondary" className="text-[9px] font-bold">Member</Badge>
                                            )}
                                          </TableCell>
                                        </TableRow>
                                      ))}
                                    </TableBody>
                                  </Table>
                                </div>

                                {/* Project Description metadata info */}
                                {(reg.projectTitle || reg.problemStatement || reg.projectDescription || reg.skills) && (
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t pt-4 text-xs">
                                    <div className="space-y-1">
                                      {reg.projectTitle && <p><strong>Project Title:</strong> {reg.projectTitle}</p>}
                                      {reg.skills && <p><strong>Skills/Interests:</strong> {reg.skills}</p>}
                                    </div>
                                    <div className="space-y-1">
                                      {reg.problemStatement && <p><strong>Problem Statement:</strong> {reg.problemStatement}</p>}
                                      {reg.projectDescription && <p><strong>Project Description:</strong> {reg.projectDescription}</p>}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                      </>
                    );
                  })
                )}
              </TableBody>
            </Table>
            </div>
          </Card>
        </TabsContent>

        {/* Tab 3: Attendance Tracker */}
        <TabsContent value="attendance" className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-muted/20 p-4 rounded-xl border">
            <div className="space-y-1.5 w-full sm:w-80">
              <Label htmlFor="attSelect" className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Select Event</Label>
              <select
                id="attSelect"
                className="w-full h-10 px-3 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                value={selectedEventId}
                onChange={(e) => setSelectedEventId(e.target.value)}
              >
                {events.map(e => (
                  <option key={e._id} value={e._id}>{e.title}</option>
                ))}
              </select>
            </div>

            <div className="flex flex-wrap gap-2 w-full sm:w-auto justify-start sm:justify-end">
              <Button size="sm" className="rounded-xl text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-semibold flex-1 sm:flex-initial" onClick={() => handleBulkAttendance('present')}>
                Mark Present
              </Button>
              <Button size="sm" className="rounded-xl text-xs bg-rose-600 hover:bg-rose-700 text-white font-semibold flex-1 sm:flex-initial" onClick={() => handleBulkAttendance('absent')}>
                Mark Absent
              </Button>
            </div>
          </div>

          {/* Attendance Stats Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="bg-card/40 border p-4 shadow-sm rounded-xl">
              <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Present Count</p>
              <p className="text-2xl font-black text-emerald-500 mt-1">{attendanceMetrics.present}</p>
            </Card>
            <Card className="bg-card/40 border p-4 shadow-sm rounded-xl">
              <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Absent Count</p>
              <p className="text-2xl font-black text-rose-500 mt-1">{attendanceMetrics.absent}</p>
            </Card>
            <Card className="bg-card/40 border p-4 shadow-sm rounded-xl">
              <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Pending Status</p>
              <p className="text-2xl font-black text-amber-500 mt-1">{attendanceMetrics.pending}</p>
            </Card>
            <Card className="bg-card/40 border p-4 shadow-sm rounded-xl">
              <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Attendance Percentage</p>
              <p className="text-2xl font-black text-primary mt-1">{attendanceMetrics.percentage}%</p>
            </Card>
          </div>

          <Card className="rounded-2xl shadow-sm border overflow-hidden">
            <div className="overflow-x-auto w-full">
              <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12 text-center">
                    <Checkbox 
                      checked={approvedMembersList.length > 0 && selectedAttKeys.length === approvedMembersList.length} 
                      onCheckedChange={toggleSelectAllMembers}
                    />
                  </TableHead>
                  <TableHead>Member Name</TableHead>
                  <TableHead>PRN</TableHead>
                  <TableHead>Team Name</TableHead>
                  <TableHead>Branch / Year</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Attendance Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {approvedMembersList.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-10 text-muted-foreground">No approved participants found for this event.</TableCell>
                  </TableRow>
                ) : (
                  approvedMembersList.map(({ registrationId, teamName, member }) => {
                    const key = `${registrationId}_${member._id}`;
                    return (
                      <TableRow key={key} className="hover:bg-muted/10">
                        <TableCell className="text-center">
                          <Checkbox 
                            checked={selectedAttKeys.includes(key)} 
                            onCheckedChange={() => toggleSelectMember(registrationId, member._id)}
                          />
                        </TableCell>
                        <TableCell className="font-semibold text-sm">{member.fullName}</TableCell>
                        <TableCell className="text-xs font-mono">{member.prn}</TableCell>
                        <TableCell className="text-xs font-bold text-muted-foreground">{teamName}</TableCell>
                        <TableCell className="text-xs">{member.department} / {member.year}</TableCell>
                        <TableCell>
                          {member.isTeamLeader ? (
                            <Badge className="bg-amber-500 text-[9px] font-bold">Leader</Badge>
                          ) : (
                            <Badge variant="secondary" className="text-[9px] font-bold">Member</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={`font-bold text-[10px] uppercase ${
                            member.attendance === 'present' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
                            member.attendance === 'absent' ? 'bg-rose-500/10 text-rose-500 border-rose-500/20' :
                            'bg-amber-500/10 text-amber-500 border-amber-500/20'
                          }`}>
                            {member.attendance}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
            </div>
          </Card>
        </TabsContent>

        {/* Tab 4: Analytics */}
        <TabsContent value="analytics" className="space-y-6">
          {analytics ? (
            <>
              {/* Summary stats */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                <Card className="bg-card border shadow-sm rounded-2xl">
                  <CardContent className="p-5 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Total Events</p>
                      <p className="text-3xl font-extrabold text-foreground mt-1">{analytics.summary.totalEvents}</p>
                    </div>
                    <div className="h-10 w-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary"><Calendar className="w-5 h-5" /></div>
                  </CardContent>
                </Card>
                <Card className="bg-card border shadow-sm rounded-2xl">
                  <CardContent className="p-5 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Total Registrations</p>
                      <p className="text-3xl font-extrabold text-foreground mt-1">{analytics.summary.totalRegistrations}</p>
                    </div>
                    <div className="h-10 w-10 bg-blue-500/10 rounded-xl flex items-center justify-center text-blue-500"><Users className="w-5 h-5" /></div>
                  </CardContent>
                </Card>
                <Card className="bg-card border shadow-sm rounded-2xl">
                  <CardContent className="p-5 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Attendance %</p>
                      <p className="text-3xl font-extrabold text-foreground mt-1">{analytics.summary.attendancePercentage}%</p>
                    </div>
                    <div className="h-10 w-10 bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-500"><TrendingUp className="w-5 h-5" /></div>
                  </CardContent>
                </Card>
                <Card className="bg-card border shadow-sm rounded-2xl">
                  <CardContent className="p-5 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Certificates Issued</p>
                      <p className="text-3xl font-extrabold text-foreground mt-1">{analytics.summary.certificatesGenerated}</p>
                    </div>
                    <div className="h-10 w-10 bg-amber-500/10 rounded-xl flex items-center justify-center text-amber-500"><CheckCircle className="w-5 h-5" /></div>
                  </CardContent>
                </Card>
              </div>

              {/* Graphical Visualizations using elegant CSS flex meters */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                
                {/* 1. Registrations Per Event Chart */}
                <Card className="rounded-2xl border shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-md font-bold">Registrations per Event</CardTitle>
                    <CardDescription>Event booking metrics</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {analytics.charts.regPerEvent.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-10">No data available.</p>
                    ) : (
                      analytics.charts.regPerEvent.map(item => {
                        const maxCount = Math.max(...analytics.charts.regPerEvent.map(i => i.count), 1);
                        const pct = Math.round((item.count / maxCount) * 100);
                        return (
                          <div key={item.name} className="space-y-1.5">
                            <div className="flex justify-between text-xs font-semibold text-muted-foreground">
                              <span className="text-foreground truncate max-w-[80%]">{item.name}</span>
                              <span>{item.count} regs</span>
                            </div>
                            <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                              <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${pct}%` }}></div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </CardContent>
                </Card>

                {/* 2. Department Wise Participation */}
                <Card className="rounded-2xl border shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-md font-bold">Department Wise Participation</CardTitle>
                    <CardDescription>Participation distribution by department</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {analytics.charts.deptParticipation.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-10">No data available.</p>
                    ) : (
                      analytics.charts.deptParticipation.map(item => {
                        const maxCount = Math.max(...analytics.charts.deptParticipation.map(i => i.count), 1);
                        const pct = Math.round((item.count / maxCount) * 100);
                        return (
                          <div key={item.name} className="space-y-1.5">
                            <div className="flex justify-between text-xs font-semibold text-muted-foreground">
                              <span className="text-foreground uppercase">{item.name || 'General'}</span>
                              <span>{item.count}</span>
                            </div>
                            <div className="h-2.5 w-full bg-muted rounded-full overflow-hidden">
                              <div className="h-full bg-emerald-500 rounded-full transition-all" style={{ width: `${pct}%` }}></div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </CardContent>
                </Card>

                {/* 3. Year Wise Participation */}
                <Card className="rounded-2xl border shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-md font-bold">Year Wise Participation</CardTitle>
                    <CardDescription>Distribution by engineering year</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {analytics.charts.yearParticipation.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-10">No data available.</p>
                    ) : (
                      analytics.charts.yearParticipation.map(item => {
                        const maxCount = Math.max(...analytics.charts.yearParticipation.map(i => i.count), 1);
                        const pct = Math.round((item.count / maxCount) * 100);
                        return (
                          <div key={item.name} className="space-y-1.5">
                            <div className="flex justify-between text-xs font-semibold text-muted-foreground">
                              <span className="text-foreground uppercase">{item.name || 'N/A'}</span>
                              <span>{item.count}</span>
                            </div>
                            <div className="h-2.5 w-full bg-muted rounded-full overflow-hidden">
                              <div className="h-full bg-purple-500 rounded-full transition-all" style={{ width: `${pct}%` }}></div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </CardContent>
                </Card>

                {/* 4. Event Attendance Metrics */}
                <Card className="rounded-2xl border shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-md font-bold">Event Attendance Analysis</CardTitle>
                    <CardDescription>Present vs Absent statistics</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {analytics.charts.attendancePerEvent.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-10">No data available.</p>
                    ) : (
                      analytics.charts.attendancePerEvent.map(item => {
                        const total = item.present + item.absent || 1;
                        const presentPct = Math.round((item.present / total) * 100);
                        const absentPct = Math.round((item.absent / total) * 100);
                        return (
                          <div key={item.name} className="space-y-1.5">
                            <div className="flex justify-between text-xs font-semibold text-muted-foreground">
                              <span className="text-foreground truncate max-w-[60%]">{item.name}</span>
                              <span className="text-xs">P: {item.present} | A: {item.absent}</span>
                            </div>
                            <div className="h-2.5 w-full bg-muted rounded-full overflow-hidden flex">
                              <div className="h-full bg-emerald-500 transition-all" style={{ width: `${presentPct}%` }}></div>
                              <div className="h-full bg-rose-500 transition-all" style={{ width: `${absentPct}%` }}></div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </CardContent>
                </Card>

              </div>
            </>
          ) : (
            <div className="text-center py-20">Loading analytics records...</div>
          )}
        </TabsContent>
      </Tabs>

      {/* Create / Edit Form Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="w-[95vw] max-w-[95vw] sm:max-w-3xl lg:max-w-5xl max-h-[90vh] overflow-hidden rounded-t-3xl sm:rounded-3xl p-0 flex flex-col">
          <DialogHeader className="p-6 pb-4 border-b bg-background shrink-0">
            <DialogTitle className="text-xl sm:text-3xl font-bold text-foreground text-center sm:text-left pr-8">
              {currentEvent ? 'Edit Event Details' : 'Create New Event'}
            </DialogTitle>
            <DialogDescription className="text-sm text-slate-500 text-center sm:text-left">
              Fill all information components to configure the event.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleFormSubmit} className="flex flex-col flex-grow overflow-hidden">
            {/* Scrollable Content Area */}
            <div className="flex-grow overflow-y-auto p-6 space-y-6">
              
              {/* Tabbed Form Section */}
              <Tabs defaultValue="basic" className="space-y-6 w-full max-w-full">
                <TabsList 
                  className="bg-muted/50 p-0.5 rounded-lg text-xs w-full flex overflow-x-auto whitespace-nowrap justify-start [&::-webkit-scrollbar]:hidden h-auto scrollbar-hide"
                  style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                >
                  <TabsTrigger value="basic" className="min-w-max px-4 py-2 text-xs font-semibold rounded-md">Basic Info</TabsTrigger>
                  <TabsTrigger value="schedule" className="min-w-max px-4 py-2 text-xs font-semibold rounded-md">Schedule & Date</TabsTrigger>
                  <TabsTrigger value="venue" className="min-w-max px-4 py-2 text-xs font-semibold rounded-md">Venue & Capacity</TabsTrigger>
                  <TabsTrigger value="eligibility" className="min-w-max px-4 py-2 text-xs font-semibold rounded-md">Eligibility Criteria</TabsTrigger>
                  <TabsTrigger value="media" className="min-w-max px-4 py-2 text-xs font-semibold rounded-md">Media & Extra</TabsTrigger>
                </TabsList>

                {/* Form Tab 1: Basic */}
                <TabsContent value="basic" className="pt-2">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1 md:col-span-2">
                      <Label htmlFor="title" className="text-xs font-semibold">Event Name</Label>
                      <Input id="title" value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} placeholder="Enter event name" required />
                    </div>
                    
                    <div className="space-y-1 md:col-span-2">
                      <Label htmlFor="category" className="text-xs font-semibold">Event Category</Label>
                      <select 
                        id="category"
                        className="w-full h-10 px-3 rounded-md border text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 bg-background"
                        value={formData.category}
                        onChange={e => setFormData({ ...formData, category: e.target.value })}
                      >
                        <option value="Workshop">Workshop</option>
                        <option value="Competition">Competition</option>
                        <option value="Seminar">Seminar</option>
                        <option value="Hackathon">Hackathon</option>
                        <option value="General">General Event</option>
                      </select>
                    </div>

                    <div className="space-y-1 md:col-span-2">
                      <Label htmlFor="description" className="text-xs font-semibold">Event Description</Label>
                      <Textarea id="description" className="min-h-[100px] md:min-h-[140px]" value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} placeholder="Detail the event description..." required />
                    </div>

                    <div className="space-y-1 md:col-span-2">
                      <Label htmlFor="objectives" className="text-xs font-semibold">Event Objectives</Label>
                      <Textarea id="objectives" className="min-h-[100px] md:min-h-[140px]" value={formData.objectives} onChange={e => setFormData({ ...formData, objectives: e.target.value })} placeholder="What will the participants learn or achieve..." />
                    </div>
                  </div>
                </TabsContent>

                {/* Form Tab 2: Schedule */}
                <TabsContent value="schedule" className="pt-2">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <Label htmlFor="date" className="text-xs font-semibold">Event Date</Label>
                      <Input id="date" type="date" value={formData.date} onChange={e => setFormData({ ...formData, date: e.target.value })} required />
                    </div>
                    <div className="space-y-1 hidden md:block"></div> {/* Filler for grid alignment */}
                    
                    <div className="space-y-1">
                      <Label htmlFor="startTime" className="text-xs font-semibold">Start Time</Label>
                      <Input id="startTime" placeholder="Ex. 10:00 AM" value={formData.startTime} onChange={e => setFormData({ ...formData, startTime: e.target.value })} required />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="endTime" className="text-xs font-semibold">End Time</Label>
                      <Input id="endTime" placeholder="Ex. 05:00 PM" value={formData.endTime} onChange={e => setFormData({ ...formData, endTime: e.target.value })} required />
                    </div>

                    <div className="space-y-1">
                      <Label htmlFor="regStart" className="text-xs font-semibold">Registration Start Date</Label>
                      <Input id="regStart" type="date" value={formData.registrationStartDate} onChange={e => setFormData({ ...formData, registrationStartDate: e.target.value })} required />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="regEnd" className="text-xs font-semibold">Registration End Date</Label>
                      <Input id="regEnd" type="date" value={formData.registrationEndDate} onChange={e => setFormData({ ...formData, registrationEndDate: e.target.value })} required />
                    </div>
                  </div>
                </TabsContent>

                {/* Form Tab 3: Venue & Capacity */}
                <TabsContent value="venue" className="pt-2">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1 md:col-span-2">
                      <Label htmlFor="venue" className="text-xs font-semibold">Venue / Lab</Label>
                      <Input id="venue" value={formData.venue} onChange={e => setFormData({ ...formData, venue: e.target.value })} required />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="building" className="text-xs font-semibold">Building</Label>
                      <Input id="building" value={formData.building} onChange={e => setFormData({ ...formData, building: e.target.value })} placeholder="Ex. Main Building" />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="roomNumber" className="text-xs font-semibold">Room Number</Label>
                      <Input id="roomNumber" value={formData.roomNumber} onChange={e => setFormData({ ...formData, roomNumber: e.target.value })} placeholder="Ex. 201" />
                    </div>

                    <div className="space-y-1">
                      <Label htmlFor="totalSeats" className="text-xs font-semibold">Total Seats Capacity</Label>
                      <Input id="totalSeats" type="number" value={formData.totalSeats} onChange={e => setFormData({ ...formData, totalSeats: parseInt(e.target.value, 10) })} required />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="partType" className="text-xs font-semibold">Participation Type</Label>
                      <select 
                        id="partType"
                        className="w-full h-10 px-3 rounded-md border text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 bg-background"
                        value={formData.participationType}
                        onChange={e => setFormData({ ...formData, participationType: e.target.value as any })}
                      >
                        <option value="Individual Only">Individual Only</option>
                        <option value="Team Only">Team Only</option>
                        <option value="Both Allowed">Both Allowed</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <Label htmlFor="minTeam" className="text-xs font-semibold">Minimum Team Size</Label>
                      <Input id="minTeam" type="number" value={formData.minTeamSize} onChange={e => setFormData({ ...formData, minTeamSize: parseInt(e.target.value, 10) })} required />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="maxTeam" className="text-xs font-semibold">Maximum Team Size</Label>
                      <Input id="maxTeam" type="number" value={formData.maxTeamSize} onChange={e => setFormData({ ...formData, maxTeamSize: parseInt(e.target.value, 10) })} required />
                    </div>
                  </div>
                </TabsContent>

                {/* Form Tab 4: Eligibility */}
                <TabsContent value="eligibility" className="pt-2">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-3 md:col-span-2">
                      <div className="flex items-center gap-2 pt-1">
                        <Checkbox 
                          id="allowAllBranches" 
                          checked={formData.allowedBranches === ""}
                          onCheckedChange={(checked) => {
                            if (checked === true) {
                              setFormData({ ...formData, allowedBranches: "" });
                            } else {
                              setFormData({ ...formData, allowedBranches: DEPARTMENTS[0] });
                            }
                          }}
                        />
                        <Label htmlFor="allowAllBranches" className="text-xs font-bold cursor-pointer">Allow All Departments / Branches</Label>
                      </div>

                      {formData.allowedBranches !== "" && (
                        <div className="space-y-1 animate-in fade-in duration-200">
                          <Label htmlFor="allowedBranches" className="text-xs font-semibold">Allowed Branches</Label>
                          <MultiSelect
                            value={formData.allowedBranches}
                            onChange={(val) => setFormData({ ...formData, allowedBranches: val })}
                            options={DEPARTMENTS}
                            placeholder="Select Allowed Branches"
                          />
                        </div>
                      )}
                    </div>

                    <div className="space-y-2 md:col-span-2">
                      <Label className="text-xs font-semibold">Allowed Year Levels</Label>
                      <div className="flex flex-wrap gap-4">
                        {['FE', 'SE', 'TE', 'BE'].map(year => (
                          <div key={year} className="flex items-center gap-1.5">
                            <Checkbox 
                              id={`year-${year}`} 
                              checked={formData.allowedYears.includes(year)}
                              onCheckedChange={() => handleYearToggle(year)}
                            />
                            <Label htmlFor={`year-${year}`} className="text-xs font-medium cursor-pointer">{year}</Label>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-1 md:col-span-2">
                      <Label htmlFor="requiredSkills" className="text-xs font-semibold">Required Skills (comma separated)</Label>
                      <Input id="requiredSkills" value={formData.requiredSkills} onChange={e => setFormData({ ...formData, requiredSkills: e.target.value })} placeholder="Ex. React, MongoDB, Python" />
                    </div>

                    <div className="space-y-1 md:col-span-2">
                      <Label htmlFor="eligibilityCriteria" className="text-xs font-semibold">Detailed Eligibility Notes</Label>
                      <Textarea id="eligibilityCriteria" className="min-h-[100px] md:min-h-[140px]" value={formData.eligibilityCriteria} onChange={e => setFormData({ ...formData, eligibilityCriteria: e.target.value })} placeholder="Detail any other prerequisites..." />
                    </div>
                  </div>
                </TabsContent>

                {/* Form Tab 5: Media & Extra */}
                <TabsContent value="media" className="pt-2">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <Label htmlFor="imageFile" className="text-xs font-semibold">Banner Image Upload</Label>
                      <Input id="imageFile" type="file" accept="image/*" className="cursor-pointer bg-background" onChange={e => setImageFile(e.target.files?.[0] || null)} />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="imageUrl" className="text-xs font-semibold">Or Image URL</Label>
                      <Input id="imageUrl" value={formData.imageUrl} onChange={e => setFormData({ ...formData, imageUrl: e.target.value })} placeholder="https://..." />
                    </div>

                    <div className="space-y-1">
                      <Label htmlFor="orgName" className="text-xs font-semibold">Organizer Name</Label>
                      <Input id="orgName" value={formData.organizer} onChange={e => setFormData({ ...formData, organizer: e.target.value })} required />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="coordName" className="text-xs font-semibold">Coordinator Name</Label>
                      <Input id="coordName" value={formData.coordinatorName} onChange={e => setFormData({ ...formData, coordinatorName: e.target.value })} />
                    </div>
                    <div className="space-y-1 md:col-span-2">
                      <Label htmlFor="coordContact" className="text-xs font-semibold">Coordinator Contact</Label>
                      <Input id="coordContact" value={formData.coordinatorContact} onChange={e => setFormData({ ...formData, coordinatorContact: e.target.value })} />
                    </div>

                    <div className="space-y-1 md:col-span-2">
                      <Label htmlFor="rules" className="text-xs font-semibold">Event Agenda / Rules Markdown</Label>
                      <Textarea id="rules" className="min-h-[100px] md:min-h-[140px]" value={formData.rules} onChange={e => setFormData({ ...formData, rules: e.target.value })} placeholder="List down regulations and rules..." />
                    </div>

                    <div className="space-y-1 md:col-span-2">
                      <Label htmlFor="schedule" className="text-xs font-semibold">Event Agenda Schedule</Label>
                      <Textarea id="schedule" className="min-h-[100px] md:min-h-[140px]" value={formData.schedule} onChange={e => setFormData({ ...formData, schedule: e.target.value })} placeholder="List down timings and events timeline..." />
                    </div>

                    <div className="flex flex-wrap gap-6 md:col-span-2 border-t pt-4">
                      <div className="flex items-center gap-2">
                        <Checkbox id="isPub" checked={formData.isPublished} onCheckedChange={checked => setFormData({ ...formData, isPublished: checked === true })} />
                        <Label htmlFor="isPub" className="text-xs font-bold cursor-pointer">Publish Event Immediately</Label>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Checkbox id="isCancelled" checked={formData.statusOverride === 'Cancelled'} onCheckedChange={checked => setFormData({ ...formData, statusOverride: checked === true ? 'Cancelled' : 'Active' })} />
                        <Label htmlFor="isCancelled" className="text-xs font-bold text-rose-500 cursor-pointer">Mark Event Cancelled</Label>
                      </div>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>

            </div>

            {/* Sticky Footer */}
            <DialogFooter className="sticky bottom-0 bg-background border-t p-6 flex flex-col-reverse sm:flex-row gap-3 sm:space-x-0 justify-end w-full shrink-0">
              <Button type="button" variant="outline" className="w-full sm:w-auto rounded-xl h-10" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
              <Button type="submit" className="w-full sm:w-auto rounded-xl h-10 bg-primary hover:bg-primary/95 text-white font-bold" disabled={isSaving}>
                {isSaving ? 'Saving...' : (currentEvent ? 'Update Event' : 'Create Event')}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ManageEvents;
