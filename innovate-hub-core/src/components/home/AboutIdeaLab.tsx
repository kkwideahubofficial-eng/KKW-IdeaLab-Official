import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Check, Pencil, Trash, Upload, X } from "lucide-react";
import api from "@/lib/axios";

const AboutIdeaLab = () => {
  const [isCoordinator, setIsCoordinator] = useState(false);
  const [imageUrl, setImageUrl] = useState("/images/idea-lab.jpg");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [newImageUrl, setNewImageUrl] = useState("");

  const points = [
    { title: "Machine Booking", desc: "Digital slot scheduling for high-precision tooling equipment." },
    { title: "Material Inventory", desc: "Live consumable stock tracking for prototyping supplies." },
    { title: "Event Management", desc: "Schedule and registration portal for bootcamps and workshops." },
    { title: "Achievement Tracking", desc: "Showcase area celebrating successful student creations and research." }
  ];

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

    // Load custom image
    const customImg = localStorage.getItem("idea_hub_about_image");
    if (customImg) {
      setImageUrl(customImg);
    }
  }, []);

  const getFullImageUrl = (imagePath: string) => {
    if (!imagePath) return "";
    if (imagePath.startsWith("http://") || imagePath.startsWith("https://") || imagePath.startsWith("data:") || imagePath.startsWith("/images/")) {
      return imagePath;
    }
    const baseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";
    return `${baseUrl}/${imagePath}`;
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
        setNewImageUrl(res.data.url);
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
    if (!newImageUrl) return;
    localStorage.setItem("idea_hub_about_image", newImageUrl);
    setImageUrl(newImageUrl);
    setIsDialogOpen(false);
  };

  const handleResetImage = () => {
    if (window.confirm("Are you sure you want to reset this section image to the default image?")) {
      localStorage.removeItem("idea_hub_about_image");
      setImageUrl("/images/idea-lab.jpg");
    }
  };

  return (
    <section className="py-20 bg-slate-50 border-y border-slate-200/60">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Left Column: Image with Dark Overlay */}
          <div className="lg:col-span-6 relative rounded-3xl overflow-hidden shadow-xl border border-slate-200 bg-slate-900 aspect-[16/10] group">
            <img 
              src={getFullImageUrl(imageUrl)}
              alt="Students collaborating inside the AICTE IDEA Lab"
              className="w-full h-full object-cover opacity-80 group-hover:scale-105 transition-transform duration-700 ease-out"
              loading="lazy"
            />
            {/* Dark gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/50 via-slate-950/10 to-transparent pointer-events-none" />
            
            {/* Small glassmorphic stats badge in image */}
            <div className="absolute bottom-6 left-6 p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 text-white shadow-lg space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-widest text-blue-300">Co-funded by</span>
              <p className="text-sm font-extrabold leading-tight">AICTE & KKWIEER</p>
            </div>

            {/* Coordinator Edit/Delete Overlays */}
            {isCoordinator && (
              <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-20">
                <button 
                  onClick={() => {
                    setNewImageUrl(imageUrl);
                    setIsDialogOpen(true);
                  }}
                  className="p-2.5 bg-white/90 backdrop-blur-xs hover:bg-white rounded-xl text-slate-700 hover:text-primary transition-all border border-slate-200/60 shadow-md flex items-center gap-1.5 text-xs font-bold"
                  title="Update Image"
                >
                  <Pencil className="w-3.5 h-3.5" /> Edit Image
                </button>
                {imageUrl !== "/images/idea-lab.jpg" && (
                  <button 
                    onClick={handleResetImage}
                    className="p-2.5 bg-rose-600 hover:bg-rose-700 rounded-xl text-white transition-all shadow-md flex items-center gap-1.5 text-xs font-bold"
                    title="Reset to Default Image"
                  >
                    <Trash className="w-3.5 h-3.5" /> Reset
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Right Column: Text Information */}
          <div className="lg:col-span-6 space-y-6">
            <div className="space-y-3">
              <span className="text-xs font-bold text-primary uppercase tracking-widest bg-blue-50 px-3 py-1 rounded-full">
                AICTE Flagship Initiative
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
                AICTE IDEA Lab
              </h2>
              <p className="text-lg font-bold text-slate-900">
                Innovation starts with access to the right tools.
              </p>
              <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
                The IDEA (Idea Development, Evaluation and Application) Lab at KKWIEER provides students, researchers, and entrepreneurs a collaborative space to design and fabricate physical prototypes, moving from concept to physical creation under one roof.
              </p>
            </div>

            {/* Checklist */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              {points.map((pt, idx) => (
                <div key={idx} className="flex gap-3 items-start">
                  <div className="w-5 h-5 rounded-full bg-blue-50 text-primary flex items-center justify-center shrink-0 mt-0.5">
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">{pt.title}</h4>
                    <p className="text-xs text-slate-500 font-medium mt-1 leading-relaxed">{pt.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* CTA button */}
            <div className="pt-4 flex flex-wrap gap-4">
              <Link to="/aicte-idea-lab">
                <Button className="bg-primary hover:bg-primary/90 text-white font-bold rounded-xl px-6 py-3 shadow-md transition-all">
                  Explore Facilities
                </Button>
              </Link>
              <Link to="/book-slots">
                <Button variant="outline" className="border-slate-200 hover:bg-slate-100 rounded-xl px-6 py-3 text-slate-700 font-semibold transition-colors">
                  Reserve Workspace
                </Button>
              </Link>
            </div>

          </div>

        </div>
      </div>

      {/* Update Image Modal */}
      {isDialogOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-md w-full max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center shrink-0">
              <h3 className="text-base font-extrabold text-slate-900">
                Update Section Image
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
                      value={newImageUrl}
                      onChange={(e) => setNewImageUrl(e.target.value)}
                      placeholder="https://images.unsplash.com/photo-..."
                      className="w-full h-9 px-3 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/20 bg-white font-mono"
                      required
                    />
                  </div>
                </div>

                {/* Preview */}
                {newImageUrl && (
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Selected Image Preview:
                    </label>
                    <div className="relative aspect-video rounded-xl overflow-hidden border border-slate-200 bg-slate-50">
                      <img 
                        src={getFullImageUrl(newImageUrl)} 
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
                  disabled={uploading || !newImageUrl}
                  className="flex-1 rounded-xl font-bold h-11 bg-primary text-white hover:bg-primary/95"
                >
                  Save Image
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
};

export default AboutIdeaLab;
