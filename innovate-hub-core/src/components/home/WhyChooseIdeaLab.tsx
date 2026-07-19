import { Award, Cpu, GraduationCap, Microscope, Rocket, Trophy } from "lucide-react";

const features = [
  {
    icon: Award,
    title: "AICTE Supported Facility",
    desc: "National level endorsement and co-funding, aligning with global standards of engineering and technology exposure.",
  },
  {
    icon: Cpu,
    title: "Industry Grade Equipment",
    desc: "Hands-on experience with industrial 3D printers, CNC routers, laser cutters, PCB prototyping, and advanced electronics.",
  },
  {
    icon: GraduationCap,
    title: "Faculty Mentorship",
    desc: "Direct access to expert faculty guides and lab coordinators to assist in research, planning, and manufacturing.",
  },
  {
    icon: Microscope,
    title: "Research Support",
    desc: "Comprehensive resources to support testing, materials analysis, product validation, and academic thesis projects.",
  },
  {
    icon: Rocket,
    title: "Startup Incubation",
    desc: "Integration with the institutional incubation center for intellectual property guidance, networking, and pre-seed mentoring.",
  },
  {
    icon: Trophy,
    title: "Competition Guidance",
    desc: "Track record of mentoring teams for Smart India Hackathon (SIH), national innovation expos, and engineering design contests.",
  },
];

const WhyChooseIdeaLab = () => {
  return (
    <section className="py-20 bg-slate-50 border-b border-slate-200/60">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Heading */}
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
          <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
            Why Choose IDEA Lab?
          </h2>
          <div className="w-12 h-1 bg-primary mx-auto rounded-full" />
          <p className="text-slate-500 text-sm sm:text-base">
            Providing resources, expertise, and guidance to facilitate comprehensive student and researcher innovation.
          </p>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-8 max-w-6xl mx-auto">
          {features.map((feat, idx) => (
            <div
              key={idx}
              className="flex flex-col sm:flex-row gap-3 sm:gap-4 p-4 sm:p-6 bg-white border border-slate-200/80 rounded-2xl shadow-sm hover:shadow-md hover:border-primary/20 transition-all duration-300 group text-center sm:text-left items-center sm:items-start"
            >
              {/* Icon Container */}
              <div className="w-12 h-12 rounded-xl bg-blue-50 text-primary flex items-center justify-center shrink-0 group-hover:bg-primary group-hover:text-white transition-colors duration-300">
                <feat.icon className="w-6 h-6 stroke-[2]" />
              </div>

              {/* Text content */}
              <div className="space-y-1.5">
                <h3 className="text-base font-bold text-slate-900 group-hover:text-primary transition-colors duration-300">
                  {feat.title}
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
                  {feat.desc}
                </p>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
};

export default WhyChooseIdeaLab;
