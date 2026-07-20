import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Lightbulb, Target, Eye, Cpu, Printer, Microscope, Zap, Wifi, Users, ArrowRight } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader } from "@/components/ui/dialog";
import api from "@/lib/axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { ReadMore } from "@/components/ReadMore";
import { Link } from "react-router-dom";

const LabInfo = () => {
  const facilities = [
    {
      icon: Cpu,
      name: "High-Performance Computing",
      description: "State-of-the-art servers and workstations for AI/ML research",
    },
    {
      icon: Printer,
      name: "3D Printing & Fabrication",
      description: "Multiple 3D printers and CNC machines for rapid prototyping",
    },
    {
      icon: Microscope,
      name: "Electronics Lab",
      description: "Complete electronics workbench with testing equipment",
    },
    {
      icon: Zap,
      name: "IoT Development Suite",
      description: "Arduino, Raspberry Pi, and sensor kits for IoT projects",
    },
    {
      icon: Wifi,
      name: "High-Speed Connectivity",
      description: "Gigabit internet and dedicated network infrastructure",
    },
    {
      icon: Users,
      name: "Collaboration Spaces",
      description: "Meeting rooms and brainstorming areas for team work",
    },
  ];

  const [machines, setMachines] = useState<{ _id: string; name: string; summary?: string; details?: string; imageUrl?: string; }[]>([]);
  const [loadingMachines, setLoadingMachines] = useState(true);
  const [openAdd, setOpenAdd] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', summary: '', details: '', imageUrl: '' });
  const user = useMemo(() => {
    try {
      const raw = localStorage.getItem('idea_hub_user');
      const token = localStorage.getItem('idea_hub_token');
      if (!raw || !token) return null;
      return JSON.parse(raw);
    } catch { return null; }
  }, []);
  const isCoordinator = user?.role === 'coordinator';

  useEffect(() => {
    const fetchMachines = async () => {
      try {
        const res = await api.get('/machines');
        setMachines(res.data);
      } catch { /* ignore */ }
      finally { setLoadingMachines(false); }
    };
    fetchMachines();
  }, []);

  const [open, setOpen] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);

  const handlePreview = (src: string) => {
    setPreview(src);
    setOpen(true);
  };

  const startEdit = (machine: any) => {
    setEditingId(machine._id);
    setForm({
      name: machine.name,
      summary: machine.summary || '',
      details: machine.details || '',
      imageUrl: machine.imageUrl || ''
    });
    setOpenAdd(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const fd = new FormData();
      fd.append('name', form.name);
      if (form.summary) fd.append('summary', form.summary);
      if (form.details) fd.append('details', form.details);
      if (form.imageUrl) fd.append('imageUrl', form.imageUrl);
      const fileInput = document.getElementById('machine-image') as HTMLInputElement | null;
      if (fileInput?.files && fileInput.files[0]) fd.append('image', fileInput.files[0]);

      if (editingId) {
        const res = await api.put(`/machines/${editingId}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
        setMachines(machines.map(m => m._id === editingId ? res.data : m));
        toast.success('Machine updated');
      } else {
        const res = await api.post('/machines', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
        setMachines([res.data, ...machines]);
        toast.success('Machine added');
      }
      setOpenAdd(false);
      setForm({ name: '', summary: '', details: '', imageUrl: '' });
      setEditingId(null);
    } catch { 
      toast.error(editingId ? 'Failed to update machine' : 'Failed to add machine'); 
    }
  };

  return (
    <div className="min-h-screen bg-background font-sans">
      {/* Hero Section */}
      <section className="relative py-24 sm:py-32 bg-gradient-to-b from-blue-50/50 via-white to-white overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&q=80')] bg-cover bg-center opacity-[0.03]"></div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-foreground tracking-tight mb-6 leading-tight">
              About <span className="text-primary">AICTE IDEA Lab</span>
            </h1>
            <p className="text-lg sm:text-xl text-muted-foreground font-light leading-relaxed max-w-2xl mx-auto">
              A state-of-the-art innovation laboratory dedicated to fostering creativity, 
              collaboration, and cutting-edge research.
            </p>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 pb-20 space-y-24">
        {/* Vision & Mission */}
        <section className="grid md:grid-cols-2 gap-8 lg:gap-12">
          <Card className="h-full border-none shadow-[0_4px_20px_rgba(0,0,0,0.05)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.08)] transition-all duration-300 rounded-2xl bg-white overflow-hidden group">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-4 mb-2">
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <Eye className="w-6 h-6 text-primary" />
                </div>
                <CardTitle className="text-2xl font-bold text-foreground">Our Vision</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground leading-relaxed text-base">
                To be a leading innovation hub that empowers students, researchers, and entrepreneurs 
                to transform groundbreaking ideas into impactful solutions that address real-world challenges 
                and drive technological advancement.
              </p>
            </CardContent>
          </Card>

          <Card className="h-full border-none shadow-[0_4px_20px_rgba(0,0,0,0.05)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.08)] transition-all duration-300 rounded-2xl bg-white overflow-hidden group">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-4 mb-2">
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <Target className="w-6 h-6 text-primary" />
                </div>
                <CardTitle className="text-2xl font-bold text-foreground">Our Mission</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground leading-relaxed text-base">
                To provide world-class facilities, mentorship, and resources that enable innovators 
                to experiment, prototype, and launch their ideas. We foster a collaborative ecosystem 
                where creativity meets technology to solve tomorrow's problems today.
              </p>
            </CardContent>
          </Card>
        </section>

        {/* Facilities Section */}
        <section>
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-4">World-Class Facilities</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Access the tools and spaces you need to bring your innovations to life.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {facilities.map((facility, index) => (
              <Card key={index} className="border border-border/40 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 rounded-xl bg-card overflow-hidden group">
                <CardContent className="p-6 sm:p-8 flex flex-col items-start h-full">
                  <div className="w-12 h-12 bg-primary/5 rounded-lg flex items-center justify-center mb-6 group-hover:bg-primary/10 transition-colors">
                    <facility.icon className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-bold text-foreground mb-3 group-hover:text-primary transition-colors">
                    {facility.name}
                  </h3>
                  <p className="text-muted-foreground text-sm leading-relaxed line-clamp-3">
                    {facility.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
          
          {/* CTA Button */}
          <div className="mt-12 text-center">
            <Link to="/book-slots">
               <Button size="lg" className="rounded-full px-8 shadow-lg hover:shadow-xl transition-all">
                  Explore & Book Facilities
                  <ArrowRight className="ml-2 w-4 h-4" />
               </Button>
            </Link>
          </div>
        </section>

        {/* Machines Section */}
        <section>
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-bold text-foreground">Featured Equipment</h2>
            {isCoordinator && (
              <Button onClick={() => { setEditingId(null); setForm({ name: '', summary: '', details: '', imageUrl: '' }); setOpenAdd(true); }}>
                Add Machine
              </Button>
            )}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {loadingMachines ? (
              <div className="col-span-full py-12 text-center text-muted-foreground">Loading equipment data...</div>
            ) : machines.length === 0 ? (
              <div className="col-span-full py-12 text-center bg-muted/30 rounded-xl border border-dashed border-muted-foreground/20">
                <p className="text-muted-foreground">No machines listed yet.</p>
                {isCoordinator && <Button variant="link" className="mt-2" onClick={() => setOpenAdd(true)}>Add your first machine</Button>}
              </div>
            ) : machines.map((m) => (
              <Card key={m._id} className="border border-border/50 shadow-sm hover:shadow-lg transition-all duration-300 rounded-xl overflow-hidden flex flex-col h-full bg-card">
                <div className="relative aspect-video overflow-hidden">
                   {m.imageUrl ? (
                    <img
                      src={m.imageUrl}
                      alt={m.name}
                      className="w-full h-full object-cover transition-transform duration-500 hover:scale-105 cursor-pointer"
                      onClick={() => handlePreview(m.imageUrl!)}
                    />
                  ) : (
                    <div className="w-full h-full bg-muted flex items-center justify-center text-muted-foreground">
                      <Cpu className="w-12 h-12 opacity-20" />
                    </div>
                  )}
                </div>
                
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg font-bold">{m.name}</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col flex-1 pt-0">
                  <p className="text-sm text-muted-foreground mb-4 line-clamp-2 min-h-[2.5rem]">{m.summary}</p>
                  
                  <div className="flex-1 mt-auto">
                     <ReadMore text={m.details || ''} limit={60} />
                  </div>

                  {isCoordinator && (
                    <div className="mt-4 pt-4 border-t flex justify-end gap-2">
                       <Button variant="outline" size="sm" onClick={() => startEdit(m)}>Edit</Button>
                      <Button variant="destructive" size="sm" onClick={async () => {
                        if (!confirm('Delete this machine?')) return;
                        try {
                          await api.delete(`/machines/${m._id}`);
                          setMachines(machines.filter((x) => x._id !== m._id));
                          toast.success('Machine deleted');
                        } catch { toast.error('Failed to delete'); }
                      }}>Delete</Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* About the Lab Text Content */}
        <section className="max-w-4xl mx-auto">
          <Card className="border-none shadow-none bg-transparent">
             <div className="space-y-6 text-lg text-muted-foreground leading-relaxed text-center">
              <p>
                <strong className="text-foreground">AICTE IDEA Lab</strong> is a premier innovation laboratory established to bridge the gap between 
                theoretical knowledge and practical application. Our 5,000 square foot facility houses 
                cutting-edge equipment and technology that enables students, faculty, and external 
                collaborators to bring their innovative concepts to life.
              </p>
              <p>
                Since our inception, we have supported over <strong className="text-primary">500+ projects</strong> across diverse domains including 
                artificial intelligence, robotics, IoT, sustainable technology, healthcare innovation, 
                and social entrepreneurship.
              </p>
             </div>
             
             <div className="grid grid-cols-3 gap-8 mt-12 border-t border-border/40 pt-12">
                <div className="text-center">
                  <div className="text-4xl font-extrabold text-primary mb-2">24/7</div>
                  <div className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Access Available</div>
                </div>
                <div className="text-center">
                  <div className="text-4xl font-extrabold text-primary mb-2">500+</div>
                  <div className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Projects Supported</div>
                </div>
                <div className="text-center">
                  <div className="text-4xl font-extrabold text-primary mb-2">50+</div>
                  <div className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Expert Mentors</div>
                </div>
             </div>
          </Card>
        </section>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="p-0 max-w-3xl bg-transparent border-none shadow-none">
          {preview ? <img src={preview} alt="Preview" className="w-full h-auto rounded-lg shadow-2xl" /> : null}
        </DialogContent>
      </Dialog>

      <Dialog open={openAdd} onOpenChange={(val) => { if (!val) { setEditingId(null); setForm({ name: '', summary: '', details: '', imageUrl: '' }); } setOpenAdd(val); }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <CardTitle>{editingId ? "Edit Machine" : "Add Machine"}</CardTitle>
          </DialogHeader>
          <form onSubmit={handleFormSubmit} className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="mname">Name</Label>
              <Input id="mname" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required placeholder="e.g. 3D Printer" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="msummary">Summary (Short Description)</Label>
              <Input id="msummary" value={form.summary} onChange={(e) => setForm({ ...form, summary: e.target.value })} placeholder="Brief overview..." />
            </div>
            <div className="space-y-2">
              <Label htmlFor="mdetails">Full Details</Label>
              <Textarea id="mdetails" value={form.details} onChange={(e) => setForm({ ...form, details: e.target.value })} placeholder="Detailed specifications..." className="min-h-[100px]" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="machine-image">Upload Image</Label>
                <Input id="machine-image" type="file" accept="image/*" className="cursor-pointer" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="mimageUrl">Or Image URL</Label>
                <Input id="mimageUrl" value={form.imageUrl} onChange={(e) => setForm({ ...form, imageUrl: e.target.value })} placeholder="https://..." />
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-4">
               <Button type="button" variant="ghost" onClick={() => setOpenAdd(false)}>Cancel</Button>
               <Button type="submit">{editingId ? "Update Machine" : "Add Machine"}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default LabInfo;
