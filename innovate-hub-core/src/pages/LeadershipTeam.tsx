import { Mail, Phone, Award } from "lucide-react";

const LeadershipTeam = () => {
  // Main Coordinators
  const coordinators = [
    {
      name: "Dr. Keshav N. Nandurkar",
      role: "Chief Mentor, AICTE-IDEA Lab",
      designation: "Principal",
      dept: "K. K. Wagh Institute of Engineering Education and Research",
      email: "knnandurkar@kkwagh.edu.in",
    },
    {
      name: "Dr. Ravindra K. Munje",
      role: "Coordinator, AICTE-IDEA Lab",
      designation: "Professor and I/C Head",
      dept: "Electrical Department",
      email: "rkmunje@kkwagh.edu.in",
      tel: "+91 253 2221211 (Office)"
    },
    {
      name: "Dr. Padmakar J. Pawar",
      role: "Co-coordinator, AICTE-IDEA Lab",
      designation: "Professor and Head",
      dept: "Robotics & Automation & Production Department",
      email: "pjpawar@kkwagh.edu.in",
      tel: "+91 253 2221251 (Office)"
    }
  ];

  const principal = coordinators[0];
  const activeCoordinators = coordinators.slice(1);

  return (
    <div className="min-h-screen bg-slate-50/50 font-sans text-slate-800 antialiased overflow-x-hidden pb-24">
      
      {/* Header Banner */}
      <section className="relative w-full py-16 lg:py-20 bg-gradient-to-r from-primary to-blue-700 text-white shadow-xl overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.08),transparent)] pointer-events-none" />
        <div className="max-w-[1200px] mx-auto px-6 lg:px-8 relative z-10">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-xs font-semibold uppercase tracking-wider">
              <Award className="w-4 h-4 text-amber-300" />
              Administrative Steering Committee
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-tight">
              Leadership Team
            </h1>
            <p className="text-base sm:text-lg text-indigo-100 max-w-3xl leading-relaxed">
              Meet the coordinators steering the innovation ecosystem at AICTE-IDEA Lab.
            </p>
          </div>
        </div>
      </section>

      <div className="max-w-[1200px] mx-auto px-6 lg:px-8 py-12 md:py-16 space-y-16">
        
        {/* Row 1: Principal (Chief Mentor) - Centered layout */}
        <div className="flex flex-col md:flex-row items-center justify-center gap-6 md:gap-8 max-w-2xl mx-auto p-8 bg-white rounded-3xl border border-slate-200/80 shadow-md">
          {/* Photo */}
          <div className="w-32 h-36 flex-shrink-0 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-inner">
            <img 
              src="/images/nandurkar_sir.png" 
              alt={principal.name} 
              className="w-full h-full object-cover"
            />
          </div>
          {/* Details */}
          <div className="text-center md:text-left space-y-2">
            <h2 className="text-xl md:text-2xl font-bold text-slate-950">
              {principal.name}
            </h2>
            <p className="text-sm font-semibold text-primary">
              {principal.role}
            </p>
            <p className="text-sm text-slate-600">
              {principal.designation},
            </p>
            <p className="text-xs sm:text-sm text-slate-500 font-medium leading-relaxed">
              {principal.dept}
            </p>
          </div>
        </div>

        {/* Row 2: Coordinators - Side-by-side */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-12 max-w-5xl mx-auto pt-6">
          {activeCoordinators.map((member, idx) => (
            <div key={idx} className="flex flex-col sm:flex-row items-center sm:items-start gap-6 p-6 bg-white rounded-3xl border border-slate-200/80 shadow-md">
              {/* Photo */}
              <div className="w-32 h-36 flex-shrink-0 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-inner">
                <img 
                  src={idx === 0 ? "/images/munje_sir.png" : "/images/pawar_sir.png"} 
                  alt={member.name} 
                  className="w-full h-full object-cover"
                />
              </div>
              {/* Details */}
              <div className="text-center sm:text-left space-y-2.5 flex-1">
                <h3 className="text-lg md:text-xl font-bold text-slate-950">
                  {member.name}
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-medium">
                  {member.role}, {member.designation}, {member.dept}
                </p>
                
                <div className="pt-2 border-t border-slate-200/60 space-y-1 text-xs text-slate-500 font-medium">
                  <div className="flex items-center justify-center sm:justify-start gap-2">
                    <Mail className="w-3.5 h-3.5 text-primary shrink-0" />
                    <span>Email ID: </span>
                    <a href={`mailto:${member.email}`} className="text-primary hover:underline">
                      {member.email}
                    </a>
                  </div>
                  {member.tel && (
                    <div className="flex items-center justify-center sm:justify-start gap-2">
                      <Phone className="w-3.5 h-3.5 text-primary shrink-0" />
                      <span>Tel. {member.tel}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
};

export default LeadershipTeam;
