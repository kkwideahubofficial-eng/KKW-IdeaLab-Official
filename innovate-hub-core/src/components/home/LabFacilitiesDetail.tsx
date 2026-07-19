import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import api from "@/lib/axios";

interface Machine {
  _id: string;
  name: string;
  description: string;
  imageUrl?: string;
  isAvailable: boolean;
}

const mockMachines: Machine[] = [
  {
    _id: "mock1",
    name: "Industrial FDM 3D Printer",
    description: "Dual-extruder high-temperature 3D printer for ABS, Nylon, and carbon fiber composites.",
    isAvailable: true,
  },
  {
    _id: "mock2",
    name: "Precision CNC Milling Router",
    description: "3-axis high-speed milling machine for soft metals, plastics, and wood prototyping.",
    isAvailable: false,
  },
  {
    _id: "mock3",
    name: "CO2 Laser Cutter & Engraver",
    description: "100W precision laser system for acrylic sheet cutting, fabric patterns, and vector engraving.",
    isAvailable: true,
  },
  {
    _id: "mock4",
    name: "PCB Dry Etching & Drilling Machine",
    description: "Automated PCB trace routing, drilling, and multi-layer alignment station.",
    isAvailable: true,
  },
  {
    _id: "mock5",
    name: "Robotic Workbench & Logic Analyzers",
    description: "Equipped with multi-channel digital logic analyzers, signal generators, and motor testing rigs.",
    isAvailable: false,
  },
  {
    _id: "mock6",
    name: "IoT Smart Gateway Testbed",
    description: "Environmental chamber and multi-protocol network nodes for LoRaWAN, Zigbee, and WiFi testing.",
    isAvailable: true,
  },
];

const LabFacilitiesDetail = () => {
  const [machines, setMachines] = useState<Machine[]>(mockMachines);

  useEffect(() => {
    const fetchMachines = async () => {
      try {
        const res = await api.get("/machinery");
        if (res.data && res.data.length > 0) {
          const formatted = res.data.map((m: any) => ({
            _id: m._id,
            name: m.name,
            description: m.description,
            imageUrl: m.imageUrl,
            isAvailable: m.isAvailable ?? true,
          }));
          setMachines(formatted);
        }
      } catch (err) {
        console.warn("Unable to fetch live machinery status, using fallback data.");
      }
    };
    fetchMachines();
  }, []);

  return (
    <section className="py-12 bg-white border-b border-slate-200/60">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-10 space-y-2">
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
            Lab Machinery & Availability
          </h2>
          <div className="w-12 h-1 bg-primary mx-auto rounded-full" />
          <p className="text-slate-500 text-xs sm:text-sm">
            Check the real-time operational status of core fabrication and testing equipment before scheduling your work.
          </p>
        </div>

        {/* Machinery Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {machines.slice(0, 3).map((machine) => (
            <div 
              key={machine._id}
              className="flex flex-col justify-between p-5 bg-slate-50 border border-slate-200/80 rounded-2xl shadow-xs hover:shadow-md hover:border-primary/20 transition-all duration-300 group"
            >
              <div className="space-y-3">
                {/* Header Row & Title */}
                <div className="flex items-center gap-3">
                  <div className="p-1.5 rounded-lg bg-blue-50 text-primary group-hover:bg-primary group-hover:text-white transition-colors duration-300 shrink-0">
                    <Settings className="w-4 h-4 stroke-[2]" />
                  </div>
                  <h3 className="text-sm sm:text-base font-bold text-slate-900 group-hover:text-primary transition-colors duration-300 line-clamp-1">
                    {machine.name}
                  </h3>
                </div>

                {/* Details */}
                <p className="text-xs sm:text-sm text-slate-500 leading-relaxed line-clamp-2">
                  {machine.description}
                </p>
              </div>

              {/* Action Link (Text Only) */}
              <div className="pt-4 mt-4 border-t border-slate-200/60">
                <Link 
                  to="/machinery"
                  className="inline-flex items-center gap-1 text-xs font-bold text-primary group-hover:underline"
                >
                  View Details
                  <ArrowRight className="w-3.5 h-3.5 transition-transform duration-300 group-hover:translate-x-0.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>

        {/* View All Button */}
        {machines.length > 3 && (
          <div className="text-center mt-8">
            <Link to="/machinery">
              <Button className="bg-primary hover:bg-primary/95 text-white font-bold rounded-xl px-5 py-2.5 text-xs shadow-md transition-all">
                View All Machinery ({machines.length})
              </Button>
            </Link>
          </div>
        )}

      </div>
    </section>
  );
};

export default LabFacilitiesDetail;
