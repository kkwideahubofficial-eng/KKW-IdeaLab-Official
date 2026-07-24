import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import axios from "../lib/axios";
import { Plus, Trash2, Edit2, Users, Clock, CalendarRange, LayoutGrid, CheckCircle2, XCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface Room {
  _id: string;
  name: string;
  capacity: number;
  features: string[];
  isActive: boolean;
  deactivationReason?: string | null;
  timeSlots: {
    startTime: string;
    endTime: string;
    label: string;
    _id?: string;
  }[];
}

const ManageRooms = () => {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [isRoomDialogOpen, setIsRoomDialogOpen] = useState(false);
  
  // Slot Management Dialog
  const [isManageSlotsOpen, setIsManageSlotsOpen] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);

  // Form states
  const [roomForm, setRoomForm] = useState({ name: "", capacity: 1, features: "" });
  const [slotForm, setSlotForm] = useState({ startTime: "09:00", endTime: "10:00" });

  // Deactivation Modal
  const [isDeactivateDialogOpen, setIsDeactivateDialogOpen] = useState(false);
  const [roomToDeactivate, setRoomToDeactivate] = useState<Room | null>(null);
  const [deactivationReason, setDeactivationReason] = useState("");

  // Edit Room State
  const [isEditRoomDialogOpen, setIsEditRoomDialogOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const [editRoomForm, setEditRoomForm] = useState({ name: "", capacity: 1, features: "" });

  useEffect(() => {
    fetchData();
  }, []);

  // Helper Component for Time Selection
  const TimePicker = ({ value, onChange }: { value: string, onChange: (val: string) => void }) => {
    // Derive state directly from props (Controlled Component)
    const [hours, minutes] = value ? value.split(':') : ["09", "00"];
    const h = parseInt(hours);
    
    const period = h >= 12 ? 'PM' : 'AM';
    const hour12 = (h % 12 || 12).toString();
    const min = minutes;

    const updateTime = (newH: string, newM: string, newP: string) => {
        let h24 = parseInt(newH);
        if (newP === 'PM' && h24 < 12) h24 += 12;
        if (newP === 'AM' && h24 === 12) h24 = 0;
        
        const hStr = h24.toString().padStart(2, '0');
        const mStr = newM.toString().padStart(2, '0');
        onChange(`${hStr}:${mStr}`);
    };

    return (
        <div className="flex items-center gap-1">
            <select 
                className="h-9 w-16 rounded-md border border-input bg-background px-2 text-sm"
                value={hour12}
                onChange={(e) => updateTime(e.target.value, min, period)}
            >
                {Array.from({ length: 12 }, (_, i) => i + 1).map(h => (
                    <option key={h} value={h}>{h}</option>
                ))}
            </select>
            <span className="text-muted-foreground">:</span>
            <select 
                className="h-9 w-16 rounded-md border border-input bg-background px-2 text-sm"
                value={min}
                onChange={(e) => updateTime(hour12, e.target.value, period)}
            >
                {Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, '0')).map(m => (
                    <option key={m} value={m}>{m}</option>
                ))}
            </select>
            <select 
                className="h-9 w-18 rounded-md border border-input bg-background px-2 text-sm"
                value={period}
                onChange={(e) => updateTime(hour12, min, e.target.value)}
            >
                <option value="AM">AM</option>
                <option value="PM">PM</option>
            </select>
        </div>
    );
  };

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const roomsRes = await axios.get("/rooms");
      setRooms(roomsRes.data);
    } catch (error) {
      console.error("Failed to fetch data", error);
      toast.error("Failed to load rooms");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.post("/rooms", {
        ...roomForm,
        features: roomForm.features.split(",").map((f) => f.trim()).filter(Boolean),
        timeSlots: [] // Initialize with empty slots
      });
      toast.success("Room created successfully");
      setIsRoomDialogOpen(false);
      setRoomForm({ name: "", capacity: 1, features: "" });
      fetchData();
    } catch (error) {
      toast.error("Failed to create room");
    }
  };

  const handleEditClick = (room: Room) => {
    setEditingRoom(room);
    setEditRoomForm({
      name: room.name,
      capacity: room.capacity,
      features: room.features.join(", ")
    });
    setIsEditRoomDialogOpen(true);
  };

  const handleUpdateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRoom) return;
    try {
      await axios.put(`/rooms/${editingRoom._id}`, {
        ...editingRoom,
        name: editRoomForm.name,
        capacity: editRoomForm.capacity,
        features: editRoomForm.features.split(",").map((f) => f.trim()).filter(Boolean)
      });
      toast.success("Room details updated successfully");
      setIsEditRoomDialogOpen(false);
      setEditingRoom(null);
      fetchData();
    } catch (error) {
      toast.error("Failed to update room details");
    }
  };

  const handleDeleteRoom = async (id: string) => {
    if (!confirm("Are you sure you want to PERMANENTLY delete this room? This cannot be undone.")) return;
    try {
      await axios.delete(`/rooms/${id}`);
      toast.success("Room deleted permanently");
      fetchData();
    } catch (error) {
      toast.error("Failed to delete room");
    }
  };

  const handleDeactivateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomToDeactivate || !deactivationReason.trim()) return;

    try {
        await axios.put(`/rooms/${roomToDeactivate._id}`, { 
            ...roomToDeactivate, 
            isActive: false, 
            deactivationReason: deactivationReason 
        });
        toast.success("Room Deactivated");
        setIsDeactivateDialogOpen(false);
        setDeactivationReason("");
        setRoomToDeactivate(null);
        fetchData();
    } catch (error) {
        toast.error("Failed to deactivate room");
    }
  };

  const handleAddSlotToRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRoom) return;

    // Validate
    if (!slotForm.startTime || !slotForm.endTime) {
       toast.error("Please select valid start and end times");
       return;
    }

    if (slotForm.startTime >= slotForm.endTime) {
       toast.error("Start time must be before end time");
       return;
    }

    const updatedSlots = [
      ...(selectedRoom.timeSlots || []), 
      { 
        startTime: slotForm.startTime, 
        endTime: slotForm.endTime,
        label: `${slotForm.startTime} - ${slotForm.endTime}` 
      }
    ];

    try {
      // sanitize payload
      const payload = {
        name: selectedRoom.name,
        capacity: selectedRoom.capacity,
        features: selectedRoom.features,
        isActive: selectedRoom.isActive,
        timeSlots: updatedSlots
      };
      
      await axios.put(`/rooms/${selectedRoom._id}`, payload);
      toast.success("Slot added successfully");
      // Reset to defaults, not empty, to prevent "startTime required" error
      // because TimePicker visually defaults to 09:00 if empty, misleading user.
      setSlotForm({ startTime: "09:00", endTime: "10:00" });
      
      // Refresh global state
      await fetchData();
      
      // CRITICAL FIX: Re-sync selectedRoom from the fresh 'rooms' list (which fetchData updates)
      // Since fetchData updates state async, we should actually rely on the response or a direct getter?
      // Better: we can just manually fetch this specific room to be 100% sure, or trust fetchData + find.
      // But fetchData is async and setRooms is async. 
      // Safest: Use the payload we just sent, or re-fetch singular room.
      
      // Let's use the local payload to update immediately for UI responsiveness, 
      // but ensure we don't desync.
      setSelectedRoom({ ...selectedRoom, timeSlots: updatedSlots });
    } catch (error: any) {
      console.error("Add Slot Error:", error.response?.data || error.message);
      toast.error(error.response?.data?.message || "Failed to add slot");
    }
  };

  const handleRemoveSlotFromRoom = async (room: Room, slotIndex: number) => {
    if (!confirm("Remove this slot?")) return;
    
    const updatedSlots = room.timeSlots.filter((_, i) => i !== slotIndex);

    try {
      const payload = {
        name: room.name,
        capacity: room.capacity,
        features: room.features,
        isActive: room.isActive,
        timeSlots: updatedSlots
      };

      await axios.put(`/rooms/${room._id}`, payload);
      toast.success("Slot removed");
      await fetchData();
      if (selectedRoom && selectedRoom._id === room._id) {
         setSelectedRoom({ ...selectedRoom, timeSlots: updatedSlots });
      }
    } catch (error) {
      toast.error("Failed to remove slot");
    }
  };

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    const h = parseInt(hours);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const h12 = h % 12 || 12;
    return `${h12}:${minutes} ${ampm}`;
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 border-b pb-6 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-3 tracking-tight">
             <LayoutGrid className="h-8 w-8 text-primary" /> Manage Rooms & Slots
          </h1>
          <p className="text-muted-foreground mt-2 text-base">Configure labs and booking time slots</p>
        </div>
        <Dialog open={isRoomDialogOpen} onOpenChange={setIsRoomDialogOpen}>
            <DialogTrigger asChild>
                <Button className="shadow-sm hover:shadow-md transition-all">
                    <Plus className="mr-2 h-4 w-4" /> Add Room
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Add New Room</DialogTitle>
                    <DialogDescription>Create a new innovation lab/room workspace</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleCreateRoom} className="space-y-5 mt-2">
                    <div className="space-y-2">
                        <Label htmlFor="roomName">Room Name</Label>
                        <Input 
                            id="roomName" 
                            value={roomForm.name}
                            onChange={e => setRoomForm({...roomForm, name: e.target.value})}
                            required 
                            placeholder="e.g. Innovation Lab A"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="capacity">Capacity (Students)</Label>
                        <Input 
                            id="capacity" 
                            type="number"
                            min="1"
                            value={roomForm.capacity}
                            onChange={e => setRoomForm({...roomForm, capacity: parseInt(e.target.value)})}
                            required 
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="features">Features (comma separated)</Label>
                        <Input 
                            id="features" 
                            placeholder="e.g. Projector, Whiteboard, High-Speed PCs"
                            value={roomForm.features}
                            onChange={e => setRoomForm({...roomForm, features: e.target.value})}
                        />
                    </div>
                    <DialogFooter className="pt-4">
                        <Button type="submit" className="w-full sm:w-auto">Create Room</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-6">

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {rooms.map(room => (
                <Card 
                  key={room._id} 
                  className={`flex flex-col overflow-hidden transition-all duration-200 border-border/50 shadow-sm hover:shadow-md ${!room.isActive ? "bg-muted/30 border-dashed" : "bg-card"}`}
                >
                    <CardHeader className="flex flex-row items-start justify-between pb-3 bg-muted/10 border-b border-border/50">
                        <div className="space-y-1.5 flex-1 pr-4">
                           <CardTitle className="text-xl font-semibold flex flex-wrap items-center gap-2 leading-tight">
                             {room.name}
                             <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full flex items-center gap-1 ${room.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                               {room.isActive ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                               {room.isActive ? 'Active' : 'Deactivated'}
                             </span>
                           </CardTitle>
                           <div className="flex items-center text-sm text-muted-foreground gap-1.5">
                               <Users className="w-4 h-4 text-primary/70" />
                               Capacity: <span className="font-medium text-foreground">{room.capacity}</span>
                           </div>
                        </div>
                        <div className="flex items-center gap-1 -mt-1 -mr-2 flex-shrink-0">
                            <Button variant="ghost" size="icon" onClick={() => handleEditClick(room)} className="text-muted-foreground hover:text-primary hover:bg-primary/10">
                                <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => handleDeleteRoom(room._id)} className="text-muted-foreground hover:text-destructive hover:bg-destructive/10">
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </div>
                    </CardHeader>
                    
                    <CardContent className="pt-4 flex-1 flex flex-col">
                        {room.features && room.features.length > 0 ? (
                          <div className="flex flex-wrap gap-1.5 mb-5">
                              {room.features.map((f, i) => (
                                  <span key={i} className="px-2.5 py-1 bg-secondary text-secondary-foreground rounded-md text-xs font-medium border border-border/30">
                                      {f}
                                  </span>
                              ))}
                          </div>
                        ) : (
                          <div className="text-xs text-muted-foreground italic mb-5">No specific features listed.</div>
                        )}
                        
                        <div className="flex-1"></div>

                        <div className="pt-2">
                           {!room.isActive ? (
                               <div className="w-full space-y-3">
                                   <div className="p-3 bg-rose-50/50 border border-rose-100/80 rounded-lg text-sm text-rose-800">
                                       <strong className="block mb-1 text-rose-900">Reason for deactivation:</strong> 
                                       {room.deactivationReason || "No reason provided"}
                                   </div>
                                   <Button 
                                     size="sm" 
                                     className="w-full bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition-colors"
                                     onClick={async () => {
                                          try {
                                            await axios.put(`/rooms/${room._id}`, { ...room, isActive: true });
                                            toast.success("Room Activated");
                                            fetchData();
                                          } catch { toast.error("Failed to activate"); }
                                     }}
                                   >
                                     <CheckCircle2 className="w-4 h-4 mr-2" /> Activate Room
                                   </Button>
                               </div>
                           ) : (
                               <Button 
                                 size="sm" 
                                 variant="outline"
                                 className="w-full text-rose-600 border-rose-200 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-300 transition-colors"
                                 onClick={() => {
                                      setRoomToDeactivate(room);
                                      setIsDeactivateDialogOpen(true);
                                 }}
                               >
                                 <XCircle className="w-4 h-4 mr-2" /> Deactivate Temporarily
                               </Button>
                           )}
                        </div>
                    </CardContent>

                    <CardFooter className="bg-muted/10 border-t border-border/50 p-4 flex flex-col items-start gap-4">
                        <div className="w-full">
                            <h4 className="text-sm font-semibold mb-2.5 flex items-center gap-1.5 text-foreground/80">
                                <Clock className="w-4 h-4" /> 
                                Schedule <span className="text-muted-foreground font-normal">({room.timeSlots?.length || 0} slots)</span>
                            </h4>
                            {room.timeSlots && room.timeSlots.length > 0 ? (
                                <div className="flex flex-wrap gap-2 mb-1">
                                    {room.timeSlots?.slice(0, 3).map((slot, i) => (
                                        <div key={i} className="text-xs font-medium bg-background border border-border px-2 py-1 rounded shadow-sm text-muted-foreground flex items-center gap-1">
                                           {formatTime(slot.startTime)} - {formatTime(slot.endTime)}
                                        </div>
                                    ))}
                                    {(room.timeSlots?.length || 0) > 3 && (
                                        <div className="text-xs font-medium bg-secondary/50 border border-transparent px-2 py-1 rounded text-muted-foreground flex items-center">
                                            +{(room.timeSlots?.length || 0) - 3} more
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="text-xs text-muted-foreground/70 italic flex items-center gap-1 mb-1">
                                    <CalendarRange className="w-3.5 h-3.5" /> No time slots arranged yet.
                                </div>
                            )}
                        </div>

                        <div className="w-full mt-auto">
                            <Dialog open={isManageSlotsOpen && selectedRoom?._id === room._id} onOpenChange={(open) => {
                                setIsManageSlotsOpen(open);
                                if (open) {
                                    setSelectedRoom(room);
                                } else {
                                    setSelectedRoom(null);
                                }
                            }}>
                                <DialogTrigger asChild>
                                    <Button variant="default" size="sm" className="w-full shadow-sm hover:shadow transition-all" onClick={() => setSelectedRoom(room)}>
                                        <CalendarRange className="mr-2 h-4 w-4" /> Manage Schedule
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="max-w-md">
                                    <DialogHeader>
                                        <DialogTitle className="text-xl">Manage Schedule</DialogTitle>
                                        <DialogDescription>
                                            Adding or removing time slots for <strong className="text-foreground font-semibold">{selectedRoom?.name}</strong>
                                        </DialogDescription>
                                    </DialogHeader>
                                    
                                    <div className="space-y-6 mt-2">
                                        <div className="bg-muted/30 p-4 rounded-lg border border-border">
                                            <h4 className="font-semibold text-sm mb-3 flex items-center gap-2"><Plus className="w-4 h-4 text-primary" /> Add New Slot</h4>
                                            
                                            <form onSubmit={handleAddSlotToRoom} className="space-y-4">
                                               <div className="grid grid-cols-2 gap-4">
                                                   <div className="space-y-1.5">
                                                      <Label className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Start Time</Label>
                                                      <TimePicker 
                                                        value={slotForm.startTime} 
                                                        onChange={(t) => setSlotForm(prev => ({ ...prev, startTime: t }))} 
                                                      />
                                                   </div>
                                                   <div className="space-y-1.5">
                                                      <Label className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">End Time</Label>
                                                      <TimePicker 
                                                        value={slotForm.endTime} 
                                                        onChange={(t) => setSlotForm(prev => ({ ...prev, endTime: t }))} 
                                                      />
                                                   </div>
                                               </div>
                                               <Button type="submit" size="sm" className="w-full mt-2"><Plus className="h-4 w-4 mr-2" /> Add Slot</Button>
                                            </form>
                                        </div>

                                        <div className="space-y-3">
                                            <h4 className="font-semibold text-sm flex items-center gap-2"><Clock className="w-4 h-4 text-primary" /> Existing Slots</h4>
                                            {selectedRoom?.timeSlots?.length === 0 ? (
                                                <div className="text-sm text-muted-foreground italic text-center py-6 bg-muted/20 rounded-lg border border-dashed border-border">
                                                    No slots currently defined for this room.
                                                </div>
                                            ) : (
                                                <div className="space-y-2 max-h-[200px] overflow-y-auto pr-2 custom-scrollbar">
                                                    {selectedRoom?.timeSlots?.map((slot, idx) => (
                                                        <div key={idx} className="flex items-center justify-between p-3 rounded-lg border border-border/60 bg-card shadow-sm hover:border-border transition-colors group">
                                                            <div className="flex items-center gap-2 text-sm font-medium">
                                                                <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                                                                {formatTime(slot.startTime)} - {formatTime(slot.endTime)}
                                                            </div>
                                                            <Button 
                                                              variant="ghost" 
                                                              size="icon" 
                                                              className="h-7 w-7 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors opacity-70 group-hover:opacity-100"
                                                              onClick={() => handleRemoveSlotFromRoom(selectedRoom, idx)}
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </DialogContent>
                            </Dialog>
                        </div>
                    </CardFooter>
                </Card>
            ))}
            {rooms.length === 0 && (
                <div className="col-span-full py-16 flex flex-col items-center justify-center text-center bg-muted/20 border border-dashed border-border rounded-xl">
                    <LayoutGrid className="h-12 w-12 text-muted-foreground/30 mb-4" />
                    <h3 className="text-lg font-medium text-foreground mb-1">No rooms configured</h3>
                    <p className="text-muted-foreground text-sm max-w-sm">You haven't added any innovation labs or rooms yet. Click "Add Room" to get started.</p>
                </div>
            )}
        </div>
      </div>

      
      {/* Deactivation Modal */}
      <Dialog open={isDeactivateDialogOpen} onOpenChange={setIsDeactivateDialogOpen}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Deactivate Room</DialogTitle>
                <DialogDescription>
                    Please provide a reason for deactivating <strong>{roomToDeactivate?.name}</strong>. 
                    This will be visible to students.
                </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleDeactivateRoom} className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="reason">Reason for Deactivation</Label>
                    <Input 
                        id="reason" 
                        value={deactivationReason}
                        onChange={e => setDeactivationReason(e.target.value)}
                        placeholder="e.g. Maintenance, Exam in progress..."
                        required 
                    />
                </div>
                <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setIsDeactivateDialogOpen(false)}>Cancel</Button>
                    <Button type="submit" variant="destructive">Deactivate</Button>
                </DialogFooter>
            </form>
        </DialogContent>
      </Dialog>

      {/* Edit Room Dialog */}
      <Dialog open={isEditRoomDialogOpen} onOpenChange={setIsEditRoomDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Room Details</DialogTitle>
            <DialogDescription>Update the workspace details for this room.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdateRoom} className="space-y-5 mt-2">
            <div className="space-y-2">
              <Label htmlFor="editRoomName">Room Name</Label>
              <Input 
                id="editRoomName" 
                value={editRoomForm.name}
                onChange={e => setEditRoomForm({...editRoomForm, name: e.target.value})}
                required 
                placeholder="e.g. Innovation Lab A"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="editCapacity">Capacity (Students)</Label>
              <Input 
                id="editCapacity" 
                type="number"
                min="1"
                value={editRoomForm.capacity}
                onChange={e => setEditRoomForm({...editRoomForm, capacity: parseInt(e.target.value) || 1})}
                required 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="editFeatures">Features (comma separated)</Label>
              <Input 
                id="editFeatures" 
                placeholder="e.g. Projector, Whiteboard, High-Speed PCs"
                value={editRoomForm.features}
                onChange={e => setEditRoomForm({...editRoomForm, features: e.target.value})}
              />
            </div>
            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => setIsEditRoomDialogOpen(false)}>Cancel</Button>
              <Button type="submit">Save Changes</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ManageRooms;
