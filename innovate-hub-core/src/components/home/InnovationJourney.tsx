import { Lightbulb, Hammer, Eye, Trophy, Rocket } from "lucide-react";

const steps = [
  {
    phase: "01",
    icon: Lightbulb,
    title: "Idea Development",
    desc: "Formulate concepts, consult faculty mentors, and draft basic project specifications.",
  },
  {
    phase: "02",
    icon: Hammer,
    title: "Physical Prototyping",
    desc: "Reserve CNC machines, 3D printers, and PCB equipment to fabricate physical components.",
  },
  {
    phase: "03",
    icon: Eye,
    title: "Testing & Validation",
    desc: "Conduct stress testing, circuit debugging, and software integration inside the lab.",
  },
  {
    phase: "04",
    icon: Trophy,
    title: "Expositions & Contests",
    desc: "Showcase prototypes at national platforms, Smart India Hackathons, and project expos.",
  },
  {
    phase: "05",
    icon: Rocket,
    title: "Startup Incubation",
    desc: "File patents, refine business models, and launch startups via institutional incubator support.",
  },
];

const InnovationJourney = () => {
  return (
    <section className="py-20 bg-slate-50 border-b border-slate-200/60">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Heading */}
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
          <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
            The Innovation Journey
          </h2>
          <div className="w-12 h-1 bg-primary mx-auto rounded-full" />
          <p className="text-slate-500 text-sm sm:text-base">
            From raw concept to market-ready product—discover the structured path of development inside the AICTE IDEA Lab.
          </p>
        </div>

        {/* Horizontal Timeline Container */}
        <div className="relative max-w-6xl mx-auto">
          {/* Connector Line for Desktop (hidden on mobile/tablet) */}
          <div className="absolute top-[38px] left-[5%] right-[5%] h-0.5 bg-slate-200 hidden lg:block -z-10" />

          {/* Steps Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
            {steps.map((step, idx) => (
              <div key={idx} className="flex flex-col items-center text-center space-y-4 group">
                
                {/* Stepper Dot & Icon */}
                <div className="relative">
                  <div className="w-16 h-16 rounded-full bg-white border-2 border-slate-200 flex items-center justify-center shadow-xs text-slate-400 group-hover:border-primary group-hover:text-primary transition-all duration-300 relative z-10">
                    <step.icon className="w-7 h-7 stroke-[1.5]" />
                  </div>
                  
                  {/* Step number badge */}
                  <span className="absolute -top-1 -right-1 bg-blue-600 text-white font-bold text-[10px] w-5 h-5 rounded-full flex items-center justify-center border-2 border-white shadow-xs">
                    {step.phase}
                  </span>
                </div>

                {/* Details */}
                <div className="space-y-1.5 px-4">
                  <h3 className="text-base font-bold text-slate-900 group-hover:text-primary transition-colors duration-300">
                    {step.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                    {step.desc}
                  </p>
                </div>

                {/* Arrow indicator between elements (mobile/tablet only) */}
                {idx < steps.length - 1 && (
                  <div className="text-slate-300 text-lg font-bold block lg:hidden my-2">
                    ➔
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

      </div>
    </section>
  );
};

export default InnovationJourney;
