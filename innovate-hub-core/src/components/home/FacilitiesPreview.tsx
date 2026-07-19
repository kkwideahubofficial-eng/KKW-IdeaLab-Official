import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Plus, Pencil, Trash, X, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import api from "@/lib/axios";

interface FacilityCard {
  id: string;
  title: string;
  desc: string;
  image: string;
  path: string;
}

const defaultFacilities: FacilityCard[] = [
  {
    id: "fac_0",
    title: "3D Printing & Scanning",
    desc: "Additive manufacturing and 3D digitizing for physical prototype models.",
    image: "https://images.unsplash.com/photo-1615840287214-7fe58a8f3685?auto=format&fit=crop&q=80&w=600",
    path: "/aicte-idea-lab"
  },
  {
    id: "fac_1",
    title: "CNC Router & Milling",
    desc: "Precision subtractive modeling for custom wood, acrylic, and light metal components.",
    image: "https://images.unsplash.com/photo-1612690669207-fed642192c40?auto=format&fit=crop&q=80&w=600",
    path: "/aicte-idea-lab"
  },
  {
    id: "fac_2",
    title: "Laser Cutting & Engraving",
    desc: "High-power lasers for exact cutting and fine marking on diverse sheets.",
    image: "https://images.unsplash.com/photo-1534224039826-c7a0dea0e66a?auto=format&fit=crop&q=80&w=600",
    path: "/aicte-idea-lab"
  },
  {
    id: "fac_3",
    title: "Robotics & Automation",
    desc: "Robotic chassis fabrication, actuators assembly, and motor drive testing.",
    image: "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&q=80&w=600",
    path: "/aicte-idea-lab"
  },
  {
    id: "fac_4",
    title: "PCB Prototyping Lab",
    desc: "In-house circuit board design, dry etching, assembly, and soldering stations.",
    image: "https://images.unsplash.com/photo-1517059224940-d4af9eec41b7?auto=format&fit=crop&q=80&w=600",
    path: "/aicte-idea-lab"
  },
  {
    id: "fac_5",
    title: "IoT & Smart Systems",
    desc: "Sensor modules, embedded processors, microcontrollers, and wireless transceivers.",
    image: "https://images.unsplash.com/photo-1555664424-778a1e5e1b48?auto=format&fit=crop&q=80&w=600",
    path: "/aicte-idea-lab"
  }
];

const getFullImageUrl = (imagePath: string) => {
  if (!imagePath) return "";
  if (imagePath.startsWith("http://") || imagePath.startsWith("https://") || imagePath.startsWith("data:")) {
    return imagePath;
  }
  const baseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";
  return `${baseUrl}/${imagePath}`;
};

const FacilitiesPreview = () => {
  const [labs, setLabs] = useState<FacilityCard[]>([]);
  const [isCoordinator, setIsCoordinator] = useState(false);
  
  // Dialog State
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingLab, setEditingLab] = useState<FacilityCard | null>(null);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState({
    title: "",
    desc: "",
    image: "",
    path: "/aicte-idea-lab"
  });

  useEffect(() => {
    // Check coordinator role
    const rawUser = localStorage.getItem("idea_hub_user");
    if (rawUser) {
      try {
        const parsed = JSON.parse(rawUser);
        if (parsed.role === "coordinator" || parsed.role === "head") {
          setIsCoordinator(true);
        }
      } catch (e) {
        console.error(e);
      }
    }

    // Load from localStorage
    const stored = localStorage.getItem("idea_hub_facilities_preview");
    if (stored) {
      try {
        setLabs(JSON.parse(stored));
      } catch {
        setLabs(defaultFacilities);
      }
    } else {
      setLabs(defaultFacilities);
    }
  }, []);

  const saveLabs = (newLabs: FacilityCard[]) => {
    setLabs(newLabs);
    localStorage.setItem("idea_hub_facilities_preview", JSON.stringify(newLabs));
  };

  const handleOpenDialog = (lab: FacilityCard | null = null) => {
    setEditingLab(lab);
    if (lab) {
      setForm({
        title: lab.title,
        desc: lab.desc,
        image: lab.image,
        path: lab.path
      });
    } else {
      setForm({
        title: "",
        desc: "",
        image: "",
        path: "/aicte-idea-lab"
      });
    }
    setIsDialogOpen(true);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("image", file);
      const res = await api.post("/machinery/upload", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      if (res.data?.url) {
        setForm((prev) => ({ ...prev, image: res.data.url }));
      }
    } catch (err) {
      console.error("Failed to upload image", err);
      alert("Failed to upload image. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.desc || !form.image) return;

    if (editingLab) {
      const updated = labs.map((l) =>
        l.id === editingLab.id ? { ...l, ...form } : l
      );
      saveLabs(updated);
    } else {
      const newLab: FacilityCard = {
        id: "fac_" + Date.now(),
        ...form
      };
      saveLabs([...labs, newLab]);
    }
    setIsDialogOpen(false);
  };

  const handleDelete = (id: string) => {
    if (!window.confirm("Are you sure you want to delete this facility card?")) return;
    const filtered = labs.filter((l) => l.id !== id);
    saveLabs(filtered);
  };

  return (
    <section className="py-20 bg-white relative">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header with Add Trigger */}
        <div className="flex flex-col md:flex-row justify-between items-center max-w-6xl mx-auto mb-16 gap-6 text-center md:text-left">
          <div className="flex-1 space-y-3 text-center md:text-left">
            <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
              Explore IDEA Lab
            </h2>
            <div className="w-12 h-1 bg-primary mx-auto md:mx-0 rounded-full" />
            <p className="text-slate-500 text-base sm:text-lg">
              Discover the cutting-edge workspaces and advanced machinery available for student research and prototyping.
            </p>
          </div>
          {isCoordinator && (
            <Button
              onClick={() => handleOpenDialog(null)}
              className="gap-2 shadow-md bg-primary hover:bg-primary/95 text-white font-bold rounded-xl px-5 py-3 h-auto shrink-0"
            >
              <Plus className="w-4 h-4" /> Add Facility Card
            </Button>
          )}
        </div>

        {/* Cards Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-8">
          {labs.map((lab) => (
            <div 
              key={lab.id}
              className="group relative flex flex-col h-full bg-slate-50 border border-slate-100 rounded-2xl overflow-hidden hover:shadow-xl hover:border-primary/20 hover:-translate-y-1 transition-all duration-300 outline-none"
            >
              {/* Photo wrapper */}
              <div className="relative aspect-[16/10] overflow-hidden bg-muted">
                <img 
                  src={getFullImageUrl(lab.image)}
                  alt={lab.title}
                  className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-slate-950/10 group-hover:bg-slate-950/0 transition-colors duration-300" />
              </div>

              {/* Text content */}
              <div className="p-4 sm:p-6 flex flex-col flex-grow justify-between">
                <div className="space-y-2">
                  <h3 className="text-base sm:text-lg font-bold text-slate-900 group-hover:text-primary transition-colors">
                    {lab.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-500 leading-relaxed line-clamp-3">
                    {lab.desc}
                  </p>
                </div>
                <div className="pt-4 mt-4 border-t border-slate-200/60 flex items-center justify-between text-xs font-semibold text-primary">
                  <Link to={lab.path} className="flex items-center gap-1 group-hover:underline">
                    View Available Machines
                    <ArrowRight className="w-3.5 h-3.5 transition-transform duration-300 group-hover:translate-x-1" />
                  </Link>
                </div>
              </div>

              {/* Coordinator Edit/Delete Overlays */}
              {isCoordinator && (
                <div className="absolute top-3 right-3 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-20">
                  <button 
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleOpenDialog(lab);
                    }}
                    className="p-2 bg-white/90 backdrop-blur-xs hover:bg-white rounded-lg text-slate-700 hover:text-primary transition-all border border-slate-200/60 shadow-xs animate-in zoom-in duration-200"
                    title="Edit Card"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button 
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleDelete(lab.id);
                    }}
                    className="p-2 bg-rose-600 hover:bg-rose-700 rounded-lg text-white transition-all shadow-xs animate-in zoom-in duration-200"
                    title="Delete Card"
                  >
                    <Trash className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>

      </div>

      {/* Add/Edit Modal */}
      {isDialogOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/50 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-md w-full max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center shrink-0">
              <h3 className="text-base font-extrabold text-slate-900">
                {editingLab ? "Edit Facility Card" : "Add Facility Card"}
              </h3>
              <button 
                onClick={() => setIsDialogOpen(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleFormSubmit} className="flex flex-col flex-1 overflow-hidden">
              <div className="p-6 space-y-4 text-left overflow-y-auto flex-1">
                
                {/* Title */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Facility Title
                  </label>
                  <input 
                    type="text" 
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    placeholder="e.g. 3D Printing & Scanning"
                    className="w-full h-10 px-3.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/20 bg-slate-50/50 font-medium"
                    required
                  />
                </div>

                {/* Description */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Description
                  </label>
                  <textarea 
                    value={form.desc}
                    onChange={(e) => setForm({ ...form, desc: e.target.value })}
                    placeholder="Brief details about this workspace facility..."
                    className="w-full min-h-[80px] p-3 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/20 bg-slate-50/50 font-medium resize-none"
                    required
                  />
                </div>

                {/* Navigation Path */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    View Path (Navigation)
                  </label>
                  <input 
                    type="text" 
                    value={form.path}
                    onChange={(e) => setForm({ ...form, path: e.target.value })}
                    placeholder="e.g. /aicte-idea-lab or /machinery"
                    className="w-full h-10 px-3.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/20 bg-slate-50/50 font-medium"
                    required
                  />
                </div>

                {/* Image Source */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                    Choose Image Source
                  </label>
                  
                  {/* Upload Section */}
                  <div className="p-4 bg-slate-50 border border-dashed border-slate-250 rounded-xl space-y-3">
                    <div className="flex items-center gap-3">
                      <label className="cursor-pointer bg-white hover:bg-slate-50 border border-slate-200 shadow-3xs rounded-xl px-4 py-2 text-xs font-bold text-slate-700 flex items-center gap-2 transition-colors">
                        <Upload className="w-3.5 h-3.5 text-primary" />
                        {uploading ? "Uploading..." : "Choose Image File"}
                        <input 
                          type="file" 
                          accept="image/*"
                          onChange={handleFileUpload}
                          className="hidden"
                          disabled={uploading}
                        />
                      </label>
                    </div>
                    
                    <div className="text-[10px] font-bold text-slate-400 text-center uppercase tracking-widest">— OR ENTER DIRECT URL —</div>

                    <input 
                      type="url" 
                      value={form.image}
                      onChange={(e) => setForm({ ...form, image: e.target.value })}
                      placeholder="https://images.unsplash.com/photo-..."
                      className="w-full h-9 px-3 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/20 bg-white font-mono"
                    />
                  </div>
                </div>

                {/* Preview */}
                {form.image && (
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Selected Image Preview:
                    </label>
                    <div className="relative aspect-video rounded-xl overflow-hidden border border-slate-200 bg-slate-50">
                      <img 
                        src={getFullImageUrl(form.image)} 
                        alt="Preview" 
                        className="w-full h-full object-cover" 
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="p-6 pt-4 flex gap-3 border-t border-slate-100 shrink-0">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsDialogOpen(false)}
                  className="flex-1 rounded-xl font-bold h-11 text-slate-600"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={uploading || !form.title || !form.desc || !form.image}
                  className="flex-1 rounded-xl font-bold h-11 bg-primary text-white hover:bg-primary/95"
                >
                  {editingLab ? "Save Changes" : "Add Card"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
};

export default FacilitiesPreview;
