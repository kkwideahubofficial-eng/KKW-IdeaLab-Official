import { Link } from "react-router-dom";
import { ArrowRight, Mail } from "lucide-react";

const coordinators = [
  {
    name: "Dr. Keshav N. Nandurkar",
    role: "Chief Mentor, AICTE-IDEA Lab",
    designation: "Principal",
    image: "/images/nandurkar_sir.png",
    email: "knnandurkar@kkwagh.edu.in",
  },
  {
    name: "Dr. Ravindra K. Munje",
    role: "Coordinator, AICTE-IDEA Lab",
    designation: "Professor & I/C Head",
    image: "/images/munje_sir.png",
    email: "rkmunje@kkwagh.edu.in",
  },
  {
    name: "Dr. Padmakar J. Pawar",
    role: "Co-coordinator, AICTE-IDEA Lab",
    designation: "Professor & Head",
    image: "/images/pawar_sir.png",
    email: "pjpawar@kkwagh.edu.in",
  },
];

const LeadershipPreview = () => {
  return (
    <section className="py-20 bg-white border-b border-slate-200/60">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Heading */}
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
          <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
            Lab Steering & Leadership
          </h2>
          <div className="w-12 h-1 bg-primary mx-auto rounded-full" />
          <p className="text-slate-500 text-sm sm:text-base">
            Governed by dedicated academic coordinators overseeing resource scheduling, budgeting, and project execution.
          </p>
        </div>

        {/* Steering Committee Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-8 max-w-5xl mx-auto">
          {coordinators.map((coordinator, idx) => (
            <div 
              key={idx}
              className={`flex flex-col items-center text-center p-4 sm:p-6 bg-slate-50 border border-slate-200/80 rounded-2xl shadow-xs hover:shadow-md hover:border-primary/20 transition-all duration-300 group ${
                idx === coordinators.length - 1 ? "col-span-2 lg:col-span-1" : ""
              }`}
            >
              {/* Photo Frame */}
              <div className="w-28 h-32 rounded-xl overflow-hidden border border-slate-200 bg-white shadow-inner mb-4 flex-shrink-0">
                <img 
                  src={coordinator.image} 
                  alt={coordinator.name} 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </div>

              {/* Coordinator Info */}
              <div className="space-y-1">
                <h3 className="text-base font-bold text-slate-900 group-hover:text-primary transition-colors">
                  {coordinator.name}
                </h3>
                <p className="text-xs font-bold text-blue-600">
                  {coordinator.role}
                </p>
                <p className="text-xs text-slate-400">
                  {coordinator.designation}
                </p>
              </div>

              {/* Quick Contact */}
              <div className="pt-4 mt-4 border-t border-slate-200/60 w-full flex items-center justify-center text-xs text-slate-500 gap-1.5 font-medium">
                <Mail className="w-3.5 h-3.5 text-primary shrink-0" />
                <a 
                  href={`mailto:${coordinator.email}`} 
                  className="hover:text-primary hover:underline truncate max-w-[180px]"
                >
                  {coordinator.email}
                </a>
              </div>
            </div>
          ))}
        </div>

        {/* View All steering committee link */}
        <div className="text-center mt-12">
          <Link 
            to="/leadership-team"
            className="inline-flex items-center gap-1.5 text-sm font-bold text-primary hover:underline group"
          >
            View Steering Committee Details
            <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
          </Link>
        </div>

      </div>
    </section>
  );
};

export default LeadershipPreview;
