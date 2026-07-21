import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { toast } from "sonner";
import axios from "../lib/axios";
import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Users, Clock, AlertCircle, Info } from "lucide-react";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";

interface Slot {
  startTime: string; // HH:mm
  endTime: string;   // HH:mm
  label?: string;    // Display label
  _id?: string;
}

interface Room {
  _id: string;
  name: string;
  capacity: number;
  features: string[];
  bookings: {
    startTime: string;
    endTime: string;
    teamSize: number;
    status: string;
  }[];
  isActive: boolean;
  deactivationReason?: string;
  timeSlots: Slot[];
}

const BookSlots = () => {
  const navigate = useNavigate();
  const [date, setDate] = useState<Date | undefined>(new Date());
  
  // Data from API
  const [rooms, setRooms] = useState<Room[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Booking Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);

  // Form Data
  const [formData, setFormData] = useState({
    teamName: "",
    projectTitle: "",
    description: "",
    teamSize: 1,
  });

  // Removed global slots fetching
  // useEffect(() => { ... }, []);

  useEffect(() => {
    if (date) {
      fetchAvailability();
    }
  }, [date]);

  useEffect(() => {
    if (date) {
      fetchAvailability();
    }
  }, [date]);

  const fetchAvailability = async () => {
    if (!date) return;
    setIsLoading(true);
    try {
      const formattedDate = date.toISOString().split('T')[0];
      const res = await axios.get(`/bookings/availability?date=${formattedDate}`);
      setRooms(res.data);
    } catch (error) {
      console.error("Failed to fetch availability", error);
      toast.error("Failed to load room availability");
    } finally {
      setIsLoading(false);
    }
  };

  // Multi-selection state
  const [currentSelection, setCurrentSelection] = useState<{
    roomId: string;
    intervals: { start: string, end: string }[];
  }>({ roomId: '', intervals: [] });

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    const h = parseInt(hours);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const h12 = h % 12 || 12;
    return `${h12}:${minutes} ${ampm}`;
  };

  const generateTimeIntervals = (start: string, end: string) => {
    const intervals = [];
    let [currH, currM] = start.split(':').map(Number);
    const [endH, endM] = end.split(':').map(Number);
    
    // Convert to minutes for easier calculation
    let currentInMinutes = currH * 60 + currM;
    const endInMinutes = endH * 60 + endM;

    while (currentInMinutes < endInMinutes) {
        const nextInMinutes = currentInMinutes + 15;
        
        if (nextInMinutes > endInMinutes) break;

        const sH = Math.floor(currentInMinutes / 60);
        const sM = currentInMinutes % 60;
        const eH = Math.floor(nextInMinutes / 60);
        const eM = nextInMinutes % 60;

        const startStr = `${sH.toString().padStart(2, '0')}:${sM.toString().padStart(2, '0')}`;
        const endStr = `${eH.toString().padStart(2, '0')}:${eM.toString().padStart(2, '0')}`;

        intervals.push({ start: startStr, end: endStr });
        currentInMinutes = nextInMinutes;
    }

    return intervals;
  };

  const getSingleIntervalCapacity = (room: Room, start: string, end: string) => {
     const occupied = room.bookings.reduce((sum, booking) => {
       // Check strictly overlapping and ONLY APPROVED
       if (booking.status === 'approved' && booking.startTime < end && booking.endTime > start) {
         return sum + booking.teamSize;
       }
       return sum;
     }, 0);
     return room.capacity - occupied; 
  };

  const getSlotStats = (room: Room, start: string, end: string) => {
      // Find all overlapping bookings (Pending + Approved)
      const relevantBookings = room.bookings.filter(b => b.startTime < end && b.endTime > start);
      
      const totalApplied = relevantBookings.reduce((sum, b) => sum + b.teamSize, 0);
      const approved = relevantBookings.filter(b => b.status === 'approved').reduce((sum, b) => sum + b.teamSize, 0);
      
      return { totalApplied, approved };
  };

  const getRemainingCapacity = (room: Room, start: string, end: string) => {
      // Split into 15-minute intervals to check bottleneck
      const intervals = generateTimeIntervals(start, end);
      if (intervals.length === 0) return getSingleIntervalCapacity(room, start, end); // Fallback

      // The capacity of the range is the MINIMUM capacity of any sub-interval
      const capacities = intervals.map(i => getSingleIntervalCapacity(room, i.start, i.end));
      return Math.min(...capacities);
  };

  const handleIntervalClick = (room: Room, start: string, end: string) => {
    if (currentSelection.roomId && currentSelection.roomId !== room._id) {
        // Reset if switching rooms
        setCurrentSelection({ roomId: room._id, intervals: [{ start, end }] });
        return;
    }

    const isSelected = currentSelection.intervals.some(i => i.start === start);
    
    if (isSelected) {
        // Deselect
        const newIntervals = currentSelection.intervals.filter(i => i.start !== start);
        setCurrentSelection({ roomId: room._id, intervals: newIntervals });
    } else {
        // Add to selection
        const newIntervals = [...currentSelection.intervals, { start, end }];
        // Sort by time
        newIntervals.sort((a, b) => a.start.localeCompare(b.start));
        
        // Validate consecutiveness
        let isConsecutive = true;
        for (let i = 0; i < newIntervals.length - 1; i++) {
            if (newIntervals[i].end !== newIntervals[i+1].start) {
                isConsecutive = false;
                break;
            }
        }

        if (!isConsecutive) {
            toast.error("Please select consecutive time slots.");
            // Ideally we might just reset to the new selection or ignore. 
            // User experience: if they click a non-consecutive one, maybe start a new range?
            // Let's simplest: Replace selection if non-consecutive
            setCurrentSelection({ roomId: room._id, intervals: [{ start, end }] });
        } else {
            setCurrentSelection({ roomId: room._id, intervals: newIntervals });
        }
    }
  };

  const handleBookSelection = () => {
     if (!currentSelection.intervals.length) return;
     const room = rooms.find(r => r._id === currentSelection.roomId);
     if (!room) return;

     const start = currentSelection.intervals[0].start;
     const end = currentSelection.intervals[currentSelection.intervals.length - 1].end;
     
     // Check capacity for the whole range logic? 
     // The loop logic below re-checks, but we need to ensure "Student A books... Student B sees blocked" logic.
     // If we use simple capacity, it works.
     
     setSelectedRoom(room);
     // Mock a "slot" object for the modal to use
     setSelectedSlot({ startTime: start, endTime: end, label: `${formatTime(start)} - ${formatTime(end)}` });
     setFormData(prev => ({ ...prev, teamSize: 1 }));
     setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!date || !selectedRoom || !selectedSlot) return;

    // Validate capacity one last time
    const remaining = getRemainingCapacity(selectedRoom, selectedSlot.startTime, selectedSlot.endTime);
    if (formData.teamSize > remaining) {
       toast.error(`Capacity Issue: Only ${remaining} seats remaining.`);
       return;
    }

    try {
       const formattedDate = date.toISOString().split('T')[0];
       await axios.post('/bookings', {
         ...formData,
         slotDate: formattedDate,
         startTime: selectedSlot.startTime,
         endTime: selectedSlot.endTime,
         roomId: selectedRoom._id,
         purpose: formData.projectTitle
       });

       toast.success("Booking request submitted successfully!");
       setIsModalOpen(false);
       navigate('/my-bookings'); 
    } catch (error: any) {
       toast.error(error.response?.data?.message || "Failed to book slot");
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-foreground mb-2">Book a Lab Slot</h1>
        <p className="text-muted-foreground">Select one or more consecutive 15-minute slots.</p>
      </div>

      <div className="grid lg:grid-cols-12 gap-8">
        {/* Sidebar */}
        <div className="lg:col-span-4 space-y-6">
           <Card>
              <CardHeader>
                <CardTitle>Select Date</CardTitle>
              </CardHeader>
              <CardContent className="flex justify-center">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={(d) => { setDate(d); setCurrentSelection({ roomId: '', intervals: [] }); }}
                  className="rounded-md border"
                  disabled={(d) => d < new Date(new Date().setHours(0,0,0,0))}
                />
              </CardContent>
           </Card>

           {currentSelection.intervals.length > 0 && (
             <Card>
                <CardHeader>
                    <CardTitle>Selected Slots</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="p-4 bg-primary/10 rounded-lg">
                        <p className="font-semibold text-primary">
                            {formatTime(currentSelection.intervals[0].start)} - {formatTime(currentSelection.intervals[currentSelection.intervals.length - 1].end)}
                        </p>
                        <p className="text-sm text-muted-foreground mt-1">
                            {currentSelection.intervals.length * 15} mins selected
                        </p>
                    </div>
                    <Button className="w-full" onClick={handleBookSelection}>Proceed to Book</Button>
                </CardContent>
             </Card>
           )}
        </div>

        {/* Main Content */}
        <div className="lg:col-span-8">
           {!date ? (
             <div className="h-64 flex items-center justify-center border-2 border-dashed rounded-lg">
                <p className="text-muted-foreground">Please select a date to view availability.</p>
             </div>
           ) : (
             <div className="space-y-6">
                <h2 className="text-xl font-semibold">Available Rooms for {date.toLocaleDateString()}</h2>
                
                {isLoading && <p>Loading availability...</p>}

                {!isLoading && rooms.length === 0 && (
                   <div className="p-8 text-center bg-muted rounded-lg">
                      <AlertCircle className="mx-auto h-8 w-8 mb-2 text-muted-foreground" />
                      <p>No rooms found.</p>
                   </div>
                )}

                {rooms.map(room => (
                  <RoomCard 
                    key={room._id} 
                    room={room} 
                    currentSelection={currentSelection}
                    onIntervalClick={handleIntervalClick}
                    formatTime={formatTime}
                    getRemainingCapacity={getRemainingCapacity}
                    getSlotStats={getSlotStats}
                    generateTimeIntervals={generateTimeIntervals}
                  />
                ))}
             </div>
           )}
        </div>
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
         <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
               <DialogTitle>Complete Booking</DialogTitle>
               <DialogDescription>
                  {selectedRoom?.name} • {selectedSlot?.label}
               </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                   <div className="space-y-2">
                      <Label htmlFor="teamName">Team Name *</Label>
                      <Input 
                        id="teamName" 
                        value={formData.teamName} 
                        onChange={e => setFormData({...formData, teamName: e.target.value})}
                        required
                      />
                   </div>
                   <div className="space-y-2">
                      <Label htmlFor="teamSize">Team Size *</Label>
                      <Input 
                        id="teamSize" 
                        type="number"
                        min="1"
                        max={selectedRoom && selectedSlot ? getRemainingCapacity(selectedRoom, selectedSlot.startTime, selectedSlot.endTime) : 100}
                        value={formData.teamSize} 
                        onChange={e => setFormData({...formData, teamSize: parseInt(e.target.value)})}
                        required
                       />
                      <p className="text-xs text-muted-foreground">
                         Max: {selectedRoom && selectedSlot ? getRemainingCapacity(selectedRoom, selectedSlot.startTime, selectedSlot.endTime) : '-'}
                      </p>
                   </div>
                </div>

                <div className="space-y-2">
                   <Label htmlFor="projectTitle">Project Title *</Label>
                   <Input 
                      id="projectTitle"
                      value={formData.projectTitle}
                      onChange={e => setFormData({...formData, projectTitle: e.target.value})}
                      required
                   />
                </div>

                <div className="space-y-2">
                   <Label htmlFor="description">Project Description</Label>
                   <Textarea 
                      id="description"
                      value={formData.description}
                      onChange={e => setFormData({...formData, description: e.target.value})}
                   />
                </div>

                <DialogFooter>
                   <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                   <Button type="submit">Confirm Booking</Button>
                </DialogFooter>
            </form>
         </DialogContent>
      </Dialog>
    </div>
  );
};

// Extracted RoomCard Component
interface RoomCardProps {
  room: Room;
  currentSelection: { roomId: string; intervals: { start: string, end: string }[] };
  onIntervalClick: (room: Room, start: string, end: string) => void;
  formatTime: (time: string) => string;
  getRemainingCapacity: (room: Room, start: string, end: string) => number;
  getSlotStats: (room: Room, start: string, end: string) => { totalApplied: number; approved: number };
  generateTimeIntervals: (start: string, end: string) => { start: string, end: string }[];
}

const RoomCard = ({ 
  room, 
  currentSelection, 
  onIntervalClick, 
  formatTime, 
  getRemainingCapacity, 
  getSlotStats,
  generateTimeIntervals
}: RoomCardProps) => {
  const [visibleCount, setVisibleCount] = useState(16); // Show 16 slots initially (4 rows of 4)
  
  const allIntervals = room.timeSlots?.flatMap(slot => generateTimeIntervals(slot.startTime, slot.endTime)) || [];
  const visibleIntervals = allIntervals.slice(0, visibleCount);
  const hasMore = allIntervals.length > visibleCount;

  const handleLoadMore = () => {
    setVisibleCount(prev => prev + 16);
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
           <div className="space-y-1">
              <CardTitle className="text-xl">{room.name}</CardTitle>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Users className="h-4 w-4" /> Capacity: {room.capacity} students
                </span>
                {room.features.includes('projector') && ( // Assuming 'projector' is the key, checks dynamically
                  <span className="flex items-center gap-1">
                     Projector Available
                  </span>
                )}
              </div>
           </div>
           <div className="flex flex-wrap gap-2 justify-end max-w-[50%]">
              {room.features.map((f, i) => (
                 <span key={i} className="text-xs px-2 py-1 bg-white text-black border rounded-full capitalize shadow-sm">{f}</span>
              ))}
           </div>
          </div>
      </CardHeader>
      <CardContent>
         {/* If inactive, ONLY show the reason. No slots. */}
         {!room.isActive ? (
            <div className="flex flex-col items-center justify-center text-center p-8 border-2 border-dashed border-red-200 rounded-lg bg-red-50/50">
                <div className="p-3 bg-red-100 text-red-600 rounded-full mb-3">
                    <AlertCircle className="h-8 w-8" />
                </div>
                <h3 className="font-bold text-lg text-red-900">Room Unavailable</h3>
                <p className="text-red-700 font-medium mt-2 max-w-md">
                    "{room.deactivationReason || "Reason not specified"}"
                </p>
            </div>
         ) : (
             <>
                 <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
                    {visibleIntervals.map((interval) => {
                       const remaining = getRemainingCapacity(room, interval.start, interval.end);
                       const isFull = remaining <= 0;
                       const isSelected = currentSelection.roomId === room._id && currentSelection.intervals.some(i => i.start === interval.start);
                       const stats = getSlotStats(room, interval.start, interval.end);

                       return (
                          <HoverCard key={`${room._id}-${interval.start}`}>
                            <HoverCardTrigger asChild>
                              <button
                                onClick={(e) => { e.preventDefault(); onIntervalClick(room, interval.start, interval.end); }}
                                disabled={isFull}
                                className={`
                                  p-2 rounded-lg text-xs text-center border transition-all flex flex-col items-center justify-center gap-1 h-20 relative group
                                  ${isFull 
                                    ? 'bg-red-100 text-red-900 border-red-200 cursor-not-allowed' 
                                    : isSelected
                                       ? 'bg-primary text-primary-foreground border-primary shadow-md scale-105'
                                       : 'bg-green-100 text-green-900 border-green-200 hover:border-green-400 hover:shadow-md'
                                  }
                                `}
                              >
                                 <div className="font-bold whitespace-nowrap text-sm">
                                    {formatTime(interval.start)}
                                 </div>
                                 <div className={`text-[11px] font-medium ${isFull ? '' : isSelected ? 'text-primary-foreground/90' : 'text-muted-foreground'}`}>
                                    {isFull ? 'Full' : `${remaining} left`}
                                 </div>
                                 {/* Visual cue for View More */}
                                 <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                     <Info className={`h-3 w-3 ${isSelected ? 'text-primary-foreground' : 'text-muted-foreground'}`} />
                                 </div>
                              </button>
                            </HoverCardTrigger>
                            <HoverCardContent className="w-auto p-4 shadow-lg">
                                <div className="space-y-3">
                                    <h4 className="text-sm font-semibold border-b pb-2">Slot Statistics</h4>
                                    <div className="text-xs grid grid-cols-2 gap-x-8 gap-y-2">
                                        <span className="text-muted-foreground">Total Applied:</span> <span className="font-semibold text-right">{stats.totalApplied}</span>
                                        <span className="text-muted-foreground">Approved:</span> <span className="font-semibold text-green-600 text-right">{stats.approved}</span>
                                        <span className="text-muted-foreground">Pending:</span> <span className="font-semibold text-amber-600 text-right">{stats.totalApplied - stats.approved}</span>
                                    </div>
                                </div>
                            </HoverCardContent>
                          </HoverCard>
                       );
                    })}
                 </div>
                 
                 <div className="mt-4 flex justify-center gap-2">
                   {hasMore && (
                      <Button variant="outline" size="sm" onClick={handleLoadMore}>
                        Load more Time slots
                      </Button>
                   )}
                   {visibleCount > 16 && (
                      <Button variant="ghost" size="sm" onClick={() => setVisibleCount(16)}>
                        View Less
                      </Button>
                   )}
                 </div>

                 {allIntervals.length === 0 && <p className="text-sm text-muted-foreground italic text-center py-4">No time slots are currently configured for this room.</p>}
             </>
         )}
      </CardContent>
    </Card>
  );
};

export default BookSlots;
