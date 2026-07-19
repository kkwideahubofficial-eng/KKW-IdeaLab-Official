import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

const CtaBanner = () => {
  return (
    <section className="py-20 bg-slate-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-5xl">
        <div className="relative rounded-3xl bg-slate-900 border border-slate-800 shadow-xl overflow-hidden">
          
          {/* Subtle background glow */}
          <div className="absolute top-0 right-0 w-80 h-80 rounded-full bg-blue-600/10 blur-[80px] pointer-events-none" />
          
          <div className="grid grid-cols-1 lg:grid-cols-12 items-stretch">
            {/* Left Content */}
            <div className="lg:col-span-7 p-8 sm:p-12 flex flex-col justify-center space-y-6 text-white">
              <span className="text-xs font-bold text-blue-400 uppercase tracking-widest">
                Ready to Start Your Innovation Journey?
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight leading-tight">
                Have an Idea? Let's Build It.
              </h2>
              <p className="text-sm sm:text-base text-slate-400 leading-relaxed max-w-md">
                Get access to industrial-grade fabrication machinery, dedicated research mentors, testing benches, and startup incubation resources under one roof.
              </p>
              
              <div className="flex flex-wrap gap-4 pt-2">
                <Link to="/book-slots">
                  <Button size="lg" className="bg-primary hover:bg-primary/95 text-white font-bold rounded-xl px-6 py-4 shadow-lg transition-transform hover:scale-[1.02]">
                    Book a Slot <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
                <Link to="/aicte-idea-lab">
                  <Button size="lg" variant="outline" className="border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800 font-bold rounded-xl px-6 py-4">
                    Explore Facilities
                  </Button>
                </Link>
              </div>
            </div>

            {/* Right Side: Image/Graphic */}
            <div className="lg:col-span-5 relative min-h-[240px] lg:min-h-0 bg-slate-950">
              <img 
                src="https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&q=80&w=800" 
                alt="CNC Milling Machine and Engineer workspace" 
                className="absolute inset-0 w-full h-full object-cover opacity-60"
                loading="lazy"
              />
              {/* Fade to Slate 900 gradient on the left (for desktop layout) */}
              <div className="absolute inset-0 bg-gradient-to-t lg:bg-gradient-to-r from-slate-900 via-transparent to-transparent pointer-events-none" />
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};

export default CtaBanner;
