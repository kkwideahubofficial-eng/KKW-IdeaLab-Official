import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import axios from "../../lib/axios";
import { Plus, Trash2, Edit2, Users, LayoutGrid, CheckCircle2, XCircle, FileText, ImageIcon, ArrowLeft, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface SpecialRoom {
  _id: string;
  name: string;
  capacity: number;
  features: string[];
  isActive: boolean;
  deactivationReason?: string | null;
  description: string;
  image: string;
}

const ManageSpecialRooms = () => {
  const navigate = useNavigate();
  const [rooms, setRooms] = useState<SpecialRoom[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [isRoomDialogOpen, setIsRoomDialogOpen] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  
  // Form states
  const [roomForm, setRoomForm] = useState({ 
    name: "", 
    capacity: 1, 
    features: "", 
    description: "", 
    image: "" 
  });

  // Deactivation Modal
  const [isDeactivateDialogOpen, setIsDeactivateDialogOpen] = useState(false);
  const [roomToDeactivate, setRoomToDeactivate] = useState<SpecialRoom | null>(null);
  const [deactivationReason, setDeactivationReason] = useState("");

  // Edit Room State
  const [isEditRoomDialogOpen, setIsEditRoomDialogOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState<SpecialRoom | null>(null);
  const [editRoomForm, setEditRoomForm] = useState({ 
    name: "", 
    capacity: 1, 
    features: "", 
    description: "", 
    image: "" 
  });

  useEffect(() => {
    fetchRooms();
  }, []);

  const fetchRooms = async () => {
    try {
      setIsLoading(true);
      const res = await axios.get("/rooms?isSpecial=true");
      setRooms(res.data);
    } catch (error) {
      console.error("Failed to fetch special rooms", error);
      toast.error("Failed to load special rooms");
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, mode: 'create' | 'edit') => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('image', file);

    try {
      setIsUploadingImage(true);
      const res = await axios.post('/rooms/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      const imageUrl = res.data.url;
      if (mode === 'create') {
        setRoomForm(prev => ({ ...prev, image: imageUrl }));
      } else {
        setEditRoomForm(prev => ({ ...prev, image: imageUrl }));
      }
      toast.success("Image uploaded successfully!");
    } catch (err) {
      console.error("Image upload failed", err);
      toast.error("Failed to upload image. Please try again.");
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleRemoveImage = (mode: 'create' | 'edit') => {
    if (mode === 'create') {
      setRoomForm(prev => ({ ...prev, image: "" }));
    } else {
      setEditRoomForm(prev => ({ ...prev, image: "" }));
    }
    toast.success("Image removed.");
  };

  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.post("/rooms", {
        ...roomForm,
        capacity: parseInt(roomForm.capacity as any) || 1,
        isSpecial: true,
        features: roomForm.features.split(",").map((f) => f.trim()).filter(Boolean),
        timeSlots: [] 
      });
      toast.success("Special room created successfully");
      setIsRoomDialogOpen(false);
      setRoomForm({ name: "", capacity: 1, features: "", description: "", image: "" });
      fetchRooms();
    } catch (error: any) {
      const msg = error.response?.data?.message || "Failed to create special room";
      toast.error(msg);
    }
  };

  const handleEditClick = (room: SpecialRoom) => {
    setEditingRoom(room);
    setEditRoomForm({
      name: room.name,
      capacity: room.capacity,
      features: room.features.join(", "),
      description: room.description || "",
      image: room.image || ""
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
        capacity: parseInt(editRoomForm.capacity as any) || 1,
        description: editRoomForm.description,
        image: editRoomForm.image,
        features: editRoomForm.features.split(",").map((f) => f.trim()).filter(Boolean)
      });
      toast.success("Special room details updated successfully");
      setIsEditRoomDialogOpen(false);
      setEditingRoom(null);
      fetchRooms();
    } catch (error: any) {
      const msg = error.response?.data?.message || "Failed to update room details";
      toast.error(msg);
    }
  };

  const handleDeleteRoom = async (id: string) => {
    if (!confirm("Are you sure you want to PERMANENTLY delete this special room? This cannot be undone.")) return;
    try {
      await axios.delete(`/rooms/${id}`);
      toast.success("Special room deleted permanently");
      fetchRooms();
    } catch (error) {
      toast.error("Failed to delete special room");
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
      toast.success("Special room deactivated");
      setIsDeactivateDialogOpen(false);
      setDeactivationReason("");
      setRoomToDeactivate(null);
      fetchRooms();
    } catch (error) {
      toast.error("Failed to deactivate room");
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 border-b pb-6 gap-4">
        <div>
          <button 
            onClick={() => navigate("/coordinator/room-permissions")}
            className="flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline mb-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Permission Requests
          </button>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-3 tracking-tight">
             <LayoutGrid className="h-8 w-8 text-primary" /> Manage Special Rooms
          </h1>
          <p className="text-muted-foreground mt-2 text-base">Configure Conference, Discussion, and Ideation rooms</p>
        </div>
        <Dialog open={isRoomDialogOpen} onOpenChange={setIsRoomDialogOpen}>
            <DialogTrigger asChild>
                <Button className="shadow-sm hover:shadow-md transition-all">
                    <Plus className="mr-2 h-4 w-4" /> Add Special Room
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md bg-white max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Add New Special Room</DialogTitle>
                    <DialogDescription>Create a new special room for student project bookings</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleCreateRoom} className="space-y-4 mt-2">
                    <div className="space-y-1.5">
                        <Label htmlFor="roomName">Room Name</Label>
                        <Input 
                            id="roomName" 
                            value={roomForm.name}
                            onChange={e => setRoomForm({...roomForm, name: e.target.value})}
                            required 
                            placeholder="e.g. Ideation Room B"
                        />
                    </div>
                    <div className="space-y-1.5">
                        <Label htmlFor="capacity">Capacity (Persons)</Label>
                        <Input 
                            id="capacity" 
                            type="number"
                            min="1"
                            value={roomForm.capacity === 0 ? "0" : (roomForm.capacity || "")}
                            onChange={e => {
                              const val = e.target.value;
                              setRoomForm({
                                ...roomForm,
                                capacity: val === "" ? "" as any : parseInt(val)
                              });
                            }}
                            required 
                        />
                    </div>
                    
                    {/* Room Image with File Uploader, preview, and URL input */}
                    <div className="space-y-2 border p-3 rounded-lg bg-slate-50/50">
                        <Label className="font-semibold text-xs text-slate-700">Room Image</Label>
                        {roomForm.image && (
                          <div className="relative w-full h-32 rounded-lg overflow-hidden border mb-2 bg-slate-100 flex items-center justify-center">
                            <img src={roomForm.image} alt="Preview" className="w-full h-full object-cover" />
                            <button
                              type="button"
                              onClick={() => handleRemoveImage('create')}
                              className="absolute top-2 right-2 p-1.5 bg-red-600 hover:bg-red-700 text-white rounded-full transition shadow-md"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                        <div className="space-y-2">
                          <div>
                            <Label htmlFor="image-file" className="text-[10px] text-muted-foreground uppercase font-bold mb-1 block">Upload Local File</Label>
                            <Input
                              id="image-file"
                              type="file"
                              accept="image/*"
                              onChange={(e) => handleImageUpload(e, 'create')}
                              disabled={isUploadingImage}
                              className="text-xs h-9 cursor-pointer bg-white file:text-xs file:font-semibold"
                            />
                            {isUploadingImage && (
                              <div className="flex items-center gap-1.5 text-2xs text-primary font-bold mt-1">
                                <Loader2 className="w-3.5 h-3.5 animate-spin" /> Uploading image to Cloudinary...
                              </div>
                            )}
                          </div>
                          <div className="relative my-2">
                            <div className="absolute inset-0 flex items-center">
                              <span className="w-full border-t border-slate-200" />
                            </div>
                            <div className="relative flex justify-center text-[9px] uppercase">
                              <span className="bg-slate-50 px-2 text-slate-400 font-bold">Or Enter URL / Path</span>
                            </div>
                          </div>
                          <div>
                            <Input 
                              id="image" 
                              placeholder="/images/resources/ideation_room.png"
                              value={roomForm.image}
                              onChange={e => setRoomForm({...roomForm, image: e.target.value})}
                              className="text-xs h-9 bg-white"
                            />
                          </div>
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <Label htmlFor="features">Equipment/Features (comma separated)</Label>
                        <Input 
                            id="features" 
                            placeholder="e.g. Projector, Whiteboard, High-Speed PCs"
                            value={roomForm.features}
                            onChange={e => setRoomForm({...roomForm, features: e.target.value})}
                        />
                    </div>
                    <div className="space-y-1.5">
                        <Label htmlFor="description">Description</Label>
                        <Textarea 
                            id="description" 
                            placeholder="Provide a detailed description of the space..."
                            value={roomForm.description}
                            onChange={e => setRoomForm({...roomForm, description: e.target.value})}
                            className="h-20"
                        />
                    </div>
                    <DialogFooter className="pt-2">
                        <Button type="submit" disabled={isUploadingImage} className="w-full">
                          {isUploadingImage ? "Uploading Image..." : "Create Room"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">Loading special rooms...</div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {rooms.map(room => (
                <Card 
                  key={room._id} 
                  className={`flex flex-col overflow-hidden transition-all duration-200 border-border/50 shadow-sm hover:shadow-md ${!room.isActive ? "bg-muted/30 border-dashed" : "bg-card"}`}
                >
                    <div className="relative h-44 bg-slate-100 flex items-center justify-center overflow-hidden">
                      {room.image ? (
                        <img src={room.image} alt={room.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="flex flex-col items-center text-muted-foreground">
                          <ImageIcon className="w-8 h-8 opacity-50 mb-1" />
                          <span className="text-xs">No image uploaded</span>
                        </div>
                      )}
                      <div className="absolute top-3 right-3 bg-white/90 backdrop-blur px-2 py-0.5 rounded text-3xs font-extrabold shadow-sm border flex items-center gap-1">
                        👥 {room.capacity} Max
                      </div>
                    </div>
                    <CardHeader className="pb-3 border-b border-border/50">
                        <div className="space-y-1 flex-1 pr-4">
                           <CardTitle className="text-lg font-bold flex flex-wrap items-center gap-2 leading-tight">
                             {room.name}
                             <span className={`text-[9px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full flex items-center gap-1 ${room.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                               {room.isActive ? <CheckCircle2 className="w-2.5 h-2.5" /> : <XCircle className="w-2.5 h-2.5" />}
                               {room.isActive ? 'Active' : 'Deactivated'}
                             </span>
                           </CardTitle>
                        </div>
                    </CardHeader>
                    
                    <CardContent className="pt-4 flex-1 flex flex-col space-y-4">
                        <p className="text-xs text-muted-foreground line-clamp-3 leading-relaxed">
                          {room.description || "No description provided."}
                        </p>

                        <div>
                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Available Equipment</div>
                            {room.features && room.features.length > 0 ? (
                              <div className="flex flex-wrap gap-1">
                                  {room.features.map((f, i) => (
                                      <span key={i} className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md text-[10px] font-medium border">
                                          {f}
                                      </span>
                                  ))}
                              </div>
                            ) : (
                              <div className="text-3xs text-muted-foreground italic">No equipment listed.</div>
                            )}
                        </div>
                        
                        <div className="flex-1"></div>
                    </CardContent>

                    <CardFooter className="bg-muted/10 border-t border-border/50 p-4 flex flex-col gap-2">
                        {room.isActive ? (
                          <div className="w-full space-y-2">
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
                          </div>
                        ) : (
                          <div className="w-full space-y-2">
                              <div className="p-2.5 bg-rose-50/50 border border-rose-100/80 rounded-md text-xs text-rose-800">
                                  <strong className="block mb-0.5">Deactivation reason:</strong> 
                                  {room.deactivationReason || "No reason specified"}
                              </div>
                              <Button 
                                size="sm" 
                                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
                                onClick={async () => {
                                     try {
                                       await axios.put(`/rooms/${room._id}`, { ...room, isActive: true });
                                       toast.success("Special room activated successfully");
                                       fetchRooms();
                                     } catch { toast.error("Failed to activate"); }
                                }}
                              >
                                <CheckCircle2 className="w-4 h-4 mr-2" /> Activate Room
                              </Button>
                          </div>
                        )}

                        <div className="grid grid-cols-2 gap-2 w-full pt-1">
                          <Button variant="secondary" size="sm" onClick={() => handleEditClick(room)} className="text-xs">
                              <Edit2 className="h-3 w-3 mr-1.5" /> Edit details
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => handleDeleteRoom(room._id)} className="text-xs text-destructive hover:bg-destructive/5 hover:text-destructive">
                              <Trash2 className="h-3 w-3 mr-1.5" /> Delete
                          </Button>
                        </div>
                    </CardFooter>
                </Card>
            ))}
            {rooms.length === 0 && (
                <div className="col-span-full py-16 flex flex-col items-center justify-center text-center bg-muted/20 border border-dashed border-border rounded-xl">
                    <LayoutGrid className="h-12 w-12 text-muted-foreground/30 mb-4" />
                    <h3 className="text-lg font-medium text-foreground mb-1">No special rooms configured</h3>
                    <p className="text-muted-foreground text-sm max-w-sm">No special rooms are currently loaded. They will seed on server start or you can add one manually above.</p>
                </div>
            )}
        </div>
      )}

      {/* Deactivation Modal */}
      <Dialog open={isDeactivateDialogOpen} onOpenChange={setIsDeactivateDialogOpen}>
        <DialogContent className="bg-white">
            <DialogHeader>
                <DialogTitle>Deactivate Special Room</DialogTitle>
                <DialogDescription>
                    Provide a reason for deactivating <strong>{roomToDeactivate?.name}</strong>. This message will be displayed to students.
                </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleDeactivateRoom} className="space-y-4">
                <div className="space-y-1.5">
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
        <DialogContent className="bg-white max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Special Room Details</DialogTitle>
            <DialogDescription>Update the capacity, description, and features for this special room.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdateRoom} className="space-y-4 mt-2">
            <div className="space-y-1.5">
              <Label htmlFor="editRoomName">Room Name</Label>
              <Input 
                id="editRoomName" 
                value={editRoomForm.name}
                onChange={e => setEditRoomForm({...editRoomForm, name: e.target.value})}
                required 
                placeholder="e.g. Conference Room"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="editCapacity">Capacity (Persons)</Label>
              <Input 
                id="editCapacity" 
                type="number"
                min="1"
                value={editRoomForm.capacity === 0 ? "0" : (editRoomForm.capacity || "")}
                onChange={e => {
                  const val = e.target.value;
                  setEditRoomForm({
                    ...editRoomForm,
                    capacity: val === "" ? "" as any : parseInt(val)
                  });
                }}
                required 
              />
            </div>
            
            {/* Room Image with File Uploader, preview, and URL input for EDIT mode */}
            <div className="space-y-2 border p-3 rounded-lg bg-slate-50/50">
                <Label className="font-semibold text-xs text-slate-700">Room Image</Label>
                {editRoomForm.image && (
                  <div className="relative w-full h-32 rounded-lg overflow-hidden border mb-2 bg-slate-100 flex items-center justify-center">
                    <img src={editRoomForm.image} alt="Preview" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => handleRemoveImage('edit')}
                      className="absolute top-2 right-2 p-1.5 bg-red-600 hover:bg-red-700 text-white rounded-full transition shadow-md"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
                <div className="space-y-2">
                  <div>
                    <Label htmlFor="edit-image-file" className="text-[10px] text-muted-foreground uppercase font-bold mb-1 block">Upload Local File</Label>
                    <Input
                      id="edit-image-file"
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleImageUpload(e, 'edit')}
                      disabled={isUploadingImage}
                      className="text-xs h-9 cursor-pointer bg-white file:text-xs file:font-semibold"
                    />
                    {isUploadingImage && (
                      <div className="flex items-center gap-1.5 text-2xs text-primary font-bold mt-1">
                        <Loader2 className="w-3.5 h-3.5 animate-spin" /> Uploading image to Cloudinary...
                      </div>
                    )}
                  </div>
                  <div className="relative my-2">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t border-slate-200" />
                    </div>
                    <div className="relative flex justify-center text-[9px] uppercase">
                      <span className="bg-slate-50 px-2 text-slate-400 font-bold">Or Enter URL / Path</span>
                    </div>
                  </div>
                  <div>
                    <Input 
                      id="editImage" 
                      placeholder="/images/resources/ideation_room.png"
                      value={editRoomForm.image}
                      onChange={e => setEditRoomForm({...editRoomForm, image: e.target.value})}
                      className="text-xs h-9 bg-white"
                    />
                  </div>
                </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="editFeatures">Equipment/Features (comma separated)</Label>
              <Input 
                id="editFeatures" 
                placeholder="Projector, Whiteboard, High-Speed PCs"
                value={editRoomForm.features}
                onChange={e => setEditRoomForm({...editRoomForm, features: e.target.value})}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="editDescription">Description</Label>
              <Textarea 
                id="editDescription" 
                placeholder="Provide a detailed description of the space..."
                value={editRoomForm.description}
                onChange={e => setEditRoomForm({...editRoomForm, description: e.target.value})}
                className="h-20"
              />
            </div>
            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setIsEditRoomDialogOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={isUploadingImage}>
                {isUploadingImage ? "Uploading Image..." : "Save Changes"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ManageSpecialRooms;
